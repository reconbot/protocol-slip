import { randomBytes } from 'crypto'
import { deepEqual } from 'assert'
import { collect } from 'streaming-iterables'
import { encode, decode } from './'
import { END, ESC, ESC_END } from './constants'

const MESSAGE = Buffer.concat([
  Buffer.from('This is my message,'),
  END,
  Buffer.from('there are'),
  ESC,
  Buffer.from(' many like it but this one is mine.'),
])
const PACKETS = Buffer.concat([
  Buffer.from('This is my'),
  ESC,
  ESC_END,
  Buffer.from(' packet'),
  END,
  Buffer.from('This is another packet'),
  END,
])

// Adapted from https://github.com/OhMeadhbh/node-slip/blob/master/test_slip.js
type fixtureData = [string, string[], string[]]
const nodeSlipExamples: fixtureData[] = [
  ['one packet per event', ['00112233445566C0'], ['00112233445566']],
  ['two packets, one event', ['012345C06789ABC0'], ['012345', '6789AB']],
  ['one packet, two events', ['FFEEDD', 'CCBBAAC0'], ['FFEEDDCCBBAA']],
  ['one packet, three events', ['FFEEDD', 'CCBBAA', 'D199C0'], ['FFEEDDCCBBAAD199']],
  ['one packet, escape end', ['00DBDCFFC0'], ['00C0FF']],
  ['one packet, escape esc', ['AADBDD55C0'], ['AADB55']],
  ['two packets, escape end', ['001122DB', 'DC3344C0'], ['001122C03344']],
  ['two packets, escape esc', ['FFEEDB', 'DDDDCCBBAAC0'], ['FFEEDBDDCCBBAA']],
  [
    'one big long packet',
    ['00112233445566778899AABBCCDDEEFF001122334455667788C0'],
    ['00112233445566778899AABBCCDDEEFF001122334455667788'],
  ],
  [
    'two events, shortish packet',
    ['112233445566778899AABBCCDDEEFF', '1122334455667788C0'],
    ['112233445566778899AABBCCDDEEFF1122334455667788'],
  ],
  [
    'two events, long packet',
    ['00112233445566778899AABBCCDDEEFF', '001122334455667788C0'],
    ['00112233445566778899AABBCCDDEEFF001122334455667788'],
  ],
]

describe('integration', () => {
  describe('node-slip tests', () => {
    nodeSlipExamples.forEach(([description, packetsStr, messagesStr]) => {
      const packets = packetsStr.map(str => Buffer.from(str, 'HEX'))
      const messages = messagesStr.map(str => Buffer.from(str, 'HEX'))
      it(description, () => {
        const decodedPackets = collect(decode(packets))
        deepEqual(decodedPackets, messages, 'decoding is incorrect')
        const encodedMessages = collect(encode(messages))
        deepEqual(Buffer.concat(encodedMessages), Buffer.concat(packets), 'encoding is incorrect')
      })
    })
  })
  it('encodes and decodes', () => {
    const message = Buffer.concat(collect(decode(encode([MESSAGE]))))
    deepEqual(message, MESSAGE)
  })
  it('encodes and decodes async', async () => {
    async function* asyncMessage() {
      yield MESSAGE
    }
    const message = Buffer.concat(await collect(decode(encode(asyncMessage()))))
    deepEqual(message, MESSAGE)
  })
  it('decodes and encodes', () => {
    const packets = Buffer.concat(collect(encode(decode([PACKETS]))))
    deepEqual(packets, PACKETS)
  })
  it('every byte test', () => {
    const MESSAGES: Buffer[] = []
    for (let byte = 0; byte < 2 ** 8; byte++) {
      MESSAGES.push(Buffer.from([byte, byte]))
    }

    const recodedMessages = collect(decode(encode(MESSAGES)))
    deepEqual(recodedMessages, MESSAGES)
  })
  it('random byte test', () => {
    const MESSAGES: Buffer[] = []
    for (let count = 0; count < 1024; count++) {
      MESSAGES.push(randomBytes((Math.random() + 1) * 1024))
    }

    const recodedMessages = collect(decode(encode(MESSAGES)))
    deepEqual(recodedMessages, MESSAGES)
  })
})
