/* Horizon motion layer: progressive enhancement over site.js. Every animation is skipped when the
   visitor prefers reduced motion; state feedback (progress, file names, playing state) always works. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const moving = () => !reduce.matches;
  const ease = 'cubic-bezier(.16,1,.3,1)';
  const animate = (el, frames, options) => (moving() && el.animate ? el.animate(frames, { easing: ease, ...options }) : null);

  // Reading progress and a lifted header once the page scrolls.
  const header = document.querySelector('.site-header');
  if (header) {
    const bar = document.createElement('span');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    header.append(bar);
    let queued = false;
    const sync = () => {
      queued = false;
      const max = root.scrollHeight - innerHeight;
      header.style.setProperty('--scroll', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : '0');
      header.classList.toggle('is-scrolled', scrollY > 8);
    };
    const request = () => { if (!queued) { queued = true; requestAnimationFrame(sync); } };
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request);
    sync();
  }

  // Light that follows the pointer: the hero glow eases toward the cursor, cards track it directly.
  const hero = document.querySelector('.horizon-intro');
  if (hero && finePointer.matches) {
    let target = { x: 50, y: 42 }, current = { x: 50, y: 42 }, frame = 0;
    const step = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      hero.style.setProperty('--mx', current.x.toFixed(2) + '%');
      hero.style.setProperty('--my', current.y.toFixed(2) + '%');
      frame = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.05 ? requestAnimationFrame(step) : 0;
    };
    hero.addEventListener('pointermove', (event) => {
      if (!moving()) return;
      const r = hero.getBoundingClientRect();
      target = { x: ((event.clientX - r.left) / r.width) * 100, y: ((event.clientY - r.top) / r.height) * 100 };
      if (!frame) frame = requestAnimationFrame(step);
    });
    hero.addEventListener('pointerleave', () => { target = { x: 50, y: 42 }; if (!frame && moving()) frame = requestAnimationFrame(step); });
  }
  if (finePointer.matches) {
    const cards = '.horizon-research-card, .cv-research-card, .teaching-section, .cv-teaching, .cv-coursework';
    document.addEventListener('pointermove', (event) => {
      const card = event.target.closest && event.target.closest(cards);
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--px', (event.clientX - r.left) + 'px');
      card.style.setProperty('--py', (event.clientY - r.top) + 'px');
    }, { passive: true });
  }

  // Carousel: mark the photograph in view so it can settle, and soften caption changes.
  const carousel = document.querySelector('[data-carousel]');
  if (carousel && typeof IntersectionObserver !== 'undefined') {
    const track = carousel.querySelector('.landscape-track');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-active', entry.intersectionRatio > 0.55));
    }, { root: track, threshold: [0, 0.55, 1] });
    [...track.children].forEach((slide) => io.observe(slide));
    const caption = carousel.querySelector('.landscape-caption [data-caption]');
    if (caption) {
      new MutationObserver(() => animate(caption, [{ opacity: 0, transform: 'translateY(6px)', filter: 'blur(3px)' }, { opacity: 1, transform: 'none', filter: 'none' }], { duration: 450 }))
        .observe(caption, { childList: true, characterData: true, subtree: true });
    }
  }

  // Project search: results glide into their new places instead of jumping (FLIP).
  const search = document.querySelector('#project-search');
  if (search) {
    const items = [...document.querySelectorAll('.project-item')];
    const clear = document.querySelector('#clear-search');
    let before = null;
    const snapshot = () => { before = moving() ? new Map(items.filter((i) => !i.hidden).map((i) => [i, i.getBoundingClientRect().top])) : null; };
    const play = () => {
      if (!before) return;
      let arrivals = 0;
      items.forEach((item) => {
        if (item.hidden) return;
        const now = item.getBoundingClientRect().top;
        const was = before.get(item);
        if (was === undefined) animate(item, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: Math.min(arrivals++, 8) * 30, fill: 'backwards' });
        else if (Math.abs(was - now) > 1) animate(item, [{ transform: `translateY(${was - now}px)` }, { transform: 'none' }], { duration: 520 });
      });
      before = null;
    };
    // capture runs before site.js filters; the bubbling listener runs after it
    search.addEventListener('input', snapshot, true);
    search.addEventListener('input', play);
    if (clear) { clear.addEventListener('click', snapshot, true); clear.addEventListener('click', play); }
  }

  // Mobile menu: staggered links, and no closing animation inside a page-transition snapshot.
  document.querySelectorAll('.nav-links a').forEach((link, i) => link.style.setProperty('--i', i));
  addEventListener('pageswap', () => root.classList.add('is-leaving'));
  addEventListener('pageshow', () => root.classList.remove('is-leaving'));

  // Status messages (contact form, music player) arrive instead of popping in.
  document.querySelectorAll('.form-status').forEach((status) => {
    new MutationObserver(() => {
      if (status.textContent) animate(status, [{ opacity: 0, transform: 'translateY(-6px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 380 });
    }).observe(status, { attributes: true, attributeFilter: ['data-state'] });
  });

  // Attachments: show what was chosen, in English, and keep it in sync with resets.
  const files = document.querySelector('#files');
  const names = document.querySelector('#files-names');
  if (files && names) {
    const size = (bytes) => bytes < 1e6 ? Math.max(1, Math.round(bytes / 1e3)) + ' KB' : (bytes / 1e6).toFixed(1) + ' MB';
    const sync = () => {
      const list = [...files.files];
      const total = list.reduce((sum, f) => sum + f.size, 0);
      names.textContent = !list.length ? 'No file chosen' : (list.length === 1 ? list[0].name : list.length + ' files') + ' · ' + size(total);
    };
    files.addEventListener('change', sync);
    files.form?.addEventListener('reset', () => setTimeout(sync));
    sync();
  }

  // Music: a playing state for the cover, and covers that resolve in once the new image is ready.
  const player = document.querySelector('.music-player');
  const audio = document.querySelector('#music-audio');
  if (player && audio) {
    const sync = () => player.classList.toggle('is-playing', !audio.paused && !audio.ended);
    ['play', 'playing', 'pause', 'ended', 'emptied'].forEach((type) => audio.addEventListener(type, sync));
  }
  const cover = document.querySelector('#track-cover');
  if (cover) {
    new MutationObserver(() => {
      if (!moving()) return;
      cover.style.opacity = '0';
      const show = () => { cover.style.opacity = ''; animate(cover, [{ opacity: 0, transform: 'scale(.96)', filter: 'blur(8px)' }, { opacity: 1, transform: 'none', filter: 'none' }], { duration: 560 }); };
      if (cover.complete && cover.naturalWidth) requestAnimationFrame(show);
      else { cover.addEventListener('load', show, { once: true }); cover.addEventListener('error', show, { once: true }); }
    }).observe(cover, { attributes: true, attributeFilter: ['src'] });
  }
})();
