gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════
   HERO ENTRANCE ANIMATION
════════════════════════════════════════════════════════ */
gsap.from(".hero-eyebrow", { opacity: 0, y: 20, duration: 0.8, delay: 0.1, ease: "expo.out" });
gsap.from(".hero-title", { opacity: 0, y: 30, duration: 1, delay: 0.2, ease: "expo.out" });
gsap.from(".hero-sub", { opacity: 0, y: 20, duration: 0.8, delay: 0.4, ease: "expo.out" });
gsap.from(".hero-cta", { opacity: 0, y: 20, duration: 0.8, delay: 0.5, ease: "expo.out" });

/* ════════════════════════════════════════════════════════
   SCROLL REVEALS
════════════════════════════════════════════════════════ */
gsap.utils.toArray(".rev").forEach((el) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } },
  );
});

gsap.utils.toArray(".project-card").forEach((r, i) => {
  gsap.fromTo(
    r,
    { opacity: 0, y: 16 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "expo.out",
      delay: i * 0.05,
      scrollTrigger: { trigger: r, start: "top 92%" },
    },
  );
});

gsap.utils.toArray(".cert-row, .achieve-row").forEach((r, i) => {
  gsap.fromTo(
    r,
    { opacity: 0, x: -16 },
    {
      opacity: 1,
      x: 0,
      duration: 0.6,
      ease: "expo.out",
      delay: i * 0.05,
      scrollTrigger: { trigger: r, start: "top 90%" },
    },
  );
});

/* ════════════════════════════════════════════════════════
   PROJECT CARD EXPAND/COLLAPSE
════════════════════════════════════════════════════════ */
document.querySelectorAll(".project-card").forEach((card) => {
  card.addEventListener("click", (e) => {
    // Don't toggle if clicking a link inside the card body
    if (e.target.closest(".card-link")) return;

    const isExpanded = card.classList.contains("expanded");

    // Close all cards
    document.querySelectorAll(".project-card.expanded").forEach((c) => c.classList.remove("expanded"));

    // Open this one if it wasn't already open
    if (!isExpanded) {
      card.classList.add("expanded");
      // Scroll card into view if partially hidden
      setTimeout(() => {
        const rect = card.getBoundingClientRect();
        if (rect.top < 60) {
          window.scrollBy({ top: rect.top - 70, behavior: "smooth" });
        }
      }, 50);
    }
  });
});

/* ════════════════════════════════════════════════════════
   FILTER BUTTONS
════════════════════════════════════════════════════════ */
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const category = btn.dataset.filter;

    // Update active state
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Show/hide cards
    document.querySelectorAll(".project-card").forEach((card) => {
      if (category === "all" || card.dataset.category === category) {
        card.style.display = "";
      } else {
        card.style.display = "none";
        card.classList.remove("expanded");
      }
    });
  });
});

/* ════════════════════════════════════════════════════════
   MOBILE NAV TOGGLE
════════════════════════════════════════════════════════ */
const navToggle = document.getElementById("nav-toggle");
const navDrawer = document.getElementById("nav-drawer");

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
   MAGNETIC EMAIL BUTTON
════════════════════════════════════════════════════════ */
const mb = document.getElementById("mag-btn");
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
