// Pide decisiones a la IA en un Web Worker (si el navegador no puede, decide en el hilo principal).
import type { Nivel } from './bot';
import type { Respuesta, Vista } from '../motor/tipos';
import Trabajador from './trabajador?worker&inline';

let trabajador: Worker | null = null;
let fallo = false;
let sig = 1;
const pendientes = new Map<number, (r: Respuesta | null) => void>();

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
    trabajador.onerror = () => { fallo = true; for (const f of pendientes.values()) f(null); pendientes.clear(); trabajador = null; };
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
    const r = await new Promise<Respuesta | null>((res) => { pendientes.set(pid, res); w.postMessage({ vista, nivel, semilla, pid }); });
    if (r) return r;
  }
  const { decidirIA } = await import('./bot');
  return decidirIA(vista, nivel, semilla);
}
