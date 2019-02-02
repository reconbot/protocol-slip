import { encode } from './'
import { deepEqual } from 'assert'
import { END_BUFFER, ESC_BUFFER, ESC_END_BUFFER, ESC_ESC_BUFFER } from './constants'
import { collect } from 'streaming-iterables'
const HI = Buffer.from('hi')
const BYE = Buffer.from('bye!')
const COMPUTER = Buffer.from('computer')

describe('encode', () => {
  it('encodes data as packets sync', () => {
    const input = [HI, COMPUTER]
    const packets = collect(encode(input))
    deepEqual(packets, [Buffer.concat([HI, END_BUFFER]), Buffer.concat([COMPUTER, END_BUFFER])])
  })
  it('encodes data as packets async', async () => {
    async function* input() {
      yield* [HI, COMPUTER]
    }
    const packets = await collect(encode(input()))
    deepEqual(packets, [Buffer.concat([HI, END_BUFFER]), Buffer.concat([COMPUTER, END_BUFFER])])
  })
  it('escapes END bytes', () => {
    const complexData = Buffer.concat([HI, END_BUFFER, BYE])
    const input = [complexData, COMPUTER]
    const packets = Buffer.concat(Array.from(encode(input)))
    deepEqual(packets, Buffer.concat([HI, ESC_BUFFER, ESC_END_BUFFER, BYE, END_BUFFER, COMPUTER, END_BUFFER]))
  })
  it('escapes ESC bytes', () => {
    const complexData = Buffer.concat([HI, ESC_BUFFER, BYE])
    const input = [complexData, COMPUTER]
    const packets = Buffer.concat(Array.from(encode(input)))
    deepEqual(packets, Buffer.concat([HI, ESC_BUFFER, ESC_ESC_BUFFER, BYE, END_BUFFER, COMPUTER, END_BUFFER]))
  })
})
