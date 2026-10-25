// Registro de las personas reales que aparecen en las cartas: su cargo público y de dónde sale.
// Ninguna carta puede usar a alguien que no esté aquí (lo comprueba tests/contenido.test.ts).
// Normas en docs/NORMAS_CONTENIDO.md: solo la faceta pública, sátira amable, nada de delitos sin sentencia firme.

export type Ambito = 'politico' | 'periodista' | 'asesor' | 'historico';

export interface Persona {
  nombre: string;
  ambito: Ambito;
  /** cargo o papel público por el que se le conoce (octubre de 2026) */
  cargo: string;
  /** fuentes públicas del cargo y de las frases que se citan */
  fuentes: string[];
  /** fallecida: solo como Leyenda y con respeto */
  fallecido?: boolean;
}

const W = (titulo: string) => `Wikipedia (es): ${titulo}`;
const C = 'Congreso de los Diputados: ficha parlamentaria';

export const PERSONAS: Record<string, Persona> = {};

function reg(id: string, p: Persona) {
  if (PERSONAS[id]) throw new Error(`Persona repetida: ${id}`);
  PERSONAS[id] = p;
}

// ————————————————————————————————————— candidatos (de «176 · La Batalla del 29N», src/data/partidos.ts)
reg('pedro-sanchez', { nombre: 'Pedro Sánchez', ambito: 'politico', cargo: 'Presidente del Gobierno y candidato del PSOE', fuentes: [W('Pedro Sánchez'), 'Comité Federal del PSOE (2016): «No es no»', 'Manual de resistencia (Península, 2019)'] });
reg('feijoo', { nombre: 'Alberto Núñez Feijóo', ambito: 'politico', cargo: 'Presidente del PP y candidato a la Moncloa', fuentes: [W('Alberto Núñez Feijóo'), 'Xunta de Galicia: presidentes (2009-2022)'] });
reg('abascal', { nombre: 'Santiago Abascal', ambito: 'politico', cargo: 'Presidente de Vox y candidato', fuentes: [W('Santiago Abascal'), 'Ayuntamiento de Llodio: concejal (1999-2007)'] });
reg('colau', { nombre: 'Ada Colau', ambito: 'politico', cargo: 'Candidata del Frente Amplio', fuentes: [W('Ada Colau'), 'Plataforma de Afectados por la Hipoteca: «Sí se puede»', 'Ayuntamiento de Barcelona: alcaldesa (2015-2023)'] });
reg('irene-montero', { nombre: 'Irene Montero', ambito: 'politico', cargo: 'Candidata de Podemos', fuentes: [W('Irene Montero'), 'Parlamento Europeo: eurodiputada (2024)'] });

// ————————————————————————————————————— colección básica
reg('oscar-puente', { nombre: 'Óscar Puente', ambito: 'politico', cargo: 'Ministro de Transportes', fuentes: [W('Óscar Puente'), 'BOE: nombramiento (2023)'] });
reg('miguel-tellado', { nombre: 'Miguel Tellado', ambito: 'politico', cargo: 'Secretario general del PP', fuentes: [W('Miguel Tellado'), 'Congreso del PP (2025)'] });
reg('patxi-lopez', { nombre: 'Patxi López', ambito: 'politico', cargo: 'Portavoz del PSOE en el Congreso', fuentes: [W('Patxi López'), C] });
reg('ester-munoz', { nombre: 'Ester Muñoz', ambito: 'politico', cargo: 'Portavoz del PP en el Congreso', fuentes: [W('Ester Muñoz'), C] });
reg('garcia-page', { nombre: 'Emiliano García-Page', ambito: 'politico', cargo: 'Presidente de Castilla-La Mancha', fuentes: [W('Emiliano García-Page')] });
reg('juanma-moreno', { nombre: 'Juanma Moreno', ambito: 'politico', cargo: 'Presidente de la Junta de Andalucía', fuentes: [W('Juan Manuel Moreno'), 'Elecciones andaluzas de mayo de 2026: 53 escaños'] });
reg('salvador-illa', { nombre: 'Salvador Illa', ambito: 'politico', cargo: 'President de la Generalitat de Catalunya', fuentes: [W('Salvador Illa')] });
reg('alfonso-rueda', { nombre: 'Alfonso Rueda', ambito: 'politico', cargo: 'Presidente de la Xunta de Galicia', fuentes: [W('Alfonso Rueda')] });
reg('yolanda-diaz', { nombre: 'Yolanda Díaz', ambito: 'politico', cargo: 'Vicepresidenta segunda y ministra de Trabajo', fuentes: [W('Yolanda Díaz')] });
reg('ignacio-garriga', { nombre: 'Ignacio Garriga', ambito: 'politico', cargo: 'Secretario general de Vox', fuentes: [W('Ignacio Garriga')] });
reg('monica-garcia', { nombre: 'Mónica García', ambito: 'politico', cargo: 'Ministra de Sanidad', fuentes: [W('Mónica García Gómez')] });
reg('pepa-millan', { nombre: 'Pepa Millán', ambito: 'politico', cargo: 'Portavoz de Vox en el Congreso', fuentes: [W('Pepa Millán'), C] });
reg('ernest-urtasun', { nombre: 'Ernest Urtasun', ambito: 'politico', cargo: 'Ministro de Cultura', fuentes: [W('Ernest Urtasun')] });
reg('jorge-buxade', { nombre: 'Jorge Buxadé', ambito: 'politico', cargo: 'Eurodiputado de Vox', fuentes: [W('Jorge Buxadé'), 'Parlamento Europeo: ficha de eurodiputado'] });
reg('tezanos', { nombre: 'José Félix Tezanos', ambito: 'asesor', cargo: 'Presidente del CIS', fuentes: [W('José Félix Tezanos'), 'Centro de Investigaciones Sociológicas'] });
reg('michavila', { nombre: 'Narciso Michavila', ambito: 'asesor', cargo: 'Presidente de GAD3', fuentes: [W('Narciso Michavila'), 'GAD3: equipo'] });

// ————————————————————————————————————— expansión 29N y secretas
reg('mj-montero', { nombre: "María Jesús Montero", ambito: 'politico', cargo: "Líder del PSOE de Andalucía; vicepresidenta primera hasta 2026", fuentes: [W("María Jesús Montero"), "Salida del Gobierno en marzo de 2026 para concurrir a las andaluzas del 17 de mayo"] });
reg('ayuso', { nombre: "Isabel Díaz Ayuso", ambito: 'politico', cargo: "Presidenta de la Comunidad de Madrid", fuentes: [W("Isabel Díaz Ayuso"), "Lema de campaña de las autonómicas de 2021: «Comunismo o libertad»"] });
reg('felix-bolanos', { nombre: "Félix Bolaños", ambito: 'politico', cargo: "Ministro de la Presidencia y Justicia", fuentes: [W("Félix Bolaños")] });
reg('elias-bendodo', { nombre: "Elías Bendodo", ambito: 'politico', cargo: "Dirigente nacional del PP", fuentes: [W("Elías Bendodo")] });
reg('oscar-lopez', { nombre: "Óscar López", ambito: 'politico', cargo: "Ministro para la Transformación Digital", fuentes: [W("Óscar López")] });
reg('almeida', { nombre: "José Luis Martínez-Almeida", ambito: 'politico', cargo: "Alcalde de Madrid", fuentes: [W("José Luis Martínez-Almeida")] });
reg('margarita-robles', { nombre: "Margarita Robles", ambito: 'politico', cargo: "Ministra de Defensa", fuentes: [W("Margarita Robles")] });
reg('gonzalez-pons', { nombre: "Esteban González Pons", ambito: 'politico', cargo: "Vicesecretario institucional del PP", fuentes: [W("Esteban González Pons")] });
reg('marlaska', { nombre: "Fernando Grande-Marlaska", ambito: 'politico', cargo: "Ministro del Interior", fuentes: [W("Fernando Grande-Marlaska")] });
reg('juan-bravo', { nombre: "Juan Bravo", ambito: 'politico', cargo: "Vicesecretario de Economía del PP", fuentes: [W("Juan Bravo")] });
reg('diana-morant', { nombre: "Diana Morant", ambito: 'politico', cargo: "Ministra de Ciencia y líder del PSPV", fuentes: [W("Diana Morant")] });
reg('mj-catala', { nombre: "María José Catalá", ambito: 'politico', cargo: "Alcaldesa de Valencia", fuentes: [W("María José Catalá")] });
reg('luis-planas', { nombre: "Luis Planas", ambito: 'politico', cargo: "Ministro de Agricultura", fuentes: [W("Luis Planas")] });
reg('lopez-miras', { nombre: "Fernando López Miras", ambito: 'politico', cargo: "Presidente de la Región de Murcia", fuentes: [W("Fernando López Miras")] });
reg('teresa-ribera', { nombre: "Teresa Ribera", ambito: 'politico', cargo: "Vicepresidenta de la Comisión Europea", fuentes: [W("Teresa Ribera")] });
reg('dolors-montserrat', { nombre: "Dolors Montserrat", ambito: 'politico', cargo: "Eurodiputada del PP", fuentes: [W("Dolors Montserrat")] });
reg('josep-borrell', { nombre: "Josep Borrell", ambito: 'politico', cargo: "Exalto representante de la UE (2019-2024)", fuentes: [W("Josep Borrell")] });
reg('javier-arenas', { nombre: "Javier Arenas", ambito: 'politico', cargo: "Exvicepresidente del Gobierno (2003-2004)", fuentes: [W("Javier Arenas")] });
reg('francina-armengol', { nombre: "Francina Armengol", ambito: 'politico', cargo: "Presidenta del Congreso", fuentes: [W("Francina Armengol")] });
reg('pedro-rollan', { nombre: "Pedro Rollán", ambito: 'politico', cargo: "Presidente del Senado", fuentes: [W("Pedro Rollán")] });
reg('isabel-rodriguez', { nombre: "Isabel Rodríguez", ambito: 'politico', cargo: "Ministra de Vivienda", fuentes: [W("Isabel Rodríguez")] });
reg('jorge-azcon', { nombre: "Jorge Azcón", ambito: 'politico', cargo: "Presidente de Aragón", fuentes: [W("Jorge Azcón"), "Investidura en las Cortes de Aragón (abril de 2026)"] });
reg('elma-saiz', { nombre: "Elma Saiz", ambito: 'politico', cargo: "Ministra de Inclusión y Seguridad Social", fuentes: [W("Elma Saiz")] });
reg('maria-guardiola', { nombre: "María Guardiola", ambito: 'politico', cargo: "Presidenta de la Junta de Extremadura", fuentes: [W("María Guardiola"), "Elecciones a la Asamblea de Extremadura (21 de diciembre de 2025)"] });
reg('adrian-barbon', { nombre: "Adrián Barbón", ambito: 'politico', cargo: "Presidente del Principado de Asturias", fuentes: [W("Adrián Barbón")] });
reg('manueco', { nombre: "Alfonso Fernández Mañueco", ambito: 'politico', cargo: "Presidente de la Junta de Castilla y León", fuentes: [W("Alfonso Fernández Mañueco"), "Elecciones a las Cortes de Castilla y León (15 de marzo de 2026)"] });
reg('jaume-collboni', { nombre: "Jaume Collboni", ambito: 'politico', cargo: "Alcalde de Barcelona", fuentes: [W("Jaume Collboni")] });
reg('garcia-albiol', { nombre: "Xavier García Albiol", ambito: 'politico', cargo: "Alcalde de Badalona", fuentes: [W("Xavier García Albiol")] });
reg('pilar-bernabe', { nombre: "Pilar Bernabé", ambito: 'politico', cargo: "Delegada del Gobierno en la Comunitat Valenciana", fuentes: [W("Pilar Bernabé")] });
reg('borja-semper', { nombre: "Borja Sémper", ambito: 'politico', cargo: "Vicesecretario de Cultura del PP", fuentes: [W("Borja Sémper")] });
reg('cristina-narbona', { nombre: "Cristina Narbona", ambito: 'politico', cargo: "Presidenta del PSOE", fuentes: [W("Cristina Narbona")] });
reg('ana-pastor', { nombre: "Ana Pastor", ambito: 'politico', cargo: "Expresidenta del Congreso (2016-2019)", fuentes: [W("Ana Pastor")] });
reg('ximo-puig', { nombre: "Ximo Puig", ambito: 'politico', cargo: "Expresident de la Generalitat Valenciana", fuentes: [W("Ximo Puig")] });
reg('alicia-garcia', { nombre: "Alicia García", ambito: 'politico', cargo: "Senadora del PP", fuentes: [W("Alicia García")] });
reg('sara-aagesen', { nombre: "Sara Aagesen", ambito: 'politico', cargo: "Vicepresidenta tercera y ministra de Transición Ecológica", fuentes: [W("Sara Aagesen")] });
reg('cayetana', { nombre: "Cayetana Álvarez de Toledo", ambito: 'politico', cargo: "Diputada del PP", fuentes: [W("Cayetana Álvarez de Toledo")] });
reg('ana-redondo', { nombre: "Ana Redondo", ambito: 'politico', cargo: "Ministra de Igualdad", fuentes: [W("Ana Redondo")] });
reg('jaime-de-los-santos', { nombre: "Jaime de los Santos", ambito: 'politico', cargo: "Vicesecretario de Educación e Igualdad del PP", fuentes: [W("Jaime de los Santos")] });
reg('albares', { nombre: "José Manuel Albares", ambito: 'politico', cargo: "Ministro de Asuntos Exteriores", fuentes: [W("José Manuel Albares")] });
reg('monago', { nombre: "José Antonio Monago", ambito: 'politico', cargo: "Expresidente de Extremadura (2011-2015)", fuentes: [W("José Antonio Monago")] });
reg('antonio-maillo', { nombre: "Antonio Maíllo", ambito: 'politico', cargo: "Coordinador federal de IU", fuentes: [W("Antonio Maíllo")] });
reg('rocio-de-meer', { nombre: "Rocío de Meer", ambito: 'politico', cargo: "Cabeza de lista de Vox por Almería", fuentes: [W("Rocío de Meer"), "Listas de Vox para el 29N (octubre de 2026): cabeza de lista por Almería"] });
reg('rita-maestre', { nombre: "Rita Maestre", ambito: 'politico', cargo: "Portavoz de Más Madrid en el Ayuntamiento", fuentes: [W("Rita Maestre")] });
reg('jose-antonio-fuster', { nombre: "José Antonio Fúster", ambito: 'politico', cargo: "Portavoz nacional de Vox", fuentes: [W("José Antonio Fúster")] });
reg('manuela-carmena', { nombre: "Manuela Carmena", ambito: 'politico', cargo: "Exalcaldesa de Madrid (2015-2019)", fuentes: [W("Manuela Carmena")] });
reg('hermann-tertsch', { nombre: "Hermann Tertsch", ambito: 'politico', cargo: "Eurodiputado de Vox (2019-2024)", fuentes: [W("Hermann Tertsch")] });
reg('pablo-bustinduy', { nombre: "Pablo Bustinduy", ambito: 'politico', cargo: "Ministro de Derechos Sociales", fuentes: [W("Pablo Bustinduy")] });
reg('hernandez-quero', { nombre: "Carlos Hernández Quero", ambito: 'politico', cargo: "Cabeza de lista de Vox por Málaga", fuentes: [W("Carlos Hernández Quero"), "Listas de Vox para el 29N (octubre de 2026): cabeza de lista por Málaga"] });
reg('sira-rego', { nombre: "Sira Rego", ambito: 'politico', cargo: "Ministra de Juventud e Infancia", fuentes: [W("Sira Rego")] });
reg('manuel-gavira', { nombre: "Manuel Gavira", ambito: 'politico', cargo: "Líder de Vox en Andalucía", fuentes: [W("Manuel Gavira")] });
reg('gerardo-pisarello', { nombre: "Gerardo Pisarello", ambito: 'politico', cargo: "Diputado de los Comuns", fuentes: [W("Gerardo Pisarello")] });
reg('carla-toscano', { nombre: "Carla Toscano", ambito: 'politico', cargo: "Diputada de Vox", fuentes: [W("Carla Toscano")] });
reg('jessica-albiach', { nombre: "Jéssica Albiach", ambito: 'politico', cargo: "Líder de los Comuns en el Parlament", fuentes: [W("Jéssica Albiach")] });
reg('ricardo-chamorro', { nombre: "Ricardo Chamorro", ambito: 'politico', cargo: "Diputado de Vox", fuentes: [W("Ricardo Chamorro")] });
reg('manuela-bergerot', { nombre: "Manuela Bergerot", ambito: 'politico', cargo: "Portavoz de Más Madrid en la Asamblea", fuentes: [W("Manuela Bergerot")] });
reg('ruben-manso', { nombre: "Rubén Manso", ambito: 'politico', cargo: "Diputado de Vox", fuentes: [W("Rubén Manso")] });
reg('enrique-santiago', { nombre: "Enrique Santiago", ambito: 'politico', cargo: "Secretario general del PCE", fuentes: [W("Enrique Santiago")] });
reg('patricia-rueda', { nombre: "Patricia Rueda", ambito: 'politico', cargo: "Diputada de Vox", fuentes: [W("Patricia Rueda")] });
reg('alberto-garzon', { nombre: "Alberto Garzón", ambito: 'politico', cargo: "Exministro de Consumo (2020-2023)", fuentes: [W("Alberto Garzón")] });
reg('jose-maria-figaredo', { nombre: "José María Figaredo", ambito: 'politico', cargo: "Cabeza de lista de Vox por Asturias", fuentes: [W("José María Figaredo"), "Listas de Vox para el 29N (octubre de 2026): cabeza de lista por Asturias"] });
reg('gaspar-llamazares', { nombre: "Gaspar Llamazares", ambito: 'politico', cargo: "Excoordinador general de IU (2000-2008)", fuentes: [W("Gaspar Llamazares")] });
reg('vicente-barrera', { nombre: "Vicente Barrera", ambito: 'politico', cargo: "Exvicepresidente de la Generalitat Valenciana (2023-2024)", fuentes: [W("Vicente Barrera")] });
reg('cayo-lara', { nombre: "Cayo Lara", ambito: 'politico', cargo: "Excoordinador general de IU (2008-2016)", fuentes: [W("Cayo Lara")] });
reg('juan-sergio-redondo', { nombre: "Juan Sergio Redondo", ambito: 'politico', cargo: "Portavoz de Vox en Ceuta", fuentes: [W("Juan Sergio Redondo"), "Listas de Vox para el 29N (octubre de 2026)"] });
reg('ione-belarra', { nombre: "Ione Belarra", ambito: 'politico', cargo: "Secretaria general de Podemos", fuentes: [W("Ione Belarra")] });
reg('pablo-iglesias', { nombre: "Pablo Iglesias", ambito: 'politico', cargo: "Fundador de Podemos y director de Canal Red", fuentes: [W("Pablo Iglesias"), "Discurso de la asamblea de Vistalegre (2014): «El cielo no se toma por consenso, se toma por asalto»"] });
reg('sanchez-serna', { nombre: "Javier Sánchez Serna", ambito: 'politico', cargo: "Diputado de Podemos", fuentes: [W("Javier Sánchez Serna")] });
reg('martina-velarde', { nombre: "Martina Velarde", ambito: 'politico', cargo: "Diputada de Podemos", fuentes: [W("Martina Velarde")] });
reg('isa-serra', { nombre: "Isa Serra", ambito: 'politico', cargo: "Eurodiputada de Podemos", fuentes: [W("Isa Serra")] });
reg('noemi-santana', { nombre: "Noemí Santana", ambito: 'politico', cargo: "Exconsejera de Derechos Sociales de Canarias (2019-2023)", fuentes: [W("Noemí Santana")] });
reg('pablo-fernandez-podemos', { nombre: "Pablo Fernández", ambito: 'politico', cargo: "Portavoz de Podemos", fuentes: [W("Pablo Fernández")] });
reg('alejandra-jacinto', { nombre: "Alejandra Jacinto", ambito: 'politico', cargo: "Exportavoz de Podemos en la Asamblea de Madrid (2021-2023)", fuentes: [W("Alejandra Jacinto")] });
reg('rafael-mayoral', { nombre: "Rafael Mayoral", ambito: 'politico', cargo: "Dirigente de Podemos", fuentes: [W("Rafael Mayoral")] });
reg('gabriel-rufian', { nombre: "Gabriel Rufián", ambito: 'politico', cargo: "Portavoz de ERC en el Congreso", fuentes: [W("Gabriel Rufián")] });
reg('oriol-junqueras', { nombre: "Oriol Junqueras", ambito: 'politico', cargo: "Presidente de ERC", fuentes: [W("Oriol Junqueras")] });
reg('pere-aragones', { nombre: "Pere Aragonès", ambito: 'politico', cargo: "Expresident de la Generalitat (2021-2024)", fuentes: [W("Pere Aragonès")] });
reg('marta-rovira', { nombre: "Marta Rovira", ambito: 'politico', cargo: "Dirigente de ERC", fuentes: [W("Marta Rovira")] });
reg('carles-puigdemont', { nombre: "Carles Puigdemont", ambito: 'politico', cargo: "Presidente de Junts", fuentes: [W("Carles Puigdemont")] });
reg('miriam-nogueras', { nombre: "Míriam Nogueras", ambito: 'politico', cargo: "Portavoz de Junts en el Congreso", fuentes: [W("Míriam Nogueras")] });
reg('jordi-turull', { nombre: "Jordi Turull", ambito: 'politico', cargo: "Secretario general de Junts", fuentes: [W("Jordi Turull")] });
reg('aitor-esteban', { nombre: "Aitor Esteban", ambito: 'politico', cargo: "Presidente del EBB del PNV", fuentes: [W("Aitor Esteban")] });
reg('imanol-pradales', { nombre: "Imanol Pradales", ambito: 'politico', cargo: "Lehendakari", fuentes: [W("Imanol Pradales")] });
reg('inigo-urkullu', { nombre: "Iñigo Urkullu", ambito: 'politico', cargo: "Exlehendakari (2012-2024)", fuentes: [W("Iñigo Urkullu")] });
reg('maribel-vaquero', { nombre: "Maribel Vaquero", ambito: 'politico', cargo: "Portavoz del PNV en el Congreso", fuentes: [W("Maribel Vaquero"), "EAJ-PNV: candidaturas al Congreso para el 29N (octubre de 2026)"] });
reg('mertxe-aizpurua', { nombre: "Mertxe Aizpurua", ambito: 'politico', cargo: "Portavoz de EH Bildu en el Congreso", fuentes: [W("Mertxe Aizpurua")] });
reg('pello-otxandiano', { nombre: "Pello Otxandiano", ambito: 'politico', cargo: "Candidato a lehendakari de EH Bildu (2024)", fuentes: [W("Pello Otxandiano")] });
reg('ana-ponton', { nombre: "Ana Pontón", ambito: 'politico', cargo: "Portavoz nacional del BNG", fuentes: [W("Ana Pontón")] });
reg('nestor-rego', { nombre: "Néstor Rego", ambito: 'politico', cargo: "Diputado del BNG", fuentes: [W("Néstor Rego")] });
reg('fernando-clavijo', { nombre: "Fernando Clavijo", ambito: 'politico', cargo: "Presidente de Canarias", fuentes: [W("Fernando Clavijo")] });
reg('cristina-valido', { nombre: "Cristina Valido", ambito: 'politico', cargo: "Diputada de Coalición Canaria", fuentes: [W("Cristina Valido")] });
reg('ana-oramas', { nombre: "Ana Oramas", ambito: 'politico', cargo: "Exdiputada de Coalición Canaria", fuentes: [W("Ana Oramas")] });
reg('alberto-catalan', { nombre: "Alberto Catalán", ambito: 'politico', cargo: "Diputado de UPN", fuentes: [W("Alberto Catalán")] });
reg('agueda-mico', { nombre: "Àgueda Micó", ambito: 'politico', cargo: "Diputada de Compromís", fuentes: [W("Àgueda Micó")] });
reg('joan-baldovi', { nombre: "Joan Baldoví", ambito: 'politico', cargo: "Síndic de Compromís en Les Corts", fuentes: [W("Joan Baldoví")] });
reg('tomas-guitarte', { nombre: "Tomás Guitarte", ambito: 'politico', cargo: "Exdiputado de Teruel Existe (2019-2023)", fuentes: [W("Tomás Guitarte")] });
reg('jose-ignacio-garcia', { nombre: "José Ignacio García", ambito: 'politico', cargo: "Portavoz de Adelante Andalucía en el Parlamento", fuentes: [W("José Ignacio García")] });
reg('teresa-rodriguez', { nombre: "Teresa Rodríguez", ambito: 'politico', cargo: "Exportavoz de Adelante Andalucía", fuentes: [W("Teresa Rodríguez")] });
reg('albert-rivera', { nombre: "Albert Rivera", ambito: 'politico', cargo: "Fundador de Ciudadanos", fuentes: [W("Albert Rivera")] });
reg('ines-arrimadas', { nombre: "Inés Arrimadas", ambito: 'politico', cargo: "Expresidenta de Ciudadanos (2020-2023)", fuentes: [W("Inés Arrimadas")] });
reg('begona-villacis', { nombre: "Begoña Villacís", ambito: 'politico', cargo: "Exvicealcaldesa de Madrid (2019-2023)", fuentes: [W("Begoña Villacís")] });
reg('edmundo-bal', { nombre: "Edmundo Bal", ambito: 'politico', cargo: "Exportavoz de Ciudadanos en el Congreso", fuentes: [W("Edmundo Bal")] });
reg('alvise-perez', { nombre: "Alvise Pérez", ambito: 'politico', cargo: "Eurodiputado de Se Acabó La Fiesta", fuentes: [W("Alvise Pérez")] });
reg('espinosa-monteros', { nombre: "Iván Espinosa de los Monteros", ambito: 'politico', cargo: "Exportavoz de Vox en el Congreso (2019-2023)", fuentes: [W("Iván Espinosa de los Monteros")] });
reg('rosa-diez', { nombre: "Rosa Díez", ambito: 'politico', cargo: "Fundadora de UPyD (antes, dirigente del PSOE)", fuentes: [W("Rosa Díez")] });
reg('toni-canto', { nombre: "Toni Cantó", ambito: 'politico', cargo: "Exdiputado de UPyD y de Ciudadanos", fuentes: [W("Toni Cantó")] });
reg('juan-carlos-girauta', { nombre: "Juan Carlos Girauta", ambito: 'politico', cargo: "Eurodiputado de Vox (antes, de Ciudadanos)", fuentes: [W("Juan Carlos Girauta")] });
reg('ramon-tamames', { nombre: "Ramón Tamames", ambito: 'politico', cargo: "Candidato de la moción de censura de 2023", fuentes: [W("Ramón Tamames")] });
reg('ferreras', { nombre: "Antonio García Ferreras", ambito: 'periodista', cargo: "Presentador de Al Rojo Vivo", fuentes: [W("Antonio García Ferreras"), "Trayectoria pública en medios de comunicación"] });
reg('ana-rosa', { nombre: "Ana Rosa Quintana", ambito: 'periodista', cargo: "Presentadora de Telecinco", fuentes: [W("Ana Rosa Quintana"), "Trayectoria pública en medios de comunicación"] });
reg('javier-ruiz', { nombre: "Javier Ruiz", ambito: 'periodista', cargo: "Periodista y presentador de RTVE", fuentes: [W("Javier Ruiz"), "Trayectoria pública en medios de comunicación"] });
reg('vicente-valles', { nombre: "Vicente Vallés", ambito: 'periodista', cargo: "Presentador de Antena 3 Noticias", fuentes: [W("Vicente Vallés"), "Trayectoria pública en medios de comunicación"] });
reg('jesus-cintora', { nombre: "Jesús Cintora", ambito: 'periodista', cargo: "Presentador de Malas lenguas", fuentes: [W("Jesús Cintora"), "Trayectoria pública en medios de comunicación"] });
reg('losantos', { nombre: "Federico Jiménez Losantos", ambito: 'periodista', cargo: "Director y presentador de esRadio", fuentes: [W("Federico Jiménez Losantos"), "Trayectoria pública en medios de comunicación"] });
reg('angels-barcelo', { nombre: "Àngels Barceló", ambito: 'periodista', cargo: "Directora de Hoy por hoy", fuentes: [W("Àngels Barceló"), "Trayectoria pública en medios de comunicación"] });
reg('carlos-herrera', { nombre: "Carlos Herrera", ambito: 'periodista', cargo: "Presentador de Herrera en COPE", fuentes: [W("Carlos Herrera"), "Trayectoria pública en medios de comunicación"] });
reg('sarah-santaolalla', { nombre: "Sarah Santaolalla", ambito: 'periodista', cargo: "Tertuliana y analista política", fuentes: [W("Sarah Santaolalla"), "Trayectoria pública en medios de comunicación"] });
reg('javier-negre', { nombre: "Javier Negre", ambito: 'periodista', cargo: "Periodista y director de un medio digital", fuentes: [W("Javier Negre"), "Trayectoria pública en medios de comunicación"] });
reg('antonio-maestre', { nombre: "Antonio Maestre", ambito: 'periodista', cargo: "Periodista y tertuliano", fuentes: [W("Antonio Maestre"), "Trayectoria pública en medios de comunicación"] });
reg('eduardo-inda', { nombre: "Eduardo Inda", ambito: 'periodista', cargo: "Director de OKDiario", fuentes: [W("Eduardo Inda"), "Trayectoria pública en medios de comunicación"] });
reg('elisa-beni', { nombre: "Elisa Beni", ambito: 'periodista', cargo: "Periodista y tertuliana", fuentes: [W("Elisa Beni"), "Trayectoria pública en medios de comunicación"] });
reg('isabel-san-sebastian', { nombre: "Isabel San Sebastián", ambito: 'periodista', cargo: "Periodista y escritora", fuentes: [W("Isabel San Sebastián"), "Trayectoria pública en medios de comunicación"] });
reg('ana-pardo-de-vera', { nombre: "Ana Pardo de Vera", ambito: 'periodista', cargo: "Periodista y tertuliana", fuentes: [W("Ana Pardo de Vera"), "Trayectoria pública en medios de comunicación"] });
reg('isabel-duran', { nombre: "Isabel Durán", ambito: 'periodista', cargo: "Periodista y tertuliana", fuentes: [W("Isabel Durán"), "Trayectoria pública en medios de comunicación"] });
reg('esther-palomera', { nombre: "Esther Palomera", ambito: 'periodista', cargo: "Periodista de elDiario.es", fuentes: [W("Esther Palomera"), "Trayectoria pública en medios de comunicación"] });
reg('francisco-marhuenda', { nombre: "Francisco Marhuenda", ambito: 'periodista', cargo: "Director de La Razón", fuentes: [W("Francisco Marhuenda"), "Trayectoria pública en medios de comunicación"] });
reg('ignacio-escolar', { nombre: "Ignacio Escolar", ambito: 'periodista', cargo: "Director de elDiario.es", fuentes: [W("Ignacio Escolar"), "Trayectoria pública en medios de comunicación"] });
reg('pedro-j-ramirez', { nombre: "Pedro J. Ramírez", ambito: 'periodista', cargo: "Director de El Español", fuentes: [W("Pedro J. Ramírez"), "Trayectoria pública en medios de comunicación"] });
reg('javier-aroca', { nombre: "Javier Aroca", ambito: 'periodista', cargo: "Tertuliano y escritor", fuentes: [W("Javier Aroca"), "Trayectoria pública en medios de comunicación"] });
reg('graciano-palomo', { nombre: "Graciano Palomo", ambito: 'periodista', cargo: "Periodista y tertuliano", fuentes: [W("Graciano Palomo"), "Trayectoria pública en medios de comunicación"] });
reg('jesus-marana', { nombre: "Jesús Maraña", ambito: 'periodista', cargo: "Director editorial de infoLibre", fuentes: [W("Jesús Maraña"), "Trayectoria pública en medios de comunicación"] });
reg('alfonso-rojo', { nombre: "Alfonso Rojo", ambito: 'periodista', cargo: "Director de Periodista Digital", fuentes: [W("Alfonso Rojo"), "Trayectoria pública en medios de comunicación"] });
reg('jordi-evole', { nombre: "Jordi Évole", ambito: 'periodista', cargo: "Periodista y presentador", fuentes: [W("Jordi Évole"), "Trayectoria pública en medios de comunicación"] });
reg('inaki-gabilondo', { nombre: "Iñaki Gabilondo", ambito: 'periodista', cargo: "Periodista", fuentes: [W("Iñaki Gabilondo"), "Trayectoria pública en medios de comunicación"] });
reg('susanna-griso', { nombre: "Susanna Griso", ambito: 'periodista', cargo: "Presentadora de Espejo Público", fuentes: [W("Susanna Griso"), "Trayectoria pública en medios de comunicación"] });
reg('lucia-mendez', { nombre: "Lucía Méndez", ambito: 'periodista', cargo: "Periodista de El Mundo", fuentes: [W("Lucía Méndez"), "Trayectoria pública en medios de comunicación"] });
reg('pepa-bueno', { nombre: "Pepa Bueno", ambito: 'periodista', cargo: "Periodista", fuentes: [W("Pepa Bueno"), "Trayectoria pública en medios de comunicación"] });
reg('fernando-savater', { nombre: "Fernando Savater", ambito: 'periodista', cargo: "Filósofo y columnista de The Objective", fuentes: [W("Fernando Savater"), "https://theobjective.com/cultura/2025-11-11/savater-presentacion-libro-mas-menos/"] });
reg('inaki-lopez', { nombre: "Iñaki López", ambito: 'periodista', cargo: "Presentador de laSexta Xplica", fuentes: [W("Iñaki López"), "Trayectoria pública en medios de comunicación"] });
reg('ivan-redondo', { nombre: "Iván Redondo", ambito: 'asesor', cargo: "Exjefe de gabinete de Pedro Sánchez (2018-2021)", fuentes: [W("Iván Redondo")] });
reg('miguel-angel-rodriguez', { nombre: "Miguel Ángel Rodríguez", ambito: 'asesor', cargo: "Jefe de gabinete de Isabel Díaz Ayuso", fuentes: [W("Miguel Ángel Rodríguez")] });
reg('belen-barreiro', { nombre: "Belén Barreiro", ambito: 'asesor', cargo: "Directora de 40dB", fuentes: [W("Belén Barreiro")] });
reg('jose-pablo-ferrandiz', { nombre: "José Pablo Ferrándiz", ambito: 'asesor', cargo: "Director de opinión pública de Ipsos", fuentes: [W("José Pablo Ferrándiz")] });
reg('gutierrez-rubi', { nombre: "Antoni Gutiérrez-Rubí", ambito: 'asesor', cargo: "Consultor de comunicación política", fuentes: [W("Antoni Gutiérrez-Rubí")] });
reg('veronica-fumanal', { nombre: "Verónica Fumanal", ambito: 'asesor', cargo: "Consultora de comunicación política", fuentes: [W("Verónica Fumanal")] });
reg('luis-arroyo', { nombre: "Luis Arroyo", ambito: 'asesor', cargo: "Consultor de comunicación política", fuentes: [W("Luis Arroyo")] });
reg('pablo-simon', { nombre: "Pablo Simón", ambito: 'asesor', cargo: "Politólogo", fuentes: [W("Pablo Simón")] });
reg('lluis-orriols', { nombre: "Lluís Orriols", ambito: 'asesor', cargo: "Politólogo", fuentes: [W("Lluís Orriols")] });
reg('jorge-galindo', { nombre: "Jorge Galindo", ambito: 'asesor', cargo: "Analista de políticas públicas", fuentes: [W("Jorge Galindo")] });
reg('kiko-llaneras', { nombre: "Kiko Llaneras", ambito: 'asesor', cargo: "Periodista de datos", fuentes: [W("Kiko Llaneras")] });
reg('carmen-lumbierres', { nombre: "Carmen Lumbierres", ambito: 'asesor', cargo: "Politóloga", fuentes: [W("Carmen Lumbierres")] });
reg('jaime-miquel', { nombre: "Jaime Miquel", ambito: 'asesor', cargo: "Analista electoral", fuentes: [W("Jaime Miquel")] });
reg('felipe-gonzalez', { nombre: "Felipe González", ambito: 'historico', cargo: "Presidente del Gobierno (1982-1996)", fuentes: [W("Felipe González"), "Lema del PSOE en las elecciones de 1982: «Por el cambio»"] });
reg('jose-maria-aznar', { nombre: "José María Aznar", ambito: 'historico', cargo: "Presidente del Gobierno (1996-2004)", fuentes: [W("José María Aznar"), "Declaraciones públicas de 2007 sobre la campaña de tráfico"] });
reg('zapatero', { nombre: "José Luis Rodríguez Zapatero", ambito: 'historico', cargo: "Presidente del Gobierno (2004-2011)", fuentes: [W("José Luis Rodríguez Zapatero"), "Declaraciones públicas de 2009: «La tierra no pertenece a nadie, salvo al viento»"] });
reg('mariano-rajoy', { nombre: "Mariano Rajoy", ambito: 'historico', cargo: "Presidente del Gobierno (2011-2018)", fuentes: [W("Mariano Rajoy"), "Declaraciones públicas de 2015: «Es el vecino el que elige al alcalde»"] });
reg('julio-anguita', { nombre: "Julio Anguita", ambito: 'historico', cargo: "Coordinador general de IU (1989-2000)", fuentes: [W("Julio Anguita"), "Lema asociado a su liderazgo en IU: «Programa, programa, programa»"], fallecido: true });
reg('esperanza-aguirre', { nombre: "Esperanza Aguirre", ambito: 'historico', cargo: "Presidenta de la Comunidad de Madrid (2003-2012)", fuentes: [W("Esperanza Aguirre")] });
reg('adolfo-suarez', { nombre: "Adolfo Suárez", ambito: 'historico', cargo: "Presidente del Gobierno (1976-1981)", fuentes: [W("Adolfo Suárez"), "Discurso televisado de 1977: «Puedo prometer y prometo»"], fallecido: true });
