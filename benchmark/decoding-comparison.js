// tslint:disable:no-console
const { Suite } = require('benchmark')
const { batch } = require('streaming-iterables')
const slip = require('slip')
const nodeSlip = require('node-slip')
const { randomBytes } = require('crypto')
const { equal } = require('assert')
const { decode, encode } = require('../dist')

const MESSAGES = []
for (let size = 1; size <= 1024; size++) {
  MESSAGES.push(randomBytes(size))
}

const packetPerMessage = Array.from(encode(MESSAGES))
const onePacket = [Buffer.concat(packetPerMessage)]
const packetPerByte = [...onePacket[0]].map(byte => Buffer.from([byte]))
const packetPer500Bytes = [...batch(500, onePacket[0])].map(bytes => Buffer.from(bytes))

function testDecode(description, packets) {
  const suite = new Suite()
  suite.add('protocol-slip', () => {
    const messages = Array.from(decode(packets))
    equal(messages.length, MESSAGES.length)
  })

  suite.add('slip', () => {
    const messages = []
    const decoder = new slip.Decoder({
      onMessage(message) {
        messages.push(message)
      },
    })
    packets.forEach(packet => decoder.decode(packet))
    equal(messages.length, MESSAGES.length)
  })

  suite.add('node-slip', () => {
    const messages = []
    const parser = new nodeSlip.parser({
      data(message) {
        messages.push(message)
      },
    }, false)
    packets.forEach(packet => parser.write(packet))
    equal(messages.length, MESSAGES.length)
  })

  suite.on('cycle', event => {
    console.log(`  ${event.target.toString()}`)
  })

  suite.on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name') + '\n')
  })

  const promise = new Promise(resolve => {
    suite.on('complete', resolve)
  })
  console.log(`Benchmarking decode comparison ${description}`)
  suite.run()
  return promise
}

module.exports.run = async function run() {
  await testDecode('onePacket', onePacket)
  await testDecode('packet per message', packetPerMessage)
  await testDecode('packetPerByte', packetPerByte)
  await testDecode('500 byte packets', packetPer500Bytes)
}
