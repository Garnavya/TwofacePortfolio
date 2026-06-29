export function initTerminalTransition() {
  if (typeof window.ScrollTrigger === 'undefined') return;
  window.gsap.registerPlugin(window.ScrollTrigger);

  const termOverlay = document.getElementById('terminal-overlay');
  const termContent = document.getElementById('terminal-content');
  if (!termOverlay || !termContent) return;

  const termMessages = {
    'hero': '> ./system_init.sh\n<span class="term-highlight">[PLACEHOLDER: BOOTING CORE]</span>',
    'stack': '> fetch --module=dependencies\n<span class="term-highlight">[PLACEHOLDER: STACK RESOLVED]</span>',
    'projects': '> build --target=projects\n<span class="term-highlight">[PLACEHOLDER: COMPILE SUCCESS]</span>',
    'journey': '> git log --pretty=oneline\n<span class="term-highlight">[PLACEHOLDER: HISTORY SYNCED]</span>',
    'github-activity': '> curl -X GET /api/github/activity\n<span class="term-highlight">[PLACEHOLDER: DATA FETCHED]</span>',
    'github-heatmap': '> render_matrix --module=contributions\n<span class="term-highlight">[PLACEHOLDER: GRAPH GENERATED]</span>',
    'contact': '> ping -c 1 user@host\n<span class="term-highlight">[PLACEHOLDER: CONNECTION ESTABLISHED]</span>'
  };

  let termBusy = false;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function playTermSequence(sectionId) {
    if (termBusy) return;
    termBusy = true;

    const msg = termMessages[sectionId] || '> execute sequence\n<span class="term-highlight">[OK]</span>';
    termContent.innerHTML = msg.replace(/\n/g, '<br/>');

    if (prefersReducedMotion) {
      termOverlay.style.opacity = '1';
      setTimeout(() => { termOverlay.style.opacity = '0'; termBusy = false; }, 150);
      return;
    }

    window.gsap.timeline({ onComplete: () => { termBusy = false; } })
      .to(termOverlay, { opacity: 1, y: 0, duration: 0.2, ease: 'power3.out' })
      .to(termOverlay, { opacity: 0, y: 10, duration: 0.25, ease: 'power3.in', delay: 0.8 });
  }

  const termZones = Array.from(document.querySelectorAll('[data-term-zone="true"]'));
  termZones.forEach((zone, i) => {
    if (i === 0) return; 
    window.ScrollTrigger.create({
      trigger: zone,
      start: 'top 70%',
      onEnter: () => playTermSequence(zone.id),
      onEnterBack: () => playTermSequence(zone.id),
    });
  });
}