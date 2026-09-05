// La arena de combate (#1013, #1020): 30 × 20 casillas de cinco pies.
//
// QUÉ ES. El sitio donde se mira si un combate en rejilla se puede JUGAR
// andando por dentro, y no solo desde arriba. Treinta por veinte casillas de
// 5 ft son 45,7 × 30,5 m: más grande que la playa entera, y esa medida es el
// contenido. Un tablero se dibuja de un vistazo; cruzarlo a pie tarda, y esa
// diferencia entre verlo y recorrerlo es justo lo que ninguna vista cenital
// puede enseñar.
//
// EL BORDE SE DECLARA, NO SE DISIMULA. Un exterior con un límite por el que no
// se pasa necesita que ese límite sea algo que el sitio ya tendría —arboleda en
// un claro, muros en una mazmorra—, y por eso el cierre es un DATO
// (`CIERRES`) y no un `if` dentro del compositor: cambiar de bosque a mazmorra
// es cambiar qué props se colocan y de qué color es el suelo, no tocar la
// escena. Una nube puesta solo para tapar el vacío sería un parche, y además no
// explicaría nada del lugar. La niebla del motor hace el resto, que es
// literalmente para lo que la PSX la usaba: que la geometría no aparezca de
// golpe en el borde.
//
// LA REJILLA NO SE PINTA EN EL SUELO. Es la regla de #526 en la superficie
// donde más fácil sería saltársela: unas líneas pintadas en la hierba serían
// una medida que el sitio no tiene, y quien anda por dentro no tiene cómo saber
// que esas líneas son de la interfaz y no del mundo. La rejilla existe —está en
// `combate-rejilla.mjs`, con sus casillas y sus rangos— y se enseña en la vista
// táctica, que es donde una medida sí es una lectura.
//
// LAS FIGURAS SON PLACEHOLDER Y LO DICEN. Los combatientes de esta arena son
// mallas escaneadas del catálogo del museo —el Doríforo, el Hércules Farnesio,
// la Venus de Melos y un jabalí—, teñidas por bando. Modelos de verdad, con su
// procedencia ya verificada, que nadie va a confundir con el arte final de un
// enemigo: es preferible a modelar un guerrero provisional que luego cueste
// tirar.
//
// TODAVÍA SIN POSE DE COMBATE. `estatua-rig.mjs` (#603 fase 4) dobla una malla
// que declare su `rig`, pero los PESOS por vértice los calcula
// `tools/pesar-despiezar.mjs`, que es una herramienta de construcción y no algo
// que el módulo pueda importar. Ponerlos aquí en caliente sería duplicar esa
// herramienta dentro del juego. Lo que falta es el paso de la fase 2: generar
// los pesos una vez y guardarlos como dato, igual que las mallas están
// guardadas en `data/mallas/`. Hasta entonces estas figuras están de pie, que es
// como salieron del escaneo — y decirlo aquí es preferible a que la cabecera
// prometa una pose que el código no hace.
//
// Puro y sin color propio (#351): los colores salen de `BOSQUE` y `MUSEO` en
// `paleta.mjs`.

import { BOSQUE, FACCIONES, MUSEO, PLAYA } from "./paleta.mjs";
import { caja } from "./escena-primitivas.mjs";
import { componerEscena, fundirEscenas, mezclar } from "./retro3d.mjs";
import { resolverCamara } from "./nave-camara.mjs";
import { poligonosOtrosJugadores } from "./nave-avatares-render.mjs";
import { crearPlanta } from "./nave-movimiento.mjs";
import { colocarProp, mezclarVocabularios } from "./nave-props.mjs";
import { VOCABULARIO_BOSQUE, VOCABULARIO_COSTA } from "./props-exteriores.mjs";
import { declararInteracciones } from "./nave-interaccion.mjs";
import { declararSol, franja, huellaDe } from "./escena-exteriores.mjs";
import { piezasHorizonte, texturasHorizonte } from "./horizonte-matte.mjs";
import { GRID_UNIT_FT } from "./pathfinding-core.mjs";
import { DORIFORO } from "../data/mallas/doriforo.mjs";
import { HERAKLES_FARNESE } from "../data/mallas/herakles-farnese.mjs";
import { VENUS_DE_MILO } from "../data/mallas/venus-de-milo.mjs";
import { JABALI } from "../data/mallas/jabali.mjs";

/* ---- la medida ------------------------------------------------------------- */

/** Un pie en metros. La casilla de 5 ft del core en la unidad de la escena. */
const METROS_POR_PIE = 0.3048;

/** El lado de una casilla, en metros: 5 ft = 1,524 m. */
export const LADO_CASILLA = GRID_UNIT_FT * METROS_POR_PIE;

export const CASILLAS_ANCHO = 30;
export const CASILLAS_FONDO = 20;

/** 45,72 × 30,48 m. La arena entera es jugable: no hay tablero dentro de otro. */
export const ANCHO = CASILLAS_ANCHO * LADO_CASILLA;
export const PROFUNDIDAD = CASILLAS_FONDO * LADO_CASILLA;

/** Cuánto claro sobra alrededor antes de que empiece el cierre. Poco: el borde
 *  tiene que estar donde se acaba la casilla treinta, no a diez metros. */
const MARGEN = LADO_CASILLA * 0.9;

/* ---- la luz ---------------------------------------------------------------- */

// Sol de tarde alto, no rasante como el de la playa: en una arena hay que ver
// las figuras y el suelo a la vez, y un sol bajo alarga las sombras hasta
// convertirlas en el dibujo principal.
const SOL = declararSol([0.55, 0.62, 0.38]);
const AMBIENTE_EXTERIOR = 0.78;
const ALCANCE = 420;
const ALCANCE_CIELO = 4000;
const TEXTURAS_MATTE = texturasHorizonte();

/* ---- los cierres ----------------------------------------------------------- */

/**
 * Cómo se cierra el borde, por ambiente.
 *
 * Cada cierre declara TRES cosas y ninguna es geometría: de qué color es el
 * suelo, qué props forman la linde y con qué densidad. El compositor no sabe
 * qué es un árbol ni qué es un muro — coloca lo que el cierre le diga, y por eso
 * añadir «cripta» o «ruinas» es escribir otra entrada aquí.
 */
export const CIERRES = Object.freeze({
  arboleda: Object.freeze({
    id: "arboleda",
    nombre: { es: "Claro de bosque", en: "Forest clearing" },
    suelo: BOSQUE.suelo,
    sueloAlterno: BOSQUE.sueloClaro,
    // Vertical alto que tapa, y sotobosque bajo que rompe el suelo entre medias.
    linde: Object.freeze(["arbol", "arbol", "arbol", "tocon", "helecho", "helecho"]),
    // Cada cuántos metros de perímetro cae una pieza. Dos filas: la de dentro
    // clarea y la de fuera se cierra, que es como se ve una linde de verdad.
    paso: 3.1,
    cielo: PLAYA.cielo,
  }),
  mazmorra: Object.freeze({
    id: "mazmorra",
    nombre: { es: "Sala de mazmorra", en: "Dungeon hall" },
    suelo: MUSEO.zocalo,
    sueloAlterno: MUSEO.muro,
    // Una mazmorra no tiene linde: tiene muro. Se declara igual —props en el
    // perímetro— y lo que cambia es que el prop es piedra y va pegado.
    linde: Object.freeze(["roca", "roca", "roca"]),
    paso: 2.2,
    cielo: MUSEO.muro,
  }),
});

const VOCABULARIO_ARENA = mezclarVocabularios(VOCABULARIO_BOSQUE, VOCABULARIO_COSTA);

/** El cierre por defecto. La arboleda porque es la que prueba lo difícil: tapar
 *  sin muro, con piezas sueltas y niebla. */
export const CIERRE_POR_DEFECTO = "arboleda";

export function cierreDe(id) {
  return CIERRES[id] ?? CIERRES[CIERRE_POR_DEFECTO];
}

/* ---- los combatientes ------------------------------------------------------ */

/**
 * Quién está en el tablero y en qué casilla.
 *
 * En CASILLAS y no en metros: es la unidad en la que se juega, y la que entiende
 * `combate-rejilla.mjs`. La escena la traduce a metros al colocar, que es la
 * única traducción que hace falta y ocurre en un solo sitio.
 */
export const COMBATIENTES = Object.freeze([
  Object.freeze({ id: "doriforo", malla: DORIFORO, bando: "aliado", x: 12, y: 8 }),
  Object.freeze({ id: "venus", malla: VENUS_DE_MILO, bando: "aliado", x: 10, y: 11 }),
  Object.freeze({ id: "herakles", malla: HERAKLES_FARNESE, bando: "enemigo", x: 19, y: 7 }),
  Object.freeze({ id: "jabali", malla: JABALI, bando: "bestia", x: 21, y: 12 }),
]);

/**
 * El tinte de cada bando: PIEDRA teñida, no el color de facción a pelo.
 *
 * Los colores de `FACCIONES` son acentos de interfaz —pensados para un punto de
 * radar de cuatro píxeles— y a tamaño de figura gritan: una estatua en azul puro
 * se lee como un icono, no como algo que está en el campo. Mezclada un tercio
 * hacia el yeso del museo se lee como una figura de piedra que ADEMÁS tiene
 * bando, que es lo que hace falta: distinguir de un vistazo sin que el tablero
 * parezca un menú.
 */
const COLOR_BANDO = Object.freeze({
  aliado: mezclar(MUSEO.yeso, FACCIONES[6], 0.42), // azul
  enemigo: mezclar(MUSEO.yeso, FACCIONES[5], 0.42), // rojo
  bestia: mezclar(MUSEO.yeso, FACCIONES[3], 0.42), // verde
});

/** La caja que ocupa una malla, para poder apoyarla en el suelo y medir su huella. */
function limitesDe(malla) {
  const xs = malla.vertices.map(([x]) => x);
  const ys = malla.vertices.map(([, y]) => y);
  const zs = malla.vertices.map(([, , z]) => z);
  return {
    x0: Math.min(...xs), x1: Math.max(...xs),
    y0: Math.min(...ys), y1: Math.max(...ys),
    z0: Math.min(...zs), z1: Math.max(...zs),
  };
}

/** El centro en metros de una casilla. */
function centroDeCasilla(x, y) {
  return [(x + 0.5) * LADO_CASILLA, (y + 0.5) * LADO_CASILLA];
}

function piezasCombatientes() {
  return COMBATIENTES.map((quien) => {
    const limites = limitesDe(quien.malla);
    const [cx, cz] = centroDeCasilla(quien.x, quien.y);
    const medioX = (limites.x0 + limites.x1) / 2;
    const medioZ = (limites.z0 + limites.z1) / 2;
    return {
      malla: {
        ...quien.malla,
        // Centrada en su casilla y apoyada en el suelo: una malla de escaneo
        // trae su propio origen, y darlo por bueno deja figuras flotando.
        vertices: quien.malla.vertices.map(([vx, vy, vz]) => [
          vx - medioX + cx,
          vy - limites.y0,
          vz - medioZ + cz,
        ]),
      },
      color: COLOR_BANDO[quien.bando] ?? COLOR_BANDO.enemigo,
    };
  });
}

/** La huella de cada figura, para no poder atravesarla al andar.
 *
 *  OJO A LA DISTINCIÓN: al ANDAR una figura es un obstáculo sólido; en la
 *  rejilla táctica es `ocupacion` y no obstáculo, porque se puede atravesar la
 *  casilla de un aliado (ver `combate-rejilla.mjs`). Son dos capas distintas
 *  respondiendo a dos preguntas distintas sobre la misma figura. */
function huellasCombatientes() {
  return COMBATIENTES.map((quien) => {
    const [cx, cz] = centroDeCasilla(quien.x, quien.y);
    const lado = LADO_CASILLA * 0.55;
    return { x: cx - lado / 2, z: cz - lado / 2, ancho: lado, profundidad: lado };
  });
}

/* ---- el suelo -------------------------------------------------------------- */

/**
 * El suelo, a franjas de una casilla de ancho y en dos tonos.
 *
 * DOS TONOS, PERO NO UNA REJILLA. Las franjas van en una sola dirección y miden
 * una casilla: dan escala —se ve cuánto es cinco pies sin que nadie lo diga— sin
 * dibujar una cuadrícula, que sería una medida pintada en la hierba. Es la misma
 * diferencia que hay entre las juntas del suelo de la nave y unas líneas guía,
 * que #552 prohíbe expresamente.
 */
function suelo(cierre) {
  const franjas = [];
  for (let i = 0; i < CASILLAS_FONDO; i += 1) {
    const z0 = i * LADO_CASILLA;
    franjas.push(
      franja({
        desde: -MARGEN,
        hasta: ANCHO + MARGEN,
        z0,
        z1: z0 + LADO_CASILLA,
        alto: 0,
        color: i % 2 === 0 ? cierre.suelo : cierre.sueloAlterno,
      }),
    );
  }
  return franjas;
}

/* ---- la linde -------------------------------------------------------------- */

/**
 * Coloca el cierre alrededor de la arena, en dos filas.
 *
 * La de dentro va justo en el borde jugable y clarea; la de fuera va un paso
 * más allá y se cierra. Dos filas y no una porque una sola deja ver el hueco
 * entre pieza y pieza en cuanto te acercas, y tres serían coste sin lectura: lo
 * que hay detrás de la segunda ya se lo come la niebla.
 */
function lindeAlrededor(cierre) {
  const piezas = [];
  const rng = (n) => {
    // Determinista y sin `Math.random()`: la misma arena tiene siempre la misma
    // linde, que es lo que permite que una prueba hable de ella.
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  let n = 0;
  const colocar = (x, z, dentroFuera) => {
    const clave = cierre.linde[Math.floor(rng(n) * cierre.linde.length) % cierre.linde.length];
    n += 1;
    // La fila de fuera solo lleva lo que TAPA: un helecho a un paso por detrás
    // de otro helecho no cierra nada.
    if (dentroFuera === "fuera" && (clave === "helecho" || clave === "tocon")) return;
    const cuartos = Math.floor(rng(n) * 4);
    n += 1;
    piezas.push(colocarProp(clave, { x, z, cuartos, nombre: `linde-${piezas.length}`, vocabulario: VOCABULARIO_ARENA }));
  };

  for (const [distancia, fila] of [[MARGEN * 0.55, "dentro"], [MARGEN * 0.55 + cierre.paso * 0.75, "fuera"]]) {
    const x0 = -distancia, x1 = ANCHO + distancia;
    const z0 = -distancia, z1 = PROFUNDIDAD + distancia;
    for (let x = x0; x <= x1; x += cierre.paso) {
      colocar(x, z0, fila);
      colocar(x, z1, fila);
    }
    for (let z = z0 + cierre.paso; z < z1; z += cierre.paso) {
      colocar(x0, z, fila);
      colocar(x1, z, fila);
    }
  }
  return piezas;
}

/* ---- la escena ------------------------------------------------------------- */

function piezasDe(cierre) {
  const linde = lindeAlrededor(cierre);
  const props = linde.flatMap(({ piezas }) =>
    piezas.map((pieza) => ({
      malla: pieza.malla ?? caja(pieza.centro, pieza.medidas),
      color: pieza.color,
      textura: pieza.textura ?? null,
    })),
  );
  return [...suelo(cierre), ...props, ...piezasCombatientes()];
}

const CACHE_PIEZAS = new Map();
function piezasCacheadas(cierre) {
  if (!CACHE_PIEZAS.has(cierre.id)) CACHE_PIEZAS.set(cierre.id, Object.freeze(piezasDe(cierre)));
  return CACHE_PIEZAS.get(cierre.id);
}

/** La huella de la linde, para que no se pueda andar a través de un árbol. */
function obstaculosDe(cierre) {
  return lindeAlrededor(cierre)
    .flatMap(({ piezas }) => huellaDe(piezas))
    // La linde está FUERA de la planta; solo interesan los rectángulos que
    // llegan a tocarla, que son los que de verdad frenan a alguien.
    .filter((rect) => rect.x + rect.ancho > 0 && rect.x < ANCHO && rect.z + rect.profundidad > 0 && rect.z < PROFUNDIDAD);
}

export const PLANTA_ARENA = crearPlanta({
  ancho: ANCHO,
  profundidad: PROFUNDIDAD,
  obstaculos: [...obstaculosDe(cierreDe(CIERRE_POR_DEFECTO)), ...huellasCombatientes()],
});

/** Se entra por el borde corto, mirando al fondo: lo primero que se ve es la
 *  arena entera a lo largo, que es la lectura que este nivel existe para dar. */
export const ENTRADA = Object.freeze({ x: ANCHO / 2, z: LADO_CASILLA * 0.8, yaw: 0 });

export const INTERACCIONES = declararInteracciones([
  {
    id: "salida-arena",
    punto: [ANCHO / 2, LADO_CASILLA * 0.4],
    orientacion: Math.PI,
    accion: { tipo: "estancia", estancia: "cantina" },
  },
]);

/**
 * Compone la arena vista desde `(x, z)` mirando a `yaw`.
 *
 * Misma firma que la `componer` de la playa y de `crearSalaCaja`, que es lo que
 * el bucle de andar espera.
 */
export function componerArena(x, y, z, yaw, opciones = {}) {
  const {
    ancho: anchoLienzo = 480,
    alto: altoLienzo = 270,
    epoca,
    fov = 62,
    otrosJugadores = [],
    modoCamara,
    avatarPropio = {},
    tiempo = 0,
    cierre: idCierre = CIERRE_POR_DEFECTO,
  } = opciones;
  const cierre = cierreDe(idCierre);
  const segundos = Number.isFinite(tiempo) ? tiempo / 1000 : 0;
  const { camara, dibujarPropio } = resolverCamara({ x, z, y, yaw, modo: modoCamara });
  const yawCamara = -yaw;

  // SIN LA CAPA DE COSTA. `piezasHorizonte` devuelve las tres del preset, y la
  // primera es una línea de mar: detrás de una arboleda eso es literalmente un
  // mar donde no lo hay. Un claro se cierra con sus propios árboles y con la
  // niebla, así que aquí solo entran las capas de nubes. El matte propio de esta
  // escena —cuatro planos por punto cardinal, renderizados y guardados como
  // hace `horizonte-preset.mjs`— es el paso siguiente, no un parche de color.
  const horizonte = piezasHorizonte({ camara, segundos, texturas: TEXTURAS_MATTE })
    .filter((capa) => capa.nombre !== "costa")
    .map((capa) => ({
    malla: capa.malla,
    color: cierre.cielo,
    emisivo: true,
    lejos: ALCANCE_CIELO,
    textura: capa.textura,
  }));

  const partes = [...horizonte, ...piezasCacheadas(cierre)].map(({ malla, color, emisivo, lejos, textura }) =>
    componerEscena(
      { ...malla, vertices: malla.vertices.map(([vx, vy, vz]) => [vx - camara[0], vy - camara[1], vz - camara[2]]) },
      {
        ancho: anchoLienzo,
        alto: altoLienzo,
        epoca,
        fov,
        color,
        posicion: [0, 0, 0],
        yaw: yawCamara,
        recorteLateral: true,
        luzFija: true,
        emisivo: emisivo === true,
        lejos: lejos ?? ALCANCE,
        textura: textura ?? null,
        ambiente: AMBIENTE_EXTERIOR,
        luz: SOL.direccion,
        fondo: cierre.cielo,
      },
    ),
  );

  // En tercera persona el propio cuerpo entra como un avatar más: el render de
  // presencia no sabe que uno de ellos eres tú.
  const cuerpos = dibujarPropio ? [...otrosJugadores, { x, y, z, yaw, avatar: avatarPropio }] : otrosJugadores;
  const poligonosJugadores = poligonosOtrosJugadores(cuerpos, {
    camara,
    yaw: yawCamara,
    ancho: anchoLienzo,
    alto: altoLienzo,
    epoca,
    fov,
  });

  const { poligonos } = fundirEscenas([...partes, poligonosJugadores]);
  return { ancho: anchoLienzo, alto: altoLienzo, epoca: partes[0]?.epoca, poligonos, estrellas: [] };
}
