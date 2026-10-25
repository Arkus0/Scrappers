// El catálogo: todas las cartas por id. Los archivos de cartas se registran aquí.
import type { Carta, CartaEntrenador, CartaPolitico, CartaTertuliano } from '../motor/tipos';
import { CARTAS_BASICA } from './cartas/basica';
import { CARTAS_29N } from './cartas/index29n';
import { CARTAS_SECRETAS } from './cartas/secretas';

export const LISTA_CARTAS: Carta[] = [...CARTAS_BASICA, ...CARTAS_29N, ...CARTAS_SECRETAS];

export const CATALOGO: Record<string, Carta> = {};
for (const c of LISTA_CARTAS) {
  if (CATALOGO[c.id]) throw new Error(`Carta repetida: ${c.id}`);
  CATALOGO[c.id] = c;
}

/** Busca la carta por id (las Shiny llevan «*» al final). */
export function carta(id: string): Carta {
  const c = CATALOGO[id.endsWith('*') ? id.slice(0, -1) : id];
  if (!c) throw new Error(`Carta desconocida: ${id}`);
  return c;
}

export const esPolitico = (c: Carta): c is CartaPolitico => c.clase === 'politico';
export const esTertuliano = (c: Carta): c is CartaTertuliano => c.clase === 'tertuliano';
export const esEntrenador = (c: Carta): c is CartaEntrenador => c.clase !== 'politico' && c.clase !== 'tertuliano';

/** Cartas que se pueden usar en un mazo (no retiradas). */
export const CARTAS_JUGABLES = LISTA_CARTAS.filter((c) => !c.retirada);

export const POR_NOMBRE: Record<string, Carta[]> = {};
for (const c of LISTA_CARTAS) (POR_NOMBRE[c.nombre] ??= []).push(c);
