// Constructores compactos para escribir cientos de cartas sin repetir estructura.
import type {
  Accion, Carisma, CartaEntrenador, CartaPolitico, CartaTertuliano, Clave, Coleccion, Cond, DisparoManiobra, Efecto, FiltroPol,
  PartidoId, Pasiva, Rareza, Tipo,
} from '../motor/tipos';
import { PARTIDOS } from './partidos';
import { condTxt, efectosTxt, pasivaTxt } from './textos';

const LETRA: Record<string, Tipo> = { R: 'rojo', M: 'magenta', A: 'azul', V: 'verde', P: 'morado', T: 'ambar', I: 'incoloro' };

/** «RRI» → rojo, rojo, incoloro. */
export const coste = (s: string): Tipo[] => [...s].map((ch) => {
  const t = LETRA[ch];
  if (!t) throw new Error(`Letra de coste desconocida: ${ch}`);
  return t;
});

export const prefijo: Record<Coleccion, string> = { basica: 'B', '29n': 'N', secreta: 'S' };
export const idCarta = (col: Coleccion, num: number) => `${prefijo[col]}-${String(num).padStart(col === '29n' ? 3 : 2, '0')}`;

function danoTxtAuto(dano: number, efectos?: Efecto[]): string | undefined {
  if (!efectos?.length) return undefined;
  const moneda = efectos.find((x) => x.e === 'monedas' || x.e === 'hastaCruz') as Extract<Efecto, { e: 'monedas' | 'hastaCruz' }> | undefined;
  if (moneda && dano === 0) {
    const m = moneda.porCara.find((y) => y.e === 'masDano') as Extract<Efecto, { e: 'masDano' }> | undefined;
    if (m) return `${m.n}×`;
  }
  if (JSON.stringify(efectos).includes('"masDano')) return `${dano}+`;
  return undefined;
}

export function atq(nombre: string, c: string, dano: number, efectos?: Efecto[], o: { danoTxt?: string; texto?: string } = {}): Accion {
  return { nombre, coste: coste(c), dano, efectos, danoTxt: o.danoTxt ?? danoTxtAuto(dano, efectos), texto: o.texto ?? (efectos?.length ? efectosTxt(efectos) : undefined) };
}

/** Carisma con su texto generado (salvo que se dé uno). */
export function carisma(nombre: string, disparo: Carisma['disparo'], d: { efectos?: Efecto[]; pasivas?: Pasiva[]; requisito?: Cond; descartaVotos?: number; texto?: string }): Carisma {
  const prefijoTxt: Record<Carisma['disparo'], string> = {
    activado: 'Una vez por turno: ', mitin: 'Mitin (al bajarlo o ascenderlo): ', legado: 'Legado (al caer): ', pasiva: '',
    alRecibirDano: 'Al recibir daño: ', inicioTurno: 'Al empezar tu turno: ',
  };
  const coste = d.descartaVotos ? `descarta ${d.descartaVotos} voto${d.descartaVotos === 1 ? '' : 's'} de este político: ` : '';
  const cuerpo = d.texto ?? [d.efectos?.length ? efectosTxt(d.efectos) : '', ...(d.pasivas ?? []).map(pasivaTxt)].filter(Boolean).join(' ');
  const req = d.requisito ? ` (solo si ${condTxt(d.requisito)})` : '';
  return { nombre, disparo, efectos: d.efectos, pasivas: d.pasivas, requisito: d.requisito, descartaVotos: d.descartaVotos, texto: `${prefijoTxt[disparo]}${coste}${coste ? cuerpo.charAt(0).toLowerCase() + cuerpo.slice(1) : cuerpo}${req}` };
}

const DEBILIDAD_POR_DEFECTO: Partial<Record<Tipo, Tipo>> = { rojo: 'magenta', magenta: 'rojo', azul: 'verde', verde: 'azul' };

export interface DefPol {
  num: number;
  nombre: string;
  persona: string;
  cargo: string;
  partido: PartidoId;
  tipo?: Tipo;
  tipo2?: Tipo;
  fase?: CartaPolitico['fase'];
  de?: string;
  aguante: number;
  relevo: number;
  debilidad?: Tipo | null;
  acciones: Accion[];
  carisma?: Carisma;
  rareza: Rareza;
  cl?: boolean;
  frase?: string;
  escena: string;
  icono: string;
  claves?: Clave[];
  arquetipos?: string[];
  unica?: boolean;
  leyenda?: Cond;
}

export function pol(col: Coleccion, d: DefPol): CartaPolitico {
  const tipo = d.tipo ?? PARTIDOS[d.partido].tipo;
  const debilidad = d.debilidad !== undefined ? d.debilidad : DEBILIDAD_POR_DEFECTO[tipo] ?? null;
  if (debilidad === undefined) throw new Error(`Falta la debilidad de ${d.nombre}`);
  const claves = new Set<Clave>(d.claves ?? []);
  if (d.carisma?.disparo === 'mitin') claves.add('mitin');
  if (d.carisma?.disparo === 'legado') claves.add('legado');
  if (d.tipo2) claves.add('fichaje');
  if (d.unica) claves.add('unica');
  if (d.leyenda) claves.add('leyenda');
  return {
    id: idCarta(col, d.num), num: d.num, coleccion: col, nombre: d.nombre, clase: 'politico', rareza: d.rareza, frase: d.frase, persona: d.persona,
    escena: d.escena, icono: d.icono, tipo, tipo2: d.tipo2, partido: d.partido, fase: d.fase ?? 'basico', de: d.de, aguante: d.aguante,
    debilidad, relevo: d.relevo, cl: d.cl, acciones: d.acciones, carisma: d.carisma, cargo: d.cargo, claves: [...claves],
    arquetipos: d.arquetipos, unica: d.unica, leyenda: d.leyenda,
  };
}

// ————————————————————————————————————— espejo entre bloques
const MAPA_ESPEJO: Record<string, string> = {
  rojo: 'azul', azul: 'rojo', magenta: 'verde', verde: 'magenta', PSOE: 'PP', PP: 'PSOE', FA: 'VOX', VOX: 'FA',
  progresista: 'conservador', conservador: 'progresista',
};

/** Copia profunda cambiando tipos, partidos y bloques por los del otro bloque. */
export function reflejar<T>(x: T): T {
  if (Array.isArray(x)) return x.map(reflejar) as T;
  if (x && typeof x === 'object') {
    const r: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x)) r[k] = k === 'texto' || k === 'nombre' ? v : reflejar(v);
    return r as T;
  }
  if (typeof x === 'string' && MAPA_ESPEJO[x]) return MAPA_ESPEJO[x] as T;
  return x;
}

export interface Comun {
  /** RA: rojo ↔ azul · MV: magenta ↔ verde */
  eje: 'RA' | 'MV';
  fase?: CartaPolitico['fase'];
  aguante: number;
  relevo: number;
  rareza: Rareza;
  cl?: boolean;
  claves?: Clave[];
  arquetipos?: string[];
  /** costes con X = tipo propio, Y = socio de bloque, I = incoloro; efectos escritos para el lado progresista */
  acciones: { coste: string; dano: number; efectos?: Efecto[]; danoTxt?: string }[];
  carisma?: { disparo: Carisma['disparo']; efectos?: Efecto[]; pasivas?: Pasiva[]; requisito?: Cond; descartaVotos?: number };
  unica?: boolean;
}

export interface Lado {
  num: number;
  nombre: string;
  persona: string;
  cargo: string;
  de?: string;
  frase?: string;
  escena: string;
  icono: string;
  acciones: string[];
  carisma?: string;
}

export function espejo(col: Coleccion, c: Comun, p: Lado, q: Lado): [CartaPolitico, CartaPolitico] {
  const [tP, sP, tC, sC] = c.eje === 'RA' ? ['R', 'M', 'A', 'V'] : ['M', 'R', 'V', 'A'];
  const hacer = (lado: Lado, prog: boolean): CartaPolitico => {
    const [x, y] = prog ? [tP, sP] : [tC, sC];
    const partido: PartidoId = c.eje === 'RA' ? (prog ? 'PSOE' : 'PP') : prog ? 'FA' : 'VOX';
    const fix = <T>(v: T): T => (prog ? v : reflejar(v));
    const acciones = c.acciones.map((a, i) => atq(lado.acciones[i] ?? `Acción ${i + 1}`, a.coste.replace(/X/g, x).replace(/Y/g, y), a.dano, fix(a.efectos), { danoTxt: a.danoTxt }));
    const k = c.carisma ? carisma(lado.carisma ?? 'Carisma', c.carisma.disparo, fix({ efectos: c.carisma.efectos, pasivas: c.carisma.pasivas, requisito: c.carisma.requisito, descartaVotos: c.carisma.descartaVotos })) : undefined;
    return pol(col, {
      num: lado.num, nombre: lado.nombre, persona: lado.persona, cargo: lado.cargo, partido, fase: c.fase, de: lado.de, aguante: c.aguante,
      relevo: c.relevo, acciones, carisma: k, rareza: c.rareza, cl: c.cl, frase: lado.frase, escena: lado.escena, icono: lado.icono,
      claves: c.claves, arquetipos: c.arquetipos, unica: c.unica,
    });
  };
  const a = hacer(p, true);
  const b = hacer(q, false);
  a.pareja = b.id;
  b.pareja = a.id;
  return [a, b];
}

// ————————————————————————————————————— tertulianos y entrenadores
export interface DefTertuliano {
  num: number;
  nombre: string;
  persona: string;
  cargo: string;
  linea: CartaTertuliano['linea'];
  presentador?: boolean;
  programa?: string;
  audiencia: number;
  mitin?: Efecto[];
  inicioTurno?: Efecto[];
  pasivas?: Pasiva[];
  rareza: Rareza;
  frase?: string;
  escena: string;
  icono: string;
  arquetipos?: string[];
  texto?: string;
  unica?: boolean;
  pareja?: string;
}

export function tertuliano(col: Coleccion, d: DefTertuliano): CartaTertuliano {
  const partes = [
    d.mitin?.length ? `Al entrar: ${efectosTxt(d.mitin)}` : '',
    d.inicioTurno?.length ? `Al empezar tu turno: ${efectosTxt(d.inicioTurno)}` : '',
    ...(d.pasivas ?? []).map(pasivaTxt),
  ].filter(Boolean);
  return {
    id: idCarta(col, d.num), num: d.num, coleccion: col, nombre: d.nombre, clase: 'tertuliano', rareza: d.rareza, persona: d.persona,
    cargo: d.cargo, linea: d.linea, presentador: d.presentador, programa: d.programa, audiencia: d.audiencia, mitin: d.mitin,
    inicioTurno: d.inicioTurno, pasivas: d.pasivas, frase: d.frase, escena: d.escena, icono: d.icono, arquetipos: d.arquetipos,
    texto: d.texto ?? partes.join(' '), unica: d.unica, claves: d.unica ? ['unica'] : undefined, pareja: d.pareja,
  };
}

export interface DefEntrenador {
  num: number;
  nombre: string;
  clase: CartaEntrenador['clase'];
  efectos?: Efecto[];
  requisito?: Cond;
  pasivas?: Pasiva[];
  duracion?: number;
  disparo?: DisparoManiobra;
  filtroHerramienta?: FiltroPol;
  inicioTurno?: Efecto[];
  rareza: Rareza;
  persona?: string;
  cargo?: string;
  frase?: string;
  escena: string;
  icono: string;
  noticia?: boolean;
  unica?: boolean;
  arquetipos?: string[];
  claves?: Clave[];
  texto?: string;
  pareja?: string;
}

const DISPARO_TXT: Record<DisparoManiobra, string> = {
  alAtacar: 'Cuando el rival ataque', alJugarAsesor: 'Cuando el rival juegue un Asesor', alJugarRecurso: 'Cuando el rival juegue un Recurso',
  alBajarPolitico: 'Cuando el rival baje un político', alDerribo: 'Cuando derriben a uno de tus políticos', alAscender: 'Cuando el rival ascienda a un político',
};

export function entrenador(col: Coleccion, d: DefEntrenador): CartaEntrenador {
  const partes: string[] = [];
  if (d.clase === 'maniobra' && d.disparo) partes.push(`${DISPARO_TXT[d.disparo]}: ${efectosTxt(d.efectos ?? [], false)}.`);
  else if (d.efectos?.length) partes.push(efectosTxt(d.efectos));
  if (d.inicioTurno?.length) partes.push(`Al empezar cada turno, el jugador en turno: ${efectosTxt(d.inicioTurno, false)}.`);
  for (const p of d.pasivas ?? []) partes.push(pasivaTxt(p).replace(/^Este político/, 'El político que la lleve'));
  if (d.duracion) partes.push(`Dura ${d.duracion} turnos.`);
  if (d.requisito) partes.unshift(`Solo si ${requisitoTxt(d.requisito)}.`);
  const claves = new Set<Clave>(d.claves ?? []);
  if (d.unica) claves.add('unica');
  if (d.requisito?.c === 'combo') claves.add('combo');
  return {
    id: idCarta(col, d.num), num: d.num, coleccion: col, nombre: d.nombre, clase: d.clase, efectos: d.efectos, requisito: d.requisito,
    pasivas: d.pasivas, duracion: d.duracion, disparo: d.disparo, filtroHerramienta: d.filtroHerramienta, inicioTurno: d.inicioTurno,
    rareza: d.rareza, persona: d.persona, cargo: d.cargo, frase: d.frase, escena: d.escena, icono: d.icono, noticia: d.noticia,
    unica: d.unica, arquetipos: d.arquetipos, claves: [...claves], texto: d.texto ?? partes.join(' '), pareja: d.pareja,
  };
}

const requisitoTxt = (c: Cond) => condTxt(c);

// ————————————————————————————————————— atajos de efectos
export const E = {
  mas: (n: number): Efecto => ({ e: 'masDano', n }),
  masPor: (n: number, por: Extract<Efecto, { e: 'masDanoPor' }>['por'], max?: number): Efecto => ({ e: 'masDanoPor', n, por, max }),
  dano: (n: number, a: Extract<Efecto, { e: 'dano' }>['a']): Efecto => ({ e: 'dano', n, a }),
  bulo: (n: number, a: Extract<Efecto, { e: 'bulo' }>['a']): Efecto => ({ e: 'bulo', n, a }),
  cura: (n: number | 'todo', a: Extract<Efecto, { e: 'curar' }>['a'] = 'fuente'): Efecto => ({ e: 'curar', n, a }),
  estado: (estado: Extract<Efecto, { e: 'estado' }>['estado'], a: Extract<Efecto, { e: 'estado' }>['a'] = 'defensor'): Efecto => ({ e: 'estado', estado, a }),
  moneda: (cara: Efecto[], cruz?: Efecto[]): Efecto => ({ e: 'moneda', cara, cruz }),
  monedas: (n: number, porCara: Efecto[]): Efecto => ({ e: 'monedas', n, porCara }),
  hastaCruz: (porCara: Efecto[]): Efecto => ({ e: 'hastaCruz', porCara }),
  si: (cond: Cond, entonces: Efecto[], sino?: Efecto[]): Efecto => ({ e: 'si', cond, entonces, sino }),
  robar: (n: number, quien?: 'yo' | 'rival' | 'ambos'): Efecto => ({ e: 'robar', n, quien }),
  /** el Clima empeora sin pasar de Guerra sucia (2); para arriesgar una Ruptura, minimo 1 */
  clima: (n: number, minimo = 2): Efecto => ({ e: 'clima', n, minimo: n < 0 ? minimo : undefined }),
  apoyo: (n = 1): Efecto => ({ e: 'apoyo', n }),
  voto: (tipo: Tipo | 'zona', a: Extract<Efecto, { e: 'adjuntarVoto' }>['a'] = 'fuente', n = 1): Efecto => ({ e: 'adjuntarVoto', tipo, n, a }),
  quitarVoto: (n: number | 'todos' = 1, a: Extract<Efecto, { e: 'descartarVoto' }>['a'] = 'defensor'): Efecto => ({ e: 'descartarVoto', n, a }),
  temporal: (t: Extract<Efecto, { e: 'temporal' }>['t'], a: Extract<Efecto, { e: 'temporal' }>['a'], dura: 'turnoRival' | 'esteTurno', n?: number): Efecto => ({ e: 'temporal', t, a, n, dura }),
  fallar: (): Efecto => ({ e: 'fallar' }),
  autodano: (n: number): Efecto => ({ e: 'autodano', n }),
};
