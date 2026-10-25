// Guardado del perfil: localStorage si se puede, memoria si no (modo privado, artefacto sin permisos).
// El código de copia permite llevarse la partida a otro dispositivo.
import { migrar, perfilNuevo, type Perfil } from './perfil';

const CLAVE = 'tcg176.perfil';
let memoria: string | null = null;

function leerCrudo(): string | null {
  try {
    return window.localStorage.getItem(CLAVE) ?? memoria;
  } catch {
    return memoria;
  }
}

function escribirCrudo(txt: string): boolean {
  memoria = txt;
  try {
    window.localStorage.setItem(CLAVE, txt);
    return true;
  } catch {
    return false;
  }
}

export function cargarPerfil(): Perfil {
  const txt = leerCrudo();
  if (!txt) return perfilNuevo();
  try {
    return migrar(JSON.parse(txt));
  } catch {
    return perfilNuevo();
  }
}

/** Devuelve false si solo se ha podido guardar en memoria. */
export function guardarPerfil(p: Perfil): boolean {
  return escribirCrudo(JSON.stringify(p));
}

export function borrarPerfil() {
  memoria = null;
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    /* nada que borrar */
  }
}

// ————————————————————————————————————— código de copia
function suma(txt: string): string {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) h = Math.imul(h ^ txt.charCodeAt(i), 16777619) >>> 0;
  return h.toString(36).padStart(7, '0').slice(-6);
}

function b64(txt: string): string {
  const bytes = new TextEncoder().encode(txt);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(bin);
}
const desdeB64 = (b: string) => new TextDecoder().decode(Uint8Array.from(atob(b), (c) => c.charCodeAt(0)));

/** Texto para copiar y pegar en otro dispositivo. */
export function exportarPerfil(p: Perfil): string {
  const json = JSON.stringify(p);
  return `176-${suma(json)}-${b64(json)}`;
}

export function importarPerfil(codigo: string): Perfil | string {
  const m = /^176-([0-9a-z]{6})-([A-Za-z0-9+/=]+)$/.exec(codigo.replace(/\s+/g, ''));
  if (!m) return 'El código no tiene el formato correcto';
  let json: string;
  try {
    json = desdeB64(m[2]);
  } catch {
    return 'El código está dañado';
  }
  if (suma(json) !== m[1]) return 'El código está incompleto o se ha modificado';
  try {
    const p = JSON.parse(json);
    if (typeof p !== 'object' || !p || typeof p.coleccion !== 'object') return 'El código no contiene un perfil';
    return migrar(p);
  } catch {
    return 'El código no contiene un perfil';
  }
}
