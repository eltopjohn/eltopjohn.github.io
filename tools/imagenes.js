// node tools/imagenes.js — rehace assets/og-*.jpg (la vista previa de WhatsApp),
// assets/shot-*.jpg (las capturas, reducidas a 600 px) y assets/icon-180.png.
// Necesita playwright-core y un Chromium: en la máquina de desarrollo, el que
// monta scripts/store-screenshots/setup.sh del juego (cargar su env.sh antes).
const fs = require('fs');
const { chromium } = require('playwright-core');
const path = require('path');
const OUT = path.resolve(__dirname, '../assets');
// El repo del juego, de donde salen la mascota, el icono y las capturas de tienda.
const GAME = path.resolve(process.env.GAME || path.join(__dirname, '../../topgame'));
const TMP = require('os').tmpdir();

const og = (eyebrow, lines) => `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:repeating-conic-gradient(from 3deg at 78% 52%, #FFE135 0 7.5deg, #F7CE0E 7.5deg 15deg);font-family:Roboto,sans-serif;color:#000}
  .t{position:absolute;left:72px;top:64px}
  .e{font-size:25px;font-weight:700;letter-spacing:.17em;text-transform:uppercase;color:#00668F;margin:0 0 14px}
  h1{margin:0;font-size:168px;font-weight:900;line-height:.9;letter-spacing:-.035em}
  h1 span{display:block} .j{color:#C11616}
  .c{position:absolute;left:72px;bottom:66px;background:#fff;border:6px solid #000;box-shadow:10px 10px 0 #000;padding:16px 28px;font-size:40px;font-weight:700;line-height:1.25}
  .c span{display:block;white-space:nowrap}
  img{position:absolute;right:92px;top:34px;height:562px}
</style><div class="t"><p class="e">${eyebrow}</p><h1><span>EL TOP</span><span class="j">JOHN</span></h1></div>
<div class="c">${lines.map((l) => `<span>${l}</span>`).join('')}</div>
<img src="file://${GAME}/assets/images/mascota.png">`;

const img = (src, w, h) => `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff}img{display:block;width:${w}px;height:${h}px}</style><img src="file://${src}">`;

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const shoot = async (html, w, h, out, opts) => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const f = `${TMP}/_gen.html`;
    fs.writeFileSync(f, html);
    await page.goto('file://' + f);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${OUT}/${out}`, ...opts });
    await page.close();
    console.log(out, Math.round(fs.statSync(`${OUT}/${out}`).size / 1024) + ' KB');
  };

  await shoot(og('10 opciones · 1 respuesta cada una', ['Aciertas y sumas.', 'Fallas y lo pierdes todo.']), 1200, 630, 'og-es.jpg', { type: 'jpeg', quality: 88 });
  await shoot(og('10 options · 1 answer each', ['Get it right and score.', 'Get it wrong and lose it all.']), 1200, 630, 'og-en.jpg', { type: 'jpeg', quality: 88 });

  const SHOTS = ['02-en-juego', '03-plantarse', '05-fotos'];
  for (const [lang, dir] of [['es', 'screenshot_store/iphone-69'], ['en', 'screenshot_store/english/iphone-69']]) {
    for (let i = 0; i < SHOTS.length; i++) {
      await shoot(img(`${GAME}/${dir}/${SHOTS[i]}.png`, 600, 1304), 600, 1304, `shot-${lang}-${i + 1}.jpg`, { type: 'jpeg', quality: 84 });
    }
  }

  await shoot(img(`${GAME}/assets/images/icon.png`, 180, 180), 180, 180, 'icon-180.png', { type: 'png' });
  await browser.close();
})();
