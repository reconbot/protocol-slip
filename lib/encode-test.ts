import { encode } from './'
import { deepEqual } from 'assert'
import { END, ESC, ESC_END, ESC_ESC } from './constants'
import { collect } from 'streaming-iterables'
const HI = Buffer.from('hi')
const BYE = Buffer.from('bye!')
const COMPUTER = Buffer.from('computer')

describe('encode', () => {
  it('encodes data as packets sync', () => {
    const input = [HI, COMPUTER]
    const packets = collect(encode(input))
    deepEqual(packets, [Buffer.concat([HI, END]), Buffer.concat([COMPUTER, END])])
  })
  it('encodes data as packets async', async () => {
    async function* input() {
      yield* [HI, COMPUTER]
    }
    const packets = await collect(encode(input()))
    deepEqual(packets, [Buffer.concat([HI, END]), Buffer.concat([COMPUTER, END])])
  })
  it('escapes END bytes', () => {
    const complexData = Buffer.concat([HI, END, BYE])
    const input = [complexData, COMPUTER]
    const packets = Buffer.concat(Array.from(encode(input)))
    deepEqual(packets, Buffer.concat([HI, ESC, ESC_END, BYE, END, COMPUTER, END]))
  })
  it('escapes ESC bytes', () => {
    const complexData = Buffer.concat([HI, ESC, BYE])
    const input = [complexData, COMPUTER]
    const packets = Buffer.concat(Array.from(encode(input)))
    deepEqual(packets, Buffer.concat([HI, ESC, ESC_ESC, BYE, END, COMPUTER, END]))
  })
})
