// Avatares de la cantina (#423 sobre #362): quién está en la sala.
//
// ESTILO: FF7 ORIGINAL, Y NO ES NOSTALGIA. Aquellos muñecos eran cajas con
// manos como guantes y sin cara, y funcionaban por una razón técnica que aquí
// se repite igual: con pocos polígonos y sin texturas, una figura ESTILIZADA se
// lee y una realista se deshace. Proporción de unas cuatro cabezas —no ocho—,
// manos exageradas para que se vea qué hace, y ni ojos ni boca: la cara la pone
// quien mira. Intentar una figura proporcionada con doce cajas da un espantajo.
//
// LO QUE SE PUEDE USAR SIN PAGAR. Las clases salen del SRD 5.1, publicado bajo
// CC-BY-4.0: las doce están ahí y se pueden nombrar con atribución. Las RAZAS
// son otra historia — el SRD solo trae unas pocas, y las que faltan (dragonborn,
// tiefling, gnome, half-orc, half-elf) NO están bajo esa licencia. Aquí no se
// nombran: quien quiera una escribe la suya en el campo libre, y el catálogo
// ofrece solo lo licenciado más un genérico. Ver `reference_srd_5e_cc_by`.
//
// Puro: ni Foundry, ni DOM, ni red, ni reloj. Recibe una descripción y devuelve
// mallas; quien las pinta y quien las guarda viven fuera.
//
// Frontera de arte (#351): no declara ni un color.

import { AVATAR, FACCIONES, RETRATO } from "./paleta.mjs";
import { prisma } from "./escena-primitivas.mjs";
import { mezclar } from "./retro3d.mjs";

/**
 * Clases del SRD 5.1 (CC-BY-4.0). Se nombran por su clave y la traducción vive
 * en `lang/`, que es donde puede decirse en castellano sin pelearse con el
 * nombre propio en inglés de la licencia.
 */
export const CLASES = Object.freeze([
  "barbaro",
  "bardo",
  "clerigo",
  "druida",
  "guerrero",
  "monje",
  "paladin",
  "explorador",
  "picaro",
  "hechicero",
  "brujo",
  "mago",
]);

/**
 * Razas que SÍ podemos nombrar. El SRD 5.1 trae estas; las demás son marca
 * registrada y no entran en el catálogo, ni siquiera "por defecto". `otra` es
 * la salida honesta: quien juega una raza que no está escribe su nombre y el
 * avatar usa el cuerpo genérico.
 */
export const RAZAS = Object.freeze(["humano", "enano", "elfo", "mediano", "otra"]);

/**
 * Gestos de cuerpo. NO hay gestos de cara y no es un olvido: estos avatares no
 * tienen ojos ni boca —es lo que los hace legibles a esta resolución, como en
 * FF7— así que un guiño no tiene dónde ocurrir. Lo que sí tienen es cuerpo, y un
 * cuerpo dice mucho: alguien encogido de hombros, alguien brindando, alguien
 * dando una calada.
 *
 * Cada gesto es una POSTURA, no una animación: cambia dónde están las manos y
 * qué lleva encima, y el bucle de la sala lo pinta como pinta todo lo demás.
 * Animar interpolando entre posturas sería un motor de esqueletos, y esto son
 * seis volúmenes sencillos.
 */
export const GESTOS = Object.freeze(["quieto", "saludo", "brindis", "fumar", "hombros", "pensar"]);

/** Presencia, no género biológico: lo que cambia es la silueta, y hay tres
 * porque una silueta neutra es una opción de verdad y no un descarte. */
export const SILUETAS = Object.freeze(["ancha", "estrecha", "neutra"]);

/**
 * El peinado, combinable (de "Caras y Peinados PSX", sección 03): un
 * catálogo de tres ejes independientes en vez de doce mallas escritas a
 * mano — casquete (cobertura/altura), flequillo (qué cae sobre la frente) y
 * añadido (lo que sobresale o cuelga aparte). Se combinan libremente, así que
 * cuatro por cuatro por cinco dan muchas más siluetas que un catálogo plano,
 * por el mismo precio de piezas que ya paga `piezasSiluetaClase`.
 */
export const CORTES_PELO = Object.freeze(["rapado", "corto", "largo", "calvo"]);
export const FLEQUILLOS = Object.freeze(["ninguno", "recto", "lateral", "pico"]);
export const ANADIDOS_PELO = Object.freeze(["ninguno", "coleta", "mono", "melena", "cresta"]);

/** Vello facial, aparte del peinado: se combina libremente con cualquier
 * corte, y es distinto de la barba de raza del enano (rasgo fijo, no
 * elegible) — por eso lleva su propio nombre de pieza, `Vello`, y no
 * `Barba`. */
export const VELLOS = Object.freeze(["ninguno", "perilla", "corto", "largo"]);

/** Cuánto altera cada raza el cuerpo base. Solo estatura y anchura: el resto
 * es ropa y pelo, que se eligen aparte. Nada de rasgos "propios de raza", que
 * es por donde se cuela la caricatura. */
const CUERPO_POR_RAZA = Object.freeze({
  humano: { alto: 1, ancho: 1 },
  enano: { alto: 0.78, ancho: 1.25 },
  elfo: { alto: 1.06, ancho: 0.92 },
  mediano: { alto: 0.66, ancho: 0.95 },
  otra: { alto: 1, ancho: 1 },
});

const SILUETA_ANCHO = Object.freeze({ ancha: 1.18, estrecha: 0.88, neutra: 1 });

function volumenAvatar([ancho, alto, fondo], { radioAbajo = 0.46, radioArriba = 0.54 } = {}) {
  const radioX = ancho / 2;
  const radioZ = fondo / 2;
  return prisma([0, -alto / 2, 0], {
    radioAbajo: Math.min(radioX, radioZ) * radioAbajo,
    radioArriba: Math.min(radioX, radioZ) * radioArriba,
    alto,
    lados: 8,
    tapaAbajo: true,
  });
}

function piezaAvatar(nombre, color, centro, medidas, opciones) {
  return { nombre, color, centro, medidas, malla: volumenAvatar(medidas, opciones) };
}

/**
 * Un hueso de verdad: un tronco de pirámide entre dos puntos CUALESQUIERA,
 * no solo vertical. `volumenAvatar` sirve para piernas, torso y cabeza
 * porque esas piezas son verticales; un brazo no lo es —el codo se dobla
 * hacia delante, no hacia abajo— y necesita su propio eje.
 *
 * De "Brazos y Andar Corregidos": brazo y pierna dejan de ser cajas sueltas
 * flotando y pasan a ser HUESOS que conectan un punto con otro de verdad,
 * que es lo que hacía que antes parecieran cuerdas — sin masa de hombro, sin
 * grosor que cambie, sin ángulo real en el codo.
 *
 * CONTRATO DE COORDENADAS: igual que `volumenAvatar` (relativa a `[0, 0, 0]`,
 * y es quien la usa —el consumidor— quien la desplaza por `pieza.centro`), la
 * malla que devuelve esto es relativa a `a`, no a coordenadas de mundo. La
 * revisión de #1028 lo reprodujo con números: antes esta función anclaba los
 * dos anillos en `a` y `b` ya en mundo, y los tres consumidores volvían a
 * sumarles `pieza.centro` — un doble desplazamiento que separaba el brazo del
 * cuerpo. `a` cae siempre en el origen local (`[0,0,0]`); `b` es el vector
 * `b - a`. Quien llama tiene que poner `centro: a`, no el origen del miembro
 * entero (ver `miembro`, donde el segundo hueso usa `centro: codo`).
 */
function hueso(a, b, { radioA = 0.06, radioB = 0.05, lados = 6 } = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const largo = Math.hypot(dx, dy, dz) || 1e-6;
  const ejeZ = [dx / largo, dy / largo, dz / largo];
  // Base ortonormal perpendicular al hueso: cualquier vector no paralelo a
  // ejeZ sirve de referencia — se elige el eje mundial que menos se le parece.
  const ref = Math.abs(ejeZ[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const cruz = (u, v) => [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
  const normalizar = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; };
  const ejeX = normalizar(cruz(ref, ejeZ));
  const ejeY = cruz(ejeZ, ejeX);

  const anillo = (centro, radio) => {
    const puntos = [];
    for (let i = 0; i < lados; i += 1) {
      const ang = (i / lados) * Math.PI * 2;
      const c = Math.cos(ang), s = Math.sin(ang);
      puntos.push([
        centro[0] + (ejeX[0]*c + ejeY[0]*s) * radio,
        centro[1] + (ejeX[1]*c + ejeY[1]*s) * radio,
        centro[2] + (ejeX[2]*c + ejeY[2]*s) * radio,
      ]);
    }
    return puntos;
  };

  const vertices = [...anillo([0, 0, 0], radioA), ...anillo([dx, dy, dz], radioB)];
  const caras = [];
  for (let i = 0; i < lados; i += 1) {
    const j = (i + 1) % lados;
    caras.push([i, j, lados + j, lados + i]);
  }
  return { vertices, caras };
}

/**
 * El codo (o la rodilla) por cinemática inversa de dos huesos, entre un punto
 * fijo y un objetivo — SIN rig ni ángulos por postura: dado dónde está el
 * hombro y dónde tiene que llegar la mano, el codo cae solo donde toca.
 *
 * `hacia` es la dirección hacia la que se dobla la articulación —adelante
 * para un codo, adelante para una rodilla— y es lo único que hay que decidir
 * a mano: el resto es geometría (el triángulo hombro-codo-muñeca con esos
 * tres lados solo tiene una solución de cada lado del eje).
 */
function articulacion(origen, objetivo, largoA, largoB, hacia = [0, 0, 1]) {
  const dx = objetivo[0]-origen[0], dy = objetivo[1]-origen[1], dz = objetivo[2]-origen[2];
  let d = Math.hypot(dx, dy, dz) || 1e-6;
  // Un objetivo más lejos que el brazo entero, o más cerca que la diferencia
  // de sus dos huesos, no tiene triángulo posible: se acota al límite en vez
  // de devolver NaN, como haría un brazo estirado del todo o doblado del todo.
  const maximo = largoA + largoB - 1e-4;
  const minimo = Math.abs(largoA - largoB) + 1e-4;
  d = Math.max(minimo, Math.min(maximo, d));
  const ejeD = [dx/d, dy/d, dz/d];
  const a = (largoA*largoA - largoB*largoB + d*d) / (2*d);
  const h = Math.sqrt(Math.max(0, largoA*largoA - a*a));
  // La dirección del pliegue: `hacia` menos su componente a lo largo del
  // hueso principal, para que quede perpendicular de verdad.
  const proyeccion = hacia[0]*ejeD[0] + hacia[1]*ejeD[1] + hacia[2]*ejeD[2];
  let perp = [hacia[0]-ejeD[0]*proyeccion, hacia[1]-ejeD[1]*proyeccion, hacia[2]-ejeD[2]*proyeccion];
  const largoPerp = Math.hypot(...perp) || 1;
  perp = [perp[0]/largoPerp, perp[1]/largoPerp, perp[2]/largoPerp];
  return [
    origen[0] + ejeD[0]*a + perp[0]*h,
    origen[1] + ejeD[1]*a + perp[1]*h,
    origen[2] + ejeD[2]*a + perp[2]*h,
  ];
}

/** Un miembro de dos huesos —brazo o pierna— entre `origen` y `objetivo`,
 *  como dos piezas ya listas para el pintor. Cada tramo lleva su PROPIO
 *  extremo de partida como `centro` —`origen` para el primero, `codo` para
 *  el segundo—, porque la malla de `hueso()` es relativa a ese extremo y no
 *  a coordenadas de mundo (ver la cabecera de `hueso`): darle a los dos
 *  tramos el mismo `centro: origen` es justo el desplazamiento doble que la
 *  revisión de #1028 encontró. */
function miembro(nombre, color, origen, objetivo, largoA, largoB, { radioA, radioMedio, radioB, hacia }) {
  const codo = articulacion(origen, objetivo, largoA, largoB, hacia);
  return [
    { nombre: `${nombre}A`, color, centro: origen, medidas: null, malla: hueso(origen, codo, { radioA, radioB: radioMedio }) },
    { nombre: `${nombre}B`, color, centro: codo, medidas: null, malla: hueso(codo, objetivo, { radioA: radioMedio, radioB }) },
  ];
}

/** Alto total del avatar en unidades de sala, antes de la raza. Una persona
 * junto a una barra de 0.75: esto la deja mirando por encima de ella. */
export const ALTO_BASE = 1.72;

/** Normaliza una descripción venga de donde venga, sin rechazar nada: un avatar
 * mal descrito tiene que aparecer igual, porque no aparecer es peor que
 * aparecer raro. */
/**
 * Una descripción de avatar a partir de texto suelto: `"enano,mago,brindis"`.
 *
 * Vive AQUÍ y no en quien la llama porque las listas válidas están aquí: un
 * parseador que viva fuera tiene que importarlas o —peor— repetirlas, y una
 * copia de la lista de clases es como se acaba aceptando una clase que el
 * avatar no sabe dibujar.
 *
 * Orden libre, campos opcionales y sin distinguir mayúsculas: lo que no se
 * reconozca se ignora y `normalizarAvatar` pone su valor por defecto. No
 * revienta con basura a propósito — esto lee entrada de una URL o de una línea
 * escrita a mano, donde una errata es lo normal y quedarse en el avatar
 * genérico es una degradación aceptable.
 */
export function avatarDesdeTexto(texto) {
  const partes = String(texto ?? "")
    .split(",")
    .map((trozo) => trozo.trim().toLowerCase())
    .filter(Boolean);
  const avatar = {};
  for (const parte of partes) {
    if (RAZAS.includes(parte)) avatar.raza = parte;
    else if (CLASES.includes(parte)) avatar.clase = parte;
    else if (GESTOS.includes(parte)) avatar.gesto = parte;
    else if (CORTES_PELO.includes(parte)) avatar.corte = parte;
    else if (FLEQUILLOS.includes(parte)) avatar.flequillo = parte;
    else if (ANADIDOS_PELO.includes(parte)) avatar.anadido = parte;
    else if (VELLOS.includes(parte)) avatar.vello = parte;
    // Un número suelto es el color de ropa: es lo único del catálogo que no
    // tiene nombre, solo índice.
    else if (/^\d+$/.test(parte)) avatar.ropa = Number(parte);
  }
  return avatar;
}

export function normalizarAvatar(descripcion = {}) {
  const raza = RAZAS.includes(descripcion.raza) ? descripcion.raza : "humano";
  return {
    nombre: typeof descripcion.nombre === "string" ? descripcion.nombre : "",
    raza,
    clase: CLASES.includes(descripcion.clase) ? descripcion.clase : "guerrero",
    silueta: SILUETAS.includes(descripcion.silueta) ? descripcion.silueta : "neutra",
    pelo: indiceValido(descripcion.pelo, AVATAR.pelos.length),
    piel: indiceValido(descripcion.piel, RETRATO.cascos.length),
    ropa: indiceValido(descripcion.ropa, FACCIONES.length),
    gesto: GESTOS.includes(descripcion.gesto) ? descripcion.gesto : "quieto",
    corte: CORTES_PELO.includes(descripcion.corte) ? descripcion.corte : "corto",
    flequillo: FLEQUILLOS.includes(descripcion.flequillo) ? descripcion.flequillo : "ninguno",
    anadido: ANADIDOS_PELO.includes(descripcion.anadido) ? descripcion.anadido : "ninguno",
    vello: VELLOS.includes(descripcion.vello) ? descripcion.vello : "ninguno",
  };
}

function indiceValido(valor, cuantos) {
  const n = Number.parseInt(valor, 10);
  return Number.isFinite(n) ? ((n % cuantos) + cuantos) % cuantos : 0;
}

/**
 * Las piezas de un avatar, ya colocadas alrededor de `[x, y, z]` (los pies).
 * Devuelve la misma forma que los muebles de la sala —`{nombre, color, centro,
 * medidas}`— para que la escena no distinga a una persona de un taburete y no
 * haga falta ni un pintor nuevo ni una rama en `componerCantina`.
 */
export function piezasAvatar(descripcion, { pies = [0, 0, 0], indice = 0, tiempo = 0, mirada = null } = {}) {
  const av = normalizarAvatar(descripcion);
  const cuerpo = CUERPO_POR_RAZA[av.raza];
  const escala = ALTO_BASE * cuerpo.alto;
  const ancho = cuerpo.ancho * SILUETA_ANCHO[av.silueta];
  const [px, py, pz] = pies;

  const piel = RETRATO.cascos[av.piel];
  const pelo = AVATAR.pelos[av.pelo];
  const ropa = FACCIONES[av.ropa];
  const prefijo = `avatar${indice}`;

  // Cuatro cabezas de alto, repartidas: piernas, torso y una cabeza enorme.
  const altoCabeza = escala * 0.26;
  const altoTorso = escala * 0.36;
  const altoPiernas = escala - altoCabeza - altoTorso;

  const yCadera = py + altoPiernas;
  const yTorso = yCadera + altoTorso / 2;
  const yCabeza = yCadera + altoTorso + altoCabeza / 2;
  const yHombro = yCadera + altoTorso * 0.86;

  // Dos piernas, no una: "Brazos y Andar Corregidos" documenta con números el
  // mismo defecto que ya se veía a ojo en la arena — una sola pierna cónica
  // bajo el torso se lee como una peonza, no como alguien de pie. Cadera y
  // pie de cada lado, y el HUESO —no una caja recta— hace el resto: un 4 %
  // de holgura entre la suma de los dos tramos y la altura real es lo que le
  // da a la rodilla su flexión de reposo sin necesidad de declarar un ángulo.
  const anchoCadera = 0.22 * ancho;
  const anchoPie = 0.16 * ancho;
  const piernas = [-1, 1].flatMap((lado) =>
    miembro(`${prefijo}Pierna${lado < 0 ? "Izq" : "Der"}`, piel,
      [px + lado * anchoCadera, yCadera, pz],
      [px + lado * anchoPie, py, pz],
      altoPiernas * 0.56, altoPiernas * 0.49,
      { radioA: 0.15 * ancho, radioMedio: 0.1 * ancho, radioB: 0.07 * ancho, hacia: [0, 0, 1] },
    ),
  );

  const manos = manosDelGesto(av.gesto, { px, pz, yTorso, altoTorso, yCabeza, ancho, piel, prefijo, indice, tiempo });

  // El brazo llega exactamente a donde ya está la mano de cada gesto: ningún
  // gesto tiene que reescribirse en ángulos de hombro/codo (la tabla de
  // "Manos que Dicen Algo" es la referencia para el día que se necesiten
  // posturas nuevas), el hueso solo conecta el hombro con un punto que el
  // gesto ya sabía dónde poner.
  const largoBrazo = escala * 0.2, largoAntebrazo = escala * 0.17;
  const brazos = ["Izq", "Der"].flatMap((lado) => {
    const manoDeEsteLado = manos.find((p) => p.nombre === `${prefijo}Mano${lado}`);
    if (!manoDeEsteLado) return [];
    const signo = lado === "Izq" ? -1 : 1;
    // El hombro nace DENTRO del torso, no en su borde exterior: es el error 2
    // de "Brazos y Andar Corregidos", y sin corregirlo el brazo se lee como
    // un palo pegado al cuerpo en vez de como algo que nace del hombro.
    const hombro = [px + signo * 0.34 * ancho, yHombro, pz];
    return miembro(`${prefijo}Brazo${lado}`, ropa, hombro, manoDeEsteLado.centro, largoBrazo, largoAntebrazo,
      { radioA: 0.11 * ancho, radioMedio: 0.08 * ancho, radioB: 0.06 * ancho, hacia: [0, 0, 1] });
  });

  return [
    ...piernas,
    piezaAvatar(`${prefijo}Torso`, ropa, [px, yTorso, pz], [0.46 * ancho, altoTorso, 0.3], { radioAbajo: 0.58, radioArriba: 0.42 }),
    ...brazos,
    piezaAvatar(`${prefijo}Cabeza`, piel, [px, yCabeza, pz], [0.38 * ancho, altoCabeza, 0.36], { radioAbajo: 0.5, radioArriba: 0.7 }),
    // El peinado combinable: casquete + flequillo + añadido, más el vello
    // facial aparte — ver la cabecera de `piezasPelo`.
    ...piezasPelo(av, { px, pz, yCabeza, altoCabeza, ancho, color: pelo, prefijo }),
    ...rasgoDeRaza(av.raza, { px, pz, yCabeza, altoCabeza, ancho, piel, prefijo }),
    ...caraDeAvatar({ px, pz, yCabeza, altoCabeza, ancho, piel, prefijo, mirada }),
    // Manos como guantes, a los lados y grandes: es la firma de aquel estilo y
    // además es lo único que deja ver a distancia qué está haciendo alguien.
    // Por eso el gesto vive en las manos y no en la cara.
    ...manos,
    // Y lo que lleva encima, que es lo que dice la clase de un vistazo.
    ...distintivoDeClase(av.clase, { px, py: yTorso, pz, ancho, altoTorso, prefijo }),
    // Y lo que cambia el CONTORNO: capucha, capa, túnica — ver la cabecera de
    // `piezasSiluetaClase`.
    ...piezasSiluetaClase(av.clase, {
      px, pz, ancho, prefijo,
      yHombro: yTorso + altoTorso / 2,
      ySuelo: py,
      yCoronilla: yCabeza + altoCabeza / 2,
    }),
  ].map((pieza) => Object.freeze(pieza));
}

/** Dónde queda la punta del cigarro en el mundo, junto a la boca. Un único
 * sitio para esta cuenta: lo usa tanto la brasa (#439) como el humo que sube
 * desde ella, y escribirla dos veces es la forma segura de que un día
 * diverjan. */
function puntaDelCigarro({ px, pz, yCabeza, ancho }) {
  return [px + 0.26 * ancho, yCabeza - 0.06, pz + 0.4];
}

/**
 * Brillo de la brasa en `[0, 1]` para el instante `tiempoMs` (#439): una
 * calada es una subida y bajada breve —inhalar, ver el punto avivarse,
 * soltarlo— con una pausa larga detrás, no una respiración senoidal continua
 * que temblaría todo el rato y no leería como "dar una calada".
 *
 * `offset` desincroniza a cada fumador de los demás: es el `indice` de su
 * sitio, no un reloj propio, así que dos capturas del mismo instante siguen
 * dando el mismo resultado para la misma persona.
 */
export function intensidadCalada(tiempoMs = 0, offset = 0) {
  const ciclo = 4200; // una calada completa, de una pausa a la siguiente
  const pico = 520; // cuánto dura el propio tirón, al principio del ciclo
  const ms = Number.isFinite(tiempoMs) ? tiempoMs : 0;
  const desfase = (Number.isFinite(offset) ? offset : 0) * 733; // primo: sin resonancias entre sitios
  const fase = (((ms + desfase) % ciclo) + ciclo) % ciclo;
  if (fase > pico) return 0;
  return Math.sin((fase / pico) * Math.PI);
}

/**
 * Dónde caen las manos —y qué llevan— según el gesto. Un cigarro es una caja
 * clara junto a la cabeza; una jarra, una caja ámbar en alto. A esta resolución
 * eso basta: no hace falta modelar el humo del cigarro porque la sala ya tiene
 * humo, y quien fuma lo alimenta (ver `ANCLAS_AIRE` en `cantina-escena.mjs`).
 */
function manosDelGesto(gesto, { px, pz, yTorso, altoTorso, yCabeza, ancho, piel, prefijo, indice = 0, tiempo = 0 }) {
  // "Manos que Dicen Algo" (#975): la forma recomendada es la MANOPLA CON
  // PULGAR, no la cuña cerrada — el pulgar es lo que dice "esta mano puede
  // agarrar algo", y es la diferencia entre una mano y un guante sin dedos.
  // Sigue siendo UNA llamada a `mano()` por mano: el pulgar se cuelga solo,
  // así que ningún gesto de más abajo tiene que enterarse del cambio.
  const mano = (lado, [dx, dy, dz], nombre = "Mano") => {
    const centro = [px + dx * ancho, dy, pz + dz];
    const signo = lado === "Izq" ? -1 : 1;
    const principal = {
      nombre: `${prefijo}${nombre}${lado}`,
      color: piel,
      centro,
      medidas: [0.16, 0.16, 0.16],
      malla: volumenAvatar([0.16, 0.16, 0.16], { radioAbajo: 0.75, radioArriba: 0.5 }),
    };
    // El pulgar: más corto y más grueso, saliendo hacia el lado de dentro de
    // la mano — nunca hacia fuera, o parecería una segunda mano pegada.
    const pulgar = piezaAvatar(`${prefijo}Pulgar${lado}`, piel,
      [centro[0] - signo * 0.09 * ancho, centro[1] - 0.02, centro[2] + 0.04], [0.08, 0.09, 0.08], { radioAbajo: 0.6, radioArriba: 0.9 });
    return [principal, pulgar];
  };
  const reposo = yTorso - altoTorso * 0.2;

  switch (gesto) {
    // Una mano en alto. El saludo es el gesto que más se usa y por eso es el más
    // claro de leer: mano por encima del hombro y separada del cuerpo.
    case "saludo":
      return [...mano("Izq", [-0.3, reposo, 0.06]), ...mano("Der", [0.42, yCabeza, 0.1])];
    // Brindis: la jarra en alto, hacia delante. Se brinda CON alguien, así que
    // el brazo va adelantado y no pegado al costado.
    case "brindis":
      return [
        ...mano("Izq", [-0.3, reposo, 0.06]),
        ...mano("Der", [0.34, yTorso + altoTorso * 0.35, 0.24]),
        piezaAvatar(`${prefijo}Jarra`, AVATAR.jarra, [px + 0.34 * ancho, yTorso + altoTorso * 0.55, pz + 0.24], [0.18, 0.24, 0.18], { radioAbajo: 0.65, radioArriba: 0.8 }),
      ];
    // Fumar: la mano junto a la cara y el cigarro asomando. La brasa es un píxel
    // y es lo único claro de la silueta, que es exactamente cómo se ve a alguien
    // fumando en la penumbra.
    case "fumar": {
      // La brasa sube de brillo en la calada y se apaga entre una y la
      // siguiente (#439): cada avatar tira en un momento distinto —de ahí el
      // desfase por `indice`— porque una sala entera dando la calada a la vez
      // se lee como un parpadeo de escenario, no como gente fumando.
      const calada = intensidadCalada(tiempo, indice);
      return [
        ...mano("Izq", [-0.3, reposo, 0.06]),
        ...mano("Der", [0.26, yCabeza - 0.12, 0.22]),
        piezaAvatar(`${prefijo}Cigarro`, AVATAR.cigarro, [px + 0.26 * ancho, yCabeza - 0.06, pz + 0.3], [0.05, 0.05, 0.18], { radioAbajo: 0.8, radioArriba: 0.55 }),
        piezaAvatar(`${prefijo}Brasa`, mezclar(AVATAR.brasa, AVATAR.brasaCalada, calada), puntaDelCigarro({ px, pz, yCabeza, ancho }), [0.06, 0.06, 0.06], { radioAbajo: 0.8, radioArriba: 0.45 }),
      ];
    }
    // Hombros: las dos manos abiertas hacia fuera y arriba. «Yo qué sé».
    case "hombros":
      return [...mano("Izq", [-0.46, yTorso, 0.16]), ...mano("Der", [0.46, yTorso, 0.16])];
    // Pensar: una mano en la barbilla. En un juego de faroleo es el gesto más
    // útil de todos, porque dice «me lo estoy pensando» sin decir qué.
    case "pensar":
      return [...mano("Izq", [-0.3, reposo, 0.06]), ...mano("Der", [0.12, yCabeza - 0.16, 0.26])];
    default:
      return [...mano("Izq", [-0.3, reposo, 0.06]), ...mano("Der", [0.3, reposo, 0.06])];
  }
}

/**
 * La cara, con cuencas hundidas y una pupila que puede seguir a algo.
 *
 * De "Rostro sin ser Minecraft" (#973): geometría real —un hueco, no una
 * textura—, para que la sombra que lo delata salga de `intensidadCara` con la
 * luz de la escena, no de un píxel fijo. Es la opción de relieve mínimo, y no
 * la de textura con bisel horneado: dos o tres piezas más por avatar es barato
 * comparado con lo que cuesta que una cara se lea plana.
 *
 * `mirada` es de "Mirada Viva" (#974): un vector en [-1,1]×[-1,1] que mueve la
 * pupila DENTRO del hueco, con tope — nunca sale de la cuenca. Quién mira a
 * qué es una decisión de otro módulo (la política de "A qué miran los NPC"
 * necesita saber quién habla, qué se acaba de mover, si hay alarma — eso es
 * comportamiento, no geometría, y no vive aquí). Sin mirada explícita, los
 * ojos miran al frente — que es exactamente "a su tarea", la política por
 * defecto que esa exploración marcó como la que hace que la nave parezca un
 * sitio de trabajo y no una sala esperando al jugador.
 */
function caraDeAvatar({ px, pz, yCabeza, altoCabeza, ancho, piel, prefijo, mirada = null }) {
  const mx = Math.max(-1, Math.min(1, mirada?.x ?? 0));
  const my = Math.max(-1, Math.min(1, mirada?.y ?? 0));
  const yOjos = yCabeza + altoCabeza * 0.05;
  const zFrente = pz + 0.16 * 0.36; // la mitad del fondo de la cabeza: a ras de la cara
  const huecoColor = mezclar(piel, AVATAR.sombraCara, 0.42);

  const ojo = (lado) => {
    const cx = px + lado * 0.13 * ancho;
    // El hueco: una caja hundida, más ancha que alta — la sombra de su cara
    // superior es lo que dice "esto está hundido", y sale sola de la luz.
    const hueco = piezaAvatar(`${prefijo}Cuenca${lado > 0 ? "Der" : "Izq"}`, huecoColor,
      [cx, yOjos, zFrente - 0.015], [0.1 * ancho, altoCabeza * 0.14, 0.03], { radioAbajo: 0.9, radioArriba: 1 });
    // La pupila: pieza suelta, un pelo por delante del fondo del hueco, que se
    // desplaza dentro de los topes de la cuenca — la opción B de "Mirada Viva"
    // ("pieza suelta delante del hueco"): no recalcula la cabeza, solo se
    // mueve ella misma.
    const recorridoX = 0.045 * ancho;
    const recorridoY = altoCabeza * 0.05;
    const pupila = piezaAvatar(`${prefijo}Pupila${lado > 0 ? "Der" : "Izq"}`, AVATAR.ojo,
      [cx + mx * recorridoX, yOjos + my * recorridoY, zFrente + 0.01], [0.035 * ancho, altoCabeza * 0.07, 0.02], { radioAbajo: 1, radioArriba: 0.85 });
    return [hueco, pupila];
  };

  // Cejas: el único vehículo de expresión que existe hoy, dos cuñas fijas.
  // "Mirada Viva" las anima con tres números (dy/ang/asim); moverlas de
  // verdad es una decisión de comportamiento —de dónde sale la expresión de un
  // NPC— y no de esta pieza, que solo sabe dibujarlas quietas.
  const ceja = (lado) => piezaAvatar(`${prefijo}Ceja${lado > 0 ? "Der" : "Izq"}`, mezclar(piel, AVATAR.sombraCara, 0.55),
    [px + lado * 0.16 * ancho, yOjos + altoCabeza * 0.16, zFrente], [0.13 * ancho, altoCabeza * 0.045, 0.02], { radioAbajo: 1, radioArriba: 0.7 });

  return [...ojo(-1), ...ojo(1), ceja(-1), ceja(1)];
}

/**
 * El peinado, combinable: casquete + flequillo + añadido, más el vello
 * facial (aparte, porque se combina libremente con cualquiera de los tres).
 * De "Caras y Peinados PSX" sección 03: tres piezas pequeñas dan muchas más
 * siluetas que doce peinados escritos a mano, el mismo principio que ya usa
 * el catálogo de props — una entrada más, no una rama más. Sustituye a la
 * única tapa genérica que había antes.
 *
 * Reusa el mismo primitivo que el resto del avatar (`piezaAvatar`/`prisma`):
 * ningún peinado es geometría nueva, todos son troncos de pirámide en el
 * sitio y la proporción que toca — la misma disciplina que
 * `piezasSiluetaClase`.
 */
function piezasPelo({ corte, flequillo, anadido, vello }, { px, pz, yCabeza, altoCabeza, ancho, color, prefijo }) {
  const piezas = [];
  const yCoronilla = yCabeza + altoCabeza / 2;
  const zFrente = pz + 0.16 * 0.36;

  // El casquete: la tapa de siempre, con tres alturas — "largo" cubre más
  // cráneo, "rapado" casi no sobresale, y "calvo" no pone pieza ninguna.
  if (corte !== "calvo") {
    const alto = { rapado: altoCabeza * 0.14, corto: altoCabeza * 0.34, largo: altoCabeza * 0.48 }[corte];
    const bajada = { rapado: 0.46, corto: 0.42, largo: 0.34 }[corte];
    piezas.push(piezaAvatar(`${prefijo}Casquete`, color,
      [px, yCabeza + altoCabeza * bajada, pz - 0.02], [0.42 * ancho, alto, 0.4],
      { radioAbajo: 0.7, radioArriba: 0.45 }));
  }

  // El flequillo: una cuña sobre la frente, delante de la cara. No tiene
  // sentido sin casquete —sería pelo flotando— así que también se apaga con
  // "calvo".
  if (flequillo !== "ninguno" && corte !== "calvo") {
    const yFrente = yCabeza + altoCabeza * 0.14;
    if (flequillo === "recto") {
      piezas.push(piezaAvatar(`${prefijo}Flequillo`, color,
        [px, yFrente, zFrente], [0.36 * ancho, altoCabeza * 0.12, 0.1],
        { radioAbajo: 0.9, radioArriba: 0.6 }));
    } else if (flequillo === "lateral") {
      piezas.push(piezaAvatar(`${prefijo}Flequillo`, color,
        [px + 0.14 * ancho, yFrente, zFrente], [0.3 * ancho, altoCabeza * 0.14, 0.1],
        { radioAbajo: 0.95, radioArriba: 0.4 }));
    } else if (flequillo === "pico") {
      piezas.push(piezaAvatar(`${prefijo}Flequillo`, color,
        [px, yFrente + altoCabeza * 0.04, zFrente], [0.14 * ancho, altoCabeza * 0.18, 0.08],
        { radioAbajo: 0.2, radioArriba: 1 }));
    }
  }

  // El añadido: lo que cuelga o sobresale, aparte del casquete — cola,
  // moño, melena o cresta. Igual que el flequillo, no aplica sobre "calvo".
  if (corte !== "calvo") {
    if (anadido === "coleta") {
      piezas.push(piezaAvatar(`${prefijo}Coleta`, color,
        [px, yCoronilla - altoCabeza * 0.3, pz - 0.22 * ancho], [0.12 * ancho, altoCabeza * 0.6, 0.14],
        { radioAbajo: 0.35, radioArriba: 0.85 }));
    } else if (anadido === "mono") {
      piezas.push(piezaAvatar(`${prefijo}Mono`, color,
        [px, yCoronilla + altoCabeza * 0.08, pz], [0.16 * ancho, altoCabeza * 0.2, 0.16],
        { radioAbajo: 0.7, radioArriba: 0.35 }));
    } else if (anadido === "melena") {
      piezas.push(piezaAvatar(`${prefijo}Melena`, color,
        [px, yCabeza - altoCabeza * 0.5, pz - 0.2 * ancho], [0.4 * ancho, altoCabeza * 1.3, 0.12],
        { radioAbajo: 0.55, radioArriba: 0.9 }));
    } else if (anadido === "cresta") {
      piezas.push(piezaAvatar(`${prefijo}Cresta`, color,
        [px, yCoronilla + altoCabeza * 0.14, pz], [0.08 * ancho, altoCabeza * 0.3, 0.32],
        { radioAbajo: 0.4, radioArriba: 0.9 }));
    }
  }

  // El vello facial: independiente del peinado, junto a la mandíbula. Lleva
  // nombre `Vello` y no `Barba` para no chocar con el rasgo fijo de raza del
  // enano en `rasgoDeRaza` — las dos pueden coexistir sin pisarse.
  if (vello !== "ninguno") {
    const yMenton = yCabeza - altoCabeza * 0.42;
    if (vello === "perilla") {
      piezas.push(piezaAvatar(`${prefijo}Vello`, color,
        [px, yMenton - altoCabeza * 0.06, zFrente - 0.02], [0.12 * ancho, altoCabeza * 0.14, 0.08],
        { radioAbajo: 0.3, radioArriba: 0.8 }));
    } else if (vello === "corto") {
      piezas.push(piezaAvatar(`${prefijo}Vello`, color,
        [px, yMenton - altoCabeza * 0.05, zFrente - 0.02], [0.26 * ancho, altoCabeza * 0.22, 0.14],
        { radioAbajo: 0.4, radioArriba: 0.85 }));
    } else if (vello === "largo") {
      piezas.push(piezaAvatar(`${prefijo}Vello`, color,
        [px, yMenton - altoCabeza * 0.22, zFrente - 0.02], [0.24 * ancho, altoCabeza * 0.5, 0.2],
        { radioAbajo: 0.15, radioArriba: 0.75 }));
    }
  }

  return piezas;
}

function rasgoDeRaza(raza, { px, pz, yCabeza, altoCabeza, ancho, piel, prefijo }) {
  if (raza === "enano") {
    return [piezaAvatar(`${prefijo}Barba`, piel, [px, yCabeza - altoCabeza * 0.22, pz + 0.17], [0.24 * ancho, altoCabeza * 0.5, 0.2], { radioAbajo: 0.15, radioArriba: 0.75 })];
  }
  if (raza === "elfo") {
    return [
      piezaAvatar(`${prefijo}OrejaIzq`, piel, [px - 0.25 * ancho, yCabeza + altoCabeza * 0.06, pz], [0.2 * ancho, altoCabeza * 0.16, 0.1], { radioAbajo: 0.8, radioArriba: 0.05 }),
      piezaAvatar(`${prefijo}OrejaDer`, piel, [px + 0.25 * ancho, yCabeza + altoCabeza * 0.06, pz], [0.2 * ancho, altoCabeza * 0.16, 0.1], { radioAbajo: 0.8, radioArriba: 0.05 }),
    ];
  }
  if (raza === "mediano") {
    return [piezaAvatar(`${prefijo}CabezaGrande`, piel, [px, yCabeza + altoCabeza * 0.08, pz], [0.42 * ancho, altoCabeza * 0.25, 0.4], { radioAbajo: 0.65, radioArriba: 0.85 })];
  }
  return [];
}

/**
 * El distintivo de la clase: una pieza, no un equipo completo. Lo que se busca
 * es reconocer a alguien al otro lado de la sala, no inventariar su mochila —y
 * a esta resolución dos cajas más ya son una mancha.
 */
function distintivoDeClase(clase, { px, py, pz, ancho, altoTorso, prefijo }) {
  const alHombro = (color, medidas, opciones) => [piezaAvatar(`${prefijo}Distintivo`, color, [px + 0.34 * ancho, py + altoTorso * 0.35, pz - 0.16], medidas, opciones)];
  switch (clase) {
    // Armas al hombro: la silueta de un mandoble asomando por encima es
    // exactamente cómo se reconocía a un personaje en aquellos juegos.
    case "guerrero":
    case "paladin":
    case "barbaro":
      return alHombro(AVATAR.acero, [0.18, altoTorso * 1.5, 0.18], { radioAbajo: 0.7, radioArriba: 0.35 });
    case "picaro":
    case "explorador":
      return alHombro(AVATAR.acero, [0.14, altoTorso * 0.9, 0.14], { radioAbajo: 0.7, radioArriba: 0.35 });
    // Báculos y varas, más largos y de madera.
    case "mago":
    case "hechicero":
    case "brujo":
    case "druida":
      return alHombro(AVATAR.madera, [0.16, altoTorso * 1.8, 0.16], { radioAbajo: 0.7, radioArriba: 0.35 });
    case "clerigo":
      return alHombro(AVATAR.simbolo, [0.16, 0.22, 0.06], { radioAbajo: 0.7, radioArriba: 0.35 });
    case "bardo":
      return alHombro(AVATAR.madera, [0.28, altoTorso * 0.7, 0.1], { radioAbajo: 0.7, radioArriba: 0.35 });
    // El monje no lleva nada, y eso también es un distintivo.
    default:
      return [];
  }
}

/**
 * La silueta de la clase: lo que cambia el CONTORNO exterior, no un accesorio
 * que solo se ve de frente. Es la mitad que le faltaba a `distintivoDeClase`
 * —un arma al hombro identifica de cerca, una capucha en punta o una túnica
 * acampanada identifican incluso a contraluz, que es la prueba de fuego de una
 * silueta— y viene de la exploración "Gramática PSX del Avatar": tres reglas,
 * ningún ángulo recto (todo pieza es un tronco de pirámide, `radioAbajo` ≠
 * `radioArriba`), y la clase rompe el perfil en vez de decorar la superficie.
 *
 * Reusa el mismo primitivo que el resto del avatar (`piezaAvatar`/`prisma`) en
 * vez de mallas a mano: una capa es un tronco de pirámide muy plano (`fondo`
 * pequeño) que se ensancha hacia abajo, un sombrero cónico es uno normal boca
 * abajo. No hace falta geometría nueva, hace falta ponerla en el sitio que
 * toca.
 */
function piezasSiluetaClase(clase, { px, pz, ancho, prefijo, yHombro, ySuelo, yCoronilla }) {
  const pieza = (nombre, color, centro, medidas, opciones) => piezaAvatar(`${prefijo}${nombre}`, color, centro, medidas, opciones);

  // Dos cuñas en los hombros: MUY anchas por fuera, cerradas hacia el cuello.
  const hombreras = (color) => [
    pieza("HombreraIzq", color, [px - 0.4 * ancho, yHombro - 0.02, pz], [0.28 * ancho, 0.22, 0.26], { radioAbajo: 0.35, radioArriba: 1 }),
    pieza("HombreraDer", color, [px + 0.4 * ancho, yHombro - 0.02, pz], [0.28 * ancho, 0.22, 0.26], { radioAbajo: 0.35, radioArriba: 1 }),
  ];
  // Un dosel plano detrás de la espalda, ensanchándose hacia el suelo.
  const capa = (color, hasta) => {
    const yBase = ySuelo + (yHombro - ySuelo) * hasta;
    return [pieza("Capa", color, [px, (yHombro + yBase) / 2, pz - 0.18 * ancho], [0.62 * ancho, yHombro - yBase, 0.05], { radioAbajo: 1, radioArriba: 0.55 })];
  };
  // Un cono invertido (ancho arriba, cerrado abajo) desde el pecho hasta el
  // suelo: la falda acampanada de una túnica.
  const tunicaAcampanada = (color) => {
    const yCadera = yHombro - (yHombro - ySuelo) * 0.32;
    return [pieza("Tunica", color, [px, (yCadera + ySuelo) / 2, pz], [0.5 * ancho, yCadera - ySuelo, 0.42], { radioAbajo: 1, radioArriba: 0.42 })];
  };
  // Ancha en la base, cerrada en punta: un cono de verdad, no una tapa.
  const capucha = (color, grande) => {
    const alto = (yCoronilla - yHombro) * (grande ? 1.5 : 1.05);
    return [pieza("Capucha", color, [px, yHombro + alto / 2, pz - 0.05 * ancho], [0.4 * ancho, alto, 0.36], { radioAbajo: 1, radioArriba: 0.08 })];
  };
  // El mismo cono que la capucha, más esbelto y sin cuerpo debajo: el
  // sombrero puntiagudo de mago.
  const sombreroConico = (color) => {
    const alto = (yCoronilla - yHombro) * 1.4;
    return [pieza("Sombrero", color, [px, yCoronilla + alto * 0.15, pz], [0.5 * ancho, alto, 0.5], { radioAbajo: 1, radioArriba: 0.04 })];
  };
  // Un disco muy plano y ancho: el ala de un sombrero de bardo.
  const sombreroAla = (color) => [pieza("Ala", color, [px, yCoronilla + 0.02, pz], [0.62 * ancho, 0.03, 0.62], { radioAbajo: 0.92, radioArriba: 1 })];
  // Igual de plano pero dorado y por encima de la cabeza, sin tocarla: la
  // aureola del clérigo — no hay más disco vacío en todo el avatar.
  const aureola = () => [pieza("Aureola", AVATAR.simbolo, [px, yCoronilla + 0.1, pz], [0.34 * ancho, 0.02, 0.34], { radioAbajo: 0.96, radioArriba: 1 })];

  switch (clase) {
    case "guerrero":
      return hombreras(AVATAR.acero);
    case "paladin":
      return [...hombreras(AVATAR.acero), ...capa(AVATAR.capa, 0.06)];
    case "barbaro":
      // Pieles, no acero: mismo hueco en la silueta, otro material.
      return hombreras(AVATAR.cuero);
    case "picaro":
      return capucha(AVATAR.cuero, false);
    case "explorador":
      return [...capucha(AVATAR.cuero, false), ...capa(AVATAR.cuero, 0.42)];
    case "mago":
      return [...tunicaAcampanada(AVATAR.tunica), ...sombreroConico(AVATAR.tunica)];
    case "hechicero":
      return tunicaAcampanada(AVATAR.tunica);
    case "brujo":
      return [...tunicaAcampanada(AVATAR.tunicaOscura), ...capucha(AVATAR.tunicaOscura, true)];
    case "druida":
      return [...tunicaAcampanada(AVATAR.natural), ...hombreras(AVATAR.natural)];
    case "clerigo":
      return [...tunicaAcampanada(AVATAR.simbolo), ...aureola()];
    case "bardo":
      return [...capa(AVATAR.capa, 0.5), ...sombreroAla(AVATAR.capa)];
    // El monje no rompe el contorno —su distintivo es no llevar nada encima—,
    // igual que ya declaraba `distintivoDeClase`.
    default:
      return [];
  }
}

/**
 * Dónde se coloca cada quien en la cantina. Los sitios son fijos y en orden
 * estable: quien entra ocupa el primero libre y no baila de sitio entre
 * fotogramas, que es lo que convertiría a la tripulación en un parpadeo.
 *
 * Están de cara a la barra o de cara a las mesas, nunca mirando a cámara.
 */
export const SITIOS = Object.freeze([
  Object.freeze({ pies: [-2.4, -1.75, 2.4] }),
  Object.freeze({ pies: [-0.8, -1.75, 2.4] }),
  Object.freeze({ pies: [0.8, -1.75, 2.4] }),
  Object.freeze({ pies: [2.4, -1.75, 2.4] }),
  Object.freeze({ pies: [-3.6, -1.75, 4.6] }),
  Object.freeze({ pies: [3.9, -1.75, 3.2] }),
]);

/**
 * Empareja gente con sitio, en el mismo orden estable que usa el pintor. Vive
 * aparte porque tanto `piezasDeLaGente` como `anclasHumoDeLaGente` (#439)
 * necesitan saber quién se sienta dónde, y repetir el bucle en los dos sitios
 * es la forma segura de que un día se desincronicen.
 */
function gentePorSitio(gente, { omitirId = null } = {}) {
  if (!Array.isArray(gente)) return [];
  const asientos = [];
  let sitio = 0;
  for (const persona of gente) {
    if (!persona) continue;
    if (omitirId && persona.id === omitirId) continue;
    if (sitio >= SITIOS.length) break;
    asientos.push({ persona, pies: SITIOS[sitio].pies, indice: sitio });
    sitio += 1;
  }
  return asientos;
}

/**
 * Las piezas de toda la gente que hay en la sala.
 *
 * @param {Array<object>} gente descripciones de avatar, en orden estable.
 * @param {{omitirId?: string, tiempo?: number}} opciones `omitirId` es quien
 *   mira: no se pinta a sí mismo, porque la cámara está en sus ojos y solo
 *   vería su propia nuca. `tiempo` mueve la calada de quien fuma (#439).
 */
export function piezasDeLaGente(gente = [], { omitirId = null, tiempo = 0 } = {}) {
  const piezas = [];
  for (const { persona, pies, indice } of gentePorSitio(gente, { omitirId })) {
    piezas.push(...piezasAvatar(persona, { pies, indice, tiempo }));
  }
  return piezas;
}

/**
 * Dónde flota el humo de cada cigarro encendido, en el mismo formato que
 * `ANCLAS_AIRE` de `cantina-escena.mjs` — así el pintor no distingue el humo
 * de una persona del humo de la sala y no hace falta ni una rama nueva en
 * `pintarHumo` (#439). Solo fuma quien tiene el gesto `fumar`: el resto de la
 * gente no alimenta el aire.
 */
export function anclasHumoDeLaGente(gente = [], { omitirId = null } = {}) {
  const anclas = [];
  for (const { persona, pies, indice } of gentePorSitio(gente, { omitirId })) {
    const av = normalizarAvatar(persona);
    if (av.gesto !== "fumar") continue;
    const cuerpo = CUERPO_POR_RAZA[av.raza];
    const escala = ALTO_BASE * cuerpo.alto;
    const ancho = cuerpo.ancho * SILUETA_ANCHO[av.silueta];
    const altoCabeza = escala * 0.26;
    const altoTorso = escala * 0.36;
    const altoPiernas = escala - altoCabeza - altoTorso;
    const [px, py, pz] = pies;
    const yCabeza = py + altoPiernas + altoTorso + altoCabeza / 2;
    const [hx, hy, hz] = puntaDelCigarro({ px, pz, yCabeza, ancho });
    anclas.push(
      Object.freeze({ punto: [hx, hy, hz], tipo: "humo", largo: 1.4, indice }),
    );
  }
  return anclas;
}
