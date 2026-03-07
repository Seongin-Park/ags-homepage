/* === AGS America — Scroll-Driven Website === */

(function () {
  "use strict";

  const FRAME_COUNT = 192;
  const FRAME_SPEED = 1.1;
  const IMAGE_SCALE = 0.85;

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const canvasWrap = document.getElementById("canvas-wrap");
  const scrollContainer = document.getElementById("scroll-container");
  const heroSection = document.getElementById("hero");
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderPercent = document.getElementById("loader-percent");

  const frames = new Array(FRAME_COUNT);
  let currentFrame = 0;
  let bgColor = "#111111";

  // === Lenis Smooth Scroll ===
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // === Canvas Resize ===
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.scale(dpr, dpr);
    drawFrame(currentFrame);
  }
  window.addEventListener("resize", resizeCanvas);

  // === Sample BG Color from frame edges ===
  function sampleBgColor(img) {
    const tmp = document.createElement("canvas");
    tmp.width = img.naturalWidth;
    tmp.height = img.naturalHeight;
    const tctx = tmp.getContext("2d");
    tctx.drawImage(img, 0, 0);
    const corners = [
      tctx.getImageData(2, 2, 1, 1).data,
      tctx.getImageData(img.naturalWidth - 3, 2, 1, 1).data,
      tctx.getImageData(2, img.naturalHeight - 3, 1, 1).data,
      tctx.getImageData(img.naturalWidth - 3, img.naturalHeight - 3, 1, 1).data,
    ];
    let r = 0, g = 0, b = 0;
    corners.forEach((c) => { r += c[0]; g += c[1]; b += c[2]; });
    r = Math.round(r / 4);
    g = Math.round(g / 4);
    b = Math.round(b / 4);
    return `rgb(${r},${g},${b})`;
  }

  // === Draw Frame ===
  function drawFrame(index) {
    const img = frames[index];
    if (!img) return;
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // === Frame Preloader (two-phase) ===
  function loadFrame(i) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        frames[i] = img;
        if (i % 20 === 0) bgColor = sampleBgColor(img);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = `frames/frame_${String(i + 1).padStart(4, "0")}.webp`;
    });
  }

  async function preloadFrames() {
    let loaded = 0;
    function updateProgress() {
      loaded++;
      const pct = Math.round((loaded / FRAME_COUNT) * 100);
      loaderBar.style.width = pct + "%";
      loaderPercent.textContent = pct + "%";
    }

    // Phase 1: first 10 frames
    const phase1 = [];
    for (let i = 0; i < Math.min(10, FRAME_COUNT); i++) {
      phase1.push(loadFrame(i).then(updateProgress));
    }
    await Promise.all(phase1);

    // Draw first frame immediately
    resizeCanvas();
    drawFrame(0);

    // Phase 2: remaining frames
    const phase2 = [];
    for (let i = 10; i < FRAME_COUNT; i++) {
      phase2.push(loadFrame(i).then(updateProgress));
    }
    await Promise.all(phase2);

    // All loaded — hide loader and init
    loader.classList.add("loaded");
    initAnimations();
  }

  // === Hero Word Animation ===
  function animateHero() {
    const words = heroSection.querySelectorAll(".hero-heading span");
    gsap.to(words, {
      opacity: 1,
      y: 0,
      stagger: 0.15,
      duration: 1.2,
      ease: "power3.out",
      delay: 0.3,
    });
  }

  // === Init All Animations ===
  function initAnimations() {
    animateHero();
    initHeroTransition();
    initFrameScroll();
    initSections();
    initMarquees();
    initCounters();
  }

  // === Circle-Wipe Hero Reveal ===
  function initHeroTransition() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        heroSection.style.opacity = Math.max(0, 1 - p * 15);
        const wipeProgress = Math.min(1, Math.max(0, (p - 0.01) / 0.06));
        const radius = wipeProgress * 75;
        canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
      },
    });
  }

  // === Frame-to-Scroll Binding ===
  function initFrameScroll() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
        const index = Math.min(
          Math.floor(accelerated * FRAME_COUNT),
          FRAME_COUNT - 1
        );
        if (index !== currentFrame) {
          currentFrame = index;
          requestAnimationFrame(() => drawFrame(currentFrame));
        }
      },
    });
  }

  // === Section Animation System ===
  function initSections() {
    document.querySelectorAll(".scroll-section").forEach((section) => {
      const enter = parseFloat(section.dataset.enter) / 100;
      const leave = parseFloat(section.dataset.leave) / 100;
      const mid = (enter + leave) / 2;
      const containerH = scrollContainer.offsetHeight;
      section.style.top = mid * containerH + "px";
      section.style.transform = "translateY(-50%)";

      setupSectionAnimation(section, enter, leave);
    });
  }

  function setupSectionAnimation(section, enter, leave) {
    const type = section.dataset.animation;
    const persist = section.dataset.persist === "true";
    const children = section.querySelectorAll(
      ".section-label, .section-heading, .section-body, .section-note, .cta-button, .stat"
    );

    const tl = gsap.timeline({ paused: true });

    switch (type) {
      case "fade-up":
        tl.from(children, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" });
        break;
      case "slide-left":
        tl.from(children, { x: -80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" });
        break;
      case "slide-right":
        tl.from(children, { x: 80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" });
        break;
      case "scale-up":
        tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: "power2.out" });
        break;
      case "rotate-in":
        tl.from(children, { y: 40, rotation: 3, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power3.out" });
        break;
      case "stagger-up":
        tl.from(children, { y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" });
        break;
      case "clip-reveal":
        tl.from(children, { clipPath: "inset(100% 0 0 0)", opacity: 0, stagger: 0.15, duration: 1.2, ease: "power4.inOut" });
        break;
    }

    let wasVisible = false;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        const fadeIn = 0.03;
        const isInRange = p >= enter && p <= leave;
        const isEntering = p >= enter - fadeIn && p < enter;

        // Check if section has scrolled above viewport
        const rect = section.getBoundingClientRect();
        const sectionBottom = rect.bottom;
        const headerHeight = 80;
        const sectionCenter = rect.top + rect.height / 2;
        const scrolledAbove = sectionCenter < -50;

        if ((isInRange || isEntering) && !scrolledAbove) {
          if (!wasVisible) {
            section.classList.add("visible");
            tl.play();
            wasVisible = true;
          }
          // Fade out only when section center is above viewport top
          const sectionCenter = rect.top + rect.height / 2;
          if (sectionCenter < 0) {
            section.style.opacity = "0";
          } else if (sectionCenter < 150) {
            section.style.opacity = String(sectionCenter / 150);
          } else {
            section.style.opacity = "";
          }
        } else {
          if (wasVisible && !(persist && p > leave)) {
            section.classList.remove("visible");
            section.style.opacity = "";
            tl.reverse();
            wasVisible = false;
          }
        }
      },
    });
  }

  // === Dark Overlay ===
  function initDarkOverlay(enter, leave) {
    const overlay = document.getElementById("dark-overlay");
    const fadeRange = 0.04;
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        let opacity = 0;
        if (p >= enter - fadeRange && p <= enter) {
          opacity = (p - (enter - fadeRange)) / fadeRange;
        } else if (p > enter && p < leave) {
          opacity = 0.9;
        } else if (p >= leave && p <= leave + fadeRange) {
          opacity = 0.9 * (1 - (p - leave) / fadeRange);
        }
        overlay.style.opacity = opacity;
      },
    });
  }

  // === Marquees ===
  function initMarquees() {
    document.querySelectorAll(".marquee-wrap").forEach((el) => {
      const speed = parseFloat(el.dataset.scrollSpeed) || -25;
      const enter = parseFloat(el.dataset.enter) / 100;
      const leave = parseFloat(el.dataset.leave) / 100;

      gsap.to(el.querySelector(".marquee-text"), {
        xPercent: speed,
        ease: "none",
        scrollTrigger: {
          trigger: scrollContainer,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      ScrollTrigger.create({
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          const fadeRange = 0.03;
          let opacity = 0;
          if (p >= enter && p <= leave) {
            opacity = 1;
          } else if (p >= enter - fadeRange && p < enter) {
            opacity = (p - (enter - fadeRange)) / fadeRange;
          } else if (p > leave && p <= leave + fadeRange) {
            opacity = 1 - (p - leave) / fadeRange;
          }
          el.style.opacity = opacity;
        },
      });
    });
  }

  // === Counter Animations ===
  function initCounters() {
    document.querySelectorAll(".stat-number").forEach((el) => {
      const target = parseFloat(el.dataset.value);
      const decimals = parseInt(el.dataset.decimals || "0");
      const obj = { val: 0 };

      ScrollTrigger.create({
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const statsSection = el.closest(".scroll-section");
          const enter = parseFloat(statsSection.dataset.enter) / 100;
          const leave = parseFloat(statsSection.dataset.leave) / 100;
          const p = self.progress;

          if (p >= enter && p <= leave) {
            const sectionProgress = Math.min(1, (p - enter) / ((leave - enter) * 0.6));
            const eased = 1 - Math.pow(1 - sectionProgress, 3);
            const val = target * eased;
            el.textContent = decimals > 0 ? val.toFixed(decimals) : Math.round(val);
          }
        },
      });
    });
  }

  // === Start ===
  preloadFrames();
})();
