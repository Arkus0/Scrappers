// Protocolo del modo online (compartido por el cliente y el servidor). Mensajes JSON por WebSocket.
// El servidor ejecuta el motor y solo manda a cada jugador su vista: el cliente nunca decide nada por su cuenta.
import { LISTA_CARTAS } from '../datos/catalogo';
import type { DefMazo } from '../motor/mazo';
import type { Jug, Respuesta, Vista } from '../motor/tipos';

export const VERSION_PROTOCOLO = 1;

/** Huella del catálogo y del motor: si cliente y servidor no coinciden, el cliente debe recargar. */
export const VERSION_JUEGO: string = (() => {
  const s = JSON.stringify(LISTA_CARTAS.map((c) => [c.id, c.clase, 'aguante' in c ? c.aguante : 0, 'acciones' in c ? c.acciones.map((a) => [a.coste, a.dano]) : 0]));
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return `${VERSION_PROTOCOLO}-${(h >>> 0).toString(36)}`;
})();

export const EMOTES: Record<string, string> = {
  aplauso: '👏', risa: '😂', susto: '😱', pacto: '🤝', fuego: '🔥', ojos: '🙄', bien: 'Bien jugado', suerte: 'Suerte',
};

export type MsgCliente =
  | { t: 'hola'; version: string; nombre: string; token?: string }
  | { t: 'crearSala'; mazo: DefMazo }
  | { t: 'unirse'; codigo: string; mazo: DefMazo }
  | { t: 'buscar'; mazo: DefMazo }
  | { t: 'cancelar' }
  | { t: 'responder'; seq: number; respuesta: Respuesta }
  | { t: 'emote'; id: string }
  | { t: 'revancha' }
  | { t: 'abandonar' }
  | { t: 'ping' };

export type MsgServidor =
  | { t: 'bienvenida'; token: string; version: string }
  | { t: 'sala'; codigo: string }
  | { t: 'buscando'; segundos: number }
  | { t: 'emparejado'; asiento: Jug; rival: string; codigo: string; contraIA?: boolean }
  | { t: 'vista'; seq: number; vista: Vista; plazo: number | null }
  | { t: 'emote'; de: Jug; id: string }
  | { t: 'rivalDesconectado'; segundos: number }
  | { t: 'rivalReconectado' }
  | { t: 'revancha'; pide: Jug }
  | { t: 'fin'; ganador: Jug | null; motivo: string }
  | { t: 'error'; codigo: 'version' | 'sala' | 'mazo' | 'turno' | 'respuesta' | 'limite' | 'mensaje'; texto: string }
  | { t: 'pong' };

const esObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const esMazo = (x: unknown): x is DefMazo =>
  esObj(x) && Array.isArray(x.cartas) && x.cartas.length <= 40 && x.cartas.every((c) => typeof c === 'string' && c.length < 12)
  && Array.isArray(x.tipos) && x.tipos.length <= 3 && x.tipos.every((t) => typeof t === 'string') && (x.nombre === undefined || typeof x.nombre === 'string');
const esRespuesta = (x: unknown): x is Respuesta => {
  if (!esObj(x)) return false;
  if (x.tipo === 'opcion') return Number.isInteger(x.i);
  if (x.tipo === 'objetivo' || x.tipo === 'cartas') return Array.isArray(x.uids) && x.uids.length <= 20 && x.uids.every((u) => Number.isInteger(u));
  if (x.tipo === 'accion') return esObj(x.accion) && typeof x.accion.a === 'string';
  return false;
};

/** Comprueba la forma de un mensaje del cliente (la validez de la jugada la decide el motor). */
export function leerMensaje(texto: string): MsgCliente | null {
  let x: unknown;
  try { x = JSON.parse(texto); } catch { return null; }
  if (!esObj(x) || typeof x.t !== 'string') return null;
  switch (x.t) {
    case 'hola': return typeof x.version === 'string' && typeof x.nombre === 'string' && (x.token === undefined || typeof x.token === 'string') ? (x as MsgCliente) : null;
    case 'crearSala': case 'buscar': return esMazo(x.mazo) ? (x as MsgCliente) : null;
    case 'unirse': return typeof x.codigo === 'string' && esMazo(x.mazo) ? (x as MsgCliente) : null;
    case 'responder': return Number.isInteger(x.seq) && esRespuesta(x.respuesta) ? (x as MsgCliente) : null;
    case 'emote': return typeof x.id === 'string' && x.id in EMOTES ? (x as MsgCliente) : null;
    case 'cancelar': case 'revancha': case 'abandonar': case 'ping': return x as MsgCliente;
    default: return null;
  }
}

/** Nombres: hasta 16 caracteres, letras, números, espacios y algún signo. */
export function limpiarNombre(n: string): string {
  const s = n.normalize('NFC').replace(/[^\p{L}\p{N} ._'-]/gu, '').trim().slice(0, 16);
  return s || 'Candidato';
}

export const LETRAS_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
