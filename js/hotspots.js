/* ============================================================
   AGS AMERICA — hotspots.js  (home + products pages)
   Vehicle part hotspots over two studio views (Interior /
   Exterior) -> swapping info card with a part photo slot.
   Each base photo degrades to an inline SVG silhouette if the
   studio image is unavailable (onerror sets .no-img).
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // data-part index == array index. view gates which stage shows the hotspot;
  // img is the white-background product shot (graceful onerror hide if missing).
  var PARTS = [
    { name: "Front Console", zone: "Interior · Center", tag: "Interior",
      view: "interior", img: "img/parts/front-console.webp",
      desc: "Center console module housing the shifter surround, storage bin, and cupholder assembly — injection molded, grained, and fully assembled with sequenced delivery to the trim line.",
      proc: "Molding + Assembly", cars: "Santa Fe · Tucson" },
    { name: "Glove Box", zone: "Interior · IP, passenger side", tag: "Interior",
      view: "interior", img: "img/parts/glove-box.webp",
      desc: "Passenger-side storage compartment with damped hinge kinematics, latch integration, and Class-A grained surfaces matched to the crash pad grain master.",
      proc: "Molding + Assembly", cars: "Tucson · Santa Cruz" },
    { name: "Crash Pad", zone: "Interior · Instrument panel", tag: "Interior",
      view: "interior", img: "img/parts/crash-pad.webp",
      desc: "Full instrument-panel structure — the largest interior molding in the vehicle. Carrier, ducting, and topper integration with dimensional control across a meter-wide span.",
      proc: "Large-tonnage Molding", cars: "Santa Fe · Telluride" },
    { name: "Pillar Trim — FRT · CTR · RR", zone: "Interior · A / B / C pillars", tag: "Interior",
      view: "interior", img: "img/parts/pillar-trim.webp",
      desc: "Front, center, and rear pillar garnish set — curtain-airbag deployment compliant, with clip retention validated for repeated service removal and zero-rattle fit.",
      proc: "Molding + Clip Assembly", cars: "Sorento · Telluride" },
    { name: "D/Side Trim", zone: "Interior · Door & side panels", tag: "Interior",
      view: "interior", img: "img/parts/dside-trim.webp",
      desc: "Door and side trim panels with integrated armrest, switch bezel, and speaker grille zones — multi-material molding with grain-matched visible surfaces.",
      proc: "Molding + Assembly", cars: "Santa Fe · Sorento" },
    { name: "Transverse Trim", zone: "Interior · Cross-car & cargo", tag: "Interior",
      view: "exterior", img: "img/parts/transverse-trim.webp",
      desc: "Cross-car and cargo-area transverse trim members — long, thin-wall moldings where warpage control and gap consistency define the perceived quality of the rear cabin.",
      proc: "Thin-wall Molding", cars: "Santa Cruz · Tucson" },
    { name: "Fender & Quarter Garnish", zone: "Exterior · Body side", tag: "Exterior",
      view: "exterior", img: "img/parts/garnish.webp",
      desc: "Exterior fender and quarter garnish panels — UV-stable, weather-sealed body-side moldings engineered for gap-and-flush alignment against painted sheet metal.",
      proc: "Molding + Exterior Finish", cars: "Santa Cruz · Telluride" }
  ];

  var card = document.getElementById("partCard");
  if (!card) return;

  var elZone = document.getElementById("pcZone");
  var elTag  = document.getElementById("pcTag");
  var elName = document.getElementById("pcName");
  var elDesc = document.getElementById("pcDesc");
  var elProc = document.getElementById("pcProc");
  var elCars = document.getElementById("pcCars");
  var elIdx  = document.getElementById("pcIdx");
  var photoWrap = document.getElementById("pcPhotoWrap");
  var photoImg  = document.getElementById("pcPhoto");
  var stage = document.getElementById("vehiclePhoto");
  var tabs  = Array.prototype.slice.call(document.querySelectorAll(".stage-tab"));
  var spots = Array.prototype.slice.call(document.querySelectorAll(".hs"));
  var current = 0, activeView = "interior", swapTimer = null;

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function setView(view) {
    activeView = view;
    if (stage) stage.setAttribute("data-active-view", view);
    tabs.forEach(function (t) {
      t.setAttribute("aria-pressed", t.dataset.view === view ? "true" : "false");
    });
  }

  function applyPart(i) {
    var p = PARTS[i];
    elZone.textContent = p.zone;
    elTag.textContent  = p.tag;
    elName.textContent = p.name;
    elDesc.textContent = p.desc;
    elProc.textContent = p.proc;
    elCars.textContent = p.cars;
    elIdx.textContent  = pad(i + 1) + " / " + pad(PARTS.length);
    spots.forEach(function (s, j) { s.classList.toggle("active", j === i); });
    if (photoWrap && photoImg) {
      photoWrap.hidden = false;            // slot space is reserved via aspect-ratio
      photoImg.alt = p.name;
      photoImg.src = p.img;                // onerror (set once) hides the slot if missing
    }
  }

  // graceful fallback: if a part photo is missing, hide the slot. The slot's
  // fixed aspect-ratio means showing/hiding it does not reflow the locked card
  // mid-measurement, but we keep it hidden when there is genuinely no image.
  if (photoImg && photoWrap) {
    photoImg.addEventListener("error", function () { photoWrap.hidden = true; });
  }

  function selectPart(i) {
    i = ((i % PARTS.length) + PARTS.length) % PARTS.length;
    var targetView = PARTS[i].view;
    if (targetView !== activeView) setView(targetView);   // cross-view nav auto-switches
    if (i === current) { applyPart(i); return; }
    current = i;
    if (reduceMotion) { applyPart(i); return; }
    card.classList.add("swapping");
    clearTimeout(swapTimer);
    swapTimer = setTimeout(function () {
      applyPart(i);
      card.classList.remove("swapping");
    }, 280);
  }

  function firstPartOfView(view) {
    for (var k = 0; k < PARTS.length; k++) { if (PARTS[k].view === view) return k; }
    return 0;
  }

  spots.forEach(function (s) {
    var idx = parseInt(s.dataset.part, 10);
    s.addEventListener("click", function () { selectPart(idx); });
  });
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      var view = t.dataset.view;
      if (view === activeView) return;
      setView(view);
      selectPart(firstPartOfView(view));   // auto-select that view's first part
    });
  });
  var prev = document.getElementById("pcPrev");
  var next = document.getElementById("pcNext");
  if (prev) prev.addEventListener("click", function () { selectPart(current - 1); });
  if (next) next.addEventListener("click", function () { selectPart(current + 1); });

  // Pre-measure the tallest part text and lock the card height so swapping
  // parts never reflows the section. The photo slot has a fixed aspect-ratio,
  // so it contributes a constant height regardless of which (or whether an)
  // image loads — no img.onload re-measure needed.
  function lockCardHeight() {
    card.style.minHeight = "";
    var clone = card.cloneNode(true);
    clone.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;min-height:0;height:auto;width:" + card.offsetWidth + "px";
    card.parentNode.appendChild(clone);
    var cZone = clone.querySelector("#pcZone"), cTag = clone.querySelector("#pcTag"),
        cName = clone.querySelector("#pcName"), cDesc = clone.querySelector("#pcDesc"),
        cProc = clone.querySelector("#pcProc"), cCars = clone.querySelector("#pcCars"),
        cWrap = clone.querySelector("#pcPhotoWrap");
    if (cWrap) cWrap.hidden = false;   // measure with the slot present (worst case)
    var max = 0;
    PARTS.forEach(function (p) {
      cZone.textContent = p.zone; cTag.textContent = p.tag; cName.textContent = p.name;
      cDesc.textContent = p.desc; cProc.textContent = p.proc; cCars.textContent = p.cars;
      max = Math.max(max, clone.offsetHeight);
    });
    card.parentNode.removeChild(clone);
    if (max > 0) card.style.minHeight = max + "px";
  }
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(lockCardHeight, 200);
  });

  setView("interior");
  applyPart(0);
  lockCardHeight();
})();
