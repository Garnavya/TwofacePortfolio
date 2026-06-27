  const housing = document.getElementById('leverHousing');
  const plate = document.getElementById('leverPlate');
  const flash = document.getElementById('flash');
  const goCode = document.getElementById('goCode');
  const goSnap = document.getElementById('goSnap');

  let navigating = false;

  function fireTo(mode){
    if (navigating) return;
    navigating = true;
    housing.dataset.pos = mode === 'code' ? 'up' : 'down';
    setTimeout(() => {
      flash.classList.add('firing');
      setTimeout(() => {
        window.location.href = mode === 'code' ? 'code.html' : 'snap.html';
      }, 420);
    }, 320);
  }

  plate.addEventListener('click', (e) => {
    const rect = plate.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    fireTo(clickY < rect.height / 2 ? 'code' : 'snap');
  });

  plate.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'Enter') fireTo('code');
    if (e.key === 'ArrowDown') fireTo('snap');
  });

  goCode.addEventListener('click', () => fireTo('code'));
  goSnap.addEventListener('click', () => fireTo('snap'));

  goCode.addEventListener('mouseenter', () => { if(!navigating) housing.dataset.pos = 'up'; });
  goSnap.addEventListener('mouseenter', () => { if(!navigating) housing.dataset.pos = 'down'; });
  [goCode, goSnap].forEach(el => el.addEventListener('mouseleave', () => { if(!navigating) housing.dataset.pos = 'mid'; }));
