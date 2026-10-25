// Motor de «176 TCG».
// La partida es una pila de tareas: cada tarea avanza sola o se detiene en una Decision que responde
// un jugador (persona, IA o cliente remoto). Todo el estado es serializable y determinista con su semilla.
import { carta, esPolitico } from '../datos/catalogo';
import { PARTIDOS } from '../datos/partidos';
import { aleatorio, barajar, elegirAzar, moneda } from './rng';
import {
  accionesLegales, aguanteMax, APOYOS_INVESTIDURA, cartaUid, clave, CLIMA_INICIAL, conocida, contar, costeRelevo, cumpleCond,
  cumpleFiltroCarta, cumpleFiltroPol, DANO_DEBILIDAD, DANO_SIN_FONDOS, enJuego, idDe, MAX_BANQUILLO, MAX_MANO, modificadores,
  NOMBRES_CLIMA, opcionesDedazo, PARTIDOS_INVESTIDURA, polUid, protegido, PUNTOS_VICTORIA, RONDAS_MAX, tiposDe, ubicar,
} from './reglas';
import type {
  AccionJuego, Carta, CartaEntrenador, CartaPolitico, CartaTertuliano, Ctx, Decision, DisparoManiobra, EnJuego,
  EstadoAlterado, Jug, Jugador, Partida, Respuesta, Sel, Suceso, Tarea, Tipo, Uid,
} from './tipos';
import { OTRO } from './tipos';

export interface MazoPartida {
  nombre: string;
  /** ids de carta; las Shiny llevan «*» */
  cartas: string[];
  tipos: Tipo[];
}

const nombre = (e: Partida, uid: Uid) => `«${cartaUid(e, uid).nombre}»`;
const quien = (e: Partida, j: Jug) => e.jugadores[j].nombre;

// ————————————————————————————————————— utilidades
export function log(e: Partida, texto: string, jug: Jug | null = null, solo?: Jug) {
  if (e.silencio) return;
  e.registro.push({ turno: e.turno, jug, texto, solo });
  if (e.registro.length > 400) e.registro.splice(0, e.registro.length - 400);
}

function suceso(e: Partida, s: Suceso) {
  if (e.silencio) return;
  e.sucesos.push(s);
  if (e.sucesos.length > 400) e.sucesos.splice(0, e.sucesos.length - 400);
}

function encolar(e: Partida, ...tareas: Tarea[]) {
  for (let i = tareas.length - 1; i >= 0; i--) e.pila.push(tareas[i]);
}

function decidir(e: Partida, d: Decision): false {
  e.pendiente = d;
  return false;
}

function nuevoUid(e: Partida, id: string): Uid {
  const u = e.sigUid++;
  e.cartaDe[u] = id;
  return u;
}

/** Mete una carta en un mazo con un uid nuevo (para que nadie pueda seguirle la pista). */
function aMazo(e: Partida, j: Jug, uid: Uid, arriba = false) {
  const id = idDe(e, uid);
  delete e.cartaDe[uid];
  const n = nuevoUid(e, id);
  if (arriba) e.jugadores[j].mazo.push(n);
  else e.jugadores[j].mazo.unshift(n);
}

function barajarMazo(e: Partida, j: Jug) {
  const p = e.jugadores[j];
  const ids = barajar(e, p.mazo.map((u) => idDe(e, u)));
  for (const u of p.mazo) delete e.cartaDe[u];
  p.mazo = ids.map((id) => nuevoUid(e, id));
}

function tirarMoneda(e: Partida, jug: Jug): boolean {
  const c = moneda(e);
  suceso(e, { s: 'moneda', cara: c, jug });
  log(e, `Moneda: ${c ? 'cara' : 'cruz'}`, jug);
  return c;
}

export function terminar(e: Partida, jug: Jug | null, motivo: string) {
  if (e.ganador) return;
  e.ganador = { jug, motivo };
  e.fase = 'fin';
  e.pendiente = null;
  e.pila = [];
  log(e, jug === null ? `Repetición electoral. ${motivo}` : `¡${quien(e, jug)} gana! ${motivo}`, jug);
  suceso(e, { s: 'fin', ganador: jug, motivo });
}

function comprobarVictoria(e: Partida) {
  if (e.ganador) return;
  const [a, b] = e.jugadores;
  const va = a.puntos >= PUNTOS_VICTORIA;
  const vb = b.puntos >= PUNTOS_VICTORIA;
  if (va || vb) {
    if (va && vb) {
      if (a.puntos === b.puntos) terminar(e, null, 'Los dos llegan a la mayoría a la vez');
      else terminar(e, a.puntos > b.puntos ? 0 : 1, 'Mayoría absoluta: 176 escaños');
    } else terminar(e, va ? 0 : 1, 'Mayoría absoluta: 176 escaños');
    return;
  }
  const sinA = enJuego(e, 0).length === 0;
  const sinB = enJuego(e, 1).length === 0;
  if (sinA || sinB) {
    if (sinA && sinB) terminar(e, null, 'Ninguno de los dos tiene candidatos');
    else terminar(e, sinA ? 1 : 0, `${quien(e, sinA ? 0 : 1)} se queda sin candidatos`);
  }
}

export function sumarPuntos(e: Partida, j: Jug, n: number) {
  if (!n || e.ganador) return;
  e.jugadores[j].puntos = Math.max(0, e.jugadores[j].puntos + n);
  log(e, `${quien(e, j)} suma ${n} punto${n === 1 ? '' : 's'} (${e.jugadores[j].puntos})`, j);
  comprobarVictoria(e);
}

function cambiarClima(e: Partida, n: number, culpable: Jug) {
  if (!n || e.ganador) return;
  const antes = e.clima;
  const nuevo = Math.max(1, Math.min(5, e.clima + n));
  if (nuevo === antes) return;
  e.clima = nuevo;
  log(e, `Clima de campaña: ${NOMBRES_CLIMA[antes]} → ${NOMBRES_CLIMA[nuevo]}`, culpable);
  suceso(e, { s: 'clima', antes, despues: nuevo });
  if (nuevo === 1) {
    suceso(e, { s: 'ruptura', culpable });
    log(e, `¡Ruptura! ${quien(e, culpable)} lleva la campaña al barro y lo paga`, culpable);
    e.clima = 3;
    sumarPuntos(e, OTRO(culpable), 1);
  }
}

function robar(e: Partida, j: Jug, n = 1): number {
  const p = e.jugadores[j];
  let robadas = 0;
  for (let i = 0; i < n; i++) {
    if (p.mazo.length === 0 || p.mano.length >= MAX_MANO) break;
    const u = p.mazo.pop()!;
    p.mano.push(u);
    robadas++;
    log(e, `Robas ${nombre(e, u)}`, j, j);
  }
  return robadas;
}

/** Saca a un político del juego y deja sus cartas en el descarte. */
function retirarDelJuego(e: Partida, j: Jug, ej: EnJuego, destino: 'descarte' | 'mano' = 'descarte') {
  const p = e.jugadores[j];
  if (p.tribuna === ej) p.tribuna = null;
  else p.banquillo = p.banquillo.filter((x) => x !== ej);
  const cartas = [...ej.debajo, ej.uid];
  if (destino === 'mano') {
    for (const u of cartas) p.mano.push(u);
  } else {
    for (const u of cartas) p.descarte.push(u);
  }
  if (ej.herramienta !== null) p.descarte.push(ej.herramienta);
  e.temporales = e.temporales.filter((t) => t.uid !== ej.uid);
}

function aplicarDano(e: Partida, uid: Uid, n: number) {
  const u = ubicar(e, uid);
  if (!u || n <= 0) return;
  u.ej.dano += n;
  suceso(e, { s: 'dano', uid, n, jug: u.jug });
  log(e, `${nombre(e, uid)} recibe ${n} de desgaste`, u.jug);
  // Carisma «al recibir daño»
  const c = polUid(e, uid);
  if (c.carisma?.disparo === 'alRecibirDano' && c.carisma.efectos) {
    encolar(e, { t: 'efectos', lista: c.carisma.efectos, i: 0, ctx: { yo: u.jug, fuente: uid, origen: 'carisma' } });
  }
}

function curar(e: Partida, uid: Uid, n: number | 'todo') {
  const u = ubicar(e, uid);
  if (!u || u.ej.dano <= 0) return;
  const extra = modificadores(e, uid).curacion + (e.clima === 5 ? 10 : 0);
  const q = n === 'todo' ? u.ej.dano : Math.min(u.ej.dano, n + extra);
  u.ej.dano -= q;
  suceso(e, { s: 'cura', uid, n: q, jug: u.jug });
  log(e, `${nombre(e, uid)} recupera ${q} de aguante`, u.jug);
}

function ponerEstado(e: Partida, uid: Uid, estado: EstadoAlterado) {
  const u = ubicar(e, uid);
  if (!u || !u.tribuna) return; // los estados solo afectan a la tribuna
  if (modificadores(e, uid).inmuneEstados) {
    log(e, `${nombre(e, uid)} es inmune a los estados`, u.jug);
    return;
  }
  const ex: EstadoAlterado[] = ['desconectado', 'bloqueado', 'desnortado'];
  if (ex.includes(estado)) for (const x of ex) delete u.ej.estados[x];
  // Bloqueado dura hasta el final del siguiente turno de su dueño
  u.ej.estados[estado] = estado === 'bloqueado' ? (u.jug === e.enTurno ? e.turno + 2 : e.turno + 1) : 1;
  suceso(e, { s: 'estado', uid, estado, jug: u.jug });
  const txt: Record<EstadoAlterado, string> = { sospecha: 'queda bajo sospecha', quemado: 'está quemado', desconectado: 'se desconecta', bloqueado: 'queda bloqueado', desnortado: 'está desnortado' };
  log(e, `${nombre(e, uid)} ${txt[estado]}`, u.jug);
}

function aBanquilloSinEstados(ej: EnJuego) {
  ej.estados = {};
}

// ————————————————————————————————————— crear partida
function prepararMazo(e: Partida, j: Jug, m: MazoPartida) {
  const p = e.jugadores[j];
  // se baraja antes de dar uids: el orden de los uid no revela nada del mazo
  let ids = barajar(e, [...m.cartas]);
  // la mano inicial siempre trae un Básico (si el mazo tiene alguno)
  const esBasico = (id: string) => { const c = carta(id); return esPolitico(c) && c.fase === 'basico'; };
  if (ids.some(esBasico)) {
    let intentos = 0;
    while (!ids.slice(-5).some(esBasico) && intentos++ < 50) ids = barajar(e, ids);
    if (!ids.slice(-5).some(esBasico)) {
      const i = ids.findIndex(esBasico);
      [ids[i], ids[ids.length - 1]] = [ids[ids.length - 1], ids[i]];
    }
  }
  p.mazo = ids.map((id) => nuevoUid(e, id));
  for (let i = 0; i < 5; i++) p.mano.push(p.mazo.pop()!);
}

function jugadorVacio(m: MazoPartida): Jugador {
  return {
    nombre: m.nombre, tipos: m.tipos.length ? [...m.tipos] : ['rojo'], lista: m.cartas.map((x) => (x.endsWith('*') ? x.slice(0, -1) : x)),
    mazo: [], mano: [], descarte: [], tribuna: null, banquillo: [], plato: [], maniobras: [], puntos: 0, apoyos: [],
    votoActual: null, votoSiguiente: m.tipos[0] ?? 'rojo', revelado: false, manoVista: false,
  };
}

export function crearPartida(semilla: number, mazos: [MazoPartida, MazoPartida]): Partida {
  const e: Partida = {
    v: 1, rng: semilla | 0, turno: 0, enTurno: 0, primero: 0, fase: 'preparacion',
    jugadores: [jugadorVacio(mazos[0]), jugadorVacio(mazos[1])], cartaDe: {}, sigUid: 1, escenario: null, clima: CLIMA_INICIAL,
    flags: { voto: false, asesor: false, relevo: false, escenario: false, jugadas: 0, votoExtra: 0 }, temporales: [], ataque: null,
    anulada: false, pila: [], pendiente: null, registro: [], sucesos: [], ganador: null,
  };
  aleatorio(e); // descarta el primer valor de la semilla
  prepararMazo(e, 0, mazos[0]);
  prepararMazo(e, 1, mazos[1]);
  for (const j of [0, 1] as Jug[]) e.jugadores[j].votoSiguiente = elegirAzar(e, e.jugadores[j].tipos);
  e.primero = moneda(e) ? 0 : 1;
  log(e, `Sorteo: empieza ${quien(e, e.primero)}`);
  encolar(e, { t: 'preparar', jug: 0, paso: 0 }, { t: 'preparar', jug: 0, paso: 1 }, { t: 'preparar', jug: 1, paso: 0 }, { t: 'preparar', jug: 1, paso: 1 }, { t: 'revelar' }, { t: 'inicioTurno' });
  avanzar(e);
  return e;
}

// ————————————————————————————————————— bucle
export function avanzar(e: Partida) {
  let guarda = 0;
  while (!e.pendiente && !e.ganador && e.pila.length) {
    if (++guarda > 20000) throw new Error('Bucle infinito en el motor');
    const t = e.pila[e.pila.length - 1];
    if (paso(e, t, undefined)) quitarTarea(e, t);
  }
}

function quitarTarea(e: Partida, t: Tarea) {
  const i = e.pila.lastIndexOf(t);
  if (i >= 0) e.pila.splice(i, 1);
}

export function responder(e: Partida, r: Respuesta): Partida {
  const d = e.pendiente;
  if (!d) throw new Error('No hay ninguna decisión pendiente');
  validar(e, d, r);
  e.pendiente = null;
  const t = e.pila[e.pila.length - 1];
  if (paso(e, t, r)) quitarTarea(e, t);
  avanzar(e);
  return e;
}

export function respuestaValida(e: Partida, r: Respuesta): boolean {
  try {
    if (!e.pendiente) return false;
    validar(e, e.pendiente, r);
    return true;
  } catch {
    return false;
  }
}

function validar(_e: Partida, d: Decision, r: Respuesta) {
  if (d.tipo === 'espera') throw new Error('Decisión ajena');
  if (d.tipo !== r.tipo) throw new Error(`Respuesta de tipo ${r.tipo} para una decisión ${d.tipo}`);
  if (d.tipo === 'accion' && r.tipo === 'accion') {
    const k = clave(r.accion);
    if (!d.acciones.some((a) => clave(a) === k)) throw new Error(`Acción no legal: ${k}`);
  } else if ((d.tipo === 'objetivo' || d.tipo === 'cartas') && (r.tipo === 'objetivo' || r.tipo === 'cartas')) {
    const set = new Set(r.uids);
    if (set.size !== r.uids.length) throw new Error('Elección repetida');
    if (r.uids.length < d.min || r.uids.length > d.max) throw new Error(`Hay que elegir entre ${d.min} y ${d.max}`);
    for (const u of r.uids) if (!d.opciones.includes(u)) throw new Error('Opción no válida');
  } else if (d.tipo === 'opcion' && r.tipo === 'opcion') {
    if (!Number.isInteger(r.i) || r.i < 0 || r.i >= d.opciones.length) throw new Error('Opción fuera de rango');
  }
}

/** Vuelve a calcular las acciones legales de la decisión pendiente (tras tocar el estado a mano en pruebas o en el editor). */
export function refrescarDecision(e: Partida) {
  if (e.pendiente?.tipo === 'accion') e.pendiente.acciones = accionesLegales(e, e.pendiente.jugador);
}

export function clonar(e: Partida): Partida {
  return structuredClone(e);
}

/** Ejecuta unas tareas sueltas sobre la partida (pruebas y simulaciones). */
export function ejecutarAislado(e: Partida, tareas: Tarea[]) {
  const pila = e.pila;
  const pendiente = e.pendiente;
  e.pila = [];
  e.pendiente = null;
  encolar(e, ...tareas);
  avanzar(e);
  if (e.ganador) return;
  if (e.pendiente) e.pila = [...pila, ...e.pila];
  else {
    e.pila = pila;
    e.pendiente = pendiente;
    refrescarDecision(e);
  }
}

// ————————————————————————————————————— tareas
function paso(e: Partida, t: Tarea, r: Respuesta | undefined): boolean {
  switch (t.t) {
    case 'preparar': return tareaPreparar(e, t, r);
    case 'revelar': {
      for (const p of e.jugadores) p.revelado = true;
      e.fase = 'juego';
      log(e, 'Se descubren las candidaturas');
      return true;
    }
    case 'inicioTurno': return inicioTurno(e);
    case 'principal': return tareaPrincipal(e, t, r);
    case 'efectos': {
      if (t.i >= t.lista.length) return true;
      if (t.ctx.origen === 'ataque' && e.ataque?.fallo) return true;
      const ef = t.lista[t.i++];
      encolar(e, { t: 'efecto', ef, ctx: t.ctx });
      return false;
    }
    case 'efecto': return aplicarEfecto(e, t, r);
    case 'efectosAnulables': {
      if (e.anulada) { e.anulada = false; log(e, 'La jugada queda anulada'); return true; }
      quitarTarea(e, t);
      encolar(e, { t: 'efectos', lista: t.lista, i: 0, ctx: t.ctx });
      return false;
    }
    case 'aDescarte': {
      if (conocida(e, t.uid)) e.jugadores[t.jug].descarte.push(t.uid);
      return true;
    }
    case 'ataque': return tareaAtaque(e);
    case 'danoAtaque': return tareaDanoAtaque(e);
    case 'kos': return tareaKos(e);
    case 'reemplazo': return tareaReemplazo(e, t, r);
    case 'finTurno': return tareaFinTurno(e);
    case 'recuento': return tareaRecuento(e);
    case 'maniobras': return tareaManiobras(e, t);
  }
}

function tareaPreparar(e: Partida, t: Extract<Tarea, { t: 'preparar' }>, r: Respuesta | undefined): boolean {
  const p = e.jugadores[t.jug];
  const basicos = p.mano.filter((u) => { const c = cartaUid(e, u); return esPolitico(c) && c.fase === 'basico'; });
  if (t.paso === 0) {
    if (!basicos.length) return true; // mazo sin básicos: perderá al revelarse
    if (!r) {
      if (basicos.length === 1) {
        colocarInicial(e, t.jug, [basicos[0]], true);
        return true;
      }
      return decidir(e, { tipo: 'cartas', jugador: t.jug, proposito: 'tribunaInicial', texto: 'Elige a tu candidato para la tribuna', opciones: basicos, visibles: visibles(e, basicos), min: 1, max: 1 });
    }
    if (r.tipo === 'cartas') colocarInicial(e, t.jug, r.uids, true);
    return true;
  }
  if (!basicos.length) return true;
  if (!r) return decidir(e, { tipo: 'cartas', jugador: t.jug, proposito: 'banquilloInicial', texto: 'Elige hasta 3 políticos para el banquillo', opciones: basicos, visibles: visibles(e, basicos), min: 0, max: Math.min(MAX_BANQUILLO, basicos.length) });
  if (r.tipo === 'cartas') colocarInicial(e, t.jug, r.uids, false);
  return true;
}

function nuevoEnJuego(uid: Uid, turno: number): EnJuego {
  return { uid, debajo: [], dano: 0, votos: [], herramienta: null, estados: {}, entroTurno: turno, ascendioTurno: -1, carismaUsada: false };
}

function colocarInicial(e: Partida, j: Jug, uids: Uid[], tribuna: boolean) {
  const p = e.jugadores[j];
  for (const u of uids) {
    p.mano = p.mano.filter((x) => x !== u);
    const ej = nuevoEnJuego(u, 0);
    if (tribuna && !p.tribuna) p.tribuna = ej;
    else if (p.banquillo.length < MAX_BANQUILLO) p.banquillo.push(ej);
  }
}

function visibles(e: Partida, uids: Uid[]): Record<Uid, string> {
  const r: Record<Uid, string> = {};
  for (const u of uids) r[u] = idDe(e, u);
  return r;
}

function inicioTurno(e: Partida): boolean {
  if (e.turno === 0) {
    comprobarVictoria(e); // alguien sin básicos
    if (e.ganador) return true;
  }
  e.turno++;
  e.enTurno = e.turno % 2 === 1 ? e.primero : OTRO(e.primero);
  const j = e.enTurno;
  const p = e.jugadores[j];
  e.flags = { voto: false, asesor: false, relevo: false, escenario: false, jugadas: 0, votoExtra: 0 };
  e.ataque = null;
  e.anulada = false;
  for (const ej of enJuego(e, j)) ej.carismaUsada = false;
  if (Math.ceil(e.turno / 2) > RONDAS_MAX) {
    jornadaReflexion(e);
    return true;
  }
  suceso(e, { s: 'turno', jug: j, turno: e.turno });
  log(e, `— Turno ${e.turno}: ${quien(e, j)} —`, j);
  // robar o quedarse sin fondos
  const tareas: Tarea[] = [];
  if (p.mazo.length === 0) {
    if (p.tribuna) {
      log(e, `${quien(e, j)} se queda sin fondos de campaña`, j);
      suceso(e, { s: 'sinFondos', jug: j });
      aplicarDano(e, p.tribuna.uid, DANO_SIN_FONDOS);
      tareas.push({ t: 'kos' });
    }
  } else robar(e, j, 1);
  // la zona de voto (el primero sí recibe voto, pero no puede atacar en su primer turno)
  p.votoActual = p.votoSiguiente;
  p.votoSiguiente = elegirAzar(e, p.tipos);
  // efectos de inicio de turno: escenario, tertulianos y carismas
  if (e.escenario) {
    const c = cartaUid(e, e.escenario.uid) as CartaEntrenador;
    if (c.inicioTurno) tareas.push({ t: 'efectos', lista: c.inicioTurno, i: 0, ctx: { yo: j, carta: e.escenario.uid, origen: 'escenario' } });
  }
  for (const tt of p.plato) {
    const c = cartaUid(e, tt.uid) as CartaTertuliano;
    if (c.inicioTurno) tareas.push({ t: 'efectos', lista: c.inicioTurno, i: 0, ctx: { yo: j, carta: tt.uid, origen: 'tertuliano' } });
  }
  for (const ej of enJuego(e, j)) {
    const c = polUid(e, ej.uid);
    if (c.carisma?.disparo === 'inicioTurno' && c.carisma.efectos) tareas.push({ t: 'efectos', lista: c.carisma.efectos, i: 0, ctx: { yo: j, fuente: ej.uid, origen: 'carisma' } });
  }
  if (tareas.length) tareas.push({ t: 'kos' });
  quitarTareaInicio(e);
  encolar(e, ...tareas, { t: 'principal' });
  return false;
}

/** inicioTurno se retira a sí mismo antes de encolar lo siguiente (para que no se repita). */
function quitarTareaInicio(e: Partida) {
  const i = e.pila.map((t) => t.t).lastIndexOf('inicioTurno');
  if (i >= 0) e.pila.splice(i, 1);
}

function jornadaReflexion(e: Partida) {
  const [a, b] = e.jugadores;
  const motivo = 'Jornada de reflexión: se acaba el tiempo de campaña';
  if (a.puntos !== b.puntos) return terminar(e, a.puntos > b.puntos ? 0 : 1, motivo);
  const na = enJuego(e, 0).length, nb = enJuego(e, 1).length;
  if (na !== nb) return terminar(e, na > nb ? 0 : 1, motivo + ' (más candidatos en pie)');
  const da = enJuego(e, 0).reduce((s, x) => s + x.dano, 0), db = enJuego(e, 1).reduce((s, x) => s + x.dano, 0);
  if (da !== db) return terminar(e, da < db ? 0 : 1, motivo + ' (menos desgaste)');
  terminar(e, null, motivo);
}

// ————————————————————————————————————— fase principal
function tareaPrincipal(e: Partida, t: Tarea, r: Respuesta | undefined): boolean {
  const j = e.enTurno;
  if (!e.jugadores[j].tribuna) {
    // sin tribuna (p. ej. devuelta a la mano): hay que reemplazar antes de seguir
    if (e.jugadores[j].banquillo.length) { encolar(e, { t: 'reemplazo', jug: j }); return false; }
    comprobarVictoria(e);
    return true;
  }
  if (!r) return decidir(e, { tipo: 'accion', jugador: j, acciones: accionesLegales(e, j) });
  if (r.tipo !== 'accion') return false;
  e.anulada = false;
  const a = r.accion;
  if (a.a === 'atacar' || a.a === 'pasar') {
    quitarTarea(e, t);
    if (a.a === 'atacar') {
      const at = e.jugadores[j].tribuna!;
      const def = e.jugadores[OTRO(j)].tribuna;
      e.ataque = { jug: j, uid: at.uid, i: a.i, dano: polUid(e, at.uid).acciones[a.i].dano, fallo: false, defensor: def?.uid ?? -1, viral: false };
      encolar(e, { t: 'ataque' }, { t: 'finTurno' });
    } else encolar(e, { t: 'finTurno' });
    return false;
  }
  aplicarAccion(e, j, a);
  return false; // la principal sigue: volverá a preguntar
}

function quitarDeMano(e: Partida, j: Jug, uid: Uid) {
  const p = e.jugadores[j];
  p.mano = p.mano.filter((x) => x !== uid);
}

function aplicarAccion(e: Partida, j: Jug, a: AccionJuego) {
  const p = e.jugadores[j];
  const rv = OTRO(j);
  switch (a.a) {
    case 'bajar': {
      quitarDeMano(e, j, a.carta);
      const ej = nuevoEnJuego(a.carta, e.turno);
      p.banquillo.push(ej);
      e.flags.jugadas++;
      log(e, `${quien(e, j)} baja a ${nombre(e, a.carta)}`, j);
      suceso(e, { s: 'jugada', jug: j, carta: idDe(e, a.carta), uid: a.carta });
      const c = polUid(e, a.carta);
      const tareas: Tarea[] = [];
      if (c.carisma?.disparo === 'mitin' && c.carisma.efectos) tareas.push({ t: 'efectos', lista: c.carisma.efectos, i: 0, ctx: { yo: j, fuente: a.carta, origen: 'carisma', deMano: true } });
      tareas.push({ t: 'maniobras', disparo: 'alBajarPolitico', jug: rv, ctx: { yo: j, fuente: a.carta, origen: 'carisma' } }, { t: 'kos' });
      encolar(e, ...tareas);
      return;
    }
    case 'ascender': {
      const u = ubicar(e, a.sobre)!;
      quitarDeMano(e, j, a.carta);
      u.ej.debajo.push(u.ej.uid);
      u.ej.uid = a.carta;
      u.ej.ascendioTurno = e.turno;
      u.ej.estados = {};
      u.ej.carismaUsada = false;
      e.flags.jugadas++;
      log(e, `${quien(e, j)} asciende a ${nombre(e, a.carta)}`, j);
      suceso(e, { s: 'ascenso', uid: a.carta, carta: idDe(e, a.carta), jug: j });
      const c = polUid(e, a.carta);
      const tareas: Tarea[] = [];
      if (c.carisma?.disparo === 'mitin' && c.carisma.efectos) tareas.push({ t: 'efectos', lista: c.carisma.efectos, i: 0, ctx: { yo: j, fuente: a.carta, origen: 'carisma', deMano: true } });
      tareas.push({ t: 'maniobras', disparo: 'alAscender', jug: rv, ctx: { yo: j, fuente: a.carta, origen: 'carisma' } }, { t: 'kos' });
      encolar(e, ...tareas);
      return;
    }
    case 'voto': {
      const u = ubicar(e, a.sobre)!;
      u.ej.votos.push(p.votoActual!);
      log(e, `${quien(e, j)} da un voto ${p.votoActual} a ${nombre(e, a.sobre)}`, j);
      p.votoActual = null;
      e.flags.voto = true;
      return;
    }
    case 'herramienta': {
      quitarDeMano(e, j, a.carta);
      const u = ubicar(e, a.sobre)!;
      u.ej.herramienta = a.carta;
      e.flags.jugadas++;
      log(e, `${quien(e, j)} equipa ${nombre(e, a.carta)} a ${nombre(e, a.sobre)}`, j);
      suceso(e, { s: 'jugada', jug: j, carta: idDe(e, a.carta), uid: a.carta });
      const c = cartaUid(e, a.carta) as CartaEntrenador;
      if (c.efectos) encolar(e, { t: 'efectos', lista: c.efectos, i: 0, ctx: { yo: j, fuente: a.sobre, carta: a.carta, origen: 'entrenador', deMano: true } }, { t: 'kos' });
      return;
    }
    case 'tertuliano': {
      quitarDeMano(e, j, a.carta);
      const c = cartaUid(e, a.carta) as CartaTertuliano;
      p.plato.push({ uid: a.carta, audiencia: c.audiencia, entroTurno: e.turno });
      e.flags.jugadas++;
      log(e, `${quien(e, j)} lleva al plató a ${nombre(e, a.carta)}`, j);
      suceso(e, { s: 'tertuliano', jug: j, carta: idDe(e, a.carta) });
      if (c.mitin) encolar(e, { t: 'efectos', lista: c.mitin, i: 0, ctx: { yo: j, carta: a.carta, origen: 'tertuliano', deMano: true } }, { t: 'kos' });
      return;
    }
    case 'entrenador': {
      quitarDeMano(e, j, a.carta);
      const c = cartaUid(e, a.carta) as CartaEntrenador;
      e.flags.jugadas++;
      suceso(e, { s: 'jugada', jug: j, carta: idDe(e, a.carta), uid: a.carta });
      const ctx: Ctx = { yo: j, carta: a.carta, origen: 'entrenador', deMano: true };
      if (c.clase === 'maniobra') {
        p.maniobras.push(a.carta);
        log(e, `${quien(e, j)} prepara una maniobra boca abajo`, j);
        return;
      }
      if (c.clase === 'escenario') {
        if (e.escenario) e.jugadores[e.escenario.dueno].descarte.push(e.escenario.uid);
        e.escenario = { uid: a.carta, dueno: j, hasta: c.duracion ? e.turno + c.duracion : null };
        e.flags.escenario = true;
        log(e, `${quien(e, j)} cambia el escenario: ${nombre(e, a.carta)}`, j);
        if (c.efectos) encolar(e, { t: 'efectos', lista: c.efectos, i: 0, ctx }, { t: 'kos' });
        return;
      }
      if (c.clase === 'asesor') e.flags.asesor = true;
      log(e, `${quien(e, j)} juega ${nombre(e, a.carta)}`, j);
      const disparo: DisparoManiobra = c.clase === 'asesor' ? 'alJugarAsesor' : 'alJugarRecurso';
      encolar(e,
        { t: 'maniobras', disparo, jug: rv, ctx },
        { t: 'efectosAnulables', lista: c.efectos ?? [], ctx },
        { t: 'aDescarte', jug: j, uid: a.carta },
        { t: 'kos' },
      );
      return;
    }
    case 'carisma': {
      const u = ubicar(e, a.sobre)!;
      const c = polUid(e, a.sobre);
      u.ej.carismaUsada = true;
      if (c.carisma!.descartaVotos) u.ej.votos.splice(0, c.carisma!.descartaVotos);
      log(e, `${nombre(e, a.sobre)} usa su Carisma «${c.carisma!.nombre}»`, j);
      encolar(e, { t: 'efectos', lista: c.carisma!.efectos ?? [], i: 0, ctx: { yo: j, fuente: a.sobre, origen: 'carisma' } }, { t: 'kos' });
      return;
    }
    case 'relevo': {
      const t = p.tribuna!;
      const coste = costeRelevo(e, t);
      t.votos.splice(t.votos.length - coste, coste);
      const b = p.banquillo.find((x) => x.uid === a.a2)!;
      p.banquillo = p.banquillo.map((x) => (x === b ? t : x));
      aBanquilloSinEstados(t);
      p.tribuna = b;
      e.flags.relevo = true;
      log(e, `${quien(e, j)} hace el relevo: sube ${nombre(e, b.uid)}`, j);
      return;
    }
    case 'atacar':
    case 'pasar':
      return;
  }
}

// ————————————————————————————————————— ataque
function tareaAtaque(e: Partida): boolean {
  const at = e.ataque!;
  const t = e.jugadores[at.jug].tribuna;
  if (!t || t.uid !== at.uid) { at.fallo = true; return true; }
  const c = polUid(e, at.uid);
  const acc = c.acciones[at.i];
  log(e, `${nombre(e, at.uid)} usa «${acc.nombre}»`, at.jug);
  if (t.estados.desnortado) {
    if (!tirarMoneda(e, at.jug)) {
      log(e, `${nombre(e, at.uid)} se desnorta y el ataque no sale`, at.jug);
      at.fallo = true;
      return true;
    }
  }
  const ctx: Ctx = { yo: at.jug, fuente: at.uid, origen: 'ataque', defensor: at.defensor };
  quitarTarea(e, e.pila[e.pila.length - 1]);
  encolar(e,
    { t: 'maniobras', disparo: 'alAtacar', jug: OTRO(at.jug), ctx },
    { t: 'efectos', lista: acc.efectos ?? [], i: 0, ctx },
    { t: 'danoAtaque' },
    { t: 'kos' },
  );
  return false;
}

/** Daño de un ataque al defensor: base + modificadores + debilidad − defensa ± Clima. */
export function calcularDano(e: Partida, atacante: Uid, defensor: Uid, base: number): number {
  if (base <= 0) return 0;
  const ma = modificadores(e, atacante, defensor);
  const md = modificadores(e, defensor);
  let d = base + ma.dano;
  const def = polUid(e, defensor);
  if (def.debilidad && !md.sinDebilidad && tiposDe(polUid(e, atacante)).includes(def.debilidad)) d += DANO_DEBILIDAD;
  d -= md.defensa;
  if (e.clima === 5) d -= 10;
  if (e.clima === 2) d += 10;
  if (protegido(e, defensor)) return 0;
  return Math.max(0, d);
}

function tareaDanoAtaque(e: Partida): boolean {
  const at = e.ataque!;
  if (at.fallo) return true;
  const atk = e.jugadores[at.jug].tribuna;
  const def = e.jugadores[OTRO(at.jug)].tribuna;
  if (!atk || atk.uid !== at.uid || !def) return true;
  const d = calcularDano(e, at.uid, def.uid, at.dano);
  const acc = polUid(e, at.uid).acciones[at.i];
  suceso(e, { s: 'ataque', jug: at.jug, uid: at.uid, accion: acc.nombre, dano: d, defensor: def.uid });
  if (d > 0) aplicarDano(e, def.uid, d);
  else if (at.dano > 0) log(e, `${nombre(e, def.uid)} no recibe daño`, OTRO(at.jug));
  at.defensor = def.uid;
  at.viral = !!polUid(e, at.uid).claves?.includes('viral');
  return true;
}

// ————————————————————————————————————— derribos
function tareaKos(e: Partida): boolean {
  const caidos: { jug: Jug; ej: EnJuego; tribuna: boolean }[] = [];
  for (const j of [0, 1] as Jug[]) {
    for (const ej of enJuego(e, j)) if (ej.dano >= aguanteMax(e, ej)) caidos.push({ jug: j, ej, tribuna: e.jugadores[j].tribuna === ej });
  }
  if (!caidos.length) return true;
  const tareas: Tarea[] = [];
  for (const k of caidos) {
    const c = polUid(e, k.ej.uid);
    const pts = c.cl ? 2 : 1;
    log(e, `¡${nombre(e, k.ej.uid)} cae! ${quien(e, OTRO(k.jug))} gana ${pts === 2 ? '118' : '59'} escaños`, OTRO(k.jug));
    suceso(e, { s: 'ko', uid: k.ej.uid, carta: idDe(e, k.ej.uid), jug: k.jug, puntos: pts });
    if (c.carisma?.disparo === 'legado' && c.carisma.efectos) tareas.push({ t: 'efectos', lista: c.carisma.efectos, i: 0, ctx: { yo: k.jug, origen: 'legado' } });
    tareas.push({ t: 'maniobras', disparo: 'alDerribo', jug: k.jug, ctx: { yo: OTRO(k.jug), origen: 'ataque' } });
    if (e.ataque && e.ataque.viral && e.ataque.defensor === k.ej.uid && k.jug !== e.ataque.jug) {
      robar(e, e.ataque.jug, 1);
      log(e, '¡Se hace viral! Roba una carta', e.ataque.jug);
    }
    retirarDelJuego(e, k.jug, k.ej);
    e.jugadores[OTRO(k.jug)].puntos += pts;
  }
  comprobarVictoria(e);
  if (e.ganador) return true;
  for (const j of [0, 1] as Jug[]) if (!e.jugadores[j].tribuna && e.jugadores[j].banquillo.length) tareas.push({ t: 'reemplazo', jug: j });
  quitarTarea(e, e.pila[e.pila.length - 1]);
  encolar(e, ...tareas, { t: 'kos' });
  return false;
}

function tareaReemplazo(e: Partida, t: Extract<Tarea, { t: 'reemplazo' }>, r: Respuesta | undefined): boolean {
  const p = e.jugadores[t.jug];
  if (p.tribuna || !p.banquillo.length) return true;
  const ops = p.banquillo.map((x) => x.uid);
  let elegido: Uid | null = null;
  if (ops.length === 1) elegido = ops[0];
  else if (!r) return decidir(e, { tipo: 'objetivo', jugador: t.jug, proposito: 'reemplazo', texto: 'Elige quién sube a la tribuna', opciones: ops, min: 1, max: 1 });
  else if (r.tipo === 'objetivo') elegido = r.uids[0];
  if (elegido === null) return true;
  const b = p.banquillo.find((x) => x.uid === elegido)!;
  p.banquillo = p.banquillo.filter((x) => x !== b);
  p.tribuna = b;
  log(e, `${nombre(e, b.uid)} sube a la tribuna`, t.jug);
  return true;
}

// ————————————————————————————————————— fin de turno y recuento
function tareaFinTurno(e: Partida): boolean {
  const j = e.enTurno;
  const p = e.jugadores[j];
  p.votoActual = null;
  e.temporales = e.temporales.filter((x) => x.expira > e.turno);
  for (const pl of e.jugadores) pl.manoVista = false;
  // los tertulianos pierden audiencia al final del turno de su dueño
  for (const tt of [...p.plato]) {
    tt.audiencia--;
    if (tt.audiencia <= 0) {
      p.plato = p.plato.filter((x) => x !== tt);
      p.descarte.push(tt.uid);
      log(e, `${nombre(e, tt.uid)} se despide del plató`, j);
    }
  }
  if (e.escenario?.hasta && e.turno >= e.escenario.hasta) {
    log(e, `${nombre(e, e.escenario.uid)} deja de ser noticia`);
    e.jugadores[e.escenario.dueno].descarte.push(e.escenario.uid);
    e.escenario = null;
  }
  quitarTarea(e, e.pila[e.pila.length - 1]);
  encolar(e, { t: 'recuento' }, { t: 'kos' }, { t: 'inicioTurno' });
  return false;
}

function tareaRecuento(e: Partida): boolean {
  for (const j of [e.enTurno, OTRO(e.enTurno)] as Jug[]) {
    const t = e.jugadores[j].tribuna;
    if (!t) continue;
    if (t.estados.sospecha) aplicarDano(e, t.uid, 10);
    if (t.estados.quemado) {
      aplicarDano(e, t.uid, 20);
      if (tirarMoneda(e, j)) { delete t.estados.quemado; log(e, `${nombre(e, t.uid)} deja de estar quemado`, j); }
    }
    if (t.estados.desconectado && tirarMoneda(e, j)) { delete t.estados.desconectado; log(e, `${nombre(e, t.uid)} vuelve a conectar`, j); }
    if (t.estados.bloqueado && t.estados.bloqueado <= e.turno) delete t.estados.bloqueado;
  }
  return true;
}

// ————————————————————————————————————— maniobras
function tareaManiobras(e: Partida, t: Extract<Tarea, { t: 'maniobras' }>): boolean {
  const p = e.jugadores[t.jug];
  const saltan = p.maniobras.filter((u) => (cartaUid(e, u) as CartaEntrenador).disparo === t.disparo);
  if (!saltan.length) return true;
  quitarTarea(e, t);
  const tareas: Tarea[] = [];
  for (const u of saltan) {
    p.maniobras = p.maniobras.filter((x) => x !== u);
    p.descarte.push(u);
    const c = cartaUid(e, u) as CartaEntrenador;
    log(e, `¡Maniobra! ${quien(e, t.jug)} destapa ${nombre(e, u)}`, t.jug);
    suceso(e, { s: 'maniobra', jug: t.jug, carta: idDe(e, u) });
    // la fuente del disparo (quien ataca, quien baja…) pasa a ser el «defensor» de la maniobra
    tareas.push({ t: 'efectos', lista: c.efectos ?? [], i: 0, ctx: { yo: t.jug, carta: u, origen: 'maniobra', defensor: t.ctx.fuente } });
  }
  encolar(e, ...tareas);
  return false;
}

// ————————————————————————————————————— objetivos
function objetivosSel(e: Partida, sel: Sel, ctx: Ctx): Uid[] {
  const yo = ctx.yo;
  const rv = OTRO(yo);
  const pr = e.jugadores[rv];
  const pm = e.jugadores[yo];
  // en las maniobras, «defensor» es el político que la ha disparado
  const defensor = ctx.origen === 'maniobra' && ctx.defensor !== undefined && ubicar(e, ctx.defensor) ? ctx.defensor : pr.tribuna?.uid;
  let r: Uid[] = [];
  switch (sel) {
    case 'defensor': r = defensor !== undefined ? [defensor] : []; break;
    case 'fuente': r = ctx.fuente !== undefined && ubicar(e, ctx.fuente) ? [ctx.fuente] : []; break;
    case 'tribunaPropia': r = pm.tribuna ? [pm.tribuna.uid] : []; break;
    case 'tribunaRival': r = pr.tribuna ? [pr.tribuna.uid] : []; break;
    case 'elegirRival': case 'todosRivales': r = enJuego(e, rv).map((x) => x.uid); break;
    case 'elegirBanquilloRival': case 'banquilloRival': r = pr.banquillo.map((x) => x.uid); break;
    case 'elegirPropio': case 'todosPropios': r = enJuego(e, yo).map((x) => x.uid); break;
    case 'elegirBanquilloPropio': case 'banquilloPropio': r = pm.banquillo.map((x) => x.uid); break;
    case 'elegirDanadoPropio': r = enJuego(e, yo).filter((x) => x.dano > 0).map((x) => x.uid); break;
    case 'todos': r = [...enJuego(e, yo), ...enJuego(e, rv)].map((x) => x.uid); break;
  }
  // Aforado: inmune a Recursos y Noticias del rival
  const deRecurso = ctx.origen === 'entrenador' && ctx.carta !== undefined && cartaUid(e, ctx.carta).clase === 'recurso';
  if (deRecurso) r = r.filter((u) => { const w = ubicar(e, u); return !w || w.jug === yo || !polUid(e, u).claves?.includes('aforado'); });
  return r;
}

const ELIGE: Partial<Record<Sel, true>> = { elegirRival: true, elegirBanquilloRival: true, elegirPropio: true, elegirBanquilloPropio: true, elegirDanadoPropio: true };

/** Resuelve un objetivo: si hay que elegir, abre la decisión. Devuelve null mientras espera. */
function resolverObjetivos(e: Partida, sel: Sel, ctx: Ctx, r: Respuesta | undefined, texto: string, filtro?: (u: Uid) => boolean): Uid[] | null {
  let ops = objetivosSel(e, sel, ctx);
  if (filtro) ops = ops.filter(filtro);
  if (!ELIGE[sel] || ops.length <= 1) return ops;
  if (r && r.tipo === 'objetivo') return r.uids;
  decidir(e, { tipo: 'objetivo', jugador: ctx.yo, proposito: 'efecto', texto, opciones: ops, min: 1, max: 1 });
  return null;
}

const enBanquillo = (e: Partida, u: Uid) => { const w = ubicar(e, u); return !!w && !w.tribuna; };
const tieneCordon = (e: Partida, u: Uid) => !!polUid(e, u).claves?.includes('cordon');

// ————————————————————————————————————— efectos
function aplicarEfecto(e: Partida, t: Extract<Tarea, { t: 'efecto' }>, r: Respuesta | undefined): boolean {
  const { ef, ctx } = t;
  const yo = ctx.yo;
  const rv = OTRO(yo);
  const at = ctx.origen === 'ataque' ? e.ataque : null;
  switch (ef.e) {
    case 'masDano': if (at) at.dano += ef.n; return true;
    case 'masDanoPor': if (at) at.dano += ef.n * Math.min(contar(e, ef.por, ctx), ef.max ?? 99); return true;
    case 'fallar': if (at) at.fallo = true; return true;
    case 'dano': case 'bulo': {
      const bulo = ef.e === 'bulo';
      const objs = resolverObjetivos(e, ef.a, ctx, r, `Elige a quién ${bulo ? 'le llega el bulo' : 'golpear'} (${ef.n})`,
        bulo ? undefined : (u) => !(enBanquillo(e, u) && tieneCordon(e, u)));
      if (!objs) return false;
      for (const u of objs) aplicarDano(e, u, ef.n);
      return true;
    }
    case 'autodano': if (ctx.fuente !== undefined) aplicarDano(e, ctx.fuente, ef.n); return true;
    case 'curar': {
      const objs = resolverObjetivos(e, ef.a, ctx, r, 'Elige a quién curar', (u) => (ubicar(e, u)?.ej.dano ?? 0) > 0);
      if (!objs) return false;
      for (const u of objs) curar(e, u, ef.n);
      return true;
    }
    case 'estado': {
      const objs = resolverObjetivos(e, ef.a, ctx, r, 'Elige objetivo', (u) => !!ubicar(e, u)?.tribuna);
      if (!objs) return false;
      for (const u of objs) ponerEstado(e, u, ef.estado);
      return true;
    }
    case 'quitarEstados': {
      const objs = resolverObjetivos(e, ef.a, ctx, r, 'Elige a quién limpiar');
      if (!objs) return false;
      for (const u of objs) { const w = ubicar(e, u); if (w) w.ej.estados = {}; }
      return true;
    }
    case 'monedas': {
      const n = ef.n === 'votosFuente' ? contar(e, 'votosAtacante', ctx) : ef.n;
      let caras = 0;
      for (let i = 0; i < n; i++) if (tirarMoneda(e, yo)) caras++;
      const tareas: Tarea[] = [];
      for (let i = 0; i < caras; i++) tareas.push({ t: 'efectos', lista: ef.porCara, i: 0, ctx });
      quitarTarea(e, t);
      encolar(e, ...tareas);
      return false;
    }
    case 'hastaCruz': {
      let caras = 0;
      while (caras < (ef.max ?? 10) && tirarMoneda(e, yo)) caras++;
      const tareas: Tarea[] = [];
      for (let i = 0; i < caras; i++) tareas.push({ t: 'efectos', lista: ef.porCara, i: 0, ctx });
      quitarTarea(e, t);
      encolar(e, ...tareas);
      return false;
    }
    case 'moneda': {
      const c = tirarMoneda(e, yo);
      quitarTarea(e, t);
      encolar(e, { t: 'efectos', lista: c ? ef.cara : ef.cruz ?? [], i: 0, ctx });
      return false;
    }
    case 'si': {
      const ok = cumpleCond(e, ef.cond, ctx);
      quitarTarea(e, t);
      encolar(e, { t: 'efectos', lista: ok ? ef.entonces : ef.sino ?? [], i: 0, ctx });
      return false;
    }
    case 'porCada': {
      const n = Math.min(contar(e, ef.por, ctx), ef.max ?? 20);
      quitarTarea(e, t);
      const tareas: Tarea[] = [];
      for (let i = 0; i < n; i++) tareas.push({ t: 'efectos', lista: ef.efectos, i: 0, ctx });
      encolar(e, ...tareas);
      return false;
    }
    case 'elegir': {
      if (!r) return decidir(e, { tipo: 'opcion', jugador: yo, texto: 'Elige una opción', opciones: ef.opciones.map((o) => o.texto) });
      if (r.tipo !== 'opcion') return true;
      quitarTarea(e, t);
      encolar(e, { t: 'efectos', lista: ef.opciones[r.i].efectos, i: 0, ctx });
      return false;
    }
    case 'robar': {
      if (ef.quien !== 'rival') robar(e, yo, ef.n);
      if (ef.quien === 'rival' || ef.quien === 'ambos') robar(e, rv, ef.n);
      return true;
    }
    case 'robarHasta': {
      const falta = ef.n - e.jugadores[yo].mano.length;
      if (falta > 0) robar(e, yo, falta);
      return true;
    }
    case 'buscar': {
      const p = e.jugadores[yo];
      const hueco = MAX_BANQUILLO - p.banquillo.length;
      const ops = p.mazo.filter((u) => {
        const c = cartaUid(e, u);
        if (!cumpleFiltroCarta(e, yo, c, ef.filtro)) return false;
        return ef.destino === 'mano' || (esPolitico(c) && c.fase === 'basico');
      });
      const max = Math.min(ef.n, ops.length, ef.destino === 'banquillo' ? hueco : 99);
      if (max <= 0) { barajarMazo(e, yo); return true; }
      if (!r) return decidir(e, { tipo: 'cartas', jugador: yo, proposito: 'buscar', texto: `Busca en tu mazo (hasta ${max})`, opciones: ops, visibles: visibles(e, ops), min: 0, max });
      if (r.tipo !== 'cartas') return true;
      for (const u of r.uids) {
        p.mazo = p.mazo.filter((x) => x !== u);
        if (ef.destino === 'mano') { p.mano.push(u); log(e, `${quien(e, yo)} busca ${nombre(e, u)}`, yo); }
        else { p.banquillo.push(nuevoEnJuego(u, e.turno)); log(e, `${quien(e, yo)} baja a ${nombre(e, u)} desde el mazo`, yo); }
      }
      barajarMazo(e, yo);
      return true;
    }
    case 'mirarMazo': {
      const j = ef.quien === 'yo' ? yo : rv;
      const p = e.jugadores[j];
      const arriba = p.mazo.slice(-ef.n).reverse();
      if (!arriba.length) return true;
      if (!ef.tomar || j !== yo) {
        log(e, `Miras el mazo: ${arriba.map((u) => nombre(e, u)).join(', ')}`, yo, yo);
        return true;
      }
      const ops = arriba.filter((u) => cumpleFiltroCarta(e, yo, cartaUid(e, u), ef.tomar!));
      if (!r) {
        const vis = visibles(e, arriba);
        return decidir(e, { tipo: 'cartas', jugador: yo, proposito: 'mirar', texto: 'Miras las primeras cartas: puedes quedarte una', opciones: ops, visibles: vis, min: 0, max: Math.min(1, ops.length) });
      }
      if (r.tipo === 'cartas') for (const u of r.uids) { p.mazo = p.mazo.filter((x) => x !== u); p.mano.push(u); }
      barajarMazo(e, yo);
      return true;
    }
    case 'barajarManoRobar': {
      const js: Jug[] = ef.quien === 'yo' ? [yo] : ef.quien === 'rival' ? [rv] : [yo, rv];
      for (const j of js) {
        const p = e.jugadores[j];
        for (const u of [...p.mano]) aMazo(e, j, u);
        p.mano = [];
        barajarMazo(e, j);
        const n = ef.n === 'puntosPropiosMas' ? Math.max(1, 3 - e.jugadores[j].puntos) + 1 : ef.n;
        robar(e, j, n);
        log(e, `${quien(e, j)} baraja su mano y roba ${n}`, j);
      }
      return true;
    }
    case 'descartarManoAzar': {
      const j = ef.quien === 'yo' ? yo : rv;
      const p = e.jugadores[j];
      for (let i = 0; i < ef.n && p.mano.length; i++) {
        const u = elegirAzar(e, p.mano);
        p.mano = p.mano.filter((x) => x !== u);
        p.descarte.push(u);
        log(e, `${quien(e, j)} descarta ${nombre(e, u)}`, j);
      }
      return true;
    }
    case 'descartarMazo': {
      const j = ef.quien === 'yo' ? yo : rv;
      const p = e.jugadores[j];
      for (let i = 0; i < ef.n && p.mazo.length; i++) {
        const u = p.mazo.pop()!;
        p.descarte.push(u);
        log(e, `${quien(e, j)} pierde ${nombre(e, u)} del mazo`, j);
      }
      return true;
    }
    case 'verMano': {
      const p = e.jugadores[rv];
      p.manoVista = true;
      log(e, `Ves la mano rival: ${p.mano.map((u) => nombre(e, u)).join(', ') || 'vacía'}`, yo, yo);
      return true;
    }
    case 'recuperar': {
      const p = e.jugadores[yo];
      const ops = p.descarte.filter((u) => u !== ctx.carta && cumpleFiltroCarta(e, yo, cartaUid(e, u), ef.filtro));
      const max = Math.min(ef.n, ops.length);
      if (max <= 0) return true;
      if (!r) return decidir(e, { tipo: 'cartas', jugador: yo, proposito: 'recuperar', texto: `Recupera del descarte (hasta ${max})`, opciones: ops, visibles: visibles(e, ops), min: 1, max });
      if (r.tipo !== 'cartas') return true;
      for (const u of r.uids) {
        p.descarte = p.descarte.filter((x) => x !== u);
        if (ef.destino === 'mano') p.mano.push(u);
        else aMazo(e, yo, u);
        log(e, `${quien(e, yo)} recupera ${nombre(e, u)}`, yo);
      }
      if (ef.destino === 'mazo') barajarMazo(e, yo);
      return true;
    }
    case 'descartarVoto': {
      const objs = resolverObjetivos(e, ef.a, ctx, r, 'Elige a quién quitar votos', (u) => (ubicar(e, u)?.ej.votos.length ?? 0) > 0);
      if (!objs) return false;
      for (const u of objs) {
        const w = ubicar(e, u);
        if (!w) continue;
        const n = ef.n === 'todos' ? w.ej.votos.length : Math.min(ef.n, w.ej.votos.length);
        w.ej.votos.splice(w.ej.votos.length - n, n);
        if (n) log(e, `${nombre(e, u)} pierde ${n} voto${n === 1 ? '' : 's'}`, w.jug);
      }
      return true;
    }
    case 'adjuntarVoto': {
      const objs = resolverObjetivos(e, ef.a, ctx, r, 'Elige a quién dar el voto');
      if (!objs) return false;
      for (const u of objs) {
        const w = ubicar(e, u);
        if (!w) continue;
        for (let i = 0; i < ef.n; i++) w.ej.votos.push(ef.tipo === 'zona' ? elegirAzar(e, e.jugadores[yo].tipos) : ef.tipo);
        log(e, `${nombre(e, u)} recibe ${ef.n} voto${ef.n === 1 ? '' : 's'}`, w.jug);
      }
      return true;
    }
    case 'moverVoto': {
      const objs = resolverObjetivos(e, ef.a, ctx, r, 'Elige a quién mover los votos');
      if (!objs || !objs.length) return objs !== null;
      const dest = ubicar(e, objs[0]);
      if (!dest) return true;
      const origenes = ef.desde === 'fuente' ? enJuego(e, yo).filter((x) => x.uid === ctx.fuente) : e.jugadores[yo].banquillo;
      let n = ef.n;
      for (const o of origenes) {
        while (n > 0 && o.votos.length && o !== dest.ej) { dest.ej.votos.push(o.votos.pop()!); n--; }
      }
      return true;
    }
    case 'cambiarRival': {
      const pr = e.jugadores[rv];
      if (!pr.tribuna) return true;
      const ops = pr.banquillo.filter((b) => ef.elige === 'rival' || !tieneCordon(e, b.uid)).map((b) => b.uid);
      if (!ops.length) return true;
      const decide = ef.elige === 'yo' ? yo : rv;
      let el: Uid;
      if (ops.length === 1) el = ops[0];
      else if (!r) return decidir(e, { tipo: 'objetivo', jugador: decide, proposito: 'efecto', texto: 'Elige quién sube a la tribuna rival', opciones: ops, min: 1, max: 1 });
      else if (r.tipo === 'objetivo') el = r.uids[0];
      else return true;
      const b = pr.banquillo.find((x) => x.uid === el)!;
      const t2 = pr.tribuna;
      pr.banquillo = pr.banquillo.map((x) => (x === b ? t2 : x));
      aBanquilloSinEstados(t2);
      pr.tribuna = b;
      log(e, `¡Moción! ${nombre(e, b.uid)} pasa a la tribuna rival`, yo);
      return true;
    }
    case 'cambiarPropio': {
      const p = e.jugadores[yo];
      if (!p.tribuna || !p.banquillo.length) return true;
      const ops = p.banquillo.map((b) => b.uid);
      let el: Uid;
      if (ops.length === 1) el = ops[0];
      else if (!r) return decidir(e, { tipo: 'objetivo', jugador: yo, proposito: 'efecto', texto: 'Elige quién sube a tu tribuna', opciones: ops, min: 1, max: 1 });
      else if (r.tipo === 'objetivo') el = r.uids[0];
      else return true;
      const b = p.banquillo.find((x) => x.uid === el)!;
      const t2 = p.tribuna;
      p.banquillo = p.banquillo.map((x) => (x === b ? t2 : x));
      aBanquilloSinEstados(t2);
      p.tribuna = b;
      log(e, `${nombre(e, b.uid)} sube a la tribuna`, yo);
      return true;
    }
    case 'devolverMano': {
      const objs = resolverObjetivos(e, ef.a, ctx, r, 'Elige a quién devolver a la mano');
      if (!objs) return false;
      for (const u of objs) {
        const w = ubicar(e, u);
        if (!w) continue;
        // no se puede dejar a nadie sin candidatos
        if (enJuego(e, w.jug).length <= 1) continue;
        retirarDelJuego(e, w.jug, w.ej, 'mano');
        log(e, `${nombre(e, u)} vuelve a la mano`, w.jug);
        if (!e.jugadores[w.jug].tribuna) encolar(e, { t: 'reemplazo', jug: w.jug });
      }
      return true;
    }
    case 'temporal': {
      const expira = ef.dura === 'esteTurno' ? e.turno : e.turno + 1;
      if (ef.a === 'yo' || ef.a === 'rival') {
        e.temporales.push({ t: ef.t, jug: ef.a === 'yo' ? yo : rv, uid: null, n: ef.n ?? 0, expira });
        return true;
      }
      const objs = resolverObjetivos(e, ef.a, ctx, r, 'Elige objetivo');
      if (!objs) return false;
      for (const u of objs) {
        const w = ubicar(e, u);
        if (w) e.temporales.push({ t: ef.t, jug: w.jug, uid: u, n: ef.n ?? 0, expira });
      }
      return true;
    }
    case 'dedazo': {
      const pares = opcionesDedazo(e, yo);
      if (!pares.length) return true;
      // primero la Fase 2 de la mano, después el Básico
      if (!t.datos || t.datos.length === 0) {
        const cartas = [...new Set(pares.map((x) => x.carta))];
        if (cartas.length === 1) t.datos = [cartas[0]];
        else if (!r) return decidir(e, { tipo: 'cartas', jugador: yo, proposito: 'dedazo', texto: 'Elige a quién asciendes a dedo', opciones: cartas, visibles: visibles(e, cartas), min: 1, max: 1 });
        else if (r.tipo === 'cartas') { t.datos = [r.uids[0]]; r = undefined; }
      }
      const c2 = t.datos![0];
      const sobres = pares.filter((x) => x.carta === c2).map((x) => x.sobre);
      let sobre: Uid;
      if (sobres.length === 1) sobre = sobres[0];
      else if (!r) return decidir(e, { tipo: 'objetivo', jugador: yo, proposito: 'efecto', texto: 'Elige el Básico que asciende', opciones: sobres, min: 1, max: 1 });
      else if (r.tipo === 'objetivo') sobre = r.uids[0];
      else return true;
      const w = ubicar(e, sobre)!;
      quitarDeMano(e, yo, c2);
      w.ej.debajo.push(w.ej.uid);
      w.ej.uid = c2;
      w.ej.ascendioTurno = e.turno;
      w.ej.estados = {};
      log(e, `¡A dedo! ${nombre(e, c2)} asciende directamente`, yo);
      suceso(e, { s: 'ascenso', uid: c2, carta: idDe(e, c2), jug: yo });
      const c = polUid(e, c2);
      quitarTarea(e, t);
      if (c.carisma?.disparo === 'mitin' && c.carisma.efectos) encolar(e, { t: 'efectos', lista: c.carisma.efectos, i: 0, ctx: { yo, fuente: c2, origen: 'carisma' } });
      return false;
    }
    case 'descartarHerramienta': {
      const objs = resolverObjetivos(e, ef.a, ctx, r, 'Elige de quién quitar la herramienta', (u) => ubicar(e, u)?.ej.herramienta != null);
      if (!objs) return false;
      for (const u of objs) {
        const w = ubicar(e, u);
        if (w && w.ej.herramienta !== null) { e.jugadores[w.jug].descarte.push(w.ej.herramienta); log(e, `${nombre(e, u)} pierde ${nombre(e, w.ej.herramienta)}`, w.jug); w.ej.herramienta = null; }
      }
      return true;
    }
    case 'quitarEscenario': {
      if (e.escenario) {
        log(e, `Se retira el escenario ${nombre(e, e.escenario.uid)}`, yo);
        e.jugadores[e.escenario.dueno].descarte.push(e.escenario.uid);
        e.escenario = null;
      }
      return true;
    }
    case 'apoyo': {
      const f = ctx.fuente !== undefined ? ubicar(e, ctx.fuente) : null;
      const partido = f ? polUid(e, f.ej.uid).partido : 'INDEP';
      const p = e.jugadores[yo];
      for (let i = 0; i < ef.n && p.apoyos.length < 10; i++) p.apoyos.push(partido);
      log(e, `${quien(e, yo)} suma el apoyo de ${PARTIDOS[partido].siglas} (${p.apoyos.length} apoyos)`, yo);
      suceso(e, { s: 'apoyo', jug: yo, partido });
      return true;
    }
    case 'quitarApoyos': {
      const p = e.jugadores[rv];
      const n = Math.min(ef.n, p.apoyos.length);
      p.apoyos.splice(p.apoyos.length - n, n);
      if (n) log(e, `${quien(e, rv)} pierde ${n} apoyo${n === 1 ? '' : 's'}`, rv);
      return true;
    }
    case 'investidura': {
      const a = e.jugadores[yo].apoyos;
      if (a.length >= APOYOS_INVESTIDURA && new Set(a).size >= PARTIDOS_INVESTIDURA) {
        terminar(e, yo, `Investidura: ${a.length} apoyos de ${new Set(a).size} grupos`);
      } else log(e, 'La votación de investidura fracasa: faltan apoyos', yo);
      return true;
    }
    case 'clima': cambiarClima(e, ef.n, yo); return true;
    case 'fijarClima': cambiarClima(e, ef.n - e.clima, yo); return true;
    case 'audiencia': {
      const p = e.jugadores[ef.quien === 'yo' ? yo : rv];
      for (const tt of [...p.plato]) {
        tt.audiencia += ef.n;
        if (tt.audiencia <= 0) { p.plato = p.plato.filter((x) => x !== tt); p.descarte.push(tt.uid); log(e, `${nombre(e, tt.uid)} pierde la audiencia`); }
      }
      return true;
    }
    case 'expulsarTertuliano': {
      const p = e.jugadores[rv];
      if (!p.plato.length) return true;
      const ops = p.plato.map((x) => x.uid);
      let el: Uid;
      if (ops.length === 1) el = ops[0];
      else if (!r) return decidir(e, { tipo: 'objetivo', jugador: yo, proposito: 'efecto', texto: 'Elige a qué tertuliano echas del plató', opciones: ops, min: 1, max: 1 });
      else if (r.tipo === 'objetivo') el = r.uids[0];
      else return true;
      p.plato = p.plato.filter((x) => x.uid !== el);
      p.descarte.push(el);
      log(e, `${nombre(e, el)} sale del plató`, rv);
      return true;
    }
    case 'quitarManiobra': {
      const p = e.jugadores[rv];
      if (!p.maniobras.length) return true;
      const u = elegirAzar(e, p.maniobras);
      p.maniobras = p.maniobras.filter((x) => x !== u);
      p.descarte.push(u);
      log(e, `Se destapa y se pierde la maniobra ${nombre(e, u)}`, rv);
      return true;
    }
    case 'anular': {
      if (e.ataque && !e.ataque.fallo && ctx.origen === 'maniobra' && e.pila.some((x) => x.t === 'danoAtaque')) e.ataque.fallo = true;
      else e.anulada = true;
      return true;
    }
    case 'puntos': sumarPuntos(e, yo, ef.n); return true;
    case 'votoExtraTurno': {
      // un voto más de la zona este turno
      e.flags.votoExtra++;
      e.jugadores[yo].votoActual = elegirAzar(e, e.jugadores[yo].tipos);
      e.flags.voto = false;
      return true;
    }
  }
}

// utilidades públicas
export { accionesLegales, cumpleFiltroPol };
export type { Carta, CartaPolitico, Jugador };
