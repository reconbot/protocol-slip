import BufferList from 'bl'
import { END_BUFFER, END_ESC_SEQ, ESC_ESC_SEQ, ESC_BUFFER } from './constants'

export const decodePacket = (packet: BufferList): Buffer => {
  const decodedPacket = new BufferList()
  let endPosition = packet.indexOf(END_ESC_SEQ)
  let escPosition = packet.indexOf(ESC_ESC_SEQ)
  let remainingPacket = packet
  if (escPosition > -1 || endPosition > -1) {
    const nextSlice = Math.min(endPosition === -1 ? Infinity : endPosition, escPosition === -1 ? Infinity : escPosition)
    const part = nextSlice === 0 ? new BufferList() : remainingPacket.shallowSlice(0, nextSlice)
    const escapedByte = nextSlice === endPosition ? END_BUFFER : ESC_BUFFER
    decodedPacket.append(part)
    decodedPacket.append(escapedByte)
    remainingPacket = remainingPacket.shallowSlice(nextSlice + 2)

    // find the next thing to escape
    if (nextSlice === endPosition) {
      endPosition = remainingPacket.indexOf(END_BUFFER)
      escPosition = escPosition - (part.length + 1)
    } else {
      endPosition = endPosition - (part.length + 1)
      escPosition = remainingPacket.indexOf(ESC_BUFFER)
    }
  }
  decodedPacket.append(remainingPacket)
  return decodedPacket.slice()
}

async function* _asyncDecode(iterable: AsyncIterable<Buffer>) {
  let buffer = new BufferList()
  for await (const data of iterable) {
    // search new data for the END byte
    const dataEndPosition = data.indexOf(END_BUFFER)
    let endPosition = dataEndPosition === -1 ? -1 : buffer.length + dataEndPosition
    buffer.append(data)
    // emit any packets we have
    while (endPosition > -1) {
      const packet = endPosition === 0 ? new BufferList() : buffer.shallowSlice(0, endPosition)
      if (packet.length > 0) {
        yield decodePacket(packet)
      }
      buffer = buffer.shallowSlice(endPosition + 1)
      endPosition = buffer.indexOf(END_BUFFER)
    }
  }
  if (buffer.length > 0) {
    yield decodePacket(buffer)
  }
}

function* _syncDecode(iterable: Iterable<Buffer>) {
  let buffer = new BufferList()
  for (const data of iterable) {
    // search new data for the END byte
    const dataEndPosition = data.indexOf(END_BUFFER)
    let endPosition = dataEndPosition === -1 ? -1 : buffer.length + dataEndPosition
    buffer.append(data)
    // emit any packets we have
    while (endPosition > -1) {
      const packet = endPosition === 0 ? new BufferList() : buffer.shallowSlice(0, endPosition)
      if (packet.length > 0) {
        yield decodePacket(packet)
      }
      buffer = buffer.shallowSlice(endPosition + 1)
      endPosition = buffer.indexOf(END_BUFFER)
    }
  }
  if (buffer.length > 0) {
    yield decodePacket(buffer)
  }
}

export function decode(iterable: AsyncIterable<Buffer>): AsyncIterableIterator<Buffer>
export function decode(iterable: Iterable<Buffer>): IterableIterator<Buffer>
export function decode(iterable: Iterable<Buffer> | AsyncIterable<Buffer>) {
  if (iterable[Symbol.asyncIterator]) {
    return _asyncDecode(iterable as AsyncIterable<Buffer>)
  }
  return _syncDecode(iterable as Iterable<Buffer>)
}
