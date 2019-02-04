import { END, ESC, END_ESC_SEQ, ESC_ESC_SEQ } from './constants'

export const encodeMessage = (data: Buffer) => {
  let remainingPacket = data
  let endPosition = remainingPacket.indexOf(END)
  let escPosition = remainingPacket.indexOf(ESC)
  const parts: Buffer[] = []
  while (endPosition > -1 || escPosition > -1) {
    const nextSlice = Math.min(endPosition === -1 ? Infinity : endPosition, escPosition === -1 ? Infinity : escPosition)
    const part = remainingPacket.slice(0, nextSlice)
    const escapeSeq = nextSlice === endPosition ? END_ESC_SEQ : ESC_ESC_SEQ
    parts.push(part, escapeSeq)
    remainingPacket = remainingPacket.slice(nextSlice + 1)

    // find the next thing to escape
    if (nextSlice === endPosition) {
      endPosition = remainingPacket.indexOf(END)
      escPosition = escPosition === -1 ? -1 : escPosition - (part.length + 1)
    } else {
      endPosition = endPosition === -1 ? -1 : endPosition - (part.length + 1)
      escPosition = remainingPacket.indexOf(ESC)
    }
  }
  parts.push(remainingPacket, END)
  return Buffer.concat(parts)
}

async function* _asyncEncode(iterable: AsyncIterable<Buffer>): AsyncIterableIterator<Buffer> {
  for await (const data of iterable) {
    yield encodeMessage(data)
  }
}

function* _syncEncode(iterable: Iterable<Buffer>): IterableIterator<Buffer> {
  for (const data of iterable) {
    yield encodeMessage(data)
  }
}

export function encode(iterable: AsyncIterable<Buffer>): AsyncIterableIterator<Buffer>
export function encode(iterable: Iterable<Buffer>): IterableIterator<Buffer>
export function encode(iterable: Iterable<Buffer> | AsyncIterable<Buffer>) {
  if (iterable[Symbol.asyncIterator]) {
    return _asyncEncode(iterable as AsyncIterable<Buffer>)
  }
  return _syncEncode(iterable as Iterable<Buffer>)
}
