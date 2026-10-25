// Texto de reglas generado a partir de los efectos: lo que pone la carta es exactamente lo que hace.
import type { Cond, Contador, Efecto, EstadoAlterado, FiltroCarta, FiltroPol, Pasiva, Sel, Temporal, Tipo } from '../motor/tipos';
import { TIPO_INFO } from './partidos';

const TIPO_ADJ: Record<Tipo, [string, string]> = {
  rojo: ['rojo', 'rojos'], magenta: ['magenta', 'magenta'], azul: ['azul', 'azules'], verde: ['verde', 'verdes'],
  morado: ['morado', 'morados'], ambar: ['ámbar', 'ámbar'], incoloro: ['incoloro', 'incoloros'],
};

const SEL: Record<Sel, string> = {
  defensor: 'el defensor', fuente: 'este político', tribunaPropia: 'tu tribuna', tribunaRival: 'la tribuna rival',
  elegirRival: 'un político rival', elegirBanquilloRival: 'un político del banquillo rival', elegirPropio: 'uno de tus políticos',
  elegirBanquilloPropio: 'uno de tu banquillo', elegirDanadoPropio: 'uno de tus políticos dañados', todosRivales: 'cada político rival',
  banquilloRival: 'cada político del banquillo rival', todosPropios: 'cada uno de tus políticos', banquilloPropio: 'cada político de tu banquillo',
  todos: 'cada político en juego',
};

const ESTADO: Record<EstadoAlterado, string> = {
  sospecha: 'Bajo sospecha', quemado: 'Quemado', desconectado: 'Desconectado', bloqueado: 'Bloqueado', desnortado: 'Desnortado',
};

const CONTADOR: Record<Contador, string> = {
  votosDefensor: 'voto del defensor', votosAtacante: 'voto de este político', votosExtra: 'voto de más que tenga este político',
  aliadosPartido: 'aliado de su partido en juego', aliadosTipo: 'aliado de su tipo en juego', aliados: 'aliado en juego',
  banquilloPropio: 'político en tu banquillo', banquilloRival: 'político en el banquillo rival', contadoresPropios: '10 de desgaste que tenga',
  contadoresDefensor: '10 de desgaste del defensor', manoRival: 'carta en la mano rival', manoPropia: 'carta en tu mano', apoyos: 'Apoyo que tengas',
  tertulianosPropios: 'tertuliano en tu plató', jugadasTurno: 'carta que hayas jugado este turno', puntosRival: 'punto del rival',
  puntosPropios: 'punto que tengas', descartePropio: 'carta en tu descarte', crispacion: 'nivel de crispación (5 − Clima)',
  tiposEnJuego: 'tipo distinto entre tus políticos', estadosDefensor: 'estado del defensor', danadosRivales: 'político rival dañado',
  mazoRivalVacio: 'mazo rival vacío', entrenadoresDescarte: 'entrenador en tu descarte',
};

const TEMPORAL: Record<Temporal, (n: number) => string> = {
  proteger: () => 'no recibe daño de ataques',
  reducir: (n) => `recibe ${n} menos de daño de ataques`,
  noAtacar: () => 'no puede atacar',
  noRetirarse: () => 'no puede hacer relevo',
  bonoDano: (n) => `hace ${n} más de daño`,
  sinAsesor: () => 'no puede jugar Asesores',
  sinRecursos: () => 'no puede jugar Recursos',
};

export function tipoTxt(t: Tipo, plural = false) {
  return TIPO_ADJ[t][plural ? 1 : 0];
}

function lista(xs: string[], y = 'o'): string {
  if (xs.length <= 1) return xs[0] ?? '';
  return `${xs.slice(0, -1).join(', ')} ${y} ${xs[xs.length - 1]}`;
}

export function filtroPolTxt(f: FiltroPol | undefined, plural = true): string {
  if (!f) return plural ? 'políticos' : 'político';
  const partes: string[] = [plural ? 'políticos' : 'político'];
  if (f.fase) partes.push(lista(f.fase.map((x) => (x === 'basico' ? (plural ? 'Básicos' : 'Básico') : x === 'fase1' ? 'de Fase 1' : 'de Fase 2'))));
  if (f.tipo) partes.push(lista(f.tipo.map((t) => tipoTxt(t, plural))));
  if (f.partido) partes.push(`de ${lista(f.partido)}`);
  if (f.bloque) partes.push(`del bloque ${lista(f.bloque)}`);
  if (f.cl) partes.push('Cabeza de lista');
  if (f.nombre) partes.push(`llamados ${lista(f.nombre.map((n) => `«${n}»`))}`);
  if (f.danado) partes.push('dañados');
  return partes.join(' ');
}

export function filtroCartaTxt(f: FiltroCarta): string {
  const clase: Record<string, string> = { politico: 'político', tertuliano: 'tertuliano', asesor: 'Asesor', recurso: 'Recurso', herramienta: 'Herramienta', escenario: 'Escenario', maniobra: 'Maniobra' };
  const partes: string[] = [];
  if (f.clase) partes.push(lista(f.clase.map((c) => clase[c])));
  else if (f.fase || f.tipo || f.partido) partes.push('político');
  else partes.push('carta');
  if (f.fase) partes.push(lista(f.fase.map((x) => (x === 'basico' ? 'Básico' : x === 'fase1' ? 'de Fase 1' : 'de Fase 2'))));
  if (f.tipo) partes.push(lista(f.tipo.map((t) => tipoTxt(t))));
  if (f.partido) partes.push(`de ${lista(f.partido)}`);
  if (f.noticia) partes.push('Noticia');
  if (f.nombre) partes.push(lista(f.nombre.map((n) => `«${n}»`)));
  if (f.asciendeDeEnJuego) partes.push('que ascienda de uno de tus políticos');
  return partes.join(' ');
}

export function condTxt(c: Cond): string {
  switch (c.c) {
    case 'climaMax': return c.n === 2 ? 'el Clima está en Guerra sucia o peor' : `el Clima está en ${c.n} o menos`;
    case 'climaMin': return c.n === 5 ? 'el Clima está Sereno' : `el Clima está en ${c.n} o más`;
    case 'defensorDanado': return 'el defensor ya tiene desgaste';
    case 'defensorTipo': return `el defensor es ${lista(c.tipo.map((t) => tipoTxt(t)))}`;
    case 'defensorCL': return 'el defensor es Cabeza de lista';
    case 'defensorEstado': return 'el defensor sufre algún estado';
    case 'defensorBasico': return 'el defensor es Básico';
    case 'fuenteDanada': return 'este político tiene desgaste';
    case 'voyPerdiendo': return 'vas por detrás en escaños';
    case 'combo': return (c.n ?? 1) === 1 ? 'ya has jugado otra carta este turno' : `ya has jugado ${c.n} cartas más este turno`;
    case 'coalicion': return `tienes políticos de ${c.n} tipos distintos en juego`;
    case 'granCoalicion': return 'tienes en juego políticos de los dos bloques';
    case 'aliadosPartido': return c.n === 1 ? 'tienes otro político de su partido en juego' : `tienes ${c.n} políticos más de su partido en juego`;
    case 'aliadosTipo': return `tienes ${c.n} político${c.n === 1 ? '' : 's'} ${tipoTxt(c.tipo, c.n !== 1)} más en juego`;
    case 'tengoTertuliano': return c.presentador ? 'tienes un presentador en tu plató' : 'tienes algún tertuliano en tu plató';
    case 'hayEscenario': return 'hay un Escenario en juego';
    case 'banquilloRivalMin': return `el rival tiene ${c.n} o más en el banquillo`;
    case 'banquilloPropioMin': return `tienes ${c.n} o más en el banquillo`;
    case 'manoRivalMin': return `el rival tiene ${c.n} o más cartas en la mano`;
    case 'manoPropiaMax': return c.n === 0 ? 'no tienes cartas en la mano' : `tienes ${c.n} cartas o menos en la mano`;
    case 'apoyosMin': return `tienes ${c.n} Apoyos o más${c.partidos ? ` de ${c.partidos} partidos distintos` : ''}`;
    case 'mazoRivalMax': return c.n === 0 ? 'el mazo rival está vacío' : `al rival le quedan ${c.n} cartas o menos en el mazo`;
    case 'mazoPropioMin': return `te quedan ${c.n} cartas o más en el mazo`;
    case 'votosFuenteMin': return `este político tiene ${c.n} votos o más`;
    case 'mazoSinRepetidas': return 'tu mazo no tiene cartas repetidas';
    case 'tribunaPropiaDanada': return 'tu tribuna tiene desgaste';
    case 'rivalTieneManiobra': return 'el rival tiene alguna maniobra preparada';
    case 'no': return `no se cumple que ${condTxt(c.cond)}`;
    case 'y': return lista(c.conds.map(condTxt), 'y');
  }
}

const n10 = (n: number) => `${n}`;

/** «cada político en juego», «la tribuna rival» y, si hay filtro, «… que sea rojo». */
function selTxt(a: Sel, f?: FiltroPol): string {
  if (!f) return SEL[a];
  const partes: string[] = [];
  if (f.tipo) partes.push(lista(f.tipo.map((t) => tipoTxt(t))));
  if (f.bloque) partes.push(`del bloque ${lista(f.bloque)}`);
  if (f.partido) partes.push(`de ${lista(f.partido)}`);
  if (f.fase) partes.push(lista(f.fase.map((x) => (x === 'basico' ? 'Básico' : x === 'fase1' ? 'de Fase 1' : 'de Fase 2'))));
  if (f.cl) partes.push('Cabeza de lista');
  return `${SEL[a]} (solo si es ${partes.join(' y ')})`;
}

export function efectoTxt(ef: Efecto): string {
  switch (ef.e) {
    case 'masDano': return `este ataque hace ${n10(ef.n)} más`;
    case 'masDanoPor': return `este ataque hace ${ef.n} más por cada ${CONTADOR[ef.por]}${ef.max ? ` (máx. ${ef.max})` : ''}`;
    case 'fallar': return 'el ataque no hace nada';
    case 'dano': return `${ef.n} de daño a ${selTxt(ef.a, ef.filtro)}`;
    case 'bulo': return `coloca ${ef.n} de desgaste (bulo) en ${selTxt(ef.a, ef.filtro)}`;
    case 'autodano': return `este político recibe ${ef.n} de daño`;
    case 'curar': return ef.n === 'todo' ? `cura todo el desgaste de ${selTxt(ef.a, ef.filtro)}` : `cura ${ef.n} a ${selTxt(ef.a, ef.filtro)}`;
    case 'estado': return `${selTxt(ef.a, ef.filtro)} queda ${ESTADO[ef.estado]}`;
    case 'quitarEstados': return `${SEL[ef.a]} se libra de los estados`;
    case 'monedas': return `tira ${ef.n === 'votosFuente' ? 'una moneda por cada voto de este político' : `${ef.n} monedas`}: por cada cara, ${efectosTxt(ef.porCara, false)}`;
    case 'hastaCruz': return `tira monedas hasta sacar cruz: por cada cara, ${efectosTxt(ef.porCara, false)}`;
    case 'moneda': return `tira una moneda: con cara, ${efectosTxt(ef.cara, false)}${ef.cruz?.length ? `; con cruz, ${efectosTxt(ef.cruz, false)}` : ''}`;
    case 'robar': return ef.quien === 'rival' ? `el rival roba ${ef.n}` : ef.quien === 'ambos' ? `cada jugador roba ${ef.n}` : `roba ${ef.n} carta${ef.n === 1 ? '' : 's'}`;
    case 'robarHasta': return `roba hasta tener ${ef.n} cartas en la mano`;
    case 'buscar': return `busca en tu mazo ${ef.n === 1 ? 'un' : `hasta ${ef.n}`} ${filtroCartaTxt(ef.filtro)} y ${ef.destino === 'mano' ? 'llévalo a tu mano' : 'ponlo en tu banquillo'}`;
    case 'mirarMazo': return `mira las ${ef.n} primeras cartas ${ef.quien === 'yo' ? 'de tu mazo' : 'del mazo rival'}${ef.tomar ? ` y quédate un ${filtroCartaTxt(ef.tomar)}` : ''}`;
    case 'barajarManoRobar': {
      const q = ef.quien === 'yo' ? 'barajas tu mano en el mazo' : ef.quien === 'rival' ? 'el rival baraja su mano en el mazo' : 'cada jugador baraja su mano en el mazo';
      return `${q} y roba ${ef.n === 'puntosPropiosMas' ? 'una carta más que los puntos que le falten para ganar' : ef.n}`;
    }
    case 'descartarManoAzar': return ef.quien === 'rival' ? `el rival descarta ${ef.n} carta${ef.n === 1 ? '' : 's'} al azar` : `descarta ${ef.n} carta${ef.n === 1 ? '' : 's'} al azar`;
    case 'descartarMazo': return ef.quien === 'rival' ? `el rival pierde las ${ef.n} primeras cartas de su mazo` : `pierdes las ${ef.n} primeras cartas de tu mazo`;
    case 'verMano': return 've la mano del rival';
    case 'recuperar': return `recupera del descarte ${ef.n === 1 ? 'un' : `hasta ${ef.n}`} ${filtroCartaTxt(ef.filtro)} ${ef.destino === 'mano' ? 'a tu mano' : 'y barájalo en tu mazo'}`;
    case 'descartarVoto': return `${selTxt(ef.a, ef.filtro)} pierde ${ef.n === 'todos' ? 'todos sus votos' : `${ef.n} voto${ef.n === 1 ? '' : 's'}`}`;
    case 'adjuntarVoto': return `da ${ef.n} voto${ef.n === 1 ? '' : 's'} ${ef.tipo === 'zona' ? 'de tu zona de voto' : tipoTxt(ef.tipo, ef.n !== 1)} a ${SEL[ef.a]}`;
    case 'moverVoto': return `mueve ${ef.n} voto${ef.n === 1 ? '' : 's'} ${ef.desde === 'fuente' ? 'de este político' : 'de tu banquillo'} a ${SEL[ef.a]}`;
    case 'cambiarRival': return `cambia la tribuna rival por un político de su banquillo (${ef.elige === 'yo' ? 'lo eliges tú' : 'lo elige el rival'})`;
    case 'cambiarPropio': return 'cambia tu tribuna por un político de tu banquillo';
    case 'devolverMano': return `${SEL[ef.a]} vuelve a la mano de su dueño con todas sus cartas`;
    case 'temporal': {
      const quien = ef.a === 'yo' ? 'tus políticos' : ef.a === 'rival' ? 'el rival' : SEL[ef.a];
      const cuando = ef.dura === 'esteTurno' ? 'este turno' : 'durante el próximo turno rival';
      const verbo = ef.a === 'yo' && ef.t === 'bonoDano' ? `hacen ${ef.n} más de daño` : TEMPORAL[ef.t](ef.n ?? 0);
      return `${cuando}, ${quien} ${verbo}`;
    }
    case 'dedazo': return 'asciende un Básico de tu mesa directamente a la Fase 2 que tengas en la mano (no en tu primer turno ni con uno recién bajado)';
    case 'descartarHerramienta': return `${SEL[ef.a]} pierde su Herramienta`;
    case 'quitarEscenario': return 'retira el Escenario en juego';
    case 'apoyo': return `suma ${ef.n} Apoyo${ef.n === 1 ? '' : 's'} de su partido`;
    case 'apoyoPorAmbar': return 'cada uno de tus políticos ámbar en juego te da 1 Apoyo de su partido';
    case 'quitarApoyos': return `el rival pierde ${ef.n} Apoyo${ef.n === 1 ? '' : 's'}`;
    case 'investidura': return 'con 6 Apoyos de 4 partidos distintos, ganas la partida';
    case 'clima': return `el Clima ${ef.n > 0 ? 'mejora' : 'empeora'} ${Math.abs(ef.n)}`;
    case 'fijarClima': return `el Clima pasa a ${ef.n}`;
    case 'audiencia': return `${ef.quien === 'yo' ? 'tus tertulianos' : 'los tertulianos rivales'} ${ef.n > 0 ? 'ganan' : 'pierden'} ${Math.abs(ef.n)} de Audiencia`;
    case 'expulsarTertuliano': return 'echa del plató a un tertuliano rival';
    case 'quitarManiobra': return 'destapa y descarta una maniobra rival al azar';
    case 'anular': return 'anula esa jugada';
    case 'puntos': return `ganas ${ef.n} punto${ef.n === 1 ? '' : 's'}`;
    case 'si': return `si ${condTxt(ef.cond)}, ${efectosTxt(ef.entonces, false)}${ef.sino?.length ? `; si no, ${efectosTxt(ef.sino, false)}` : ''}`;
    case 'elegir': return `elige: ${ef.opciones.map((o) => `${o.texto} (${efectosTxt(o.efectos, false)})`).join(' o ')}`;
    case 'porCada': return `por cada ${CONTADOR[ef.por]}, ${efectosTxt(ef.efectos, false)}`;
    case 'votoExtraTurno': return 'recibes otro voto de tu zona este turno';
  }
}

export function efectosTxt(efs: Efecto[], frase = true): string {
  const t = efs.map(efectoTxt).join('; ');
  if (!frase) return t;
  return t ? t.charAt(0).toUpperCase() + t.slice(1) + '.' : '';
}

const AMBITO: Record<Pasiva['ambito'], string> = {
  este: 'Este político', aliados: 'Tus políticos', aliadosBanquillo: 'Tus políticos del banquillo', rivales: 'Los políticos rivales',
  todos: 'Todos los políticos', tribunaPropia: 'Tu tribuna', tribunaRival: 'La tribuna rival',
};

export function pasivaTxt(p: Pasiva): string {
  let sujeto = AMBITO[p.ambito];
  if (p.filtro) {
    const f = filtroPolTxt(p.filtro, true).replace(/^políticos ?/, '');
    if (f) sujeto = p.ambito === 'este' ? sujeto : `${sujeto} ${f}`;
  }
  const plural = !['este', 'tribunaPropia', 'tribunaRival'].includes(p.ambito);
  const por = p.por ? ` por cada ${CONTADOR[p.por]}` : '';
  const n = p.n ?? 0;
  let pred = '';
  switch (p.p) {
    case 'dano': pred = `${plural ? 'hacen' : 'hace'} ${n > 0 ? '+' : ''}${n} de daño${por}${p.contra ? ` contra ${filtroPolTxt(p.contra)}` : ''}`; break;
    case 'defensa': pred = `${plural ? 'reciben' : 'recibe'} ${n} menos de daño${por}`; break;
    case 'aguante': pred = `${plural ? 'tienen' : 'tiene'} +${n} de aguante${por}`; break;
    case 'relevo': pred = n < 0 ? `${plural ? 'tienen' : 'tiene'} ${-n} menos de relevo${por}` : `${plural ? 'tienen' : 'tiene'} ${n} más de relevo${por}`; break;
    case 'inmuneEstados': pred = `${plural ? 'son inmunes' : 'es inmune'} a los estados`; break;
    case 'curacion': pred = `${plural ? 'se curan' : 'se cura'} ${n} más`; break;
    case 'sinDebilidad': pred = `no ${plural ? 'tienen' : 'tiene'} debilidad`; break;
    case 'costeIncoloro': pred = `${plural ? 'pagan' : 'paga'} ${n} voto${n === 1 ? '' : 's'} incoloro${n === 1 ? '' : 's'} menos en sus acciones`; break;
  }
  const cond = p.cond ? ` si ${condTxt(p.cond)}` : '';
  const trib = p.soloTribuna ? ' mientras esté en la tribuna' : '';
  return `${sujeto} ${pred}${cond}${trib}.`;
}

export const nombreTipo = (t: Tipo) => TIPO_INFO[t].nombre;
export const nombreEstado = (s: EstadoAlterado) => ESTADO[s];
