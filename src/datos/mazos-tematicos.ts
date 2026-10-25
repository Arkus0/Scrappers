// Mazos temáticos: uno por arquetipo (y las Leyendas en espejo). La IA los juega en la campaña y se pueden conseguir.
import type { DefMazo } from '../motor/mazo';
import type { Tipo } from '../motor/tipos';
import { LISTA_CARTAS } from './catalogo';

export interface MazoTematico extends DefMazo {
  id: string;
  arquetipo: string;
  descripcion: string;
  /** coste en fondos de campaña en la tienda */
  precio: number;
}

/** Id de una carta por su nombre (la de la colección normal, no el arte alternativo). */
function id(nombre: string): string {
  const c = LISTA_CARTAS.find((x) => x.nombre === nombre && x.coleccion !== 'secreta') ?? LISTA_CARTAS.find((x) => x.nombre === nombre);
  if (!c) throw new Error(`Mazo temático: no existe la carta «${nombre}»`);
  return c.id;
}

function mazo(idm: string, nombre: string, arquetipo: string, descripcion: string, tipos: Tipo[], lista: [string, number][], precio = 600): MazoTematico {
  const cartas = lista.flatMap(([n, k]) => Array<string>(k).fill(id(n)));
  return { id: idm, nombre, arquetipo, descripcion, tipos, cartas, precio };
}

const BASE: [string, number][] = [['Ficha de afiliación', 2], ['José Félix Tezanos', 2]];

export const MAZOS_TEMATICOS: MazoTematico[] = [
  mazo('aggro', 'Ofensiva de Ferraz', 'Aggro monopartido', 'Básicos baratos que pegan desde el primer turno y rematan con Combo.', ['rojo'], [
    ['Pedro Sánchez · Concejal', 2], ['María Jesús Montero', 2], ['Jaume Collboni', 2], ['Óscar Puente', 2], ['Patxi López', 1], ['Elma Saiz', 1],
    ['Megáfono', 2], ['Argumentario', 2], ['Luis Arroyo', 1], ['Puerta del Sol', 1], ...BASE,
  ]),
  mazo('ascenso', 'Carrera política', 'Rampa de ascensos', 'Concejal, presidente, candidato: El dedazo acelera las Fases 2.', ['azul'], [
    ['Feijóo · Conselleiro', 2], ['Feijóo · Presidente de la Xunta', 1], ['Feijóo · Presidente del PP', 1], ['Isabel Díaz Ayuso', 2], ['Isabel Díaz Ayuso · Presidenta', 1],
    ['Alfonso Rueda', 1], ['Alfonso Rueda · Mayoría absoluta', 1], ['Ester Muñoz', 1], ['Ester Muñoz · Portavoz', 1], ['Juan Bravo', 1],
    ['El dedazo', 1], ['Teleprompter', 1], ['Senado', 1], ['Ficha de afiliación', 2], ['Narciso Michavila', 1], ['Carmen Lumbierres', 1], ['Encuesta interna', 1],
  ]),
  mazo('coalicionP', 'Coalición de progreso', 'Coalición progresista', 'Rojos y magentas que se refuerzan cuando gobiernan juntos.', ['rojo', 'magenta'], [
    ['Adrián Barbón', 2], ['Rosa Díez', 1], ['Ramón Tamames', 1], ['Ada Colau · Activista', 2], ['Ada Colau · Alcaldesa', 1], ['Yolanda Díaz', 1], ['Yolanda Díaz · Sumar', 1],
    ['Ada Colau CL', 1], ['Pedro Sánchez · Concejal', 2], ['Pacto de legislatura', 1], ['Antoni Gutiérrez-Rubí', 1], ['Ferraz', 1], ['Palacio de Vistalegre', 1], ...BASE,
  ]),
  mazo('coalicionC', 'Coalición del cambio', 'Coalición conservadora', 'Azules y verdes que se refuerzan cuando gobiernan juntos.', ['azul', 'verde'], [
    ['Alfonso Fernández Mañueco', 2], ['Toni Cantó', 1], ['Juan Carlos Girauta', 1], ['Santiago Abascal · Concejal', 2], ['Santiago Abascal · Presidente', 1], ['Ignacio Garriga', 1], ['Ignacio Garriga · Candidato', 1],
    ['Santiago Abascal CL', 1], ['Feijóo · Conselleiro', 2], ['Pacto de legislatura', 1], ['Verónica Fumanal', 1], ['Génova', 1], ['Palacio de Vistalegre', 1], ...BASE,
  ]),
  mazo('granCoalicion', 'Gran coalición', 'Gran coalición', 'Mezcla los dos bloques: el centro cobra sentido.', ['rojo', 'azul'], [
    ['García-Page CL', 1], ['Juanma Moreno CL', 1], ['Albert Rivera', 1], ['Inés Arrimadas', 2], ['Rosa Díez', 1], ['Toni Cantó', 1], ['Adrián Barbón', 1], ['Alfonso Fernández Mañueco', 1],
    ['Salvador Illa', 1], ['Alfonso Rueda', 1], ['Geometría variable', 2], ['Pacto de legislatura', 1], ['Coche oficial', 1], ['La Moncloa', 1], ...BASE,
  ]),
  mazo('caos', 'Asalto a los cielos', 'Caos morado', 'Monedas, crispación y efectos que golpean a todos.', ['morado'], [
    ['Irene Montero', 2], ['Irene Montero · Exministra', 2], ['Irene Montero CL', 1], ['Martina Velarde', 2], ['Ione Belarra', 2], ['Rafael Mayoral', 1], ['Pablo Iglesias', 1],
    ['Bulo viral', 2], ['Palacio de Vistalegre', 1], ['Argumentario', 2], ...BASE,
  ]),
  mazo('investidura', 'La llave de la investidura', 'Investidura (combo Ámbar)', 'Suma Apoyos de cuatro partidos y gana con la Votación de investidura.', ['ambar'], [
    ['Gabriel Rufián', 2], ['Aitor Esteban', 1], ['Maribel Vaquero', 2], ['Marta Rovira', 1], ['Carles Puigdemont', 1], ['Fernando Clavijo', 1], ['Tomás Guitarte', 1], ['Cristina Valido', 1], ['Míriam Nogueras', 1],
    ['Votación de investidura', 1], ['Ronda de contactos', 2], ['Jaime Miquel', 1], ['Waterloo', 1], ...BASE,
  ], 800),
  mazo('plato', 'Parrilla de tertulia', 'Plató / medios', 'Los tertulianos hacen el trabajo desde el plató.', ['morado'], [
    ['Pablo Iglesias', 2], ['Pablo Iglesias · Canal Red', 2], ['Ione Belarra', 1], ['Isa Serra', 1], ['Pablo Fernández', 1],
    ['Antonio García Ferreras', 1], ['Javier Ruiz', 1], ['Jesús Cintora', 1], ['Jordi Évole', 1], ['Susanna Griso', 1], ['Sarah Santaolalla', 1], ['Antonio Maestre', 1], ['Ignacio Escolar', 1],
    ['Plató de Al Rojo Vivo', 1], ['Ficha de afiliación', 2], ['José Félix Tezanos', 2],
  ], 800),
  mazo('bulo', 'Máquina del fango', 'Bulo / desgaste', 'Desgaste directo al banquillo: nadie está a salvo.', ['rojo', 'ambar'], [
    ['Óscar Puente', 2], ['Óscar Puente · Tuitero', 2], ['Gabriel Rufián', 2], ['Gabriel Rufián · Réplica viral', 1], ['Ximo Puig', 1], ['Alvise Pérez', 1],
    ['Bulo viral', 2], ['Filtración a la prensa', 1], ['Filtración preparada', 1], ['Marcaje al recién llegado', 1], ['Sarah Santaolalla', 1], ['Ana Pardo de Vera', 1], ...BASE,
  ]),
  mazo('control', 'Bloqueo institucional', 'Control y bloqueo', 'Quita votos, bloquea y anula las jugadas del rival.', ['verde'], [
    ['Santiago Abascal · Concejal', 2], ['Santiago Abascal · Presidente', 1], ['Santiago Abascal · Candidato', 1], ['Jorge Buxadé', 2], ['Jorge Buxadé · Eurodiputado', 1], ['Pepa Millán', 1], ['Pepa Millán · Portavoz', 1],
    ['Bloqueo institucional', 1], ['Moción de censura', 1], ['Comisión de investigación', 2], ['Veto en la Mesa', 1], ['Recurso al Constitucional', 1], ['Antoni Gutiérrez-Rubí', 1],
    ['Ficha de afiliación', 2], ['José Félix Tezanos', 2],
  ]),
  mazo('mill', 'Campaña sin fondos', 'Mill «sin fondos»', 'Vacía el mazo del rival: sin fondos, su tribuna se desangra.', ['azul'], [
    ['Fernando López Miras', 2], ['Juan Bravo', 2], ['José Luis Martínez-Almeida', 2], ['Ana Pastor', 1], ['Xavier García Albiol', 1], ['José Antonio Monago', 1],
    ['Auditoría del Tribunal de Cuentas', 2], ['Multa de la Junta Electoral', 2], ['Sondeo a pie de urna', 2], ['Jorge Galindo', 1], ['Los aranceles de Trump', 1], ['Prórroga presupuestaria', 1], ['Ficha de afiliación', 2],
  ]),
  mazo('crispacion', 'Guerra sucia', 'Crispación', 'Baja el Clima a propósito: con Guerra sucia todo pega más.', ['verde', 'morado'], [
    ['Santiago Abascal · Concejal', 2], ['Santiago Abascal · Presidente', 1], ['Santiago Abascal CL', 1], ['Ione Belarra', 2], ['Ione Belarra · Exministra', 1], ['Rafael Mayoral', 1], ['Rocío de Meer', 2],
    ['Debate a cuatro', 2], ['Paraguas', 1], ['Federico Jiménez Losantos', 1], ['Francisco Marhuenda', 1], ['La DANA', 1], ['Ficha de afiliación', 2], ['José Félix Tezanos', 2],
  ]),
  mazo('tregua', 'Tregua sanitaria', 'Tregua y curación', 'Aguanta, cura y gana por desgaste ajeno.', ['magenta'], [
    ['Mónica García', 2], ['Mónica García · Médica y madre', 2], ['Manuela Carmena', 2], ['Sira Rego', 1], ['Pablo Bustinduy', 1], ['Jéssica Albiach', 1],
    ['Tila', 2], ['Presupuestos Generales', 1], ['Pablo Simón', 1], ['Iñaki Gabilondo', 1], ['Verificación de datos', 1], ['Cordón sanitario', 1], ['Golpe de efecto', 1], ['Fe de erratas', 1], ['Ficha de afiliación', 2],
  ]),
  mazo('maniobras', 'Sala de máquinas', 'Maniobras', 'Trampas boca abajo: el rival nunca sabe qué le espera.', ['rojo'], [
    ['Pedro Sánchez · Concejal', 2], ['Pedro Sánchez · Secretario general', 2], ['Pedro Sánchez · Presidente', 1], ['Félix Bolaños', 2], ['José Manuel Albares', 1], ['Margarita Robles', 1],
    ['Recurso al Constitucional', 1], ['Veto en la Mesa', 1], ['Pregunta trampa', 2], ['Filtración preparada', 1], ['Sondeo propio', 1], ['Lucía Méndez', 1],
    ['Ficha de afiliación', 2], ['José Félix Tezanos', 2],
  ]),
  mazo('leyendasP', 'Leyendas del progreso', 'Leyendas highlander', 'Sin una sola carta repetida: así despiertan González, Zapatero y Anguita.', ['rojo', 'magenta'], [
    ['Felipe González', 1], ['José Luis Rodríguez Zapatero', 1], ['Julio Anguita', 1], ['Adolfo Suárez', 1], ['Pedro Sánchez · Concejal', 1], ['María Jesús Montero', 1], ['Jaume Collboni', 1],
    ['Adrián Barbón', 1], ['Ada Colau · Activista', 1], ['Antonio Maíllo', 1], ['Pablo Bustinduy', 1], ['Rosa Díez', 1], ['Inés Arrimadas', 1], ['José Félix Tezanos', 1], ['Ficha de afiliación', 1],
    ['Tila', 1], ['El dedazo', 1], ['Coche oficial', 1], ['Encuesta interna', 1], ['La Moncloa', 1],
  ], 1500),
  mazo('leyendasC', 'Leyendas del cambio', 'Leyendas highlander', 'Sin una sola carta repetida: así despiertan Aznar, Rajoy y Aguirre.', ['azul', 'verde'], [
    ['José María Aznar', 1], ['Mariano Rajoy', 1], ['Esperanza Aguirre', 1], ['Adolfo Suárez', 1], ['Feijóo · Conselleiro', 1], ['Isabel Díaz Ayuso', 1], ['Xavier García Albiol', 1],
    ['Alfonso Fernández Mañueco', 1], ['Santiago Abascal · Concejal', 1], ['Rocío de Meer', 1], ['Carlos Hernández Quero', 1], ['Toni Cantó', 1], ['Inés Arrimadas', 1], ['José Félix Tezanos', 1], ['Ficha de afiliación', 1],
    ['Tila', 1], ['El dedazo', 1], ['Coche oficial', 1], ['Encuesta interna', 1], ['La Moncloa', 1],
  ], 1500),
];

export const ARQUETIPOS = [...new Set(MAZOS_TEMATICOS.map((m) => m.arquetipo))];
