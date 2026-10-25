// Jugador aleatorio (para pruebas): responde cualquier decisión con una opción válida al azar.
// Solo mira la decisión pendiente, así que vale igual con la partida completa que con una vista.
import { aleatorio } from '../motor/rng';
import type { Decision, Respuesta } from '../motor/tipos';

export function respuestaAzar(d: Decision, rng: { rng: number }): Respuesta {
  const pick = <T,>(a: T[]): T => a[Math.floor(aleatorio(rng) * a.length)];
  switch (d.tipo) {
    case 'accion': {
      // pasar menos a menudo, para que las partidas avancen
      const sinPasar = d.acciones.filter((a) => a.a !== 'pasar');
      const ataques = d.acciones.filter((a) => a.a === 'atacar');
      if (ataques.length && aleatorio(rng) < 0.5) return { tipo: 'accion', accion: pick(ataques) };
      if (sinPasar.length && aleatorio(rng) < 0.85) return { tipo: 'accion', accion: pick(sinPasar) };
      return { tipo: 'accion', accion: pick(d.acciones) };
    }
    case 'objetivo':
    case 'cartas': {
      const n = d.min + Math.floor(aleatorio(rng) * (d.max - d.min + 1));
      const ops = [...d.opciones];
      const uids: number[] = [];
      for (let i = 0; i < n && ops.length; i++) uids.push(ops.splice(Math.floor(aleatorio(rng) * ops.length), 1)[0]);
      return d.tipo === 'objetivo' ? { tipo: 'objetivo', uids } : { tipo: 'cartas', uids };
    }
    case 'opcion': return { tipo: 'opcion', i: Math.floor(aleatorio(rng) * d.opciones.length) };
    case 'espera': throw new Error('No es tu decisión');
  }
}
