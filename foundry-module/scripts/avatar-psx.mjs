// Avatar PSX geometry: tapered volumes (frustums) per #974.
// Pure: no Foundry, no DOM, no network.

import { normalizarAvatar, CLASES, RAZAS, GESTOS, SILUETAS, CUERPO_POR_RAZA, SILUETA_ANCHO, ALTO_BASE, intensidadCalada } from "./cantina-avatar.mjs";
import { RETRATO, AVATAR, FACCIONES, PIXEL } from "./paleta.mjs";

/**
 * Generates a frustum (truncated pyramid) mesh from box-like parameters.
 * @param {Array<number>} centro - [x, y, z] center of the frustum.
 * @param {Array<number>} medidas - [width, height, depth] of the equivalent box.
 * @param {number} taper - fraction of top size relative to bottom (0 < taper <= 1).
 * @returns {{vertices: number[][], caras: number[][]}} mesh.
 */
function frustumFromBox(centro, medidas, taper = 0.6) {
  const [w, h, d] = medidas;
  const [cx, cy, cz] = centro;
  const wt = w * taper;
  const dt = d * taper;
  const hh = h / 2;

  // bottom y = cy - hh, top y = cy + hh
  const yb = cy - hh;
  const yt = cy + hh;

  // vertices: bottom 0-3, top 4-7
  // order: bottom: (-w/2, -d/2), (+w/2, -d/2), (+w/2, +d/2), (-w/2, +d/2)
  //        top: (-wt/2, -dt/2), (+wt/2, -dt/2), (+wt/2, +dt/2), (-wt/2, +dt/2)
  const vertices = [
    [cx - w / 2, yb, cz - d / 2], // 0
    [cx + w / 2, yb, cz - d / 2], // 1
    [cx + w / 2, yb, cz + d / 2], // 2
    [cx - w / 2, yb, cz + d / 2], // 3
    [cx - wt / 2, yt, cz - dt / 2], // 4
    [cx + wt / 2, yt, cz - dt / 2], // 5
    [cx + wt / 2, yt, cz + dt / 2], // 6
    [cx - wt / 2, yt, cz + dt / 2], // 7
  ];

  // faces: each face is array of vertex indices in CCW order when viewed from outside.
  const caras = [
    // bottom (0,1,2,3) normal -y
    [0, 1, 2, 3],
    // top (4,5,6,7) normal +y (note: order reversed for outward normal?)
    [4, 7, 6, 5], // because looking from top, CCW is 4->5->6->7? Let's trust later; we can adjust if lighting looks wrong.
    // side -x (0,4,7,3) normal -x
    [0, 3, 7, 4],
    // side +x (1,5,6,2) normal +x
    [1, 2, 6, 5],
    // side -z (0,1,5,4) normal -z
    [0, 4, 5, 1],
    // side +z (3,2,6,7) normal +z
    [3, 7, 6, 2],
  ];

  return { vertices, caras };
}

/**
 * Taper factor for each piece type. Adjust per piece to avoid right angles.
 */
const TAPER_POR_PIEZA = {
  Pierna: 0.5,
  Torso: 0.6,
  Cabeza: 0.7,
  Pelo: 0.8, // hair is a taper, less pronounced
  Mano: 0.6,
  Distintivo: 0.5,
  Jarra: 0.5,
  Brasa: 0.5, // smoke ember? actually Brasa is a small box, treat as frustum
  Cigarro: 0.5,
};

/**
 * Helper to create a frustum piece.
 * @param {string} nombre
 * @param {string} color
 * @param {Array<number>} centro
 * @param {Array<number>} medidas
 * @param {number|null} taperOverride - if null, use TAPER_POR_PIEZA[nombre] or default 0.6
 * @returns {{nombre:string, color:string, vertices:number[][], caras:number[][]}}
 */
function piezaFrustum(nombre, color, centro, medidas, taperOverride = null) {
  const taper = taperOverride ?? TAPER_POR_PIEZA[nombre] ?? 0.6;
  const { vertices, caras } = frustumFromBox(centro, medidas, taper);
  return { nombre, color, vertices, caras };
}

/**
 * Returns pieces of an avatar as PSX-style tapered meshes.
 * @param {object} descripcion - avatar description (raza, clase, gesto, etc.)
 * @param {{pies: [number,number,number], indice: number, tiempo: number}} options
 * @returns {Array<{nombre:string, color:string, vertices:number[][], caras:number[][]}>} pieces.
 */
export function piezasAvatarPSX(descripcion = {}, { pies = [0, 0, 0], indice = 0, tiempo = 0 } = {}) {
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

  const yPiernas = py + altoPiernas / 2;
  const yTorso = py + altoPiernas + altoTorso / 2;
  const yCabeza = py + altoPiernas + altoTorso + altoCabeza / 2;

  return [
    piezaFrustum(`${prefijo}Pierna`, piel, [px, yPiernas, pz], [0.3 * ancho, altoPiernas, 0.26]),
    piezaFrustum(`${prefijo}Torso`, ropa, [px, yTorso, pz], [0.46 * ancho, altoTorso, 0.3]),
    piezaFrustum(`${prefijo}Cabeza`, piel, [px, yCabeza, pz], [0.38 * ancho, altoCabeza, 0.36]),
    // El pelo es una tapa, no una peluca: a esta resolución basta para leerse.
    piezaFrustum(`${prefijo}Pelo`, pelo, [px, yCabeza + altoCabeza * 0.42, pz - 0.02], [0.42 * ancho, altoCabeza * 0.34, 0.4]),
    // Manos como guantes, a los lados y grandes: es la firma de aquel estilo y
    // además es lo único que deja ver a distancia qué está haciendo alguien.
    // Por eso el gesto vive en las manos y no en la cara.
    ...manosDelGestoPSX(av.gesto, { px, pz, yTorso, altoTorso, yCabeza, ancho, piel, prefijo, indice, tiempo }),
    // Y lo que lleva encima, que es lo que dice la clase de un vistazo.
    ...distintivoDeClasePSX(av.clase, { px, py: yTorso, pz, ancho, altoTorso, prefijo }),
  ];
}

/**
 * Dónde quedan las manos —y qué llevan— según el gesto, en formato PSX.
 * @param {string} gesto
 * @param {{px:number, pz:number, yTorso:number, altoTorso:number, yCabeza:number, ancho:number, piel:string, prefijo:string, indice:number, tiempo:number}} options
 * @returns {Array<{nombre:string, color:string, vertices:number[][], caras:number[][]}>} pieces.
 */
function manosDelGestoPSX(gesto, { px, pz, yTorso, altoTorso, yCabeza, ancho, piel, prefijo, indice = 0, tiempo = 0 }) {
  const mano = (lado, [dx, dy, dz], nombre = "Mano") => {
    const centro = [px + dx * ancho, dy, pz + dz];
    const medidas = [0.16, 0.16, 0.16];
    return piezaFrustum(`${prefijo}${nombre}${lado}`, piel, centro, medidas);
  };

  const reposo = yTorso - altoTorso * 0.2;

  switch (gesto) {
    // Una mano en alto. El saludo es el gesto que más se usa y por eso es el más
    // claro de leer: mano por encima del hombro y separada del cuerpo.
    case "saludo":
      return [
        mano("Izq", [-0.3, reposo, 0.06]),
        mano("Der", [0.42, yCabeza, 0.1]),
      ];
    // Brindis: la jarra en alto, hacia delante. Se brinda CON alguien, así que
    // el brazo va adelantado y no pegado al costado.
    case "brindis":
      return [
        mano("Izq", [-0.3, reposo, 0.06]),
        mano("Der", [0.34, yTorso + altoTorso * 0.35, 0.24]),
        piezaFrustum(`${prefijo}Jarra`, AVATAR.jarra, [px + 0.34 * ancho, yTorso + altoTorso * 0.55, pz + 0.24], [0.18, 0.24, 0.18]),
      ];
    // Fumar: la mano junto a la cara y el cigarro asomando. La brasa es un píxel
    // y es lo único claro de la silueta, que es exactamente cómo se ve a alguien
    // fumando en la penumbra.
    case "fumar": {
      const calada = intensidadCalada(tiempo, indice);
      return [
        mano("Izq", [-0.3, reposo, 0.06]),
        mano("Der", [0.26, yCabeza - 0.12, 0.22]),
        piezaFrustum(`${prefijo}Cigarro`, AVATAR.cigarro, [px + 0.26 * ancho, yCabeza - 0.06, pz + 0.3], [0.05, 0.05, 0.18]),
        piezaFrustum(`${prefijo}Brasa`, mezclar(AVATAR.brasa, AVATAR.brasaCalada, calada), [px + 0.26 * ancho, yCabeza - 0.06, pz + 0.3], [0.06, 0.06, 0.06]),
      ];
    }
    // Hombros: las dos manos abiertas hacia fuera y arriba. «Yo qué sé».
    case "hombros":
      return [
        mano("Izq", [-0.46, yTorso, 0.16]),
        mano("Der", [0.46, yTorso, 0.16]),
      ];
    // Pensar: una mano en la barbilla. En un juego de faroleo es el gesto más
    // útil de todos, porque dice «me lo estoy pensando» sin decir qué.
    case "pensar":
      return [
        mano("Izq", [-0.3, reposo, 0.06]),
        mano("Der", [0.12, yCabeza - 0.16, 0.26]),
      ];
    default:
      return [
        mano("Izq", [-0.3, reposo, 0.06]),
        mano("Der", [0.3, reposo, 0.06]),
      ];
  }
}

/**
 * El distintivo de la clase: una pieza, no un equipo completo. Lo que se busca
 * es reconocer a alguien al otro lado de la sala, no inventariar su mochila —y
 * a esta resolución dos cajas más ya son una mancha.
 * @param {string} clase
 * @param {{px:number, py:number, pz:number, ancho:number, altoTorso:number, prefijo:string}} options
 * @returns {Array<{nombre:string, color:string, vertices:number[][], caras:number[][]}>} pieces.
 */
function distintivoDeClasePSX(clase, { px, py, pz, ancho, altoTorso, prefijo }) {
  const alHombro = (color, medidas) => {
    const centro = [px + 0.34 * ancho, py + altoTorso * 0.35, pz - 0.16];
    return [piezaFrustum(`${prefijo}Distintivo`, color, centro, medidas)];
  };
  switch (clase) {
    // Armas al hombro: la silueta de un mandoble asomando por encima es
    // exactamente cómo se reconocía a un personaje en aquellos juegos.
    case "guerrero":
    case "paladin":
    case "barbaro":
      return alHombro(AVATAR.acero, [0.09, altoTorso * 1.5, 0.09]);
    case "picaro":
    case "explorador":
      return alHombro(AVATAR.acero, [0.07, altoTorso * 0.9, 0.07]);
    // Báculos y varas, más largos y de madera.
    case "mago":
    case "hechicero":
    case "brujo":
    case "druida":
      return alHombro(AVATAR.madera, [0.08, altoTorso * 1.8, 0.08]);
    case "clerigo":
      return alHombro(AVATAR.simbolo, [0.16, 0.22, 0.06]);
    case "bardo":
      return alHombro(AVATAR.madera, [0.28, altoTorso * 0.7, 0.1]);
    // El monje no lleva nada, y eso también es un distintivo.
    default:
      return [];
  }
}

/**
 * Mezcla dos colores. `t` a 0 devuelve el primero; a 1, el segundo.
 * Se mezcla en sRGB tal cual, sin pasar por lineal, porque es lo que hacía el
 * hardware de entonces: una mezcla «correcta» daría una transición distinta de
 * la que se está imitando.
 * @param {string} colorA
 * @param {string} colorB
 * @param {number} t
 * @returns {string}
 */
function mezclar(colorA, colorB, t) {
  const a = canales(colorA);
  const b = canales(colorB);
  // Sin los dos colores no hay mezcla posible: se devuelve el de partida en vez
  // de inventar uno, igual que hace `sombrar` con un color ilegible.
  if (!a || !b) return colorA;
  const k = acotar(t, 0, 1, 0);
  const hex = a
    .map((c, i) => Math.round(Math.max(0, Math.min(255, (c + (b[i] - c) * k) * 255)))
      .toString(16)
      .padStart(2, "0"))
    .join("");
  return `#${hex}`;
}

/**
 * Acota a un rango. `Math.min`/`Math.max` propagan `NaN` en silencio y el
 * resultado acaba en el lienzo como un `#NaNNaNNaN` o una focal infinita, muy
 * lejos de donde entró el valor malo.
 * @param {number} valor
 * @param {number} minimo
 * @param {number} maximo
 * @param {number} porDefecto
 * @returns {number}
 */
function acotar(valor, minimo, maximo, porDefecto) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return porDefecto;
  return Math.max(minimo, Math.min(maximo, n));
}

/**
 * Número finito o el de repuesto. Para lo que no tiene rango, como un ángulo.
 * @param {number} valor
 * @param {number} porDefecto
 * @returns {number}
 */
function finito(valor, porDefecto) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : porDefecto;
}

/**
 * Triple de números finitos. Vale para vértices y para posiciones, y admite que
 * no llegue nada: `posicion: null` reventaba con un `TypeError` al leer
 * `posicion[0]`, y un vértice con una coordenada mala contaminaba la escena
 * entera sin que nadie pudiera decir de dónde salió.
 * @param {Array<number>|null} valor
 * @param {Array<number>} porDefecto
 * @returns {Array<number>}
 */
function triple(valor, porDefecto) {
  if (!Array.isArray(valor)) return [...porDefecto];
  return [
    finito(valor[0], porDefecto[0]),
    finito(valor[1], porDefecto[1]),
    finito(valor[2], porDefecto[2]),
  ];
}

/**
 * Canales de color: convierte `#rrggbb` en [r, g, b] en rango [0,1].
 * @param {string} color
 * @returns {[number, number, number]|null}
 */
function canales(color) {
  if (typeof color !== "string") return null;
  // Remove # if present
  const hex = color.startsWith("#") ? color.slice(1) : color;
  if (hex.length !== 6) return null;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return [r, g, b];
}