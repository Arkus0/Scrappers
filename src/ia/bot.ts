// IA de «176 TCG». Recibe siempre una vista (no ve la mano del rival ni el orden de los mazos):
// rellena lo oculto con cartas verosímiles (determinización), simula cada jugada y valora el resultado.
import { CARTAS_JUGABLES, carta, esEntrenador, esPolitico } from '../datos/catalogo';
import { clonar, responder } from '../motor/motor';
import {
  accionesLegales, aguanteMax, cartaUid, conocida, costeRelevo, enJuego, opcionesDedazo, polUid, ubicar,
} from '../motor/reglas';
import { aleatorio, barajar } from '../motor/rng';
import type { AccionJuego, Decision, Jug, Partida, Respuesta, Tipo, Uid, Vista } from '../motor/tipos';
import { OTRO } from '../motor/tipos';
import { faltan, mejorDano, valorar } from './evaluar';

export type Nivel = 'novato' | 'normal' | 'experto';

interface Ctx {
  nivel: Nivel;
  rng: { rng: number };
}

export function decidirIA(v: Vista, nivel: Nivel = 'normal', semilla = (Math.random() * 2 ** 31) | 0): Respuesta {
  const d = v.pendiente;
  if (!d || d.tipo === 'espera') throw new Error('La IA no tiene nada que decidir');
  const ctx: Ctx = { nivel, rng: { rng: semilla } };
  const yo = v.yo;
  if (nivel === 'novato') return politicaRapida(determinizar(v, ctx), d, ctx, 0.25);
  const k = nivel === 'experto' ? 4 : 1;
  const opciones = candidatas(determinizar(v, ctx), d);
  if (opciones.length <= 1) return opciones[0] ?? politicaRapida(determinizar(v, ctx), d, ctx);
  const suma = new Array(opciones.length).fill(0);
  const inicio = Date.now();
  for (let i = 0; i < k; i++) {
    const base = determinizar(v, ctx);
    opciones.forEach((r, j) => { suma[j] += simular(base, r, yo, ctx); });
    if (Date.now() - inicio > 900) break;
  }
  let mejor = 0;
  for (let j = 1; j < opciones.length; j++) if (suma[j] > suma[mejor]) mejor = j;
  return opciones[mejor];
}

// ————————————————————————————————————— determinización
function poolRival(tipos: Tipo[]): string[] {
  return CARTAS_JUGABLES.filter((c) => (esPolitico(c) ? tipos.includes(c.tipo) || c.tipo === 'incoloro' : c.clase !== 'maniobra')).map((c) => c.id);
}
const MANIOBRAS = () => CARTAS_JUGABLES.filter((c) => c.clase === 'maniobra').map((c) => c.id);

/** De una vista a una partida completa verosímil. */
export function determinizar(v: Vista, ctx: Ctx): Partida {
  const e = structuredClone(v) as unknown as Partida & { yo?: Jug };
  const yo = v.yo;
  delete e.yo;
  e.rng = (aleatorio(ctx.rng) * 2 ** 31) | 0;
  e.silencio = true;
  e.registro = [];
  e.sucesos = [];
  const nuevo = (id: string) => { const u = e.sigUid++; e.cartaDe[u] = id; return u; };
  // mi mazo: mi lista menos lo que ya se ha visto
  const p = e.jugadores[yo];
  const vistos: string[] = [];
  const anotar = (u: Uid | null | undefined) => { if (u != null && conocida(e, u)) vistos.push(e.cartaDe[u].replace(/\*$/, '')); };
  for (const ej of enJuego(e, yo)) { anotar(ej.uid); ej.debajo.forEach(anotar); anotar(ej.herramienta); }
  [...p.mano, ...p.descarte, ...p.maniobras, ...p.plato.map((x) => x.uid)].forEach(anotar);
  if (e.escenario && e.escenario.dueno === yo) anotar(e.escenario.uid);
  const resto = [...p.lista];
  for (const id of vistos) { const i = resto.indexOf(id); if (i >= 0) resto.splice(i, 1); }
  barajar(ctx.rng, resto);
  // las cartas del mazo que salen en mi decisión (buscar) se respetan
  const conocidasMazo = Object.keys(v.pendiente?.tipo === 'cartas' ? v.pendiente.visibles : {}).map(Number).filter((u) => !p.mano.includes(u));
  const nMazo = p.mazo.length;
  const mazo: Uid[] = [];
  for (const u of conocidasMazo) { if (mazo.length < nMazo) { mazo.push(u); const i = resto.indexOf(e.cartaDe[u]?.replace(/\*$/, '')); if (i >= 0) resto.splice(i, 1); } }
  while (mazo.length < nMazo) mazo.push(nuevo(resto.pop() ?? p.lista[Math.floor(aleatorio(ctx.rng) * p.lista.length)]));
  p.mazo = barajar(ctx.rng, mazo);
  // el rival: mano, mazo y maniobras con cartas de sus tipos
  const r = e.jugadores[OTRO(yo)];
  const pool = poolRival(r.tipos);
  const azar = (lista: string[]) => lista[Math.floor(aleatorio(ctx.rng) * lista.length)];
  r.mano = r.mano.map((u) => (conocida(e, u) ? u : nuevo(azar(pool))));
  r.mazo = r.mazo.map(() => nuevo(azar(pool)));
  const man = MANIOBRAS();
  r.maniobras = r.maniobras.map((u) => (conocida(e, u) ? u : nuevo(man.length ? azar(man) : azar(pool))));
  for (const ej of enJuego(e, OTRO(yo))) if (!conocida(e, ej.uid)) e.cartaDe[ej.uid] = azar(pool.filter((id) => { const c = carta(id); return esPolitico(c) && c.fase === 'basico'; }));
  return e;
}

// ————————————————————————————————————— simulación
function candidatas(e: Partida, d: Decision): Respuesta[] {
  switch (d.tipo) {
    case 'accion': return d.acciones.map((a) => ({ tipo: 'accion', accion: a }));
    case 'objetivo': return d.max === 1 ? d.opciones.map((u) => ({ tipo: 'objetivo', uids: [u] })) : [politicaRapida(e, d, { nivel: 'normal', rng: { rng: 1 } })];
    case 'opcion': return d.opciones.map((_, i) => ({ tipo: 'opcion', i }));
    case 'cartas': {
      if (d.max === 1 && d.opciones.length <= 8) {
        const r: Respuesta[] = d.opciones.map((u) => ({ tipo: 'cartas', uids: [u] }));
        if (d.min === 0) r.push({ tipo: 'cartas', uids: [] });
        return r;
      }
      return [politicaRapida(e, d, { nivel: 'normal', rng: { rng: 1 } })];
    }
    case 'espera': return [];
  }
}

function simular(base: Partida, r: Respuesta, yo: Jug, ctx: Ctx): number {
  const e = clonar(base);
  try {
    responder(e, r);
  } catch {
    return -1e9;
  }
  const turno = e.turno;
  // termina mi turno con la política rápida (la valoración ya mide lo que puede hacer el rival después)
  const hastaTurno = turno + (e.enTurno === yo ? 1 : 0);
  let pasos = 0;
  while (e.pendiente && !e.ganador && e.turno < hastaTurno && pasos++ < 120) {
    const d = e.pendiente;
    if (d.tipo === 'espera') break;
    responder(e, ctx.nivel === 'experto' && d.tipo === 'accion' && d.jugador === yo ? politicaVoraz(e, d, ctx) : politicaRapida(e, d, ctx));
  }
  return valorar(e, yo);
}

/** Elige la acción que mejor valoración deja justo después (un paso de búsqueda). */
function politicaVoraz(e: Partida, d: Extract<Decision, { tipo: 'accion' }>, ctx: Ctx): Respuesta {
  let mejor: Respuesta = { tipo: 'accion', accion: { a: 'pasar' } };
  let mv = -Infinity;
  for (const a of d.acciones) {
    const c = clonar(e);
    const r: Respuesta = { tipo: 'accion', accion: a };
    try {
      responder(c, r);
      // las subdecisiones de la jugada, con la política rápida
      let n = 0;
      while (c.pendiente && !c.ganador && c.pendiente.tipo !== 'accion' && c.pendiente.tipo !== 'espera' && n++ < 20) responder(c, politicaRapida(c, c.pendiente, ctx));
    } catch {
      continue;
    }
    const v = valorar(c, d.jugador) + (a.a === 'pasar' ? -5 : 0);
    if (v > mv) { mv = v; mejor = r; }
  }
  return mejor;
}

// ————————————————————————————————————— política rápida (también es el nivel novato)
export function politicaRapida(e: Partida, d: Decision, ctx: Ctx, ruido = 0): Respuesta {
  const j = d.jugador;
  switch (d.tipo) {
    case 'accion': {
      let mejor: AccionJuego = { a: 'pasar' };
      let mv = 0;
      for (const a of d.acciones) {
        const v = puntuarAccion(e, j, a) + (ruido ? (aleatorio(ctx.rng) - 0.5) * 60 * ruido * 4 : 0);
        if (v > mv) { mv = v; mejor = a; }
      }
      return { tipo: 'accion', accion: mejor };
    }
    case 'objetivo': {
      const rivales = d.opciones.filter((u) => ubicar(e, u)?.jug !== j);
      const orden = [...d.opciones].sort((a, b) => puntuarObjetivo(e, j, b, d.proposito) - puntuarObjetivo(e, j, a, d.proposito));
      void rivales;
      return { tipo: 'objetivo', uids: orden.slice(0, Math.max(d.min, Math.min(d.max, 1))) };
    }
    case 'cartas': {
      const orden = [...d.opciones].sort((a, b) => valorCarta(e, j, d.visibles[b] ?? e.cartaDe[b], d.proposito) - valorCarta(e, j, d.visibles[a] ?? e.cartaDe[a], d.proposito));
      const n = d.proposito === 'banquilloInicial' ? d.max : Math.max(d.min, Math.min(d.max, d.proposito === 'descartar' ? d.min : d.max));
      return { tipo: 'cartas', uids: orden.slice(0, n) };
    }
    case 'opcion': return { tipo: 'opcion', i: Math.floor(aleatorio(ctx.rng) * d.opciones.length) };
    case 'espera': throw new Error('No es su decisión');
  }
}

function valorCarta(e: Partida, j: Jug, id: string | undefined, proposito: string): number {
  if (!id) return 0;
  const c = carta(id);
  let v = { C: 1, I: 2, R: 3, CL: 5, E: 5, S: 6 }[c.rareza];
  if (esPolitico(c)) {
    v += c.aguante / 20;
    if (proposito === 'tribunaInicial') v += c.aguante / 10 + (c.acciones.some((a) => a.coste.length <= 1) ? 4 : 0);
    if (c.fase !== 'basico' && enJuego(e, j).some((x) => polUid(e, x.uid).nombre === c.de)) v += 6;
    if (c.fase === 'basico' && e.jugadores[j].banquillo.length < 3) v += 3;
  } else if (esEntrenador(c)) {
    v += c.clase === 'asesor' ? 3 : 1;
  }
  return v;
}

function puntuarObjetivo(e: Partida, j: Jug, u: Uid, proposito: string): number {
  const w = ubicar(e, u);
  if (!w) return 0;
  const resto = aguanteMax(e, w.ej) - w.ej.dano;
  if (proposito === 'reemplazo') {
    const t = e.jugadores[OTRO(j)].tribuna;
    return resto + w.ej.votos.length * 25 + (t ? mejorDano(e, w.ej, t, 1) : 0);
  }
  if (w.jug === j) return w.ej.dano + (w.tribuna ? 10 : 0) + w.ej.votos.length * 5; // propios: el más dañado, la tribuna
  return 300 - resto + (polUid(e, u).cl ? 40 : 0) + w.ej.votos.length * 10; // rivales: el más débil
}

function puntuarAccion(e: Partida, j: Jug, a: AccionJuego): number {
  const p = e.jugadores[j];
  const rv = e.jugadores[OTRO(j)];
  const t = p.tribuna;
  switch (a.a) {
    case 'pasar': return 0.5;
    case 'atacar': {
      if (!t || !rv.tribuna) return 1;
      const c = polUid(e, t.uid);
      const acc = c.acciones[a.i];
      const dano = acc.dano;
      const resto = aguanteMax(e, rv.tribuna) - rv.tribuna.dano;
      const otro = c.acciones.reduce((m, x, i) => (i !== a.i ? Math.max(m, x.dano) : m), 0);
      if (dano >= resto && dano > 0) return 500 + dano;
      return 12 + dano / 5 + (dano >= otro ? 2 : 0) + (acc.efectos?.length ? 3 : 0);
    }
    case 'bajar': return p.banquillo.length < 3 ? 60 + cartaUid(e, a.carta).rareza.length : 0;
    case 'ascender': return 85 + (polUid(e, a.carta).fase === 'fase2' ? 15 : 0);
    case 'voto': {
      const w = ubicar(e, a.sobre);
      if (!w) return 0;
      const c = polUid(e, a.sobre);
      const voto = p.votoActual!;
      const antes = Math.min(...c.acciones.map((x) => faltan(w.ej.votos, x.coste)));
      const despues = Math.min(...c.acciones.map((x) => faltan([...w.ej.votos, voto], x.coste)));
      let v = 30 + (antes - despues) * 25 + (w.tribuna ? 12 : 0);
      if (antes === 0) v -= 15; // ya puede atacar
      return v;
    }
    case 'herramienta': return 35 + (ubicar(e, a.sobre)?.tribuna ? 5 : 0);
    case 'tertuliano': return 42;
    case 'carisma': {
      const c = polUid(e, a.sobre);
      if (c.carisma?.descartaVotos && ubicar(e, a.sobre)?.tribuna) return 15;
      return 45;
    }
    case 'relevo': {
      if (!t) return 0;
      const b = p.banquillo.find((x) => x.uid === a.a2);
      if (!b || !rv.tribuna) return 0;
      const restoT = aguanteMax(e, t) - t.dano;
      const restoB = aguanteMax(e, b) - b.dano;
      const puedeT = mejorDano(e, t, rv.tribuna, 0);
      const puedeB = mejorDano(e, b, rv.tribuna, 0);
      const coste = costeRelevo(e, t);
      let v = (puedeB - puedeT) / 3 + (restoB - restoT) / 6 - coste * 12;
      if (Object.keys(t.estados).length) v += 25;
      if (restoT <= 30 && restoB > restoT) v += 20;
      return v;
    }
    case 'entrenador': {
      const c = cartaUid(e, a.carta);
      if (!esEntrenador(c)) return 0;
      if (c.efectos?.some((x) => x.e === 'dedazo')) return opcionesDedazo(e, j).length ? 95 : 0;
      if (c.efectos?.some((x) => x.e === 'investidura')) return 2000;
      switch (c.clase) {
        case 'asesor': return p.mano.length <= 3 ? 55 : 38;
        case 'escenario': return 28;
        case 'maniobra': return 32;
        default: {
          if (c.efectos?.some((x) => x.e === 'cambiarRival')) {
            // la moción solo merece la pena si deja a tiro a alguien del banquillo
            if (!t) return 0;
            const tiro = rv.banquillo.some((b) => mejorDano(e, t, b, p.votoActual ? 1 : 0) >= aguanteMax(e, b) - b.dano);
            return tiro ? 70 : 3;
          }
          if (c.efectos?.some((x) => x.e === 'cambiarPropio')) return t && Object.keys(t.estados).length ? 30 : 4;
          if (c.efectos?.some((x) => x.e === 'curar')) return (t?.dano ?? 0) >= 20 ? 34 : 6;
          return 36;
        }
      }
    }
  }
}

/** Acciones legales, para quien quiera listarlas desde fuera. */
export { accionesLegales };
