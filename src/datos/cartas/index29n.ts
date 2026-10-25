// Expansión «29N»: se compone de las tandas por tipo y clase (N-001 … N-241).
import type { Carta } from '../../motor/tipos';
import { CARTAS_MAGENTA_VERDE } from './magenta-verde';
import { CARTAS_AMBAR, CARTAS_INCOLORO, CARTAS_MORADO } from './morado-ambar-incoloro';
import { CARTAS_PLATO_Y_ENTRENADORES } from './plato-y-entrenadores';
import { CARTAS_ROJO_AZUL } from './rojo-azul';

export const CARTAS_29N: Carta[] = [
  ...CARTAS_ROJO_AZUL, ...CARTAS_MAGENTA_VERDE, ...CARTAS_MORADO, ...CARTAS_AMBAR, ...CARTAS_INCOLORO, ...CARTAS_PLATO_Y_ENTRENADORES,
].sort((a, b) => a.num - b.num);
