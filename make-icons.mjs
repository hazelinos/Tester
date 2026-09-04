import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const cd = Buffer.concat([t, data]);
  const c = crc32(cd);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(c);
  return Buffer.concat([len, t, data, crcB]);
}

function makePNG(size) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB

  // Draw: dark bg + mint green ring + dark green center
  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter none
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2;
      const cy = y - size / 2;
      const r  = Math.sqrt(cx * cx + cy * cy);
      const rr = size * 0.22; // corner radius approx
      const inBounds = (Math.abs(cx) < size/2 - rr || Math.abs(cy) < size/2 - rr);

      if (r < size * 0.30) {
        rawData.push(30, 58, 47);      // #1E3A2F center
      } else if (r < size * 0.42) {
        rawData.push(168, 230, 207);   // #A8E6CF ring
      } else {
        rawData.push(15, 15, 15);      // #0F0F0F bg
      }
    }
  }

  const raw = Buffer.from(rawData);
  const compressed = deflateSync(raw, { level: 6 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, makePNG(size));
  console.log(`✓ icon-${size}.png created`);
}
