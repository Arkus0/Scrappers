// La campaña del 29N: 8 semanas sobre el mapa real, provincia a provincia, hasta la noche electoral.
// Cada acto es una partida contra la IA; si ganas, sumas los escaños reales de 2026 de esa provincia.
import { MAZOS_INICIALES } from '../datos/mazos-iniciales';
import { MAZOS_TEMATICOS } from '../datos/mazos-tematicos';
import { PROV, PROVINCIAS, ZONAS, type ZonaId } from '../datos/provincias';
import type { Nivel } from '../ia/bot';
import type { DefMazo } from '../motor/mazo';
import { aleatorio } from '../motor/rng';

export type BloqueCampana = 'progresista' | 'conservador';
export type TipoActo = 'acto' | 'cara' | 'cuatro' | 'negociacion';

export const SEMANAS = 8;
export const ACTOS_POR_SEMANA = 4;
export const PROVINCIAS_RIVAL_POR_SEMANA = 2;
export const MAYORIA = 176;
export const UMBRAL_NEGOCIACION = 160;

export const CALENDARIO: { semana: number; fechas: string; hito?: string; jefe?: TipoActo }[] = [
  { semana: 1, fechas: '6-11 oct', hito: 'Convocatoria: el BOE disuelve las Cortes' },
  { semana: 2, fechas: '12-18 oct' },
  { semana: 3, fechas: '19-25 oct', hito: 'Cierre de listas' },
  { semana: 4, fechas: '26 oct-1 nov' },
  { semana: 5, fechas: '2-8 nov' },
  { semana: 6, fechas: '9-15 nov', hito: '13N: arranca la campaña oficial' },
  { semana: 7, fechas: '16-22 nov', hito: '16N: cara a cara', jefe: 'cara' },
  { semana: 8, fechas: '23-28 nov', hito: '26N: debate a cuatro', jefe: 'cuatro' },
];

export interface Acto {
  tipo: TipoActo;
  prov: string | null;
  rival: string; // id de mazo (inicial o temático)
  nivel: Nivel;
  lider: string;
}

export interface EstadoCampana {
  bloque: BloqueCampana;
  mazo: string; // id del mazo guardado del jugador
  semana: number; // 1..8; 9 = noche electoral
  actos: number;
  provincias: Record<string, 'yo' | 'rival'>;
  jefes: { cara: 'pendiente' | 'ganado' | 'perdido'; cuatro: 'pendiente' | 'ganado' | 'perdido' };
  historial: { semana: number; prov: string | null; tipo: TipoActo; gano: boolean }[];
  negociacion: 'pendiente' | 'ganada' | 'perdida' | null;
  terminada: { investidura: boolean; escanos: number; motivo: string } | null;
  rng: number;
  enCurso: Acto | null;
}

export function nuevaCampana(bloque: BloqueCampana, mazo: string, semilla = Date.now()): EstadoCampana {
  return {
    bloque, mazo, semana: 1, actos: 0, provincias: {}, jefes: { cara: 'pendiente', cuatro: 'pendiente' }, historial: [], negociacion: null,
    terminada: null, rng: (semilla % 2147483647) | 1, enCurso: null,
  };
}

export const escanosDe = (c: EstadoCampana, quien: 'yo' | 'rival') =>
  Object.entries(c.provincias).filter(([, q]) => q === quien).reduce((s, [id]) => s + PROV[id].escanos, 0);

export const libres = (c: EstadoCampana) => PROVINCIAS.filter((p) => !c.provincias[p.id]);

const mazoPorId = (id: string): (DefMazo & { lider?: string }) | undefined =>
  MAZOS_INICIALES.find((m) => m.id === id) ?? MAZOS_TEMATICOS.find((m) => m.id === id);

/** Mazos rivales según el bloque del jugador, de más flojos a más fuertes. */
function poolRival(c: EstadoCampana, zona: ZonaId | null): string[] {
  const conservador = ['azul', 'verde', 'mill', 'control', 'coalicionC', 'crispacion', 'ascenso', 'leyendasC'];
  const progresista = ['rojo', 'magenta', 'aggro', 'tregua', 'maniobras', 'coalicionP', 'bulo', 'leyendasP'];
  const base = c.bloque === 'progresista' ? conservador : progresista;
  // en Cataluña y la Cornisa Norte también pesan los partidos territoriales; Podemos aparece en las grandes ciudades
  if (zona === 'CAT' || zona === 'NOR' || zona === 'CAN') return ['investidura', ...base];
  return base;
}

const LIDER_MAZO: Record<string, string> = {
  rojo: 'Pedro Sánchez', azul: 'Alberto Núñez Feijóo', magenta: 'Ada Colau', verde: 'Santiago Abascal', aggro: 'Ferraz', ascenso: 'Génova',
  coalicionP: 'La coalición de progreso', coalicionC: 'La coalición del cambio', caos: 'Podemos', investidura: 'Los socios territoriales',
  plato: 'Canal Red', bulo: 'La máquina del fango', control: 'Bambú', mill: 'El Tribunal de Cuentas', crispacion: 'La guerra sucia', tregua: 'El Ministerio de Sanidad',
  maniobras: 'La sala de máquinas', granCoalicion: 'La gran coalición', leyendasP: 'Las leyendas del progreso', leyendasC: 'Las leyendas del cambio',
};
export const nombreLider = (id: string) => LIDER_MAZO[id] ?? id;
export const nombreMazoRival = (id: string) => mazoPorId(id)?.nombre ?? id;
export const mazoRival = (id: string): DefMazo => mazoPorId(id)!;

/** Dificultad: más escaños y semanas más avanzadas, rival más duro. */
export function nivelPara(escanos: number, semana: number): Nivel {
  const puntos = (escanos >= 10 ? 2 : escanos >= 5 ? 1 : 0) + (semana >= 6 ? 1 : 0);
  return puntos >= 2 ? 'experto' : puntos === 1 ? 'normal' : 'novato';
}

/** Prepara el acto en una provincia libre. */
export function prepararActo(c: EstadoCampana, prov: string): Acto | null {
  if (c.terminada || c.provincias[prov] || c.actos >= ACTOS_POR_SEMANA || c.semana > SEMANAS) return null;
  const p = PROV[prov];
  const pool = poolRival(c, p.zona);
  // los rivales fuertes llegan con las provincias grandes y las semanas avanzadas
  const fuerza = Math.min(1, (p.escanos / 38) * 0.6 + (c.semana / SEMANAS) * 0.5);
  const rng = { rng: c.rng };
  const i = Math.min(pool.length - 1, Math.floor(fuerza * (pool.length - 1) + aleatorio(rng) * 2));
  c.rng = rng.rng;
  const rival = pool[Math.max(0, i)];
  const acto: Acto = { tipo: 'acto', prov, rival, nivel: nivelPara(p.escanos, c.semana), lider: nombreLider(rival) };
  c.enCurso = acto;
  return acto;
}

/** El jefe de la semana (cara a cara o debate a cuatro). */
export function prepararJefe(c: EstadoCampana): Acto | null {
  const h = CALENDARIO[c.semana - 1];
  if (!h?.jefe || c.jefes[h.jefe as 'cara' | 'cuatro'] !== 'pendiente') return null;
  const rival = h.jefe === 'cara' ? (c.bloque === 'progresista' ? 'leyendasC' : 'leyendasP') : c.bloque === 'progresista' ? 'coalicionC' : 'coalicionP';
  const acto: Acto = { tipo: h.jefe, prov: null, rival, nivel: 'experto', lider: h.jefe === 'cara' ? (c.bloque === 'progresista' ? 'Alberto Núñez Feijóo' : 'Pedro Sánchez') : 'Los cuatro candidatos' };
  c.enCurso = acto;
  return acto;
}

/** Negociación con los socios territoriales cuando te quedas a las puertas de la mayoría. */
export function prepararNegociacion(c: EstadoCampana): Acto | null {
  if (c.negociacion !== 'pendiente') return null;
  const acto: Acto = { tipo: 'negociacion', prov: null, rival: 'investidura', nivel: 'experto', lider: 'Los socios territoriales' };
  c.enCurso = acto;
  return acto;
}

function mayoresLibres(c: EstadoCampana, n: number, rng: { rng: number }): string[] {
  const l = libres(c).sort((a, b) => b.escanos - a.escanos + (aleatorio(rng) - 0.5) * 6);
  return l.slice(0, n).map((p) => p.id);
}

/** Resultado del acto en curso. Devuelve un resumen para la crónica. */
export function resolverActo(c: EstadoCampana, gano: boolean): string {
  const a = c.enCurso;
  if (!a) return '';
  c.enCurso = null;
  c.historial.push({ semana: c.semana, prov: a.prov, tipo: a.tipo, gano });
  const rng = { rng: c.rng };
  let txt = '';
  if (a.tipo === 'acto' && a.prov) {
    c.provincias[a.prov] = gano ? 'yo' : 'rival';
    c.actos++;
    txt = gano ? `Te llevas ${PROV[a.prov].nombre}: ${PROV[a.prov].escanos} escaños.` : `${PROV[a.prov].nombre} se va al rival: ${PROV[a.prov].escanos} escaños.`;
  } else if (a.tipo === 'cara' || a.tipo === 'cuatro') {
    c.jefes[a.tipo] = gano ? 'ganado' : 'perdido';
    const premio = mayoresLibres(c, 2, rng);
    for (const id of premio) c.provincias[id] = gano ? 'yo' : 'rival';
    const nombres = premio.map((id) => PROV[id].nombre).join(' y ');
    txt = gano ? `¡Ganas el debate! El efecto arrastra ${nombres}.` : `Pierdes el debate: el rival se lleva ${nombres}.`;
  } else if (a.tipo === 'negociacion') {
    c.negociacion = gano ? 'ganada' : 'perdida';
    const yo = escanosDe(c, 'yo');
    c.terminada = gano
      ? { investidura: true, escanos: yo, motivo: `Investidura con ${yo} escaños y el apoyo de los socios territoriales` }
      : { investidura: false, escanos: yo, motivo: `Los socios no te apoyan: repetición electoral con ${yo} escaños` };
    txt = c.terminada.motivo;
  }
  c.rng = rng.rng;
  // con 176 escaños ya no hace falta esperar a la noche electoral
  if (!c.terminada && escanosDe(c, 'yo') >= MAYORIA) {
    c.terminada = { investidura: true, escanos: escanosDe(c, 'yo'), motivo: `¡Mayoría absoluta: ${escanosDe(c, 'yo')} escaños!` };
  }
  return txt;
}

export function jefePendiente(c: EstadoCampana): boolean {
  const h = CALENDARIO[c.semana - 1];
  return !!h?.jefe && c.jefes[h.jefe as 'cara' | 'cuatro'] === 'pendiente';
}

/** Cierra la semana: el rival se lleva provincias y se avanza en el calendario. Devuelve lo que pasa. */
export function cerrarSemana(c: EstadoCampana): string[] {
  if (c.terminada) return [];
  const notas: string[] = [];
  const rng = { rng: c.rng };
  // si no se jugó el debate, se pierde por incomparecencia
  const h = CALENDARIO[c.semana - 1];
  if (h?.jefe && c.jefes[h.jefe as 'cara' | 'cuatro'] === 'pendiente') {
    c.jefes[h.jefe as 'cara' | 'cuatro'] = 'perdido';
    notas.push('No te presentas al debate: el rival se adueña del plató.');
  }
  const toma = mayoresLibres(c, PROVINCIAS_RIVAL_POR_SEMANA, rng);
  for (const id of toma) c.provincias[id] = 'rival';
  if (toma.length) notas.push(`El bloque rival hace campaña y se lleva ${toma.map((id) => PROV[id].nombre).join(' y ')}.`);
  c.rng = rng.rng;
  c.semana++;
  c.actos = 0;
  if (c.semana > SEMANAS) notas.push(...nocheElectoral(c));
  else if (CALENDARIO[c.semana - 1]?.hito) notas.push(`Semana ${c.semana}: ${CALENDARIO[c.semana - 1].hito}.`);
  return notas;
}

/** La noche del 29N: las provincias que nadie ha disputado se reparten y se cuenta. */
export function nocheElectoral(c: EstadoCampana): string[] {
  const rng = { rng: c.rng };
  const notas: string[] = [];
  // lo que queda sin disputar se reparte a medias, la provincia más grande para quien más escaños lleva
  const quedan = libres(c).sort((a, b) => b.escanos - a.escanos);
  let turnoYo = escanosDe(c, 'yo') >= escanosDe(c, 'rival');
  for (const p of quedan) {
    c.provincias[p.id] = turnoYo ? 'yo' : 'rival';
    turnoYo = !turnoYo;
  }
  if (quedan.length) notas.push(`Se escrutan las ${quedan.length} circunscripciones sin disputar.`);
  c.rng = rng.rng;
  const yo = escanosDe(c, 'yo');
  if (yo >= MAYORIA) c.terminada = { investidura: true, escanos: yo, motivo: `¡Mayoría absoluta en la noche electoral: ${yo} escaños!` };
  else if (yo >= UMBRAL_NEGOCIACION) {
    c.negociacion = 'pendiente';
    notas.push(`Te quedas en ${yo} escaños: toca negociar con los socios territoriales.`);
  } else c.terminada = { investidura: false, escanos: yo, motivo: `Te quedas en ${yo} escaños: sin mayoría, repetición electoral` };
  return notas;
}

export const zonaNombre = (z: ZonaId) => ZONAS[z].nombre;
