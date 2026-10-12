(() => {
  const body = document.body;
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.desktop-nav');
  const themeButton = document.querySelector('.theme-toggle');
  const themeGlyph = document.querySelector('.theme-glyph');
  const topButton = document.querySelector('.back-to-top');
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Restore the visitor's preferred appearance when available.
  try {
    const savedTheme = localStorage.getItem('vm-theme');
    if (savedTheme === 'light') body.classList.add('light-theme');
  } catch (_) {}
  const syncThemeGlyph = () => {
    if (themeGlyph) themeGlyph.textContent = body.classList.contains('light-theme') ? '☼' : '◐';
    if (themeButton) themeButton.setAttribute('aria-label', body.classList.contains('light-theme') ? 'Switch to dark theme' : 'Switch to light theme');
  };
  syncThemeGlyph();
  themeButton?.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    syncThemeGlyph();
    try { localStorage.setItem('vm-theme', body.classList.contains('light-theme') ? 'light' : 'dark'); } catch (_) {}
  });

  menu?.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(opened));
    menu.setAttribute('aria-label', opened ? 'Close navigation' : 'Open navigation');
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Open navigation');
  }));

  const revealItems = document.querySelectorAll('.project-card, .skill-row, .timeline-item, .credential, .about-copy, .about-grid > div');
  revealItems.forEach(item => item.classList.add('reveal'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -25px 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  const onScroll = () => topButton?.classList.toggle('visible', window.scrollY > 650);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  topButton?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Gentle pointer parallax on large screens; disabled for touch and reduced-motion users.
  const visual = document.querySelector('.hero-visual');
  if (visual && window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    visual.addEventListener('pointermove', event => {
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      const card = visual.querySelector('.profile-card');
      if (card) card.style.transform = `translate(${x * 7}px, ${y * 7}px) rotate(-3deg)`;
    });
    visual.addEventListener('pointerleave', () => {
      const card = visual.querySelector('.profile-card');
      if (card) card.style.transform = '';
    });
  }

  // Animated neural network background: real moving nodes, connecting synapses and light pulses.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const neuralCanvas = document.createElement('canvas');
  neuralCanvas.id = 'neural-canvas';
  neuralCanvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(neuralCanvas);
  const neuralCtx = neuralCanvas.getContext('2d', { alpha: true });
  let neuralWidth = 0, neuralHeight = 0, neuralDpr = 1, neuralNodes = [], neuralFrame = 0;
  let neuralLastTime = 0;
  const makeNeuralNodes = () => {
    const count = Math.max(28, Math.min(76, Math.round(neuralWidth * neuralHeight / 23000)));
    neuralNodes = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * neuralWidth,
      y: Math.random() * neuralHeight,
      vx: (Math.random() - .5) * .22,
      vy: (Math.random() - .5) * .2,
      radius: i % 7 === 0 ? 2.5 : 1.3 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() > .72 ? 265 : (Math.random() > .5 ? 145 : 205)
    }));
  };
  const resizeNeural = () => {
    neuralDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    neuralWidth = window.innerWidth;
    neuralHeight = window.innerHeight;
    neuralCanvas.width = Math.round(neuralWidth * neuralDpr);
    neuralCanvas.height = Math.round(neuralHeight * neuralDpr);
    neuralCanvas.style.width = neuralWidth + 'px';
    neuralCanvas.style.height = neuralHeight + 'px';
    neuralCtx.setTransform(neuralDpr, 0, 0, neuralDpr, 0, 0);
    makeNeuralNodes();
  };
  const drawNeural = (time) => {
    if (document.hidden) { neuralFrame = 0; return; }
    neuralFrame = requestAnimationFrame(drawNeural);
    if (time - neuralLastTime < 28) return;
    neuralLastTime = time;
    neuralCtx.clearRect(0, 0, neuralWidth, neuralHeight);
    const linkDistance = neuralWidth < 700 ? 105 : 155;
    for (const node of neuralNodes) {
      if (!reducedMotion) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -10) node.x = neuralWidth + 10;
        if (node.x > neuralWidth + 10) node.x = -10;
        if (node.y < -10) node.y = neuralHeight + 10;
        if (node.y > neuralHeight + 10) node.y = -10;
      }
    }
    // Lines brighten as nearby neurons approach; this keeps the effect lightweight.
    for (let i = 0; i < neuralNodes.length; i++) {
      const a = neuralNodes[i];
      for (let j = i + 1; j < neuralNodes.length; j++) {
        const b = neuralNodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        if (distance >= linkDistance) continue;
        const alpha = (1 - distance / linkDistance) * .24;
        neuralCtx.strokeStyle = 'rgba(104,130,255,' + alpha.toFixed(3) + ')';
        neuralCtx.lineWidth = .65;
        neuralCtx.beginPath();
        neuralCtx.moveTo(a.x, a.y);
        neuralCtx.lineTo(b.x, b.y);
        neuralCtx.stroke();
        // A travelling spark runs along a fraction of the neural connections.
        const pulse = ((time * .00007 + i * .137 + j * .071) % 1);
        if (pulse < .11 && distance < linkDistance * .82) {
          const t = pulse / .11;
          neuralCtx.fillStyle = pulse < .055 ? 'rgba(137,255,112,.95)' : 'rgba(121,204,255,.9)';
          neuralCtx.shadowBlur = 10;
          neuralCtx.shadowColor = pulse < .055 ? '#91ff72' : '#77aaff';
          neuralCtx.beginPath();
          neuralCtx.arc(a.x + dx * t, a.y + dy * t, 1.7, 0, Math.PI * 2);
          neuralCtx.fill();
          neuralCtx.shadowBlur = 0;
        }
      }
    }
    neuralNodes.forEach(node => {
      const pulse = reducedMotion ? .5 : (Math.sin(time * .0012 + node.phase) + 1) / 2;
      neuralCtx.fillStyle = node.hue === 265 ? 'rgba(161,112,255,' + (.5 + pulse * .45) + ')' :
        node.hue === 145 ? 'rgba(139,255,109,' + (.5 + pulse * .45) + ')' :
        'rgba(92,185,255,' + (.42 + pulse * .48) + ')';
      neuralCtx.shadowBlur = reducedMotion ? 0 : 5 + pulse * 9;
      neuralCtx.shadowColor = node.hue === 265 ? '#a16fff' : (node.hue === 145 ? '#8bff6d' : '#5cb9ff');
      neuralCtx.beginPath();
      neuralCtx.arc(node.x, node.y, node.radius + (reducedMotion ? 0 : pulse * .45), 0, Math.PI * 2);
      neuralCtx.fill();
    });
    neuralCtx.shadowBlur = 0;
  };
  resizeNeural();
  if (!reducedMotion) neuralFrame = requestAnimationFrame(drawNeural);
  else drawNeural(0);
  window.addEventListener('resize', resizeNeural, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !reducedMotion && !neuralFrame) neuralFrame = requestAnimationFrame(drawNeural);
  });

})();