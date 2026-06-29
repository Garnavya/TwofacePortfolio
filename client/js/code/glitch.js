export function initGlitch() {
  const targets = document.querySelectorAll('.eyebrow, h1, h2, .pname, .pstatus');

  targets.forEach(el => {
    let textContent = '';
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) textContent += node.textContent;
    });
    const trimmed = textContent.trim();
    if (!trimmed) return;

    const toRemove = [];
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) toRemove.push(node);
    });
    toRemove.forEach(node => el.removeChild(node));

    if (!el.hasAttribute('aria-label')) {
      el.setAttribute('aria-label', trimmed);
    }

    const base = document.createElement('span');
    base.className = 'glitch-base';
    base.setAttribute('aria-hidden', 'true');
    base.textContent = trimmed;

    const layerA = document.createElement('span');
    layerA.className = 'glitch-layer layer-a';
    layerA.textContent = trimmed;
    layerA.setAttribute('aria-hidden', 'true');

    const layerB = document.createElement('span');
    layerB.className = 'glitch-layer layer-b';
    layerB.textContent = trimmed;
    layerB.setAttribute('aria-hidden', 'true');

    base.appendChild(layerA);
    base.appendChild(layerB);

    el.insertBefore(base, el.firstChild);
    el.classList.add('glitch-host');
  });

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.glitch-host').forEach(el => el.classList.add('glitch-active'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('glitch-active', entry.isIntersecting);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.glitch-host').forEach(el => observer.observe(el));
}