(() => {
  "use strict";
  const canvas = document.getElementById("neural-canvas");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas && canvas.getContext("2d", { alpha: true });
  const card = document.getElementById("profile-card");
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // 3D particle-web background inspired by the supplied reference image.
  // The mesh is projected in perspective and continuously ripples like a living neural field.
  if (canvas && ctx) {
    let width=0,height=0,dpr=1,raf=0,lastFrame=0,phase=0;
    const pointer={x:0,y:0,tx:0,ty:0};
    let stars=[], mesh=[], cols=32, rows=17;
    const colors=["#e05cff","#d16bff","#9278ff","#63f4d1","#55dfff","#a4ff70"];
    function resize(){
      width=window.innerWidth;height=window.innerHeight;
      dpr=Math.min(window.devicePixelRatio||1,1.5);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      canvas.style.width=width+"px";canvas.style.height=height+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      cols=width<600?22:34;rows=width<600?13:18;
      stars=Array.from({length:Math.min(210,Math.round(width*height/5200))},()=>({
        x:Math.random()*width,y:Math.random()*height,z:.2+Math.random()*.8,
        r:.35+Math.random()*1.25,a:.15+Math.random()*.65,tw:Math.random()*6.28
      }));
      mesh=[];
      for(let r=0;r<rows;r++)for(let col=0;col<cols;col++)
        mesh.push({r,col,seed:Math.random()*6.28,color:colors[Math.floor(Math.random()*colors.length)]});
    }
    function project(x,y,z){
      const focal=Math.max(width,height)*.92;
      const cameraZ=700;
      const scale=focal/(focal+z+cameraZ);
      return {x:width/2+x*scale+pointer.x*-.22*scale,y:height*.57+y*scale+pointer.y*-.16*scale,scale};
    }
    function draw(time){
      raf=0;if(document.hidden)return;
      if(time-lastFrame<25){raf=requestAnimationFrame(draw);return;}
      lastFrame=time;phase=time*(reduceMotion?.00018:.00042);
      ctx.clearRect(0,0,width,height);
      // Deep-space glow, like the reference, while preserving page readability.
      const haze=ctx.createRadialGradient(width*.52,height*.52,0,width*.52,height*.52,Math.max(width,height)*.78);
      haze.addColorStop(0,"rgba(70,28,145,.38)");haze.addColorStop(.48,"rgba(14,19,44,.2)");haze.addColorStop(1,"rgba(3,5,14,0)");
      ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
      for(const s of stars){
        const tw=.65+.35*Math.sin(time*.0007+s.tw);
        ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle="rgba(225,230,255,"+(s.a*tw)+")";ctx.fill();
      }
      pointer.x+=(pointer.tx-pointer.x)*.035;pointer.y+=(pointer.ty-pointer.y)*.035;
      const pts=[];
      for(let r=0;r<rows;r++){
        const line=[];
        for(let col=0;col<cols;col++){
          const u=col/(cols-1),v=r/(rows-1);
          // A perspective mesh with long rolling waves and a dense lower network.
          const x=(u-.5)*width*1.72;
          const depth=v;
          const y=(v-.43)*height*1.2 + Math.sin(u*7.1+phase*1.8+v*2.2)*42
            +Math.sin(u*13.5-phase*1.15+v*3.4)*16
            +Math.cos(u*4.4-phase+v*5.2)*18;
          const z=100+v*650+Math.sin(u*5.5+phase)*34;
          const p=project(x,y,z);
          p.u=u;p.v=v;p.wave=y;p.col=col;p.row=r;
          p.color=colors[(col+r*2)%colors.length];
          line.push(p);
        }
        pts.push(line);
      }
      // Curved flowing strands running through the upper portion of the scene.
      for(let strand=0;strand<5;strand++){
        ctx.beginPath();
        for(let i=0;i<=100;i++){
          const u=i/100;
          const x=(u-.5)*width*1.9;
          const y=(strand-2)*22+Math.sin(u*4.8+phase*1.2+strand*.65)*height*.19
            +Math.sin(u*8.4-phase*.7+strand)*height*.035-height*.07;
          const p=project(x,y,250+strand*24);
          if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
        }
        const grad=ctx.createLinearGradient(0,height*.2,width,height*.45);
        grad.addColorStop(0,"rgba(189,94,255,0)");
        grad.addColorStop(.28,strand%2?"rgba(205,96,255,.55)":"rgba(134,119,255,.58)");
        grad.addColorStop(.72,strand%2?"rgba(109,255,201,.5)":"rgba(96,207,255,.5)");
        grad.addColorStop(1,"rgba(116,239,214,0)");
        ctx.strokeStyle=grad;ctx.lineWidth=strand===2?2.8:1.6;ctx.stroke();
      }
      // Perspective mesh connections.
      for(let r=0;r<rows;r++){
        for(let col=0;col<cols;col++){
          const p=pts[r][col];
          const near=pts[r+1]?.[col];
          const right=pts[r][col+1];
          const diag=pts[r+1]?.[col+1];
          const depthAlpha=.22+(r/rows)*.48;
          const stroke=(q,alpha)=>{if(!q)return;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle="rgba(151,133,255,"+(Math.min(.78,alpha*1.65))+")";ctx.lineWidth=.55+(r/rows)*.3;ctx.stroke();};
          stroke(right,depthAlpha*.8);stroke(near,depthAlpha);
          if(diag && (col%2===0 || r%3===0))stroke(diag,depthAlpha*.42);
          // Glowing neuron points with varied colors and soft bloom.
          const pulse=.65+.35*Math.sin(time*.0013+p.u*11+p.v*8);
          const radius=(.7+(r/rows)*1.5)*pulse;
          ctx.beginPath();ctx.arc(p.x,p.y,radius*4.6,0,Math.PI*2);
          ctx.fillStyle=p.color;ctx.globalAlpha=.2+(r/rows)*.22;ctx.fill();ctx.globalAlpha=1;
          ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);
          ctx.fillStyle=p.color;ctx.globalAlpha=.72+(r/rows)*.28;ctx.fill();ctx.globalAlpha=1;
        }
      }
      // Traveling light packets along the network.
      for(let k=0;k<12;k++){
        const r=(k*3+Math.floor(time/620))%(rows-1);
        const col=(k*5+Math.floor(time/410))%(cols-1);
        const a=pts[r][col],b=pts[r+1][Math.min(cols-1,col+1)];
        const t=(time*.00055+k*.173)%1;
        const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
        ctx.beginPath();ctx.arc(x,y,1.1+(k%3)*.35,0,Math.PI*2);
        ctx.fillStyle=k%3===0?"#d78aff":k%3===1?"#7fffe0":"#a8a0ff";
        ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0;
      }
      raf=requestAnimationFrame(draw);
    }
    function start(){if(!raf&&!document.hidden)raf=requestAnimationFrame(draw);}
    function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
    window.addEventListener("resize",resize,{passive:true});
    window.addEventListener("pointermove",e=>{pointer.tx=(e.clientX/Math.max(1,width)-.5)*45;pointer.ty=(e.clientY/Math.max(1,height)-.5)*35;},{passive:true});
    document.addEventListener("visibilitychange",()=>document.hidden?stop():start());
    resize();start();
  } else if(canvas && !ctx) { canvas.style.display="none"; }

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