export async function initGithubActivity() {
  const ghGrid = document.getElementById('gh-grid');
  const ghStatus = document.getElementById('gh-status');
  const template = document.getElementById('gh-card-template');
  const skeletonTpl = document.getElementById('gh-card-skeleton');
  
  if (!ghGrid || !template) return;

  if (skeletonTpl) {
    for (let i=0; i<5; i++) {
      ghGrid.appendChild(skeletonTpl.content.cloneNode(true));
    }
  }

  async function loadGithubActivity() {
    const res = await fetch('/api/github/activity');
    if (!res.ok) throw new Error(`Bad status: ${res.status}`);
    return await res.json();
  }

  try {
    const repos = await loadGithubActivity();
    ghGrid.innerHTML = ''; 
    
    ghStatus.textContent = 'synced';
    ghStatus.className = 'placeholder-tag pstatus shipped glitch-host glitch-active';

    const createGlitchHTML = (text) => `
      <span class="glitch-host glitch-active" aria-label="~/garnavya/${text}">
        <span class="glitch-base" aria-hidden="true">~/garnavya/${text}
          <span class="glitch-layer layer-a" aria-hidden="true">~/garnavya/${text}</span>
          <span class="glitch-layer layer-b" aria-hidden="true">~/garnavya/${text}</span>
        </span>
      </span>
    `;

    repos.forEach(repo => {
      const clone = template.content.cloneNode(true);
      
      const repoPath = clone.querySelector('.gh-repo-name');
      repoPath.innerHTML = createGlitchHTML(repo.name);

      clone.querySelector('.gh-lang-dot').style.background = repo.langColor;
      clone.querySelector('.gh-lang-text').textContent = repo.lang;
      clone.querySelector('.gh-star-count').textContent = repo.stars;
      clone.querySelector('.gh-fork-count').textContent = repo.forks;
      clone.querySelector('.gh-time').textContent = repo.lastPushed;
      
      if (!repo.live) clone.querySelector('.gh-live').style.display = 'none';

      const toggle = clone.querySelector('.gh-commits-toggle');
      const list = clone.querySelector('.gh-commits-list');
      
      if (repo.commits && repo.commits.length > 0) {
        toggle.textContent = `${repo.commits.length} commit${repo.commits.length > 1 ? 's' : ''} ▾`;
        repo.commits.forEach(c => {
          const cEl = document.createElement('div');
          cEl.className = 'gh-commit';
          cEl.innerHTML = `<span class="hash">${c.hash}</span> ${c.msg} <span class="ctime">${c.time}</span>`;
          list.appendChild(cEl);
        });
        
        toggle.addEventListener('click', () => {
          const isClosed = list.classList.toggle('collapsed');
          toggle.textContent = isClosed 
            ? `${repo.commits.length} commit${repo.commits.length > 1 ? 's' : ''} ▾`
            : 'Collapse ▴';
        });
      } else {
        toggle.style.display = 'none';
      }

      ghGrid.appendChild(clone);
    });

  } catch (err) {
    ghGrid.innerHTML = '';
    ghStatus.textContent = 'error';
    ghStatus.className = 'placeholder-tag pstatus'; 
    
    const errTpl = document.getElementById('gh-card-error');
    if (errTpl) ghGrid.appendChild(errTpl.content.cloneNode(true));
  }
}