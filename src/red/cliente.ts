// Cliente WebSocket del modo online, con reconexión automática (el token guarda el asiento en el servidor).
import type { DefMazo } from '../motor/mazo';
import type { Respuesta } from '../motor/tipos';
import { VERSION_JUEGO, type MsgCliente, type MsgServidor } from './protocolo';

const CLAVE_TOKEN = '176tcg-token-online';
const CLAVE_URL = '176tcg-url-servidor';

/** Servidor del modo online fijado al compilar (en Vercel: variable de entorno VITE_SERVIDOR). */
export const SERVIDOR_CONFIGURADO: string | null = import.meta.env.VITE_SERVIDOR || null;

/**
 * Dónde está el servidor online: el configurado al compilar; si no, el último que se usó; si no, el mismo
 * dominio que sirve la página (así funciona tal cual en Railway, que sirve el juego y el WebSocket juntos).
 */
export function urlPorDefecto(): string | null {
  if (SERVIDOR_CONFIGURADO) return SERVIDOR_CONFIGURADO;
  try {
    const guardada = localStorage.getItem(CLAVE_URL);
    if (guardada) return guardada;
  } catch { /* sin almacenamiento */ }
  if (typeof location !== 'undefined' && (location.protocol === 'http:' || location.protocol === 'https:')) {
    return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  }
  return null;
}

export function guardarUrl(u: string) {
  try { localStorage.setItem(CLAVE_URL, u); } catch { /* sin almacenamiento */ }
}

export type EstadoConexion = 'desconectado' | 'conectando' | 'conectado' | 'reconectando';

export class ClienteOnline {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private intentos = 0;
  private cerrado = false;
  private latido: number | null = null;
  estado: EstadoConexion = 'desconectado';
  onMensaje: (m: MsgServidor) => void = () => {};
  onEstado: (e: EstadoConexion) => void = () => {};

  constructor(private url: string, private nombre: string) {
    try { this.token = sessionStorage.getItem(CLAVE_TOKEN); } catch { this.token = null; }
  }

  conectar() {
    this.cerrado = false;
    this.poner(this.intentos ? 'reconectando' : 'conectando');
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this.poner('desconectado');
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.intentos = 0;
      this.enviar({ t: 'hola', version: VERSION_JUEGO, nombre: this.nombre, token: this.token ?? undefined });
      this.latido = window.setInterval(() => this.enviar({ t: 'ping' }), 25_000);
    };
    ws.onmessage = (ev) => {
      let m: MsgServidor;
      try { m = JSON.parse(String(ev.data)); } catch { return; }
      if (m.t === 'bienvenida') {
        this.token = m.token;
        try { sessionStorage.setItem(CLAVE_TOKEN, m.token); } catch { /* sin almacenamiento */ }
        this.poner('conectado');
      }
      if (m.t !== 'pong') this.onMensaje(m);
    };
    ws.onclose = () => {
      if (this.latido) window.clearInterval(this.latido);
      this.ws = null;
      if (this.cerrado) { this.poner('desconectado'); return; }
      // reintento con espera creciente
      this.intentos++;
      this.poner('reconectando');
      window.setTimeout(() => !this.cerrado && this.conectar(), Math.min(8000, 500 * 2 ** this.intentos));
    };
  }

  private poner(e: EstadoConexion) {
    this.estado = e;
    this.onEstado(e);
  }

  enviar(m: MsgCliente) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }

  crearSala(mazo: DefMazo) { this.enviar({ t: 'crearSala', mazo }); }
  unirse(codigo: string, mazo: DefMazo) { this.enviar({ t: 'unirse', codigo, mazo }); }
  buscar(mazo: DefMazo) { this.enviar({ t: 'buscar', mazo }); }
  cancelar() { this.enviar({ t: 'cancelar' }); }
  responder(seq: number, respuesta: Respuesta) { this.enviar({ t: 'responder', seq, respuesta }); }
  emote(id: string) { this.enviar({ t: 'emote', id }); }
  revancha() { this.enviar({ t: 'revancha' }); }
  abandonar() { this.enviar({ t: 'abandonar' }); }

  cerrar() {
    this.cerrado = true;
    this.ws?.close();
  }
}
