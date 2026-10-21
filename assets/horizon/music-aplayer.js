/* The listening room uses APlayer (loaded from jsDelivr with a pinned version and SRI) for its playlist,
   seeking, volume and play order. The native <select> + <audio> player in the same section stays as the
   fallback: if APlayer cannot load or start, nothing here runs and the native controls remain usable. */
(() => {
  'use strict';
  const player = document.querySelector('.music-player');
  const mount = document.getElementById('aplayer');
  const select = document.getElementById('track-select');
  if (!player || !mount || !select || typeof window.APlayer !== 'function') return;

  const base = player.dataset.assetBase || '/assets/music/';
  // the native <select> is the single source of truth for the playlist
  const tracks = [...select.options].map((option) => ({
    name: option.textContent.trim(),
    artist: option.dataset.artist || '',
    url: base + encodeURIComponent(option.dataset.file),
    cover: base + encodeURIComponent(option.dataset.cover),
  }));

  let ap;
  try {
    ap = new window.APlayer({
      container: mount, audio: tracks, theme: '#075b9f', preload: 'metadata',
      autoplay: false, loop: 'all', order: 'list', volume: 0.85, mutex: true,
      listFolded: false, listMaxHeight: '420px', lrcType: 0,
    });
  } catch (error) {
    return;
  }

  // APlayer is running: retire the fallback so it neither shows nor downloads anything
  const nativeAudio = document.getElementById('music-audio');
  if (nativeAudio) { nativeAudio.pause(); nativeAudio.removeAttribute('src'); nativeAudio.load(); }
  player.querySelector('.native-player')?.setAttribute('hidden', '');
  mount.hidden = false;
  player.classList.add('has-aplayer');

  const title = document.getElementById('track-title');
  const artist = document.getElementById('track-artist');
  const cover = document.getElementById('track-cover');
  const file = document.getElementById('track-file');
  const show = (index) => {
    const track = tracks[index];
    if (!track) return;
    title.textContent = track.name;
    artist.textContent = track.artist;
    if (cover.getAttribute('src') !== track.cover) { cover.src = track.cover; cover.alt = track.name + ' cover art'; }
    if (file) file.href = track.url;
  };
  ap.on('listswitch', (event) => show(event && typeof event.index === 'number' ? event.index : ap.list.index));
  const playing = (on) => player.classList.toggle('is-playing', on);
  ap.on('play', () => playing(true));
  ap.on('pause', () => playing(false));
  ap.on('ended', () => playing(false));
  show(ap.list.index || 0);

  // the large cover doubles as a play/pause control
  cover.setAttribute('role', 'button');
  cover.tabIndex = 0;
  const label = () => cover.setAttribute('aria-label', (ap.audio.paused ? 'Play ' : 'Pause ') + title.textContent);
  label();
  ['play', 'pause', 'listswitch'].forEach((type) => ap.on(type, () => setTimeout(label)));
  cover.addEventListener('click', () => ap.toggle());
  cover.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); ap.toggle(); } });
})();
