import { initGlitch } from './code/glitch.js';
import { initGithubActivity } from './code/github.js';
import { initTerminalTransition } from './code/terminal.js';

// Initialize UI Components
initGlitch();
initGithubActivity();
initTerminalTransition();


if (window.ParticleEngine) {
  ParticleEngine.start({
    containerId: 'cyber-particles',
    count: 45,
    delayMax: 12000,
    createNode: () => {
      const chars = ['{', '}', ';', '/>', '0', '1', '[]', '()', '=>'];
      const node = document.createElement('div');
      node.className = 'cyber-node';
      node.innerText = chars[Math.floor(Math.random() * chars.length)];
      node.style.color = Math.random() > 0.6 ? 'var(--violet)' : 'var(--teal-dim)';
      node.style.left = '0px';
      node.style.top = '0px';
      return node;
    },
    animateNode: (node, onComplete) => {
      gsap.set(node, { x: Math.random() * window.innerWidth, y: -50, opacity: 0, scale: Math.random() * 0.5 + 0.7 });
      const duration = Math.random() * 10 + 10;
      return gsap.timeline({ onComplete })
        .to(node, { y: window.innerHeight + 50, ease: 'none', duration: duration })
        .to(node, { opacity: Math.random() * 0.5 + 0.1, duration: duration * 0.2, ease: 'power1.out' }, 0)
        .to(node, { opacity: 0, duration: duration * 0.3, ease: 'power1.in' }, duration * 0.7);
    }
  });
}