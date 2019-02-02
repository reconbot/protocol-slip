# protocol-slip 🍌

[![Build Status](https://travis-ci.org/reconbot/streaming-iterables.svg?branch=master)](https://travis-ci.org/reconbot/streaming-iterables)
[![Try protocol-slip on RunKit](https://badge.runkitcdn.com/protocol-slip.svg)](https://npm.runkit.com/protocol-slip)
[![install size](https://packagephobia.now.sh/badge?p=protocol-slip)](https://packagephobia.now.sh/result?p=protocol-slip)


Description

## Install
```bash
npm install protocol-slip
```

## Example


## API

- [`encode()`](#encode)
- [`decode()`](#decode)

### encode
```ts
function batch<T>(size: number, iterable: AsyncIterable<T>): AsyncIterableIterator<T[]>
function batch<T>(size: number, iterable: Iterable<T>): IterableIterator<T[]>
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
function buffer<T>(size: number, iterable: AsyncIterable<T>): AsyncIterableIterator<T>
function buffer<T>(size: number, iterable: Iterable<T>): IterableIterator<T>
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
