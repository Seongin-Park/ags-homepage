/* ============================================================
   AGS AMERICA — index.js  (home page only)
   Vehicle part hotspots -> swapping info card.
   Photo base degrades to an inline SVG silhouette if the
   studio image is unavailable (onerror sets .no-img).
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PARTS = [
    { name: "Front Console", zone: "Interior · Center", tag: "Interior",
      desc: "Center console module housing the shifter surround, storage bin, and cupholder assembly — injection molded, grained, and fully assembled with sequenced delivery to the trim line.",
      proc: "Molding + Assembly", cars: "Santa Fe · Tucson" },
    { name: "Glove Box", zone: "Interior · IP, passenger side", tag: "Interior",
      desc: "Passenger-side storage compartment with damped hinge kinematics, latch integration, and Class-A grained surfaces matched to the crash pad grain master.",
      proc: "Molding + Assembly", cars: "Tucson · Santa Cruz" },
    { name: "Crash Pad", zone: "Interior · Instrument panel", tag: "Interior",
      desc: "Full instrument-panel structure — the largest interior molding in the vehicle. Carrier, ducting, and topper integration with dimensional control across a meter-wide span.",
      proc: "Large-tonnage Molding", cars: "Santa Fe · Telluride" },
    { name: "Pillar Trim — FRT · CTR · RR", zone: "Interior · A / B / C pillars", tag: "Interior",
      desc: "Front, center, and rear pillar garnish set — curtain-airbag deployment compliant, with clip retention validated for repeated service removal and zero-rattle fit.",
      proc: "Molding + Clip Assembly", cars: "Sorento · Telluride" },
    { name: "D/Side Trim", zone: "Interior · Door & side panels", tag: "Interior",
      desc: "Door and side trim panels with integrated armrest, switch bezel, and speaker grille zones — multi-material molding with grain-matched visible surfaces.",
      proc: "Molding + Assembly", cars: "Santa Fe · Sorento" },
    { name: "Transverse Trim", zone: "Interior · Cross-car & cargo", tag: "Interior",
      desc: "Cross-car and cargo-area transverse trim members — long, thin-wall moldings where warpage control and gap consistency define the perceived quality of the rear cabin.",
      proc: "Thin-wall Molding", cars: "Santa Cruz · Tucson" },
    { name: "Fender & Quarter Garnish", zone: "Exterior · Body side", tag: "Exterior",
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
  var spots  = Array.prototype.slice.call(document.querySelectorAll(".hs"));
  var current = 0, swapTimer = null;

  function pad(n) { return (n < 10 ? "0" : "") + n; }

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
  }

  function selectPart(i) {
    i = ((i % PARTS.length) + PARTS.length) % PARTS.length;
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

  spots.forEach(function (s) {
    var idx = parseInt(s.dataset.part, 10);
    s.addEventListener("click", function () { selectPart(idx); });
  });
  var prev = document.getElementById("pcPrev");
  var next = document.getElementById("pcNext");
  if (prev) prev.addEventListener("click", function () { selectPart(current - 1); });
  if (next) next.addEventListener("click", function () { selectPart(current + 1); });

  // Pre-measure the tallest part text and lock the card height so
  // swapping parts never reflows the section (buttons stay put).
  function lockCardHeight() {
    var clone = card.cloneNode(true);
    clone.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;min-height:0;height:auto;width:" + card.offsetWidth + "px";
    card.parentNode.appendChild(clone);
    var cZone = clone.querySelector("#pcZone"), cTag = clone.querySelector("#pcTag"),
        cName = clone.querySelector("#pcName"), cDesc = clone.querySelector("#pcDesc"),
        cProc = clone.querySelector("#pcProc"), cCars = clone.querySelector("#pcCars");
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

  applyPart(0);
  lockCardHeight();
})();
