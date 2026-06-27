/* =========================================================
   GLITCH EFFECT — applied to headings, eyebrows, project
   names, and status tags. Glitches continuously while the
   element is in the viewport, stops when scrolled past.

   Implementation: wraps each target's direct text node in a
   relatively-positioned span, then overlays two absolutely
   positioned duplicate-text layers (RGB-split slices). This
   avoids ::before/::after so it never collides with an
   element's own existing pseudo-elements (e.g. .eyebrow's
   "//" prefix, which uses ::before already).
   ========================================================= */
(function(){
  const targets = document.querySelectorAll('.eyebrow, h1, h2, .pname, .pstatus');

  targets.forEach(el => {
    let textContent = '';
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) textContent += node.textContent;
    });
    const trimmed = textContent.trim();
    if (!trimmed) return;

    // Remove the original text node(s), replace with a wrapped base span.
    const toRemove = [];
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) toRemove.push(node);
    });
    toRemove.forEach(node => el.removeChild(node));

    const base = document.createElement('span');
    base.className = 'glitch-base';
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

    // Insert the wrapped base as the first child, preserving any
    // existing nested elements (placeholder tags, badges, cursor) after it.
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
})();
