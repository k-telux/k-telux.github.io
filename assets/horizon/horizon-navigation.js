/* ponytail: native cross-document transitions keep ordinary links and history. */
addEventListener('pagereveal', event => {
  if (!event.viewTransition) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    event.viewTransition.skipTransition();
    return;
  }
  // Work that can wait (building the research scenes) holds off until the handover has finished.
  window.horizonArrival = event.viewTransition.finished.then(() => {}, () => {});
  // Keep destination content visible in the snapshot; avoid a second reveal.
  document.documentElement.classList.add('cross-page-arrival');
  const routes = ['/', '/projects/', '/software/', '/publications/', '/cv/', '/resource/', '/gallery/', '/contact/'];
  const activation = window.navigation?.activation;
  const from = activation?.from?.url ? routes.indexOf(new URL(activation.from.url).pathname) : -1;
  const to = routes.indexOf(location.pathname);
  document.documentElement.dataset.navDirection = from >= 0 && to >= 0 && to < from ? 'backward' : 'forward';
  const menu = document.querySelector('.nav-menu');
  if (menu) menu.open = matchMedia('(min-width: 1001px)').matches;
});
addEventListener('pageswap', event => {
  if (event.viewTransition && !matchMedia('(min-width: 1001px)').matches) {
    const menu = document.querySelector('.nav-menu');
    if (menu) menu.open = false;
  }
});

/* The other pages are fetched ahead of the click. Where the browser reads the speculation rules in the page head
   it does that itself (and renders a page in the background once its link is hovered); elsewhere a page is
   fetched into the cache the moment the pointer, a finger or the keyboard reaches its link. */
if (!HTMLScriptElement.supports?.('speculationrules')) {
  const warmed = new Set([location.pathname]);
  const warm = (event) => {
    const link = event.target.closest?.('.nav-links a, .brand-home');
    if (!link || link.origin !== location.origin || warmed.has(link.pathname)) return;
    if (navigator.connection?.saveData) return;
    warmed.add(link.pathname);
    const hint = document.createElement('link');
    if (hint.relList?.supports?.('prefetch')) { hint.rel = 'prefetch'; hint.href = link.href; document.head.append(hint); }
    else fetch(link.href, { credentials: 'same-origin' }).catch(() => {});
  };
  ['pointerover', 'touchstart', 'focusin'].forEach((type) => addEventListener(type, warm, { passive: true, capture: true }));
}

/* The bar under the current page's link slides from where it stood on the page being left. It is an ordinary
   element in the new header, moved by a compositor transform, so it stays sharp and keeps moving even while the
   new page is still busy starting up. */
(() => {
  const KEY = 'horizon-nav-bar';
  const bar = () => document.querySelector('.nav-links a[aria-current="page"] .nav-indicator');
  const save = () => {
    const b = bar(), r = b && b.getBoundingClientRect();
    try { if (r && r.width) sessionStorage.setItem(KEY, JSON.stringify({ x: r.left, w: r.width, t: Date.now() })); else sessionStorage.removeItem(KEY); } catch { }
  };
  addEventListener('pageswap', save);
  addEventListener('pagehide', save);
  const slide = () => {
    let from; try { from = JSON.parse(sessionStorage.getItem(KEY)); sessionStorage.removeItem(KEY); } catch { }
    const b = bar();
    if (!from || !b || Date.now() - from.t > 4000 || matchMedia('(prefers-reduced-motion: reduce)').matches || !b.animate) return;
    const r = b.getBoundingClientRect();
    if (!r.width || (Math.abs(from.x - r.left) < 1 && Math.abs(from.w - r.width) < 1)) return;
    b.animate([{ transform: `translateX(${from.x - r.left}px) scaleX(${from.w / r.width})`, transformOrigin: '0 50%' }, { transform: 'none', transformOrigin: '0 50%' }],
      { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  // as soon as the new page can show its header: at the first frame of a transition, or once the header is parsed
  let done = false;
  const once = () => { if (!done && bar()) { done = true; slide(); } };
  addEventListener('pagereveal', once);
  document.addEventListener('DOMContentLoaded', once);
})();
