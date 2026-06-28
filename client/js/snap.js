gsap.registerPlugin(ScrollTrigger);

function seededColor(seed){
  const hues = [28, 18, 40, 12, 34, 8, 46];
  const h = hues[seed % hues.length];
  return `linear-gradient(150deg, hsl(${h},45%,78%), hsl(${h+8},38%,58%))`;
}

let PHOTO_POOL = []; // Now a variable instead of a hardcoded constant

// Create an async initializer to fetch your generated JSON
async function initPhotos() {
  try {
    const res = await fetch('/photos/metadata.json');
    if (res.ok) {
      const data = await res.json();
      const ratios = [ [4,5], [1,1], [3,4], [5,4], [4,3] ];
      
      // Map your real JSON data into the format the UI expects
      PHOTO_POOL = data.map((photo, i) => {
        const ratio = ratios[i % ratios.length];
        return {
          ...photo,
          bg: seededColor(i + 1),
          ratioW: ratio[0],
          ratioH: ratio[1],
          location: photo.location,
          tag: photo.tag,
          story: photo.story
        };
      });
    }
  } catch(e) {
    console.warn("Could not load metadata.json. Gallery will be empty.", e);
  }

  // Once data is loaded, build the UI
  renderGallery();
}

/* =========================================================
   PINTEREST GALLERY — pure native masonry + lightbox
   ========================================================= */
const masonryGrid = document.getElementById('masonryGrid');
const masonryEmpty = document.getElementById('masonryEmpty');
const galleryCount = document.getElementById('galleryCount');

function renderGallery(){
  if (!masonryGrid) return;
  masonryGrid.innerHTML = '';
  
  if (masonryEmpty) {
    masonryEmpty.style.display = PHOTO_POOL.length === 0 ? 'block' : 'none';
  }
  
  if (galleryCount) {
    galleryCount.textContent = `${PHOTO_POOL.length} frames`;
  }

  PHOTO_POOL.forEach(photo => {
    const item = document.createElement('div');
    item.className = 'masonry-item';
    
    // Pure native rendering. 
    // width: 100% makes it fit the column.
    // height: auto lets the browser calculate the exact natural height of the photo file.
    // No object-fit, no forced aspect-ratios. 
    item.innerHTML = `
      <img class="mi-fill" src="${photo.img}" alt="${photo.title}" 
           style="background: ${photo.bg}; 
                  width: 100%; 
                  height: auto; 
                  display: block;">
    `;
    
    item.addEventListener('click', () => openLightbox(photo));
    masonryGrid.appendChild(item);
  });
}
renderGallery();

// --- Lightbox Logic ---
const lightbox = document.getElementById('lightbox');
const lbImage = document.getElementById('lbImage');
const lbInfo = document.getElementById('lbInfo');
const lbClose = document.getElementById('lbClose');

function openLightbox(photo){
  if (!lightbox) return;
  lbImage.style.background = photo.img ? `url(${photo.img}) center/contain no-repeat` : photo.bg;
  // Simplified output
  lbInfo.innerHTML = `
    <div class="lb-exif-grid">
      <div class="lb-row"><span class="lb-k">Camera</span><span class="lb-v">${photo.camera}</span></div>
      <div class="lb-row"><span class="lb-k">Lens</span><span class="lb-v">${photo.lens}</span></div>
      <div class="lb-row"><span class="lb-k">Aperture</span><span class="lb-v">${photo.aperture}</span></div>
      <div class="lb-row"><span class="lb-k">Shutter</span><span class="lb-v">${photo.shutter}</span></div>
      <div class="lb-row"><span class="lb-k">ISO</span><span class="lb-v">${photo.iso}</span></div>
    </div>
  `;
  lightbox.classList.add('visible');
}

if (lbClose) lbClose.addEventListener('click', () => lightbox.classList.remove('visible'));
if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('visible'); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox) lightbox.classList.remove('visible'); });

/* =========================================================
   APERTURE TRANSITION — a real iris diaphragm.

   How it works: BLADE_COUNT blades are arranged around a pivot
   circle of radius PIVOT_R, centered on the viewBox. Each blade
   is a quadrilateral: two edges run from its pivot point out to
   the rim (sized so the blade is wide enough to fully cover its
   1/Nth slice when rotated closed), and it rotates about its own
   pivot via the SVG transform attribute's rotate(deg, cx, cy) syntax.

   At "open" rotation, every blade is swung so its body tucks
   outside the visible circle (fully retracted, overlay invisible).
   At "closed" rotation, every blade swings inward so adjacent
   blades overlap and seal the center — exactly how a real
   diaphragm stops down to ƒ-closed.
   ========================================================= */
const VB = 1000;
const CX = VB / 2, CY = VB / 2;
const BLADE_COUNT = 8;
const PIVOT_R = 430;      // pivot points sit just outside the visible area
const BLADE_REACH = 620;  // how far each blade extends from its pivot
const BLADE_WIDTH = 130;  // half-width of each blade at its base

const irisBladeGroup = document.getElementById('irisBladeGroup');
const irisRim = document.getElementById('irisRim');
const apertureOverlay = document.getElementById('aperture-overlay');

const blades = [];

for (let i = 0; i < BLADE_COUNT; i++) {
  const angle = (i / BLADE_COUNT) * Math.PI * 2;
  const px = CX + PIVOT_R * Math.cos(angle);
  const py = CY + PIVOT_R * Math.sin(angle);

  // Blade quadrilateral drawn in its own local space, pivot at (px, py),
  // pointing inward toward center initially — JS rotation handles the sweep.
  const dirX = Math.cos(angle + Math.PI); // direction pointing toward center
  const dirY = Math.sin(angle + Math.PI);
  const perpX = -dirY, perpY = dirX; // perpendicular for blade width

  const tipX = px + dirX * BLADE_REACH;
  const tipY = py + dirY * BLADE_REACH;

  const baseLX = px + perpX * BLADE_WIDTH;
  const baseLY = py + perpY * BLADE_WIDTH;
  const baseRX = px - perpX * BLADE_WIDTH;
  const baseRY = py - perpY * BLADE_WIDTH;

  // tip is widened slightly too, so the blade is a tapered quad, not a triangle
  const tipLX = tipX + perpX * (BLADE_WIDTH * 0.35);
  const tipLY = tipY + perpY * (BLADE_WIDTH * 0.35);
  const tipRX = tipX - perpX * (BLADE_WIDTH * 0.35);
  const tipRY = tipY - perpY * (BLADE_WIDTH * 0.35);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const d = `M ${baseLX} ${baseLY} L ${tipLX} ${tipLY} L ${tipRX} ${tipRY} L ${baseRX} ${baseRY} Z`;
  path.setAttribute('d', d);
  path.setAttribute('class', 'iris-blade');
  irisBladeGroup.appendChild(path);

  // Rotation angles (deg) about this blade's own pivot, verified geometrically:
  // closed (~-5deg): tip sweeps through center, dense overlap with neighbors, full seal.
  // open (~95deg): tip swings tangentially clear, leaving a clean octagonal opening.
  // Rotation is applied via the SVG transform attribute's native rotate(deg, cx, cy)
  // syntax — supported in every browser since SVG1, avoiding any dependency on the
  // CSS transform-box property (whose `view-box` value has patchier support).
  blades.push({ el: path, px, py, openRot: 95, closedRot: -5 });
}

function setIrisProgress(t){
  // t: 0 = fully open (invisible), 1 = fully closed (sealed)
  const clamped = Math.max(0, Math.min(1, t));
  blades.forEach(b => {
    const rot = b.openRot + (b.closedRot - b.openRot) * clamped;
    b.el.setAttribute('transform', `rotate(${rot} ${b.px} ${b.py})`);
  });
  // rim should mirror the actual opening size: small when closed, larger when open
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
    // Respect reduced-motion: skip the animated sweep, just confirm the
    // transition happened with a brief instant flash instead of a sweep.
    setIrisProgress(1);
    setTimeout(() => { setIrisProgress(0); apertureBusy = false; }, 120);
    return;
  }

  const state = { t: 0 };
  gsap.timeline({ onComplete: () => { apertureBusy = false; } })
    .to(state, { t: 1, duration: 0.34, ease: 'power3.in', onUpdate: () => setIrisProgress(state.t) })
    .to(state, { t: 0, duration: 0.42, ease: 'power3.out', delay: 0.05, onUpdate: () => setIrisProgress(state.t) });
}

const zones = Array.from(document.querySelectorAll('[data-aperture-zone]'));
zones.forEach((zone, i) => {
  if (i === 0) return;
  ScrollTrigger.create({
    trigger: zone,
    start: 'top 70%',
    onEnter: () => playApertureCycle(),
    onEnterBack: () => playApertureCycle(),
  });
});

/* =========================================================
   CINEMATIC DUST MOTES — GSAP Background (Falling)
   ========================================================= */
function initDustMotes() {
  const container = document.getElementById('dust-container');
  if (!container) return;

  const moteCount = 40;

  for (let i = 0; i < moteCount; i++) {
    const mote = document.createElement('div');
    mote.className = 'dust-mote';
    
    const size = Math.random() * 6 + 2; 
    mote.style.width = `${size}px`;
    mote.style.height = `${size}px`;
    mote.style.boxShadow = '0 0 4px rgba(138, 90, 31, 0.3)';
    mote.style.left = '0px';
    mote.style.top = '0px';
    container.appendChild(mote);

    function drift() {
      // Reset above screen with a new random X
      gsap.set(mote, {
        x: Math.random() * window.innerWidth,
        y: -30, 
        opacity: 0
      });

      const duration = Math.random() * 15 + 15; // Slow drift: 15 to 30 seconds

      gsap.timeline({ onComplete: drift })
        .to(mote, {
          y: window.innerHeight + 50,
          x: `+=${(Math.random() - 0.5) * 300}`, // Sway left/right organically while falling
          rotation: Math.random() * 360,
          ease: 'none',
          duration: duration
        })
        .to(mote, { opacity: Math.random() * 0.6 + 0.2, duration: duration * 0.3, ease: 'power1.out' }, 0)
        .to(mote, { opacity: 0, duration: duration * 0.4, ease: 'power1.in' }, duration * 0.6);
    }

    setTimeout(drift, Math.random() * 15000);
  }
}
initDustMotes();

initPhotos();