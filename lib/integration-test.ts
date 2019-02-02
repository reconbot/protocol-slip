import { collect } from 'streaming-iterables'
import { encode, decode } from './'
import { deepEqual } from 'assert'
import { END_BUFFER, ESC_BUFFER, ESC_END_BUFFER } from './constants'

const MESSAGE = Buffer.concat([
  Buffer.from('This is my message,'),
  END_BUFFER,
  Buffer.from('there are'),
  ESC_BUFFER,
  Buffer.from(' many like it but this one is mine.'),
])
const PACKETS = Buffer.concat([
  Buffer.from('This is my'),
  ESC_BUFFER,
  ESC_END_BUFFER,
  Buffer.from(' packet'),
  END_BUFFER,
  Buffer.from('This is another packet'),
  END_BUFFER,
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
  ['one packet, esc error', ['00DBAA11C0'], ['0011']],
  ['one packet, two esc errors', ['00DBAADBBB11C0'], ['0011']],
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
  describe.only('node-slip tests', () => {
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
})
