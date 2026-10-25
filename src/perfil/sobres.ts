// Sobres de la expansión 29N: 5 cartas, probabilidades por hueco, garantía de CL y Shiny.
// La semilla vive en el perfil: recargar la página no repite la tirada.
import { CARTAS_JUGABLES } from '../datos/catalogo';
import { aleatorio } from '../motor/rng';
import type { Carta, Rareza } from '../motor/tipos';
import { anadir, HORAS_SOBRE_GRATIS, MAX_SOBRES_GRATIS, PRECIO_SOBRE, type Perfil } from './perfil';

export interface CartaSobre {
  id: string;
  shiny: boolean;
  nueva: boolean;
}

export const PROB_SHINY = 1 / 20;
export const SOBRES_GARANTIA = 10;

/** Probabilidades acumuladas por hueco (huecos 1-3 siempre comunes). */
export const HUECO_4: [Rareza, number][] = [['I', 0.9], ['R', 0.06], ['CL', 0.025], ['E', 0.015]];
export const HUECO_5: [Rareza, number][] = [['I', 0.62], ['R', 0.22], ['CL', 0.1], ['E', 0.055], ['S', 0.005]];
const GARANTIA: [Rareza, number][] = [['CL', 0.8], ['E', 0.15], ['S', 0.05]];

const POOL: Record<Rareza, Carta[]> = { C: [], I: [], R: [], CL: [], E: [], S: [] };
for (const c of CARTAS_JUGABLES) if (c.coleccion !== 'basica') POOL[c.rareza].push(c);

function tirar(rng: { rng: number }, tabla: [Rareza, number][]): Rareza {
  let x = aleatorio(rng);
  for (const [r, p] of tabla) {
    if (x < p) return r;
    x -= p;
  }
  return tabla[tabla.length - 1][0];
}

function sacar(rng: { rng: number }, r: Rareza): Carta {
  const pool = POOL[r].length ? POOL[r] : POOL.C;
  return pool[Math.floor(aleatorio(rng) * pool.length)];
}

/** Actualiza los sobres gratis según la hora. */
export function recargarGratis(p: Perfil, ahora = Date.now()) {
  while (p.sobres.gratis < MAX_SOBRES_GRATIS && ahora >= p.sobres.proximoGratis) {
    p.sobres.gratis++;
    p.sobres.proximoGratis += HORAS_SOBRE_GRATIS * 3600_000;
  }
  if (p.sobres.gratis >= MAX_SOBRES_GRATIS) p.sobres.proximoGratis = Math.max(p.sobres.proximoGratis, ahora + HORAS_SOBRE_GRATIS * 3600_000);
}

export type Pago = 'gratis' | 'fondos';

export function puedeAbrir(p: Perfil, pago: Pago): boolean {
  return pago === 'gratis' ? p.sobres.gratis > 0 : p.fondos >= PRECIO_SOBRE;
}

/** Abre un sobre: cobra, tira las cartas, las añade a la colección y devuelve lo que ha salido. */
export function abrirSobre(p: Perfil, pago: Pago, ahora = Date.now()): CartaSobre[] | null {
  recargarGratis(p, ahora);
  if (!puedeAbrir(p, pago)) return null;
  if (pago === 'gratis') {
    if (p.sobres.gratis === MAX_SOBRES_GRATIS) p.sobres.proximoGratis = ahora + HORAS_SOBRE_GRATIS * 3600_000;
    p.sobres.gratis--;
  } else p.fondos -= PRECIO_SOBRE;
  const rng = { rng: p.sobres.rng };
  const rarezas: Rareza[] = ['C', 'C', 'C', tirar(rng, HUECO_4), tirar(rng, HUECO_5)];
  const garantia = p.sobres.sinCL + 1 >= SOBRES_GARANTIA;
  if (garantia && !rarezas.some((r) => r === 'CL' || r === 'E' || r === 'S')) rarezas[4] = tirar(rng, GARANTIA);
  const cartas: CartaSobre[] = [];
  const vistas = new Set<string>();
  for (const r of rarezas) {
    // sin repetir carta dentro del mismo sobre
    let c = sacar(rng, r);
    for (let i = 0; i < 6 && vistas.has(c.id); i++) c = sacar(rng, r);
    vistas.add(c.id);
    const shiny = !!c.persona && aleatorio(rng) < PROB_SHINY;
    const clave = shiny ? `${c.id}*` : c.id;
    const nueva = (p.coleccion[c.id] ?? 0) + (p.coleccion[`${c.id}*`] ?? 0) === 0;
    anadir(p, clave);
    cartas.push({ id: c.id, shiny, nueva });
  }
  p.sobres.rng = rng.rng;
  p.sobres.abiertos++;
  p.stats.sobresAbiertos++;
  p.stats.shiniesAbiertas += cartas.filter((c) => c.shiny).length;
  p.sobres.sinCL = rarezas.some((r) => r === 'CL' || r === 'E' || r === 'S') ? 0 : p.sobres.sinCL + 1;
  return cartas;
}
