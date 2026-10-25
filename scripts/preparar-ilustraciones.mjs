// Prepara las ilustraciones de ilustraciones/<id>.(png|jpg|jpeg|webp) para el juego:
// recorte 20:13 a 600 × 390, WebP, en src/assets/web/ilustraciones/<id>.webp (de ahí las carga ArteSVG).
// Uso: npm run ilustraciones   ·   --si-hay: no hace nada (ni falla) si no hay carpeta ilustraciones/ (lo usa el build)
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, copyFileSync } from 'node:fs';
import path from 'node:path';

const ORIGEN = 'ilustraciones';
const DESTINO = 'src/assets/web/ilustraciones';
const ANCHO = 600;
const ALTO = 390;
const siHay = process.argv.includes('--si-hay');

if (!existsSync(ORIGEN)) {
  if (siHay) process.exit(0);
  console.error(`No existe la carpeta ${ORIGEN}/: crea la carpeta y guarda ahí las imágenes con el id de la carta (N-001.png, B-07.jpg…).`);
  process.exit(1);
}

/** «n001», «N-1», «N-001 Pedro Sánchez.png» → «N-001» (la Básica y las secretas llevan 2 cifras, la expansión 3). */
function idDe(nombre) {
  const m = /^([bns])\s*-?\s*0*(\d{1,3})(?!\d)/i.exec(nombre);
  if (!m) return null;
  const letra = m[1].toUpperCase();
  return `${letra}-${m[2].padStart(letra === 'N' ? 3 : 2, '0')}`;
}

let ids = null;
try {
  ids = new Set(JSON.parse(readFileSync('docs/cartas.json', 'utf8')).cartas.map((c) => c.id));
} catch {
  console.warn('Aviso: falta docs/cartas.json (npm run cartas -- --json); no se comprueba que los ids existan.');
}

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('Aviso: sharp no está instalado: solo se copian las imágenes que ya son .webp, sin recortar.');
}

mkdirSync(DESTINO, { recursive: true });
const archivos = readdirSync(ORIGEN).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
let hechas = 0, iguales = 0;
const raras = [];
const vistos = new Set();
for (const f of archivos) {
  const id = idDe(f);
  if (!id || (ids && !ids.has(id))) { raras.push(f); continue; }
  if (vistos.has(id)) { raras.push(`${f} (repetida: ya hay otra imagen para ${id})`); continue; }
  vistos.add(id);
  const de = path.join(ORIGEN, f);
  const a = path.join(DESTINO, `${id}.webp`);
  // no se rehace lo que ya está al día
  if (existsSync(a) && statSync(a).mtimeMs >= statSync(de).mtimeMs) { iguales++; continue; }
  if (sharp) {
    await sharp(de).resize(ANCHO, ALTO, { fit: 'cover', position: 'attention' }).webp({ quality: 82 }).toFile(a);
    hechas++;
  } else if (/\.webp$/i.test(f)) {
    copyFileSync(de, a);
    hechas++;
  } else raras.push(`${f} (hace falta sharp para convertirla)`);
}

console.log(`Ilustraciones: ${hechas} preparadas, ${iguales} ya estaban al día${ids ? `, ${vistos.size}/${ids.size} cartas con imagen` : ''}.`);
if (raras.length) console.warn(`No se han usado (nombre sin id de carta válido): ${raras.join(', ')}`);
