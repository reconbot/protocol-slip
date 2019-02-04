// tslint:disable:no-console
import { Suite } from 'benchmark'
import slip from 'slip'
import nodeSlip from 'node-slip'
import { encode } from '../lib/'
import { randomBytes } from 'crypto'
import { equal } from 'assert'

const suite = new Suite()

const messages = [
  randomBytes(1024),
  randomBytes(1024),
  randomBytes(1024),
  randomBytes(1024),
  randomBytes(1024),
  randomBytes(1024),
  randomBytes(1024),
]

suite.add('procol-slip encode', () => {
  const packets = Array.from(encode(messages))
  equal(packets.length, messages.length)
})

suite.add('slip encode', () => {
  const packets = messages.map(i => slip.encode(i))
  equal(packets.length, messages.length)
})

suite.add('node-slip encode', () => {
  const packets = messages.map(i => nodeSlip.generator(i))
  equal(packets.length, messages.length)
})

suite.on('cycle', event => {
  console.log(String(event.target))
})

suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'))
})

suite.run()
