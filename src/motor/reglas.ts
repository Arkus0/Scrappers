// Consultas puras sobre la partida: qué hay en juego, qué modificadores aplican, qué acciones son legales.
import { carta, esEntrenador, esPolitico, esTertuliano, POR_NOMBRE } from '../datos/catalogo';
import { BLOQUE_DE_TIPO } from '../datos/partidos';
import type {
  AccionJuego, Carta, CartaEntrenador, CartaPolitico, CartaTertuliano, Cond, Contador, Ctx, EnJuego, FiltroCarta, FiltroPol, Jug,
  Partida, Pasiva, Tipo, Uid,
} from './tipos';
import { OTRO } from './tipos';

export const MAX_BANQUILLO = 3;
export const MAX_PLATO = 2;
export const MAX_MANIOBRAS = 2;
export const MAX_MANO = 10;
export const PUNTOS_VICTORIA = 3;
export const ESCANOS_POR_PUNTO = 59;
export const RONDAS_MAX = 30;
export const DANO_DEBILIDAD = 20;
export const DANO_SIN_FONDOS = 30;
export const CLIMA_INICIAL = 4;
export const APOYOS_INVESTIDURA = 6;
export const PARTIDOS_INVESTIDURA = 4;

export const NOMBRES_CLIMA: Record<number, string> = { 5: 'Sereno', 4: 'Tenso', 3: 'Bronco', 2: 'Guerra sucia', 1: 'Ruptura' };
export const escanos = (puntos: number) => Math.min(176, puntos * ESCANOS_POR_PUNTO);

// ————————————————————————————————————— cartas y ubicación
export const idDe = (e: Pick<Partida, 'cartaDe'>, uid: Uid): string => {
  const id = e.cartaDe[uid];
  if (id === undefined) throw new Error(`uid sin carta: ${uid}`);
  return id;
};
export const esShiny = (e: Pick<Partida, 'cartaDe'>, uid: Uid) => !!e.cartaDe[uid]?.endsWith('*');
export const cartaUid = (e: Pick<Partida, 'cartaDe'>, uid: Uid): Carta => carta(idDe(e, uid));
export function polUid(e: Pick<Partida, 'cartaDe'>, uid: Uid): CartaPolitico {
  const c = cartaUid(e, uid);
  if (!esPolitico(c)) throw new Error(`${c.nombre} no es un político`);
  return c;
}
export const conocida = (e: Pick<Partida, 'cartaDe'>, uid: Uid) => e.cartaDe[uid] !== undefined;

export function enJuego(e: Partida, j: Jug): EnJuego[] {
  const p = e.jugadores[j];
  return p.tribuna ? [p.tribuna, ...p.banquillo] : [...p.banquillo];
}

export function ubicar(e: Partida, uid: Uid): { jug: Jug; ej: EnJuego; tribuna: boolean } | null {
  for (const j of [0, 1] as Jug[]) {
    const p = e.jugadores[j];
    if (p.tribuna?.uid === uid) return { jug: j, ej: p.tribuna, tribuna: true };
    const b = p.banquillo.find((x) => x.uid === uid);
    if (b) return { jug: j, ej: b, tribuna: false };
  }
  return null;
}

export function tiposDe(c: CartaPolitico): Tipo[] {
  return c.tipo2 ? [c.tipo, c.tipo2] : [c.tipo];
}

export function cumpleFiltroPol(e: Partida, uid: Uid, f?: FiltroPol): boolean {
  if (!f) return true;
  const c = polUid(e, uid);
  if (f.tipo && !tiposDe(c).some((t) => f.tipo!.includes(t))) return false;
  if (f.partido && !f.partido.includes(c.partido)) return false;
  if (f.fase && !f.fase.includes(c.fase)) return false;
  if (f.cl !== undefined && !!c.cl !== f.cl) return false;
  if (f.bloque && !tiposDe(c).some((t) => f.bloque!.includes(BLOQUE_DE_TIPO[t]))) return false;
  if (f.nombre && !f.nombre.includes(c.nombre)) return false;
  if (f.danado !== undefined) {
    const u = ubicar(e, uid);
    if (!u || (u.ej.dano > 0) !== f.danado) return false;
  }
  return true;
}

export function cumpleFiltroCarta(e: Partida, j: Jug, c: Carta, f: FiltroCarta): boolean {
  if (f.clase && !f.clase.includes(c.clase)) return false;
  if (f.noticia !== undefined && !!c.noticia !== f.noticia) return false;
  if (f.nombre && !f.nombre.includes(c.nombre)) return false;
  if (f.fase || f.tipo || f.partido || f.asciendeDeEnJuego) {
    if (!esPolitico(c)) return false;
    if (f.fase && !f.fase.includes(c.fase)) return false;
    if (f.tipo && !tiposDe(c).some((t) => f.tipo!.includes(t))) return false;
    if (f.partido && !f.partido.includes(c.partido)) return false;
    if (f.asciendeDeEnJuego && !enJuego(e, j).some((x) => polUid(e, x.uid).nombre === c.de)) return false;
  }
  return true;
}

// ————————————————————————————————————— contadores y condiciones
/** Político de referencia del contexto (el que ataca o el que usa su Carisma), si sigue en juego. */
export function fuenteDe(e: Partida, ctx: Ctx): { jug: Jug; ej: EnJuego; tribuna: boolean } | null {
  return ctx.fuente !== undefined ? ubicar(e, ctx.fuente) : null;
}

export function defensorDe(e: Partida, ctx: Ctx): EnJuego | null {
  return e.jugadores[OTRO(ctx.yo)].tribuna;
}

export function contar(e: Partida, por: Contador, ctx: Ctx): number {
  const yo = ctx.yo;
  const rv = OTRO(yo);
  const f = fuenteDe(e, ctx);
  const def = defensorDe(e, ctx);
  const mios = enJuego(e, yo);
  switch (por) {
    case 'votosDefensor': return def ? def.votos.length : 0;
    case 'votosAtacante': return f ? f.ej.votos.length : 0;
    case 'votosExtra': {
      if (!f || !e.ataque) return 0;
      const acc = polUid(e, f.ej.uid).acciones[e.ataque.i];
      return Math.max(0, f.ej.votos.length - (acc?.coste.length ?? 0));
    }
    case 'aliadosPartido': {
      if (!f) return 0;
      const par = polUid(e, f.ej.uid).partido;
      return mios.filter((x) => x.uid !== f.ej.uid && polUid(e, x.uid).partido === par).length;
    }
    case 'aliadosTipo': {
      if (!f) return 0;
      const ts = tiposDe(polUid(e, f.ej.uid));
      return mios.filter((x) => x.uid !== f.ej.uid && tiposDe(polUid(e, x.uid)).some((t) => ts.includes(t))).length;
    }
    case 'aliados': return mios.filter((x) => x.uid !== ctx.fuente).length;
    case 'banquilloPropio': return e.jugadores[yo].banquillo.length;
    case 'banquilloRival': return e.jugadores[rv].banquillo.length;
    case 'contadoresPropios': return f ? Math.floor(f.ej.dano / 10) : 0;
    case 'contadoresDefensor': return def ? Math.floor(def.dano / 10) : 0;
    case 'manoRival': return e.jugadores[rv].mano.length;
    case 'manoPropia': return e.jugadores[yo].mano.length;
    case 'apoyos': return e.jugadores[yo].apoyos.length;
    case 'tertulianosPropios': return e.jugadores[yo].plato.length;
    case 'jugadasTurno': return e.flags.jugadas;
    case 'puntosRival': return e.jugadores[rv].puntos;
    case 'puntosPropios': return e.jugadores[yo].puntos;
    case 'descartePropio': return e.jugadores[yo].descarte.length;
    case 'crispacion': return 5 - e.clima;
    case 'tiposEnJuego': return new Set(mios.flatMap((x) => tiposDe(polUid(e, x.uid)))).size;
    case 'estadosDefensor': return def ? Object.keys(def.estados).length : 0;
    case 'danadosRivales': return enJuego(e, rv).filter((x) => x.dano > 0).length;
    case 'mazoRivalVacio': return e.jugadores[rv].mazo.length === 0 ? 1 : 0;
    case 'entrenadoresDescarte':
      return e.jugadores[yo].descarte.filter((u) => conocida(e, u) && esEntrenador(cartaUid(e, u))).length;
  }
}

export function cumpleCond(e: Partida, cond: Cond, ctx: Ctx): boolean {
  const yo = ctx.yo;
  const rv = OTRO(yo);
  const def = defensorDe(e, ctx);
  const f = fuenteDe(e, ctx);
  switch (cond.c) {
    case 'climaMax': return e.clima <= cond.n;
    case 'climaMin': return e.clima >= cond.n;
    case 'defensorDanado': return !!def && def.dano > 0;
    case 'defensorTipo': return !!def && tiposDe(polUid(e, def.uid)).some((t) => cond.tipo.includes(t));
    case 'defensorCL': return !!def && !!polUid(e, def.uid).cl;
    case 'defensorEstado': return !!def && Object.keys(def.estados).length > 0;
    case 'defensorBasico': return !!def && polUid(e, def.uid).fase === 'basico';
    case 'fuenteDanada': return !!f && f.ej.dano > 0;
    case 'voyPerdiendo': return e.jugadores[yo].puntos < e.jugadores[rv].puntos;
    case 'combo': {
      const necesarias = (cond.n ?? 1) + (ctx.deMano ? 1 : 0);
      return e.flags.jugadas >= necesarias;
    }
    case 'coalicion': return contar(e, 'tiposEnJuego', ctx) >= cond.n;
    case 'granCoalicion': {
      const bloques = new Set(enJuego(e, yo).flatMap((x) => tiposDe(polUid(e, x.uid)).map((t) => BLOQUE_DE_TIPO[t])));
      return bloques.has('progresista') && bloques.has('conservador');
    }
    case 'aliadosPartido': return contar(e, 'aliadosPartido', ctx) >= cond.n;
    case 'aliadosTipo': return enJuego(e, yo).filter((x) => x.uid !== ctx.fuente && tiposDe(polUid(e, x.uid)).includes(cond.tipo)).length >= cond.n;
    case 'tengoTertuliano':
      return e.jugadores[yo].plato.some((t) => !cond.presentador || (carta(idDe(e, t.uid)) as CartaTertuliano).presentador);
    case 'hayEscenario': return !!e.escenario;
    case 'banquilloRivalMin': return e.jugadores[rv].banquillo.length >= cond.n;
    case 'banquilloPropioMin': return e.jugadores[yo].banquillo.length >= cond.n;
    case 'manoRivalMin': return e.jugadores[rv].mano.length >= cond.n;
    case 'manoPropiaMax': return e.jugadores[yo].mano.length <= cond.n;
    case 'apoyosMin': {
      const a = e.jugadores[yo].apoyos;
      return a.length >= cond.n && new Set(a).size >= (cond.partidos ?? 0);
    }
    case 'mazoRivalMax': return e.jugadores[rv].mazo.length <= cond.n;
    case 'mazoPropioMin': return e.jugadores[yo].mazo.length >= cond.n;
    case 'votosFuenteMin': return !!f && f.ej.votos.length >= cond.n;
    case 'mazoSinRepetidas': {
      const nombres = e.jugadores[yo].lista.map((id) => carta(id).nombre);
      return new Set(nombres).size === nombres.length;
    }
    case 'tribunaPropiaDanada': return (e.jugadores[yo].tribuna?.dano ?? 0) > 0;
    case 'rivalTieneManiobra': return e.jugadores[rv].maniobras.length > 0;
    case 'no': return !cumpleCond(e, cond.cond, ctx);
    case 'y': return cond.conds.every((x) => cumpleCond(e, x, ctx));
  }
}

// ————————————————————————————————————— modificadores continuos
export interface Mods {
  dano: number;
  defensa: number;
  aguante: number;
  relevo: number;
  inmuneEstados: boolean;
  curacion: number;
  sinDebilidad: boolean;
  costeIncoloro: number;
}

/** Leyendas: si su condición de mazo no se cumple, su Carisma está apagada. */
export function leyendaActiva(e: Partida, c: Carta, jug: Jug): boolean {
  return !c.leyenda || cumpleCond(e, c.leyenda, { yo: jug, origen: 'carisma' });
}

interface FuentePasiva {
  pasivas: Pasiva[];
  dueno: Jug;
  /** político que la da (si es un político) */
  uid: Uid | null;
  enTribuna: boolean;
  /** político al que va unida (herramientas) */
  portador?: Uid;
}

function fuentesPasivas(e: Partida): FuentePasiva[] {
  const r: FuentePasiva[] = [];
  for (const j of [0, 1] as Jug[]) {
    const p = e.jugadores[j];
    for (const ej of enJuego(e, j)) {
      if (!conocida(e, ej.uid)) continue; // en una vista, las candidaturas rivales aún sin descubrir
      const c = polUid(e, ej.uid);
      if (c.carisma?.pasivas && leyendaActiva(e, c, j)) r.push({ pasivas: c.carisma.pasivas, dueno: j, uid: ej.uid, enTribuna: p.tribuna === ej });
      if (ej.herramienta !== null) {
        const h = cartaUid(e, ej.herramienta) as CartaEntrenador;
        if (h.pasivas) r.push({ pasivas: h.pasivas, dueno: j, uid: null, enTribuna: false, portador: ej.uid });
      }
    }
    for (const t of p.plato) {
      const c = cartaUid(e, t.uid) as CartaTertuliano;
      if (c.pasivas) r.push({ pasivas: c.pasivas, dueno: j, uid: null, enTribuna: false });
    }
  }
  if (e.escenario) {
    const c = cartaUid(e, e.escenario.uid) as CartaEntrenador;
    if (c.pasivas) r.push({ pasivas: c.pasivas, dueno: e.escenario.dueno, uid: null, enTribuna: false });
  }
  return r;
}

function afecta(e: Partida, f: FuentePasiva, pas: Pasiva, uid: Uid, jug: Jug, enTribuna: boolean): boolean {
  if (pas.soloTribuna && f.uid !== null && !f.enTribuna) return false;
  switch (pas.ambito) {
    case 'este': if ((f.portador ?? f.uid) !== uid) return false; break;
    case 'aliados': if (jug !== f.dueno) return false; break;
    case 'aliadosBanquillo': if (jug !== f.dueno || enTribuna) return false; break;
    case 'rivales': if (jug === f.dueno) return false; break;
    case 'todos': break;
    case 'tribunaPropia': if (jug !== f.dueno || !enTribuna) return false; break;
    case 'tribunaRival': if (jug === f.dueno || !enTribuna) return false; break;
  }
  if (!cumpleFiltroPol(e, uid, pas.filtro)) return false;
  const ctx: Ctx = { yo: f.dueno, fuente: f.portador ?? f.uid ?? undefined, origen: 'carisma' };
  if (pas.cond && !cumpleCond(e, pas.cond, ctx)) return false;
  return true;
}

/** Modificadores de un político. `contra`: el defensor, para las pasivas de daño que solo valen contra ciertos rivales. */
export function modificadores(e: Partida, uid: Uid, contra?: Uid): Mods {
  const m: Mods = { dano: 0, defensa: 0, aguante: 0, relevo: 0, inmuneEstados: false, curacion: 0, sinDebilidad: false, costeIncoloro: 0 };
  const u = ubicar(e, uid);
  if (!u) return m;
  for (const f of fuentesPasivas(e)) {
    for (const pas of f.pasivas) {
      if (!afecta(e, f, pas, uid, u.jug, u.tribuna)) continue;
      if (pas.contra && (contra === undefined || !cumpleFiltroPol(e, contra, pas.contra))) continue;
      const ctx: Ctx = { yo: f.dueno, fuente: f.portador ?? f.uid ?? undefined, origen: 'carisma' };
      const n = (pas.n ?? 0) * (pas.por ? contar(e, pas.por, ctx) : 1);
      switch (pas.p) {
        case 'dano': m.dano += n; break;
        case 'defensa': m.defensa += n; break;
        case 'aguante': m.aguante += n; break;
        case 'relevo': m.relevo += n; break;
        case 'curacion': m.curacion += n; break;
        case 'costeIncoloro': m.costeIncoloro += n; break;
        case 'inmuneEstados': m.inmuneEstados = true; break;
        case 'sinDebilidad': m.sinDebilidad = true; break;
      }
    }
  }
  for (const t of e.temporales) {
    const aplica = t.uid === uid || (t.uid === null && t.jug === u.jug);
    if (!aplica) continue;
    if (t.t === 'bonoDano') m.dano += t.n;
    if (t.t === 'reducir') m.defensa += t.n;
  }
  return m;
}

export function aguanteMax(e: Partida, ej: EnJuego): number {
  return polUid(e, ej.uid).aguante + modificadores(e, ej.uid).aguante;
}

export function tieneTemporal(e: Partida, t: TemporalTipo, uid: Uid | null, jug: Jug): boolean {
  return e.temporales.some((x) => x.t === t && (x.uid === uid || (uid === null && x.uid === null)) && x.jug === jug);
}
type TemporalTipo = Partida['temporales'][number]['t'];

export function protegido(e: Partida, uid: Uid): boolean {
  return e.temporales.some((x) => x.t === 'proteger' && x.uid === uid);
}

// ————————————————————————————————————— costes
/** ¿Pagan estos votos el coste? El incoloro vale con cualquier voto; `rebaja` quita votos incoloros del coste. */
export function pagable(votos: Tipo[], coste: Tipo[], rebaja = 0): boolean {
  const resto = [...votos];
  let incoloros = 0;
  for (const t of coste) {
    if (t === 'incoloro') { incoloros++; continue; }
    const i = resto.indexOf(t);
    if (i < 0) return false;
    resto.splice(i, 1);
  }
  return resto.length >= Math.max(0, incoloros - rebaja);
}

export function costeRelevo(e: Partida, ej: EnJuego): number {
  return Math.max(0, polUid(e, ej.uid).relevo + modificadores(e, ej.uid).relevo);
}

// ————————————————————————————————————— acciones legales
export const clave = (a: AccionJuego): string => {
  switch (a.a) {
    case 'bajar': return `bajar:${a.carta}`;
    case 'ascender': return `ascender:${a.carta}>${a.sobre}`;
    case 'voto': return `voto:${a.sobre}`;
    case 'entrenador': return `entrenador:${a.carta}`;
    case 'herramienta': return `herramienta:${a.carta}>${a.sobre}`;
    case 'tertuliano': return `tertuliano:${a.carta}`;
    case 'carisma': return `carisma:${a.sobre}`;
    case 'relevo': return `relevo:${a.a2}`;
    case 'atacar': return `atacar:${a.i}`;
    case 'pasar': return 'pasar';
  }
};

export function puedeAtacarCon(e: Partida, ej: EnJuego): boolean {
  if (ej.estados.desconectado || ej.estados.bloqueado) return false;
  return !e.temporales.some((x) => x.t === 'noAtacar' && x.uid === ej.uid);
}

export function accionesPagables(e: Partida, ej: EnJuego): number[] {
  const c = polUid(e, ej.uid);
  const rebaja = modificadores(e, ej.uid).costeIncoloro;
  return c.acciones.map((a, i) => (pagable(ej.votos, a.coste, rebaja) ? i : -1)).filter((i) => i >= 0);
}

/** Primer turno de cada jugador (no se asciende). */
export const primerTurnoDe = (e: Partida, j: Jug) => (j === e.primero ? e.turno <= 1 : e.turno <= 2);

export function carismaUsable(e: Partida, j: Jug, ej: EnJuego, enTribuna: boolean): boolean {
  const c = polUid(e, ej.uid);
  const k = c.carisma;
  if (!k || k.disparo !== 'activado' || ej.carismaUsada) return false;
  if (!enTribuna && !c.claves?.includes('portavoz')) return false;
  if (!leyendaActiva(e, c, j)) return false;
  if (k.descartaVotos && ej.votos.length < k.descartaVotos) return false;
  if (k.requisito && !cumpleCond(e, k.requisito, { yo: j, fuente: ej.uid, origen: 'carisma' })) return false;
  return true;
}

export function entrenadorJugable(e: Partida, j: Jug, c: CartaEntrenador, uid: Uid): boolean {
  const ctx: Ctx = { yo: j, carta: uid, origen: 'entrenador' };
  const p = e.jugadores[j];
  if (c.requisito && !cumpleCond(e, c.requisito, ctx)) return false;
  switch (c.clase) {
    case 'asesor':
      return !e.flags.asesor && !e.temporales.some((x) => x.t === 'sinAsesor' && x.uid === null && x.jug === j);
    case 'recurso':
      if (e.temporales.some((x) => x.t === 'sinRecursos' && x.uid === null && x.jug === j)) return false;
      if (c.efectos?.some((x) => x.e === 'dedazo')) return opcionesDedazo(e, j).length > 0;
      return true;
    case 'escenario':
      return !e.flags.escenario && (!e.escenario || cartaUid(e, e.escenario.uid).nombre !== c.nombre);
    case 'maniobra':
      return p.maniobras.length < MAX_MANIOBRAS && !p.maniobras.some((u) => cartaUid(e, u).nombre === c.nombre);
    case 'herramienta':
      return false; // se juegan con la acción «herramienta»
  }
}

/** Parejas (Fase 2 en mano, Básico en juego) para «El dedazo». */
export function opcionesDedazo(e: Partida, j: Jug): { carta: Uid; sobre: Uid }[] {
  if (primerTurnoDe(e, j)) return [];
  const r: { carta: Uid; sobre: Uid }[] = [];
  const p = e.jugadores[j];
  for (const u of p.mano) {
    const c = cartaUid(e, u);
    if (!esPolitico(c) || c.fase !== 'fase2' || !c.de) continue;
    const intermedias = (POR_NOMBRE[c.de] ?? []).filter(esPolitico).map((x) => x.de);
    for (const ej of enJuego(e, j)) {
      const b = polUid(e, ej.uid);
      if (b.fase === 'basico' && intermedias.includes(b.nombre) && ej.entroTurno < e.turno) r.push({ carta: u, sobre: ej.uid });
    }
  }
  return r;
}

export function accionesLegales(e: Partida, j: Jug): AccionJuego[] {
  const p = e.jugadores[j];
  const r: AccionJuego[] = [];
  const mios = enJuego(e, j);
  const primer = primerTurnoDe(e, j);
  for (const u of p.mano) {
    const c = cartaUid(e, u);
    if (esPolitico(c)) {
      if (c.fase === 'basico') {
        if (p.banquillo.length < MAX_BANQUILLO) r.push({ a: 'bajar', carta: u });
      } else if (!primer) {
        for (const ej of mios) {
          if (polUid(e, ej.uid).nombre === c.de && ej.entroTurno < e.turno && ej.ascendioTurno < e.turno) r.push({ a: 'ascender', carta: u, sobre: ej.uid });
        }
      }
    } else if (esTertuliano(c)) {
      const presentadores = p.plato.filter((t) => (cartaUid(e, t.uid) as CartaTertuliano).presentador).length;
      if (p.plato.length < MAX_PLATO && !(c.presentador && presentadores > 0) && !p.plato.some((t) => cartaUid(e, t.uid).nombre === c.nombre)) {
        r.push({ a: 'tertuliano', carta: u });
      }
    } else if (c.clase === 'herramienta') {
      for (const ej of mios) if (ej.herramienta === null && cumpleFiltroPol(e, ej.uid, c.filtroHerramienta)) r.push({ a: 'herramienta', carta: u, sobre: ej.uid });
    } else if (entrenadorJugable(e, j, c, u)) {
      r.push({ a: 'entrenador', carta: u });
    }
  }
  if (p.votoActual && !e.flags.voto) for (const ej of mios) r.push({ a: 'voto', sobre: ej.uid });
  for (const ej of mios) if (carismaUsable(e, j, ej, ej === p.tribuna)) r.push({ a: 'carisma', sobre: ej.uid });
  const t = p.tribuna;
  if (t) {
    const puedeRelevo = !e.flags.relevo && !t.estados.desconectado && !t.estados.bloqueado
      && !e.temporales.some((x) => x.t === 'noRetirarse' && x.uid === t.uid) && t.votos.length >= costeRelevo(e, t);
    if (puedeRelevo) for (const b of p.banquillo) r.push({ a: 'relevo', a2: b.uid });
    if (!(e.turno === 1 && j === e.primero) && puedeAtacarCon(e, t)) for (const i of accionesPagables(e, t)) r.push({ a: 'atacar', i });
  }
  r.push({ a: 'pasar' });
  return r;
}
