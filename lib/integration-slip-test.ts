import slip from 'slip'
import { decode, encodeMessage } from './'
import { deepEqual } from 'assert'

const doubleBytes: Buffer[] = []
for (let byte = 0; byte < 2 ** 8; byte++) {
  doubleBytes.push(Buffer.from([byte, byte]))
}
const complexMessage = Buffer.concat([...doubleBytes, ...doubleBytes.reverse()])
const copyOfMessage = Buffer.alloc(complexMessage.length)
complexMessage.copy(copyOfMessage)
describe('npm slip integration test', () => {
  it('packet formats match', () => {
    const packet = encodeMessage(complexMessage)
    const slipPacket = Buffer.from(slip.encode(complexMessage)).slice(1) // remove the leading END
    deepEqual(packet, slipPacket, 'both encodings match')
  })

  it('protocol-slip decodes npm slip encoded messages', () => {
    const packet = Buffer.from(slip.encode(complexMessage))

    let slipDecodedMessage
    const decoder = new slip.Decoder({
      onMessage(message) {
        slipDecodedMessage = Buffer.from(message)
      },
    })
    decoder.decode(packet)

    deepEqual(complexMessage, copyOfMessage, 'message was mutated')
    deepEqual(slipDecodedMessage, complexMessage, 'node-slip can decode the message')

    const decodedMessage = decode([packet]).next().value
    deepEqual(decodedMessage, complexMessage, 'decoded message does not match')
  })

  it('slip decodes npm protocol-slip encoded messages', () => {
    const packet = encodeMessage(complexMessage)
    const slipPacket = Buffer.from(slip.encode(complexMessage))
    deepEqual(packet, slipPacket.slice(1), 'both encodings match')

    let slipDecodedMessage
    const decoder = new slip.Decoder({
      onMessage(message) {
        slipDecodedMessage = Buffer.from(message)
      },
    })
    decoder.decode(packet)

    deepEqual(complexMessage, copyOfMessage, 'message was mutated')
    deepEqual(slipDecodedMessage, complexMessage, 'node-slip can decode the message')

    const decodedMessage = decode([packet]).next().value
    deepEqual(decodedMessage, complexMessage, 'decoded message does not match')
  })
})
