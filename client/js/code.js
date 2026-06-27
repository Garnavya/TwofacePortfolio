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

/* =========================================================
   GITHUB ACTIVITY WIDGET
   Loads data, stamps templates, and simulates glitch tags.
   ========================================================= */
(async function() {
  const ghGrid = document.getElementById('gh-grid');
  const ghStatus = document.getElementById('gh-status');
  const template = document.getElementById('gh-card-template');
  const skeletonTpl = document.getElementById('gh-card-skeleton');
  
  if (!ghGrid || !template) return;

  // Mount 5 skeletons instantly
  if (skeletonTpl) {
    for (let i=0; i<5; i++) {
      ghGrid.appendChild(skeletonTpl.content.cloneNode(true));
    }
  }

  async function loadGithubActivity() {
    console.log("🚀 [DIAGNOSTIC] Attempting to fetch GitHub data from /api/github/activity...");
    
    try {
      const res = await fetch('/api/github/activity');
      console.log("📥 [DIAGNOSTIC] Received response status:", res.status, res.statusText);
      
      if (res.status === 404) {
        console.error(`
❌ ERROR 404: Route Not Found!
----------------------------------
WHAT THIS MEANS: The frontend asked for /api/github/activity, but the server said "I don't know what that is."
HOW TO FIX IT: 
1. Did you restart your server? (Press Ctrl+C in the terminal, then run 'npm run dev' again).
2. Did you paste the route into 'server/routes/api.js' correctly, before the 'export default router;' line?
        `);
        throw new Error("Route not found (404)");
      }
      
      if (res.status === 500) {
        console.error(`
❌ ERROR 500: Internal Server Error!
----------------------------------
WHAT THIS MEANS: The route exists, but the backend script crashed while trying to talk to GitHub.
HOW TO FIX IT: 
1. Check your .env file. Is GITHUB_TOKEN formatted correctly? (No quotes around the token).
2. Check your SERVER terminal (where npm run dev is running). It will have a log starting with "GitHub Activity Error:" telling you why it crashed.
        `);
        throw new Error("Server error (500)");
      }
      
      if (!res.ok) {
        console.error(`❌ [DIAGNOSTIC] Unknown error. Status: ${res.status}`);
        throw new Error(`Bad status: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ [DIAGNOSTIC] Successfully loaded data:", data);
      return data;
      
    } catch (err) {
      console.error(`
🚨 FETCH FAILED ENTIRELY!
----------------------------------
Error: ${err.message}
WHAT THIS MEANS: The browser couldn't even make the request, or a network error occurred. Is your server running?
      `);
      throw err;
    }
  }

  try {
    const repos = await loadGithubActivity();
    ghGrid.innerHTML = ''; // clear skeletons
    
    // Update badge to match .pstatus.shipped style
    ghStatus.textContent = 'synced';
    ghStatus.className = 'placeholder-tag pstatus shipped glitch-host glitch-active';

    // Generates identical structure to code.js IIFE for native CSS hookup
    const createGlitchHTML = (text) => `
      <span class="glitch-host glitch-active">
        <span class="glitch-base">~/garnavya/${text}
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
    ghStatus.className = 'placeholder-tag pstatus'; // Default fallback style
    
    const errTpl = document.getElementById('gh-card-error');
    if (errTpl) ghGrid.appendChild(errTpl.content.cloneNode(true));
  }
})();
