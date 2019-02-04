// tslint:disable:no-console
import { Suite } from 'benchmark'
import slip from 'slip'
import nodeSlip from 'node-slip'
import { decode, encode } from '../lib'
import { randomBytes } from 'crypto'
import { equal } from 'assert'

const MESSAGES: Buffer[] = []
for (let size = 1; size < 1000; size++) {
  MESSAGES.push(randomBytes(size))
}

const packetPerMessage = Array.from(encode(MESSAGES))
const onePacket = [Buffer.concat(packetPerMessage)]
const manyPackets = [...onePacket].map(byte => Buffer.from([byte]))

function testDecode(description: string, packets: Buffer[]) {
  const suite = new Suite()
  suite.add('protocol-slip', () => {
    const messages = Array.from(decode(packets))
    equal(messages.length, MESSAGES.length)
  })

  suite.add('slip', () => {
    const messages: any[] = []
    const decoder = new slip.Decoder({
      onMessage(message) {
        messages.push(message)
      },
    })
    packets.forEach(packet => decoder.decode(packet))
    equal(messages.length, MESSAGES.length)
  })

  suite.add('node-slip', () => {
    const messages: any[] = []
    const parser = new nodeSlip.parser({
      data(message) {
        messages.push(message)
      },
    })
    packets.forEach(packet => parser.write(packet))
    equal(messages.length, MESSAGES.length)
  })

  suite.on('cycle', event => {
    console.log(`  ${event.target.toString()}`)
  })

  suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name') + '\n')
  })

  const promise = new Promise(resolve => {
    suite.on('complete', resolve)
  })
  console.log(`Testing ${description}`)
  suite.run()
  return promise
}

async function run() {
  await testDecode('onePacket', onePacket)
  await testDecode('packet per message', packetPerMessage)
  await testDecode('manyPackets', manyPackets)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
