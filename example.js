const { encode, decode } = require('protocol-slip')

const MESSAGES = [Buffer.from('This is my message')]

const packets = Array.from(encode(MESSAGES))
const messages = Array.from(decode(packets))
console.log(packets)
console.log(messages[0].toString())
