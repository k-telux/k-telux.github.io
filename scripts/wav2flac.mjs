// Lossless WAV -> FLAC encoder with no dependencies (Node built-ins only), following RFC 9639.
//   node scripts/wav2flac.mjs <in.wav> <out.flac> [--title T] [--artist A]
// Integer PCM (16/24-bit) is encoded bit-exactly. 32-bit float input cannot be stored losslessly in FLAC;
// it is rounded to 24-bit integers and the largest rounding error is reported.
// Encoding: fixed predictors (order 0-4) chosen per subframe, partitioned Rice (RICE2) residuals,
// per-frame stereo decorrelation (independent / left-side / side-right / mid-side), constant subframes for
// digital silence, STREAMINFO with MD5 of the decoded samples, and a Vorbis comment block for tags.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const BLOCK = 4096;

// ---------- WAV ----------
function readWav(path) {
  const buf = readFileSync(path);
  if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WAVE') throw new Error('not a RIFF/WAVE file');
  let pos = 12, fmt = null, data = null;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('latin1', pos, pos + 4), len = buf.readUInt32LE(pos + 4);
    if (id === 'fmt ') {
      let tag = buf.readUInt16LE(pos + 8);
      if (tag === 0xfffe && len >= 40) tag = buf.readUInt16LE(pos + 8 + 24); // WAVE_FORMAT_EXTENSIBLE subformat
      fmt = { tag, channels: buf.readUInt16LE(pos + 10), rate: buf.readUInt32LE(pos + 12), bits: buf.readUInt16LE(pos + 22) };
    }
    if (id === 'data') { data = buf.subarray(pos + 8, pos + 8 + Math.min(len, buf.length - pos - 8)); break; }
    pos += 8 + len + (len & 1);
  }
  if (!fmt || !data) throw new Error('missing fmt or data chunk');
  const { channels, bits } = fmt;
  const frames = Math.floor(data.length / (channels * bits / 8));
  const ch = Array.from({ length: channels }, () => new Int32Array(frames));
  let outBits = bits, maxErr = 0;
  if (fmt.tag === 1 && (bits === 16 || bits === 24)) {
    const step = bits / 8;
    for (let i = 0, o = 0; i < frames; i++) for (let c = 0; c < channels; c++, o += step) ch[c][i] = bits === 16 ? data.readInt16LE(o) : data.readIntLE(o, 3);
  } else if (fmt.tag === 3 && bits === 32) {
    outBits = 24;
    for (let i = 0, o = 0; i < frames; i++) for (let c = 0; c < channels; c++, o += 4) {
      const s = data.readFloatLE(o) * 8388608, r = Math.max(-8388608, Math.min(8388607, Math.round(s)));
      maxErr = Math.max(maxErr, Math.abs(s - r));
      ch[c][i] = r;
    }
  } else throw new Error(`unsupported WAV format tag ${fmt.tag} / ${bits}-bit`);
  return { rate: fmt.rate, bits: outBits, channels: ch, frames, exact: fmt.tag === 1, maxErr, rawData: fmt.tag === 1 ? data.subarray(0, frames * channels * bits / 8) : null };
}

// ---------- bit writer ----------
class Bits {
  constructor(size) { this.buf = new Uint8Array(size); this.pos = 0; this.acc = 0; this.n = 0; }
  grow(extra) { if (this.pos + extra + 8 > this.buf.length) { const b = new Uint8Array((this.buf.length + extra) * 2); b.set(this.buf); this.buf = b; } }
  write(value, count) { // count <= 24 per call
    if (this.pos + 8 >= this.buf.length) this.grow(this.buf.length);
    this.acc = (this.acc * (1 << count)) + (value & ((1 << count) - 1)); this.n += count; // acc stays below 2^53
    while (this.n >= 8) { this.n -= 8; const div = 2 ** this.n; const byte = Math.floor(this.acc / div); this.buf[this.pos++] = byte; this.acc -= byte * div; }
  }
  writeBig(value, count) { if (count > 24) { this.write(Math.floor(value / 2 ** 24) & ((1 << (count - 24)) - 1), count - 24); this.write(value & 0xffffff, 24); } else this.write(value, count); }
  writeSigned(v, count) { const u = v < 0 ? v + 2 ** count : v; this.writeBig(u, count); }
  unary(q) { while (q >= 24) { this.write(0, 24); q -= 24; } this.write(1, q + 1); } // q zeros then a one
  align() { if (this.n) this.write(0, 8 - this.n); }
}

// ---------- CRCs ----------
const CRC8 = new Uint8Array(256), CRC16 = new Uint16Array(256);
for (let i = 0; i < 256; i++) {
  let c = i; for (let k = 0; k < 8; k++) c = c & 0x80 ? ((c << 1) ^ 0x07) & 0xff : (c << 1) & 0xff; CRC8[i] = c;
  let d = i << 8; for (let k = 0; k < 8; k++) d = d & 0x8000 ? ((d << 1) ^ 0x8005) & 0xffff : (d << 1) & 0xffff; CRC16[i] = d;
}
const crc8 = (b, s, e) => { let c = 0; for (let i = s; i < e; i++) c = CRC8[c ^ b[i]]; return c; };
const crc16 = (b, s, e) => { let c = 0; for (let i = s; i < e; i++) c = ((c << 8) & 0xffff) ^ CRC16[(c >> 8) ^ b[i]]; return c; };

// ---------- subframe analysis ----------
const res = new Int32Array(BLOCK);
function residual(x, n, order, out) {
  for (let i = order; i < n; i++) {
    switch (order) {
      case 0: out[i] = x[i]; break;
      case 1: out[i] = x[i] - x[i - 1]; break;
      case 2: out[i] = x[i] - 2 * x[i - 1] + x[i - 2]; break;
      case 3: out[i] = x[i] - 3 * x[i - 1] + 3 * x[i - 2] - x[i - 3]; break;
      default: out[i] = x[i] - 4 * x[i - 1] + 6 * x[i - 2] - 4 * x[i - 3] + x[i - 4];
    }
  }
}
const zig = (v) => (v >= 0 ? 2 * v : -2 * v - 1);
// choose partition order and Rice parameters; returns { bits, p, params }
function riceplan(r, n, order) {
  let maxP = 0;
  while (maxP < 8 && n % (1 << (maxP + 1)) === 0 && (n >> (maxP + 1)) > order) maxP++;
  const parts = 1 << maxP, size = n >> maxP;
  const sums = new Float64Array(parts), counts = new Int32Array(parts);
  for (let j = 0; j < parts; j++) {
    const s = j === 0 ? order : j * size, e = (j + 1) * size;
    let t = 0; for (let i = s; i < e; i++) t += zig(r[i]);
    sums[j] = t; counts[j] = e - s;
  }
  let best = null;
  for (let p = maxP; p >= 0; p--) {
    const g = 1 << (maxP - p), np = 1 << p, params = new Array(np);
    let bits = 0;
    for (let j = 0; j < np; j++) {
      let t = 0, c = 0; for (let q = j * g; q < (j + 1) * g; q++) { t += sums[q]; c += counts[q]; }
      let k = 0, kb = Infinity;
      const mean = c ? t / c : 0, k0 = mean > 1 ? Math.floor(Math.log2(mean)) : 0;
      for (let kk = Math.max(0, k0 - 1); kk <= Math.min(30, k0 + 1); kk++) { const b = c * (kk + 1) + Math.floor(t / 2 ** kk); if (b < kb) { kb = b; k = kk; } }
      params[j] = k; bits += 5 + kb;
    }
    if (!best || bits < best.bits) best = { bits, p, params };
  }
  // exact pass over the chosen layout: a partition whose Rice code would be long (outliers) is escaped
  // and stored as raw signed values instead
  const chosen = 1 << best.p, width = n >> best.p;
  for (let j = 0; j < chosen; j++) {
    const s = j === 0 ? order : j * width, e = (j + 1) * width, k = best.params[j];
    let rice = 0, maxAbs = 0;
    for (let i = s; i < e; i++) { rice += Math.floor(zig(r[i]) / 2 ** k) + 1 + k; maxAbs = Math.max(maxAbs, Math.abs(r[i])); }
    const raw = maxAbs === 0 ? 0 : Math.floor(Math.log2(maxAbs)) + 2;
    if (raw <= 31 && 5 + raw * (e - s) < rice) best.params[j] = { escape: raw };
  }
  return best;
}
// best encoding for one channel signal: { bits, kind, order, plan }
function analyse(x, n, bps) {
  let constant = true; for (let i = 1; i < n && constant; i++) if (x[i] !== x[0]) constant = false;
  if (constant) return { bits: 8 + bps, kind: 'constant' };
  let bestOrder = 0, bestSum = Infinity;
  for (let order = 0; order <= Math.min(4, n - 1); order++) {
    residual(x, n, order, res);
    let s = 0; for (let i = order; i < n; i++) s += Math.abs(res[i]);
    if (s < bestSum) { bestSum = s; bestOrder = order; }
  }
  residual(x, n, bestOrder, res);
  const plan = riceplan(res, n, bestOrder);
  const fixedBits = 8 + bestOrder * bps + 6 + plan.bits;
  if (fixedBits >= 8 + n * bps) return { bits: 8 + n * bps, kind: 'verbatim' };
  return { bits: fixedBits, kind: 'fixed', order: bestOrder, plan };
}
function writeSubframe(w, x, n, bps, a) {
  w.grow(n * 8 + 64);
  if (a.kind === 'constant') { w.write(0, 8); w.writeSigned(x[0], bps); return; }
  if (a.kind === 'verbatim') { w.write(0b00000010, 8); for (let i = 0; i < n; i++) w.writeSigned(x[i], bps); return; }
  w.write((0b001000 | a.order) << 1, 8); // pad bit 0, type FIXED(order), wasted-bits flag 0
  for (let i = 0; i < a.order; i++) w.writeSigned(x[i], bps);
  residual(x, n, a.order, res);
  w.write(0b01, 2); w.write(a.plan.p, 4); // RICE2, partition order
  const np = 1 << a.plan.p, size = n >> a.plan.p;
  for (let j = 0; j < np; j++) {
    const k = a.plan.params[j];
    const s = j === 0 ? a.order : j * size, e = (j + 1) * size;
    if (typeof k === 'object') { w.write(31, 5); w.write(k.escape, 5); if (k.escape) for (let i = s; i < e; i++) w.writeSigned(res[i], k.escape); continue; }
    w.write(k, 5);
    for (let i = s; i < e; i++) {
      const u = zig(res[i]), q = Math.floor(u / 2 ** k);
      w.unary(q);
      if (k) w.writeBig(u - q * 2 ** k, k);
    }
  }
}

// ---------- encoder ----------
function utf8Number(v) {
  if (v < 0x80) return [v];
  const out = []; let bytes = v < 0x800 ? 2 : v < 0x10000 ? 3 : v < 0x200000 ? 4 : v < 0x4000000 ? 5 : 6;
  for (let i = bytes - 1; i > 0; i--) { out.unshift(0x80 | (v & 0x3f)); v = Math.floor(v / 64); }
  out.unshift(((0xff00 >> bytes) & 0xff) | v);
  return out;
}
export function encode(wav, tags = {}) {
  const { rate, bits: bps, channels: chs, frames } = wav;
  if (chs.length !== 2 && chs.length !== 1) throw new Error('only mono or stereo');
  const w = new Bits(frames * chs.length * 3 + 4096);
  // fLaC + STREAMINFO (filled at the end) + VORBIS_COMMENT
  for (const c of 'fLaC') w.write(c.charCodeAt(0), 8);
  const infoAt = w.pos;
  w.write(0, 8); w.write(34, 24); for (let i = 0; i < 34; i++) w.write(0, 8);
  const vendor = Buffer.from('k-telux.github.io wav2flac');
  const comments = Object.entries(tags).filter(([, v]) => v).map(([k, v]) => Buffer.from(`${k.toUpperCase()}=${v}`));
  const vc = Buffer.concat([u32le(vendor.length), vendor, u32le(comments.length), ...comments.flatMap((c) => [u32le(c.length), c])]);
  w.write(0x80 | 4, 8); w.write(vc.length, 24); for (const b of vc) w.write(b, 8);

  const srCode = { 88200: 1, 176400: 2, 192000: 3, 8000: 4, 16000: 5, 22050: 6, 24000: 7, 32000: 8, 44100: 9, 48000: 10, 96000: 11 }[rate] ?? 0;
  const ssCode = { 8: 1, 12: 2, 16: 4, 20: 5, 24: 6, 32: 7 }[bps] ?? 0;
  const L = new Int32Array(BLOCK), R = new Int32Array(BLOCK), M = new Int32Array(BLOCK), S = new Int32Array(BLOCK);
  let minFrame = Infinity, maxFrame = 0, frameNo = 0;
  for (let start = 0; start < frames; start += BLOCK, frameNo++) {
    const n = Math.min(BLOCK, frames - start);
    const fs = w.pos;
    let assign, subs;
    if (chs.length === 2) {
      for (let i = 0; i < n; i++) { const l = chs[0][start + i], r = chs[1][start + i]; L[i] = l; R[i] = r; S[i] = l - r; M[i] = (l + r) >> 1; }
      const aL = analyse(L, n, bps), aR = analyse(R, n, bps), aS = analyse(S, n, bps + 1), aM = analyse(M, n, bps);
      const opts = [[aL.bits + aR.bits, 0b0001, [[L, bps, aL], [R, bps, aR]]], [aL.bits + aS.bits, 0b1000, [[L, bps, aL], [S, bps + 1, aS]]],
        [aS.bits + aR.bits, 0b1001, [[S, bps + 1, aS], [R, bps, aR]]], [aM.bits + aS.bits, 0b1010, [[M, bps, aM], [S, bps + 1, aS]]]];
      opts.sort((a, b) => a[0] - b[0]); [, assign, subs] = opts[0];
    } else {
      for (let i = 0; i < n; i++) L[i] = chs[0][start + i];
      assign = 0; subs = [[L, bps, analyse(L, n, bps)]];
    }
    // frame header
    w.write(0xff, 8); w.write(0xf8, 8);
    const bsCode = n === BLOCK ? 0b1100 : 0b0111;
    w.write((bsCode << 4) | srCode, 8);
    w.write((assign << 4) | (ssCode << 1), 8);
    for (const b of utf8Number(frameNo)) w.write(b, 8);
    if (bsCode === 0b0111) w.write(n - 1, 16);
    w.write(crc8(w.buf, fs, w.pos), 8);
    for (const [x, b, a] of subs) writeSubframe(w, x, n, b, a);
    w.align();
    w.write(crc16(w.buf, fs, w.pos), 16);
    const size = w.pos - fs; minFrame = Math.min(minFrame, size); maxFrame = Math.max(maxFrame, size);
  }
  // STREAMINFO
  const md5 = createHash('md5');
  if (wav.rawData) md5.update(wav.rawData);
  else { const bytes = bps / 8, out = Buffer.alloc(frames * chs.length * bytes); let o = 0; for (let i = 0; i < frames; i++) for (const c of chs) { out.writeIntLE(c[i], o, bytes); o += bytes; } md5.update(out); }
  const info = new Bits(64);
  info.write(BLOCK, 16); info.write(BLOCK, 16); info.write(minFrame, 24); info.write(maxFrame, 24);
  info.write(rate, 20); info.write(chs.length - 1, 3); info.write(bps - 1, 5); info.writeBig(frames, 36);
  info.buf.set(md5.digest(), info.pos);
  w.buf.set(info.buf.subarray(0, 34), infoAt + 4);
  return w.buf.subarray(0, w.pos);
}
function u32le(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; }

// ---------- CLI ----------
if (process.argv[1] && process.argv[1].endsWith('wav2flac.mjs')) {
  const args = process.argv.slice(2);
  const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
  const [input, output] = args;
  const t0 = Date.now();
  const wav = readWav(input);
  const flac = encode(wav, { title: opt('--title'), artist: opt('--artist') });
  writeFileSync(output, flac);
  const inSize = readFileSync(input).length;
  console.log(JSON.stringify({ input, output, rate: wav.rate, bits: wav.bits, samples: wav.frames, exact: wav.exact,
    maxRoundingErrorLSB: wav.exact ? 0 : +wav.maxErr.toFixed(4), wavMB: +(inSize / 1e6).toFixed(1), flacMB: +(flac.length / 1e6).toFixed(1),
    ratio: +(flac.length / inSize).toFixed(3), seconds: (Date.now() - t0) / 1000 }));
}
