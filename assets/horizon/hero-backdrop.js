/* Home hero: the landscape photographs sit behind the introduction as a faint backdrop and crossfade slowly while
   the hero is in view. Only the first photograph loads with the page:
   the others are fetched just before their turn. With reduced motion the first one stays. */
(() => {
  'use strict';
  const back = document.querySelector('.hero-backdrop');
  if (!back || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const imgs = [...back.querySelectorAll('img')];
  if (imgs.length < 2) return;
  let current = 0, timer = 0, inView = true, loading = false;
  const load = (img) => {
    const source = img.previousElementSibling;
    if (source?.dataset.srcset) { source.srcset = source.dataset.srcset; delete source.dataset.srcset; }
    if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
    return img.decode ? img.decode() : Promise.resolve();
  };
  const next = () => {
    if (loading) return;
    // the next photograph that has not failed to load
    let n = current; do n = (n + 1) % imgs.length; while (n !== current && imgs[n].dataset.failed);
    if (n === current) return;
    const img = imgs[n];
    loading = true;
    load(img).then(() => {
      // the outgoing photograph keeps drifting while it fades; the incoming one starts its drift afresh
      img.classList.remove('is-drift'); void img.offsetWidth; img.classList.add('is-drift', 'is-on');
      imgs[current].classList.remove('is-on'); current = n;
    }).catch(() => { img.dataset.failed = '1'; }).finally(() => { loading = false; });
  };
  const run = () => { clearInterval(timer); timer = inView && !document.hidden ? setInterval(next, 7000) : 0; };
  imgs[0].classList.add('is-drift');
  if (typeof IntersectionObserver !== 'undefined') new IntersectionObserver(([e]) => { inView = e.isIntersecting; run(); }).observe(back);
  document.addEventListener('visibilitychange', run);
  run();
})();
