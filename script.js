(() => {
  "use strict";

  const canvas = document.getElementById("neural-canvas");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const card = document.getElementById("profile-card");
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Constellation Stars: a lightweight 2D canvas animation. No WebGL or CDN required.
  if (canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (ctx) {
      let width = 0, height = 0, dpr = 1, frame = 0, lastFrame = 0, elapsed = 0;
      let stars = [], nodes = [];
      const pointer = { x: -1000, y: -1000, tx: -1000, ty: -1000 };
      const palette = {
        violet: [177, 91, 255],
        blue: [103, 160, 255],
        cyan: [82, 220, 255],
        teal: [73, 255, 204]
      };
      const rand = (min, max) => min + Math.random() * (max - min);

      function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const starCount = Math.min(210, Math.max(90, Math.round(width * height / 6500)));
        stars = Array.from({ length: starCount }, () => ({
          x: rand(0, width), y: rand(0, height),
          radius: rand(.35, 1.45), phase: rand(0, Math.PI * 2),
          speed: rand(.25, 1.1), alpha: rand(.16, .62)
        }));

        const cols = width < 600 ? 7 : 11;
        const rows = width < 600 ? 5 : 7;
        nodes = [];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            nodes.push({
              x: ((col + rand(.12, .88)) / cols) * width,
              y: ((row + rand(.12, .88)) / rows) * height,
              homeX: ((col + rand(.12, .88)) / cols) * width,
              homeY: ((row + rand(.12, .88)) / rows) * height,
              phase: rand(0, Math.PI * 2),
              size: rand(.7, 1.8),
              hue: col < cols * .42 ? "violet" : (col > cols * .67 ? "teal" : "cyan")
            });
          }
        }
        paint(0, true);
      }

      function glowDot(x, y, radius, color, alpha, glow) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        if (glow) {
          ctx.shadowColor = color;
          ctx.shadowBlur = glow;
        }
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      function paint(now, staticFrame) {
        if (!staticFrame) {
          frame = requestAnimationFrame(paint);
          if (now - lastFrame < 32) return;
          elapsed += Math.min(.06, (now - lastFrame) / 1000 || .016);
          lastFrame = now;
        }
        ctx.clearRect(0, 0, width, height);

        // Restrained colored nebulae keep the center readable for the hero copy.
        const leftGlow = ctx.createRadialGradient(width * .12, height * .38, 0, width * .12, height * .38, width * .48);
        leftGlow.addColorStop(0, "rgba(111, 40, 210, .105)");
        leftGlow.addColorStop(1, "rgba(111, 40, 210, 0)");
        ctx.fillStyle = leftGlow;
        ctx.fillRect(0, 0, width, height);
        const rightGlow = ctx.createRadialGradient(width * .9, height * .55, 0, width * .9, height * .55, width * .43);
        rightGlow.addColorStop(0, "rgba(20, 155, 158, .085)");
        rightGlow.addColorStop(1, "rgba(20, 155, 158, 0)");
        ctx.fillStyle = rightGlow;
        ctx.fillRect(0, 0, width, height);

        // Distant stars twinkle softly in the background.
        for (const s of stars) {
          const twinkle = reduceMotion ? 1 : .62 + .38 * Math.sin(elapsed * s.speed + s.phase);
          const color = s.x < width * .42 ? "190, 135, 255" : (s.x > width * .68 ? "105, 245, 224" : "145, 185, 255");
          glowDot(s.x, s.y, s.radius, "rgb(" + color + ")", s.alpha * twinkle, s.radius > 1.15 ? 5 : 0);
        }

        const points = nodes.map((n) => {
          const driftX = reduceMotion ? 0 : Math.sin(elapsed * .24 + n.phase) * 7;
          const driftY = reduceMotion ? 0 : Math.cos(elapsed * .2 + n.phase * 1.2) * 8;
          let x = n.homeX + driftX;
          let y = n.homeY + driftY;
          const dx = x - pointer.x, dy = y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 155 && dist > 0) {
            const push = (155 - dist) / 155;
            x += dx / dist * push * 17;
            y += dy / dist * push * 17;
          }
          return { x, y, size: n.size, hue: n.hue, phase: n.phase };
        });

        // Only nearby stars connect, forming organic constellations rather than a dense grid.
        for (let i = 0; i < points.length; i++) {
          const a = points[i];
          for (let j = i + 1; j < points.length; j++) {
            const b = points[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const distance = Math.hypot(dx, dy);
            const maxDistance = width < 600 ? 105 : 145;
            if (distance > maxDistance) continue;
            const fade = (1 - distance / maxDistance) * .28;
            const rgb = a.hue === "violet" ? "177,91,255" : (a.hue === "teal" ? "73,255,204" : "82,220,255");
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(" + rgb + "," + fade + ")";
            ctx.lineWidth = .65;
            ctx.stroke();
          }
        }

        // Cursor creates a small, temporary constellation around the pointer.
        if (pointer.x > 0 && pointer.y > 0) {
          for (const p of points) {
            const distance = Math.hypot(p.x - pointer.x, p.y - pointer.y);
            if (distance < 180) {
              ctx.beginPath();
              ctx.moveTo(pointer.x, pointer.y);
              ctx.lineTo(p.x, p.y);
              ctx.strokeStyle = "rgba(141, 232, 224," + ((1 - distance / 180) * .3) + ")";
              ctx.lineWidth = .8;
              ctx.stroke();
            }
          }
          glowDot(pointer.x, pointer.y, 1.5, "rgba(190,255,240,.8)", .65, 10);
        }

        // A few brighter constellation anchors add the cinematic star-map look.
        points.forEach((p, i) => {
          const bright = i % 9 === 0 || i % 17 === 0;
          const pulse = reduceMotion ? 1 : .72 + .28 * Math.sin(elapsed * 1.15 + p.phase);
          const rgb = p.hue === "violet" ? "188,118,255" : (p.hue === "teal" ? "91,255,213" : "109,211,255");
          glowDot(p.x, p.y, bright ? p.size * 1.75 : p.size, "rgb(" + rgb + ")", (bright ? .9 : .48) * pulse, bright ? 12 : 3);
        });
        ctx.globalAlpha = 1;
      }

      window.addEventListener("pointermove", event => {
        pointer.tx = event.clientX;
        pointer.ty = event.clientY;
        pointer.x += (pointer.tx - pointer.x) * .08;
        pointer.y += (pointer.ty - pointer.y) * .08;
      }, { passive: true });
      window.addEventListener("pointerleave", () => {
        pointer.x = pointer.y = pointer.tx = pointer.ty = -1000;
      }, { passive: true });
      window.addEventListener("resize", resize, { passive: true });
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && !reduceMotion && !frame) frame = requestAnimationFrame(paint);
      });
      resize();
      if (!reduceMotion) {
        frame = requestAnimationFrame(paint);
      } else {
        paint(0, true);
      }
    }
  }

  if (card && !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const visual = card.closest(".hero-visual");
    visual.addEventListener("pointermove", event => {
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.transform = "rotateY(" + (x * 7) + "deg) rotateX(" + (-y * 6) + "deg) rotate(-2deg) translateY(-3px)";
    });
    visual.addEventListener("pointerleave", () => { card.style.transform = "rotate(-2deg)"; });
  }

  // Scroll reveals are progressive; content stays visible if observers are unavailable.
  if ("IntersectionObserver" in window && !reduceMotion) {
    const targets = document.querySelectorAll(".content-section, .project-card, .skill-card, .timeline-item, .cert-card");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.animate([{ opacity: .72, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 520, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    targets.forEach(el => observer.observe(el));
  }
})();