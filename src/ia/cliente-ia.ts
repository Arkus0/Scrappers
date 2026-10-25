// Pide decisiones a la IA en un Web Worker. Si el navegador no puede (p. ej. al abrir el HTML como archivo suelto)
// o el trabajador no contesta a tiempo, decide en el hilo principal: la partida nunca se queda colgada.
import type { Nivel } from './bot';
import type { Decision, Respuesta, Vista } from '../motor/tipos';
import Trabajador from './trabajador?worker&inline';

let trabajador: Worker | null = null;
let fallo = typeof location !== 'undefined' && location.protocol === 'file:';
let sig = 1;
const pendientes = new Map<number, (r: Respuesta | null) => void>();
const PLAZO = 6000;

function obtener(): Worker | null {
  if (fallo) return null;
  if (trabajador) return trabajador;
  try {
    trabajador = new Trabajador();
    trabajador.onmessage = (ev: MessageEvent<{ pid: number; r?: Respuesta; error?: string }>) => {
      const f = pendientes.get(ev.data.pid);
      pendientes.delete(ev.data.pid);
      f?.(ev.data.r ?? null);
    };
    const caer = () => { fallo = true; for (const f of pendientes.values()) f(null); pendientes.clear(); trabajador?.terminate(); trabajador = null; };
    trabajador.onerror = caer;
    trabajador.onmessageerror = caer;
    return trabajador;
  } catch {
    fallo = true;
    return null;
  }
}

export async function pedirDecision(vista: Vista, nivel: Nivel): Promise<Respuesta> {
  const semilla = (Math.random() * 2 ** 31) | 0;
  const w = obtener();
  if (w) {
    const pid = sig++;
    const r = await new Promise<Respuesta | null>((res) => {
      pendientes.set(pid, res);
      w.postMessage({ vista, nivel, semilla, pid });
      setTimeout(() => { if (pendientes.has(pid)) { pendientes.delete(pid); fallo = true; res(null); } }, PLAZO);
    });
    if (r) return r;
  }
  const { decidirIA } = await import('./bot');
  try {
    return decidirIA(vista, nivel, semilla);
  } catch {
    const { respuestaAzar } = await import('./azar');
    return respuestaAzar(vista.pendiente as Decision, { rng: semilla });
  }
}
