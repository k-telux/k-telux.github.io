/* ponytail: native cross-document transitions keep ordinary links and history. */
addEventListener('pagereveal', event => {
  if (!event.viewTransition) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    event.viewTransition.skipTransition();
    return;
  }
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
