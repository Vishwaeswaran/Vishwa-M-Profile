(() => {
  const body = document.body;
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.desktop-nav');
  document.body.classList.remove('light-theme');
  try { localStorage.removeItem('vm-theme'); } catch (_) {}

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



})();