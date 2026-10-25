// Lo que ve cada jugador. Ni la interfaz ni la IA ni el cliente online reciben otra cosa:
// la mano, las maniobras y los mazos del rival, el orden de los mazos y la semilla no salen de aquí.
import type { Jug, Partida, Uid, Vista } from './tipos';
import { OTRO } from './tipos';

export function vistaPara(e: Partida, yo: Jug): Vista {
  const v = structuredClone(e) as unknown as Vista;
  v.yo = yo;
  v.rng = 0;
  const rv = OTRO(yo);
  const ocultos: Uid[] = [];
  for (const j of [0, 1] as Jug[]) {
    const p = v.jugadores[j];
    // los mazos: solo el número de cartas
    ocultos.push(...p.mazo);
    p.mazo = p.mazo.map(() => -1);
  }
  const r = v.jugadores[rv];
  if (!e.jugadores[rv].manoVista) ocultos.push(...r.mano);
  ocultos.push(...r.maniobras);
  if (!r.revelado) {
    if (r.tribuna) ocultos.push(r.tribuna.uid);
    for (const b of r.banquillo) ocultos.push(b.uid);
  }
  for (const u of ocultos) delete v.cartaDe[u];
  // lo que hay en el mazo y aparece en una decisión del propio jugador (buscar, mirar) sí lo ve
  if (v.pendiente && v.pendiente.jugador !== yo) v.pendiente = { tipo: 'espera', jugador: v.pendiente.jugador };
  if (v.pendiente?.tipo === 'cartas') for (const [u, id] of Object.entries(v.pendiente.visibles)) v.cartaDe[Number(u)] = id;
  v.registro = v.registro.filter((x) => x.solo === undefined || x.solo === yo);
  // las tareas de la pila solo llevan uids y efectos de cartas ya descubiertas
  return v;
}

/** Uids que el jugador no puede conocer en una vista (para las pruebas de fugas). */
export function uidsOcultos(e: Partida, yo: Jug): Uid[] {
  const rv = OTRO(yo);
  const r = e.jugadores[rv];
  const res = [...e.jugadores[0].mazo, ...e.jugadores[1].mazo, ...r.maniobras];
  if (!r.manoVista) res.push(...r.mano);
  return res;
}
