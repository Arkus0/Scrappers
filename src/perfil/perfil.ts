// El perfil del jugador: colección, fondos, papeletas, sobres, mazos, misiones, logros y campaña.
// Funciones puras sobre un objeto serializable (lo guarda almacen.ts).
import { CARTAS_JUGABLES, CATALOGO, LISTA_CARTAS } from '../datos/catalogo';
import { MAZOS_INICIALES, type MazoInicial } from '../datos/mazos-iniciales';
import { MAZOS_TEMATICOS } from '../datos/mazos-tematicos';
import type { Nivel } from '../ia/bot';
import { MAX_COPIAS, sugerirTipos, validarMazo } from '../motor/mazo';
import type { Rareza, Tipo } from '../motor/tipos';
import type { EstadoCampana } from './campana';

export const VERSION_PERFIL = 1;

export interface MazoGuardado {
  id: string;
  nombre: string;
  cartas: string[];
  tipos: Tipo[];
}

export interface MisionActiva {
  id: string;
  progreso: number;
  cobrada: boolean;
}

export interface Stats {
  partidas: number;
  victorias: number;
  derrotas: number;
  empates: number;
  derribos: number;
  dano: number;
  shiniesAbiertas: number;
  sobresAbiertos: number;
  online: number;
  victoriasOnline: number;
  investiduras: number;
}

export interface Perfil {
  v: typeof VERSION_PERFIL;
  nombre: string;
  creado: number;
  inicial: MazoInicial['id'] | null;
  /** id de carta → copias; las Shiny llevan «*» */
  coleccion: Record<string, number>;
  fondos: number;
  papeletas: number;
  sobres: { gratis: number; proximoGratis: number; abiertos: number; sinCL: number; rng: number };
  mazos: MazoGuardado[];
  mazoActivo: string | null;
  tematicos: string[];
  misiones: { dia: string; lista: MisionActiva[] };
  logros: Record<string, number>;
  stats: Stats;
  campana: EstadoCampana | null;
  ajustes: { reducirMovimiento: boolean; nivel: Nivel; urlServidor: string; musica: number; efectos: number };
  tutorialVisto: boolean;
}

export const FONDOS_INICIALES = 300;
export const PRECIO_SOBRE = 100;
export const HORAS_SOBRE_GRATIS = 12;
export const MAX_SOBRES_GRATIS = 2;
export const VALOR_PAPELETAS: Record<Rareza, number> = { C: 5, I: 10, R: 25, CL: 100, E: 300, S: 600 };
export const COSTE_FABRICAR: Record<Rareza, number> = { C: 20, I: 40, R: 100, CL: 400, E: 1200, S: 2400 };
export const VICTORIAS_BASICA = 3;

export function perfilNuevo(ahora = Date.now()): Perfil {
  return {
    v: VERSION_PERFIL, nombre: 'Candidato', creado: ahora, inicial: null, coleccion: {}, fondos: FONDOS_INICIALES, papeletas: 0,
    sobres: { gratis: MAX_SOBRES_GRATIS, proximoGratis: ahora + HORAS_SOBRE_GRATIS * 3600_000, abiertos: 0, sinCL: 0, rng: (ahora % 2147483647) | 1 },
    mazos: [], mazoActivo: null, tematicos: [], misiones: { dia: '', lista: [] }, logros: {},
    stats: { partidas: 0, victorias: 0, derrotas: 0, empates: 0, derribos: 0, dano: 0, shiniesAbiertas: 0, sobresAbiertos: 0, online: 0, victoriasOnline: 0, investiduras: 0 },
    campana: null, ajustes: { reducirMovimiento: false, nivel: 'normal', urlServidor: '', musica: 0.6, efectos: 0.8 }, tutorialVisto: false,
  };
}

/** Pone al día un perfil guardado con una versión anterior. */
export function migrar(p: Partial<Perfil> & { v?: number }): Perfil {
  const base = perfilNuevo(p.creado ?? Date.now());
  const r = { ...base, ...p, v: VERSION_PERFIL } as Perfil;
  r.sobres = { ...base.sobres, ...(p.sobres ?? {}) };
  r.stats = { ...base.stats, ...(p.stats ?? {}) };
  r.ajustes = { ...base.ajustes, ...(p.ajustes ?? {}) };
  r.misiones = p.misiones ?? base.misiones;
  // cartas que ya no existen
  for (const k of Object.keys(r.coleccion)) if (!CATALOGO[k.replace(/\*$/, '')]) delete r.coleccion[k];
  return r;
}

// ————————————————————————————————————— colección
export const copias = (p: Perfil, id: string) => (p.coleccion[id] ?? 0);
/** Copias contando normales y Shiny. */
export const copiasTotal = (p: Perfil, id: string) => copias(p, id) + copias(p, `${id}*`);

export function anadir(p: Perfil, id: string, n = 1) {
  p.coleccion[id] = copias(p, id) + n;
}

/** Porcentaje de cartas distintas conseguidas (sin contar Shiny). */
export function progresoColeccion(p: Perfil): { tengo: number; total: number; shiny: number; totalShiny: number } {
  const lista = CARTAS_JUGABLES;
  return {
    tengo: lista.filter((c) => copiasTotal(p, c.id) > 0).length,
    total: lista.length,
    shiny: lista.filter((c) => copias(p, `${c.id}*`) > 0).length,
    totalShiny: lista.filter((c) => c.persona).length,
  };
}

/** ¿Tiene el jugador las cartas de un mazo? (cuenta copias normales y Shiny) */
export function cartasQueFaltan(p: Perfil, cartas: string[]): string[] {
  const necesita = new Map<string, number>();
  for (const id of cartas) necesita.set(id.replace(/\*$/, ''), (necesita.get(id.replace(/\*$/, '')) ?? 0) + 1);
  const faltan: string[] = [];
  for (const [id, n] of necesita) for (let i = copiasTotal(p, id); i < n; i++) faltan.push(id);
  return faltan;
}

/** Usa las Shiny que tengas al montar el mazo para jugar (se ven brillar en la partida). */
export function conShiny(p: Perfil, cartas: string[]): string[] {
  const usadas = new Map<string, number>();
  return cartas.map((id) => {
    const u = usadas.get(id) ?? 0;
    usadas.set(id, u + 1);
    return u < copias(p, `${id}*`) ? `${id}*` : id;
  });
}

// ————————————————————————————————————— mazo inicial y Básica
export function elegirInicial(p: Perfil, id: MazoInicial['id']) {
  const m = MAZOS_INICIALES.find((x) => x.id === id)!;
  p.inicial = id;
  for (const c of m.cartas) anadir(p, c);
  const mz: MazoGuardado = { id: `inicial-${id}`, nombre: m.nombre, cartas: [...m.cartas], tipos: [...m.tipos] };
  p.mazos = [mz, ...p.mazos.filter((x) => x.id !== mz.id)];
  p.mazoActivo = mz.id;
}

/** Tras unas cuantas victorias se desbloquea toda la colección Básica (dos copias de cada carta). */
export function desbloquearBasica(p: Perfil): boolean {
  if (p.logros.basica) return false;
  for (const c of LISTA_CARTAS) if (c.coleccion === 'basica') p.coleccion[c.id] = Math.max(copias(p, c.id), c.unica ? 1 : MAX_COPIAS);
  for (const m of MAZOS_INICIALES) {
    if (!p.mazos.some((x) => x.id === `inicial-${m.id}`)) p.mazos.push({ id: `inicial-${m.id}`, nombre: m.nombre, cartas: [...m.cartas], tipos: [...m.tipos] });
  }
  p.logros.basica = Date.now();
  return true;
}

// ————————————————————————————————————— papeletas
export function reciclarDuplicados(p: Perfil): number {
  let ganadas = 0;
  for (const [k, n] of Object.entries(p.coleccion)) {
    const c = CATALOGO[k.replace(/\*$/, '')];
    if (!c) continue;
    const max = c.unica ? 1 : MAX_COPIAS;
    // las normales y las Shiny se cuentan juntas: sobran las que pasen del máximo, empezando por las normales
    if (k.endsWith('*')) continue;
    const shiny = copias(p, `${k}*`);
    const sobran = Math.max(0, n + shiny - max);
    const deNormales = Math.min(sobran, n);
    const deShiny = sobran - deNormales;
    ganadas += deNormales * VALOR_PAPELETAS[c.rareza] + deShiny * VALOR_PAPELETAS[c.rareza] * 2;
    p.coleccion[k] = n - deNormales;
    if (deShiny) p.coleccion[`${k}*`] = shiny - deShiny;
  }
  p.papeletas += ganadas;
  return ganadas;
}

export function puedeFabricar(p: Perfil, id: string): boolean {
  const c = CATALOGO[id];
  if (!c || c.retirada) return false;
  return p.papeletas >= COSTE_FABRICAR[c.rareza] && copiasTotal(p, id) < (c.unica ? 1 : MAX_COPIAS);
}

export function fabricar(p: Perfil, id: string): boolean {
  if (!puedeFabricar(p, id)) return false;
  p.papeletas -= COSTE_FABRICAR[CATALOGO[id].rareza];
  anadir(p, id);
  return true;
}

// ————————————————————————————————————— mazos guardados
export function guardarMazo(p: Perfil, m: MazoGuardado): string[] {
  const errores = validarMazo(m);
  const faltan = cartasQueFaltan(p, m.cartas);
  if (faltan.length) errores.push(`Te faltan cartas: ${[...new Set(faltan)].map((x) => CATALOGO[x].nombre).join(', ')}`);
  if (errores.length) return errores;
  const i = p.mazos.findIndex((x) => x.id === m.id);
  if (i >= 0) p.mazos[i] = m;
  else p.mazos.push(m);
  return [];
}

export function borrarMazo(p: Perfil, id: string) {
  p.mazos = p.mazos.filter((x) => x.id !== id);
  if (p.mazoActivo === id) p.mazoActivo = p.mazos[0]?.id ?? null;
}

export function mazoNuevo(cartas: string[] = []): MazoGuardado {
  return { id: `m-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`, nombre: 'Mazo nuevo', cartas, tipos: sugerirTipos(cartas) };
}

// ————————————————————————————————————— tienda
export function comprarTematico(p: Perfil, id: string): boolean {
  const m = MAZOS_TEMATICOS.find((x) => x.id === id);
  if (!m || p.tematicos.includes(id) || p.fondos < m.precio) return false;
  p.fondos -= m.precio;
  p.tematicos.push(id);
  for (const c of m.cartas) anadir(p, c);
  p.mazos.push({ id: `tematico-${m.id}`, nombre: m.nombre, cartas: [...m.cartas], tipos: [...m.tipos] });
  return true;
}
