/* ============================================================
   AGS AMERICA — main.js  (shared, all pages)
   Mobile nav · scroll-reveal · counters.
   GSAP ScrollTrigger when present, IntersectionObserver fallback.
   Honors prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (hasGSAP) { window.gsap.registerPlugin(window.ScrollTrigger); }

  /* ---------------- mobile nav drawer ----------------
     Plain class-toggle on a flex column drawer — no panel
     transform, so it survives the KakaoTalk in-app browser. */
  var toggle = document.querySelector(".nav-toggle");
  var drawer = document.querySelector(".nav-drawer");
  if (toggle && drawer) {
    toggle.addEventListener("click", function () {
      var open = drawer.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // close on link tap
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        drawer.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- scroll reveal ---------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { ro.observe(el); });
  }

  /* ---------------- counters ---------------- */
  function renderCount(el, val) {
    var dec = parseInt(el.dataset.decimals || "0", 10);
    var suffix = el.dataset.suffix || "";
    el.textContent = val.toFixed(dec) + suffix;
  }
  function animateCount(el) {
    var target = parseFloat(el.dataset.target);
    if (reduceMotion) { renderCount(el, target); return; }
    var dur = 1600, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      renderCount(el, target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll(".count"));
  if (counters.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) { renderCount(el, parseFloat(el.dataset.target)); });
    } else {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }

  /* ---------------- capability cards: accordion (capabilities.html) ----------------
     Each .cap[data-cap] has a .cap-toggle button controlling a .cap-detail panel.
     Smooth expand via CSS grid-template-rows (0fr→1fr); instant when reduced motion.
     Hash entry (capabilities.html#assembly) auto-expands + scrolls. */
  var capCards = Array.prototype.slice.call(document.querySelectorAll(".cap[data-cap]"));
  if (capCards.length) {
    var setCap = function (card, open) {
      var toggle = card.querySelector(".cap-toggle");
      var detail = card.querySelector(".cap-detail");
      var label = card.querySelector(".cap-toggle-label");
      if (!toggle || !detail) return;
      if (open) {
        detail.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
        if (label) label.textContent = "Close";
        // next frame so the grid-rows transition runs after `hidden` is cleared
        if (reduceMotion) { detail.classList.add("open"); }
        else { requestAnimationFrame(function () { requestAnimationFrame(function () { detail.classList.add("open"); }); }); }
      } else {
        toggle.setAttribute("aria-expanded", "false");
        if (label) label.textContent = "Details";
        detail.classList.remove("open");
        if (reduceMotion) {
          detail.hidden = true;
        } else {
          var onEnd = function (e) {
            if (e.propertyName !== "grid-template-rows") return;
            if (!detail.classList.contains("open")) detail.hidden = true;
            detail.removeEventListener("transitionend", onEnd);
          };
          detail.addEventListener("transitionend", onEnd);
        }
      }
    };

    capCards.forEach(function (card) {
      var toggle = card.querySelector(".cap-toggle");
      if (!toggle) return;
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        setCap(card, !open);
      });
    });

    var openFromHash = function () {
      var id = (window.location.hash || "").replace(/^#/, "");
      if (!id) return;
      var card = document.getElementById(id);
      if (!card || !card.hasAttribute("data-cap")) return;
      setCap(card, true);
      // ensure scroll lands correctly even if the browser scrolled before expand
      requestAnimationFrame(function () {
        card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
  }

  /* ---------------- hero parallax (GSAP, progressive) ---------------- */
  if (hasGSAP && !reduceMotion) {
    var heroPhoto = document.querySelector(".hero-photo img");
    if (heroPhoto) {
      window.gsap.to(heroPhoto, {
        yPercent: 12, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
  }
})();
