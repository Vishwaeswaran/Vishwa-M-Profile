(() => {
  "use strict";
  const canvas = document.getElementById("neural-canvas");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas && canvas.getContext("2d", { alpha: true });
  const card = document.getElementById("profile-card");
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Progressive enhancement only: content is already visible in the HTML/CSS.
  if (canvas && ctx && !reduceMotion) {
    let width = 0, height = 0, dpr = 1, points = [], raf = 0, lastFrame = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const palette = ["#9a6bff", "#a9ff79", "#78cfff", "#9b8cff"];
    const countForWidth = () => Math.min(66, Math.max(28, Math.round(width / 24)));
    function resize() {
      width = window.innerWidth; height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px"; canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = countForWidth();
      points = Array.from({length: count}, (_, i) => ({
        x: Math.random() * width, y: Math.random() * height,
        ox: Math.random() * width, oy: Math.random() * height,
        vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
        r: 1.3 + Math.random() * 2.1, phase: Math.random() * Math.PI * 2,
        color: palette[i % palette.length]
      }));
    }
    function draw(time) {
      raf = 0;
      if (document.hidden) return;
      if (time - lastFrame < 28) { raf = requestAnimationFrame(draw); return; }
      lastFrame = time;
      ctx.clearRect(0, 0, width, height);
      pointer.x += (pointer.tx - pointer.x) * .025;
      pointer.y += (pointer.ty - pointer.y) * .025;
      const mobile = width < 700;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx; p.y += p.vy; p.phase += .008;
        if (p.x < -30 || p.x > width + 30) p.vx *= -1;
        if (p.y < -30 || p.y > height + 30) p.vy *= -1;
        const px = p.x + (mobile ? 0 : pointer.x * .012 * (i % 4 + 1));
        const py = p.y + (mobile ? 0 : pointer.y * .012 * (i % 4 + 1));
        for (let j = i + 1; j < points.length; j++) {
          const q = points[j];
          const qx = q.x + (mobile ? 0 : pointer.x * .012 * (j % 4 + 1));
          const qy = q.y + (mobile ? 0 : pointer.y * .012 * (j % 4 + 1));
          const dx = px - qx, dy = py - qy, dist = Math.sqrt(dx*dx + dy*dy);
          const maxDist = mobile ? 105 : 145;
          if (dist < maxDist) {
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy);
            ctx.strokeStyle = "rgba(126,111,255," + ((1 - dist / maxDist) * .22) + ")";
            ctx.lineWidth = .65; ctx.stroke();
          }
        }
        const glow = 0.45 + (Math.sin(p.phase) + 1) * .22;
        ctx.beginPath(); ctx.arc(px, py, p.r * 4.2, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = .055 * glow; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(px, py, p.r * (1 + Math.sin(p.phase) * .12), 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = glow; ctx.fill(); ctx.globalAlpha = 1;
      }
      // A few moving light pulses travel along the network.
      const pulseCount = 4;
      for (let k = 0; k < pulseCount; k++) {
        const i = (Math.floor(time / 1500) + k * 7) % points.length;
        const j = (i + 1 + k * 3) % points.length;
        const a = points[i], b = points[j], t = (time / 1600 + k * .27) % 1;
        const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = k % 2 ? "#b6ff70" : "#c2a7ff"; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    }
    function start() { if (!raf && !document.hidden) raf = requestAnimationFrame(draw); }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", e => {
      pointer.tx = (e.clientX / Math.max(1, width) - .5) * 30;
      pointer.ty = (e.clientY / Math.max(1, height) - .5) * 30;
    }, { passive: true });
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
    resize(); start();
  } else if (canvas) {
    canvas.style.display = "none";
  }

  if (card && !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const visual = card.closest(".hero-visual");
    visual.addEventListener("pointermove", e => {
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = "rotateY(" + (x * 7) + "deg) rotateX(" + (-y * 6) + "deg) rotate(-2deg) translateY(-3px)";
    });
    visual.addEventListener("pointerleave", () => { card.style.transform = "rotate(-2deg)"; });
  }

  // Scroll reveals are progressive; without JS or IntersectionObserver, content stays visible.
  if ("IntersectionObserver" in window && !reduceMotion) {
    const targets = document.querySelectorAll(".content-section, .project-card, .skill-card, .timeline-item, .cert-card");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.animate([{opacity:.72, transform:"translateY(10px)"},{opacity:1,transform:"translateY(0)"}], {duration:520,easing:"cubic-bezier(.22,1,.36,1)",fill:"both"});
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    targets.forEach(el => observer.observe(el));
  }
})();