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
    
    masonryGrid.appendChild(item);
  });
}