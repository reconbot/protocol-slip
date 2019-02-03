# protocol-slip 🍌

[![Build Status](https://travis-ci.org/reconbot/streaming-iterables.svg?branch=master)](https://travis-ci.org/reconbot/streaming-iterables)
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

## API

- [`encode()`](#encode)
- [`decode()`](#decode)

### encode
```ts
function encode<T>(size: number, iterable: AsyncIterable<T>): AsyncIterableIterator<T[]>
function encode<T>(size: number, iterable: Iterable<T>): IterableIterator<T[]>
```

Batch objects from `iterable` into arrays of `size` length. The final array may be shorter than size if there is not enough items. Returns a sync iterator if the `iterable` is sync, otherwise an async iterator. Errors from the source `iterable` are immediately raised.

`size` can be betweeen 1 and `Infinity`.

```ts
import { batch } from 'streaming-iterables'
import { getPokemon } from 'iterable-pokedex'

// batch 10 pokemon while we process them
for await (const pokemons of batch(10, getPokemon())) {
  console.log(pokemons) // 10 pokemon at a time!
}
```

### decode
```ts
function decode<T>(size: number, iterable: AsyncIterable<T>): AsyncIterableIterator<T>
function decode<T>(size: number, iterable: Iterable<T>): IterableIterator<T>
```
Buffer keeps a number of objects in reserve available for immediate reading. This is helpful with async iterators as it will prefetch results so you don't have to wait for them to load. For sync iterables it will precompute up to `size` values and keep them in reserve. The internal buffer will start to be filled once `.next()` is called for the first time and will continue to fill until the source `iterable` is exhausted or the buffer is full. Errors from the source `iterable` will be raised after all buffered values are yielded.

`size` can be betweeen 1 and `Infinity`.

```ts
import { buffer } from 'streaming-iterables'
import { getPokemon, trainMonster } from 'iterable-pokedex'

// load 10 monsters in the background while we process them one by one
for await (const monster of buffer(10, getPokemon())) {
  await trainMonster(monster) // got to do some pokéwork
}
```

## Contributors wanted!

Writing docs and code is a lot of work! Thank you in advance for helping out.
