/* Home hero: the landscape photographs sit behind the introduction as a faint backdrop and crossfade slowly while
   the hero is in view; the caption beneath names the one showing. With reduced motion the first one stays. */
(() => {
  'use strict';
  const back = document.querySelector('.hero-backdrop');
  const caption = document.querySelector('[data-lens-caption]');
  if (!back || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const imgs = [...back.querySelectorAll('img')];
  if (imgs.length < 2) return;
  let current = 0, timer = 0, inView = true;
  const next = () => {
    const n = (current + 1) % imgs.length, img = imgs[n];
    img.loading = 'eager';
    (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => {
      imgs[current].classList.remove('is-on'); img.classList.add('is-on'); current = n;
      if (caption) {
        caption.textContent = img.dataset.caption || '';
        caption.animate?.([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  };
  const run = () => { clearInterval(timer); timer = inView && !document.hidden ? setInterval(next, 7000) : 0; };
  if (typeof IntersectionObserver !== 'undefined') new IntersectionObserver(([e]) => { inView = e.isIntersecting; run(); }).observe(back);
  document.addEventListener('visibilitychange', run);
  run();
})();
