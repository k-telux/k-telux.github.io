/* "Download all tracks": the WAV files already published on this site are packed into one ZIP inside the
   visitor's browser, so no 500 MB archive has to live in the repository (GitHub refuses files over 100 MB).
   Entries are stored uncompressed, the way WAV audio is normally archived. Without JavaScript the link
   opens the folder on GitHub, where every file can still be downloaded. */
(() => {
  'use strict';
  const link = document.getElementById('download-all');
  const status = document.getElementById('download-status');
  const select = document.getElementById('track-select');
  const player = document.querySelector('.music-player');
  if (!link || !status || !select || !player || typeof fetch !== 'function' || typeof Blob !== 'function') return;

  const base = player.dataset.assetBase || '/assets/music/';
  const files = [...select.options].map((option) => option.dataset.file);
  // archive names follow the playlist ("04 Forever Breath - YU.wav"), not the storage file names
  const safe = (text) => text.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim();
  const titles = [...select.options].map((option, i) => `${String(i + 1).padStart(2, '0')} ${safe(option.textContent)}${option.dataset.artist ? ' - ' + safe(option.dataset.artist) : ''}.wav`);
  const label = link.innerHTML;
  let controller = null;

  // CRC-32 (IEEE), as the ZIP format requires
  const table = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc32 = (crc, bytes) => { crc = ~crc >>> 0; for (let i = 0; i < bytes.length; i++) crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8); return ~crc >>> 0; };

  const dosTime = (d) => ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff;
  const dosDate = (d) => (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
  const header = (size, fill) => { const buffer = new ArrayBuffer(size); fill(new DataView(buffer)); return new Uint8Array(buffer); };
  const say = (text, state = 'idle') => { status.textContent = text; if (status.dataset.state !== state) status.dataset.state = state; };
  const mb = (bytes) => (bytes / 1e6).toFixed(0) + ' MB';

  async function build(signal) {
    const now = new Date(), time = dosTime(now), date = dosDate(now);
    const encoder = new TextEncoder();
    const parts = [], central = [];
    let offset = 0, done = 0, total = 0;
    // sizes first, so progress can be reported across the whole set
    const sizes = await Promise.all(files.map((file) => fetch(base + encodeURIComponent(file), { method: 'HEAD', signal })
      .then((r) => Number(r.headers.get('content-length')) || 0).catch(() => 0)));
    total = sizes.reduce((a, b) => a + b, 0);

    for (let i = 0; i < files.length; i++) {
      const name = encoder.encode('Zhongqi Xiu - Listening room/' + titles[i]);
      const response = await fetch(base + encodeURIComponent(files[i]), { signal });
      if (!response.ok || !response.body) throw new Error('Track ' + (i + 1) + ' could not be fetched (' + response.status + ').');
      const reader = response.body.getReader();
      const chunks = [];
      let crc = 0, size = 0;
      for (;;) {
        const { done: end, value } = await reader.read();
        if (end) break;
        crc = crc32(crc, value);
        size += value.length;
        done += value.length;
        chunks.push(value);
        say(`Packing track ${i + 1} of ${files.length}… ${total ? Math.min(99, Math.round((done / total) * 100)) + '%' : mb(done)}`, 'loading');
      }
      const data = new Blob(chunks);
      chunks.length = 0;
      const local = header(30, (v) => {
        v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, 0, true);
        v.setUint16(10, time, true); v.setUint16(12, date, true); v.setUint32(14, crc, true);
        v.setUint32(18, size, true); v.setUint32(22, size, true); v.setUint16(26, name.length, true); v.setUint16(28, 0, true);
      });
      central.push(header(46, (v) => {
        v.setUint32(0, 0x02014b50, true); v.setUint16(4, 20, true); v.setUint16(6, 20, true); v.setUint16(8, 0x0800, true); v.setUint16(10, 0, true);
        v.setUint16(12, time, true); v.setUint16(14, date, true); v.setUint32(16, crc, true); v.setUint32(20, size, true); v.setUint32(24, size, true);
        v.setUint16(28, name.length, true); v.setUint16(30, 0, true); v.setUint16(32, 0, true); v.setUint16(34, 0, true); v.setUint16(36, 0, true);
        v.setUint32(38, 0, true); v.setUint32(42, offset, true);
      }), name);
      parts.push(local, name, data);
      offset += local.length + name.length + size;
    }
    const directory = central.reduce((sum, part) => sum + part.length, 0);
    const end = header(22, (v) => {
      v.setUint32(0, 0x06054b50, true); v.setUint16(4, 0, true); v.setUint16(6, 0, true); v.setUint16(8, files.length, true);
      v.setUint16(10, files.length, true); v.setUint32(12, directory, true); v.setUint32(16, offset, true); v.setUint16(20, 0, true);
    });
    return new Blob([...parts, ...central, end], { type: 'application/zip' });
  }

  link.addEventListener('click', async (event) => {
    event.preventDefault();
    if (controller) { controller.abort(); return; } // a second press cancels
    controller = new AbortController();
    link.innerHTML = 'Cancel download <span aria-hidden="true">×</span>';
    link.setAttribute('aria-busy', 'true');
    say('Preparing the tracks…', 'loading');
    try {
      const zip = await build(controller.signal);
      const url = URL.createObjectURL(zip);
      const save = document.createElement('a');
      save.href = url;
      save.download = 'Zhongqi-Xiu-listening-room-WAV.zip';
      document.body.append(save);
      save.click();
      save.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      say(`Ready: ${files.length} tracks, ${mb(zip.size)}. Your browser is saving the ZIP.`, 'success');
    } catch (error) {
      if (error.name === 'AbortError') say('Download cancelled.', 'idle');
      else say('The tracks could not be packed. ' + (error.message || '') + ' You can try again, or download them one by one on GitHub.', 'error');
    } finally {
      controller = null;
      link.innerHTML = label;
      link.removeAttribute('aria-busy');
    }
  });
})();
