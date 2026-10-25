// La banda sonora: partituras válidas y pistas que cuadran entre sí.
import { describe, expect, it } from 'vitest';
import { frecuencia, prepararTema, sonido, tocarTema } from '../src/audio/audio';
import { TEMAS, type TemaId } from '../src/audio/temas';

describe('música', () => {
  it('las notas dan la frecuencia correcta', () => {
    expect(frecuencia('A4')).toBeCloseTo(440);
    expect(frecuencia('A5')).toBeCloseTo(880);
    expect(frecuencia('C4')).toBeCloseTo(261.63, 1);
    expect(frecuencia('G#5')).toBeCloseTo(frecuencia('Ab5'));
  });

  for (const id of Object.keys(TEMAS) as TemaId[]) {
    it(`«${id}»: todas las pistas duran lo mismo y en compases enteros`, () => {
      const t = prepararTema(TEMAS[id]);
      for (const p of t.pistas) expect(p.pasos, `${id} · ${p.canal}`).toBe(t.pasos);
      if (TEMAS[id].bucle) expect(t.pasos % 16).toBe(0);
      expect(t.pistas.every((p) => p.eventos.length > 0)).toBe(true);
    });
  }

  it('sin Web Audio (Node) la música y los efectos no fallan', () => {
    expect(() => tocarTema('menu')).not.toThrow();
    expect(() => sonido('ko')).not.toThrow();
    expect(() => tocarTema(null)).not.toThrow();
  });
});
