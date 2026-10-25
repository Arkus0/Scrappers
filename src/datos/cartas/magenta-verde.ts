// Expansión 29N · Magenta (Frente Amplio) ↔ Verde (Vox): 16 parejas espejo (N-053 …).
import { E, espejo, type Comun, type Lado } from '../constructores';
import type { Carta } from '../../motor/tipos';

const N = '29n' as const;
let n = 52;
const par = (c: Omit<Comun, 'eje'>, p: Omit<Lado, 'num'>, q: Omit<Lado, 'num'>) => {
  n += 2;
  return espejo(N, { eje: 'MV', ...c }, { ...p, num: n - 1 }, { ...q, num: n });
};

export const CARTAS_MAGENTA_VERDE: Carta[] = [
  ...par({
    rareza: 'CL', cl: true, aguante: 140, relevo: 2, claves: ['disciplina'], arquetipos: ['equipo'],
    acciones: [{ coste: 'XI', dano: 50 }, { coste: 'XXII', dano: 80, efectos: [E.masPor(20, 'aliadosPartido', 3)] }],
    carisma: { disparo: 'pasiva', pasivas: [{ p: 'dano', n: 10, ambito: 'aliados', filtro: { tipo: ['magenta'] } }] },
  },
    { nombre: 'Ada Colau CL', persona: 'colau', cargo: 'Candidata del Frente Amplio', frase: 'Sí se puede.', escena: 'Una gran pancarta lisa magenta sostenida por cientos de manos en una avenida', icono: 'mano', acciones: ['Primero las personas', 'Frente Amplio'], carisma: 'Confluencia' },
    { nombre: 'Santiago Abascal CL', persona: 'abascal', cargo: 'Candidato de Vox', escena: 'Un caballo blanco al galope por una ladera con nubes de tormenta detrás', icono: 'caballo', acciones: ['Llamada a filas', 'Todos a una'], carisma: 'Disciplina' }),
  ...par({
    fase: 'fase1', rareza: 'R', aguante: 100, relevo: 1, arquetipos: ['combo', 'ascenso'],
    acciones: [{ coste: 'XI', dano: 40, efectos: [E.robar(1)] }, { coste: 'XXI', dano: 60 }],
  },
    { nombre: 'Yolanda Díaz · Sumar', persona: 'yolanda-diaz', cargo: 'Fundadora de Sumar', de: 'Yolanda Díaz', escena: 'Un auditorio lleno de sillas de colores que forman un gran mosaico', icono: 'estadio', acciones: ['Escuchar', 'Reforma laboral'] },
    { nombre: 'Ignacio Garriga · Candidato', persona: 'ignacio-garriga', cargo: 'Candidato de Vox en Cataluña (2021 y 2024)', de: 'Ignacio Garriga', escena: 'Un parlamento autonómico de techos altos con un escaño verde iluminado', icono: 'hemiciclo', acciones: ['Parlament', 'Estructura'] }),
  ...par({
    fase: 'fase1', rareza: 'R', aguante: 100, relevo: 1, arquetipos: ['tregua'],
    acciones: [{ coste: 'XI', dano: 30, efectos: [E.cura(30, 'elegirDanadoPropio')] }, { coste: 'XXI', dano: 60 }],
  },
    { nombre: 'Mónica García · Médica y madre', persona: 'monica-garcia', cargo: 'Ministra de Sanidad', de: 'Mónica García', escena: 'Una bata blanca colgada junto a una mochila infantil en un perchero', icono: 'hospital', acciones: ['Consulta', 'Atención primaria'] },
    { nombre: 'Pepa Millán · Portavoz', persona: 'pepa-millan', cargo: 'Portavoz de Vox en el Congreso', de: 'Pepa Millán', escena: 'Un escaño verde con un micrófono encendido y un reloj de turno de palabra', icono: 'microfono', acciones: ['Turno de réplica', 'Sesión de control'] }),
  ...par({
    fase: 'fase1', rareza: 'I', aguante: 90, relevo: 1, arquetipos: ['control'],
    acciones: [{ coste: 'XI', dano: 30, efectos: [E.estado('desnortado')] }],
    carisma: { disparo: 'activado', efectos: [{ e: 'verMano' }] },
  },
    { nombre: 'Ernest Urtasun · Portavoz', persona: 'ernest-urtasun', cargo: 'Portavoz de Sumar', de: 'Ernest Urtasun', escena: 'Un atril con un micrófono magenta frente a una pared de prensa lisa', icono: 'atril', acciones: ['Rueda de prensa'], carisma: 'Lectura atenta' },
    { nombre: 'Jorge Buxadé · Eurodiputado', persona: 'jorge-buxade', cargo: 'Eurodiputado de Vox', de: 'Jorge Buxadé', escena: 'Un pasillo de cristal del Parlamento Europeo con una cartera verde abierta', icono: 'maletin', acciones: ['Desde Bruselas'], carisma: 'Lectura atenta' }),
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, claves: ['disciplina'], arquetipos: ['equipo'],
    acciones: [{ coste: 'XI', dano: 30, efectos: [E.si({ c: 'aliadosPartido', n: 1 }, [E.mas(20)])] }],
  },
    { nombre: 'Antonio Maíllo', persona: 'antonio-maillo', cargo: 'Coordinador federal de IU', escena: 'Una asamblea en un polideportivo con brazos alzados votando', icono: 'mano', acciones: ['Asamblea'] },
    { nombre: 'Rocío de Meer', persona: 'rocio-de-meer', cargo: 'Cabeza de lista de Vox por Almería', escena: 'Invernaderos de plástico bajo el sol de Almería vistos desde un cerro', icono: 'sol', acciones: ['Almería'] }),
  ...par({
    rareza: 'C', aguante: 60, relevo: 1, claves: ['bulo'], arquetipos: ['bulo'],
    acciones: [{ coste: 'X', dano: 10, efectos: [E.bulo(10, 'elegirBanquilloRival')] }],
  },
    { nombre: 'Rita Maestre', persona: 'rita-maestre', cargo: 'Portavoz de Más Madrid en el Ayuntamiento', escena: 'Un salón de plenos municipal con un escaño magenta y papeles volando', icono: 'ayuntamiento', acciones: ['Pleno municipal'] },
    { nombre: 'José Antonio Fúster', persona: 'jose-antonio-fuster', cargo: 'Portavoz nacional de Vox', escena: 'Una sala de prensa con un atril verde un lunes por la mañana', icono: 'atril', acciones: ['Rueda de prensa de los lunes'] }),
  ...par({
    rareza: 'I', aguante: 80, relevo: 1, arquetipos: ['tregua'],
    acciones: [{ coste: 'XI', dano: 30 }],
    carisma: { disparo: 'activado', efectos: [E.cura(20, 'elegirDanadoPropio')] },
  },
    { nombre: 'Manuela Carmena', persona: 'manuela-carmena', cargo: 'Exalcaldesa de Madrid (2015-2019)', escena: 'Un ovillo de lana y unas agujas de punto sobre el banco de un parque', icono: 'arbol', acciones: ['Madrid Central'], carisma: 'Abuela de Madrid' },
    { nombre: 'Hermann Tertsch', persona: 'hermann-tertsch', cargo: 'Eurodiputado de Vox (2019-2024)', escena: 'Una máquina de escribir antigua con una pila de crónicas internacionales', icono: 'periodico', acciones: ['Crónica'], carisma: 'Veteranía' }),
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, arquetipos: ['aggro'],
    acciones: [{ coste: 'XX', dano: 40 }],
  },
    { nombre: 'Pablo Bustinduy', persona: 'pablo-bustinduy', cargo: 'Ministro de Derechos Sociales', escena: 'Un paraguas abierto que protege a varias siluetas pequeñas de la lluvia', icono: 'escudo', acciones: ['Escudo social'] },
    { nombre: 'Carlos Hernández Quero', persona: 'hernandez-quero', cargo: 'Cabeza de lista de Vox por Málaga', escena: 'Un paseo marítimo malagueño con farolas y el mar al fondo', icono: 'ola', acciones: ['Costa del Sol'] }),
  ...par({
    rareza: 'C', aguante: 60, relevo: 1, arquetipos: ['aggro'],
    acciones: [{ coste: 'X', dano: 20 }],
  },
    { nombre: 'Sira Rego', persona: 'sira-rego', cargo: 'Ministra de Juventud e Infancia', escena: 'Un columpio vacío en un parque con cometas en el cielo', icono: 'estrella', acciones: ['Infancia'] },
    { nombre: 'Manuel Gavira', persona: 'manuel-gavira', cargo: 'Líder de Vox en Andalucía', escena: 'Una plaza de pueblo andaluz encalada con un balcón de forja', icono: 'balcon', acciones: ['Andalucía'] }),
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, claves: ['caos'], arquetipos: ['caos'],
    acciones: [{ coste: 'XI', dano: 20, efectos: [E.moneda([E.mas(30)])] }],
  },
    { nombre: 'Gerardo Pisarello', persona: 'gerardo-pisarello', cargo: 'Diputado de los Comuns', escena: 'Una Constitución abierta con muchas notas adhesivas magenta', icono: 'libro', acciones: ['Enmienda'] },
    { nombre: 'Carla Toscano', persona: 'carla-toscano', cargo: 'Diputada de Vox', escena: 'Un estrado con un vaso de agua y un discurso doblado en el bolsillo', icono: 'atril', acciones: ['Discurso'] }),
  ...par({
    rareza: 'I', aguante: 80, relevo: 1, arquetipos: ['combo'],
    acciones: [{ coste: 'XI', dano: 40 }],
    carisma: { disparo: 'mitin', efectos: [E.robar(1)] },
  },
    { nombre: 'Jéssica Albiach', persona: 'jessica-albiach', cargo: 'Líder de los Comuns en el Parlament', escena: 'Un hemiciclo autonómico semicircular con escaños magenta iluminados', icono: 'hemiciclo', acciones: ['Parlament'], carisma: 'Entrada en escena' },
    { nombre: 'Ricardo Chamorro', persona: 'ricardo-chamorro', cargo: 'Diputado de Vox', escena: 'Un campo de cereal manchego con una cosechadora verde al atardecer', icono: 'trigo', acciones: ['Campo'], carisma: 'Entrada en escena' }),
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, arquetipos: ['control'],
    acciones: [{ coste: 'XI', dano: 30, efectos: [E.quitarVoto(1)] }],
  },
    { nombre: 'Manuela Bergerot', persona: 'manuela-bergerot', cargo: 'Portavoz de Más Madrid en la Asamblea', escena: 'Una Asamblea autonómica con un escaño magenta y una pila de enmiendas', icono: 'carpeta', acciones: ['Enmienda a la totalidad'] },
    { nombre: 'Rubén Manso', persona: 'ruben-manso', cargo: 'Diputado de Vox', escena: 'Una calculadora científica sobre un informe económico lleno de gráficos', icono: 'grafico', acciones: ['Informe económico'] }),
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, arquetipos: ['control'],
    acciones: [{ coste: 'XX', dano: 30, efectos: [E.estado('sospecha')] }],
  },
    { nombre: 'Enrique Santiago', persona: 'enrique-santiago', cargo: 'Secretario general del PCE', escena: 'Un martillo de carpintero sobre un banco de trabajo con planos', icono: 'martillo', acciones: ['Comité central'] },
    { nombre: 'Patricia Rueda', persona: 'patricia-rueda', cargo: 'Diputada de Vox', escena: 'Un escaño verde con una carpeta de pregunta parlamentaria abierta', icono: 'carpeta', acciones: ['Pregunta escrita'] }),
  ...par({
    rareza: 'I', aguante: 80, relevo: 1, arquetipos: ['ascenso'],
    acciones: [{ coste: 'XI', dano: 30 }],
    carisma: { disparo: 'legado', efectos: [E.robar(1), E.voto('zona', 'tribunaPropia')] },
  },
    { nombre: 'Alberto Garzón', persona: 'alberto-garzon', cargo: 'Exministro de Consumo (2020-2023)', escena: 'Un carrito de la compra con verduras frescas y un ticket larguísimo', icono: 'casa', acciones: ['Menos carne'], carisma: 'Relevo generacional' },
    { nombre: 'José María Figaredo', persona: 'jose-maria-figaredo', cargo: 'Cabeza de lista de Vox por Asturias', escena: 'Un puerto pesquero asturiano con barcas pintadas y lluvia fina', icono: 'barco', acciones: ['Asturias'], carisma: 'Relevo generacional' }),
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, arquetipos: ['aggro'],
    acciones: [{ coste: 'XI', dano: 30, efectos: [E.si({ c: 'defensorCL' }, [E.mas(30)])] }],
  },
    { nombre: 'Gaspar Llamazares', persona: 'gaspar-llamazares', cargo: 'Excoordinador general de IU (2000-2008)', escena: 'Un fonendoscopio sobre un periódico doblado por la página de opinión', icono: 'fonendo', acciones: ['Contra el aparato'] },
    { nombre: 'Vicente Barrera', persona: 'vicente-barrera', cargo: 'Exvicepresidente de la Generalitat Valenciana (2023-2024)', escena: 'Una montera y un capote recogidos sobre una silla de despacho', icono: 'escudo', acciones: ['Contra el aparato'] }),
  ...par({
    rareza: 'C', aguante: 60, relevo: 1, arquetipos: ['ascenso'],
    acciones: [{ coste: 'X', dano: 10, efectos: [E.voto('zona', 'fuente')] }],
  },
    { nombre: 'Cayo Lara', persona: 'cayo-lara', cargo: 'Excoordinador general de IU (2008-2016)', escena: 'Un tractor viejo junto a una casa de labranza manchega', icono: 'tractor', acciones: ['Asamblea abierta'] },
    { nombre: 'Juan Sergio Redondo', persona: 'juan-sergio-redondo', cargo: 'Portavoz de Vox en Ceuta', escena: 'Un faro sobre el estrecho con el mar dividido entre dos luces', icono: 'faro', acciones: ['Desde Ceuta'] }),
];
