gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   PHOTO POOL — 45 placeholder entries with fake metadata.
   Replace `img` with a real photo URL and fill in the rest
   when ready. Each entry also gets a random aspect ratio so
   the gallery masonry looks realistic.
   ========================================================= */
const LOCATIONS = ['Lucknow','Varanasi','Agra','Delhi','Goa','Jaipur','Himalayas','Kanpur'];
const TAGS = ['portrait','street','landscape','golden hour','b&w','candid','architecture','nature'];
const YEARS = ['2023','2024','2025','2026'];
const LENSES = ['18-55mm kit lens','50mm f/1.8','EF-S 55-250mm'];
const APERTURES = ['ƒ/1.8','ƒ/2.8','ƒ/4','ƒ/5.6','ƒ/8'];
const SHUTTERS = ['1/60s','1/125s','1/250s','1/500s','1/1000s'];
const ISOS = ['ISO 100','ISO 200','ISO 400','ISO 800'];

function seededColor(seed){
  const hues = [28, 18, 40, 12, 34, 8, 46];
  const h = hues[seed % hues.length];
  return `linear-gradient(150deg, hsl(${h},45%,78%), hsl(${h+8},38%,58%))`;
}

const PHOTO_POOL = Array.from({ length: 45 }, (_, i) => {
  const idx = i + 1;
  const ratios = [ [4,5], [1,1], [3,4], [5,4], [4,3] ];
  const ratio = ratios[i % ratios.length];
  return {
    id: idx,
    img: null,
    bg: seededColor(idx),
    title: `Untitled — Frame ${String(idx).padStart(2,'0')}`,
    camera: 'Canon EOS 1200D',
    lens: LENSES[idx % LENSES.length],
    aperture: APERTURES[idx % APERTURES.length],
    shutter: SHUTTERS[idx % SHUTTERS.length],
    iso: ISOS[idx % ISOS.length],
    location: LOCATIONS[idx % LOCATIONS.length],
    year: YEARS[idx % YEARS.length],
    tag: TAGS[idx % TAGS.length],
    story: 'Placeholder note — describe how and why this shot happened.',
    ratioW: ratio[0],
    ratioH: ratio[1],
  };
});

/* =========================================================
   ORBIT — pick N photos per visit, shuffled w/o replacement
   across visits (tracked in sessionStorage) so repeats are
   minimized before the pool is exhausted.
   ========================================================= */
const ORBIT_COUNT = 10;

function getOrbitSelection(){
  const STORE_KEY = 'snap_orbit_remaining';
  let remaining;
  try {
    remaining = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
  } catch(e) { remaining = null; }

  if (!remaining || !Array.isArray(remaining) || remaining.length === 0) {
    remaining = PHOTO_POOL.map(p => p.id);
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
  }

  const selectedIds = remaining.splice(0, ORBIT_COUNT);
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify(remaining)); } catch(e) {}

  return selectedIds.map(id => PHOTO_POOL.find(p => p.id === id));
}

const orbitSet = getOrbitSelection();

const orbitContainer = document.getElementById('orbitContainer');
orbitSet.forEach((photo, i) => {
  const ph = document.createElement('div');
  ph.className = 'orbit-photo';
  ph.dataset.index = i;
  ph.style.background = photo.img ? `url(${photo.img}) center/cover` : photo.bg;
  ph.innerHTML = `<span class="ph-frame-no">${String(i+1).padStart(2,'0')}</span>`;
  orbitContainer.appendChild(ph);

  const card = document.createElement('div');
  card.className = 'exif-card';
  card.dataset.index = i;
  card.innerHTML = `
    <button class="ec-close">×</button>
    <div class="ec-title">${photo.title}</div>
    <div class="ec-row"><span class="ec-k">Camera</span><span class="ec-v">${photo.camera}</span></div>
    <div class="ec-row"><span class="ec-k">Lens</span><span class="ec-v">${photo.lens}</span></div>
    <div class="ec-row"><span class="ec-k">Aperture</span><span class="ec-v">${photo.aperture}</span></div>
    <div class="ec-row"><span class="ec-k">Shutter</span><span class="ec-v">${photo.shutter}</span></div>
    <div class="ec-row"><span class="ec-k">ISO</span><span class="ec-v">${photo.iso}</span></div>
    <div class="ec-row"><span class="ec-k">Location</span><span class="ec-v">${photo.location}</span></div>
    <div class="ec-row"><span class="ec-k">Date</span><span class="ec-v">${photo.year}</span></div>
    <p class="ec-story">${photo.story}</p>
  `;
  orbitContainer.appendChild(card);
});

/* =========================================================
   CSS 3D CAMERA — auto-rotate + drag override
   ========================================================= */
const camera3d = document.getElementById('camera-3d');
const dragHint = document.getElementById('dragHint');

let rotY = -20, rotX = -8;
let autoRotating = true;
const autoSpeed = 0.12;
let isDragging = false, lastX = 0, lastY = 0, dragTimeout = null;

function applyRotation(){ camera3d.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`; }

function tick(){
  if (autoRotating && !isDragging) { rotY += autoSpeed; applyRotation(); }
  requestAnimationFrame(tick);
}
tick();

function startDrag(x, y){
  isDragging = true; autoRotating = false; lastX = x; lastY = y;
  dragHint.style.opacity = '0'; clearTimeout(dragTimeout);
}
function moveDrag(x, y){
  if (!isDragging) return;
  const dx = x - lastX, dy = y - lastY;
  rotY += dx * 0.4; rotX = Math.max(-60, Math.min(60, rotX - dy * 0.4));
  lastX = x; lastY = y; applyRotation();
}
function endDrag(){
  isDragging = false;
  dragTimeout = setTimeout(() => { autoRotating = true; dragHint.style.opacity = '0.85'; }, 2200);
}

camera3d.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
window.addEventListener('mouseup', endDrag);
camera3d.addEventListener('touchstart', (e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }, { passive: true });
window.addEventListener('touchmove', (e) => { if (!isDragging) return; const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }, { passive: true });
window.addEventListener('touchend', endDrag);

/* =========================================================
   ORBIT LAYOUT — position photos + dock cards
   ========================================================= */
const orbitScene = document.getElementById('camera-orbit-scene');

function layoutOrbit(){
  const photos = Array.from(document.querySelectorAll('.orbit-photo'));
  const cards = Array.from(document.querySelectorAll('.exif-card'));
  const rect = orbitScene.getBoundingClientRect();
  const cx = rect.width / 2, cy = rect.height / 2;
  const isMobile = rect.width < 760;
  const radius = Math.min(rect.width, rect.height) * (isMobile ? 0.42 : 0.40);

  photos.forEach((photo, i) => {
    const angle = (i / photos.length) * Math.PI * 2 - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle) * 0.62;
    photo.style.left = x + 'px';
    photo.style.top = y + 'px';

    const card = cards[i];
    if (card) {
      const cardRadius = radius + (isMobile ? 70 : 130);
      const cx2 = cx + cardRadius * Math.cos(angle);
      const cy2 = cy + cardRadius * Math.sin(angle) * 0.62;
      const cardW = isMobile ? 190 : 250;
      const cardH = isMobile ? 220 : 240;
      const clampedX = Math.max(8, Math.min(rect.width - cardW - 8, cx2 - cardW/2));
      const clampedY = Math.max(8, Math.min(rect.height - cardH - 8, cy2 - cardH/2));
      card.style.left = clampedX + 'px';
      card.style.top = clampedY + 'px';
    }
  });
}
layoutOrbit();
window.addEventListener('resize', layoutOrbit);

let activeCardIndex = null;
function closeAllCards(){
  document.querySelectorAll('.exif-card').forEach(c => c.classList.remove('visible'));
  document.querySelectorAll('.orbit-photo').forEach(p => p.classList.remove('active'));
  activeCardIndex = null;
}
orbitContainer.addEventListener('click', (e) => {
  const photo = e.target.closest('.orbit-photo');
  const closeBtn = e.target.closest('.ec-close');
  if (closeBtn) { e.stopPropagation(); closeAllCards(); return; }
  if (!photo) return;
  e.stopPropagation();
  const idx = photo.dataset.index;
  const card = document.querySelector(`.exif-card[data-index="${idx}"]`);
  if (!card) return;
  if (activeCardIndex === idx) { closeAllCards(); return; }
  closeAllCards();
  card.classList.add('visible');
  photo.classList.add('active');
  activeCardIndex = idx;
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.orbit-photo') && !e.target.closest('.exif-card')) closeAllCards();
});

/* =========================================================
   PINTEREST GALLERY — masonry + filters + search + lightbox
   ========================================================= */
const masonryGrid = document.getElementById('masonryGrid');
const masonryEmpty = document.getElementById('masonryEmpty');
const galleryCount = document.getElementById('galleryCount');
const filterYearEl = document.getElementById('filterYear');
const filterTagEl = document.getElementById('filterTag');
const gallerySearch = document.getElementById('gallerySearch');

let activeYear = 'all';
let activeTag = 'all';

function buildFilterChips(container, values, onSelect){
  const allChip = document.createElement('div');
  allChip.className = 'filter-chip active';
  allChip.textContent = 'All';
  allChip.addEventListener('click', () => onSelect('all'));
  container.appendChild(allChip);

  values.forEach(v => {
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.textContent = v;
    chip.addEventListener('click', () => onSelect(v));
    container.appendChild(chip);
  });
}

function refreshChipStates(container, activeVal){
  Array.from(container.children).forEach(chip => {
    const isAll = chip.textContent === 'All';
    chip.classList.toggle('active', (isAll && activeVal === 'all') || chip.textContent === activeVal);
  });
}

buildFilterChips(filterYearEl, YEARS, (v) => { activeYear = v; refreshChipStates(filterYearEl, v); renderGallery(); });
buildFilterChips(filterTagEl, TAGS, (v) => { activeTag = v; refreshChipStates(filterTagEl, v); renderGallery(); });

gallerySearch.addEventListener('input', renderGallery);

function renderGallery(){
  const query = gallerySearch.value.trim().toLowerCase();
  const filtered = PHOTO_POOL.filter(p => {
    if (activeYear !== 'all' && p.year !== activeYear) return false;
    if (activeTag !== 'all' && p.tag !== activeTag) return false;
    if (query) {
      const haystack = `${p.tag} ${p.location} ${p.year} ${p.title}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  masonryGrid.innerHTML = '';
  masonryEmpty.style.display = filtered.length === 0 ? 'block' : 'none';
  galleryCount.textContent = `${filtered.length} of ${PHOTO_POOL.length} frames`;

  filtered.forEach(photo => {
    const item = document.createElement('div');
    item.className = 'masonry-item';
    const heightPct = (photo.ratioH / photo.ratioW) * 100;
    item.innerHTML = `
      <div class="mi-fill" style="background:${photo.bg}; padding-bottom:${heightPct}%;"></div>
      <div class="mi-overlay"><span class="mi-label">${photo.location} · ${photo.year}</span></div>
    `;
    item.addEventListener('click', () => openLightbox(photo));
    masonryGrid.appendChild(item);
  });
}
renderGallery();

const lightbox = document.getElementById('lightbox');
const lbImage = document.getElementById('lbImage');
const lbInfo = document.getElementById('lbInfo');
const lbClose = document.getElementById('lbClose');

function openLightbox(photo){
  lbImage.style.background = photo.img ? `url(${photo.img}) center/cover` : photo.bg;
  lbInfo.innerHTML = `
    <div class="ec-title">${photo.title}</div>
    <div class="ec-row"><span class="ec-k">Camera</span><span class="ec-v">${photo.camera}</span></div>
    <div class="ec-row"><span class="ec-k">Lens</span><span class="ec-v">${photo.lens}</span></div>
    <div class="ec-row"><span class="ec-k">Aperture</span><span class="ec-v">${photo.aperture}</span></div>
    <div class="ec-row"><span class="ec-k">Shutter</span><span class="ec-v">${photo.shutter}</span></div>
    <div class="ec-row"><span class="ec-k">ISO</span><span class="ec-v">${photo.iso}</span></div>
    <div class="ec-row"><span class="ec-k">Location</span><span class="ec-v">${photo.location}</span></div>
    <div class="ec-row"><span class="ec-k">Date</span><span class="ec-v">${photo.year}</span></div>
    <p class="ec-story">${photo.story}</p>
  `;
  lightbox.classList.add('visible');
}
lbClose.addEventListener('click', () => lightbox.classList.remove('visible'));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('visible'); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('visible'); });

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
