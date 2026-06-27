(async function initGithubCalendar() {
  const container = document.getElementById('gh-calendar-grid');
  const statusEl = document.getElementById('gh-cal-status');
  const totalEl = document.getElementById('gh-cal-total');
  
  if (!container) return;

  try {
    const res = await fetch('/api/github/calendar');
    if (!res.ok) throw new Error('Failed to load calendar');
    const data = await res.json();

    container.innerHTML = '';
    
    data.weeks.forEach(week => {
      const col = document.createElement('div');
      col.className = 'cal-week';
      
      week.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.dataset.level = day.level;
        cell.title = `${day.count} contributions on ${day.date}`;
        col.appendChild(cell);
      });
      
      container.appendChild(col);
    });

    if (totalEl) totalEl.textContent = `${data.total} contributions in the last year`;
    if (statusEl) {
      statusEl.textContent = 'synced';
      statusEl.className = 'placeholder-tag pstatus shipped glitch-host glitch-active';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div style="color: var(--rose); font-size: 12px; padding: 20px;">Failed to load heatmap data.</div>';
    if (statusEl) {
      statusEl.textContent = 'error';
      statusEl.className = 'placeholder-tag pstatus';
    }
  }
})();