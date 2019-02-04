import BufferList from 'bl'
import { END, ESC_END, ESC_ESC, ESC } from './constants'

function* packetDecoder() {
  let buffer = new BufferList()
  let cursor = 0
  let prevEscape = false
  let packets: Buffer[] = []
  while (true) {
    while (cursor < buffer.length) {
      const byte = buffer.get(cursor)
      switch (byte) {
        case ESC[0]:
          prevEscape = true
          break
        case END[0]:
          if (cursor > 0) {
            const packet = buffer.slice(0, cursor)
            if (prevEscape) {
              if (packet.length > 1) {
                packets.push(packet.slice(0, -1))
              }
            } else {
              packets.push(packet)
            }
          }
          buffer = buffer.shallowSlice(cursor + 1)
          cursor = -1 // start from beginning again
          prevEscape = false
          break
        default:
          if (!prevEscape) {
            break
          }
          prevEscape = false
          let newValue = Buffer.from([byte])
          if (byte === ESC_END[0]) {
            newValue = END
          } else if (byte === ESC_ESC[0]) {
            newValue = ESC
          }
          // remove the escape and keep the value
          buffer = new BufferList([
            buffer.shallowSlice(0, cursor - 1),
            newValue,
            buffer.shallowSlice(cursor + 1),
          ] as Buffer[])
          // fix the cursor
          cursor--
      }
      cursor++
    }

    const input = yield packets.length > 0 ? packets : null
    packets = []
    if (input) {
      buffer.append(input)
    } else {
      return buffer.length > 0 ? [buffer.slice()] : null
    }
  }
}

function* _syncDecode(iterable: Iterable<Buffer>) {
  const decoder = packetDecoder()
  decoder.next() // start it up
  for (const data of iterable) {
    const packets = decoder.next(data).value
    if (packets) {
      yield* packets
    }
  }
  const lastPackets = decoder.next(null).value
  if (lastPackets) {
    yield* lastPackets
  }
}

async function* _asyncDecode(iterable: AsyncIterable<Buffer>) {
  const decoder = packetDecoder()
  decoder.next() // start it up
  for await (const data of iterable) {
    const packets = decoder.next(data).value
    if (packets) {
      yield* packets
    }
  }
  const lastPackets = decoder.next(null).value
  if (lastPackets) {
    yield* lastPackets
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
