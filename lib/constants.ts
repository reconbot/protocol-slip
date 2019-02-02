export const END_BUFFER = Buffer.from([0xc0]) // 192
export const ESC_BUFFER = Buffer.from([0xdb]) // 219
export const ESC_END_BUFFER = Buffer.from([0xdc]) // 220
export const ESC_ESC_BUFFER = Buffer.from([0xdd]) // 221
export const END_ESC_SEQ = Buffer.from([0xdb, 0xdc]) // ESC, ESC_END
export const ESC_ESC_SEQ = Buffer.from([0xdb, 0xdd]) // ESC, ESC_ESC
