// Expansión 29N · Rojo (PSOE) ↔ Azul (PP): 24 parejas espejo (N-001 … N-048).
// Cada pareja tiene exactamente las mismas estadísticas y efectos; cambian la persona, el cargo y los nombres.
import { E, espejo, type Comun, type Lado } from '../constructores';
import type { Carta } from '../../motor/tipos';

const N = '29n' as const;
let n = 0;
/** Pareja con números consecutivos: impar el progresista, par el conservador. */
const par = (c: Omit<Comun, 'eje'>, p: Omit<Lado, 'num'>, q: Omit<Lado, 'num'>) => {
  n += 2;
  return espejo(N, { eje: 'RA', ...c }, { ...p, num: n - 1 }, { ...q, num: n });
};

export const CARTAS_ROJO_AZUL: Carta[] = [
  // ——— candidatos
  ...par({
    rareza: 'CL', cl: true, aguante: 150, relevo: 2, claves: ['remontada'], arquetipos: ['equipo', 'aggro'],
    acciones: [{ coste: 'XI', dano: 50 }, { coste: 'XXII', dano: 110, efectos: [E.si({ c: 'voyPerdiendo' }, [E.mas(30)])] }],
    carisma: { disparo: 'pasiva', pasivas: [{ p: 'defensa', n: 10, ambito: 'aliados', filtro: { tipo: ['rojo'] } }] },
  },
    { nombre: 'Pedro Sánchez CL', persona: 'pedro-sanchez', cargo: 'Candidato del PSOE a la reelección', frase: 'No es no.', escena: 'Un atril rojo solitario en medio de un escenario enorme, con un foco cenital y un público en penumbra', icono: 'atril', acciones: ['Cuestión de confianza', 'Remontada del 23J'], carisma: 'Manual de resistencia' },
    { nombre: 'Feijóo CL', persona: 'feijoo', cargo: 'Candidato del PP a la Moncloa', escena: 'Un faro azul iluminando un mar en calma con una escalinata de piedra hacia la luz', icono: 'faro', acciones: ['Alternativa de Gobierno', 'Ganar en las urnas'], carisma: 'Gestión gallega' }),
  ...par({
    rareza: 'I', aguante: 70, relevo: 1, claves: ['combo'], arquetipos: ['combo', 'aggro'],
    acciones: [{ coste: 'X', dano: 20, efectos: [E.si({ c: 'combo' }, [E.mas(20)])] }, { coste: 'XXI', dano: 60 }],
  },
    { nombre: 'María Jesús Montero', persona: 'mj-montero', cargo: 'Líder del PSOE de Andalucía', escena: 'Una calculadora antigua sobre una pila de presupuestos encuadernados en rojo', icono: 'grafico', acciones: ['Cuadrar las cuentas', 'Presupuestos'] },
    { nombre: 'Isabel Díaz Ayuso', persona: 'ayuso', cargo: 'Diputada en la Asamblea de Madrid', frase: 'Comunismo o libertad.', escena: 'Una terraza de bar madrileña al atardecer con dos cañas sobre la mesa y la ciudad al fondo', icono: 'cana', acciones: ['Libertad', 'Efecto Ayuso'] }),
  ...par({
    fase: 'fase1', rareza: 'R', aguante: 110, relevo: 2, claves: ['disciplina'], arquetipos: ['equipo'],
    acciones: [{ coste: 'XXI', dano: 60, efectos: [E.masPor(10, 'aliadosPartido', 3)] }],
    carisma: { disparo: 'pasiva', pasivas: [{ p: 'dano', n: 10, ambito: 'aliados', filtro: { partido: ['PSOE'] } }] },
  },
    { nombre: 'María Jesús Montero · Vicepresidenta', persona: 'mj-montero', cargo: 'Vicepresidenta primera (2023-2026)', de: 'María Jesús Montero', escena: 'Una mesa de Consejo de Ministros vacía con una carpeta roja abierta y gafas encima', icono: 'carpeta', acciones: ['Hacienda somos todos'], carisma: 'Cuentas claras' },
    { nombre: 'Isabel Díaz Ayuso · Presidenta', persona: 'ayuso', cargo: 'Presidenta de la Comunidad de Madrid', de: 'Isabel Díaz Ayuso', escena: 'Un balcón de la Puerta del Sol con el reloj al fondo y confeti azul en el aire', icono: 'reloj', acciones: ['Madrid manda'], carisma: 'Ola azul' }),
  // ——— el Gobierno y la oposición
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, arquetipos: ['combo', 'control'],
    acciones: [{ coste: 'XI', dano: 30 }],
    carisma: { disparo: 'activado', descartaVotos: 1, efectos: [{ e: 'buscar', filtro: { clase: ['asesor'] }, n: 1, destino: 'mano' }], requisito: { c: 'mazoPropioMin', n: 1 } },
  },
    { nombre: 'Félix Bolaños', persona: 'felix-bolanos', cargo: 'Ministro de la Presidencia y Justicia', escena: 'Un llavero con decenas de llaves sobre una mesa de negociación', icono: 'llave', acciones: ['Negociación permanente'], carisma: 'Ministro de todo' },
    { nombre: 'Elías Bendodo', persona: 'elias-bendodo', cargo: 'Dirigente nacional del PP', escena: 'Un organigrama de corcho con fichas azules y un cordel uniendo despachos', icono: 'red', acciones: ['Coordinación'], carisma: 'Fontanería de partido' }),
  ...par({
    rareza: 'C', aguante: 80, relevo: 2, arquetipos: ['tregua'],
    acciones: [{ coste: 'XXI', dano: 50 }],
    carisma: { disparo: 'pasiva', pasivas: [{ p: 'defensa', n: 10, ambito: 'este' }] },
  },
    { nombre: 'Óscar López', persona: 'oscar-lopez', cargo: 'Ministro para la Transformación Digital', escena: 'Un cable de fibra óptica brillante cruzando una plaza de noche', icono: 'red', acciones: ['Asalto a la Asamblea'], carisma: 'Fibra' },
    { nombre: 'José Luis Martínez-Almeida', persona: 'almeida', cargo: 'Alcalde de Madrid', escena: 'Una apisonadora pequeña asfaltando una avenida madrileña de madrugada', icono: 'edificio', acciones: ['Operación asfalto'], carisma: 'Cintura municipal' }),
  ...par({
    rareza: 'I', aguante: 90, relevo: 2, arquetipos: ['tregua', 'equipo'],
    acciones: [{ coste: 'XXI', dano: 40 }],
    carisma: { disparo: 'pasiva', pasivas: [{ p: 'defensa', n: 10, ambito: 'aliados', soloTribuna: true }] },
  },
    { nombre: 'Margarita Robles', persona: 'margarita-robles', cargo: 'Ministra de Defensa', escena: 'Un escudo de bronce apoyado en una mesa de mapas con luz de amanecer', icono: 'escudo', acciones: ['Defensa'], carisma: 'Retaguardia' },
    { nombre: 'Esteban González Pons', persona: 'gonzalez-pons', cargo: 'Vicesecretario institucional del PP', escena: 'Un pasillo del Parlamento Europeo con una cartera azul en un banco', icono: 'maletin', acciones: ['Desde Bruselas'], carisma: 'Cortafuegos' }),
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, arquetipos: ['control'],
    acciones: [{ coste: 'XI', dano: 20, efectos: [E.moneda([E.estado('bloqueado')])] }],
  },
    { nombre: 'Fernando Grande-Marlaska', persona: 'marlaska', cargo: 'Ministro del Interior', escena: 'Unas vallas de seguridad alineadas en una calle vacía con luces azules y rojas', icono: 'candado', acciones: ['Orden público'] },
    { nombre: 'Juan Bravo', persona: 'juan-bravo', cargo: 'Vicesecretario de Economía del PP', escena: 'Una pizarra llena de gráficas descendentes con una tiza azul rota', icono: 'grafico', acciones: ['Plan fiscal'] }),
  ...par({
    rareza: 'C', aguante: 60, relevo: 1, arquetipos: ['combo'],
    acciones: [{ coste: 'X', dano: 10, efectos: [E.robar(1)] }],
  },
    { nombre: 'Diana Morant', persona: 'diana-morant', cargo: 'Ministra de Ciencia y líder del PSPV', escena: 'Un matraz de laboratorio con un líquido rojo burbujeante y un naranjo al fondo', icono: 'gota', acciones: ['I+D'] },
    { nombre: 'María José Catalá', persona: 'mj-catala', cargo: 'Alcaldesa de Valencia', escena: 'Una barraca valenciana junto a una noria de agua y arrozales al sol', icono: 'casa', acciones: ['Cap i casal'] }),
  ...par({
    rareza: 'C', aguante: 80, relevo: 2, arquetipos: ['control'],
    acciones: [{ coste: 'XXI', dano: 40, efectos: [E.quitarVoto(1)] }],
  },
    { nombre: 'Luis Planas', persona: 'luis-planas', cargo: 'Ministro de Agricultura', escena: 'Un campo de trigo con un tractor rojo parado bajo un cielo de tormenta', icono: 'trigo', acciones: ['Política agraria'] },
    { nombre: 'Fernando López Miras', persona: 'lopez-miras', cargo: 'Presidente de la Región de Murcia', escena: 'Una acequia seca con una compuerta azul abierta y huertas al fondo', icono: 'gota', acciones: ['Agua para todos'] }),
  ...par({
    rareza: 'R', aguante: 90, relevo: 1, arquetipos: ['ascenso', 'equipo'],
    acciones: [{ coste: 'XI', dano: 30 }],
    carisma: { disparo: 'activado', efectos: [E.voto('zona', 'elegirBanquilloPropio')], requisito: { c: 'banquilloPropioMin', n: 1 } },
  },
    { nombre: 'Teresa Ribera', persona: 'teresa-ribera', cargo: 'Vicepresidenta de la Comisión Europea', escena: 'Un aerogenerador gigante sobre un mar de banderas lisas europeas', icono: 'molino', acciones: ['Pacto Verde'], carisma: 'Fondos de Bruselas' },
    { nombre: 'Dolors Montserrat', persona: 'dolors-montserrat', cargo: 'Eurodiputada del PP', escena: 'Un hemiciclo de Estrasburgo con un escaño azul iluminado', icono: 'hemiciclo', acciones: ['Mayoría europea'], carisma: 'Peso en Bruselas' }),
  ...par({
    rareza: 'I', aguante: 80, relevo: 2, arquetipos: ['equipo'],
    acciones: [{ coste: 'XI', dano: 40 }],
    carisma: { disparo: 'legado', efectos: [E.robar(2)] },
  },
    { nombre: 'Josep Borrell', persona: 'josep-borrell', cargo: 'Exalto representante de la UE (2019-2024)', escena: 'Un globo terráqueo antiguo sobre una mesa con un mapa de Europa desplegado', icono: 'globo', acciones: ['Diplomacia europea'], carisma: 'Experiencia' },
    { nombre: 'Javier Arenas', persona: 'javier-arenas', cargo: 'Exvicepresidente del Gobierno (2003-2004)', escena: 'Un sillón de cuero gastado en un despacho con fotos enmarcadas boca abajo', icono: 'reloj', acciones: ['Veteranía'], carisma: 'Viejo zorro' }),
  ...par({
    rareza: 'I', aguante: 90, relevo: 2, arquetipos: ['tregua', 'crispacion'],
    acciones: [{ coste: 'XXI', dano: 40 }],
    carisma: { disparo: 'activado', efectos: [E.clima(1)], requisito: { c: 'climaMax', n: 4 } },
  },
    { nombre: 'Francina Armengol', persona: 'francina-armengol', cargo: 'Presidenta del Congreso', escena: 'Una campanilla de plata sobre la mesa presidencial de un hemiciclo', icono: 'hemiciclo', acciones: ['Orden del día'], carisma: 'Llamada al orden' },
    { nombre: 'Pedro Rollán', persona: 'pedro-rollan', cargo: 'Presidente del Senado', escena: 'Un mazo de madera sobre un atril del Senado con tapices al fondo', icono: 'martillo', acciones: ['Mayoría en el Senado'], carisma: 'Llamada al orden' }),
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, arquetipos: ['tregua'],
    acciones: [{ coste: 'XI', dano: 30, efectos: [E.cura(10, 'banquilloPropio')] }],
  },
    { nombre: 'Isabel Rodríguez', persona: 'isabel-rodriguez', cargo: 'Ministra de Vivienda', escena: 'Una llave de casa colgando de un llavero con un tejado en miniatura', icono: 'casa', acciones: ['Ley de Vivienda'] },
    { nombre: 'Jorge Azcón', persona: 'jorge-azcon', cargo: 'Presidente de Aragón', escena: 'Una muralla de piedra aragonesa con un cierzo que dobla los árboles', icono: 'castillo', acciones: ['Cierzo'] }),
  ...par({
    rareza: 'C', aguante: 60, relevo: 1, arquetipos: ['ascenso'],
    acciones: [{ coste: 'X', dano: 20 }],
    carisma: { disparo: 'mitin', efectos: [E.voto('zona', 'fuente')] },
  },
    { nombre: 'Elma Saiz', persona: 'elma-saiz', cargo: 'Ministra de Inclusión y Seguridad Social', escena: 'Una cadena de manos sujetando una red bajo un trapecio de circo', icono: 'mano', acciones: ['Ingreso mínimo'], carisma: 'Red de seguridad' },
    { nombre: 'María Guardiola', persona: 'maria-guardiola', cargo: 'Presidenta de la Junta de Extremadura', escena: 'Una dehesa extremeña con encinas y un camino de tierra hacia el horizonte', icono: 'arbol', acciones: ['Dehesa'], carisma: 'Tierra adentro' }),
  ...par({
    rareza: 'I', aguante: 90, relevo: 2, claves: ['coalicion'], arquetipos: ['coalicion'],
    acciones: [{ coste: 'XXI', dano: 50, efectos: [E.si({ c: 'coalicion', n: 2 }, [E.mas(20)])] }],
  },
    { nombre: 'Adrián Barbón', persona: 'adrian-barbon', cargo: 'Presidente del Principado de Asturias', escena: 'Una mina abandonada entre montañas verdes con niebla en el valle', icono: 'montana', acciones: ['Pacto de izquierdas'] },
    { nombre: 'Alfonso Fernández Mañueco', persona: 'manueco', cargo: 'Presidente de la Junta de Castilla y León', escena: 'Un castillo sobre un páramo dorado con un rebaño a lo lejos', icono: 'castillo', acciones: ['Gobierno de coalición'] }),
  ...par({
    fase: 'fase1', rareza: 'R', aguante: 110, relevo: 2, arquetipos: ['tregua', 'ascenso'],
    acciones: [{ coste: 'XI', dano: 40, efectos: [E.cura(20, 'fuente')] }, { coste: 'XXI', dano: 70 }],
  },
    { nombre: 'Salvador Illa · Molt Honorable', persona: 'salvador-illa', cargo: 'President de la Generalitat de Catalunya', de: 'Salvador Illa', escena: 'La galería gótica de un palacio con columnas y un jardín de naranjos al fondo', icono: 'columna', acciones: ['Pacificación', 'Govern de la Generalitat'] },
    { nombre: 'Alfonso Rueda · Mayoría absoluta', persona: 'alfonso-rueda', cargo: 'Presidente de la Xunta de Galicia', de: 'Alfonso Rueda', escena: 'Un hórreo de piedra bajo la lluvia con una luz cálida en la aldea', icono: 'lluvia', acciones: ['Galicia tranquila', 'Revalidar la Xunta'] }),
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, claves: ['viral'], arquetipos: ['aggro'],
    acciones: [{ coste: 'XI', dano: 30 }],
  },
    { nombre: 'Jaume Collboni', persona: 'jaume-collboni', cargo: 'Alcalde de Barcelona', escena: 'Una plaza de Barcelona con baldosas en flor y un tranvía al fondo', icono: 'ayuntamiento', acciones: ['Barcelona'] },
    { nombre: 'Xavier García Albiol', persona: 'garcia-albiol', cargo: 'Alcalde de Badalona', escena: 'Un puente de hierro sobre el mar con una chimenea industrial al fondo', icono: 'puente', acciones: ['Badalona'] }),
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, claves: ['combo'], arquetipos: ['combo'],
    acciones: [{ coste: 'X', dano: 10, efectos: [E.si({ c: 'combo' }, [E.robar(1)])] }],
  },
    { nombre: 'Pilar Bernabé', persona: 'pilar-bernabe', cargo: 'Delegada del Gobierno en la Comunitat Valenciana', escena: 'Un chaleco de emergencias colgado junto a un mapa con zonas marcadas', icono: 'telefono', acciones: ['Coordinación de emergencias'] },
    { nombre: 'Borja Sémper', persona: 'borja-semper', cargo: 'Vicesecretario de Cultura del PP', escena: 'Una guitarra apoyada en una butaca de teatro vacía', icono: 'teatro', acciones: ['Centro templado'] }),
  ...par({
    rareza: 'I', aguante: 80, relevo: 1, arquetipos: ['tregua'],
    acciones: [{ coste: 'XI', dano: 30, efectos: [{ e: 'quitarEstados', a: 'tribunaPropia' }] }],
    carisma: { disparo: 'pasiva', pasivas: [{ p: 'inmuneEstados', ambito: 'este' }] },
  },
    { nombre: 'Cristina Narbona', persona: 'cristina-narbona', cargo: 'Presidenta del PSOE', escena: 'Un olivo centenario con una silla de madera a su sombra', icono: 'olivo', acciones: ['Serenidad'], carisma: 'Templanza' },
    { nombre: 'Ana Pastor', persona: 'ana-pastor', cargo: 'Expresidenta del Congreso (2016-2019)', escena: 'Un estetoscopio y una campanilla sobre la mesa presidencial de una cámara', icono: 'fonendo', acciones: ['Moderación'], carisma: 'Templanza' }),
  ...par({
    rareza: 'C', aguante: 70, relevo: 1, claves: ['bulo'], arquetipos: ['bulo'],
    acciones: [{ coste: 'XI', dano: 30, efectos: [E.si({ c: 'banquilloRivalMin', n: 2 }, [E.bulo(10, 'elegirBanquilloRival')])] }],
  },
    { nombre: 'Ximo Puig', persona: 'ximo-puig', cargo: 'Expresident de la Generalitat Valenciana', escena: 'Una vía de tren junto al Mediterráneo con un tren de mercancías al atardecer', icono: 'tren', acciones: ['Corredor mediterráneo'] },
    { nombre: 'Alicia García', persona: 'alicia-garcia', cargo: 'Senadora del PP', escena: 'Un escaño del Senado con un micrófono doblado y papeles subrayados', icono: 'microfono', acciones: ['Pregunta en el Senado'] }),
  ...par({
    rareza: 'R', aguante: 80, relevo: 1, claves: ['clima'], arquetipos: ['crispacion'],
    acciones: [{ coste: 'XI', dano: 20, efectos: [E.masPor(10, 'crispacion')] }],
    carisma: { disparo: 'activado', efectos: [E.clima(-1)], requisito: { c: 'climaMin', n: 3 } },
  },
    { nombre: 'Sara Aagesen', persona: 'sara-aagesen', cargo: 'Vicepresidenta tercera y ministra de Transición Ecológica', escena: 'Un cielo de tormenta sobre un campo de placas solares con un rayo lejano', icono: 'rayo', acciones: ['Gota fría'], carisma: 'Alerta roja' },
    { nombre: 'Cayetana Álvarez de Toledo', persona: 'cayetana', cargo: 'Diputada del PP', escena: 'Un estrado con un libro de ensayo abierto y un micrófono encendido', icono: 'libro', acciones: ['Batalla cultural'], carisma: 'Sin complejos' }),
  ...par({
    rareza: 'CL', cl: true, aguante: 140, relevo: 2, arquetipos: ['tregua', 'equipo'],
    acciones: [{ coste: 'XI', dano: 40, efectos: [E.cura(20, 'todosPropios')] }, { coste: 'XXII', dano: 100 }],
  },
    { nombre: 'García-Page CL', persona: 'garcia-page', cargo: 'Presidente de Castilla-La Mancha', escena: 'Un molino de viento enorme girando a contraviento sobre un cerro al anochecer', icono: 'molino', acciones: ['Mayoría manchega', 'Verso suelto'] },
    { nombre: 'Juanma Moreno CL', persona: 'juanma-moreno', cargo: 'Presidente de la Junta de Andalucía', escena: 'Un patio andaluz con una fuente y naranjos bajo una luz dorada', icono: 'sol', acciones: ['Moderación andaluza', 'Revalidar San Telmo'] }),
  ...par({
    rareza: 'C', aguante: 60, relevo: 1, arquetipos: ['control'],
    acciones: [{ coste: 'X', dano: 10, efectos: [E.estado('sospecha')] }],
  },
    { nombre: 'Ana Redondo', persona: 'ana-redondo', cargo: 'Ministra de Igualdad', escena: 'Una balanza de bronce perfectamente equilibrada sobre un pupitre', icono: 'balanza', acciones: ['Pacto de Estado'] },
    { nombre: 'Jaime de los Santos', persona: 'jaime-de-los-santos', cargo: 'Vicesecretario de Educación e Igualdad del PP', escena: 'Un pupitre escolar con un cuaderno abierto y lápices de colores', icono: 'cuaderno', acciones: ['Pregunta de examen'] }),
  ...par({
    rareza: 'I', aguante: 80, relevo: 1, arquetipos: ['control'],
    acciones: [{ coste: 'XI', dano: 30 }],
    carisma: { disparo: 'activado', descartaVotos: 1, efectos: [{ e: 'cambiarRival', elige: 'rival' }], requisito: { c: 'banquilloRivalMin', n: 1 } },
  },
    { nombre: 'José Manuel Albares', persona: 'albares', cargo: 'Ministro de Asuntos Exteriores', escena: 'Una valija diplomática con lacre rojo sobre una mesa de embajada', icono: 'maletin', acciones: ['Cumbre'], carisma: 'Valija diplomática' },
    { nombre: 'José Antonio Monago', persona: 'monago', cargo: 'Expresidente de Extremadura (2011-2015)', escena: 'Una encina solitaria con un banco de piedra y un atardecer rojizo', icono: 'arbol', acciones: ['Barón extremeño'], carisma: 'Golpe de timón' }),
  // ——— ascensos de la colección básica
  ...par({
    fase: 'fase1', rareza: 'R', aguante: 110, relevo: 2, claves: ['portavoz'], arquetipos: ['equipo'],
    acciones: [{ coste: 'XXI', dano: 60 }],
    carisma: { disparo: 'activado', efectos: [{ e: 'moverVoto', n: 1, desde: 'banquilloPropio', a: 'tribunaPropia' }, E.robar(1)], requisito: { c: 'banquilloPropioMin', n: 1 } },
  },
    { nombre: 'Patxi López · Lehendakari', persona: 'patxi-lopez', cargo: 'Lehendakari (2009-2012)', de: 'Patxi López', escena: 'Un roble frondoso junto a un edificio institucional de piedra bajo la lluvia', icono: 'arbol', acciones: ['Gobierno vasco'], carisma: 'Turno de portavoces' },
    { nombre: 'Ester Muñoz · Portavoz', persona: 'ester-munoz', cargo: 'Portavoz del PP en el Congreso', de: 'Ester Muñoz', escena: 'Una sala de prensa con un atril azul y una pila de carpetas a punto de caer', icono: 'atril', acciones: ['Sesión de control'], carisma: 'Turno de portavoces' }),
  ...par({
    fase: 'fase1', rareza: 'I', aguante: 100, relevo: 1, claves: ['bulo'], arquetipos: ['bulo'],
    acciones: [{ coste: 'XI', dano: 30, efectos: [E.bulo(10, 'banquilloRival')] }, { coste: 'XXI', dano: 60 }],
  },
    { nombre: 'Óscar Puente · Tuitero', persona: 'oscar-puente', cargo: 'Ministro de Transportes', de: 'Óscar Puente', escena: 'Un andén de alta velocidad de noche con decenas de notificaciones flotando como luciérnagas', icono: 'telefono', acciones: ['Réplica en redes', 'Hilo infinito'] },
    { nombre: 'Miguel Tellado · Ofensiva', persona: 'miguel-tellado', cargo: 'Secretario general del PP', de: 'Miguel Tellado', escena: 'Un megáfono azul sobre una pila de periódicos de la mañana', icono: 'megafono', acciones: ['Ofensiva de los lunes', 'Todos contra Sánchez'] }),
];
