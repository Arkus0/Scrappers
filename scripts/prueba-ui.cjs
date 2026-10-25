// Prueba de humo de la interfaz, en móvil y en escritorio: perfil nuevo, mazo inicial, tutorial, una partida entera
// a clics, sobres, álbum, editor, un acto de campaña completo, misiones, ayuda y ajustes.
// Uso: npm run build:archivo && node scripts/prueba-ui.cjs [carpeta-capturas] [movil|escritorio|ambos]
//      o con el build web: npm run build:web && npm run preview & URL_JUEGO=http://localhost:4173 node scripts/prueba-ui.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = process.argv[2] || 'capturas';
const modo = process.argv[3] || 'ambos';
fs.mkdirSync(dir, { recursive: true });

const clicEn = (p) => async (sel) => { const el = await p.$(sel); if (!el) return false; try { await el.click({ timeout: 1500 }); return true; } catch { return false; } };

/** Juega con clics hasta que sale la pantalla de fin. */
async function partida(p, dir, nombre, errores) {
  const clic = clicEn(p);
  let capturas = 0;
  let pasos = 0;
  for (; pasos < (Number(process.env.PASOS) || 1500); pasos++) {
    if (process.env.DEPURAR) console.log(pasos, await p.$$eval("[data-accion]", (els) => els.map((e) => e.getAttribute("data-accion")).join(" ")), await p.$eval(".barra-turno .info", (e) => e.textContent).catch(() => ""), await p.$eval(".toast", (e) => e.textContent).catch(() => ""), errores.slice(-2).join(" | ").slice(0, 300));
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
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${dir}/${nombre}-fin.png`, fullPage: true });
  return { fin: !!(await p.$('[data-accion="fin"]')), pasos };
}

async function jugar(b, nombre, viewport) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 2, hasTouch: nombre === 'movil' });
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  // las fuentes de Google se bloquean a propósito en la prueba
  p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('net::ERR_FAILED')) errores.push(m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  // URL_JUEGO=http://localhost:4173 para probar el build web (npm run preview); si no, el HTML único como archivo
  await p.goto(process.env.URL_JUEGO || 'file://' + path.resolve('dist/index.html'), { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'domcontentloaded' });
  const clic = clicEn(p);
  const foto = (n, full = true) => p.screenshot({ path: `${dir}/${nombre}-${n}.png`, fullPage: full });
  const pasos = [];
  const paso = async (txt, ok) => { pasos.push(`${ok ? '✓' : '✗'} ${txt}`); if (!ok) errores.push(`Paso fallido: ${txt}`); };
  await foto('portada');
  // primera vez: mazo inicial y tutorial
  await paso('empezar', await clic('[data-accion="empezar"]'));
  await paso('elegir rojo', await clic('[data-accion="inicial-rojo"]'));
  await foto('inicial');
  await paso('confirmar inicial', await clic('[data-accion="confirmar-inicial"]'));
  for (let i = 0; i < 6; i++) await clic('[data-accion="siguiente"]');
  await foto('tutorial', false);
  await paso('primera partida', await clic('[data-accion="primera-partida"]'));
  const r = await partida(p, dir, nombre, errores);
  await paso(`partida terminada (${r.pasos} pasos)`, r.fin);
  await clic('[data-accion="fin"]');
  await foto('inicio');
  // sobres
  await paso('ir a sobres', await clic('[data-accion="menu-sobres"]'));
  await paso('abrir sobre', await clic('[data-accion="abrir-gratis"]'));
  await p.waitForTimeout(900);
  await foto('sobre-cerrado', false);
  await paso('girar todas', await clic('[data-accion="girar-todas"]'));
  await p.waitForTimeout(600);
  await foto('sobre-abierto');
  await clic('[data-accion="cerrar-sobre"]');
  await clic('[data-accion="volver"]');
  // álbum
  await paso('álbum', await clic('[data-accion="menu-album"]'));
  await p.waitForTimeout(300);
  await foto('album', false);
  await clic('[data-accion="volver"]');
  // mazos y editor
  await paso('mazos', await clic('[data-accion="menu-mazos"]'));
  await clic('[data-accion="tab-tienda"]');
  await foto('tienda', false);
  await clic('.pestanas button');
  await paso('editor', await clic('[data-accion="nuevo-mazo"]'));
  for (let i = 0; i < 4; i++) await clic('[data-accion^="anadir-"]');
  await foto('editor', false);
  await clic('[data-accion="volver"]');
  await clic('.velo .boton.peligro');
  await clic('[data-accion="volver"]');
  // campaña
  await paso('campaña', await clic('[data-accion="menu-campana"]'));
  await paso('empezar campaña', await clic('[data-accion="empezar-campana"]'));
  await paso('elegir Madrid', await clic('[data-prov="28"]'));
  await p.waitForTimeout(200);
  await foto('campana');
  await paso('jugar acto', await clic('[data-accion="jugar-acto"]'));
  const r2 = await partida(p, dir, `${nombre}-acto`, errores);
  await paso(`acto terminado (${r2.pasos} pasos)`, r2.fin);
  await foto('fin-acto');
  await clic('[data-accion="fin"]');
  await foto('campana-tras-acto');
  await clic('[data-accion="volver"]');
  // misiones, ayuda y ajustes
  for (const [m, n] of [['menu-misiones', 'misiones'], ['menu-ayuda', 'ayuda'], ['menu-ajustes', 'ajustes']]) {
    await paso(n, await clic(`[data-accion="${m}"]`));
    await foto(n, false);
    await clic('[data-accion="volver"]');
  }
  await ctx.close();
  return { fin: r.fin && r2.fin, pasos, errores };
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
