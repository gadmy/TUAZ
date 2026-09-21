/* Banc de verification TUAZ.
   Charge la page dans un vrai Chromium, joue un nombre fixe de tours sur
   plusieurs graines et sort une empreinte : etat canonique, taille des
   tableaux, pixels du canvas, nombre de globales. Deux versions du jeu qui
   rendent la meme empreinte se comportent pareil.
   Usage : node tools/verif.js [chemin/vers/index.html] */
const { chromium } = require("playwright");
const path = require("path");

const SEEDS = [[1234, 5678], [42, 1337], [900001, 7]];
const TICKS = 1800;

(async () => {
  const file = path.resolve(process.argv[2] || "index.html");
  const shot = process.argv[3] || null;
  const opts = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
  const b = await chromium.launch(opts);
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  pg.on("pageerror", e => errs.push("PAGEERROR: " + e.message));
  pg.on("console", m => { if (m.type() === "error") errs.push("CONSOLE: " + m.text()); });
  await pg.goto("file://" + file);
  await pg.waitForTimeout(1500);

  const res = await pg.evaluate(({ SEEDS, TICKS }) => {
    function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
    const runs = [];
    for (const [bs, ms] of SEEDS) {
      setSeeds(bs, ms); regen(); newGame(); enterPlay();
      for (let i = 0; i < TICKS; i++) simStep();
      render();
      const shape = Object.keys(G).sort().map(k => Array.isArray(G[k]) ? k + ":" + G[k].length : null).filter(Boolean).join(",");
      const cv = document.getElementById("cv");
      const px = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
      let ph = 0x811c9dc5;
      for (let i = 0; i < px.length; i += 7) { ph = (ph ^ px[i]) >>> 0; ph = Math.imul(ph, 16777619) >>> 0; }
      runs.push({ seed: bs + "/" + ms, etat: stateHash(), tick: G.tick, formes: fnv(shape), pixels: ph >>> 0,
                  pos: Math.round(G.p.x) + "," + Math.round(G.p.y), pv: G.p.hp });
    }
    return { version: VERSION, globales: Object.keys(window).length, runs };
  }, { SEEDS, TICKS });

  if (shot) await pg.screenshot({ path: shot });
  console.log(JSON.stringify(res, null, 1));
  console.log("ERREURS:", errs.length ? errs.slice(0, 10).join("\n") : "aucune");
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
