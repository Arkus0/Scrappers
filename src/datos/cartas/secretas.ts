// Cartas secretas (S-01 … S-20): Leyendas con condición de mazo (sin cartas repetidas) y artes especiales.
// Las Leyendas van en espejo por bloque: González, Zapatero y Anguita frente a Aznar, Rajoy y Aguirre; Suárez es neutral.
import { atq, carisma, E, entrenador, idCarta, pol } from '../constructores';
import type { Carta, CartaPolitico, Cond, Rareza } from '../../motor/tipos';
import { CARTAS_ROJO_AZUL } from './rojo-azul';
import { CARTAS_MAGENTA_VERDE } from './magenta-verde';
import { CARTAS_AMBAR, CARTAS_MORADO } from './morado-ambar-incoloro';
import { CARTAS_RECURSOS } from './plato-y-entrenadores';

const S = 'secreta' as const;
const SIN_REPETIDAS: Cond = { c: 'mazoSinRepetidas' };
let n = 0;

const leyenda = (d: Omit<Parameters<typeof pol>[1], 'num' | 'leyenda' | 'unica' | 'rareza' | 'cl'>) =>
  pol(S, { ...d, num: ++n, leyenda: SIN_REPETIDAS, unica: true, rareza: 'S', cl: true, arquetipos: ['leyendas', ...(d.arquetipos ?? [])] });

const LEYENDAS: CartaPolitico[] = [
  leyenda({ nombre: 'Felipe González', persona: 'felipe-gonzalez', cargo: 'Presidente del Gobierno (1982-1996)', partido: 'PSOE', aguante: 160, relevo: 2, frase: 'Por el cambio.',
    acciones: [atq('Diez millones de votos', 'RRI', 80), atq('Por el cambio', 'RRII', 130)],
    carisma: carisma('Mayoría histórica', 'mitin', { efectos: [E.cura('todo', 'todosPropios'), E.robar(2)] }),
    escena: 'Un puro apagado sobre un escritorio con vistas a un jardín de bonsáis', icono: 'arbol' }),
  leyenda({ nombre: 'José María Aznar', persona: 'jose-maria-aznar', cargo: 'Presidente del Gobierno (1996-2004)', partido: 'PP', aguante: 160, relevo: 2, frase: '¿Quién te ha dicho a ti las copas de vino que tengo que beber?',
    acciones: [atq('España va bien', 'AAI', 80), atq('Mayoría absoluta', 'AAII', 130)],
    carisma: carisma('Mayoría histórica', 'mitin', { efectos: [E.cura('todo', 'todosPropios'), E.robar(2)] }),
    escena: 'Una copa de vino tinto sobre un atril con un mapa de España en vertical detrás', icono: 'cana' }),
  leyenda({ nombre: 'José Luis Rodríguez Zapatero', persona: 'zapatero', cargo: 'Presidente del Gobierno (2004-2011)', partido: 'PSOE', aguante: 150, relevo: 2, frase: 'La tierra no pertenece a nadie, salvo al viento.',
    acciones: [atq('Talante', 'RI', 60, [E.cura(20, 'todosPropios')]), atq('Alianza de civilizaciones', 'RRII', 110)],
    carisma: carisma('Talante', 'pasiva', { pasivas: [{ p: 'defensa', n: 20, ambito: 'aliados' }] }),
    escena: 'Un banco de parque al atardecer frente a un campo de molinos de viento', icono: 'molino' }),
  leyenda({ nombre: 'Mariano Rajoy', persona: 'mariano-rajoy', cargo: 'Presidente del Gobierno (2011-2018)', partido: 'PP', aguante: 150, relevo: 2, frase: 'Es el vecino el que elige al alcalde.',
    acciones: [atq('Un vaso es un vaso', 'AI', 60, [E.cura(20, 'todosPropios')]), atq('Marcha atlética', 'AAII', 110)],
    carisma: carisma('Paciencia', 'pasiva', { pasivas: [{ p: 'defensa', n: 20, ambito: 'aliados' }] }),
    escena: 'Un periódico deportivo doblado junto a un puro y un vaso de agua', icono: 'periodico' }),
  leyenda({ nombre: 'Julio Anguita', persona: 'julio-anguita', cargo: 'Coordinador general de IU (1989-2000)', partido: 'FA', aguante: 150, relevo: 2, frase: 'Programa, programa, programa.',
    acciones: [atq('Programa, programa, programa', 'MI', 60, [E.robar(1)]), atq('El califa rojo', 'MMII', 110)],
    carisma: carisma('Coherencia', 'activado', { efectos: [{ e: 'buscar', filtro: {}, n: 1, destino: 'mano' }] }),
    escena: 'Una mezquita-catedral al atardecer con un programa electoral sobre un banco', icono: 'libro' }),
  leyenda({ nombre: 'Esperanza Aguirre', persona: 'esperanza-aguirre', cargo: 'Presidenta de la Comunidad de Madrid (2003-2012)', partido: 'PP', aguante: 150, relevo: 2,
    acciones: [atq('Liberal', 'AI', 60, [E.robar(1)]), atq('Lideresa', 'AAII', 110)],
    carisma: carisma('Coherencia', 'activado', { efectos: [{ e: 'buscar', filtro: {}, n: 1, destino: 'mano' }] }),
    escena: 'Un bolso de mano sobre un escaño con un ramo de flores', icono: 'estrella' }),
  leyenda({ nombre: 'Adolfo Suárez', persona: 'adolfo-suarez', cargo: 'Presidente del Gobierno (1976-1981)', partido: 'UCD', aguante: 170, relevo: 2, frase: 'Puedo prometer y prometo.',
    acciones: [atq('Consenso', 'II', 50, [E.cura(30, 'todosPropios')]), atq('La Transición', 'IIII', 120)],
    carisma: carisma('Consenso', 'pasiva', { pasivas: [{ p: 'dano', n: 20, ambito: 'aliados', cond: { c: 'granCoalicion' } }] }),
    escena: 'Una silla vacía en un hemiciclo antiguo iluminada por un único rayo de sol', icono: 'hemiciclo', arquetipos: ['granCoalicion'] }),
];

/** Arte alternativo: misma carta (mismo nombre y efectos), otra rareza y otra ilustración. */
function alternativa(base: Carta | undefined, rareza: Rareza, escena: string): Carta {
  if (!base) throw new Error('Falta la carta base del arte alternativo');
  const num = ++n;
  return { ...base, id: idCarta(S, num), num, coleccion: S, rareza, escena, pareja: undefined };
}
const buscar = (lista: Carta[], nombre: string) => lista.find((c) => c.nombre === nombre);

const ALTERNATIVAS: Carta[] = [
  alternativa(buscar(CARTAS_ROJO_AZUL, 'Pedro Sánchez CL'), 'S', 'Una tribuna dorada en un hemiciclo lleno de luz, a pantalla completa, con confeti rojo'),
  alternativa(buscar(CARTAS_ROJO_AZUL, 'Feijóo CL'), 'S', 'Un faro dorado bajo un cielo estrellado, a pantalla completa, con confeti azul'),
  alternativa(buscar(CARTAS_ROJO_AZUL, 'María Jesús Montero · Vicepresidenta'), 'E', 'Un tapiz de gráficos económicos rojos y dorados a pantalla completa'),
  alternativa(buscar(CARTAS_ROJO_AZUL, 'Isabel Díaz Ayuso · Presidenta'), 'E', 'Una terraza madrileña infinita bajo un cielo azul a pantalla completa'),
  alternativa(buscar(CARTAS_MAGENTA_VERDE, 'Ada Colau CL'), 'E', 'Una marea magenta a pantalla completa con miles de manos alzadas'),
  alternativa(buscar(CARTAS_MAGENTA_VERDE, 'Santiago Abascal CL'), 'E', 'Una cabalgata de caballos verdes a pantalla completa bajo un cielo de tormenta'),
  alternativa(buscar(CARTAS_MORADO, 'Irene Montero CL'), 'E', 'Un océano morado a pantalla completa con una sola ola gigante'),
  alternativa(buscar(CARTAS_AMBAR, 'Carles Puigdemont CL'), 'E', 'Una llave dorada a pantalla completa abriendo un hemiciclo de piedra'),
  alternativa(buscar(CARTAS_ROJO_AZUL, 'García-Page CL'), 'E', 'Un campo de molinos gigantes a pantalla completa al amanecer'),
  alternativa(buscar(CARTAS_ROJO_AZUL, 'Juanma Moreno CL'), 'E', 'Un patio andaluz infinito a pantalla completa con azulejos dorados'),
];

const ESPECIALES: Carta[] = [
  alternativa(buscar(CARTAS_RECURSOS, 'Votación de investidura'), 'S', 'Un hemiciclo dorado con 176 escaños encendidos a pantalla completa'),
  entrenador(S, { num: ++n, nombre: 'La urna de cristal', clase: 'recurso', rareza: 'E', efectos: [E.robar(3)], requisito: { c: 'manoPropiaMax', n: 2 }, escena: 'Una urna de cristal tallado llena de papeletas que brillan como joyas', icono: 'urna' }),
  entrenador(S, { num: ++n, nombre: 'El escaño 176', clase: 'escenario', rareza: 'S', pasivas: [{ p: 'aguante', n: 30, ambito: 'todos', filtro: { cl: true } }, { p: 'dano', n: 10, ambito: 'todos', filtro: { cl: true } }], escena: 'Un único escaño dorado iluminado en un hemiciclo a oscuras', icono: 'hemiciclo' }),
];

export const CARTAS_SECRETAS: Carta[] = [...LEYENDAS, ...ALTERNATIVAS, ...ESPECIALES];
