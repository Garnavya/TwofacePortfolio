export function initMasonry(photoPool) {
  const masonryGrid = document.getElementById('masonryGrid');
  const masonryEmpty = document.getElementById('masonryEmpty');
  const galleryCount = document.getElementById('galleryCount');
  
  if (!masonryGrid) return;
  masonryGrid.innerHTML = '';
  
  if (masonryEmpty) {
    masonryEmpty.style.display = photoPool.length === 0 ? 'block' : 'none';
  }
  
  if (galleryCount) {
    galleryCount.textContent = `${photoPool.length} frames`;
  }

  const lightbox = document.getElementById('lightbox');
  const lbImage = document.getElementById('lbImage');
  const lbInfo = document.getElementById('lbInfo');
  const lbClose = document.getElementById('lbClose');

  function openLightbox(photo){
    if (!lightbox) return;
    lbImage.style.background = photo.img ? `url(${photo.img}) center/contain no-repeat` : photo.bg;
    lbInfo.innerHTML = `
      <div class="lb-exif-grid">
        <div class="lb-row"><span class="lb-k">Camera</span><span class="lb-v">${photo.camera || '-'}</span></div>
        <div class="lb-row"><span class="lb-k">Lens</span><span class="lb-v">${photo.lens || '-'}</span></div>
        <div class="lb-row"><span class="lb-k">Aperture</span><span class="lb-v">${photo.aperture || '-'}</span></div>
        <div class="lb-row"><span class="lb-k">Shutter</span><span class="lb-v">${photo.shutter || '-'}</span></div>
        <div class="lb-row"><span class="lb-k">ISO</span><span class="lb-v">${photo.iso || '-'}</span></div>
      </div>
    `;
    lightbox.classList.add('visible');
  }

  photoPool.forEach(photo => {
    const item = document.createElement('div');
    item.className = 'masonry-item';
    
    item.innerHTML = `
      <img class="mi-fill" src="${photo.img}" alt="${photo.title || 'Photo'}" 
           style="background: ${photo.bg}; 
                  width: 100%; 
                  height: auto; 
                  display: block;">
    `;
    
    item.addEventListener('click', () => openLightbox(photo));
    masonryGrid.appendChild(item);
  });

  if (lbClose) lbClose.addEventListener('click', () => lightbox.classList.remove('visible'));
  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('visible'); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox) lightbox.classList.remove('visible'); });
}