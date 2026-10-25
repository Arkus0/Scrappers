import WebSocket from 'ws';
import { crearServidor, type ServidorEnMarcha } from '../servidor/index';
import { respuestaAzar } from '../src/ia/azar';
import { MAZOS_INICIALES } from '../src/datos/mazos-iniciales';
import { VERSION_JUEGO, type MsgServidor } from '../src/red/protocolo';
import type { Vista } from '../src/motor/tipos';
import { OTRO } from '../src/motor/tipos';

/** Cliente de pruebas: responde al azar a sus decisiones y guarda lo que recibe. */
class ClientePrueba {
  ws!: WebSocket;
  mensajes: MsgServidor[] = [];
  token = '';
  vista: Vista | null = null;
  seq = 0;
  fin: Extract<MsgServidor, { t: 'fin' }> | null = null;
  rng = { rng: 7 };
  responderSolo = true;
  constructor(private url: string, public nombre: string, semilla = 7) { this.rng.rng = semilla; }

  conectar(token?: string): Promise<void> {
    return new Promise((ok, mal) => {
      this.ws = new WebSocket(this.url.replace('http', 'ws') + '/ws');
      this.ws.on('open', () => this.enviar({ t: 'hola', version: VERSION_JUEGO, nombre: this.nombre, token }));
      this.ws.on('error', mal);
      this.ws.on('message', (d) => {
        const m = JSON.parse(String(d)) as MsgServidor;
        this.mensajes.push(m);
        if (m.t === 'bienvenida') { this.token = m.token; ok(); }
        if (m.t === 'vista') { this.vista = m.vista; this.seq = m.seq; this.jugar(); }
        if (m.t === 'fin') this.fin = m;
      });
    });
  }

  enviar(m: unknown) { this.ws.send(JSON.stringify(m)); }

  jugar() {
    const v = this.vista;
    if (!this.responderSolo || !v || !v.pendiente || v.pendiente.tipo === 'espera' || v.pendiente.jugador !== v.yo) return;
    this.enviar({ t: 'responder', seq: this.seq, respuesta: respuestaAzar(v.pendiente, this.rng) });
  }

  esperar(cond: () => boolean, ms = 30000): Promise<void> {
    return new Promise((ok, mal) => {
      const t0 = Date.now();
      const tick = () => { if (cond()) ok(); else if (Date.now() - t0 > ms) mal(new Error(`Tiempo agotado esperando (${this.nombre})`)); else setTimeout(tick, 10); };
      tick();
    });
  }

  cerrar() { this.ws.terminate(); }
}

const mazo = (i: number) => ({ nombre: MAZOS_INICIALES[i].nombre, cartas: MAZOS_INICIALES[i].cartas, tipos: MAZOS_INICIALES[i].tipos });

describe('Servidor online', () => {
  let srv: ServidorEnMarcha;
  beforeEach(async () => { srv = await crearServidor({ puerto: 0, raiz: 'dist', plazos: { accion: 4000, sub: 4000, reconexion: 3000, busqueda: 400 } }); });
  afterEach(async () => { await srv.cerrar(); });

  it('/salud responde', async () => {
    const r = await fetch(`${srv.url}/salud`);
    expect((await r.json()).ok).toBe(true);
  });

  it('dos clientes crean sala, se unen y terminan una partida con el mismo resultado', async () => {
    const a = new ClientePrueba(srv.url, 'Ana', 3);
    const b = new ClientePrueba(srv.url, 'Bea', 5);
    await a.conectar();
    await b.conectar();
    a.enviar({ t: 'crearSala', mazo: mazo(0) });
    await a.esperar(() => a.mensajes.some((m) => m.t === 'sala'));
    const codigo = (a.mensajes.find((m) => m.t === 'sala') as Extract<MsgServidor, { t: 'sala' }>).codigo;
    expect(codigo).toMatch(/^[A-Z]{4}$/);
    b.enviar({ t: 'unirse', codigo: codigo.toLowerCase(), mazo: mazo(1) });
    await a.esperar(() => !!a.fin && !!b.fin, 60000);
    expect(a.fin).toEqual(b.fin);
    // ninguna vista enseñó la mano ni el mazo del rival
    for (const c of [a, b]) {
      for (const m of c.mensajes) {
        if (m.t !== 'vista') continue;
        const rv = m.vista.jugadores[OTRO(m.vista.yo)];
        if (!rv.manoVista) for (const u of rv.mano) expect(m.vista.cartaDe[u]).toBeUndefined();
        expect(m.vista.rng).toBe(0);
        expect(m.vista.jugadores[0].mazo.every((u) => u === -1)).toBe(true);
      }
    }
    a.cerrar(); b.cerrar();
  });

  it('rechaza jugadas fuera de turno, mazos ilegales y versiones distintas', async () => {
    const a = new ClientePrueba(srv.url, 'Ana');
    await a.conectar();
    a.enviar({ t: 'crearSala', mazo: { nombre: 'x', cartas: ['B-01'], tipos: ['rojo'] } });
    await a.esperar(() => a.mensajes.some((m) => m.t === 'error' && m.codigo === 'mazo'));
    a.enviar({ t: 'responder', seq: 1, respuesta: { tipo: 'opcion', i: 0 } });
    await a.esperar(() => a.mensajes.some((m) => m.t === 'error' && m.codigo === 'sala'));
    const v = new WebSocket(srv.url.replace('http', 'ws') + '/ws');
    const errores: string[] = [];
    await new Promise<void>((ok) => {
      v.on('open', () => v.send(JSON.stringify({ t: 'hola', version: 'vieja', nombre: 'x' })));
      v.on('message', (d) => { const m = JSON.parse(String(d)); if (m.t === 'error') { errores.push(m.codigo); ok(); } });
    });
    expect(errores).toContain('version');
    v.terminate(); a.cerrar();
  });

  it('un jugador que se cae puede volver con su token y la partida termina', async () => {
    const a = new ClientePrueba(srv.url, 'Ana', 11);
    const b = new ClientePrueba(srv.url, 'Bea', 13);
    await a.conectar(); await b.conectar();
    a.enviar({ t: 'buscar', mazo: mazo(2) });
    b.enviar({ t: 'buscar', mazo: mazo(3) });
    await a.esperar(() => a.mensajes.some((m) => m.t === 'emparejado') && b.mensajes.some((m) => m.t === 'emparejado'));
    await a.esperar(() => a.seq > 6 || !!a.fin);
    const token = a.token;
    a.cerrar();
    await b.esperar(() => b.mensajes.some((m) => m.t === 'rivalDesconectado') || !!b.fin);
    const a2 = new ClientePrueba(srv.url, 'Ana', 17);
    await a2.conectar(token);
    expect(a2.token).toBe(token);
    await a2.esperar(() => !!a2.fin && !!b.fin, 60000);
    expect(a2.fin!.ganador).toBe(b.fin!.ganador);
    a2.cerrar(); b.cerrar();
  });

  it('si nadie responde, la IA juega por él y al tercer plazo pierde', async () => {
    await srv.cerrar();
    srv = await crearServidor({ puerto: 0, raiz: 'dist', plazos: { accion: 60, sub: 60, reconexion: 3000, busqueda: 400 } });
    const a = new ClientePrueba(srv.url, 'Ana');
    const b = new ClientePrueba(srv.url, 'Bea');
    a.responderSolo = false; b.responderSolo = false;
    await a.conectar(); await b.conectar();
    a.enviar({ t: 'crearSala', mazo: mazo(0) });
    await a.esperar(() => a.mensajes.some((m) => m.t === 'sala'));
    const codigo = (a.mensajes.find((m) => m.t === 'sala') as Extract<MsgServidor, { t: 'sala' }>).codigo;
    b.enviar({ t: 'unirse', codigo, mazo: mazo(1) });
    await a.esperar(() => !!a.fin, 30000);
    expect(a.fin!.motivo).toMatch(/tiempo|abandona/);
    a.cerrar(); b.cerrar();
  });

  it('sin rival en la cola, se juega contra la IA de guardia', async () => {
    const a = new ClientePrueba(srv.url, 'Ana', 23);
    await a.conectar();
    a.enviar({ t: 'buscar', mazo: mazo(0) });
    await a.esperar(() => a.mensajes.some((m) => m.t === 'emparejado' && m.contraIA));
    await a.esperar(() => !!a.fin, 60000);
    a.cerrar();
  });
});
