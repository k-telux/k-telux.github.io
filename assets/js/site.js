/* ponytail: native details and dialog provide keyboard behavior without a UI library. */
(() => {
  const menu = document.querySelector('.nav-menu');
  const current = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if ((new URL(link.href).pathname.replace(/\/$/, '') || '/') === current) link.setAttribute('aria-current', 'page');
  });
  const closeMenu = returnFocus => {
    if (!menu?.open) return;
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
    let opener;
    galleryLinks.forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      opener = link;
      preview.alt = link.querySelector('img').alt;
      preview.hidden = true;
      status.textContent = 'Loading image…';
      dialog.querySelector('.image-caption').textContent = preview.alt;
      dialog.querySelector('a').href = link.href;
      preview.src = link.href;
      dialog.showModal();
      document.body.classList.add('dialog-open');
    }));
    preview.addEventListener('load', () => { preview.hidden = false; status.textContent = ''; });
    preview.addEventListener('error', () => { status.textContent = 'This image could not load. Try opening the original image below.'; });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      opener?.focus();
    });
  }
})();
