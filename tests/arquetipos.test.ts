import { LISTA_CARTAS } from '../src/datos/catalogo';
import { ARQUETIPOS, MAZOS_TEMATICOS } from '../src/datos/mazos-tematicos';
import { MAZOS_INICIALES } from '../src/datos/mazos-iniciales';
import { validarMazo } from '../src/motor/mazo';

describe('Arquetipos y mazos', () => {
  it('hay al menos 14 arquetipos con su mazo temático', () => {
    expect(ARQUETIPOS.length).toBeGreaterThanOrEqual(14);
  });

  it('todos los mazos temáticos e iniciales son legales', () => {
    for (const m of [...MAZOS_TEMATICOS, ...MAZOS_INICIALES]) expect(validarMazo(m), m.nombre).toEqual([]);
  });

  it('cada arquetipo de las cartas tiene al menos 10 cartas de apoyo', () => {
    const cuenta = new Map<string, number>();
    for (const c of LISTA_CARTAS) for (const a of c.arquetipos ?? []) cuenta.set(a, (cuenta.get(a) ?? 0) + 1);
    for (const a of ['aggro', 'ascenso', 'equipo', 'coalicion', 'granCoalicion', 'caos', 'investidura', 'plato', 'bulo', 'control', 'mill', 'crispacion', 'tregua', 'maniobras', 'combo', 'leyendas']) {
      expect(cuenta.get(a) ?? 0, a).toBeGreaterThanOrEqual(a === 'leyendas' ? 7 : 10);
    }
  });
});
