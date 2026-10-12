// Shadow Colony sitesi üretici: kaynak/metin/<dil>.json + kaynak/rehber/<dil>.html + şablonlar → /<dil>/ ve /<dil>/guide/
// Kullanım: node kaynak/uret.js   (site kökünde çalıştır)
const fs = require("fs");
const path = require("path");
const KOK = path.resolve(__dirname, "..");
const SITE = "https://shadowcolonygame.com";
const DILLER = [
  { kod: "en", ad: "English" }, { kod: "tr", ad: "Türkçe" }, { kod: "de", ad: "Deutsch" },
  { kod: "fr", ad: "Français" }, { kod: "ja", ad: "日本語" }, { kod: "ko", ad: "한국어" },
];
const oku = p => fs.readFileSync(path.join(KOK, p), "utf8");
const yaz = (p, s) => { fs.mkdirSync(path.dirname(path.join(KOK, p)), { recursive: true }); fs.writeFileSync(path.join(KOK, p), s); };
const kac = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const doldur = (sablon, m) => sablon.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in m ? m[k] : (console.warn("eksik anahtar:", k), "")));

const sablonAna = oku("kaynak/sablon_ana.html"), sablonRehber = oku("kaynak/sablon_rehber.html");
const galeri = ["01_o_yagma", "02_o_nadir", "03_o_envanter", "04_o_ekip", "05_o_kat0", "06_o_karar", "07_o_yetenek", "08_o_patron"]
  .map(a => `<a href="../img/g/ekran_${a}.jpg"><img src="../img/g/ekran_${a}.jpg" alt="" loading="lazy"></a>`).join("\n    ");
const hreflang = alt => DILLER.map(d => `<link rel="alternate" hreflang="${d.kod}" href="${SITE}/${d.kod}/${alt}">`).join("\n")
  + `\n<link rel="alternate" hreflang="x-default" href="${SITE}/en/${alt}">`;

function menu(t, kod, derinlik, sayfa) {
  const u = "../".repeat(derinlik);
  const secenek = DILLER.map(d => `<option data-kod="${d.kod}" value="${u}${d.kod}/${sayfa === "rehber" ? "guide/" : ""}"${d.kod === kod ? " selected" : ""}>${d.ad}</option>`).join("");
  return `<nav class="ust"><div class="kap">
  <a class="logo" href="${u}${kod}/"><img src="${u}img/icon.png" alt="">SHADOW COLONY</a>
  <div class="bag">
    <a class="gizle" href="${u}${kod}/#fragman">${t.m_fragman}</a>
    <a class="gizle" href="${u}${kod}/#ozellikler">${t.m_ozellik}</a>
    <a class="gizle${sayfa === "rehber" ? " aktif" : ""}" href="${u}${kod}/guide/">${t.m_rehber}</a>
    <a class="gizle" href="${u}press/">${t.m_basin}</a>
    <select class="dil" aria-label="Language" onchange="try{localStorage.setItem('dil',this.options[this.selectedIndex].dataset.kod)}catch(e){};location.href=this.value">${secenek}</select>
  </div>
</div></nav>`;
}
function altBilgi(t, kod, derinlik) {
  const u = "../".repeat(derinlik);
  return `<footer class="alt-bilgi"><div class="kap">
  <div><a href="${u}${kod}/">${t.ana}</a><a href="${u}${kod}/guide/">${t.m_rehber}</a><a href="${u}press/">${t.m_basin}</a><a href="${u}privacy/">${t.gizlilik}</a></div>
  <div>${t.destek}: <a href="mailto:support@shadowcolonygame.com">support@shadowcolonygame.com</a> · © 2026 Shadow Colony</div>
</div></footer>`;
}

const urller = [];
for (const d of DILLER) {
  const t = JSON.parse(oku(`kaynak/metin/${d.kod}.json`));
  const m = {};
  for (const k in t) m[k] = kac(t[k]);
  m.kod = d.kod;
  m.video = d.kod === "tr" ? "fragman_tr.mp4" : "fragman_en.mp4";
  m.galeri = galeri;
  m.hreflang_ana = hreflang("");
  m.hreflang_rehber = hreflang("guide/");
  m.ust_menu = menu(t, d.kod, 1, "ana");
  m.alt_bilgi = altBilgi(t, d.kod, 1);
  yaz(`${d.kod}/index.html`, doldur(sablonAna, m));
  const govdeYolu = `kaynak/rehber/${d.kod}.html`;
  if (fs.existsSync(path.join(KOK, govdeYolu))) {
    m.ust_menu = menu(t, d.kod, 2, "rehber");
    m.alt_bilgi = altBilgi(t, d.kod, 2);
    m.rehber_govde = oku(govdeYolu).replace(/\{\{img\}\}/g, "../../img/");
    yaz(`${d.kod}/guide/index.html`, doldur(sablonRehber, m));
    urller.push(`${SITE}/${d.kod}/guide/`);
  } else console.warn("rehber yok:", d.kod);
  urller.push(`${SITE}/${d.kod}/`);
  console.log("üretildi:", d.kod);
}

// kök: tarayıcı diline yönlendir
const kodlar = DILLER.map(d => d.kod);
yaz("index.html", `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shadow Colony</title>
<meta name="description" content="Shadow Colony — raid the sun-scorched surface at night, get back before dawn, build an underground colony.">
<meta property="og:title" content="Shadow Colony"><meta property="og:image" content="${SITE}/img/hero.png">
${hreflang("")}
<link rel="icon" href="favicon.png">
<script>
(function () {
  var destek = ${JSON.stringify(kodlar)}, secim = "en";
  try { var k = localStorage.getItem("dil"); if (k && destek.indexOf(k) >= 0) secim = k; else {
    var l = (navigator.languages || [navigator.language || "en"]);
    for (var i = 0; i < l.length; i++) { var c = String(l[i]).slice(0, 2).toLowerCase(); if (destek.indexOf(c) >= 0) { secim = c; break; } } } } catch (e) {}
  location.replace(secim + "/");
})();
</script>
<style>body{background:#0E131B;color:#E8E4DC;font-family:system-ui,sans-serif;text-align:center;padding:60px 16px}a{color:#F0A63C;margin:0 8px}</style>
</head><body><h1>SHADOW COLONY</h1><p>${DILLER.map(d => `<a href="${d.kod}/">${d.ad}</a>`).join(" ")}</p></body></html>
`);
urller.unshift(`${SITE}/`); urller.push(`${SITE}/press/`, `${SITE}/privacy/`);
yaz("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urller.map(u => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
yaz("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log("site haritası:", urller.length, "adres");
