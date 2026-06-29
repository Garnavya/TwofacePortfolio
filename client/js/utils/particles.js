window.ParticleEngine = {
  start: function(config) {
    const container = document.getElementById(config.containerId);
    if (!container) return;

    // Spawn particles
    for (let i = 0; i < config.count; i++) {
      const node = config.createNode();
      container.appendChild(node);

      // Recursive animation loop attached to the node
      const animate = () => {
        node.tl = config.animateNode(node, animate);
      };
      // Stagger start times
      setTimeout(animate, Math.random() * (config.delayMax || 12000));
    }

    // Performance lock: Pause when hidden
    const toggle = (play) => {
      container.childNodes.forEach(n => {
        if (n.tl) play ? n.tl.play() : n.tl.pause();
      });
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => toggle(e[0].isIntersecting)).observe(container);
    }
    document.addEventListener('visibilitychange', () => toggle(document.visibilityState === 'visible'));
  }
};