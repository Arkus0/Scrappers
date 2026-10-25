// Utilidades para montar situaciones de prueba.
import { MAZOS_INICIALES } from '../src/datos/mazos-iniciales';
import { respuestaAzar } from '../src/ia/azar';
import { crearPartida, responder } from '../src/motor/motor';
import type { EnJuego, Jug, Partida, Uid } from '../src/motor/tipos';

export const mazo = (id: string) => {
  const m = MAZOS_INICIALES.find((x) => x.id === id)!;
  return { nombre: id, cartas: [...m.cartas], tipos: [...m.tipos] };
};

/** Partida con la preparación hecha al azar, parada en la primera decisión del turno 1. */
export function partidaLista(semilla = 1, a = 'rojo', b = 'magenta'): Partida {
  const e = crearPartida(semilla, [mazo(a), mazo(b)]);
  const rng = { rng: semilla };
  while (e.fase === 'preparacion' && e.pendiente) responder(e, respuestaAzar(e.pendiente, rng));
  return e;
}

export function nuevaCarta(e: Partida, id: string): Uid {
  const u = e.sigUid++;
  e.cartaDe[u] = id;
  return u;
}

export function enJuegoNuevo(e: Partida, id: string, turno = -5): EnJuego {
  return { uid: nuevaCarta(e, id), debajo: [], dano: 0, votos: [], herramienta: null, estados: {}, entroTurno: turno, ascendioTurno: -5, carismaUsada: false };
}

/** Pone un político en la tribuna de j (el anterior se pierde). */
export function tribuna(e: Partida, j: Jug, id: string, votos: EnJuego['votos'] = []): EnJuego {
  const ej = enJuegoNuevo(e, id);
  ej.votos = [...votos];
  e.jugadores[j].tribuna = ej;
  return ej;
}

export function banquillo(e: Partida, j: Jug, id: string): EnJuego {
  const ej = enJuegoNuevo(e, id);
  e.jugadores[j].banquillo.push(ej);
  return ej;
}

export function aMano(e: Partida, j: Jug, id: string): Uid {
  const u = nuevaCarta(e, id);
  e.jugadores[j].mano.push(u);
  return u;
}

/** Juega al azar hasta el final (o hasta un tope de pasos). */
export function terminarAlAzar(e: Partida, semilla = 3, tope = 6000) {
  const rng = { rng: semilla };
  let n = 0;
  while (!e.ganador && e.pendiente && n++ < tope) responder(e, respuestaAzar(e.pendiente, rng));
  return e;
}
