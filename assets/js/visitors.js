(() => {
  const container = document.querySelector('#map-container');
  if (!container) return;
  const status = document.querySelector('#map-status');
  const retry = document.querySelector('#retry-map');
  const choices = [...document.querySelectorAll('[name="visitor-view"]')];
  const panels = {globe: document.querySelector('#visitor-globe'), map: document.querySelector('#visitor-map')};
  const states = {};
  let selected;
  const update = () => {
    const state = states[selected];
    container.setAttribute('aria-busy', String(state?.status === 'loading'));
    retry.hidden = state?.status !== 'error';
    status.textContent = state?.status === 'ready' ? (selected === 'globe' ? 'Hover over the globe to pause its rotation.' : 'Visitor locations on the world map.')
      : state?.status === 'error' ? 'This view could not load. Please try again or choose the other view.'
      : `Loading the visitor ${selected}…`;
  };
  function load(kind) {
    const state = states[kind] = {status:'loading'};
    const frame = document.createElement('iframe');
    state.frame = frame;
    frame.title = `${kind === 'globe' ? 'Rotating globe' : 'World map'} of visits to Zhongqi Xiu’s website`;
    frame.className = 'visitor-frame';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    // A separate document supplies the legacy widget's real load event and isolates its globals.
    frame.src = `/assets/horizon/visitor-widget.html?view=${kind}`;
    panels[kind].replaceChildren(frame);
    const finish = result => {
      if (state.status !== 'loading') return;
      state.status = result;
      clearInterval(poll); clearTimeout(timeout);
      if (result === 'error') frame.remove();
      if (selected === kind) update();
    };
    const poll = setInterval(() => {
      const doc = frame.contentDocument;
      if (doc?.documentElement.dataset.failed) return finish('error');
      const link = doc?.querySelector(kind === 'globe' ? '#mmvst_a' : '#mapmyvisitors-widget');
      const graphic = doc?.querySelector(kind === 'globe' ? '.mmvst_inner' : '.mapmyvisitors-map');
      if (!link?.href.includes('/web/1bzyq') || !graphic?.getBoundingClientRect().width) return;
      const style = frame.contentWindow.getComputedStyle(graphic);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      if (kind === 'map' && style.backgroundImage === 'none') return;
      link.href = 'https://mapmyvisitors.com/web/1bzyq';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      finish('ready');
    }, 250);
    const timeout = setTimeout(() => finish('error'), 15000);
  }
  function select(kind) {
    selected = kind;
    choices.forEach(choice => { choice.checked = choice.value === kind; });
    Object.entries(panels).forEach(([name, panel]) => { panel.hidden = name !== kind; });
    if (!states[kind]) load(kind);
    update();
  }
  choices.forEach(choice => choice.addEventListener('change', () => select(choice.value)));
  retry.addEventListener('click', () => { load(selected); update(); });
  // The stationary map is the default for people who request less motion.
  select(matchMedia('(prefers-reduced-motion: reduce)').matches ? 'map' : 'globe');
})();
