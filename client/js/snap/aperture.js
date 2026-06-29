export function initAperture() {
  if (typeof window.ScrollTrigger === 'undefined') return;
  window.gsap.registerPlugin(window.ScrollTrigger);

  const VB = 1000;
  const CX = VB / 2, CY = VB / 2;
  const BLADE_COUNT = 8;
  const PIVOT_R = 430;      
  const BLADE_REACH = 620;  
  const BLADE_WIDTH = 130;  

  const irisBladeGroup = document.getElementById('irisBladeGroup');
  const irisRim = document.getElementById('irisRim');
  const apertureOverlay = document.getElementById('aperture-overlay');
  if (!irisBladeGroup || !irisRim || !apertureOverlay) return;

  const blades = [];

  for (let i = 0; i < BLADE_COUNT; i++) {
    const angle = (i / BLADE_COUNT) * Math.PI * 2;
    const px = CX + PIVOT_R * Math.cos(angle);
    const py = CY + PIVOT_R * Math.sin(angle);

    const dirX = Math.cos(angle + Math.PI); 
    const dirY = Math.sin(angle + Math.PI);
    const perpX = -dirY, perpY = dirX; 

    const tipX = px + dirX * BLADE_REACH;
    const tipY = py + dirY * BLADE_REACH;

    const baseLX = px + perpX * BLADE_WIDTH;
    const baseLY = py + perpY * BLADE_WIDTH;
    const baseRX = px - perpX * BLADE_WIDTH;
    const baseRY = py - perpY * BLADE_WIDTH;

    const tipLX = tipX + perpX * (BLADE_WIDTH * 0.35);
    const tipLY = tipY + perpY * (BLADE_WIDTH * 0.35);
    const tipRX = tipX - perpX * (BLADE_WIDTH * 0.35);
    const tipRY = tipY - perpY * (BLADE_WIDTH * 0.35);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${baseLX} ${baseLY} L ${tipLX} ${tipLY} L ${tipRX} ${tipRY} L ${baseRX} ${baseRY} Z`;
    path.setAttribute('d', d);
    path.setAttribute('class', 'iris-blade');
    irisBladeGroup.appendChild(path);

    blades.push({ el: path, px, py, openRot: 95, closedRot: -5 });
  }

  function setIrisProgress(t){
    const clamped = Math.max(0, Math.min(1, t));
    blades.forEach(b => {
      const rot = b.openRot + (b.closedRot - b.openRot) * clamped;
      b.el.setAttribute('transform', `rotate(${rot} ${b.px} ${b.py})`);
    });
    irisRim.setAttribute('r', 230 - clamped * 200);
    apertureOverlay.classList.toggle('iris-visible', clamped > 0.02);
  }
  setIrisProgress(0);

  let apertureBusy = false;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function playApertureCycle(){
    if (apertureBusy) return;
    apertureBusy = true;

    if (prefersReducedMotion) {
      setIrisProgress(1);
      setTimeout(() => { setIrisProgress(0); apertureBusy = false; }, 120);
      return;
    }

    const state = { t: 0 };
    window.gsap.timeline({ onComplete: () => { apertureBusy = false; } })
      .to(state, { t: 1, duration: 0.34, ease: 'power3.in', onUpdate: () => setIrisProgress(state.t) })
      .to(state, { t: 0, duration: 0.42, ease: 'power3.out', delay: 0.05, onUpdate: () => setIrisProgress(state.t) });
  }

  const zones = Array.from(document.querySelectorAll('[data-aperture-zone]'));
  zones.forEach((zone, i) => {
    if (i === 0) return;
    window.ScrollTrigger.create({
      trigger: zone,
      start: 'top 70%',
      onEnter: () => playApertureCycle(),
      onEnterBack: () => playApertureCycle(),
    });
  });
}