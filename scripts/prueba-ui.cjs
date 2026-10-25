// Prueba de humo de la interfaz: juega una partida completa contra la IA haciendo clic, en móvil y en escritorio.
// Uso: npm run build && node scripts/prueba-ui.cjs [carpeta-capturas] [movil|escritorio|ambos]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = process.argv[2] || 'capturas';
const modo = process.argv[3] || 'ambos';
fs.mkdirSync(dir, { recursive: true });

async function jugar(b, nombre, viewport) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 2, hasTouch: nombre === 'movil' });
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.goto('file://' + path.resolve('dist/index.html'), { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'domcontentloaded' });
  if (globalThis.__antesDeJugar) await globalThis.__antesDeJugar(p, dir, nombre);
  await p.click('text=Partida rápida');
  const clic = async (sel) => { const el = await p.$(sel); if (!el) return false; try { await el.click({ timeout: 1500 }); return true; } catch { return false; } };
  let capturas = 0;
  let pasos = 0;
  for (; pasos < 3000; pasos++) {
    if (await p.$('[data-accion="fin"]')) break;
    if (await clic('[data-accion="cortina"]')) continue;
    // decisiones
    if (await p.$('.velo .modal [data-accion^="elige-"]')) {
      await clic('.velo .modal [data-accion^="elige-"]');
      await clic('[data-accion="confirmar"]');
      continue;
    }
    if (await p.$('[data-accion="confirmar"]')) { await clic('[data-accion="confirmar"]'); continue; }
    if (await clic('[data-accion="opcion-0"]')) continue;
    if (await p.$('.decision')) { if (await clic('.carta.elegible')) continue; }
    // mi turno
    const pasar = await p.$('[data-accion="pasar"]');
    if (pasar) {
      if (capturas < 2 && pasos > 6) { await p.screenshot({ path: `${dir}/${nombre}-tablero-${capturas}.png` }); capturas++; }
      // ¿puedo atacar?
      if (await clic('[data-accion="tribuna-propia"]')) {
        if (await clic('.hoja [data-accion^="atacar"]')) continue;
        if (await clic('.hoja [data-accion^="voto"]')) continue;
        await clic('.hoja .boton.pequeno');
      }
      // una carta de la mano
      const manos = await p.$$('.mano [data-accion^="mano-"]');
      let jugado = false;
      for (const m of manos.slice(0, 3)) {
        try { await m.click({ timeout: 1000 }); } catch { continue; }
        if (capturas === 2) { await p.screenshot({ path: `${dir}/${nombre}-hoja.png` }); capturas++; }
        if (await clic('.hoja .hoja-botones .boton:not([disabled])')) { jugado = true; break; }
        await clic('.hoja .boton.pequeno');
      }
      if (jugado) continue;
      // dar el voto a alguien del banquillo
      if (await clic('.lado [data-accion^="mesa-"]')) {
        if (await clic('.hoja [data-accion^="voto"]')) continue;
        await clic('.hoja .boton.pequeno');
      }
      await clic('[data-accion="pasar"]');
      continue;
    }
    await p.waitForTimeout(250);
  }
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${dir}/${nombre}-fin.png` });
  const fin = !!(await p.$('[data-accion="fin"]'));
  await ctx.close();
  return { fin, errores, pasos };
}

(async () => {
  const b = await chromium.launch();
  const resultados = {};
  if (modo !== 'escritorio') resultados.movil = await jugar(b, 'movil', { width: 390, height: 844 });
  if (modo !== 'movil') resultados.escritorio = await jugar(b, 'escritorio', { width: 1440, height: 900 });
  await b.close();
  console.log(JSON.stringify(resultados, null, 2));
  const mal = Object.values(resultados).some((r) => !r.fin || r.errores.length);
  process.exit(mal ? 1 : 0);
})();
