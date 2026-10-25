// Tipos del motor de «176 TCG».
// La partida es serializable de principio a fin: cada carta en juego es un uid que apunta a su definición en el catálogo.

export type Jug = 0 | 1;
export const OTRO = (j: Jug): Jug => (j === 0 ? 1 : 0);

export type Tipo = 'rojo' | 'magenta' | 'azul' | 'verde' | 'morado' | 'ambar' | 'incoloro';
export const TIPOS: Tipo[] = ['rojo', 'magenta', 'azul', 'verde', 'morado', 'ambar', 'incoloro'];
/** Tipos que la zona de voto puede generar (el incoloro no: en un coste significa «cualquiera»). */
export const TIPOS_VOTO: Tipo[] = ['rojo', 'magenta', 'azul', 'verde', 'morado', 'ambar'];

export type Bloque = 'progresista' | 'conservador' | 'ninguno';

export type PartidoId =
  | 'PSOE' | 'FA' | 'PP' | 'VOX' | 'PODEMOS'
  | 'ERC' | 'JUNTS' | 'PNV' | 'BILDU' | 'BNG' | 'CC' | 'UPN' | 'COMPROMIS' | 'TE' | 'ADELANTE'
  | 'SALF' | 'CS' | 'UCD' | 'INDEP';

export type Fase = 'basico' | 'fase1' | 'fase2';
/** ◆ común · ◆◆ infrecuente · ◆◆◆ rara · CL cabeza de lista · ★ especial · ♛ corona */
export type Rareza = 'C' | 'I' | 'R' | 'CL' | 'E' | 'S';
export type Coleccion = 'basica' | '29n' | 'secreta';
export type Clase = 'politico' | 'tertuliano' | 'asesor' | 'recurso' | 'herramienta' | 'escenario' | 'maniobra';

export type EstadoAlterado = 'sospecha' | 'quemado' | 'desconectado' | 'bloqueado' | 'desnortado';

export type Clave =
  | 'disciplina' | 'coalicion' | 'mitin' | 'legado' | 'combo' | 'portavoz' | 'aforado' | 'cordon' | 'viral'
  | 'remontada' | 'caos' | 'fichaje' | 'bulo' | 'negociar' | 'unica' | 'leyenda' | 'sinFondos' | 'clima';

/** Filtro de políticos (para pasivas, objetivos y condiciones). */
export interface FiltroPol {
  tipo?: Tipo[];
  partido?: PartidoId[];
  fase?: Fase[];
  cl?: boolean;
  bloque?: Bloque[];
  nombre?: string[];
  danado?: boolean;
}

/** Filtro de cartas (para buscar y recuperar). */
export interface FiltroCarta {
  clase?: Clase[];
  fase?: Fase[];
  tipo?: Tipo[];
  partido?: PartidoId[];
  noticia?: boolean;
  nombre?: string[];
  /** cartas que asciendan de alguno de los políticos que tengo en juego */
  asciendeDeEnJuego?: boolean;
}

/** Cantidades que dependen de la mesa (para «X por cada…»). */
export type Contador =
  | 'votosDefensor' | 'votosAtacante' | 'votosExtra' | 'aliadosPartido' | 'aliadosTipo' | 'aliados'
  | 'banquilloPropio' | 'banquilloRival' | 'contadoresPropios' | 'contadoresDefensor' | 'manoRival' | 'manoPropia'
  | 'apoyos' | 'tertulianosPropios' | 'jugadasTurno' | 'puntosRival' | 'puntosPropios' | 'descartePropio'
  | 'crispacion' | 'tiposEnJuego' | 'estadosDefensor' | 'danadosRivales' | 'mazoRivalVacio' | 'entrenadoresDescarte';

export type Cond =
  | { c: 'climaMax'; n: number }
  | { c: 'climaMin'; n: number }
  | { c: 'defensorDanado' }
  | { c: 'defensorTipo'; tipo: Tipo[] }
  | { c: 'defensorCL' }
  | { c: 'defensorEstado' }
  | { c: 'defensorBasico' }
  | { c: 'fuenteDanada' }
  | { c: 'voyPerdiendo' }
  | { c: 'combo'; n?: number }
  | { c: 'coalicion'; n: number }
  | { c: 'granCoalicion' }
  | { c: 'aliadosPartido'; n: number }
  | { c: 'aliadosTipo'; tipo: Tipo; n: number }
  | { c: 'tengoTertuliano'; presentador?: boolean }
  | { c: 'hayEscenario' }
  | { c: 'banquilloRivalMin'; n: number }
  | { c: 'banquilloPropioMin'; n: number }
  | { c: 'manoRivalMin'; n: number }
  | { c: 'manoPropiaMax'; n: number }
  | { c: 'apoyosMin'; n: number; partidos?: number }
  | { c: 'mazoRivalMax'; n: number }
  | { c: 'mazoPropioMin'; n: number }
  | { c: 'votosFuenteMin'; n: number }
  | { c: 'mazoSinRepetidas' }
  | { c: 'tribunaPropiaDanada' }
  | { c: 'rivalTieneManiobra' }
  | { c: 'no'; cond: Cond }
  | { c: 'y'; conds: Cond[] };

/** A quién se dirige un efecto. Los «elegir…» abren una decisión si hay más de una opción. */
export type Sel =
  | 'defensor' | 'fuente' | 'tribunaPropia' | 'tribunaRival'
  | 'elegirRival' | 'elegirBanquilloRival' | 'elegirPropio' | 'elegirBanquilloPropio' | 'elegirDanadoPropio'
  | 'todosRivales' | 'banquilloRival' | 'todosPropios' | 'banquilloPropio' | 'todos';

export type Temporal =
  | 'proteger' // no recibe daño de ataques
  | 'reducir' // −n al daño de ataques que reciba
  | 'noAtacar' // no puede atacar
  | 'noRetirarse' // no puede hacer relevo
  | 'bonoDano' // +n al daño de sus ataques (o de todo el jugador si va a 'yo')
  | 'sinAsesor' // el jugador no puede jugar Asesores
  | 'sinRecursos'; // el jugador no puede jugar Recursos

export type Efecto =
  | { e: 'masDano'; n: number }
  | { e: 'masDanoPor'; n: number; por: Contador; max?: number }
  | { e: 'fallar' }
  | { e: 'dano'; n: number; a: Sel; filtro?: FiltroPol }
  | { e: 'bulo'; n: number; a: Sel; filtro?: FiltroPol }
  | { e: 'autodano'; n: number }
  | { e: 'curar'; n: number | 'todo'; a: Sel; filtro?: FiltroPol }
  | { e: 'estado'; estado: EstadoAlterado; a: Sel; filtro?: FiltroPol }
  | { e: 'quitarEstados'; a: Sel }
  | { e: 'monedas'; n: number | 'votosFuente'; porCara: Efecto[] }
  | { e: 'hastaCruz'; porCara: Efecto[]; max?: number }
  | { e: 'moneda'; cara: Efecto[]; cruz?: Efecto[] }
  | { e: 'robar'; n: number; quien?: 'yo' | 'rival' | 'ambos' }
  | { e: 'robarHasta'; n: number }
  | { e: 'buscar'; filtro: FiltroCarta; n: number; destino: 'mano' | 'banquillo' }
  | { e: 'mirarMazo'; n: number; quien: 'yo' | 'rival'; tomar?: FiltroCarta }
  | { e: 'barajarManoRobar'; quien: 'yo' | 'rival' | 'ambos'; n: number | 'puntosPropiosMas' }
  | { e: 'descartarManoAzar'; n: number; quien: 'rival' | 'yo' }
  | { e: 'descartarMazo'; n: number; quien: 'rival' | 'yo' }
  | { e: 'verMano' }
  | { e: 'recuperar'; filtro: FiltroCarta; n: number; destino: 'mano' | 'mazo' }
  | { e: 'descartarVoto'; n: number | 'todos'; a: Sel; filtro?: FiltroPol }
  | { e: 'adjuntarVoto'; tipo: Tipo | 'zona'; n: number; a: Sel }
  | { e: 'moverVoto'; n: number; desde: 'banquilloPropio' | 'fuente'; a: Sel }
  | { e: 'cambiarRival'; elige: 'yo' | 'rival' }
  | { e: 'cambiarPropio' }
  | { e: 'devolverMano'; a: Sel }
  | { e: 'temporal'; t: Temporal; a: Sel | 'yo' | 'rival'; n?: number; dura: 'turnoRival' | 'esteTurno' }
  | { e: 'dedazo' }
  | { e: 'descartarHerramienta'; a: Sel }
  | { e: 'quitarEscenario' }
  | { e: 'apoyo'; n: number }
  | { e: 'apoyoPorAmbar' }
  | { e: 'quitarApoyos'; n: number }
  | { e: 'investidura' }
  | { e: 'clima'; n: number; minimo?: number }
  | { e: 'fijarClima'; n: number }
  | { e: 'audiencia'; n: number; quien: 'yo' | 'rival' }
  | { e: 'expulsarTertuliano' }
  | { e: 'quitarManiobra' }
  | { e: 'anular' }
  | { e: 'puntos'; n: number }
  | { e: 'si'; cond: Cond; entonces: Efecto[]; sino?: Efecto[] }
  | { e: 'elegir'; opciones: { texto: string; efectos: Efecto[] }[] }
  | { e: 'porCada'; por: Contador; efectos: Efecto[]; max?: number }
  | { e: 'votoExtraTurno' };

/** Modificadores continuos: los calcula `modificadores()` al vuelo a partir de lo que hay en juego. */
export interface Pasiva {
  p: 'dano' | 'defensa' | 'aguante' | 'relevo' | 'inmuneEstados' | 'curacion' | 'sinDebilidad' | 'costeIncoloro';
  n?: number;
  /** a quién afecta, respecto al dueño de la carta que la da */
  ambito: 'este' | 'aliados' | 'aliadosBanquillo' | 'rivales' | 'todos' | 'tribunaPropia' | 'tribunaRival';
  filtro?: FiltroPol;
  /** solo al atacar a un defensor que cumpla este filtro (pasivas de daño) */
  contra?: FiltroPol;
  por?: Contador;
  cond?: Cond;
  /** la carta que la da tiene que estar en la tribuna */
  soloTribuna?: boolean;
}

export type Disparo = 'activado' | 'mitin' | 'legado' | 'pasiva' | 'alRecibirDano' | 'inicioTurno';

export interface Carisma {
  nombre: string;
  texto: string;
  disparo: Disparo;
  efectos?: Efecto[];
  pasivas?: Pasiva[];
  requisito?: Cond;
  /** coste de usarla (se descartan votos de este político) */
  descartaVotos?: number;
}

export interface Accion {
  nombre: string;
  /** 'incoloro' en un coste = cualquier tipo */
  coste: Tipo[];
  dano: number;
  /** cómo se muestra el daño: «30+», «20×»… */
  danoTxt?: string;
  texto?: string;
  efectos?: Efecto[];
}

export type DisparoManiobra = 'alAtacar' | 'alJugarAsesor' | 'alJugarRecurso' | 'alBajarPolitico' | 'alDerribo' | 'alAscender';

interface CartaBase {
  id: string;
  num: number;
  coleccion: Coleccion;
  nombre: string;
  clase: Clase;
  rareza: Rareza;
  texto?: string;
  /** cita pública real (con su fuente en personas.ts) */
  frase?: string;
  /** clave en el registro de personas reales */
  persona?: string;
  /** descripción simbólica para la ilustración (sin caras ni logotipos) */
  escena: string;
  /** emblema del arte generado */
  icono: string;
  unica?: boolean;
  noticia?: boolean;
  retirada?: boolean;
  arquetipos?: string[];
  claves?: Clave[];
  /** carta pareja del otro bloque (misma potencia) */
  pareja?: string;
  /** condición de mazo de las Leyendas (si no se cumple, su Carisma no funciona) */
  leyenda?: Cond;
}

export interface CartaPolitico extends CartaBase {
  clase: 'politico';
  tipo: Tipo;
  /** segundo tipo de los fichajes */
  tipo2?: Tipo;
  partido: PartidoId;
  fase: Fase;
  /** nombre de la carta de la que asciende */
  de?: string;
  aguante: number;
  debilidad: Tipo | null;
  relevo: number;
  cl?: boolean;
  acciones: Accion[];
  carisma?: Carisma;
  /** cargo que se muestra bajo el nombre */
  cargo: string;
}

export interface CartaTertuliano extends CartaBase {
  clase: 'tertuliano';
  linea: 'progresista' | 'conservadora' | 'independiente';
  presentador?: boolean;
  programa?: string;
  audiencia: number;
  mitin?: Efecto[];
  inicioTurno?: Efecto[];
  pasivas?: Pasiva[];
  cargo: string;
}

export interface CartaEntrenador extends CartaBase {
  clase: 'asesor' | 'recurso' | 'herramienta' | 'escenario' | 'maniobra';
  efectos?: Efecto[];
  requisito?: Cond;
  pasivas?: Pasiva[];
  /** escenario temporal (noticias neutrales): se descarta tras estos turnos */
  duracion?: number;
  /** maniobras: cuándo saltan */
  disparo?: DisparoManiobra;
  /** herramientas: a quién se pueden poner */
  filtroHerramienta?: FiltroPol;
  /** escenarios: efectos al inicio de cada turno para el jugador en turno */
  inicioTurno?: Efecto[];
  cargo?: string;
}

export type Carta = CartaPolitico | CartaTertuliano | CartaEntrenador;

// ————————————————————————————————————— estado de la partida
export type Uid = number;

export interface EnJuego {
  uid: Uid; // carta de arriba
  debajo: Uid[]; // cartas de las que ascendió (de abajo arriba)
  dano: number;
  votos: Tipo[];
  herramienta: Uid | null;
  estados: Partial<Record<EstadoAlterado, number>>; // bloqueado guarda el turno en que expira
  entroTurno: number;
  ascendioTurno: number;
  carismaUsada: boolean;
}

export interface EnPlato {
  uid: Uid;
  audiencia: number;
  entroTurno: number;
}

export interface Jugador {
  nombre: string;
  tipos: Tipo[];
  lista: string[]; // ids de su mazo (para las Leyendas)
  mazo: Uid[];
  mano: Uid[];
  descarte: Uid[];
  tribuna: EnJuego | null;
  banquillo: EnJuego[];
  plato: EnPlato[];
  maniobras: Uid[];
  puntos: number;
  apoyos: PartidoId[];
  votoActual: Tipo | null;
  votoSiguiente: Tipo;
  revelado: boolean;
  /** manos que el rival puede ver (por «ver mano») */
  manoVista: boolean;
}

export interface TemporalActivo {
  t: Temporal;
  jug: Jug; // dueño del efecto (a quién afecta si uid es null)
  uid: Uid | null;
  n: number;
  /** se borra al terminar este turno */
  expira: number;
}

export interface Ctx {
  yo: Jug;
  /** político que origina el efecto (atacante, Carisma) */
  fuente?: Uid;
  /** carta que se jugó (entrenador, tertuliano, maniobra) */
  carta?: Uid;
  origen: 'ataque' | 'carisma' | 'entrenador' | 'tertuliano' | 'maniobra' | 'escenario' | 'legado';
  /** político objetivo del ataque (en las maniobras, el que las dispara) */
  defensor?: Uid;
  /** el efecto viene de jugar una carta de la mano (cuenta para el Combo) */
  deMano?: boolean;
}

export interface Ataque {
  jug: Jug;
  uid: Uid;
  i: number;
  dano: number;
  fallo: boolean;
  defensor: Uid;
  viral: boolean;
}

export type AccionJuego =
  | { a: 'bajar'; carta: Uid }
  | { a: 'ascender'; carta: Uid; sobre: Uid }
  | { a: 'voto'; sobre: Uid }
  | { a: 'entrenador'; carta: Uid }
  | { a: 'herramienta'; carta: Uid; sobre: Uid }
  | { a: 'tertuliano'; carta: Uid }
  | { a: 'carisma'; sobre: Uid }
  | { a: 'relevo'; a2: Uid }
  | { a: 'atacar'; i: number }
  | { a: 'pasar' };

export type PropositoObjetivo = 'reemplazo' | 'efecto' | 'tribunaInicial';
export type PropositoCartas = 'tribunaInicial' | 'banquilloInicial' | 'buscar' | 'recuperar' | 'descartar' | 'mirar' | 'dedazo';

export type Decision =
  | { tipo: 'accion'; jugador: Jug; acciones: AccionJuego[] }
  | { tipo: 'objetivo'; jugador: Jug; proposito: PropositoObjetivo; texto: string; opciones: Uid[]; min: number; max: number }
  | { tipo: 'cartas'; jugador: Jug; proposito: PropositoCartas; texto: string; opciones: Uid[]; visibles: Record<Uid, string>; min: number; max: number }
  | { tipo: 'opcion'; jugador: Jug; texto: string; opciones: string[] }
  | { tipo: 'espera'; jugador: Jug };

export type Respuesta =
  | { tipo: 'accion'; accion: AccionJuego }
  | { tipo: 'objetivo'; uids: Uid[] }
  | { tipo: 'cartas'; uids: Uid[] }
  | { tipo: 'opcion'; i: number };

export interface EntradaRegistro {
  turno: number;
  jug: Jug | null;
  texto: string;
  /** si solo lo puede ver un jugador */
  solo?: Jug;
}

/** Lo que pasa, en datos, para animar y para que el plató cuente la partida. */
export type Suceso =
  | { s: 'moneda'; cara: boolean; jug: Jug }
  | { s: 'jugada'; jug: Jug; carta: string; uid: Uid }
  | { s: 'ataque'; jug: Jug; uid: Uid; accion: string; dano: number; defensor: Uid }
  | { s: 'dano'; uid: Uid; n: number; jug: Jug }
  | { s: 'cura'; uid: Uid; n: number; jug: Jug }
  | { s: 'ko'; uid: Uid; carta: string; jug: Jug; puntos: number }
  | { s: 'ascenso'; uid: Uid; carta: string; jug: Jug }
  | { s: 'estado'; uid: Uid; estado: EstadoAlterado; jug: Jug }
  | { s: 'clima'; antes: number; despues: number }
  | { s: 'ruptura'; culpable: Jug }
  | { s: 'maniobra'; jug: Jug; carta: string }
  | { s: 'tertuliano'; jug: Jug; carta: string }
  | { s: 'apoyo'; jug: Jug; partido: PartidoId }
  | { s: 'sinFondos'; jug: Jug }
  | { s: 'turno'; jug: Jug; turno: number }
  | { s: 'fin'; ganador: Jug | null; motivo: string };

export type Tarea =
  | { t: 'preparar'; jug: Jug; paso: 0 | 1 }
  | { t: 'revelar' }
  | { t: 'inicioTurno' }
  | { t: 'principal' }
  | { t: 'efectos'; lista: Efecto[]; i: number; ctx: Ctx }
  | { t: 'efecto'; ef: Efecto; ctx: Ctx; datos?: number[] }
  | { t: 'efectosAnulables'; lista: Efecto[]; ctx: Ctx }
  | { t: 'aDescarte'; jug: Jug; uid: Uid }
  | { t: 'ataque' }
  | { t: 'danoAtaque' }
  | { t: 'kos' }
  | { t: 'reemplazo'; jug: Jug }
  | { t: 'finTurno' }
  | { t: 'recuento' }
  | { t: 'maniobras'; disparo: DisparoManiobra; jug: Jug; ctx: Ctx };

export interface Partida {
  v: 1;
  rng: number;
  turno: number;
  enTurno: Jug;
  primero: Jug;
  fase: 'preparacion' | 'juego' | 'fin';
  jugadores: [Jugador, Jugador];
  cartaDe: Record<Uid, string>; // uid → id de carta (las Shiny llevan «*» al final)
  sigUid: number;
  escenario: { uid: Uid; dueno: Jug; hasta: number | null } | null;
  clima: number;
  flags: { voto: boolean; asesor: boolean; relevo: boolean; escenario: boolean; jugadas: number; votoExtra: number };
  temporales: TemporalActivo[];
  ataque: Ataque | null;
  /** la acción que puede anular una maniobra */
  anulada: boolean;
  pila: Tarea[];
  pendiente: Decision | null;
  registro: EntradaRegistro[];
  sucesos: Suceso[];
  ganador: { jug: Jug | null; motivo: string } | null;
  silencio?: boolean;
}

/** Lo que ve un jugador: la partida sin lo que no le toca ver. */
export type Vista = Omit<Partida, 'rng' | 'pila'> & { yo: Jug; rng: 0; pila: [] };
