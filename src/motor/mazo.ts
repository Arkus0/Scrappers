// Reglas de construcción de mazos.
import { CATALOGO, esPolitico } from '../datos/catalogo';
import type { Tipo } from './tipos';
import { TIPOS_VOTO } from './tipos';

export const TAM_MAZO = 20;
export const MAX_COPIAS = 2;

export interface DefMazo {
  nombre: string;
  cartas: string[];
  tipos: Tipo[];
}

export function validarMazo(m: DefMazo): string[] {
  const errores: string[] = [];
  if (!Array.isArray(m.cartas) || !Array.isArray(m.tipos)) return ['Mazo mal formado'];
  if (m.cartas.length !== TAM_MAZO) errores.push(`El mazo debe tener ${TAM_MAZO} cartas (tiene ${m.cartas.length})`);
  if (m.tipos.length < 1 || m.tipos.length > 3) errores.push('Elige entre 1 y 3 tipos de voto');
  if (m.tipos.some((t) => !TIPOS_VOTO.includes(t))) errores.push('Tipo de voto no válido');
  if (new Set(m.tipos).size !== m.tipos.length) errores.push('Tipos de voto repetidos');
  const porNombre = new Map<string, number>();
  let basicos = 0;
  for (const id of m.cartas) {
    const c = CATALOGO[typeof id === 'string' && id.endsWith('*') ? id.slice(0, -1) : id];
    if (!c) { errores.push(`Carta desconocida: ${id}`); continue; }
    if (c.retirada) errores.push(`«${c.nombre}» está retirada`);
    porNombre.set(c.nombre, (porNombre.get(c.nombre) ?? 0) + 1);
    const max = c.unica ? 1 : MAX_COPIAS;
    if (porNombre.get(c.nombre)! > max) errores.push(`Demasiadas copias de «${c.nombre}» (máx. ${max})`);
    if (esPolitico(c) && c.fase === 'basico') basicos++;
  }
  if (basicos === 0) errores.push('El mazo necesita al menos un político Básico');
  return [...new Set(errores)];
}

/** Tipos de voto que sugiere un mazo: los de sus políticos, por número de cartas. */
export function sugerirTipos(cartas: string[]): Tipo[] {
  const cuenta = new Map<Tipo, number>();
  for (const id of cartas) {
    const c = CATALOGO[id.replace(/\*$/, '')];
    if (!c || !esPolitico(c)) continue;
    for (const a of c.acciones) for (const t of a.coste) if (t !== 'incoloro') cuenta.set(t, (cuenta.get(t) ?? 0) + 2);
    if (c.tipo !== 'incoloro') cuenta.set(c.tipo, (cuenta.get(c.tipo) ?? 0) + 1);
  }
  const orden = [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  return orden.length ? orden.slice(0, Math.min(2, orden.length)) : ['rojo'];
}
