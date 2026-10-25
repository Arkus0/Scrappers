// Partidos del 29N y su tipo en el juego (colores tomados de «176 · La Batalla del 29N»).
import type { Bloque, PartidoId, Tipo } from '../motor/tipos';

export interface InfoPartido {
  id: PartidoId;
  nombre: string;
  siglas: string;
  color: string;
  tipo: Tipo;
  bloque: Bloque;
}

export const PARTIDOS: Record<PartidoId, InfoPartido> = {
  PSOE: { id: 'PSOE', nombre: 'Partido Socialista (PSOE y PSC)', siglas: 'PSOE', color: '#e0001b', tipo: 'rojo', bloque: 'progresista' },
  FA: { id: 'FA', nombre: 'Frente Amplio (Sumar, IU, Más Madrid, Comuns)', siglas: 'FA', color: '#e5007e', tipo: 'magenta', bloque: 'progresista' },
  PP: { id: 'PP', nombre: 'Partido Popular', siglas: 'PP', color: '#1d6fd1', tipo: 'azul', bloque: 'conservador' },
  VOX: { id: 'VOX', nombre: 'Vox', siglas: 'Vox', color: '#5bbe21', tipo: 'verde', bloque: 'conservador' },
  PODEMOS: { id: 'PODEMOS', nombre: 'Podemos', siglas: 'Podemos', color: '#8e44c4', tipo: 'morado', bloque: 'ninguno' },
  ERC: { id: 'ERC', nombre: 'Esquerra Republicana', siglas: 'ERC', color: '#f4a800', tipo: 'ambar', bloque: 'ninguno' },
  JUNTS: { id: 'JUNTS', nombre: 'Junts per Catalunya', siglas: 'Junts', color: '#1e90a0', tipo: 'ambar', bloque: 'ninguno' },
  PNV: { id: 'PNV', nombre: 'EAJ-PNV', siglas: 'PNV', color: '#007a4d', tipo: 'ambar', bloque: 'ninguno' },
  BILDU: { id: 'BILDU', nombre: 'EH Bildu', siglas: 'Bildu', color: '#a2d213', tipo: 'ambar', bloque: 'ninguno' },
  BNG: { id: 'BNG', nombre: 'Bloque Nacionalista Galego', siglas: 'BNG', color: '#5da0d0', tipo: 'ambar', bloque: 'ninguno' },
  CC: { id: 'CC', nombre: 'Coalición Canaria', siglas: 'CC', color: '#ffd200', tipo: 'ambar', bloque: 'ninguno' },
  UPN: { id: 'UPN', nombre: 'Unión del Pueblo Navarro', siglas: 'UPN', color: '#c8102e', tipo: 'ambar', bloque: 'ninguno' },
  COMPROMIS: { id: 'COMPROMIS', nombre: 'Compromís', siglas: 'Compromís', color: '#e59234', tipo: 'ambar', bloque: 'ninguno' },
  TE: { id: 'TE', nombre: 'Teruel Existe', siglas: 'TE', color: '#0b7b3e', tipo: 'ambar', bloque: 'ninguno' },
  ADELANTE: { id: 'ADELANTE', nombre: 'Adelante Andalucía', siglas: 'Adelante', color: '#4dab8e', tipo: 'ambar', bloque: 'ninguno' },
  SALF: { id: 'SALF', nombre: 'Se Acabó La Fiesta', siglas: 'SALF', color: '#6a585b', tipo: 'incoloro', bloque: 'ninguno' },
  CS: { id: 'CS', nombre: 'Ciudadanos', siglas: 'Cs', color: '#eb6109', tipo: 'incoloro', bloque: 'ninguno' },
  UCD: { id: 'UCD', nombre: 'Unión de Centro Democrático', siglas: 'UCD', color: '#2e8b57', tipo: 'incoloro', bloque: 'ninguno' },
  INDEP: { id: 'INDEP', nombre: 'Independiente', siglas: 'Indep.', color: '#8890a8', tipo: 'incoloro', bloque: 'ninguno' },
};

export const BLOQUE_DE_TIPO: Record<Tipo, Bloque> = {
  rojo: 'progresista', magenta: 'progresista', azul: 'conservador', verde: 'conservador', morado: 'ninguno', ambar: 'ninguno', incoloro: 'ninguno',
};

/** Parejas espejo entre bloques. */
export const ESPEJO_TIPO: Partial<Record<Tipo, Tipo>> = { rojo: 'azul', azul: 'rojo', magenta: 'verde', verde: 'magenta' };

export interface InfoTipo {
  nombre: string;
  color: string;
  claro: string;
  oscuro: string;
  simbolo: string;
}

export const TIPO_INFO: Record<Tipo, InfoTipo> = {
  rojo: { nombre: 'Rojo', color: '#e5483f', claro: '#ff8a7e', oscuro: '#6e1a16', simbolo: 'R' },
  magenta: { nombre: 'Magenta', color: '#e0338f', claro: '#ff86c4', oscuro: '#6a1344', simbolo: 'M' },
  azul: { nombre: 'Azul', color: '#3a86e8', claro: '#8cbcff', oscuro: '#163c70', simbolo: 'A' },
  verde: { nombre: 'Verde', color: '#5bb432', claro: '#a6e07f', oscuro: '#2a5414', simbolo: 'V' },
  morado: { nombre: 'Morado', color: '#8e44c4', claro: '#c48ef0', oscuro: '#3f1a5e', simbolo: 'P' },
  ambar: { nombre: 'Ámbar', color: '#e8a93a', claro: '#ffd27e', oscuro: '#6a4a10', simbolo: 'T' },
  incoloro: { nombre: 'Incoloro', color: '#b9c0d0', claro: '#e4e8f0', oscuro: '#4a5266', simbolo: '·' },
};
