// Valoración de una posición desde el punto de vista de un jugador.
import { aguanteMax, cartaUid, enJuego, modificadores, polUid } from '../motor/reglas';
import { calcularDano } from '../motor/motor';
import type { EnJuego, Jug, Partida, Tipo } from '../motor/tipos';
import { OTRO } from '../motor/tipos';

const GANAR = 100000;

/** Votos que faltan para pagar un coste (suponiendo que los que lleguen sean del tipo que haga falta). */
export function faltan(votos: Tipo[], coste: Tipo[], rebaja = 0): number {
  const resto = [...votos];
  let falta = 0;
  let incoloros = 0;
  for (const t of coste) {
    if (t === 'incoloro') { incoloros++; continue; }
    const i = resto.indexOf(t);
    if (i < 0) falta++;
    else resto.splice(i, 1);
  }
  return falta + Math.max(0, incoloros - rebaja - resto.length);
}

/** Mejor daño que puede hacer `at` a `def` con `extra` votos más. */
export function mejorDano(e: Partida, at: EnJuego, def: EnJuego, extra = 0): number {
  const c = polUid(e, at.uid);
  const rebaja = modificadores(e, at.uid).costeIncoloro;
  let mejor = 0;
  for (const a of c.acciones) {
    if (faltan(at.votos, a.coste, rebaja) > extra) continue;
    mejor = Math.max(mejor, calcularDano(e, at.uid, def.uid, a.dano));
  }
  return mejor;
}

function valorPolitico(e: Partida, ej: EnJuego, tribuna: boolean): number {
  const c = polUid(e, ej.uid);
  const max = aguanteMax(e, ej);
  const resto = Math.max(0, max - ej.dano);
  let v = resto * (tribuna ? 1 : 0.85);
  v += ej.votos.length * 18;
  v += c.fase === 'fase2' ? 60 : c.fase === 'fase1' ? 30 : 0;
  if (c.cl) v *= 1.15;
  if (ej.herramienta !== null) v += 15;
  if (tribuna) v -= Object.keys(ej.estados).length * 25;
  return v;
}

export function valorar(e: Partida, yo: Jug): number {
  if (e.ganador) return e.ganador.jug === yo ? GANAR : e.ganador.jug === null ? 0 : -GANAR;
  const rv = OTRO(yo);
  const A = e.jugadores[yo];
  const B = e.jugadores[rv];
  let s = 1200 * (A.puntos - B.puntos);
  for (const ej of enJuego(e, yo)) s += valorPolitico(e, ej, ej === A.tribuna);
  for (const ej of enJuego(e, rv)) s -= valorPolitico(e, ej, ej === B.tribuna);
  s += Math.min(A.mano.length, 8) * 10 - Math.min(B.mano.length, 8) * 5;
  if (A.mazo.length < 3) s -= (3 - A.mazo.length) * 40;
  if (B.mazo.length < 3) s += (3 - B.mazo.length) * 25;
  if (A.banquillo.length === 0) s -= 180;
  if (B.banquillo.length === 0) s += 120;
  s += A.plato.length * 30 - B.plato.length * 30;
  s += A.maniobras.length * 20 - B.maniobras.length * 15;
  // investidura: cada apoyo acerca la victoria alternativa
  const distintosA = new Set(A.apoyos).size;
  const distintosB = new Set(B.apoyos).size;
  s += A.apoyos.length * 30 + distintosA * 40 - B.apoyos.length * 30 - distintosB * 40;
  // amenazas de derribo en la siguiente jugada
  if (A.tribuna && B.tribuna) {
    const ptsB = polUid(e, B.tribuna.uid).cl ? 2 : 1;
    const ptsA = polUid(e, A.tribuna.uid).cl ? 2 : 1;
    const restoB = aguanteMax(e, B.tribuna) - B.tribuna.dano;
    const restoA = aguanteMax(e, A.tribuna) - A.tribuna.dano;
    const yoPuedo = e.enTurno === yo ? mejorDano(e, A.tribuna, B.tribuna, 0) : mejorDano(e, A.tribuna, B.tribuna, 1);
    const elPuede = e.enTurno === rv ? mejorDano(e, B.tribuna, A.tribuna, 0) : mejorDano(e, B.tribuna, A.tribuna, 1);
    if (yoPuedo >= restoB) s += 320 * ptsB;
    if (elPuede >= restoA) s -= 380 * ptsA;
    s += Math.min(yoPuedo, restoB) * 0.8 - Math.min(elPuede, restoA) * 0.8;
  }
  return s;
}

/** Nombre corto para depurar. */
export const nombreUid = (e: Partida, u: number) => cartaUid(e, u).nombre;
