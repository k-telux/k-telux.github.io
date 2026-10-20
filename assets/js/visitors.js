(() => {
  const button = document.querySelector('#load-map');
  const status = document.querySelector('#map-status');
  button?.addEventListener('click', () => {
    button.disabled = true;
    status.textContent = 'Loading the visitor globe…';
    const script = document.createElement('script');
    script.id = 'clstr_globe';
    script.src = 'https://clustrmaps.com/globe.js?d=ZZBhROD38mdLvw10E0oV3tSILSk4iM4WsGCTeuHtSTI';
    const fallback = () => {
      status.textContent = 'If the globe is not visible below, the visitor map is unavailable in this browser. You can still explore the rest of the site.';
    };
    script.addEventListener('error', fallback);
    script.addEventListener('load', fallback);
    document.querySelector('#map-container').append(script);
    setTimeout(fallback, 12000);
  }, { once: true });
})();
