import { crearPartida, responder } from '../src/motor/motor';
import { uidsOcultos, vistaPara } from '../src/motor/vista';
import { respuestaAzar } from '../src/ia/azar';
import type { Jug } from '../src/motor/tipos';
import { mazo } from './util';

describe('Vista por jugador', () => {
  it('nunca enseña la mano, las maniobras ni los mazos del rival, ni la semilla', () => {
    for (let s = 1; s <= 25; s++) {
      const e = crearPartida(s, [mazo('rojo'), mazo('verde')]);
      const rng = { rng: s };
      let n = 0;
      while (!e.ganador && n++ < 3000) {
        for (const j of [0, 1] as Jug[]) {
          const v = vistaPara(e, j);
          expect(v.rng).toBe(0);
          const ocultos = new Set(uidsOcultos(e, j));
          // lo que el propio jugador está eligiendo de su mazo sí lo ve
          if (e.pendiente?.tipo === 'cartas' && e.pendiente.jugador === j) for (const u of Object.keys(e.pendiente.visibles)) ocultos.delete(Number(u));
          for (const u of ocultos) expect(v.cartaDe[u], `uid ${u} visible para ${j}`).toBeUndefined();
          expect(v.jugadores[0].mazo.every((u) => u === -1)).toBe(true);
          expect(v.jugadores[1].mazo.every((u) => u === -1)).toBe(true);
          if (e.pendiente && e.pendiente.jugador !== j) expect(v.pendiente?.tipo).toBe('espera');
          expect(v.registro.every((x) => x.solo === undefined || x.solo === j)).toBe(true);
        }
        responder(e, respuestaAzar(e.pendiente!, rng));
      }
    }
  });

  it('durante la preparación no se ven las candidaturas del rival', () => {
    const e = crearPartida(4, [mazo('azul'), mazo('magenta')]);
    const rng = { rng: 4 };
    while (e.fase === 'preparacion' && e.pendiente?.jugador === 0) responder(e, respuestaAzar(e.pendiente, rng));
    if (e.fase === 'preparacion' && e.jugadores[0].tribuna) {
      const v = vistaPara(e, 1);
      expect(v.cartaDe[e.jugadores[0].tribuna.uid]).toBeUndefined();
    }
  });
});
