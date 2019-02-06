import { END, ESC_END, ESC_ESC, ESC } from './constants'

function* packetDecoder(bufferSize = 1024) {
  let buffer = Buffer.allocUnsafe(bufferSize)
  let input: Buffer | null = null
  let writeCursor = 0
  let prevEscape = false
  let packets: Buffer[] = []

  const writeByte = (byte: number) => {
    if (writeCursor >= buffer.length) {
      buffer = Buffer.concat([buffer, Buffer.allocUnsafe(bufferSize)])
    }
    buffer[writeCursor] = byte
    writeCursor++
  }

  const queuePacket = () => {
    if (writeCursor === 0) {
      return
    }
    packets.push(buffer.slice(0, writeCursor))
    buffer = buffer.slice(writeCursor)
    writeCursor = 0
  }

  while (true) {
    input = yield packets
    let inputCursor = 0
    packets = []
    if (!input) {
      return writeCursor > 0 ? [buffer.slice(0, writeCursor)] : []
    }
    while (inputCursor < input.length) {
      const byte = input[inputCursor]
      switch (byte) {
        case ESC[0]:
          prevEscape = true
          break
        case END[0]:
          prevEscape = false
          queuePacket()
          break
        default:
          if (!prevEscape) {
            writeByte(byte)
          } else {
            prevEscape = false
            let newValue = byte
            if (byte === ESC_END[0]) {
              newValue = END[0]
            } else if (byte === ESC_ESC[0]) {
              newValue = ESC[0]
            }
            writeByte(newValue)
          }
      }
      inputCursor++
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
    yield* packets
  }
  const lastPackets = decoder.next(null).value
  yield* lastPackets
}

export function decode(iterable: AsyncIterable<Buffer>): AsyncIterableIterator<Buffer>
export function decode(iterable: Iterable<Buffer>): IterableIterator<Buffer>
export function decode(iterable: Iterable<Buffer> | AsyncIterable<Buffer>) {
  if (iterable[Symbol.asyncIterator]) {
    return _asyncDecode(iterable as AsyncIterable<Buffer>)
  }
  return _syncDecode(iterable as Iterable<Buffer>)
}
