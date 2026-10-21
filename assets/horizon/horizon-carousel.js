(() => {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('.landscape-track');
  const slides = [...track.children];
  const dots = [...carousel.querySelectorAll('[data-slide]')];
  const previous = carousel.querySelector('[data-previous]');
  const next = carousel.querySelector('[data-next]');
  const caption = carousel.querySelector('.landscape-caption [data-caption]');
  const count = carousel.querySelector('[data-count]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = -1;
  let destination = null;
  const nearest = () => slides.reduce((best, slide, i) => Math.abs(slide.offsetLeft - track.scrollLeft) < Math.abs(slides[best].offsetLeft - track.scrollLeft) ? i : best, 0);
  const update = () => {
    const visible = nearest();
    if (current === visible) return;
    current = visible;
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === current)));
    caption.textContent = slides[current].dataset.caption;
    count.textContent = `${current + 1} / ${slides.length}`;
  };
  const go = index => {
    const bounded = Math.max(0, Math.min(slides.length - 1, index));
    destination = bounded;
    track.scrollTo({left: slides[bounded].offsetLeft, behavior: reduced.matches ? 'instant' : 'smooth'});
  };
  previous.addEventListener('click', () => go((destination ?? current) - 1));
  next.addEventListener('click', () => go((destination ?? current) + 1));
  dots.forEach(dot => dot.addEventListener('click', () => go(Number(dot.dataset.slide))));
  track.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    go(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : (destination ?? current) + (event.key === 'ArrowRight' ? 1 : -1));
  });
  track.addEventListener('scroll', update, {passive: true});
  track.addEventListener('scrollend', () => {destination = null;});
  track.addEventListener('wheel', () => {destination = null;}, {passive: true});
  // Touch uses native scrolling and snapping. Mouse dragging uses the same track.
  let drag;
  track.addEventListener('pointerdown', event => {
    destination = null;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = {x: event.clientX, left: track.scrollLeft};
    track.setPointerCapture(event.pointerId);
    track.classList.add('is-dragging');
  });
  track.addEventListener('pointermove', event => {
    if (drag) track.scrollLeft = drag.left - (event.clientX - drag.x);
  });
  const finish = () => {
    if (!drag) return;
    drag = null;
    track.classList.remove('is-dragging');
    go(nearest());
  };
  track.addEventListener('pointerup', finish);
  track.addEventListener('pointercancel', finish);
  track.addEventListener('lostpointercapture', finish);
  new ResizeObserver(() => {destination = null;track.scrollTo({left: slides[current].offsetLeft, behavior: 'instant'}); update();}).observe(track);
  carousel.querySelector('.landscape-controls').hidden = false;
  update();
})();
