// Los cuatro mazos iniciales (colección Básica), igualados en espejo.
import type { DefMazo } from '../motor/mazo';
import type { Tipo } from '../motor/tipos';

const ENTRENADORES = ['B-27', 'B-28', 'B-28', 'B-29', 'B-30', 'B-33', 'B-36', 'B-36', 'B-32'];

function mazo(nombre: string, tipo: Tipo, nums: number[]): DefMazo {
  const pol = nums.map((n) => `B-${String(n).padStart(2, '0')}`);
  return { nombre, tipos: [tipo], cartas: [...pol, ...ENTRENADORES] };
}

export interface MazoInicial extends DefMazo {
  id: 'rojo' | 'magenta' | 'azul' | 'verde';
  lema: string;
  lider: string;
}

export const MAZOS_INICIALES: MazoInicial[] = [
  { id: 'rojo', lema: 'Resistir es ganar', lider: 'Pedro Sánchez', ...mazo('Mazo Rojo · Ferraz', 'rojo', [1, 1, 3, 3, 5, 7, 7, 9, 11, 13, 13]) },
  { id: 'azul', lema: 'El cambio tranquilo', lider: 'Alberto Núñez Feijóo', ...mazo('Mazo Azul · Génova', 'azul', [2, 2, 4, 4, 6, 8, 8, 10, 12, 14, 14]) },
  { id: 'magenta', lema: 'Sumar fuerzas', lider: 'Ada Colau', ...mazo('Mazo Magenta · Frente Amplio', 'magenta', [15, 15, 17, 17, 19, 21, 21, 23, 23, 25, 25]) },
  { id: 'verde', lema: 'Todos a una', lider: 'Santiago Abascal', ...mazo('Mazo Verde · Bambú', 'verde', [16, 16, 18, 18, 20, 22, 22, 24, 24, 26, 26]) },
];
