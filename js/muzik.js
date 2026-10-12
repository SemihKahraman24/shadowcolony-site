// Shadow Colony site müziği: varsayılan kapalı; düğmeyle açılır, tercih hatırlanır, video oynarken susar.
// Web Audio ile çalınır (mp3 kodlayıcı boşluğu olmadan dikişsiz döngü).
(function () {
  var kok = document.currentScript.src.replace(/js\/muzik\.js.*$/, "");
  var ETIKET = { tr: "Müzik", en: "Music", de: "Musik", fr: "Musique", ja: "音楽", ko: "음악" };
  var dil = (document.documentElement.lang || "en").slice(0, 2);
  var ad = ETIKET[dil] || ETIKET.en;
  var HEDEF = 0.35, ctx = null, kazanc = null, tampon = null, kaynak = null, acik = false, videoSusturdu = false, yukleniyor = null;

  var tercih = false;
  try { tercih = localStorage.getItem("muzik") === "1"; } catch (e) {}

  var d = document.createElement("button");
  d.className = "muzik-dugme";
  d.type = "button";
  d.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/>' +
    '<path class="dalga" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10"/>' +
    '<path class="kapali" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16.5 9.5l5 5m0-5l-5 5"/></svg>';
  document.body.appendChild(d);
  function goster() {
    d.classList.toggle("acik", acik);
    d.setAttribute("aria-pressed", acik ? "true" : "false");
    d.setAttribute("aria-label", ad + (acik ? " ✓" : ""));
    d.title = ad;
  }
  goster();

  function yukle() {
    if (yukleniyor) return yukleniyor;
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    kazanc = ctx.createGain();
    kazanc.gain.value = 0;
    kazanc.connect(ctx.destination);
    yukleniyor = fetch(kok + "ses/shelter_lights.mp3")
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (b) { return new Promise(function (ok, hata) { ctx.decodeAudioData(b, ok, hata); }); })
      .then(function (t) { tampon = t; d.setAttribute("data-hazir", t.duration.toFixed(1)); }).catch(function (e) { d.setAttribute("data-hata", String(e)); });
    return yukleniyor;
  }
  function sesDuzeyi(h, sure) {
    var su = ctx.currentTime;
    kazanc.gain.cancelScheduledValues(su);
    kazanc.gain.setValueAtTime(kazanc.gain.value, su);
    kazanc.gain.linearRampToValueAtTime(h, su + sure);
  }
  function baslat() {
    yukle().then(function () {
      if (!acik) return;
      if (ctx.state === "suspended") ctx.resume();
      if (!kaynak) {
        kaynak = ctx.createBufferSource();
        kaynak.buffer = tampon;
        kaynak.loop = true;
        // kodlayıcı dolgusunu atla: döngü dikişi zaten çapraz geçişli
        kaynak.loopStart = 0.06;
        kaynak.loopEnd = tampon.duration - 0.06;
        kaynak.connect(kazanc);
        kaynak.start(0, 0.06);
      }
      sesDuzeyi(videoSusturdu ? 0 : HEDEF, 2.5);
    });
  }
  function durdur() {
    if (!ctx) return;
    sesDuzeyi(0, 0.8);
  }
  function ayarla(a) {
    acik = a;
    try { localStorage.setItem("muzik", a ? "1" : "0"); } catch (e) {}
    goster();
    if (a) baslat(); else durdur();
  }
  d.addEventListener("click", function () { ayarla(!acik); });

  // daha önce açtıysa: tarayıcı ilk dokunuşu bekler
  if (tercih) {
    var ilk = function (e) {
      if (e.target === d || (e.target.closest && e.target.closest(".muzik-dugme"))) { kaldir(); return; }
      kaldir();
      ayarla(true);
    };
    var kaldir = function () { ["pointerdown", "keydown"].forEach(function (o) { document.removeEventListener(o, ilk, true); }); };
    ["pointerdown", "keydown"].forEach(function (o) { document.addEventListener(o, ilk, true); });
  }

  // fragman oynarken müzik susar, bitince/durunca geri gelir
  document.querySelectorAll("video").forEach(function (v) {
    v.addEventListener("play", function () { videoSusturdu = true; if (acik && ctx) sesDuzeyi(0, 0.5); });
    var don = function () { videoSusturdu = false; if (acik && ctx) sesDuzeyi(HEDEF, 2); };
    v.addEventListener("pause", don);
    v.addEventListener("ended", don);
  });
  // sekme gizlenince sus
  document.addEventListener("visibilitychange", function () {
    if (!ctx || !acik) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
})();
