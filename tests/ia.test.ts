import { decidirIA, type Nivel } from '../src/ia/bot';
import { crearPartida, responder, respuestaValida } from '../src/motor/motor';
import { vistaPara } from '../src/motor/vista';
import type { Jug } from '../src/motor/tipos';
import { mazo } from './util';

describe('IA', () => {
  for (const nivel of ['novato', 'normal', 'experto'] as Nivel[]) {
    it(`en nivel ${nivel} siempre responde algo legal y termina las partidas`, () => {
      const partidas = nivel === 'experto' ? 2 : 6;
      for (let s = 1; s <= partidas; s++) {
        const e = crearPartida(s * 17, [mazo(['rojo', 'azul', 'magenta', 'verde'][s % 4]), mazo(['verde', 'magenta', 'azul', 'rojo'][s % 4])]);
        let n = 0;
        while (!e.ganador && n++ < 3000) {
          const j = e.pendiente!.jugador as Jug;
          const r = decidirIA(vistaPara(e, j), nivel, s * 1000 + n);
          expect(respuestaValida(e, r)).toBe(true);
          responder(e, r);
        }
        expect(e.ganador).not.toBeNull();
      }
    });
  }
});
