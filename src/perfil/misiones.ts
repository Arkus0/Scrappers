// Misiones diarias, logros y recompensas al terminar una partida.
import { CARTAS_JUGABLES, LISTA_CARTAS, carta, esPolitico } from '../datos/catalogo';
import type { Jug, Partida } from '../motor/tipos';
import { OTRO } from '../motor/tipos';
import { desbloquearBasica, progresoColeccion, VICTORIAS_BASICA, type Perfil } from './perfil';

export type Medida = 'victorias' | 'partidas' | 'derribos' | 'dano' | 'asesores' | 'ascensos' | 'tertulianos' | 'maniobras' | 'online' | 'sobres' | 'shiny';

export interface DefMision {
  id: string;
  texto: string;
  medida: Medida;
  objetivo: number;
  premio: number;
}

export const MISIONES: DefMision[] = [
  { id: 'ganar2', texto: 'Gana 2 partidas', medida: 'victorias', objetivo: 2, premio: 100 },
  { id: 'jugar3', texto: 'Juega 3 partidas', medida: 'partidas', objetivo: 3, premio: 60 },
  { id: 'derribos6', texto: 'Derriba a 6 políticos', medida: 'derribos', objetivo: 6, premio: 80 },
  { id: 'dano600', texto: 'Haz 600 de daño', medida: 'dano', objetivo: 600, premio: 80 },
  { id: 'asesores5', texto: 'Juega 5 Asesores', medida: 'asesores', objetivo: 5, premio: 60 },
  { id: 'ascensos3', texto: 'Asciende a 3 políticos', medida: 'ascensos', objetivo: 3, premio: 60 },
  { id: 'plato2', texto: 'Lleva 2 tertulianos al plató', medida: 'tertulianos', objetivo: 2, premio: 60 },
  { id: 'maniobras2', texto: 'Destapa 2 maniobras', medida: 'maniobras', objetivo: 2, premio: 60 },
  { id: 'online1', texto: 'Juega una partida online', medida: 'online', objetivo: 1, premio: 100 },
  { id: 'sobres2', texto: 'Abre 2 sobres', medida: 'sobres', objetivo: 2, premio: 50 },
];

export interface DefLogro {
  id: string;
  nombre: string;
  texto: string;
  premio: number;
}

export const LOGROS: DefLogro[] = [
  { id: 'primeraVictoria', nombre: 'Primer escaño', texto: 'Gana tu primera partida', premio: 100 },
  { id: 'basica', nombre: 'Militancia completa', texto: `Desbloquea la colección Básica (gana ${VICTORIAS_BASICA} partidas)`, premio: 150 },
  { id: 'diezVictorias', nombre: 'Barón territorial', texto: 'Gana 10 partidas', premio: 300 },
  { id: 'cincuentaVictorias', nombre: 'Animal político', texto: 'Gana 50 partidas', premio: 1000 },
  { id: 'primerShiny', nombre: '¡Brilla!', texto: 'Consigue tu primera carta Shiny', premio: 200 },
  { id: 'coleccion25', nombre: 'Afiliado', texto: 'Consigue el 25 % de la colección', premio: 200 },
  { id: 'coleccion50', nombre: 'Concejal de la colección', texto: 'Consigue el 50 % de la colección', premio: 400 },
  { id: 'coleccion75', nombre: 'Diputado de la colección', texto: 'Consigue el 75 % de la colección', premio: 800 },
  { id: 'coleccion100', nombre: '¡Hazte con los 176!', texto: 'Completa la colección', premio: 3000 },
  { id: 'leyenda', nombre: 'Leyenda viva', texto: 'Consigue una Leyenda', premio: 300 },
  { id: 'investidura', nombre: 'Investido', texto: 'Gana una partida con la Votación de investidura', premio: 300 },
  { id: 'derribarCL', nombre: 'Tumbar a un cabeza de lista', texto: 'Derriba a un Cabeza de lista', premio: 100 },
  { id: 'tresCero', nombre: 'Mayoría absoluta limpia', texto: 'Gana 3-0', premio: 150 },
  { id: 'remontada', nombre: 'Manual de resistencia', texto: 'Gana tras ir 0-2', premio: 250 },
  { id: 'online', nombre: 'Campaña en la red', texto: 'Gana una partida online', premio: 200 },
  { id: 'campana', nombre: 'Presidente del Gobierno', texto: 'Gana la campaña del 29N con la investidura', premio: 1500 },
];

const hoy = (ahora: number) => {
  const d = new Date(ahora);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Reparte tres misiones nuevas cada día. */
export function misionesDelDia(p: Perfil, ahora = Date.now()) {
  const dia = hoy(ahora);
  if (p.misiones.dia === dia) return;
  let h = 0;
  for (const ch of dia) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const elegidas: string[] = [];
  const pool = MISIONES.map((m) => m.id);
  while (elegidas.length < 3 && pool.length) elegidas.push(pool.splice((h = (h * 1103515245 + 12345) >>> 0) % pool.length, 1)[0]);
  p.misiones = { dia, lista: elegidas.map((id) => ({ id, progreso: 0, cobrada: false })) };
}

export interface Recompensa {
  texto: string;
  fondos: number;
}

/** Suma progreso a las misiones y paga las que se completan. */
export function avanzarMisiones(p: Perfil, medida: Medida, n: number): Recompensa[] {
  const r: Recompensa[] = [];
  if (!n) return r;
  for (const m of p.misiones.lista) {
    const def = MISIONES.find((x) => x.id === m.id);
    if (!def || def.medida !== medida || m.cobrada) continue;
    m.progreso = Math.min(def.objetivo, m.progreso + n);
    if (m.progreso >= def.objetivo) {
      m.cobrada = true;
      p.fondos += def.premio;
      r.push({ texto: `Misión cumplida: ${def.texto}`, fondos: def.premio });
    }
  }
  return r;
}

export function conseguirLogro(p: Perfil, id: string): Recompensa[] {
  if (p.logros[id] && id !== 'basica') return [];
  const def = LOGROS.find((x) => x.id === id);
  if (!def) return [];
  if (id === 'basica') {
    if (!desbloquearBasica(p)) return [];
  } else p.logros[id] = Date.now();
  p.fondos += def.premio;
  return [{ texto: `Logro: ${def.nombre}`, fondos: def.premio }];
}

/** Logros que dependen de la colección (tras abrir sobres o fabricar). */
export function revisarColeccion(p: Perfil): Recompensa[] {
  const r: Recompensa[] = [];
  const { tengo, total, shiny } = progresoColeccion(p);
  const pct = (100 * tengo) / total;
  if (shiny > 0) r.push(...conseguirLogro(p, 'primerShiny'));
  if (pct >= 25) r.push(...conseguirLogro(p, 'coleccion25'));
  if (pct >= 50) r.push(...conseguirLogro(p, 'coleccion50'));
  if (pct >= 75) r.push(...conseguirLogro(p, 'coleccion75'));
  if (tengo >= total) r.push(...conseguirLogro(p, 'coleccion100'));
  if (LISTA_CARTAS.some((c) => c.leyenda && (p.coleccion[c.id] || p.coleccion[`${c.id}*`]))) r.push(...conseguirLogro(p, 'leyenda'));
  return r;
}

export interface ResumenPartida {
  modo: 'ia' | 'dos' | 'online' | 'campana';
  ganador: Jug | null;
  yo: Jug;
  partida: Partida;
}

export const PREMIO: Record<ResumenPartida['modo'], [number, number]> = { ia: [50, 15], dos: [20, 20], online: [80, 30], campana: [60, 20] };

/** Contabiliza una partida terminada: fondos, estadísticas, misiones y logros. */
export function registrarPartida(p: Perfil, r: ResumenPartida): Recompensa[] {
  const out: Recompensa[] = [];
  const e = r.partida;
  const gano = r.ganador === r.yo;
  p.stats.partidas++;
  if (r.ganador === null) p.stats.empates++;
  else if (gano) p.stats.victorias++;
  else p.stats.derrotas++;
  if (r.modo === 'online') { p.stats.online++; if (gano) p.stats.victoriasOnline++; }
  const [pg, pp] = PREMIO[r.modo];
  const base = gano ? pg : pp;
  p.fondos += base;
  out.push({ texto: gano ? 'Victoria' : r.ganador === null ? 'Empate' : 'Participación', fondos: base });
  // lo que ha pasado en la partida, desde mi lado
  const rv = OTRO(r.yo);
  let derribos = 0, dano = 0, asesores = 0, ascensos = 0, tertulianos = 0, maniobras = 0, derriboCL = false;
  for (const s of e.sucesos) {
    if (s.s === 'ko' && s.jug === rv) { derribos++; const c = carta(s.carta); if (esPolitico(c) && c.cl) derriboCL = true; }
    if (s.s === 'dano' && s.jug === rv) dano += s.n;
    if (s.s === 'jugada' && s.jug === r.yo && carta(s.carta).clase === 'asesor') asesores++;
    if (s.s === 'ascenso' && s.jug === r.yo) ascensos++;
    if (s.s === 'tertuliano' && s.jug === r.yo) tertulianos++;
    if (s.s === 'maniobra' && s.jug === r.yo) maniobras++;
  }
  p.stats.derribos += derribos;
  p.stats.dano += dano;
  if (r.modo !== 'dos') {
    out.push(...avanzarMisiones(p, 'partidas', 1));
    if (gano) out.push(...avanzarMisiones(p, 'victorias', 1));
    out.push(...avanzarMisiones(p, 'derribos', derribos), ...avanzarMisiones(p, 'dano', dano), ...avanzarMisiones(p, 'asesores', asesores),
      ...avanzarMisiones(p, 'ascensos', ascensos), ...avanzarMisiones(p, 'tertulianos', tertulianos), ...avanzarMisiones(p, 'maniobras', maniobras));
    if (r.modo === 'online') out.push(...avanzarMisiones(p, 'online', 1));
  }
  if (gano && r.modo !== 'dos') {
    out.push(...conseguirLogro(p, 'primeraVictoria'));
    if (p.stats.victorias >= VICTORIAS_BASICA) out.push(...conseguirLogro(p, 'basica'));
    if (p.stats.victorias >= 10) out.push(...conseguirLogro(p, 'diezVictorias'));
    if (p.stats.victorias >= 50) out.push(...conseguirLogro(p, 'cincuentaVictorias'));
    if (e.jugadores[rv].puntos === 0 && e.jugadores[r.yo].puntos >= 3) out.push(...conseguirLogro(p, 'tresCero'));
    if (e.ganador?.motivo.startsWith('Investidura')) { p.stats.investiduras++; out.push(...conseguirLogro(p, 'investidura')); }
    if (r.modo === 'online') out.push(...conseguirLogro(p, 'online'));
    // remontada: el rival llegó a tener 2 puntos antes que yo ninguno
    let maxRival = 0, misPuntosEntonces = 0;
    for (const s of e.sucesos) if (s.s === 'ko') {
      if (s.jug === r.yo) { maxRival += s.puntos; if (maxRival >= 2 && misPuntosEntonces === 0) out.push(...conseguirLogro(p, 'remontada')); }
      else misPuntosEntonces += s.puntos;
    }
  }
  if (derriboCL && r.modo !== 'dos') out.push(...conseguirLogro(p, 'derribarCL'));
  return out.filter((x) => x.fondos > 0 || x.texto);
}

export const totalCartas = () => CARTAS_JUGABLES.length;
