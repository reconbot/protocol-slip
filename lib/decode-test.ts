import { decode } from './'
import { deepEqual } from 'assert'
import { END_BUFFER, ESC_BUFFER, ESC_END_BUFFER, ESC_ESC_BUFFER } from './constants'
import { collect } from 'streaming-iterables'
const HI = Buffer.from('hi')
const BYE = Buffer.from('bye!')
const COMPUTER = Buffer.from('computer')

const END_ESC_SEQ = Buffer.concat([ESC_BUFFER, ESC_END_BUFFER])
const ESC_ESC_SEQ = Buffer.concat([ESC_BUFFER, ESC_ESC_BUFFER])

describe('decode', () => {
  it('decodes packets', () => {
    const input = [Buffer.concat([HI, END_BUFFER]), BYE, END_BUFFER]
    const packets = collect(decode(input))
    deepEqual(packets, [HI, BYE])
  })

  it('decodes end escape sequences', () => {
    const input = [HI, END_ESC_SEQ, COMPUTER, END_BUFFER, BYE, ESC_ESC_SEQ, COMPUTER, END_BUFFER]
    const packets = collect(decode(input))
    deepEqual(packets, [Buffer.concat([HI, END_BUFFER, COMPUTER]), Buffer.concat([BYE, ESC_BUFFER, COMPUTER])])
  })

  it('decodes end escape sequences async', async () => {
    async function* input() {
      yield* [HI, END_ESC_SEQ, COMPUTER, END_BUFFER, BYE, ESC_ESC_SEQ, COMPUTER, END_BUFFER]
    }
    const packets = await collect(decode(input()))
    deepEqual(packets, [Buffer.concat([HI, END_BUFFER, COMPUTER]), Buffer.concat([BYE, ESC_BUFFER, COMPUTER])])
  })

  it('emits final data as a packet', () => {
    const input = [HI, END_BUFFER, BYE]
    const packets = collect(decode(input))
    deepEqual(packets, [HI, BYE])
  })

  it('ignores empty packets', () => {
    const input = Buffer.concat([HI, END_BUFFER, END_BUFFER, END_BUFFER, BYE, END_BUFFER, END_BUFFER])
    const packets = collect(decode([input]))
    deepEqual(packets, [HI, BYE])
  })
})
