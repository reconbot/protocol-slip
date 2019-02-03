import BufferList from 'bl'
import { END, ESC_END, ESC_ESC, ESC } from './constants'

export const decodePacket = (packet: BufferList): Buffer => {
  const message = new BufferList()
  let remainingPacket = packet
  let escPosition = packet.indexOf(ESC)
  while (escPosition > -1) {
    if (escPosition > 0) {
      const part = remainingPacket.shallowSlice(0, escPosition)
      message.append(part)
    }
    const nextByte = remainingPacket.get(escPosition + 1)
    if (nextByte === ESC_END[0]) {
      message.append(END)
    } else if (nextByte === ESC_ESC[0]) {
      message.append(ESC)
    } else {
      message.append(remainingPacket.slice(escPosition + 1, escPosition + 2))
    }
    remainingPacket = remainingPacket.shallowSlice(escPosition + 2)
    escPosition = remainingPacket.indexOf(ESC)
  }
  message.append(remainingPacket)
  return message.slice()
}

function* _syncDecode(iterable: Iterable<Buffer>) {
  let buffer = new BufferList()
  for (const data of iterable) {
    // search new data for the END byte
    const dataEndPosition = data.indexOf(END)
    let endPosition = dataEndPosition === -1 ? -1 : buffer.length + dataEndPosition
    buffer.append(data)
    // emit any packets we have
    while (endPosition > -1) {
      if (endPosition > 0) {
        const packetData = buffer.shallowSlice(0, endPosition)
        yield decodePacket(packetData)
      }
      buffer = buffer.shallowSlice(endPosition + 1)
      endPosition = buffer.indexOf(END)
    }
  }
  if (buffer.length > 0) {
    yield decodePacket(buffer)
  }
}

async function* _asyncDecode(iterable: AsyncIterable<Buffer>) {
  let buffer = new BufferList()
  for await (const data of iterable) {
    // search new data for the END byte
    const dataEndPosition = data.indexOf(END)
    let endPosition = dataEndPosition === -1 ? -1 : buffer.length + dataEndPosition
    buffer.append(data)
    // emit any packets we have
    while (endPosition > -1) {
      if (endPosition > 0) {
        const packet = buffer.shallowSlice(0, endPosition)
        yield decodePacket(packet)
      }
      buffer = buffer.shallowSlice(endPosition + 1)
      endPosition = buffer.indexOf(END)
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
