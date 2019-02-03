import { decode } from './'
import { deepEqual } from 'assert'
import { END, ESC, END_ESC_SEQ, ESC_ESC, ESC_ESC_SEQ } from './constants'
import { collect } from 'streaming-iterables'
const HI = Buffer.from('hi')
const BYE = Buffer.from('bye!')
const COMPUTER = Buffer.from('computer')

describe('decode', () => {
  it('decodes packets', () => {
    const packets = [Buffer.concat([HI, END]), BYE, END]
    const messages = collect(decode(packets))
    deepEqual(messages, [HI, BYE])
  })

  it('decodes end escape sequences', () => {
    const packets = [HI, END_ESC_SEQ, COMPUTER, END, BYE, ESC_ESC_SEQ, COMPUTER, END]
    const messages = collect(decode(packets))
    deepEqual(messages, [Buffer.concat([HI, END, COMPUTER]), Buffer.concat([BYE, ESC, COMPUTER])])
  })

  it('decodes end escape sequences async', async () => {
    async function* packets() {
      yield* [HI, END_ESC_SEQ, COMPUTER, END, BYE, ESC_ESC_SEQ, COMPUTER, END]
    }
    const messages = await collect(decode(packets()))
    deepEqual(messages, [Buffer.concat([HI, END, COMPUTER]), Buffer.concat([BYE, ESC, COMPUTER])])
  })

  it('emits final data as a message', () => {
    const packet = [HI, END, BYE]
    const messages = collect(decode(packet))
    deepEqual(messages, [HI, BYE])
  })

  it('ignores empty packets', () => {
    const packet = Buffer.concat([HI, END, END, END, BYE, END, END])
    const messages = collect(decode([packet]))
    deepEqual(messages, [HI, BYE])
  })

  it('ignores unknown escapes but keeps the data part', () => {
    const packet = Buffer.concat([HI, ESC, COMPUTER, END, BYE, END])
    const messages = collect(decode([packet]))
    deepEqual(messages, [Buffer.concat([HI, COMPUTER]), BYE])
  })

  it('deals with the escape char as the last character', () => {
    const packet = Buffer.concat([HI, ESC, END, BYE, END])
    const messages = collect(decode([packet]))
    deepEqual(messages, [HI, BYE])
  })

  // Adapted from https://github.com/OhMeadhbh/node-slip/blob/master/test_slip.js
  const data: Array<[string, string[], string[]]> = [
    ['one packet, esc error', ['00DBAA11C0'], ['00AA11']],
    ['one packet, two esc errors', ['00DBAADBBB11C0'], ['00AABB11']],
  ]
  data.forEach(([description, [packet], [message]]) => {
    it(description, () => {
      const messages = collect(decode([Buffer.from(packet, 'HEX')]))
      deepEqual(messages, [Buffer.from(message, 'HEX')])
    })
  })
})
