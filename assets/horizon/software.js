/* Software page: OpticalModeler stage (entrance, parallax, pointer light), work-mode tabs, install-command
   copy, and live GitHub star counts. Every motion is skipped for reduced motion; content works without JS. */
(() => {
  'use strict';
  const om = document.querySelector('[data-om]');
  if (!om) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const stage = om.querySelector('.om-stage');

  // depth: the render drifts slightly slower than the page, and a light follows the pointer
  if (!reduce.matches) {
    let queued = false;
    const drift = () => {
      queued = false;
      const r = stage.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      om.style.setProperty('--om-shift', (Math.max(-1, Math.min(1, r.top / innerHeight)) * 36).toFixed(1) + 'px');
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
    if (fine.matches) {
      stage.addEventListener('pointermove', (event) => {
        const r = stage.getBoundingClientRect();
        stage.style.setProperty('--mx', ((event.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        stage.style.setProperty('--my', ((event.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }
  }

  // work modes: an ARIA tab strip with a sliding indicator (all panels stay visible without JS)
  const modes = om.querySelector('[data-tabs]');
  if (modes) {
    const tabs = [...modes.querySelectorAll('[role=tab]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    const indicator = modes.querySelector('.om-tab-indicator');
    const place = (tab) => {
      indicator.style.left = tab.offsetLeft + 'px';
      indicator.style.top = tab.offsetTop + 'px';
      indicator.style.width = tab.offsetWidth + 'px';
      indicator.style.height = tab.offsetHeight + 'px';
      indicator.style.opacity = '1';
    };
    const select = (index, focus) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      place(tabs[index]);
      if (focus) tabs[index].focus();
    };
    modes.classList.add('is-tabs');
    panels.forEach((panel) => panel.setAttribute('tabindex', '0'));
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (event) => {
        const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(event.key in keys)) return;
        event.preventDefault();
        select((keys[event.key] + tabs.length) % tabs.length, true);
      });
    });
    select(1);
    addEventListener('resize', () => place(tabs.find((t) => t.getAttribute('aria-selected') === 'true')));
  }

  // install command: copy with visible confirmation
  om.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = document.querySelector(button.dataset.copy).textContent.trim();
      try { await navigator.clipboard.writeText(text); }
      catch { const area = Object.assign(document.createElement('textarea'), { value: text }); document.body.append(area); area.select(); document.execCommand('copy'); area.remove(); }
      button.textContent = 'Copied ✓';
      button.classList.add('is-done');
      clearTimeout(button._reset);
      button._reset = setTimeout(() => { button.textContent = 'Copy'; button.classList.remove('is-done'); }, 1800);
    });
  });

  // live star counts (cached for the session); the static numbers in the page stay if GitHub is unreachable
  const counters = [...document.querySelectorAll('[data-stars]')];
  const cacheKey = 'gh-stars-v1';
  let cache = {};
  try { cache = JSON.parse(sessionStorage.getItem(cacheKey) || '{}'); } catch { }
  const fresh = (entry) => entry && Date.now() - entry.t < 3600e3;
  let counted = false;
  function countUp() {
    if (counted) return;
    counted = true;
    counters.forEach((el) => {
      const to = Number(el.textContent) || 0;
      if (reduce.matches || to < 10) return;
      const start = performance.now(), duration = 1400;
      // aim at the live number if it arrives mid-count
      const tick = (now) => { const p = Math.min(1, (now - start) / duration); const target = Number(el.dataset.final) || to; el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  }
  counters.forEach((el) => {
    const repo = el.dataset.stars;
    const apply = (n) => { if (Number.isFinite(n)) { el.dataset.final = String(n); el.textContent = String(n); } };
    if (fresh(cache[repo])) { apply(cache[repo].n); return; }
    fetch('https://api.github.com/repos/' + repo, { headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || typeof data.stargazers_count !== 'number') return;
        apply(data.stargazers_count);
        cache[repo] = { n: data.stargazers_count, t: Date.now() };
        try { sessionStorage.setItem(cacheKey, JSON.stringify(cache)); } catch { }
      })
      .catch(() => { });
  });

  // entrance: the copy resolves in and the beam draws once the stage is on screen.
  // Kept last: arriving through a page transition or with reduced motion runs it immediately,
  // so everything it touches (countUp, counters) must already be initialised.
  const enter = () => { om.classList.add('is-in'); countUp(); };
  if (reduce.matches || typeof IntersectionObserver === 'undefined' || document.documentElement.classList.contains('cross-page-arrival')) enter();
  else new IntersectionObserver((entries, io) => { if (entries.some((e) => e.isIntersecting)) { enter(); io.disconnect(); } }, { threshold: 0.2 }).observe(stage);
})();
