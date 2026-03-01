history.scrollRestoration = "manual";
window.scrollTo(0, 0);
gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════
   WEBGL — GLSL SHADER BACKGROUND + PARTICLE LAYER
════════════════════════════════════════════════════════ */
let webglTick; // assigned below; consumed by unified RAF loop

(function () {
  const canvas = document.getElementById("webgl-canvas");
  // antialias off  — full-screen organic shader has no hard edges to antialias
  // pixelRatio 1   — shader is blurry noise; 2x costs 4x GPU with zero visual gain on Retina
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(1);
  renderer.setSize(innerWidth, innerHeight);
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const vert = `void main(){gl_Position=vec4(position,1.0);}`;
  const frag = `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_res;
    uniform vec2  u_mouse;
    vec3 hash3(vec2 p){
      vec3 q=vec3(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)),dot(p,vec2(419.2,371.9)));
      return fract(sin(q)*43758.5453);
    }
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
      return mix(mix(dot(hash3(i).xy,f-vec2(0,0)),dot(hash3(i+vec2(1,0)).xy,f-vec2(1,0)),u.x),
                 mix(dot(hash3(i+vec2(0,1)).xy,f-vec2(0,1)),dot(hash3(i+vec2(1,1)).xy,f-vec2(1,1)),u.x),u.y);
    }
    float fbm(vec2 p){float v=0.,a=.5;vec2 s=vec2(1);for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.+s;a*=.5;}return v;}
    void main(){
      vec2 uv=gl_FragCoord.xy/u_res;
      vec2 st=uv*2.-1.; st.x*=u_res.x/u_res.y;
      vec2 mouse=(u_mouse/u_res)*2.-1.; st+=mouse*0.08;
      float t=u_time*0.18;
      vec2 q=vec2(fbm(st+t),fbm(st+vec2(1.7,9.2)));
      vec2 r=vec2(fbm(st+3.*q+vec2(1.7+t*.15,9.2)),fbm(st+3.*q+vec2(8.3+t*.126,2.8)));
      float f=fbm(st+2.5*r);
      vec3 bg=vec3(.031,.031,.035),coral=vec3(.855,.467,.337),warm=vec3(.831,.647,.455),dark=vec3(.06,.055,.07);
      vec3 col=mix(bg,dark,clamp(f*f*4.,0.,1.));
      col=mix(col,coral,clamp(f*f*2.5,0.,1.));
      col=mix(col,warm,clamp(length(r)-.4,0.,1.));
      float vig=1.-dot(uv-.5,uv-.5)*2.2;
      col*=clamp(vig,0.,1.)*0.55;
      gl_FragColor=vec4(col,1.);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      u_time: { value: 0 },
      u_res: { value: new THREE.Vector2(innerWidth, innerHeight) },
      u_mouse: { value: new THREE.Vector2(innerWidth / 2, innerHeight / 2) },
    },
    depthTest: false,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  document.addEventListener("mousemove", (e) => {
    mat.uniforms.u_mouse.value.set(e.clientX, innerHeight - e.clientY);
  });

  /* Particle layer — fewer on mobile for performance */
  const pCam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1000);
  pCam.position.z = 5;
  const pScene = new THREE.Scene();
  const N = window.innerWidth < 768 ? 250 : 700;
  const pp = new Float32Array(N * 3),
    pc = new Float32Array(N * 3);
  const c1 = new THREE.Color("#da7756"),
    c2 = new THREE.Color("#d4a574"),
    c3 = new THREE.Color("#2a2a38");
  for (let i = 0; i < N; i++) {
    pp[i * 3] = (Math.random() - 0.5) * 18;
    pp[i * 3 + 1] = (Math.random() - 0.5) * 18;
    pp[i * 3 + 2] = (Math.random() - 0.5) * 8;
    const t = Math.random(),
      c = t < 0.2 ? c1 : t < 0.38 ? c2 : c3;
    pc[i * 3] = c.r;
    pc[i * 3 + 1] = c.g;
    pc[i * 3 + 2] = c.b;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  pg.setAttribute("color", new THREE.BufferAttribute(pc, 3));
  const pts = new THREE.Points(
    pg,
    new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    }),
  );
  pScene.add(pts);

  let ptx = 0,
    pty = 0,
    pcx2 = 0,
    pcy2 = 0;
  document.addEventListener("mousemove", (e) => {
    ptx = (e.clientX / innerWidth - 0.5) * 0.5;
    pty = -(e.clientY / innerHeight - 0.5) * 0.5;
  });

  let heroVisible = true,
    clk = 0;
  ScrollTrigger.create({
    trigger: "#hero",
    start: "top top",
    end: "bottom top",
    onLeave: () => (heroVisible = false),
    onEnterBack: () => (heroVisible = true),
  });

  window.addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight);
    mat.uniforms.u_res.value.set(innerWidth, innerHeight);
    pCam.aspect = innerWidth / innerHeight;
    pCam.updateProjectionMatrix();
  });

  webglTick = (dt) => {
    if (!heroVisible) return;
    clk += dt;
    mat.uniforms.u_time.value = clk;
    renderer.clear();
    renderer.render(scene, cam);
    pts.rotation.y += 0.00014;
    pts.rotation.x += 0.00007;
    pcx2 += (ptx - pcx2) * 0.03;
    pcy2 += (pty - pcy2) * 0.03;
    pCam.position.x = pcx2;
    pCam.position.y = pcy2;
    renderer.render(pScene, pCam);
  };
})();

/* ════════════════════════════════════════════════════════
   CURSOR — GPU-accelerated via CSS custom properties
   Lerp factor 0.22 (vs 0.12) = smoother & faster tracking
════════════════════════════════════════════════════════ */
const cur = document.getElementById("cur");
const cxEl = document.getElementById("cx");
const cyEl = document.getElementById("cy");
const wp = document.getElementById("wpreview");
const wimg = document.getElementById("wpreview-img");

let mx = innerWidth / 2,
  my = innerHeight / 2;
let rx = mx,
  ry = my;

document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
  if (cxEl) cxEl.textContent = mx.toFixed(1).padStart(5, "0");
  if (cyEl) cyEl.textContent = my.toFixed(1).padStart(5, "0");
  if (wp) {
    wp.style.left = mx + 20 + "px";
    wp.style.top = my - 85 + "px";
  }
});

/* ════════════════════════════════════════════════════════
   UNIFIED RAF LOOP — cursor lerp + WebGL in one tick
   Pauses entirely when tab is hidden (document.hidden)
════════════════════════════════════════════════════════ */
let lastTs = 0;
function tick(ts) {
  if (!document.hidden) {
    const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
    lastTs = ts;

    rx += (mx - rx) * 0.22;
    ry += (my - ry) * 0.22;
    if (cur) {
      cur.style.setProperty("--cx", rx + "px");
      cur.style.setProperty("--cy", ry + "px");
    }

    if (webglTick) webglTick(dt);
  } else {
    lastTs = 0;
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* Hover states for cursor enlargement */
document
  .querySelectorAll("a,button,.work-row,.chip,.tool-row,.mag-btn,.mag-btn-ghost,.cert-row,.achieve-row")
  .forEach((el) => {
    el.addEventListener("mouseenter", () => cur && cur.classList.add("on-link"));
    el.addEventListener("mouseleave", () => cur && cur.classList.remove("on-link"));
  });

/* Work row preview tooltip — shows actual project screenshot */
document.querySelectorAll(".work-row").forEach((r) => {
  r.addEventListener("mouseenter", () => {
    if (!wimg || !wp) return;
    wimg.src = r.dataset.img;
    wimg.alt = r.dataset.label;
    wp.classList.add("show");
  });
  r.addEventListener("mouseleave", () => wp && wp.classList.remove("show"));
});

/* ════════════════════════════════════════════════════════
   MOBILE NAV TOGGLE
════════════════════════════════════════════════════════ */
const navToggle = document.getElementById("navToggle");
const navDrawer = document.getElementById("navDrawer");

if (navToggle && navDrawer) {
  navToggle.addEventListener("click", () => {
    navToggle.classList.toggle("open");
    navDrawer.classList.toggle("open");
  });

  navDrawer.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      navToggle.classList.remove("open");
      navDrawer.classList.remove("open");
    });
  });
}

/* ════════════════════════════════════════════════════════
   LOADER
════════════════════════════════════════════════════════ */
const ln = document.getElementById("loadNum");
const lb = document.getElementById("loadBar");
const ll1 = document.getElementById("ll1");
const ll2 = document.getElementById("ll2");
const ll3 = document.getElementById("ll3");
let pct = 0;

const lv = setInterval(() => {
  pct += Math.random() * 15;
  if (pct >= 100) {
    pct = 100;
    clearInterval(lv);
    boot();
  }
  if (ln) ln.textContent = Math.floor(pct);
  if (lb) lb.style.width = pct + "%";
  if (ll1) ll1.style.width = Math.min(pct * 2.2, 200) + "px";
  if (ll2) ll2.style.width = Math.min(Math.max((pct - 25) * 2.2, 0), 170) + "px";
  if (ll3) ll3.style.width = Math.min(Math.max((pct - 50) * 2.2, 0), 140) + "px";
}, 95);

function boot() {
  const loader = document.getElementById("loader");
  gsap.to("#loader", {
    yPercent: -100,
    duration: 1.1,
    ease: "expo.inOut",
    delay: 0.4,
    onComplete: () => {
      if (loader) loader.style.display = "none";
    },
  });
  gsap.to("#nav", { opacity: 1, duration: 0.6, ease: "expo.out", delay: 0.8 });
  gsap.to(".li", { y: "0%", duration: 1.4, ease: "expo.out", stagger: 0.1, delay: 0.9 });
  gsap.to(".hero-tag", { opacity: 1, duration: 0.6, delay: 1.2 });
  gsap.to(".hcell", { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.08, delay: 1.2 });
  gsap.to(".hero-corner", { opacity: 1, duration: 0.5, delay: 1.4 });
  setTimeout(startTerm, 2400);
}

/* ════════════════════════════════════════════════════════
   SCROLL REVEALS
════════════════════════════════════════════════════════ */
gsap.utils.toArray(".rev").forEach((el) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } },
  );
});

gsap.utils.toArray(".work-row").forEach((r, i) => {
  gsap.fromTo(
    r,
    { opacity: 0, x: -18 },
    {
      opacity: 1,
      x: 0,
      duration: 0.7,
      ease: "expo.out",
      delay: i * 0.06,
      scrollTrigger: { trigger: r, start: "top 90%" },
    },
  );
});

gsap.utils.toArray(".cert-row, .achieve-row").forEach((r, i) => {
  gsap.fromTo(
    r,
    { opacity: 0, x: -18 },
    {
      opacity: 1,
      x: 0,
      duration: 0.7,
      ease: "expo.out",
      delay: i * 0.06,
      scrollTrigger: { trigger: r, start: "top 90%" },
    },
  );
});

/* ════════════════════════════════════════════════════════
   TERMINAL ANIMATION
════════════════════════════════════════════════════════ */
let tDone = false;

function startTerm() {
  if (tDone) return;
  tDone = true;
  for (let i = 0; i <= 7; i++) {
    const el = document.getElementById("tl" + i);
    if (el) gsap.to(el, { opacity: 1, duration: 0.25, delay: 0.3 + i * 0.27 });
  }
  setTimeout(() => {
    const el = document.getElementById("tscramble");
    if (el) scramble(el, "ships products users love.");
  }, 2600);
}

ScrollTrigger.create({ trigger: ".intro-section", start: "top 80%", onEnter: startTerm });

function scramble(el, final) {
  const ch = "abcdefghijklmnopqrstuvwxyz!@#$01";
  let f = 0,
    max = 22;
  const iv = setInterval(() => {
    el.textContent = final
      .split("")
      .map((c, i) => (f > i * (max / final.length) ? c : c === " " ? " " : ch[Math.floor(Math.random() * ch.length)]))
      .join("");
    if (++f > max) {
      el.textContent = final;
      clearInterval(iv);
    }
  }, 55);
}

/* ════════════════════════════════════════════════════════
   PARALLAX
════════════════════════════════════════════════════════ */
gsap.to(".cbg", {
  yPercent: 15,
  scrollTrigger: { trigger: ".contact-section", start: "top bottom", end: "bottom top", scrub: true },
});

/* ════════════════════════════════════════════════════════
   MAGNETIC EMAIL BUTTON
════════════════════════════════════════════════════════ */
const mb = document.getElementById("magBtn");
if (mb) {
  mb.addEventListener("mousemove", (e) => {
    const r = mb.getBoundingClientRect();
    gsap.to(mb, {
      x: (e.clientX - r.left - r.width / 2) * 0.35,
      y: (e.clientY - r.top - r.height / 2) * 0.35,
      duration: 0.4,
      ease: "power2.out",
    });
  });
  mb.addEventListener("mouseleave", () => {
    gsap.to(mb, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,.4)" });
  });
}

/* ════════════════════════════════════════════════════════
   NAV SCROLL STATE
════════════════════════════════════════════════════════ */
window.addEventListener("scroll", () => {
  document.getElementById("nav").classList.toggle("scrolled", scrollY > 60);
});
