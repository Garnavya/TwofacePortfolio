import { initPhotos } from './snap/data.js';
import { initMasonry } from './snap/masonry.js';
import { initAperture } from './snap/aperture.js';

// 1. Initialize the SVG Aperture scroll transition
initAperture();

// 2. Fetch photo metadata and render the masonry grid once loaded
initPhotos((photoPool) => {
  initMasonry(photoPool);
});

// 3. Initialize Shared Particle Engine (from utils/particles.js)
if (window.ParticleEngine) {
  ParticleEngine.start({
    containerId: 'dust-container',
    count: 40,
    delayMax: 15000,
    createNode: () => {
      const node = document.createElement('div');
      node.className = 'dust-mote';
      const size = Math.random() * 6 + 2; 
      node.style.width = `${size}px`;
      node.style.height = `${size}px`;
      node.style.boxShadow = '0 0 4px rgba(138, 90, 31, 0.3)';
      node.style.left = '0px';
      node.style.top = '0px';
      return node;
    },
    animateNode: (node, onComplete) => {
      window.gsap.set(node, { x: Math.random() * window.innerWidth, y: -30, opacity: 0 });
      const duration = Math.random() * 15 + 15;
      return window.gsap.timeline({ onComplete })
        .to(node, { y: window.innerHeight + 50, x: `+=${(Math.random() - 0.5) * 300}`, rotation: Math.random() * 360, ease: 'none', duration: duration })
        .to(node, { opacity: Math.random() * 0.6 + 0.2, duration: duration * 0.3, ease: 'power1.out' }, 0)
        .to(node, { opacity: 0, duration: duration * 0.4, ease: 'power1.in' }, duration * 0.6);
    }
  });
}