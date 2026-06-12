/* ============================================================
   AGS AMERICA — hotspots.js  (home + products pages)
   Vehicle part hotspots over three studio sub-views:
     interior-front (cockpit) · interior-rear (cargo) · exterior.
   Two tabs (Interior / Exterior). The Interior tab holds two
   sub-views swapped by left/right stage arrows. Selecting a
   part (click or prev/next) auto-switches to its sub-view.
   Each base photo degrades to an inline SVG silhouette if its
   studio image is unavailable (onerror sets .no-img).
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The three stage sub-views. The two tabs map onto these:
  //   Interior tab -> interior-front (default) <-> interior-rear (arrows)
  //   Exterior tab -> exterior
  var VIEW_FRONT = "interior-front";
  var VIEW_REAR  = "interior-rear";
  var VIEW_EXT   = "exterior";

  // Which tab a sub-view belongs to (drives tab aria-pressed state).
  function tabOfView(view) { return view === VIEW_EXT ? "exterior" : "interior"; }

  // data-part index == array index. view gates which stage sub-view shows the
  // hotspot; img is the white-background product shot (graceful onerror hide).
  var PARTS = [
    { name: "Front Console", zone: "Interior · Center", tag: "Interior",
      view: VIEW_FRONT, img: "img/parts/front-console.webp",
      desc: "Center console module housing the shifter surround, storage bin, and cupholder assembly — injection molded, grained, and fully assembled before just-in-time shipment to the OEM.",
      proc: "Molding + Assembly", cars: "Santa Fe · Santa Cruz · Tucson · Sorento" },
    { name: "Glove Box", zone: "Interior · IP, passenger side", tag: "Interior",
      view: VIEW_FRONT, img: "img/parts/glove-box.webp",
      desc: "Passenger-side storage compartment with damped hinge kinematics, latch integration, and Class-A grained surfaces matched to the crash pad grain master.",
      proc: "Molding + Assembly", cars: "Sorento · Telluride" },
    { name: "Crash Pad CTR", zone: "Interior · IP, center–passenger section", tag: "Interior",
      view: VIEW_FRONT, img: "img/parts/crash-pad.webp",
      desc: "Center section of the instrument panel — spanning from the center stack across the passenger side to the glove box. Molded for grain match and flush, gap-true fit against the adjacent IP sections.",
      proc: "Large-tonnage Molding", cars: "Sorento · Telluride" },
    { name: "Pillar Trim — FRT · CTR · RR", zone: "Interior · A / B / C pillars", tag: "Interior",
      view: VIEW_FRONT, img: "img/parts/pillar-trim.webp",
      desc: "Front, center, and rear pillar garnish set — curtain-airbag deployment compliant, with clip retention validated for repeated service removal and zero-rattle fit.",
      proc: "Molding + Clip Assembly", cars: "Tucson · Santa Cruz" },
    { name: "Transverse Trim", zone: "Interior · Cargo opening sill", tag: "Interior",
      view: VIEW_REAR, img: "img/parts/transverse-trim.webp",
      desc: "Cargo-opening transverse trim member at the tailgate sill — a long, thin-wall molding where warpage control and gap consistency define the perceived quality of the rear cabin.",
      proc: "Thin-wall Molding", cars: "Tucson" },
    { name: "Fender & Quarter Garnish", zone: "Exterior · Body side", tag: "Exterior",
      view: VIEW_EXT, img: "img/parts/garnish.webp",
      desc: "Exterior fender and quarter garnish panels — UV-stable, weather-sealed body-side moldings engineered for gap-and-flush alignment against painted sheet metal.",
      proc: "Molding + Exterior Finish", cars: "Santa Cruz" }
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
  var arrowPrev = document.getElementById("stagePrev"); // -> cockpit (front)
  var arrowNext = document.getElementById("stageNext"); // -> cargo (rear)
  var current = 0, activeView = VIEW_FRONT, swapTimer = null;

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // The Interior tab exposes two sub-views via stage arrows. Show only the arrow
  // that leads somewhere: front -> next(cargo), rear -> prev(cockpit). Exterior
  // has no sub-views, so both arrows hide.
  function syncArrows() {
    if (arrowPrev) arrowPrev.hidden = (activeView !== VIEW_REAR);
    if (arrowNext) arrowNext.hidden = (activeView !== VIEW_FRONT);
  }

  function setView(view) {
    activeView = view;
    if (stage) stage.setAttribute("data-active-view", view);
    var tab = tabOfView(view);
    tabs.forEach(function (t) {
      t.setAttribute("aria-pressed", t.dataset.view === tab ? "true" : "false");
    });
    syncArrows();
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

  function firstPartOfTab(tab) {
    for (var k = 0; k < PARTS.length; k++) {
      if (tabOfView(PARTS[k].view) === tab) return k;
    }
    return 0;
  }

  spots.forEach(function (s) {
    var idx = parseInt(s.dataset.part, 10);
    s.addEventListener("click", function () { selectPart(idx); });
  });
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      var tab = t.dataset.view;                 // "interior" | "exterior"
      if (tabOfView(activeView) === tab) return;
      selectPart(firstPartOfTab(tab));          // Interior -> front first part
    });
  });

  // Stage arrows swap interior sub-views without changing the selected part's tab.
  // The arrow only changes which sub-view is shown; if the current part lives in
  // the other sub-view, selecting that sub-view's first part keeps card + stage in sync.
  function gotoView(view) {
    if (view === activeView) return;
    // pick the part to surface: keep current if it belongs to the target view,
    // otherwise the target sub-view's first part.
    if (PARTS[current].view === view) { setView(view); return; }
    var idx = current;
    for (var k = 0; k < PARTS.length; k++) { if (PARTS[k].view === view) { idx = k; break; } }
    selectPart(idx);
  }
  if (arrowPrev) arrowPrev.addEventListener("click", function () { gotoView(VIEW_FRONT); });
  if (arrowNext) arrowNext.addEventListener("click", function () { gotoView(VIEW_REAR); });

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

  setView(VIEW_FRONT);
  applyPart(0);
  lockCardHeight();
})();
