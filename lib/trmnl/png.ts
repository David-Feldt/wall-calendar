import { deflateSync, inflateSync } from "zlib"

/**
 * Convert any image to the grayscale PNG the TRMNL OG expects:
 *  - bits=1: pure black/white (1-bit grayscale PNG, all firmware)
 *  - bits=2: 4 gray levels (2-bit grayscale PNG, firmware 1.6+)
 *
 * We decode/encode PNGs ourselves (pure JS, no native deps like sharp, which
 * breaks on Vercel) so the bit depth is guaranteed — the device rejects
 * 8-bit/RGBA PNGs, and the OG has a ~90KB image size limit.
 */
export function toTrmnlPng(input: Buffer, width: number, height: number, bits: 1 | 2): Buffer {
  const gray = decodeToGray(input)
  if (gray.width !== width || gray.height !== height) {
    throw new Error(`Expected ${width}x${height} image, got ${gray.width}x${gray.height}`)
  }

  const levels = 1 << bits // 2 or 4
  const pixelsPerByte = 8 / bits
  const rowBytes = Math.ceil(width / pixelsPerByte)
  const raw = Buffer.alloc((rowBytes + 1) * height) // +1 filter byte per row

  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1)
    raw[rowStart] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const v = gray.pixels[y * width + x]
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

/**
 * Decode an 8-bit RGB/RGBA/gray PNG (what next/og produces) to 8-bit grayscale,
 * compositing any transparency over white.
 */
function decodeToGray(png: Buffer): { width: number; height: number; pixels: Uint8Array } {
  let offset = 8 // skip signature
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let interlace = 0
  const idat: Buffer[] = []

  while (offset < png.length) {
    const length = png.readUInt32BE(offset)
    const type = png.toString("ascii", offset + 4, offset + 8)
    const data = png.subarray(offset + 8, offset + 8 + length)
    if (type === "IHDR") {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      interlace = data[12]
    } else if (type === "IDAT") {
      idat.push(data)
    } else if (type === "IEND") {
      break
    }
    offset += 12 + length
  }

  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType]
  if (bitDepth !== 8 || !channels || interlace !== 0) {
    throw new Error(`Unsupported PNG (bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace})`)
  }

  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const prev = new Uint8Array(stride)
  const cur = new Uint8Array(stride)
  const pixels = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1)
    const filter = raw[rowStart]
    for (let i = 0; i < stride; i++) {
      const x = raw[rowStart + 1 + i]
      const a = i >= channels ? cur[i - channels] : 0
      const b = prev[i]
      const c = i >= channels ? prev[i - channels] : 0
      let v: number
      switch (filter) {
        case 0: v = x; break
        case 1: v = x + a; break
        case 2: v = x + b; break
        case 3: v = x + ((a + b) >> 1); break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a)
          const pb = Math.abs(p - b)
          const pc = Math.abs(p - c)
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)
          break
        }
        default: throw new Error(`Bad PNG filter ${filter}`)
      }
      cur[i] = v & 0xff
    }

    for (let px = 0; px < width; px++) {
      const i = px * channels
      let lum: number
      let alpha = 255
      if (channels >= 3) {
        lum = 0.299 * cur[i] + 0.587 * cur[i + 1] + 0.114 * cur[i + 2]
        if (channels === 4) alpha = cur[i + 3]
      } else {
        lum = cur[i]
        if (channels === 2) alpha = cur[i + 1]
      }
      pixels[y * width + px] = Math.round((lum * alpha + 255 * (255 - alpha)) / 255)
    }
    prev.set(cur)
  }

  return { width, height, pixels }
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
