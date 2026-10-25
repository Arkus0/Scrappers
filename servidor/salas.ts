// Salas del modo online: emparejamiento, partida autoritativa, plazos, reconexión y revancha.
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';
import { decidirIA } from '../src/ia/bot';
import { validarMazo, type DefMazo } from '../src/motor/mazo';
import { crearPartida, responder, respuestaValida, terminar } from '../src/motor/motor';
import type { Jug, Partida } from '../src/motor/tipos';
import { OTRO } from '../src/motor/tipos';
import { vistaPara } from '../src/motor/vista';
import { LETRAS_CODIGO, VERSION_JUEGO, limpiarNombre, leerMensaje, type MsgServidor } from '../src/red/protocolo';

export interface Plazos {
  /** milisegundos para una acción de la fase principal */
  accion: number;
  /** milisegundos para una subdecisión (objetivo, cartas, opción) */
  sub: number;
  /** milisegundos para volver tras una desconexión */
  reconexion: number;
  /** milisegundos buscando rival antes de ofrecer la IA */
  busqueda: number;
}

export const PLAZOS_POR_DEFECTO: Plazos = { accion: 60_000, sub: 30_000, reconexion: 120_000, busqueda: 30_000 };
const MAX_SALAS = 200;
const MAX_MENSAJES_SEG = 20;
const MAX_PLAZOS = 3;

interface Conexion {
  ws: WebSocket;
  token: string | null;
  nombre: string;
  mensajes: number;
  ventana: number;
}

interface Asiento {
  token: string;
  nombre: string;
  mazo: DefMazo;
  con: Conexion | null;
  plazosSeguidos: number;
  ia?: boolean;
  desconectado?: NodeJS.Timeout;
}

interface Sala {
  codigo: string;
  asientos: [Asiento | null, Asiento | null];
  estado: 'esperando' | 'jugando' | 'terminada';
  partida: Partida | null;
  seq: number;
  plazo: NodeJS.Timeout | null;
  plazoFin: number | null;
  creada: number;
  terminadaEn: number | null;
  revancha: Set<Jug>;
  ia: NodeJS.Timeout | null;
}

export class Salas {
  private salas = new Map<string, Sala>();
  private porToken = new Map<string, string>(); // token → código de sala
  private cola: { token: string; con: Conexion; mazo: DefMazo; desde: number; temporizador: NodeJS.Timeout }[] = [];
  private limpieza: NodeJS.Timeout;

  constructor(private plazos: Plazos = PLAZOS_POR_DEFECTO) {
    this.limpieza = setInterval(() => this.limpiar(), 30_000);
    this.limpieza.unref();
  }

  get numSalas() { return this.salas.size; }
  get enCola() { return this.cola.length; }

  cerrar() {
    clearInterval(this.limpieza);
    for (const s of this.salas.values()) this.pararTemporizadores(s);
    for (const c of this.cola) clearTimeout(c.temporizador);
  }

  // ————————————————————————————————————— conexiones
  conectar(ws: WebSocket) {
    const con: Conexion = { ws, token: null, nombre: 'Candidato', mensajes: 0, ventana: Date.now() };
    ws.on('message', (datos, binario) => {
      if (binario) return;
      const ahora = Date.now();
      if (ahora - con.ventana > 1000) { con.ventana = ahora; con.mensajes = 0; }
      if (++con.mensajes > MAX_MENSAJES_SEG) return this.enviar(con, { t: 'error', codigo: 'limite', texto: 'Demasiados mensajes' });
      const m = leerMensaje(String(datos));
      if (!m) return this.enviar(con, { t: 'error', codigo: 'mensaje', texto: 'Mensaje no válido' });
      try {
        this.manejar(con, m);
      } catch (err) {
        this.enviar(con, { t: 'error', codigo: 'mensaje', texto: String(err) });
      }
    });
    ws.on('close', () => this.desconectar(con));
    ws.on('error', () => this.desconectar(con));
  }

  private enviar(con: Conexion | null | undefined, m: MsgServidor) {
    if (!con || con.ws.readyState !== 1) return;
    con.ws.send(JSON.stringify(m));
  }

  private manejar(con: Conexion, m: NonNullable<ReturnType<typeof leerMensaje>>) {
    if (m.t === 'ping') return this.enviar(con, { t: 'pong' });
    if (m.t === 'hola') {
      if (m.version !== VERSION_JUEGO) return this.enviar(con, { t: 'error', codigo: 'version', texto: 'Hay una versión nueva del juego: recarga la página' });
      con.nombre = limpiarNombre(m.nombre);
      // reconexión: el token conserva el asiento
      if (m.token && this.porToken.has(m.token)) {
        con.token = m.token;
        this.enviar(con, { t: 'bienvenida', token: m.token, version: VERSION_JUEGO });
        this.reconectar(con);
        return;
      }
      con.token = randomUUID();
      this.enviar(con, { t: 'bienvenida', token: con.token, version: VERSION_JUEGO });
      return;
    }
    if (!con.token) return this.enviar(con, { t: 'error', codigo: 'mensaje', texto: 'Falta el saludo' });
    switch (m.t) {
      case 'crearSala': return this.crearSala(con, m.mazo);
      case 'unirse': return this.unirse(con, m.codigo, m.mazo);
      case 'buscar': return this.buscar(con, m.mazo);
      case 'cancelar': return this.cancelar(con);
      case 'responder': return this.responder(con, m.seq, m.respuesta);
      case 'emote': return this.emote(con, m.id);
      case 'revancha': return this.pedirRevancha(con);
      case 'abandonar': return this.abandonar(con);
    }
  }

  private mazoValido(con: Conexion, mazo: DefMazo): boolean {
    const errores = validarMazo({ nombre: mazo.nombre ?? 'Mazo', cartas: mazo.cartas, tipos: mazo.tipos });
    if (errores.length) { this.enviar(con, { t: 'error', codigo: 'mazo', texto: errores[0] }); return false; }
    return true;
  }

  private nuevoCodigo(): string {
    for (let i = 0; i < 100; i++) {
      const c = Array.from({ length: 4 }, () => LETRAS_CODIGO[randomInt(LETRAS_CODIGO.length)]).join('');
      if (!this.salas.has(c)) return c;
    }
    return randomBytes(3).toString('hex').toUpperCase();
  }

  private salaDe(con: Conexion): Sala | null {
    const c = con.token ? this.porToken.get(con.token) : undefined;
    return c ? this.salas.get(c) ?? null : null;
  }

  private asientoDe(s: Sala, con: Conexion): Jug | null {
    if (s.asientos[0]?.token === con.token) return 0;
    if (s.asientos[1]?.token === con.token) return 1;
    return null;
  }

  private salir(con: Conexion) {
    // dejar una sala anterior (en espera o terminada) antes de entrar en otra
    const s = this.salaDe(con);
    if (!s) return;
    if (s.estado === 'jugando') { this.abandonar(con); }
    this.porToken.delete(con.token!);
    if (s.estado === 'esperando') this.cerrarSala(s);
  }

  private crearSala(con: Conexion, mazo: DefMazo) {
    if (!this.mazoValido(con, mazo)) return;
    if (this.salas.size >= MAX_SALAS) return this.enviar(con, { t: 'error', codigo: 'limite', texto: 'El servidor está lleno, prueba en un rato' });
    this.salir(con);
    this.cancelar(con);
    const s: Sala = {
      codigo: this.nuevoCodigo(), asientos: [{ token: con.token!, nombre: con.nombre, mazo, con, plazosSeguidos: 0 }, null], estado: 'esperando',
      partida: null, seq: 0, plazo: null, plazoFin: null, creada: Date.now(), terminadaEn: null, revancha: new Set(), ia: null,
    };
    this.salas.set(s.codigo, s);
    this.porToken.set(con.token!, s.codigo);
    this.enviar(con, { t: 'sala', codigo: s.codigo });
  }

  private unirse(con: Conexion, codigo: string, mazo: DefMazo) {
    if (!this.mazoValido(con, mazo)) return;
    const s = this.salas.get(codigo.trim().toUpperCase());
    if (!s || s.estado !== 'esperando' || s.asientos[1]) return this.enviar(con, { t: 'error', codigo: 'sala', texto: 'No existe esa sala o ya está completa' });
    if (s.asientos[0]?.token === con.token) return this.enviar(con, { t: 'error', codigo: 'sala', texto: 'No puedes jugar contra ti mismo' });
    this.salir(con);
    this.cancelar(con);
    s.asientos[1] = { token: con.token!, nombre: con.nombre, mazo, con, plazosSeguidos: 0 };
    this.porToken.set(con.token!, s.codigo);
    this.empezar(s);
  }

  private buscar(con: Conexion, mazo: DefMazo) {
    if (!this.mazoValido(con, mazo)) return;
    this.salir(con);
    this.cancelar(con);
    const otro = this.cola.find((c) => c.token !== con.token && c.con.ws.readyState === 1);
    if (otro) {
      this.cola = this.cola.filter((c) => c !== otro);
      clearTimeout(otro.temporizador);
      if (this.salas.size >= MAX_SALAS) return this.enviar(con, { t: 'error', codigo: 'limite', texto: 'El servidor está lleno, prueba en un rato' });
      const s: Sala = {
        codigo: this.nuevoCodigo(), asientos: [{ token: otro.token, nombre: otro.con.nombre, mazo: otro.mazo, con: otro.con, plazosSeguidos: 0 }, { token: con.token!, nombre: con.nombre, mazo, con, plazosSeguidos: 0 }],
        estado: 'esperando', partida: null, seq: 0, plazo: null, plazoFin: null, creada: Date.now(), terminadaEn: null, revancha: new Set(), ia: null,
      };
      this.salas.set(s.codigo, s);
      this.porToken.set(otro.token, s.codigo);
      this.porToken.set(con.token!, s.codigo);
      this.empezar(s);
      return;
    }
    const entrada = { token: con.token!, con, mazo, desde: Date.now(), temporizador: setTimeout(() => this.contraIA(con.token!), this.plazos.busqueda) };
    this.cola.push(entrada);
    this.enviar(con, { t: 'buscando', segundos: Math.round(this.plazos.busqueda / 1000) });
  }

  /** Nadie aparece: se juega contra la IA del servidor. */
  private contraIA(token: string) {
    const i = this.cola.findIndex((c) => c.token === token);
    if (i < 0) return;
    const [c] = this.cola.splice(i, 1);
    if (c.con.ws.readyState !== 1) return;
    const mazoIA: DefMazo = { ...c.mazo, nombre: 'Mazo de guardia' };
    const s: Sala = {
      codigo: this.nuevoCodigo(), asientos: [{ token, nombre: c.con.nombre, mazo: c.mazo, con: c.con, plazosSeguidos: 0 }, { token: `ia-${randomUUID()}`, nombre: 'IA de guardia', mazo: mazoIA, con: null, plazosSeguidos: 0, ia: true }],
      estado: 'esperando', partida: null, seq: 0, plazo: null, plazoFin: null, creada: Date.now(), terminadaEn: null, revancha: new Set(), ia: null,
    };
    this.salas.set(s.codigo, s);
    this.porToken.set(token, s.codigo);
    this.empezar(s);
  }

  private cancelar(con: Conexion) {
    const i = this.cola.findIndex((c) => c.token === con.token);
    if (i >= 0) { clearTimeout(this.cola[i].temporizador); this.cola.splice(i, 1); }
    const s = this.salaDe(con);
    if (s && s.estado === 'esperando') { this.porToken.delete(con.token!); this.cerrarSala(s); }
  }

  // ————————————————————————————————————— partida
  private empezar(s: Sala) {
    const [a, b] = s.asientos as [Asiento, Asiento];
    s.partida = crearPartida(randomInt(2 ** 31), [
      { nombre: a.nombre, cartas: a.mazo.cartas, tipos: a.mazo.tipos },
      { nombre: b.nombre === a.nombre ? `${b.nombre} (2)` : b.nombre, cartas: b.mazo.cartas, tipos: b.mazo.tipos },
    ]);
    s.estado = 'jugando';
    s.seq = 1;
    s.revancha.clear();
    s.terminadaEn = null;
    this.enviar(a.con, { t: 'emparejado', asiento: 0, rival: b.nombre, codigo: s.codigo, contraIA: !!b.ia });
    this.enviar(b.con, { t: 'emparejado', asiento: 1, rival: a.nombre, codigo: s.codigo });
    this.difundir(s);
  }

  /** Manda a cada jugador su vista y arma el plazo de quien decide. */
  private difundir(s: Sala) {
    const e = s.partida!;
    this.pararTemporizadores(s);
    const d = e.pendiente;
    if (!e.ganador && d && d.tipo !== 'espera') {
      const ms = d.tipo === 'accion' ? this.plazos.accion : this.plazos.sub;
      s.plazoFin = Date.now() + ms;
      const quien = d.jugador as Jug;
      const asiento = s.asientos[quien]!;
      if (asiento.ia) s.ia = setTimeout(() => this.jugarIA(s, quien, 'normal'), 450);
      else s.plazo = setTimeout(() => this.plazoAgotado(s, quien), ms);
    } else s.plazoFin = null;
    for (const j of [0, 1] as Jug[]) {
      const as = s.asientos[j];
      if (as?.con) this.enviar(as.con, { t: 'vista', seq: s.seq, vista: vistaPara(e, j), plazo: s.plazoFin });
    }
    if (e.ganador) this.finalizar(s);
  }

  private pararTemporizadores(s: Sala) {
    if (s.plazo) clearTimeout(s.plazo);
    if (s.ia) clearTimeout(s.ia);
    s.plazo = null;
    s.ia = null;
  }

  private jugarIA(s: Sala, j: Jug, nivel: 'novato' | 'normal') {
    const e = s.partida;
    if (!e || e.ganador || s.estado !== 'jugando' || e.pendiente?.jugador !== j) return;
    const r = decidirIA(vistaPara(e, j), nivel);
    if (!respuestaValida(e, r)) return;
    responder(e, r);
    s.seq++;
    this.difundir(s);
  }

  private plazoAgotado(s: Sala, j: Jug) {
    const as = s.asientos[j];
    if (!as || s.estado !== 'jugando') return;
    as.plazosSeguidos++;
    if (as.plazosSeguidos >= MAX_PLAZOS) {
      terminar(s.partida!, OTRO(j), `${as.nombre} abandona: se le acabó el tiempo tres veces seguidas`);
      s.seq++;
      this.difundir(s);
      return;
    }
    this.jugarIA(s, j, 'novato');
  }

  private responder(con: Conexion, seq: number, r: Parameters<typeof responder>[1]) {
    const s = this.salaDe(con);
    if (!s || s.estado !== 'jugando' || !s.partida) return this.enviar(con, { t: 'error', codigo: 'sala', texto: 'No estás en ninguna partida' });
    const j = this.asientoDe(s, con);
    const e = s.partida;
    if (j === null || e.pendiente?.jugador !== j) return this.enviar(con, { t: 'error', codigo: 'turno', texto: 'No es tu decisión' });
    if (seq !== s.seq) return this.enviar(con, { t: 'error', codigo: 'turno', texto: 'Jugada desfasada' });
    if (!respuestaValida(e, r)) return this.enviar(con, { t: 'error', codigo: 'respuesta', texto: 'Jugada no válida' });
    responder(e, r);
    s.asientos[j]!.plazosSeguidos = 0;
    s.seq++;
    this.difundir(s);
  }

  private emote(con: Conexion, id: string) {
    const s = this.salaDe(con);
    if (!s) return;
    const j = this.asientoDe(s, con);
    if (j === null) return;
    this.enviar(s.asientos[OTRO(j)]?.con, { t: 'emote', de: j, id });
  }

  private abandonar(con: Conexion) {
    const s = this.salaDe(con);
    if (!s || s.estado !== 'jugando' || !s.partida) return;
    const j = this.asientoDe(s, con);
    if (j === null) return;
    terminar(s.partida, OTRO(j), `${s.asientos[j]!.nombre} abandona la campaña`);
    s.seq++;
    this.difundir(s);
  }

  private finalizar(s: Sala) {
    if (s.estado === 'terminada') return;
    s.estado = 'terminada';
    s.terminadaEn = Date.now();
    this.pararTemporizadores(s);
    const g = s.partida!.ganador!;
    for (const as of s.asientos) {
      this.enviar(as?.con, { t: 'fin', ganador: g.jug, motivo: g.motivo });
      if (as?.desconectado) clearTimeout(as.desconectado);
    }
  }

  private pedirRevancha(con: Conexion) {
    const s = this.salaDe(con);
    if (!s || s.estado !== 'terminada') return;
    const j = this.asientoDe(s, con);
    if (j === null) return;
    s.revancha.add(j);
    const otro = s.asientos[OTRO(j)];
    if (otro?.ia) s.revancha.add(OTRO(j));
    this.enviar(otro?.con, { t: 'revancha', pide: j });
    if (s.revancha.size === 2) {
      // en la revancha se cambian los asientos
      s.asientos = [s.asientos[1], s.asientos[0]];
      this.empezar(s);
    }
  }

  // ————————————————————————————————————— desconexiones
  private desconectar(con: Conexion) {
    this.cancelarCola(con);
    const s = this.salaDe(con);
    if (!s) return;
    const j = this.asientoDe(s, con);
    if (j === null) return;
    const as = s.asientos[j]!;
    if (as.con !== con) return; // ya se reconectó con otra conexión
    as.con = null;
    if (s.estado === 'esperando') { this.porToken.delete(as.token); this.cerrarSala(s); return; }
    if (s.estado !== 'jugando') return;
    this.enviar(s.asientos[OTRO(j)]?.con, { t: 'rivalDesconectado', segundos: Math.round(this.plazos.reconexion / 1000) });
    as.desconectado = setTimeout(() => {
      if (as.con || s.estado !== 'jugando') return;
      terminar(s.partida!, OTRO(j), `${as.nombre} se desconecta y no vuelve`);
      s.seq++;
      this.difundir(s);
    }, this.plazos.reconexion);
  }

  private cancelarCola(con: Conexion) {
    const i = this.cola.findIndex((c) => c.con === con);
    if (i >= 0) { clearTimeout(this.cola[i].temporizador); this.cola.splice(i, 1); }
  }

  private reconectar(con: Conexion) {
    const s = this.salaDe(con);
    if (!s) return;
    const j = this.asientoDe(s, con);
    if (j === null) return;
    const as = s.asientos[j]!;
    if (as.desconectado) clearTimeout(as.desconectado);
    as.desconectado = undefined;
    as.con = con;
    as.nombre = as.nombre || con.nombre;
    if (s.estado === 'esperando') return this.enviar(con, { t: 'sala', codigo: s.codigo });
    const rival = s.asientos[OTRO(j)]!;
    this.enviar(con, { t: 'emparejado', asiento: j, rival: rival.nombre, codigo: s.codigo, contraIA: !!rival.ia });
    this.enviar(rival.con, { t: 'rivalReconectado' });
    if (s.partida) this.enviar(con, { t: 'vista', seq: s.seq, vista: vistaPara(s.partida, j), plazo: s.plazoFin });
    if (s.estado === 'terminada' && s.partida?.ganador) this.enviar(con, { t: 'fin', ganador: s.partida.ganador.jug, motivo: s.partida.ganador.motivo });
  }

  private cerrarSala(s: Sala) {
    this.pararTemporizadores(s);
    for (const as of s.asientos) {
      if (as) { if (as.desconectado) clearTimeout(as.desconectado); if (this.porToken.get(as.token) === s.codigo) this.porToken.delete(as.token); }
    }
    this.salas.delete(s.codigo);
  }

  private limpiar() {
    const ahora = Date.now();
    for (const s of this.salas.values()) {
      if (s.estado === 'esperando' && ahora - s.creada > 10 * 60_000) this.cerrarSala(s);
      else if (s.estado === 'terminada' && s.terminadaEn && ahora - s.terminadaEn > 2 * 60_000) this.cerrarSala(s);
      else if (s.estado === 'jugando' && ahora - s.creada > 3 * 3600_000) this.cerrarSala(s);
    }
  }
}
