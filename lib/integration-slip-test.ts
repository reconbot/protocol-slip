import slip from 'slip'
import { randomBytes } from 'crypto'
import { END, ESC } from './constants'
import { decode } from './decode'
import { deepEqual } from 'assert'

const complexMessage = Buffer.concat([randomBytes(1024), END, randomBytes(1024), ESC, randomBytes(1024)])
const copyOfMessage = Buffer.alloc(complexMessage.length)
complexMessage.copy(copyOfMessage)
describe('npm slip integration test', () => {
  it('protocol-slip decodes npm slip encoded messages', () => {
    const packet = Buffer.from(slip.encode(complexMessage))
    const decodedMessage = decode([packet]).next().value

    let slipDecodedMessage
    const decoder = new slip.Decoder({
      onMessage(message) {
        slipDecodedMessage = Buffer.from(message)
      },
    })
    decoder.decode(packet)

    deepEqual(complexMessage, copyOfMessage, 'message was mutated')
    deepEqual(slipDecodedMessage, complexMessage, 'node-slip can decode the message')
    deepEqual(decodedMessage, complexMessage, 'decoded message does not match')
  })
  it('npm slip decodes protocol-slip encoded messages')
})
