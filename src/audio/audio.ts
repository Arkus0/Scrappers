// Sintetizador chiptune con Web Audio: música por pistas (pulso, triángulo, ruido) y efectos de sonido.
// No hay archivos de audio: todo se genera al vuelo. Sin AudioContext (Node, navegadores viejos) todo es mudo.
import { TEMAS, type Canal, type DefTema, type TemaId } from './temas';

// ————————————————————————————————————— partituras
const NOTAS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** «C#5» → frecuencia en Hz (La4 = 440). */
export function frecuencia(nota: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(nota);
  if (!m) throw new Error(`Nota no válida: ${nota}`);
  const semitono = NOTAS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * 2 ** ((semitono - 69) / 12);
}

export interface Evento {
  paso: number;
  pasos: number;
  /** frecuencia, o la pieza de percusión en el canal de ruido */
  tono: number | 'k' | 's' | 'h';
}

export interface PistaLista {
  canal: Canal;
  ciclo: number;
  vol: number;
  eventos: Evento[];
  pasos: number;
}

export function leerPista(canal: Canal, notas: string): { eventos: Evento[]; pasos: number } {
  const eventos: Evento[] = [];
  let paso = 0;
  for (const tok of notas.trim().split(/\s+/)) {
    const [n, d] = tok.split(':');
    const pasos = Number(d);
    if (!Number.isInteger(pasos) || pasos <= 0) throw new Error(`Duración no válida: ${tok}`);
    if (n !== '-') {
      if (canal === 'ruido') {
        if (n !== 'k' && n !== 's' && n !== 'h') throw new Error(`Percusión no válida: ${tok}`);
        eventos.push({ paso, pasos, tono: n });
      } else eventos.push({ paso, pasos, tono: frecuencia(n) });
    }
    paso += pasos;
  }
  return { eventos, pasos: paso };
}

export function prepararTema(t: DefTema): { pistas: PistaLista[]; pasos: number } {
  const pistas = t.pistas.map((p) => ({ canal: p.canal, ciclo: p.ciclo ?? 0.5, vol: p.vol, ...leerPista(p.canal, p.notas) }));
  return { pistas, pasos: Math.max(...pistas.map((p) => p.pasos)) };
}

const PREPARADOS = new Map<TemaId, ReturnType<typeof prepararTema>>();
const preparado = (id: TemaId) => {
  if (!PREPARADOS.has(id)) PREPARADOS.set(id, prepararTema(TEMAS[id]));
  return PREPARADOS.get(id)!;
};

// ————————————————————————————————————— motor de audio
let ctx: AudioContext | null = null;
let busMusica: GainNode | null = null;
let busEfectos: GainNode | null = null;
let ruido: AudioBuffer | null = null;
const ondasPulso = new Map<number, PeriodicWave>();
let volMusica = 0.6;
let volEfectos = 0.8;

function contexto(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    return null;
  }
  const comp = ctx.createDynamicsCompressor();
  comp.connect(ctx.destination);
  busMusica = ctx.createGain();
  busEfectos = ctx.createGain();
  busMusica.connect(comp);
  busEfectos.connect(comp);
  busMusica.gain.value = volMusica * 0.5;
  busEfectos.gain.value = volEfectos * 0.6;
  ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = ruido.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

/** Onda de pulso con el ciclo de trabajo de las consolas de 8 bits (serie de Fourier). */
function ondaPulso(c: AudioContext, ciclo: number): PeriodicWave {
  let w = ondasPulso.get(ciclo);
  if (w) return w;
  const n = 48;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * ciclo);
  w = c.createPeriodicWave(real, imag);
  ondasPulso.set(ciclo, w);
  return w;
}

/** Los navegadores solo dejan sonar audio tras un gesto: se llama en el primer toque o clic. */
export function desbloquearAudio() {
  const c = contexto();
  if (c && c.state === 'suspended') void c.resume();
  if (pendiente) { const t = pendiente; pendiente = null; tocarTema(t); }
}

export function volumenes(musica: number, efectos: number) {
  volMusica = musica;
  volEfectos = efectos;
  if (ctx && busMusica && busEfectos) {
    busMusica.gain.setTargetAtTime(musica * 0.5, ctx.currentTime, 0.05);
    busEfectos.gain.setTargetAtTime(efectos * 0.6, ctx.currentTime, 0.05);
  }
}

function nota(c: AudioContext, destino: AudioNode, canal: Canal, ciclo: number, tono: number, t: number, dur: number, vol: number) {
  const o = c.createOscillator();
  if (canal === 'triangulo') o.type = 'triangle';
  else o.setPeriodicWave(ondaPulso(c, ciclo));
  o.frequency.setValueAtTime(tono, t);
  const g = c.createGain();
  // envolvente corta: ataque, caída a sostenido y suelta antes de la siguiente nota
  const fin = t + Math.max(0.03, dur * 0.92);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.006);
  g.gain.setTargetAtTime(vol * (canal === 'triangulo' ? 0.9 : 0.7), t + 0.01, 0.08);
  g.gain.setTargetAtTime(0, fin - 0.02, 0.012);
  o.connect(g).connect(destino);
  o.start(t);
  o.stop(fin + 0.05);
}

function percusion(c: AudioContext, destino: AudioNode, pieza: 'k' | 's' | 'h', t: number, vol: number) {
  if (pieza === 'k') {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const g = c.createGain();
    g.gain.setValueAtTime(vol * 1.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g).connect(destino);
    o.start(t);
    o.stop(t + 0.18);
    return;
  }
  const s = c.createBufferSource();
  s.buffer = ruido;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = pieza === 's' ? 1200 : 7000;
  const g = c.createGain();
  const dur = pieza === 's' ? 0.12 : 0.035;
  g.gain.setValueAtTime(vol * (pieza === 's' ? 1 : 0.5), t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(destino);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.02);
}

// ————————————————————————————————————— secuenciador
interface Sonando {
  id: TemaId;
  salida: GainNode;
  inicio: number;
  paso: number;
  temporizador: number;
}
let sonando: Sonando | null = null;
let pendiente: TemaId | null = null;
let ultimo: TemaId | null = null;
const ANTICIPO = 0.25;

/** Cambia la música (si ya suena ese tema no hace nada). null = silencio. */
export function tocarTema(id: TemaId | null) {
  if (id === ultimo && (sonando || pendiente === id)) return;
  ultimo = id;
  const c = contexto();
  pararActual();
  if (!id || !c || !busMusica) return;
  // aún sin gesto del usuario: se toca en cuanto llegue
  if (c.state === 'suspended') { pendiente = id; void c.resume().then(() => { if (pendiente === id) { pendiente = null; arrancar(c, id); } }).catch(() => {}); return; }
  pendiente = null;
  arrancar(c, id);
}

function arrancar(c: AudioContext, id: TemaId) {
  if (sonando || !busMusica) return;
  const tema = preparado(id);
  const def = TEMAS[id];
  const seg = 60 / def.bpm / 4;
  const salida = c.createGain();
  salida.gain.value = 1;
  salida.connect(busMusica);
  const s: Sonando = { id, salida, inicio: c.currentTime + 0.08, paso: 0, temporizador: 0 };
  const programar = () => {
    while (s.inicio + s.paso * seg < c.currentTime + ANTICIPO) {
      if (!def.bucle && s.paso >= tema.pasos) {
        window.clearInterval(s.temporizador);
        if (sonando === s) sonando = null;
        return;
      }
      const t = s.inicio + s.paso * seg;
      const enBucle = s.paso % tema.pasos;
      for (const p of tema.pistas) {
        for (const ev of p.eventos) {
          if (ev.paso !== enBucle) continue;
          if (typeof ev.tono === 'number') nota(c, salida, p.canal, p.ciclo, ev.tono, t, ev.pasos * seg, p.vol);
          else percusion(c, salida, ev.tono, t, p.vol);
        }
      }
      s.paso++;
    }
  };
  s.temporizador = window.setInterval(programar, 40);
  sonando = s;
  programar();
}

function pararActual() {
  pendiente = null;
  if (!sonando || !ctx) { sonando = null; return; }
  const s = sonando;
  sonando = null;
  window.clearInterval(s.temporizador);
  s.salida.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  window.setTimeout(() => s.salida.disconnect(), 600);
}

// ————————————————————————————————————— efectos
export type Efecto = 'clic' | 'carta' | 'golpe' | 'cura' | 'ko' | 'moneda' | 'maniobra' | 'turno' | 'girar' | 'rara' | 'shiny' | 'error';

/** Secuencias cortas: [nota, duración en s, ciclo]. */
const MELODIAS: Partial<Record<Efecto, [string, number, number][]>> = {
  clic: [['C6', 0.03, 0.5]],
  carta: [['E5', 0.04, 0.25], ['A5', 0.06, 0.25]],
  cura: [['C5', 0.06, 0.5], ['E5', 0.06, 0.5], ['G5', 0.06, 0.5], ['C6', 0.12, 0.5]],
  moneda: [['B5', 0.07, 0.5], ['E6', 0.22, 0.5]],
  maniobra: [['F#5', 0.05, 0.125], ['C6', 0.05, 0.125], ['F#5', 0.05, 0.125], ['C6', 0.12, 0.125]],
  turno: [['G5', 0.08, 0.25], ['D6', 0.16, 0.25]],
  girar: [['A5', 0.03, 0.125], ['E6', 0.05, 0.125]],
  rara: [['C5', 0.06, 0.25], ['E5', 0.06, 0.25], ['G5', 0.06, 0.25], ['C6', 0.06, 0.25], ['E6', 0.06, 0.25], ['G6', 0.25, 0.25]],
  shiny: [['E6', 0.05, 0.125], ['G#6', 0.05, 0.125], ['B6', 0.05, 0.125], ['E7', 0.05, 0.125], ['B6', 0.05, 0.125], ['E7', 0.05, 0.125], ['G#7', 0.3, 0.125]],
  error: [['C4', 0.08, 0.5], ['B3', 0.16, 0.5]],
};

export function sonido(e: Efecto) {
  const c = contexto();
  if (!c || !busEfectos || c.state !== 'running' || volEfectos <= 0) return;
  const t0 = c.currentTime + 0.01;
  if (e === 'golpe' || e === 'ko') {
    // barrido descendente + ráfaga de ruido
    const o = c.createOscillator();
    o.setPeriodicWave(ondaPulso(c, 0.5));
    const largo = e === 'ko' ? 0.6 : 0.16;
    o.frequency.setValueAtTime(e === 'ko' ? 900 : 420, t0);
    o.frequency.exponentialRampToValueAtTime(e === 'ko' ? 60 : 90, t0 + largo);
    const g = c.createGain();
    g.gain.setValueAtTime(0.32, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + largo);
    o.connect(g).connect(busEfectos);
    o.start(t0);
    o.stop(t0 + largo + 0.02);
    percusion(c, busEfectos, 's', t0, 0.5);
    return;
  }
  let t = t0;
  for (const [n, d, ciclo] of MELODIAS[e] ?? []) {
    nota(c, busEfectos, 'pulso', ciclo, frecuencia(n), t, d, 0.3);
    t += d;
  }
}
