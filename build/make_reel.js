// Frolic reel card renderer - Confetti Cannon brand, 1080x1920 @2x via Playwright
// Usage: node make_reel.js <spec.json> <outdir>
// CHROMIUM_PATH env var is optional; in CI Playwright supplies its own browser.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const outDir = process.argv[3];
fs.mkdirSync(outDir, { recursive: true });

const F = p => {
  const abs = path.resolve(__dirname, 'node_modules', p);
  if (!fs.existsSync(abs)) { console.error('FATAL: font file missing ->', abs); process.exit(1); }
  return `file://${abs}`;
};
const FONTS = `
@font-face{font-family:'Shrikhand';src:url('${F('@fontsource/shrikhand/files/shrikhand-latin-400-normal.woff2')}') format('woff2');font-weight:400}
@font-face{font-family:'Karla';src:url('${F('@fontsource/karla/files/karla-latin-400-normal.woff2')}') format('woff2');font-weight:400}
@font-face{font-family:'Karla';src:url('${F('@fontsource/karla/files/karla-latin-700-normal.woff2')}') format('woff2');font-weight:700}
@font-face{font-family:'Karla';src:url('${F('@fontsource/karla/files/karla-latin-800-normal.woff2')}') format('woff2');font-weight:800}`;

const CSS = `
${FONTS}
*{margin:0;padding:0;box-sizing:border-box;font-synthesis-weight:none}
:root{--cream:#FFF4E4;--paper:#FFFDF8;--pink:#FF3E8A;--marigold:#FFB627;--plum:#3D0C3A;--plumsoft:#8A5B86;--green:#2FA36B}
body{width:1080px;height:1920px;background:var(--cream);overflow:hidden;position:relative;font-family:'Karla'}
.confetti{position:absolute;border-radius:7px;opacity:.32}
.wordmark{position:absolute;top:120px;left:80px;background:var(--marigold);border:3px solid var(--plum);border-radius:999px;padding:10px 34px 16px;box-shadow:5px 5px 0 var(--plum);transform:rotate(-2deg);font-family:'Shrikhand';font-size:46px;color:var(--plum);z-index:5}
.stage{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:120px 80px 500px}
.kicker{display:inline-block;background:var(--paper);border:3px solid var(--plum);border-radius:999px;padding:16px 36px;box-shadow:5px 5px 0 var(--plum);transform:rotate(1.5deg);font-weight:800;font-size:31px;letter-spacing:.1em;color:var(--plum);text-transform:uppercase;margin-bottom:56px}
h1{font-family:'Shrikhand';font-weight:400;font-size:107px;line-height:1.12;color:var(--plum);max-width:920px}
h1 .pk{color:var(--pink)}
.sub{margin-top:48px;font-weight:700;font-size:44px;line-height:1.35;color:var(--plumsoft);max-width:820px}
.card{background:var(--paper);border:3px solid var(--plum);border-radius:36px;box-shadow:10px 10px 0 var(--plum);padding:80px 70px;max-width:920px}
.lead{font-family:'Shrikhand';font-size:52px;color:var(--pink);margin-bottom:40px}
.big{font-weight:800;font-size:60px;line-height:1.3;color:var(--plum);text-align:center}
.big .mk{background:var(--marigold);padding:2px 14px;border-radius:10px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.ltitle{font-family:'Shrikhand';font-size:58px;color:var(--plum);margin-bottom:56px;text-align:center}
.row{display:flex;align-items:center;gap:34px;margin-bottom:46px;text-align:left}
.row:last-child{margin-bottom:0}
.chip{flex:none;width:84px;height:84px;border-radius:50%;background:var(--pink);border:3px solid var(--plum);box-shadow:5px 5px 0 var(--plum);color:#fff;font-weight:800;font-size:42px;display:flex;align-items:center;justify-content:center}
.rtext{font-weight:800;font-size:47px;color:var(--plum);line-height:1.22}
.cta-bg{position:absolute;inset:0;background:var(--marigold)}
.cta-stage{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:120px 80px 460px;gap:64px}
.cta-h{font-family:'Shrikhand';font-size:112px;line-height:1.18;color:var(--plum);max-width:900px}
.cta-pill{background:var(--paper);border:3px solid var(--plum);border-radius:999px;padding:30px 66px;box-shadow:7px 7px 0 var(--plum);font-weight:800;font-size:52px;color:var(--plum);transform:rotate(-1.5deg)}
.cta-sub{font-weight:700;font-size:40px;color:var(--plum)}
.burst{position:absolute;z-index:1}`;

function seeded(n) { let s = n * 2654435761 % 4294967296; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
function confetti(idx) {
  const r = seeded(idx + 7); const cols = ['#FF3E8A', '#FFB627', '#3D0C3A', '#2FA36B'];
  let h = '';
  for (let i = 0; i < 16; i++) {
    const x = 30 + r() * 1000, y = 30 + r() * 1840, rot = -40 + r() * 80, c = cols[Math.floor(r() * cols.length)];
    const w = 16 + r() * 12, ht = 26 + r() * 14;
    if (x > 120 && x < 960 && y > 340 && y < 1500) continue;
    h += `<div class="confetti" style="left:${x}px;top:${y}px;width:${w}px;height:${ht}px;background:${c};transform:rotate(${rot}deg)"></div>`;
  }
  return h;
}
const burst = (x, y, size, color, rot) => `<svg class="burst" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)" width="${size}" height="${size}" viewBox="0 0 100 100"><path d="M50 0 L57 35 L85 15 L65 43 L100 50 L65 57 L85 85 L57 65 L50 100 L43 65 L15 85 L35 57 L0 50 L35 43 L15 15 L43 35 Z" fill="${color}" stroke="#3D0C3A" stroke-width="3"/></svg>`;

function cardHTML(card, idx) {
  let body = '';
  if (card.kind === 'hook') {
    body = `<div class="stage"><div class="kicker">${card.kicker}</div><h1>${card.h1}</h1>${card.sub ? `<div class="sub">${card.sub}</div>` : ''}</div>`;
  } else if (card.kind === 'point') {
    body = `<div class="stage"><div class="card">${card.lead ? `<div class="lead">${card.lead}</div>` : ''}<div class="big">${card.text}</div></div></div>`;
  } else if (card.kind === 'list') {
    body = `<div class="stage"><div class="card" style="transform:rotate(-0.6deg)"><div class="ltitle">${card.title}</div>${card.rows.map((t, i) => `<div class="row" style="transform:rotate(${i % 2 ? 0.5 : -0.5}deg)"><div class="chip">${i + 1}</div><div class="rtext">${t}</div></div>`).join('')}</div></div>`;
  } else if (card.kind === 'cta') {
    return `<!doctype html><html><head><style>${CSS}</style></head><body><div class="cta-bg"></div>
      ${burst(70, 300, 150, '#FF3E8A', 10)}${burst(880, 200, 120, '#FFFDF8', -14)}${burst(120, 1450, 110, '#FFFDF8', 22)}${burst(860, 1380, 160, '#FF3E8A', -6)}
      <div class="wordmark">frolic</div>
      <div class="cta-stage"><div class="cta-h">${card.title}</div><div class="cta-pill">thefrolic.app</div><div class="cta-sub">${card.sub}</div></div></body></html>`;
  }
  return `<!doctype html><html><head><style>${CSS}</style></head><body>${confetti(idx)}<div class="wordmark">frolic</div>${body}</body></html>`;
}

(async () => {
  const launchOpts = { args: ['--no-sandbox'] };
  if (process.env.CHROMIUM_PATH) launchOpts.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launchOpts);
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (let i = 0; i < spec.cards.length; i++) {
    const f = path.join(outDir, `card_${i + 1}.html`);
    fs.writeFileSync(f, cardHTML(spec.cards[i], i));
    await page.goto('file://' + path.resolve(f));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);

    // HARD GUARD - the serif-fallback defect that shipped 6 Aug 2026.
    const fontOk = await page.evaluate(async () => {
      await Promise.all([document.fonts.load("400 100px Shrikhand"), document.fonts.load("800 100px Karla")]);
      const meas = (fam, w) => {
        const s = document.createElement('span');
        s.textContent = 'Frolic hens WMI';
        s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${w} 100px ${fam}`;
        document.body.appendChild(s); const x = s.getBoundingClientRect().width; s.remove(); return x;
      };
      const mono = meas('monospace', 400);
      return {
        loaded: document.fonts.check("400 100px Shrikhand") && document.fonts.check("800 100px Karla"),
        distinctShrikhand: Math.abs(meas("'Shrikhand', monospace", 400) - mono) > 1,
        distinctKarla: Math.abs(meas("'Karla', monospace", 800) - mono) > 1,
      };
    });
    if (!fontOk.loaded || !fontOk.distinctShrikhand || !fontOk.distinctKarla) {
      console.error('FATAL: brand fonts did not apply on card', i + 1, JSON.stringify(fontOk));
      await browser.close();
      process.exit(1);
    }

    await page.screenshot({ path: path.join(outDir, `card_${i + 1}.png`) });
    console.log('rendered card', i + 1, spec.cards[i].kind, 'fonts OK');
  }
  await browser.close();
})();
