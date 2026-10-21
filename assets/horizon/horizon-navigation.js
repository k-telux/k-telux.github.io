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
