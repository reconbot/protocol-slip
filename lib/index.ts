if ((Symbol as any).asyncIterator === undefined) {
  ;(Symbol as any).asyncIterator = Symbol.for('asyncIterator')
}

export { encode, encodeMessage } from './encode'
export { decode, decodePacket } from './decode'
