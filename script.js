(() => {
  "use strict";
  const canvas = document.getElementById("neural-canvas");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const card = document.getElementById("profile-card");
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Real-time 3D neural universe rendered with Three.js/WebGL.
  // Dynamic import keeps the rest of the portfolio functional if WebGL/CDN is unavailable.
  if (canvas) {
    (async () => {
      try {
        const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js");
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        renderer.setClearColor(0x050712, 0);
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x070817, 0.00075);
        const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 1, 2600);
        camera.position.set(0, 10, 760);
        const root = new THREE.Group();
        scene.add(root);
        const palette = [0xc75cff, 0x9d72ff, 0x65dfff, 0x64f5d0, 0x8dff8c, 0xff69d4];
        const cols = window.innerWidth < 640 ? 25 : 43;
        const rows = window.innerWidth < 640 ? 14 : 23;
        const vertices = [];
        const base = [];
        const colors = [];
        const indices = [];
        const c = new THREE.Color();
        for (let r = 0; r < rows; r++) {
          for (let col = 0; col < cols; col++) {
            const u = col / (cols - 1), v = r / (rows - 1);
            const x = (u - .5) * Math.min(window.innerWidth * 1.65, 1900);
            const y = (v - .5) * Math.min(window.innerHeight * 1.25, 1100);
            const z = -80 - v * 430 + Math.sin(u * 7 + v * 4) * 30;
            base.push(x, y, z);
            vertices.push(x, y, z);
            c.setHex(palette[(col * 3 + r * 2) % palette.length]);
            colors.push(c.r, c.g, c.b);
            const i = r * cols + col;
            if (col < cols - 1) indices.push(i, i + 1);
            if (r < rows - 1) indices.push(i, i + cols);
            if (r < rows - 1 && col < cols - 1 && ((r + col) % 2 === 0)) indices.push(i, i + cols + 1);
            if (r < rows - 1 && col > 0 && ((r + col) % 3 === 0)) indices.push(i, i + cols - 1);
          }
        }
        const netGeo = new THREE.BufferGeometry();
        netGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage));
        netGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        netGeo.setIndex(indices);
        const net = new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .68, blending: THREE.AdditiveBlending, depthWrite: false }));
        root.add(net);
        const nodeGeo = new THREE.BufferGeometry();
        nodeGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertices.slice(), 3).setUsage(THREE.DynamicDrawUsage));
        nodeGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        const nodes = new THREE.Points(nodeGeo, new THREE.PointsMaterial({ size: 4.4, vertexColors: true, transparent: true, opacity: .98, blending: THREE.AdditiveBlending, sizeAttenuation: true, depthWrite: false }));
        root.add(nodes);
        // Star field adds depth behind the connected neuron mesh.
        const starPositions = [], starColors = [];
        for (let i = 0; i < 1500; i++) {
          starPositions.push((Math.random() - .5) * 2100, (Math.random() - .5) * 1200, -Math.random() * 1100 - 120);
          c.setHSL(.56 + Math.random() * .25, .55, .55 + Math.random() * .4);
          starColors.push(c.r, c.g, c.b);
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
        starGeo.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3));
        const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.7, vertexColors: true, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false }));
        scene.add(stars);
        // Curved, luminous data streams arc across the field like the supplied reference.
        const trails = new THREE.Group();
        for (let k = 0; k < 7; k++) {
          const points = [];
          for (let j = 0; j <= 180; j++) {
            const u = j / 180;
            points.push(new THREE.Vector3((u - .5) * 1900, (k - 3) * 24 + Math.sin(u * 5.2 + k * .62) * 155 + Math.sin(u * 9.5 + k) * 38 + 75, -220 - k * 16 - Math.sin(u * 6 + k) * 30));
          }
          const geo = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({ color: palette[k % palette.length], transparent: true, opacity: .32 + (k % 3) * .09, blending: THREE.AdditiveBlending, depthWrite: false });
          trails.add(new THREE.Line(geo, material));
        }
        root.add(trails);
        // Traveling bright packets move through the mesh.
        const packetCount = 90;
        const packetPositions = new Float32Array(packetCount * 3);
        const packetColors = new Float32Array(packetCount * 3);
        for (let i = 0; i < packetCount; i++) {
          c.setHex(palette[i % palette.length]);
          packetColors.set([c.r, c.g, c.b], i * 3);
        }
        const packetGeo = new THREE.BufferGeometry();
        packetGeo.setAttribute("position", new THREE.BufferAttribute(packetPositions, 3).setUsage(THREE.DynamicDrawUsage));
        packetGeo.setAttribute("color", new THREE.BufferAttribute(packetColors, 3));
        const packets = new THREE.Points(packetGeo, new THREE.PointsMaterial({ size: 6.5, vertexColors: true, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
        root.add(packets);
        const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
        const onPointer = e => { pointer.tx = (e.clientX / Math.max(1, innerWidth) - .5) * 28; pointer.ty = (e.clientY / Math.max(1, innerHeight) - .5) * -18; };
        window.addEventListener("pointermove", onPointer, { passive: true });
        const resize = () => {
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
          renderer.setSize(window.innerWidth, window.innerHeight, false);
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", resize, { passive: true });
        let raf = 0, last = 0, elapsed = 0;
        const animate = now => {
          raf = requestAnimationFrame(animate);
          if (now - last < 24) return;
          const dt = Math.min(.05, (now - last) / 1000 || .016);
          last = now; elapsed += dt;
          const pos = netGeo.attributes.position.array;
          const npos = nodeGeo.attributes.position.array;
          for (let i = 0; i < base.length / 3; i++) {
            const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
            const col = i % cols, row = Math.floor(i / cols);
            const wave = Math.sin(col * .32 + elapsed * 1.15 + row * .17) * 22 + Math.cos(row * .37 - elapsed * .9 + col * .11) * 13;
            pos[i * 3] = x;
            pos[i * 3 + 1] = y + wave;
            pos[i * 3 + 2] = z + Math.sin(col * .2 + elapsed) * 20;
            npos[i * 3] = pos[i * 3]; npos[i * 3 + 1] = pos[i * 3 + 1]; npos[i * 3 + 2] = pos[i * 3 + 2];
          }
          netGeo.attributes.position.needsUpdate = true;
          nodeGeo.attributes.position.needsUpdate = true;
          for (let i = 0; i < packetCount; i++) {
            const progress = (elapsed * (.12 + (i % 7) * .012) + i / packetCount) % 1;
            const col = Math.floor(progress * (cols - 1));
            const row = (i * 7 + Math.floor(elapsed * 2 + i)) % (rows - 1);
            const a = row * cols + col, b = (row + 1) * cols + Math.min(cols - 1, col + 1);
            const t = (progress * (cols - 1)) % 1;
            packetPositions[i * 3] = pos[a * 3] + (pos[b * 3] - pos[a * 3]) * t;
            packetPositions[i * 3 + 1] = pos[a * 3 + 1] + (pos[b * 3 + 1] - pos[a * 3 + 1]) * t;
            packetPositions[i * 3 + 2] = pos[a * 3 + 2] + (pos[b * 3 + 2] - pos[a * 3 + 2]) * t + 2;
          }
          packetGeo.attributes.position.needsUpdate = true;
          pointer.x += (pointer.tx - pointer.x) * .035;
          pointer.y += (pointer.ty - pointer.y) * .035;
          root.rotation.y = pointer.x * .0018 + Math.sin(elapsed * .22) * .025;
          root.rotation.x = pointer.y * .0014 + Math.sin(elapsed * .18) * .018;
          trails.rotation.y = root.rotation.y * .65;
          stars.rotation.y = Math.sin(elapsed * .04) * .015;
          renderer.render(scene, camera);
        };
        document.addEventListener("visibilitychange", () => { if (!document.hidden && !raf) raf = requestAnimationFrame(animate); });
        animate(0);
      } catch (error) {
        console.error("Three.js background failed; starting animated neural fallback.", error);
        // Keep the requested visual even when WebGL or the external module CDN is unavailable.
        const fallback = document.createElement("canvas");
        fallback.id = "neural-fallback";
        fallback.setAttribute("aria-hidden", "true");
        document.body.insertBefore(fallback, document.body.firstChild);
        const fctx = fallback.getContext("2d");
        if (!fctx) return;
        let w=0,h=0,dpr=1,frame=0,t=0;
        const dots=[];
        const resizeFallback=()=>{
          w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);
          fallback.width=Math.round(w*dpr);fallback.height=Math.round(h*dpr);
          fallback.style.width=w+"px";fallback.style.height=h+"px";
          fctx.setTransform(dpr,0,0,dpr,0,0);
          dots.length=0;
          const cols=w<600?19:29,rows=w<600?12:17;
          for(let r=0;r<rows;r++)for(let col=0;col<cols;col++)dots.push({
            x:(col/(cols-1)-.5)*w*1.7,y:(r/(rows-1)-.5)*h*1.35,
            z:r/(rows-1),phase:Math.random()*6.28,
            color:["#d95cff","#a47bff","#62dcff","#6dffd6","#b5ff75"][((col*3+r*2)%5)]
          });
        };
        const paint=()=>{
          frame=requestAnimationFrame(paint);t+=.012;
          fctx.clearRect(0,0,w,h);
          const glow=fctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,Math.max(w,h)*.8);
          glow.addColorStop(0,"rgba(83,39,151,.3)");glow.addColorStop(1,"rgba(4,6,17,0)");
          fctx.fillStyle=glow;fctx.fillRect(0,0,w,h);
          const projected=dots.map((p,i)=>{
            const wave=Math.sin(i%29*.28+t+p.z*4)*24+Math.cos(Math.floor(i/29)*.4-t)*17;
            const scale=1.15-p.z*.42;
            return {x:w*.5+p.x*scale,y:h*.56+p.y*scale+wave,z:p.z,color:p.color};
          });
          fctx.lineWidth=.8;
          for(let i=0;i<projected.length;i++){
            const p=projected[i],col=i%(w<600?19:29),rows=w<600?12:17,cols=w<600?19:29;
            const neighbors=[col<cols-1?i+1:-1, i+cols<projected.length?i+cols:-1, col<cols-1&&i+cols+1<projected.length?i+cols+1:-1];
            for(const j of neighbors){if(j<0)continue;const q=projected[j];fctx.beginPath();fctx.moveTo(p.x,p.y);fctx.lineTo(q.x,q.y);fctx.strokeStyle=p.color;fctx.globalAlpha=.22+p.z*.42;fctx.stroke();}
            fctx.globalAlpha=1;fctx.beginPath();fctx.arc(p.x,p.y,1.2+p.z*1.5,0,Math.PI*2);fctx.fillStyle=p.color;fctx.shadowColor=p.color;fctx.shadowBlur=12;fctx.fill();fctx.shadowBlur=0;
          }
          // Long flowing neon strands like the reference artwork.
          for(let k=0;k<7;k++){fctx.beginPath();for(let i=0;i<=140;i++){const u=i/140,x=u*w,y=h*.42+(k-3)*15+Math.sin(u*6+t*.7+k*.7)*h*.13+Math.sin(u*12-t+k)*h*.035;if(i===0)fctx.moveTo(x,y);else fctx.lineTo(x,y);}const g=fctx.createLinearGradient(0,h*.2,w,h*.7);g.addColorStop(0,"rgba(205,85,255,0)");g.addColorStop(.3,"rgba(205,85,255,.6)");g.addColorStop(.7,"rgba(92,225,255,.55)");g.addColorStop(1,"rgba(100,255,210,0)");fctx.strokeStyle=g;fctx.lineWidth=k===3?2.5:1.3;fctx.stroke();}
          for(let k=0;k<40;k++){const i=(k*11+Math.floor(t*20))%projected.length,p=projected[i];fctx.beginPath();fctx.arc(p.x,p.y,1.8,0,Math.PI*2);fctx.fillStyle=p.color;fctx.shadowColor=p.color;fctx.shadowBlur=16;fctx.fill();fctx.shadowBlur=0;}
        };
        resizeFallback();addEventListener("resize",resizeFallback,{passive:true});paint();
      }
    })();
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