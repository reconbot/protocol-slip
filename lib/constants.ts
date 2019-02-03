export const END = Buffer.from([0xc0]) // 192
export const ESC = Buffer.from([0xdb]) // 219
export const ESC_END = Buffer.from([0xdc]) // 220
export const ESC_ESC = Buffer.from([0xdd]) // 221
export const END_ESC_SEQ = Buffer.from([0xdb, 0xdc]) // ESC, ESC_END
export const ESC_ESC_SEQ = Buffer.from([0xdb, 0xdd]) // ESC, ESC_ESC
