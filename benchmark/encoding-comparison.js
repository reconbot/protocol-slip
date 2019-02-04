// tslint:disable:no-console
const { Suite } = require('benchmark')
const slip = require('slip')
const nodeSlip = require('node-slip')
const { randomBytes } = require('crypto')
const { equal } = require('assert')
const { encode } = require('../dist')

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

module.exports.run = function run() {
  suite.add('procol-slip', () => {
    const packets = Array.from(encode(messages))
    equal(packets.length, messages.length)
  })

  suite.add('slip', () => {
    const packets = messages.map(i => slip.encode(i))
    equal(packets.length, messages.length)
  })

  suite.add('node-slip', () => {
    const packets = messages.map(i => nodeSlip.generator(i))
    equal(packets.length, messages.length)
  })

  suite.on('cycle', event => {
    console.log(`  ${event.target.toString()}`)
  })

  suite.on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'))
  })

  const promise = new Promise(resolve => {
    suite.on('complete', resolve)
  })
  console.log(`Benchmarking Encoding comparison`)
  suite.run()
  return promise

}
