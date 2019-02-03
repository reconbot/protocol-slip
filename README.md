# protocol-slip 🍌

[![CircleCI](https://circleci.com/gh/reconbot/protocol-slip/tree/master.svg?style=svg&circle-token=d75c1842b237fef8232fae158891b990f519d69e)](https://circleci.com/gh/reconbot/protocol-slip/tree/master)
[![Try protocol-slip on RunKit](https://badge.runkitcdn.com/protocol-slip.svg)](https://npm.runkit.com/protocol-slip)
[![install size](https://packagephobia.now.sh/badge?p=protocol-slip)](https://packagephobia.now.sh/result?p=protocol-slip)

An iterator based [RFC 1055](https://tools.ietf.org/html/rfc1055) compliant `SLIP` (Serial Line Internet Protocol) encoder/decoder.

## Example
```js
import { encode, decode } from 'protocol-slip'

const serial = // a serialport interface of some sort
const messages = [/* An array of buffers */]
for (const data of encode(messages)) {
  await serial.write(data)
}

for await (const message of decode(serial.readItr())) {
  console.log(message) // a buffer with your message in it
}
```

Both `encode` and `decode` return iterators (or async iterators depending on the data source) that will encode messages into packets, or decode binary data (full or partial packets) into messages. The [spec](https://tools.ietf.org/html/rfc1055), [earlier references](https://tools.ietf.org/html/rfc914) and the [wikipedia page](https://en.wikipedia.org/wiki/Serial_Line_Internet_Protocol) are light on details for edge cases, so I've referenced a few other implementations as well.

At it's root (from wikipedia);

> appending a special "END" byte to it, which distinguishes datagram boundaries in the byte stream,
> if the END byte occurs in the data to be sent, the two byte sequence ESC, ESC_END is sent instead,
> if the ESC byte occurs in the data, the two byte sequence ESC, ESC_ESC is sent.

We don't do this part, but parse it without issue
> variants of the protocol may begin, as well as end, packets with END.

RFC 1055 has sample C code that suggests ignoring unknown escape sequences by removing the escape character and allowing the second byte to remain. So that's what I do too. This deviates from other JS implementations like [`node-slip`](https://github.com/OhMeadhbh/node-slip) but matches [`slip`](https://github.com/colinbdclark/slip.js)'s behavior.

I did ignore some parts of the RFCs. For example;

> Therefore any new SLIP implementations should be prepared to accept 1006 byte datagrams and should not send more than 1006 bytes in a datagram.

This advice is outdated. There is no maximum packet size with these functions.

You probably already know why you want to use `SLIP` but I'll cover some details. `SLIP` is a;
- Lightweight message encoding with low overhead
- [Self synchronizing](https://en.wikipedia.org/wiki/Self-synchronizing_code) protocol capable of recovering after data loss or line noise

Some things `SLIP` does not do (stolen from (RFC 1055)[https://tools.ietf.org/html/rfc1055]);
- Error correction, Errors are usually not noticed. As a result of line noise or data loss, messages may be merged, have garbage data, or be split into pieces. Subsequent messages however will be not be affected.
- Addressing, you put bytes on a wire and you read bytes. If you got them they're for you.
- Type identification, You have to bring this yourself, it's just segments of data.
- Error detection/correction, There is no attempt made in this area.
- Compression, you also have to bring this if you want it.

## Install
```bash
npm install protocol-slip
```

This package targets ES2017 and requires node 8 or higher. It will polyfill `Symbol.asyncIterator` if necessary to allow async iterables to be used.

## API

- [`decode()`](#decode)
- [`decodePacket()`](#decodepacket)
- [`encode()`](#encode)
- [`encodeMessage()`](#encodemessage)

### decode
```ts
function decode<Buffer>(iterable: AsyncIterable<Buffer>): AsyncIterableIterator<Buffer>
function decode<Buffer>(iterable: Iterable<Buffer>): IterableIterator<Buffer>
```

Decode an iterable of packet data into messages. Data is read from `iterable` and yielded as complete messages. If an unknown escape sequence is detected the `ESC` byte is removed but the next byte is passed through without modification per RFC 1055 recommendations. Empty messages are ignored, so it's safe receive data from SLIP implementations that include a leading `END` byte.

```ts
import { decode } from 'protocol-slip'
const PACKETS = [Buffer.from('54686973206973206D7920', 'HEX'), Buffer.from('6D657373616765C0', 'HEX')]
const messages = Array.from(decode(PACKETS))
console.log(messages[0].toString()) // 'This is my message'
```

### decodePacket
```ts
function decodePacket(packet: BufferList): Buffer
```

Take a [`BufferList`](https://www.npmjs.com/package/bl) of a complete packet and return a `Buffer` of a message. A `BufferList` is used as it allows appending buffers received from a stream or other source with very little overhead. This function is used internally and could be helpful if you do not have an iterable or async iterable interface to read data from.

### encode
```ts
function encode<Buffer>(iterable: AsyncIterable<Buffer>): AsyncIterableIterator<Buffer>
function encode<Buffer>(iterable: Iterable<Buffer>): IterableIterator<Buffer>
```

Encode an iterable of messages into SLIP compliant packets. This function will escape and encapsulate messages into packets and emit them 1 for 1 as they are read from `iterable`. The `END` byte is only applied to the end of each message.

```ts
import { encode } from 'protocol-slip'
const MESSAGES = [Buffer.from('This is my message')]
const packets = Array.from(encode(MESSAGES))
console.log(packets) // [Buffer <54, 68, 69, 73, 20, 69, 73, 20, 6D, 79, 20, 6D, 65, 73, 73, 61, 67, 65, C0>]
```

### encodeMessage
```ts
function encodeMessage(data: Buffer): Buffer
```

Encode a message into a slip packet. This function will escape and encapsulate a `Buffer` into a slip format. This function is used internally and could be helpful if you do not have an iterable or async iterable interface to read data from.

## Contributors wanted!

Writing docs and code is a lot of work! Thank you in advance for helping out.
