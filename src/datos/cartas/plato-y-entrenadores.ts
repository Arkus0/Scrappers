// Expansión 29N · Tertulianos (plató), Asesores, Recursos, Herramientas, Escenarios, Noticias y Maniobras (N-135 …).
// Los tertulianos van en parejas por línea editorial pública, con efectos idénticos para cada bloque.
// Lo que dicen las cartas es mecánica de juego: no se atribuyen frases ni hechos a los periodistas.
import { E, entrenador, reflejar, tertuliano, type DefEntrenador, type DefTertuliano } from '../constructores';
import type { Carta, Efecto, FiltroPol, Pasiva } from '../../motor/tipos';

const N = '29n' as const;
let n = 134;
const PROG: FiltroPol = { bloque: ['progresista'] };

type Mitad = Omit<DefTertuliano, 'num' | 'linea' | 'mitin' | 'inicioTurno' | 'pasivas' | 'audiencia' | 'rareza' | 'presentador'>;
interface Mecanica { audiencia: number; rareza: DefTertuliano['rareza']; presentador?: boolean; mitin?: Efecto[]; inicioTurno?: Efecto[]; pasivas?: Pasiva[]; arquetipos?: string[] }

/** Pareja de tertulianos: la mecánica se escribe para la línea progresista y se refleja para la conservadora. */
function parTert(m: Mecanica, prog: Mitad, cons: Mitad): Carta[] {
  const a = tertuliano(N, { ...m, ...prog, num: ++n, linea: 'progresista', arquetipos: ['plato', ...(m.arquetipos ?? [])] });
  const b = tertuliano(N, { ...reflejar({ mitin: m.mitin, inicioTurno: m.inicioTurno, pasivas: m.pasivas }), audiencia: m.audiencia, rareza: m.rareza, presentador: m.presentador, ...cons, num: ++n, linea: 'conservadora', arquetipos: ['plato', ...(m.arquetipos ?? [])] });
  a.pareja = b.id;
  b.pareja = a.id;
  return [a, b];
}
const ind = (d: Omit<DefTertuliano, 'num' | 'linea'>) => tertuliano(N, { ...d, num: ++n, linea: 'independiente', arquetipos: ['plato', ...(d.arquetipos ?? [])] });
const ent = (d: Omit<DefEntrenador, 'num'>) => entrenador(N, { ...d, num: ++n });

export const CARTAS_TERTULIANOS: Carta[] = [
  // ——— presentadores
  ...parTert({ audiencia: 3, rareza: 'R', presentador: true, mitin: [E.robar(1)], pasivas: [{ p: 'dano', n: 10, ambito: 'aliados', filtro: PROG }] },
    { nombre: 'Antonio García Ferreras', persona: 'ferreras', cargo: 'Presentador de Al Rojo Vivo', programa: 'Al Rojo Vivo (laSexta)', escena: 'Un plató con pantallas gigantes rojas, una mesa en forma de U y un piloto de «en directo»', icono: 'plato' },
    { nombre: 'Ana Rosa Quintana', persona: 'ana-rosa', cargo: 'Presentadora de Telecinco', programa: 'Telecinco', escena: 'Un plató luminoso con una mesa larga, tazas de café y una gran pantalla azul', icono: 'plato' }),
  ...parTert({ audiencia: 3, rareza: 'R', presentador: true, inicioTurno: [E.si({ c: 'manoPropiaMax', n: 3 }, [E.robar(1)])] },
    { nombre: 'Javier Ruiz', persona: 'javier-ruiz', cargo: 'Periodista y presentador de RTVE', programa: 'RTVE', escena: 'Una pizarra electrónica llena de gráficos económicos en un plató matinal', icono: 'grafico' },
    { nombre: 'Vicente Vallés', persona: 'vicente-valles', cargo: 'Presentador de Antena 3 Noticias', programa: 'Antena 3 Noticias', escena: 'Una mesa de informativos con un fondo de ciudad nocturna y un reloj', icono: 'camara' }),
  ...parTert({ audiencia: 3, rareza: 'R', presentador: true, pasivas: [{ p: 'dano', n: 20, ambito: 'aliados', contra: { bloque: ['conservador'] } }] },
    { nombre: 'Jesús Cintora', persona: 'jesus-cintora', cargo: 'Presentador de Malas lenguas', programa: 'Malas lenguas (La 2)', escena: 'Un plató con lenguas de neón y una mesa de tertulia en penumbra', icono: 'microfono' },
    { nombre: 'Federico Jiménez Losantos', persona: 'losantos', cargo: 'Director y presentador de esRadio', programa: 'esRadio', escena: 'Un estudio de radio con un micrófono antiguo y una luz roja de emisión', icono: 'radio' }),
  ...parTert({ audiencia: 2, rareza: 'R', presentador: true, inicioTurno: [E.voto('zona', 'tribunaPropia')] },
    { nombre: 'Àngels Barceló', persona: 'angels-barcelo', cargo: 'Directora de Hoy por hoy', programa: 'Hoy por hoy (Cadena SER)', escena: 'Un estudio de radio al amanecer con tazas de café y auriculares sobre la mesa', icono: 'auricular' },
    { nombre: 'Carlos Herrera', persona: 'carlos-herrera', cargo: 'Presentador de Herrera en COPE', programa: 'Herrera en COPE', escena: 'Un estudio de radio al amanecer con un micrófono dorado y una persiana entreabierta', icono: 'auricular' }),
  // ——— colaboradores
  ...parTert({ audiencia: 2, rareza: 'I', mitin: [E.bulo(20, 'elegirRival')], arquetipos: ['bulo'] },
    { nombre: 'Sarah Santaolalla', persona: 'sarah-santaolalla', cargo: 'Tertuliana y analista política', escena: 'Una silla de tertulia con un micrófono de solapa y un vaso de agua a medias', icono: 'microfono' },
    { nombre: 'Javier Negre', persona: 'javier-negre', cargo: 'Periodista y director de un medio digital', escena: 'Un micrófono de mano con una alcachofa grande en un pasillo lleno de gente', icono: 'microfono' }),
  ...parTert({ audiencia: 2, rareza: 'I', mitin: [{ e: 'mirarMazo', n: 3, quien: 'rival' }, E.robar(1)], arquetipos: ['control'] },
    { nombre: 'Antonio Maestre', persona: 'antonio-maestre', cargo: 'Periodista y tertuliano', escena: 'Una libreta llena de anotaciones y un bolígrafo mordido junto a un micrófono', icono: 'cuaderno' },
    { nombre: 'Eduardo Inda', persona: 'eduardo-inda', cargo: 'Director de OKDiario', escena: 'Una pila de periódicos con titulares borrosos y un sobre lacrado encima', icono: 'periodico' }),
  ...parTert({ audiencia: 2, rareza: 'C', pasivas: [{ p: 'defensa', n: 10, ambito: 'aliados', filtro: PROG }], arquetipos: ['tregua'] },
    { nombre: 'Elisa Beni', persona: 'elisa-beni', cargo: 'Periodista y tertuliana', escena: 'Un mazo de juez de madera sobre un periódico abierto por la sección de tribunales', icono: 'martillo' },
    { nombre: 'Isabel San Sebastián', persona: 'isabel-san-sebastian', cargo: 'Periodista y escritora', escena: 'Una novela histórica abierta sobre una mesa de redacción', icono: 'libro' }),
  ...parTert({ audiencia: 2, rareza: 'C', inicioTurno: [E.bulo(10, 'tribunaRival')], arquetipos: ['bulo'] },
    { nombre: 'Ana Pardo de Vera', persona: 'ana-pardo-de-vera', cargo: 'Periodista y tertuliana', escena: 'Una redacción vacía de madrugada con una pantalla encendida', icono: 'periodico' },
    { nombre: 'Isabel Durán', persona: 'isabel-duran', cargo: 'Periodista y tertuliana', escena: 'Un micrófono de mesa con un dossier de prensa subrayado', icono: 'carpeta' }),
  ...parTert({ audiencia: 2, rareza: 'C', mitin: [E.clima(-1), E.robar(1)], arquetipos: ['crispacion'] },
    { nombre: 'Esther Palomera', persona: 'esther-palomera', cargo: 'Periodista de elDiario.es', escena: 'Un pasillo del Congreso con periodistas esperando junto a una puerta', icono: 'columna' },
    { nombre: 'Francisco Marhuenda', persona: 'francisco-marhuenda', cargo: 'Director de La Razón', escena: 'Una rotativa imprimiendo de noche con pliegos volando', icono: 'periodico' }),
  ...parTert({ audiencia: 2, rareza: 'I', mitin: [{ e: 'buscar', filtro: { noticia: true }, n: 1, destino: 'mano' }], arquetipos: ['control'] },
    { nombre: 'Ignacio Escolar', persona: 'ignacio-escolar', cargo: 'Director de elDiario.es', escena: 'Una exclusiva impresa con el titular tapado por una mano', icono: 'periodico' },
    { nombre: 'Pedro J. Ramírez', persona: 'pedro-j-ramirez', cargo: 'Director de El Español', escena: 'Un tirante rojo colgado de una silla de dirección frente a una portada', icono: 'periodico' }),
  ...parTert({ audiencia: 2, rareza: 'C', pasivas: [{ p: 'relevo', n: -1, ambito: 'aliados', filtro: PROG }] },
    { nombre: 'Javier Aroca', persona: 'javier-aroca', cargo: 'Tertuliano y escritor', escena: 'Una bodega sevillana con un vaso de fino y un periódico doblado', icono: 'periodico' },
    { nombre: 'Graciano Palomo', persona: 'graciano-palomo', cargo: 'Periodista y tertuliano', escena: 'Una máquina de escribir antigua junto a una pila de crónicas parlamentarias', icono: 'pluma' }),
  ...parTert({ audiencia: 2, rareza: 'C', inicioTurno: [E.cura(10, 'tribunaPropia')], arquetipos: ['tregua'] },
    { nombre: 'Jesús Maraña', persona: 'jesus-marana', cargo: 'Director editorial de infoLibre', escena: 'Una libreta de reportero sobre una mesa de café con la luz de la mañana', icono: 'cuaderno' },
    { nombre: 'Alfonso Rojo', persona: 'alfonso-rojo', cargo: 'Director de Periodista Digital', escena: 'Un chaleco de corresponsal de guerra colgado en una redacción', icono: 'periodico' }),
  // ——— independientes
  ind({ nombre: 'Jordi Évole', persona: 'jordi-evole', cargo: 'Periodista y presentador', programa: 'Lo de Évole (laSexta)', audiencia: 2, rareza: 'R', mitin: [{ e: 'verMano' }, E.robar(1)], escena: 'Dos sillas enfrentadas en una habitación austera con una cámara al fondo', icono: 'camara' }),
  ind({ nombre: 'Iñaki Gabilondo', persona: 'inaki-gabilondo', cargo: 'Periodista', audiencia: 3, rareza: 'R', presentador: true, mitin: [E.clima(1)], pasivas: [{ p: 'curacion', n: 10, ambito: 'aliados' }], arquetipos: ['tregua'], escena: 'Un micrófono de radio veterano sobre una mesa de madera con un vaso de agua', icono: 'radio' }),
  ind({ nombre: 'Susanna Griso', persona: 'susanna-griso', cargo: 'Presentadora de Espejo Público', programa: 'Espejo Público (Antena 3)', audiencia: 2, rareza: 'I', presentador: true, inicioTurno: [E.robar(1)], escena: 'Un espejo enorme en un plató matinal reflejando una mesa vacía', icono: 'plato' }),
  ind({ nombre: 'Lucía Méndez', persona: 'lucia-mendez', cargo: 'Periodista de El Mundo', audiencia: 2, rareza: 'C', mitin: [{ e: 'quitarManiobra' }], arquetipos: ['maniobras'], escena: 'Una lupa sobre una cerradura de una puerta de despacho', icono: 'lupa' }),
  ind({ nombre: 'Pepa Bueno', persona: 'pepa-bueno', cargo: 'Periodista', audiencia: 2, rareza: 'I', pasivas: [{ p: 'inmuneEstados', ambito: 'tribunaPropia' }], escena: 'Una mesa de redacción ordenada con una taza y una agenda abierta', icono: 'taza' }),
  ind({ nombre: 'Iñaki López', persona: 'inaki-lopez', cargo: 'Presentador de laSexta Xplica', programa: 'laSexta Xplica', audiencia: 2, rareza: 'I', presentador: true, pasivas: [{ p: 'dano', n: 10, ambito: 'aliados' }], escena: 'Un plató circular con público en gradas y una pantalla de votación', icono: 'estadio' }),
];

const PAR_ASESOR = (d: Omit<DefEntrenador, 'num' | 'clase'>, otro: Pick<DefEntrenador, 'nombre' | 'persona' | 'cargo' | 'escena' | 'icono'>): Carta[] => {
  const a = ent({ ...d, clase: 'asesor' });
  const b = ent({ ...d, ...otro, clase: 'asesor' });
  a.pareja = b.id;
  b.pareja = a.id;
  return [a, b];
};

export const CARTAS_ASESORES: Carta[] = [
  ...PAR_ASESOR({ nombre: 'Iván Redondo', persona: 'ivan-redondo', cargo: 'Exjefe de gabinete de Pedro Sánchez (2018-2021)', rareza: 'R', efectos: [{ e: 'robarHasta', n: 5 }], requisito: { c: 'manoPropiaMax', n: 4 }, escena: 'Un tablero de ajedrez a medio jugar con una pieza roja avanzada', icono: 'dado' },
    { nombre: 'Miguel Ángel Rodríguez', persona: 'miguel-angel-rodriguez', cargo: 'Jefe de gabinete de Isabel Díaz Ayuso', escena: 'Un tablero de ajedrez a medio jugar con una pieza azul avanzada', icono: 'dado' }),
  ...PAR_ASESOR({ nombre: 'Belén Barreiro', persona: 'belen-barreiro', cargo: 'Directora de 40dB', rareza: 'C', efectos: [{ e: 'mirarMazo', n: 5, quien: 'yo', tomar: { clase: ['politico'] } }], requisito: { c: 'mazoPropioMin', n: 1 }, escena: 'Una urna transparente llena de cuestionarios doblados', icono: 'grafico' },
    { nombre: 'José Pablo Ferrándiz', persona: 'jose-pablo-ferrandiz', cargo: 'Director de opinión pública de Ipsos', escena: 'Un gráfico de tarta enorme dibujado en tiza en una pizarra', icono: 'grafico' }),
  ...PAR_ASESOR({ nombre: 'Antoni Gutiérrez-Rubí', persona: 'gutierrez-rubi', cargo: 'Consultor de comunicación política', rareza: 'I', efectos: [{ e: 'cambiarRival', elige: 'rival' }, E.robar(1)], requisito: { c: 'banquilloRivalMin', n: 1 }, escena: 'Una mesa de consultoría con notas adhesivas formando un mapa', icono: 'mapa' },
    { nombre: 'Verónica Fumanal', persona: 'veronica-fumanal', cargo: 'Consultora de comunicación política', escena: 'Una pizarra blanca llena de flechas y una taza de café humeante', icono: 'mapa' }),
  ent({ nombre: 'Luis Arroyo', persona: 'luis-arroyo', cargo: 'Consultor de comunicación política', clase: 'asesor', rareza: 'I', efectos: [E.temporal('bonoDano', 'yo', 'esteTurno', 20)], escena: 'Un guion de discurso con frases subrayadas en dorado', icono: 'pluma', arquetipos: ['aggro'] }),
  ent({ nombre: 'Pablo Simón', persona: 'pablo-simon', cargo: 'Politólogo', clase: 'asesor', rareza: 'C', efectos: [E.cura(40, 'tribunaPropia'), { e: 'quitarEstados', a: 'tribunaPropia' }], requisito: { c: 'tribunaPropiaDanada' }, escena: 'Un aula universitaria con una pizarra llena de diagramas electorales', icono: 'columna', arquetipos: ['tregua'] }),
  ent({ nombre: 'Lluís Orriols', persona: 'lluis-orriols', cargo: 'Politólogo', clase: 'asesor', rareza: 'C', efectos: [{ e: 'recuperar', filtro: { clase: ['politico'] }, n: 1, destino: 'mano' }], escena: 'Un archivo de datos con fichas perforadas y una lámpara de mesa', icono: 'carpeta' }),
  ent({ nombre: 'Jorge Galindo', persona: 'jorge-galindo', cargo: 'Analista de políticas públicas', clase: 'asesor', rareza: 'I', efectos: [{ e: 'mirarMazo', n: 4, quien: 'rival' }, { e: 'descartarMazo', n: 2, quien: 'rival' }], escena: 'Un embudo de datos vertiendo números sobre una hoja en blanco', icono: 'lupa', arquetipos: ['mill'], claves: ['sinFondos'] }),
  ent({ nombre: 'Kiko Llaneras', persona: 'kiko-llaneras', cargo: 'Periodista de datos', clase: 'asesor', rareza: 'C', efectos: [E.robar(2), E.si({ c: 'combo' }, [E.robar(1)])], escena: 'Una cuadrícula de puntos de colores formando un hemiciclo', icono: 'grafico', arquetipos: ['combo'], claves: ['combo'] }),
  ent({ nombre: 'Carmen Lumbierres', persona: 'carmen-lumbierres', cargo: 'Politóloga', clase: 'asesor', rareza: 'C', efectos: [E.voto('zona', 'elegirPropio'), E.robar(1)], escena: 'Un mapa de calor electoral sobre una mesa con lápices de colores', icono: 'mapa', arquetipos: ['ascenso'] }),
  ent({ nombre: 'Jaime Miquel', persona: 'jaime-miquel', cargo: 'Analista electoral', clase: 'asesor', rareza: 'I', efectos: [{ e: 'apoyoPorAmbar' }], escena: 'Un ábaco con cuentas de muchos colores distintos', icono: 'red', arquetipos: ['investidura'] }),
];

export const CARTAS_RECURSOS: Carta[] = [
  ent({ nombre: 'Votación de investidura', clase: 'recurso', rareza: 'R', unica: true, efectos: [{ e: 'investidura' }], requisito: { c: 'apoyosMin', n: 6, partidos: 4 }, escena: 'Un hemiciclo con todos los mandos de votación encendidos en verde', icono: 'hemiciclo', arquetipos: ['investidura'] }),
  ent({ nombre: 'Ronda de contactos', clase: 'recurso', rareza: 'I', efectos: [{ e: 'apoyoPorAmbar' }], requisito: { c: 'aliadosTipo', tipo: 'ambar', n: 1 }, escena: 'Una agenda abierta llena de citas tachadas y un teléfono fijo', icono: 'telefono', arquetipos: ['investidura'] }),
  ent({ nombre: 'Pacto de legislatura', clase: 'recurso', rareza: 'R', efectos: [E.apoyo(2), E.robar(1)], requisito: { c: 'coalicion', n: 2 }, escena: 'Dos manos firmando el mismo documento con plumas de distinto color', icono: 'pluma', arquetipos: ['investidura', 'coalicion'], claves: ['coalicion'] }),
  ent({ nombre: 'Decreto ley', clase: 'recurso', rareza: 'C', efectos: [E.robar(2)], requisito: { c: 'manoPropiaMax', n: 3 }, escena: 'Un sello oficial golpeando un documento sobre una mesa vacía', icono: 'ficha' }),
  ent({ nombre: 'Filtración a la prensa', clase: 'recurso', rareza: 'I', efectos: [{ e: 'verMano' }, E.bulo(10, 'tribunaRival')], escena: 'Un sobre marrón deslizándose bajo la puerta de una redacción', icono: 'sobre', arquetipos: ['control', 'bulo'] }),
  ent({ nombre: 'Bulo viral', clase: 'recurso', rareza: 'C', efectos: [E.bulo(20, 'elegirRival')], escena: 'Un móvil del que salen cientos de mensajes como un enjambre', icono: 'telefono', arquetipos: ['bulo'], claves: ['bulo'] }),
  ent({ nombre: 'Verificación de datos', clase: 'recurso', rareza: 'C', efectos: [{ e: 'quitarEstados', a: 'tribunaPropia' }, E.cura(10, 'tribunaPropia')], escena: 'Una lupa sobre un titular con una marca de verificación', icono: 'lupa', arquetipos: ['tregua'] }),
  ent({ nombre: 'Argumentario', clase: 'recurso', rareza: 'C', efectos: [E.temporal('bonoDano', 'yo', 'esteTurno', 10), E.si({ c: 'combo' }, [E.temporal('bonoDano', 'yo', 'esteTurno', 10)])], escena: 'Un folio con frases cortas en negrita grapado a una carpeta', icono: 'ficha', arquetipos: ['combo', 'aggro'], claves: ['combo'] }),
  ent({ nombre: 'Mitin en la plaza de toros', clase: 'recurso', rareza: 'I', efectos: [E.voto('zona', 'tribunaPropia')], requisito: { c: 'combo' }, escena: 'Una plaza de toros llena de banderas lisas bajo focos', icono: 'estadio', arquetipos: ['combo', 'ascenso'] }),
  ent({ nombre: 'Cuestión de confianza', clase: 'recurso', rareza: 'I', efectos: [E.si({ c: 'voyPerdiendo' }, [E.cura('todo', 'tribunaPropia')], [E.cura(30, 'tribunaPropia')])], requisito: { c: 'tribunaPropiaDanada' }, escena: 'Una balanza con un único papel en uno de los platos', icono: 'balanza', arquetipos: ['tregua'], claves: ['remontada'] }),
  ent({ nombre: 'Sondeo a pie de urna', clase: 'recurso', rareza: 'C', efectos: [{ e: 'mirarMazo', n: 3, quien: 'rival' }, { e: 'descartarMazo', n: 1, quien: 'rival' }], escena: 'Una encuestadora con una carpeta a la salida de un colegio electoral', icono: 'ficha', arquetipos: ['mill'], claves: ['sinFondos'] }),
  ent({ nombre: 'Presupuestos Generales', clase: 'recurso', rareza: 'R', efectos: [E.cura(20, 'todosPropios')], escena: 'Un tomo enorme encuadernado sobre una carretilla', icono: 'libro', arquetipos: ['tregua'] }),
  ent({ nombre: 'Caravana electoral', clase: 'recurso', rareza: 'C', efectos: [{ e: 'cambiarPropio' }, E.robar(1)], requisito: { c: 'banquilloPropioMin', n: 1 }, escena: 'Un autobús de campaña pintado de blanco en una carretera secundaria', icono: 'coche' }),
  ent({ nombre: 'Anuncio electoral', clase: 'recurso', rareza: 'C', efectos: [E.robar(1), E.si({ c: 'climaMin', n: 4 }, [E.robar(1)])], escena: 'Una cámara de rodaje frente a un decorado de salón familiar', icono: 'camara' }),
  ent({ nombre: 'Cordón sanitario', clase: 'recurso', rareza: 'I', efectos: [E.temporal('reducir', 'tribunaPropia', 'turnoRival', 30)], escena: 'Una cinta de balizamiento rodeando un atril', icono: 'escudo', arquetipos: ['tregua'] }),
  ent({ nombre: 'Bloqueo institucional', clase: 'recurso', rareza: 'R', efectos: [E.estado('bloqueado', 'tribunaRival')], requisito: { c: 'combo' }, escena: 'Un candado gigante en la puerta de un parlamento', icono: 'candado', arquetipos: ['control', 'combo'], claves: ['combo'] }),
  ent({ nombre: 'Prórroga presupuestaria', clase: 'recurso', rareza: 'C', efectos: [E.temporal('reducir', 'tribunaPropia', 'turnoRival', 20)], escena: 'Un calendario con la hoja del año pasado grapada encima', icono: 'reloj', arquetipos: ['tregua', 'mill'] }),
  ent({ nombre: 'Cocina electoral', clase: 'recurso', rareza: 'I', efectos: [{ e: 'mirarMazo', n: 5, quien: 'yo', tomar: {} }], requisito: { c: 'mazoPropioMin', n: 1 }, escena: 'Una olla humeante con números flotando en el vapor', icono: 'taza' }),
  ent({ nombre: 'Debate a cuatro', clase: 'recurso', rareza: 'R', efectos: [E.dano(20, 'tribunaPropia'), E.dano(30, 'tribunaRival'), E.clima(-1, 1)], escena: 'Cuatro atriles en semicírculo bajo focos cruzados', icono: 'atril', arquetipos: ['crispacion'], claves: ['clima'] }),
  ent({ nombre: 'Geometría variable', clase: 'recurso', rareza: 'I', efectos: [E.robar(3)], requisito: { c: 'granCoalicion' }, escena: 'Un compás dibujando figuras imposibles sobre un mapa del hemiciclo', icono: 'red', arquetipos: ['granCoalicion', 'coalicion'], claves: ['coalicion'] }),
  ent({ nombre: 'Recurso de amparo', clase: 'recurso', rareza: 'C', efectos: [{ e: 'recuperar', filtro: { clase: ['politico'] }, n: 1, destino: 'mano' }], escena: 'Un expediente judicial con un sello de «admitido»', icono: 'balanza' }),
  ent({ nombre: 'Disolución de las Cortes', clase: 'recurso', rareza: 'R', unica: true, efectos: [{ e: 'barajarManoRobar', quien: 'ambos', n: 5 }], escena: 'Un boletín oficial recién impreso volando sobre un hemiciclo vacío', icono: 'periodico' }),
  ent({ nombre: 'Auditoría del Tribunal de Cuentas', clase: 'recurso', rareza: 'I', efectos: [{ e: 'descartarMazo', n: 3, quien: 'rival' }], escena: 'Una montaña de facturas atadas con cinta roja', icono: 'carpeta', arquetipos: ['mill'], claves: ['sinFondos'] }),
  ent({ nombre: 'Multa de la Junta Electoral', clase: 'recurso', rareza: 'C', efectos: [{ e: 'descartarMazo', n: 2, quien: 'rival' }, E.si({ c: 'mazoRivalMax', n: 5 }, [E.bulo(20, 'tribunaRival')])], escena: 'Un sobre oficial con un sello de multa y una papeleta dentro', icono: 'sobre', arquetipos: ['mill'], claves: ['sinFondos'] }),
];

export const CARTAS_HERRAMIENTAS: Carta[] = [
  ent({ nombre: 'Teleprompter', clase: 'herramienta', rareza: 'I', pasivas: [{ p: 'dano', n: 20, ambito: 'este' }], filtroHerramienta: { fase: ['fase2'] }, escena: 'Un cristal inclinado con texto brillante delante de un atril', icono: 'atril', arquetipos: ['ascenso'] }),
  ent({ nombre: 'Americana de campaña', clase: 'herramienta', rareza: 'C', pasivas: [{ p: 'aguante', n: 20, ambito: 'este' }], escena: 'Una chaqueta colgada de una silla con una acreditación en el bolsillo', icono: 'corbata' }),
  ent({ nombre: 'Pinganillo', clase: 'herramienta', rareza: 'I', pasivas: [{ p: 'costeIncoloro', n: 1, ambito: 'este' }], escena: 'Un auricular diminuto con un cable en espiral', icono: 'auricular' }),
  ent({ nombre: 'Zapatillas de mitin', clase: 'herramienta', rareza: 'C', pasivas: [{ p: 'relevo', n: -2, ambito: 'este' }], escena: 'Unas zapatillas gastadas junto a la escalera de un escenario', icono: 'bici' }),
  ent({ nombre: 'Auriculares de cabina', clase: 'herramienta', rareza: 'C', pasivas: [{ p: 'inmuneEstados', ambito: 'este' }], escena: 'Unos auriculares de traducción simultánea sobre un escaño', icono: 'auricular' }),
  ent({ nombre: 'Gafas de leer letra pequeña', clase: 'herramienta', rareza: 'C', pasivas: [{ p: 'dano', n: 30, ambito: 'este', contra: { cl: true } }], escena: 'Unas gafas sobre un contrato con letra diminuta', icono: 'gafas' }),
  ent({ nombre: 'Cartera ministerial', clase: 'herramienta', rareza: 'R', pasivas: [{ p: 'aguante', n: 30, ambito: 'este' }, { p: 'dano', n: 10, ambito: 'este' }], filtroHerramienta: { cl: false }, escena: 'Una cartera de cuero con las iniciales borradas sobre una mesa de consejo', icono: 'maletin' }),
  ent({ nombre: 'Paraguas', clase: 'herramienta', rareza: 'C', pasivas: [{ p: 'defensa', n: 20, ambito: 'este', cond: { c: 'climaMax', n: 2 } }], escena: 'Un paraguas abierto bajo una tormenta de papeles', icono: 'lluvia', arquetipos: ['crispacion'] }),
];

export const CARTAS_ESCENARIOS: Carta[] = [
  ent({ nombre: 'Senado', clase: 'escenario', rareza: 'I', pasivas: [{ p: 'defensa', n: 10, ambito: 'todos', filtro: { fase: ['fase1', 'fase2'] } }], escena: 'Un salón de plenos con tapices y una vidriera de colores', icono: 'columna', arquetipos: ['ascenso'] }),
  ent({ nombre: 'La Moncloa', clase: 'escenario', rareza: 'R', pasivas: [{ p: 'aguante', n: 20, ambito: 'todos', filtro: { cl: true } }], escena: 'Un palacio de ladrillo entre pinos con la luz de un despacho encendida', icono: 'edificio' }),
  ent({ nombre: 'Ferraz', clase: 'escenario', rareza: 'I', pasivas: [{ p: 'dano', n: 10, ambito: 'todos', filtro: { tipo: ['rojo'] } }], escena: 'Una fachada de oficinas en una calle madrileña con un balcón iluminado de rojo', icono: 'edificio', arquetipos: ['equipo'] }),
  ent({ nombre: 'Génova', clase: 'escenario', rareza: 'I', pasivas: [{ p: 'dano', n: 10, ambito: 'todos', filtro: { tipo: ['azul'] } }], escena: 'Una fachada de oficinas en una calle madrileña con un balcón iluminado de azul', icono: 'edificio', arquetipos: ['equipo'] }),
  ent({ nombre: 'Palacio de Vistalegre', clase: 'escenario', rareza: 'I', pasivas: [{ p: 'dano', n: 10, ambito: 'todos', filtro: { tipo: ['magenta', 'verde', 'morado'] } }], escena: 'Un pabellón redondo lleno de gradas y focos apuntando al centro', icono: 'estadio', arquetipos: ['equipo'] }),
  ent({ nombre: 'Waterloo', clase: 'escenario', rareza: 'R', pasivas: [{ p: 'aguante', n: 20, ambito: 'todos', filtro: { tipo: ['ambar'] } }], escena: 'Una calle residencial belga con casas de ladrillo bajo la llovizna', icono: 'casa', arquetipos: ['investidura'] }),
  ent({ nombre: 'Puerta del Sol', clase: 'escenario', rareza: 'C', pasivas: [{ p: 'dano', n: 10, ambito: 'todos', filtro: { fase: ['basico'] } }], escena: 'Una plaza abarrotada bajo un gran reloj al anochecer', icono: 'reloj', arquetipos: ['aggro'] }),
  ent({ nombre: 'Plató de Al Rojo Vivo', clase: 'escenario', rareza: 'R', inicioTurno: [{ e: 'audiencia', n: 1, quien: 'yo' }], escena: 'Un plató con pantallas rojas y sillas de tertulia vacías esperando el directo', icono: 'plato', arquetipos: ['plato'] }),
  // noticias neutrales: escenarios que duran unos turnos
  ent({ nombre: 'La DANA', clase: 'escenario', noticia: true, duracion: 4, rareza: 'I', inicioTurno: [E.bulo(10, 'tribunaPropia')], escena: 'Una calle inundada con coches apilados y un cielo que se abre', icono: 'lluvia', arquetipos: ['crispacion'] }),
  ent({ nombre: 'El apagón', clase: 'escenario', noticia: true, duracion: 4, rareza: 'I', pasivas: [{ p: 'costeIncoloro', n: -1, ambito: 'todos' }], escena: 'Una ciudad completamente a oscuras con una sola vela en una ventana', icono: 'rayo', arquetipos: ['control'] }),
  ent({ nombre: 'La Vuelta, sin podio', clase: 'escenario', noticia: true, duracion: 4, rareza: 'C', pasivas: [{ p: 'relevo', n: -1, ambito: 'todos' }], escena: 'Una bicicleta apoyada en una valla con la meta desierta al fondo', icono: 'bici' }),
  ent({ nombre: 'La flotilla a Gaza', clase: 'escenario', noticia: true, duracion: 4, rareza: 'C', pasivas: [{ p: 'aguante', n: 10, ambito: 'todos', filtro: { tipo: ['magenta', 'morado'] } }], escena: 'Varios barcos pequeños navegando de noche en fila por un mar en calma', icono: 'barco' }),
  ent({ nombre: 'Los aranceles de Trump', clase: 'escenario', noticia: true, duracion: 4, rareza: 'I', inicioTurno: [{ e: 'descartarMazo', n: 1, quien: 'yo' }], escena: 'Contenedores de mercancías apilados en un puerto con una barrera bajada', icono: 'ancla', arquetipos: ['mill'] }),
  ent({ nombre: 'España se baja de Eurovisión', clase: 'escenario', noticia: true, duracion: 3, rareza: 'C', efectos: [E.robar(1, 'ambos')], escena: 'Un escenario de festival con los focos apagados y una silla vacía', icono: 'estrella' }),
  ent({ nombre: 'Huelga de médicos', clase: 'escenario', noticia: true, duracion: 4, rareza: 'C', pasivas: [{ p: 'curacion', n: -10, ambito: 'todos' }], escena: 'Un pasillo de hospital con batas blancas colgadas y una pancarta lisa', icono: 'hospital', arquetipos: ['control'] }),
  ent({ nombre: 'Incendios del verano', clase: 'escenario', noticia: true, duracion: 3, rareza: 'I', inicioTurno: [E.bulo(10, 'banquilloPropio')], escena: 'Un monte en llamas al atardecer con una avioneta soltando agua', icono: 'fuego', arquetipos: ['crispacion'] }),
];

/** Noticias de escándalo en parejas espejo: cada una golpea a los políticos del bloque señalado, los tenga quien los tenga. */
function parNoticia(d: Omit<DefEntrenador, 'num' | 'clase' | 'noticia'>, otro: Pick<DefEntrenador, 'nombre' | 'frase' | 'escena' | 'icono'>): Carta[] {
  const a = ent({ ...d, clase: 'recurso', noticia: true, arquetipos: ['bulo', ...(d.arquetipos ?? [])] });
  const b = ent({ ...reflejar(d), ...otro, clase: 'recurso', noticia: true, arquetipos: ['bulo', ...(d.arquetipos ?? [])] });
  a.pareja = b.id;
  b.pareja = a.id;
  return [a, b];
}

export const CARTAS_NOTICIAS: Carta[] = [
  ...parNoticia({ nombre: 'Caso Koldo', rareza: 'R', efectos: [E.bulo(20, 'todos')].map((x) => ({ ...x, filtro: { tipo: ['rojo'] } }) as Efecto), frase: 'Hecho judicial: la investigación llegó al Tribunal Supremo. Rige la presunción de inocencia donde no hay sentencia firme.', escena: 'Un maletín cerrado sobre una mesa de interrogatorio con una lámpara colgante', icono: 'maletin' },
    { nombre: 'Caso Kitchen', frase: 'Hecho judicial: la antigua cúpula de Interior, juzgada en 2026. Rige la presunción de inocencia donde no hay sentencia firme.', escena: 'Una cocina industrial con cajones de archivo en lugar de cacerolas', icono: 'carpeta' }),
  ...parNoticia({ nombre: 'La «fontanera» de Ferraz', rareza: 'I', efectos: [{ e: 'estado', estado: 'sospecha', a: 'tribunaRival', filtro: { tipo: ['rojo'] } }, { e: 'descartarVoto', n: 1, a: 'tribunaRival', filtro: { tipo: ['rojo'] } }], frase: 'Titular de 2025 sobre una militante socialista y unas grabaciones. Rige la presunción de inocencia.', escena: 'Una llave inglesa sobre unos planos de tuberías con anotaciones tachadas', icono: 'llave' },
    { nombre: 'Caso Montoro', frase: 'Hecho judicial: el exministro, investigado desde 2025. Rige la presunción de inocencia.', escena: 'Una calculadora sobre un expediente de Hacienda con un clip dorado', icono: 'grafico' }),
  ...parNoticia({ nombre: 'El fiscal general, condenado', rareza: 'I', efectos: [{ e: 'bulo', n: 10, a: 'todos', filtro: { tipo: ['rojo', 'magenta'] } }, E.clima(-1)], frase: 'Hecho judicial: el Supremo condenó en noviembre de 2025 al fiscal general del Estado por revelación de secretos.', escena: 'Una toga colgada en una percha vacía de un despacho judicial', icono: 'balanza', arquetipos: ['crispacion'] },
    { nombre: 'La hemeroteca de la Gürtel', frase: 'Hecho judicial: la sentencia de 2018 consideró al PP partícipe a título lucrativo.', escena: 'Un archivo de periódicos antiguos con un sobre de cuero asomando', icono: 'periodico' }),
  ...parNoticia({ nombre: 'Caso Begoña Gómez', rareza: 'C', efectos: [E.si({ c: 'defensorTipo', tipo: ['rojo'] }, [{ e: 'barajarManoRobar', quien: 'rival', n: 3 }], [E.robar(1)])], frase: 'Hecho judicial en curso sobre la esposa del presidente del Gobierno. Rige la presunción de inocencia.', escena: 'Un juzgado con una puerta entreabierta y un pasillo lleno de cámaras', icono: 'camara' },
    { nombre: 'Caso del novio de Ayuso', frase: 'Hecho judicial en curso sobre la pareja de la presidenta madrileña. Rige la presunción de inocencia.', escena: 'Un ático con terraza y un expediente de Hacienda sobre la mesa', icono: 'casa' }),
  ...parNoticia({ nombre: 'El Delcygate', rareza: 'C', efectos: [E.si({ c: 'defensorTipo', tipo: ['rojo'] }, [E.bulo(30, 'tribunaRival')], [E.robar(1)])], frase: 'Hecho de 2020: la escala en Barajas de la vicepresidenta venezolana, Delcy Rodríguez.', escena: 'Una maleta sola en la pista de un aeropuerto de madrugada', icono: 'avion' },
    { nombre: 'Las fotos del yate', frase: 'Hecho publicado en 2013: fotografías de 1995 en una embarcación privada.', escena: 'Un velero en una ría gallega con unas fotos antiguas sobre la cubierta', icono: 'barco' }),
];

export const CARTAS_MANIOBRAS: Carta[] = [
  ent({ nombre: 'Recurso al Constitucional', clase: 'maniobra', disparo: 'alJugarRecurso', rareza: 'R', efectos: [{ e: 'anular' }], escena: 'Un edificio de piedra con columnas y una puerta pesada cerrándose', icono: 'columna', arquetipos: ['maniobras', 'control'] }),
  ent({ nombre: 'Veto en la Mesa', clase: 'maniobra', disparo: 'alJugarAsesor', rareza: 'R', efectos: [{ e: 'anular' }], escena: 'Una mesa presidencial con una mano levantada y un papel rechazado', icono: 'mano', arquetipos: ['maniobras', 'control'] }),
  ent({ nombre: 'Pregunta trampa', clase: 'maniobra', disparo: 'alAtacar', rareza: 'I', efectos: [E.estado('desnortado', 'defensor')], escena: 'Un micrófono con un anzuelo colgando del cable', icono: 'microfono', arquetipos: ['maniobras'] }),
  ent({ nombre: 'Filtración preparada', clase: 'maniobra', disparo: 'alAtacar', rareza: 'I', efectos: [E.bulo(30, 'defensor')], escena: 'Un sobre con un temporizador pegado bajo una mesa', icono: 'sobre', arquetipos: ['maniobras', 'bulo'] }),
  ent({ nombre: 'Fe de erratas', clase: 'maniobra', disparo: 'alAtacar', rareza: 'C', efectos: [E.temporal('reducir', 'tribunaPropia', 'esteTurno', 30)], escena: 'Una esquina de periódico con una nota pequeñísima de corrección', icono: 'periodico', arquetipos: ['maniobras', 'tregua'] }),
  ent({ nombre: 'Marcaje al recién llegado', clase: 'maniobra', disparo: 'alBajarPolitico', rareza: 'C', efectos: [E.bulo(20, 'defensor')], escena: 'Una puerta de despacho con un foco apuntándola desde el pasillo', icono: 'ojo', arquetipos: ['maniobras', 'bulo'] }),
  ent({ nombre: 'Comparecencia urgente', clase: 'maniobra', disparo: 'alAscender', rareza: 'I', efectos: [E.bulo(30, 'defensor')], escena: 'Una sala de prensa improvisada con un único foco y una silla', icono: 'atril', arquetipos: ['maniobras'] }),
  ent({ nombre: 'Sondeo propio', clase: 'maniobra', disparo: 'alDerribo', rareza: 'C', efectos: [E.robar(2)], escena: 'Una encuesta doblada dentro de un bolsillo interior', icono: 'ficha', arquetipos: ['maniobras'] }),
  ent({ nombre: 'Golpe de efecto', clase: 'maniobra', disparo: 'alDerribo', rareza: 'I', efectos: [E.cura(30, 'todosPropios')], escena: 'Un telón cayendo de golpe en mitad de una función', icono: 'teatro', arquetipos: ['maniobras', 'tregua'] }),
  ent({ nombre: 'Contraprogramación', clase: 'maniobra', disparo: 'alJugarAsesor', rareza: 'C', efectos: [E.robar(2)], escena: 'Dos televisores encendidos a la vez con distintos programas', icono: 'camara', arquetipos: ['maniobras'] }),
];

/** Altas posteriores: van al final con el siguiente número libre, para no renumerar ninguna carta. */
export const CARTAS_ALTAS: Carta[] = [
  ind({ nombre: 'Fernando Savater', persona: 'fernando-savater', cargo: 'Filósofo y columnista de The Objective', audiencia: 2, rareza: 'I', mitin: [{ e: 'mirarMazo', n: 3, quien: 'yo', tomar: {} }], arquetipos: ['control'], escena: 'Un escritorio lleno de libros de filosofía con unos prismáticos de hipódromo encima', icono: 'libro' }),
];

export const CARTAS_PLATO_Y_ENTRENADORES: Carta[] = [
  ...CARTAS_TERTULIANOS, ...CARTAS_ASESORES, ...CARTAS_RECURSOS, ...CARTAS_HERRAMIENTAS, ...CARTAS_ESCENARIOS, ...CARTAS_NOTICIAS, ...CARTAS_MANIOBRAS, ...CARTAS_ALTAS,
];
