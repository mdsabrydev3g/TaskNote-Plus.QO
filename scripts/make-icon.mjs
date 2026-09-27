// Pure-Node PNG icon generator (no native deps): public/icons/icon-512.png
// Draw: rounded-square gradient + 4-point sparkle + two "note" bars.
import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";

const S = 512;
const px = Buffer.alloc(S * S * 3);

const c1 = [99, 102, 241]; // #6366f1
const c2 = [79, 70, 229];  // #4f46e5
const white = [255, 255, 255];

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
function inRoundedRect(x, y, x0, y0, w, h, r) {
  if (x < x0 || x >= x0 + w || y < y0 || y >= y0 + h) return false;
  const cx = Math.min(Math.max(x, x0 + r), x0 + w - r);
  const cy = Math.min(Math.max(y, y0 + r), y0 + h - r);
  if (x < x0 + r && y < y0 + r) return (x - (x0 + r)) ** 2 + (y - (y0 + r)) ** 2 <= r * r || (x >= cx && y >= cy);
  return true;
}
// proper rounded-corner test for all 4 corners
function rounded(x, y) {
  const r = 110, pad = 28;
  if (x < pad || y < pad || x >= S - pad || y >= S - pad) return false;
  const corners = [[pad + r, pad + r], [S - pad - r, pad + r], [pad + r, S - pad - r], [S - pad - r, S - pad - r]];
  for (const [cx, cy] of corners) {
    const inCornerZone = Math.abs(x - cx) >= r - 0.0001 ? false : false;
    void inCornerZone;
  }
  // simple: if in a corner square, test distance
  const near = (v, c) => Math.abs(v - c);
  for (const [cx, cy] of corners) {
    if (near(x, cx) <= r && near(y, cy) <= r) {
      const dx = x - cx, dy = y - cy;
      if (Math.abs(dx) <= r && Math.abs(dy) <= r) {
        // only test the quarter facing outward
        const qx = cx < S / 2 ? dx < -0 : dx > 0;
        const qy = cy < S / 2 ? dy < -0 : dy > 0;
        if (qx && qy && dx * dx + dy * dy > r * r) return false;
      }
    }
  }
  return true;
}
function inStar(x, y, cx, cy, R, r0) {
  // 4-point star polygon (8 vertices)
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r0;
    pts.push([cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)]);
  }
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inBar(x, y, x0, y0, w, h) {
  if (x < x0 || x >= x0 + w || y < y0 || y >= y0 + h) return false;
  const r = 12;
  const cx = x < x0 + r ? x0 + r : x > x0 + w - r ? x0 + w - r : x;
  const cy = y < y0 + r ? y0 + r : y > y0 + h - r ? y0 + h - r : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r || (x >= x0 + r && x <= x0 + w - r && y >= y0 && y <= y0 + h) || (y >= y0 + r && y <= y0 + h - r && x >= x0 && x <= x0 + w);
}

for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    let col;
    if (!rounded(x, y)) col = [0, 0, 0]; // transparent-ish black corners (no alpha for simplicity)
    else {
      const t = y / S;
      col = [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
      const star = inStar(x, y, 256, 210, 118, 34);
      const bar1 = inBar(x, y, 128, 352, 256, 30);
      const bar2 = inBar(x, y, 128, 404, 170, 30);
      if (star || bar1 || bar2) col = white;
    }
    const i = (y * S + x) * 3;
    px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2];
  }
}

// PNG encode (RGB8, non-interlaced)
const raw = Buffer.alloc(S * (S * 3 + 1));
for (let y = 0; y < S; y++) {
  raw[y * (S * 3 + 1)] = 0; // filter none
  px.copy(raw, y * (S * 3 + 1) + 1, y * S * 3, (y + 1) * S * 3);
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  let c = ~0;
  for (const b of td) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  crc.writeUInt32BE(~c >>> 0);
  return Buffer.concat([len, td, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-512.png", Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]));
console.log("wrote public/icons/icon-512.png");
