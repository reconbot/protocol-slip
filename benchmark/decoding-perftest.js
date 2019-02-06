// tslint:disable:no-console
const { Suite } = require('benchmark')
const { batch } = require('streaming-iterables')
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
  const start = process.hrtime.bigint();
  for (let index = 0; index < 10; index++) {
    Array.from(decode(packets))
  }
  const end = process.hrtime.bigint();
  console.log(`  ${description}: ${Number(end - start) / 1000000000}s`)
}

function run() {
  const start = process.hrtime.bigint();
  console.log(`Benchmarking decode`)
  testDecode('onePacket', onePacket)
  testDecode('packet per message', packetPerMessage)
  testDecode('packetPerByte', packetPerByte)
  testDecode('500 byte packets', packetPer500Bytes)
  const end = process.hrtime.bigint();
  const seconds = Number(end - start) / 1000000000
  console.log(`Finished in: ${seconds}s`)
}

run()
