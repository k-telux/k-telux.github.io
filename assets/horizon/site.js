/* ponytail: native details and dialog provide keyboard behavior without a UI library. */
(() => {
  const menu = document.querySelector('.nav-menu');
  const desktopMenu = matchMedia('(min-width: 1001px)');
  const syncMenu = () => { if (menu) menu.open = desktopMenu.matches; };
  syncMenu();
  desktopMenu.addEventListener('change', syncMenu);
  const current = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if ((new URL(link.href).pathname.replace(/\/$/, '') || '/') === current) link.setAttribute('aria-current', 'page');
  });
  const closeMenu = returnFocus => {
    if (desktopMenu.matches || !menu?.open) return;
    menu.open = false;
    if (returnFocus) menu.querySelector('summary').focus();
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (menu && !menu.contains(event.target)) closeMenu(false);
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu(false)));

  function openLinkedProject() {
    if (!/^#project-\d+$/.test(location.hash)) return;
    const target = document.querySelector(location.hash);
    if (!target) return;
    const input = document.querySelector('#project-search');
    if (input?.value) {
      input.value = '';
      input.dispatchEvent(new Event('input'));
    }
    target.querySelector('details')?.setAttribute('open', '');
    target.scrollIntoView({ block: 'start' });
  }
  openLinkedProject();
  window.addEventListener('hashchange', openLinkedProject);

  const search = document.querySelector('#project-search');
  if (search) {
    const projects = [...document.querySelectorAll('.project-item')];
    const count = document.querySelector('#project-count');
    const empty = document.querySelector('#project-empty');
    const clear = document.querySelector('#clear-search');
    const filter = () => {
      const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let visible = 0;
      projects.forEach(project => {
        project.hidden = !terms.every(term => project.textContent.toLowerCase().includes(term));
        if (!project.hidden) visible++;
      });
      count.textContent = `${visible} of ${projects.length} projects`;
      empty.hidden = visible > 0;
      clear.hidden = !search.value;
    };
    search.addEventListener('input', filter);
    clear.addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
    filter();
  }

  const galleryLinks = document.querySelectorAll('.gallery-image');
  if (galleryLinks.length && typeof HTMLDialogElement !== 'undefined') {
    const dialog = document.createElement('dialog');
    dialog.className = 'image-dialog';
    dialog.setAttribute('aria-label', 'Image viewer');
    dialog.innerHTML = '<form method="dialog"><button class="dialog-close" aria-label="Close image viewer">Close <span aria-hidden="true">×</span></button></form><p id="image-status" role="status"></p><img alt=""><p class="image-caption"></p><a class="text-link" target="_blank" rel="noopener">Open original image ↗</a>';
    document.body.append(dialog);
    const preview = dialog.querySelector('img');
    const status = dialog.querySelector('#image-status');
    let opener, full;
    // The picture flies between its thumbnail and the viewer (FLIP), unless motion is reduced.
    const canFly = () => typeof preview.animate === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fitted = (el, w, h) => { const r = el.getBoundingClientRect(); const s = Math.min(r.width / w, r.height / h); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: w * s }; };
    const fly = (thumb, back) => {
      const w = thumb.naturalWidth, h = thumb.naturalHeight;
      if (!canFly() || !w || !h) return;
      const from = fitted(thumb, w, h), to = fitted(preview, w, h);
      if (!to.w || !from.w) return;
      const away = `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.w / to.w})`;
      dialog.style.overflow = 'visible';
      const run = preview.animate([{ transform: back ? 'none' : away }, { transform: back ? away : 'none' }],
        { duration: back ? 420 : 580, easing: 'cubic-bezier(.16,1,.3,1)', fill: back ? 'forwards' : 'none' });
      run.onfinish = run.oncancel = () => { dialog.style.overflow = ''; if (back) run.cancel(); };
    };
    galleryLinks.forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      opener = link;
      const thumb = link.querySelector('img');
      preview.alt = thumb.alt;
      dialog.querySelector('.image-caption').textContent = preview.alt;
      dialog.querySelector('a').href = link.href;
      // Show the picture the visitor just clicked right away; swap in the full-size file once it arrives.
      const shown = thumb.complete && thumb.naturalWidth > 0;
      preview.hidden = !shown;
      status.textContent = shown ? '' : 'Loading image…';
      if (shown) preview.src = thumb.currentSrc || thumb.src;
      const original = full = new Image();
      original.onload = () => { if (full === original) preview.src = link.href; };
      original.onerror = () => { if (full === original && shown) status.textContent = 'Showing a smaller preview; the original image could not load.'; };
      original.src = link.href;
      if (!shown) preview.src = link.href;
      dialog.showModal();
      document.body.classList.add('dialog-open');
      if (shown && canFly()) {
        preview.style.opacity = '0';
        preview.decode().catch(() => {}).then(() => { preview.style.opacity = ''; fly(thumb, false); });
      }
    }));
    preview.addEventListener('load', () => { preview.hidden = false; status.textContent = ''; });
    preview.addEventListener('error', () => { status.textContent = 'This image could not load. Try opening the original image below.'; });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      full = null;
      if (opener && !preview.hidden) fly(opener.querySelector('img'), true);
      document.body.classList.remove('dialog-open');
      opener?.focus({ preventScroll: true });
    });
  }
  const mobileProfile = matchMedia('(max-width: 760px)');
  document.querySelectorAll('[data-mobile-disclosure]').forEach(disclosure => {
    const syncProfile = () => { disclosure.open = !mobileProfile.matches; };
    syncProfile();
    mobileProfile.addEventListener('change', syncProfile);
  });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduce.matches && typeof IntersectionObserver !== 'undefined') {
    const items = [...document.querySelectorAll('[data-reveal]')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pictures = [...entry.target.querySelectorAll('img')];
          Promise.all(pictures.map(image => image.decode().catch(() => {}))).then(() => {
            // Paint the starting state even when images and styles are cached.
            requestAnimationFrame(() => requestAnimationFrame(() => entry.target.classList.add('is-visible')));
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
    items.forEach(item => {
      item.style.setProperty('--reveal-delay', Math.min(300, Math.max(0, Number(item.dataset.delay) || 0)) + 'ms');
      item.classList.add('reveal-ready');
      observer.observe(item);
    });
    reduce.addEventListener('change', event => {
      if (event.matches) {
        observer.disconnect();
        items.forEach(item => item.classList.remove('reveal-ready'));
      }
    });
  }
})();
