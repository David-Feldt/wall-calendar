import { deflateSync } from "zlib"
import sharp from "sharp"

/**
 * Convert any image to the grayscale PNG the TRMNL OG expects:
 *  - bits=1: pure black/white (1-bit grayscale PNG, all firmware)
 *  - bits=2: 4 gray levels (2-bit grayscale PNG, firmware 1.6+)
 *
 * We encode the PNG ourselves so the bit depth is guaranteed — the device
 * rejects 8-bit/RGBA PNGs, and the OG has a ~90KB image size limit.
 */
export async function toTrmnlPng(input: Buffer, width: number, height: number, bits: 1 | 2): Promise<Buffer> {
  const gray = await sharp(input)
    .resize(width, height, { fit: "fill" })
    .flatten({ background: "#ffffff" })
    .greyscale()
    .raw()
    .toBuffer()

  const levels = 1 << bits // 2 or 4
  const pixelsPerByte = 8 / bits
  const rowBytes = Math.ceil(width / pixelsPerByte)
  const raw = Buffer.alloc((rowBytes + 1) * height) // +1 filter byte per row

  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1)
    raw[rowStart] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const v = gray[y * width + x]
      const q = Math.min(levels - 1, Math.round((v / 255) * (levels - 1))) // 0 = black
      const byteIndex = rowStart + 1 + Math.floor(x / pixelsPerByte)
      const shift = 8 - bits * ((x % pixelsPerByte) + 1)
      raw[byteIndex] |= q << shift
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = bits // bit depth
  ihdr[9] = 0 // color type: grayscale
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([len, typeAndData, crc])
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
