// Avatares de la cantina (#423).
//
// Lo que se afirma aquí es lo que no se ve mirando un muñeco: que la licencia
// se respeta (nada de razas con marca registrada en el catálogo), que una
// descripción rota sigue apareciendo, y que la proporción es la del estilo —
// cabeza enorme, cuatro cabezas de alto— y no la de una figura realista.

import assert from "node:assert/strict";
import test from "node:test";

import {
  ALTO_BASE,
  CLASES,
  GESTOS,
  RAZAS,
  SILUETAS,
  SITIOS,
  anclasHumoDeLaGente,
  intensidadCalada,
  normalizarAvatar,
  piezasAvatar,
  piezasDeLaGente,
  avatarDesdeTexto,
} from "../scripts/cantina-avatar.mjs";

test("las doce clases del SRD 5.1 están, y solo esas", () => {
  // El SRD 5.1 está bajo CC-BY-4.0: las clases se pueden nombrar con
  // atribución. Doce, ni una inventada.
  assert.equal(CLASES.length, 12);
  for (const clase of ["paladin", "picaro", "mago", "monje"]) {
    assert.ok(CLASES.includes(clase), `falta ${clase}`);
  }
});

test("ninguna raza con marca registrada entra en el catálogo", () => {
  // Ésta es la prueba que protege el proyecto de verdad. Dragonborn, tiefling,
  // gnomo, semiorco y semielfo NO están en el SRD 5.1: no se nombran, ni
  // siquiera «por defecto». Quien juegue una escribe la suya en el campo libre.
  for (const prohibida of ["dragonborn", "draconido", "tiefling", "gnomo", "semiorco", "semielfo"]) {
    assert.ok(!RAZAS.includes(prohibida), `${prohibida} no está bajo CC-BY-4.0`);
  }
  assert.deepEqual(RAZAS, ["humano", "enano", "elfo", "mediano", "otra"]);
});

test("una descripción rota no impide aparecer", () => {
  // No aparecer es peor que aparecer raro: quien entra a la cantina tiene que
  // estar en la sala aunque su ficha esté a medias.
  const av = normalizarAvatar({ raza: "no-existe", clase: 7, silueta: null, pelo: "x" });
  assert.ok(RAZAS.includes(av.raza));
  assert.ok(CLASES.includes(av.clase));
  assert.ok(SILUETAS.includes(av.silueta));
  assert.equal(av.pelo, 0);
  assert.ok(piezasAvatar({}).length > 0);
  assert.ok(piezasAvatar(undefined).length > 0);
});

test("la proporción es la del estilo: cabeza enorme, no figura realista", () => {
  // Con pocos polígonos una figura estilizada se lee y una proporcionada se
  // deshace. La cabeza se lleva más de un quinto del alto total.
  const piezas = piezasAvatar({ raza: "humano" }, { pies: [0, 0, 0] });
  const cabeza = piezas.find((p) => p.nombre.endsWith("Cabeza"));
  assert.ok(cabeza.medidas[1] / ALTO_BASE > 0.2, "la cabeza es demasiado pequeña para el estilo");
});

test("la gramática PSX usa volúmenes estrechados, en octógono o en hueso", () => {
  // No todo es ya un único prisma vertical de dos anillos de ocho: brazos y
  // piernas son HUESOS (`hueso()`) entre dos puntos cualesquiera, con menos
  // lados y su propio par de anillos. La regla que importa —"ningún volumen
  // tiene lados paralelos", la que de verdad distingue un tronco de pirámide
  // de una caja— vale para las dos formas por igual, así que se comprueba de
  // forma genérica: dos anillos completos, cerrados, con radio distinto.
  const centroide = (puntos) => puntos.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]).map((v) => v / puntos.length);
  const radioMedio = (puntos, centro) => puntos.reduce((s, p) => s + Math.hypot(p[0] - centro[0], p[2] - centro[2]), 0) / puntos.length;

  const piezas = piezasAvatar({ raza: "humano", clase: "guerrero" }, { pies: [0, 0, 0] });
  for (const pieza of piezas) {
    assert.ok(pieza.malla, `${pieza.nombre} no tiene malla propia`);
    const n = pieza.malla.vertices.length;
    assert.ok(n % 2 === 0 && n >= 8, `${pieza.nombre} no son dos anillos completos de al menos cuatro lados`);
    assert.ok(pieza.malla.caras.length >= n / 2, `${pieza.nombre} no está cerrado`);
    const mitad = n / 2;
    const anilloA = pieza.malla.vertices.slice(0, mitad);
    const anilloB = pieza.malla.vertices.slice(mitad);
    const radioA = radioMedio(anilloA, centroide(anilloA));
    const radioB = radioMedio(anilloB, centroide(anilloB));
    assert.notEqual(radioA.toFixed(4), radioB.toFixed(4), `${pieza.nombre} conserva lados paralelos`);
  }
});

test("la raza rompe la silueta además de cambiar proporciones", () => {
  const nombres = (raza) => piezasAvatar({ raza }, { pies: [0, 0, 0] }).map((pieza) => pieza.nombre);
  assert.ok(nombres("enano").some((nombre) => nombre.endsWith("Barba")));
  assert.ok(nombres("elfo").some((nombre) => nombre.endsWith("OrejaIzq")));
  assert.ok(nombres("mediano").some((nombre) => nombre.endsWith("CabezaGrande")));
});

test("la raza cambia estatura y anchura, y nada más", () => {
  // Las piezas-hueso (brazos, piernas) no tienen `medidas` — su extensión
  // vertical hay que leerla de su propia malla, no del contrato de caja de
  // `piezaAvatar`.
  const altoDePieza = (p) => (p.medidas ? p.centro[1] + p.medidas[1] / 2 : Math.max(...p.malla.vertices.map((v) => v[1])));
  const alto = (raza) => {
    const piezas = piezasAvatar({ raza }, { pies: [0, 0, 0] });
    return Math.max(...piezas.map(altoDePieza));
  };
  assert.ok(alto("mediano") < alto("humano"), "el mediano no es más bajo");
  assert.ok(alto("elfo") > alto("humano"), "el elfo no es más alto");
  // Y el enano es más bajo pero más ancho: si solo encogiera, sería un niño.
  const enano = piezasAvatar({ raza: "enano" }, { pies: [0, 0, 0] });
  const humano = piezasAvatar({ raza: "humano" }, { pies: [0, 0, 0] });
  const torso = (piezas) => piezas.find((p) => p.nombre.endsWith("Torso")).medidas[0];
  assert.ok(torso(enano) > torso(humano), "el enano no es más ancho");
});

test("cada clase con distintivo lo lleva, y el monje no lleva nada", () => {
  for (const clase of ["paladin", "mago", "clerigo", "bardo", "picaro"]) {
    const piezas = piezasAvatar({ clase }, { pies: [0, 0, 0] });
    assert.ok(piezas.some((p) => p.nombre.endsWith("Distintivo")), `${clase} no lleva nada`);
  }
  // El monje va con las manos vacías, y eso también dice quién es.
  const monje = piezasAvatar({ clase: "monje" }, { pies: [0, 0, 0] });
  assert.ok(!monje.some((p) => p.nombre.endsWith("Distintivo")));
});

test("quien mira no se ve a sí mismo", () => {
  // La cámara está en sus ojos: solo vería su propia nuca.
  const solos = piezasDeLaGente([{ id: "yo" }], { omitirId: "yo" });
  assert.deepEqual(solos, []);
  assert.ok(piezasDeLaGente([{ id: "yo" }, { id: "otra" }], { omitirId: "yo" }).length > 0);
});

test("nadie se sienta encima de nadie, y sobra gente antes que sitios", () => {
  const gente = Array.from({ length: 20 }, (_, i) => ({ id: `p${i}` }));
  const piezas = piezasDeLaGente(gente);
  const cabezas = piezas.filter((p) => p.nombre.endsWith("Cabeza"));
  assert.equal(cabezas.length, SITIOS.length, "se han colocado más avatares que sitios");
  const sitios = new Set(cabezas.map((p) => `${p.centro[0]},${p.centro[2]}`));
  assert.equal(sitios.size, cabezas.length, "hay dos personas en el mismo sitio");
});

// Gestos de cuerpo (#423): estos avatares no tienen cara, así que el gesto vive
// en las manos — que además son la parte exagerada del estilo.
test("cada gesto cambia dónde están las manos", () => {
  const manos = (gesto) =>
    JSON.stringify(
      piezasAvatar({ gesto }, { pies: [0, 0, 0] })
        .filter((p) => p.nombre.includes("Mano"))
        .map((p) => p.centro),
    );
  const vistos = new Set(GESTOS.map(manos));
  assert.equal(vistos.size, GESTOS.length, "hay dos gestos con la misma postura");
});

test("brindar saca una jarra y fumar saca cigarro con brasa", () => {
  const nombres = (gesto) => piezasAvatar({ gesto }, { pies: [0, 0, 0] }).map((p) => p.nombre);
  assert.ok(nombres("brindis").some((n) => n.endsWith("Jarra")));
  const fumando = nombres("fumar");
  assert.ok(fumando.some((n) => n.endsWith("Cigarro")));
  // La brasa es un píxel y es lo único claro de una silueta que fuma en
  // penumbra: sin ella, el cigarro no se ve y el gesto no se lee.
  assert.ok(fumando.some((n) => n.endsWith("Brasa")));
});

// La punta encendida del cigarro (#439): sube de brillo en la calada y se
// apaga entre una y la siguiente, en vez de arder fija todo el rato.
test("la calada sube y baja, con pausas apagadas de por medio", () => {
  assert.equal(intensidadCalada(0, 0), 0, "empieza apagada");
  assert.ok(intensidadCalada(260, 0) > 0.9, "el pico de la calada está bien encendido");
  assert.equal(intensidadCalada(3000, 0), 0, "hay pausa apagada entre caladas");
  for (let ms = 0; ms < 5000; ms += 37) {
    const v = intensidadCalada(ms, 0);
    assert.ok(v >= 0 && v <= 1, `fuera de rango en ${ms}ms: ${v}`);
  }
});

test("la calada es determinista: el mismo instante da siempre el mismo brillo", () => {
  assert.equal(intensidadCalada(1234, 2), intensidadCalada(1234, 2));
});

test("dos fumadores no dan la calada a la vez", () => {
  // El desfase es por sitio (`indice`), no por reloj: si coincidiera, una sala
  // llena de fumadores parpadearía como un cartel, no como gente fumando.
  const puntos = new Set();
  for (let ms = 0; ms < 4200; ms += 50) {
    puntos.add(`${intensidadCalada(ms, 0).toFixed(3)}|${intensidadCalada(ms, 1).toFixed(3)}`);
  }
  const enSincronia = [...puntos].every((par) => {
    const [a, b] = par.split("|");
    return a === b;
  });
  assert.ok(!enSincronia, "dos sitios distintos están dando la calada exactamente a la vez");
});

test("el humo solo sale de quien fuma, y sigue el punto del cigarro", () => {
  const gente = [
    { id: "a", gesto: "fumar" },
    { id: "b", gesto: "brindis" },
    { id: "c", gesto: "fumar" },
  ];
  const anclas = anclasHumoDeLaGente(gente);
  assert.equal(anclas.length, 2, "solo dos de los tres fuman");
  for (const ancla of anclas) {
    assert.equal(ancla.tipo, "humo");
    assert.ok(ancla.largo > 0);
    assert.equal(ancla.punto.length, 3);
  }
});

test("quien mira no alimenta su propio humo", () => {
  const gente = [{ id: "yo", gesto: "fumar" }, { id: "otra", gesto: "fumar" }];
  const anclas = anclasHumoDeLaGente(gente, { omitirId: "yo" });
  assert.equal(anclas.length, 1);
});

test("un gesto que no existe deja a la persona quieta, no rota", () => {
  const raro = piezasAvatar({ gesto: "bailar-break" }, { pies: [0, 0, 0] });
  const quieto = piezasAvatar({ gesto: "quieto" }, { pies: [0, 0, 0] });
  assert.deepEqual(raro, quieto);
});

test("la cara es la misma para cualquier gesto — el gesto vive en las manos", () => {
  // Antes esto comprobaba que NO había cara (#423): sin ojos ni boca, por
  // legibilidad a esta resolución. "Rostro sin ser Minecraft" (#973) decidió
  // lo contrario — geometría real de cuenca+pupila, sombreada por la luz de la
  // escena en vez de un píxel fijo — así que la invariante que queda es la que
  // sigue importando: el REPERTORIO de gestos (`GESTOS`) sigue viviendo en las
  // manos, no en la cara. Un "brindis" no debería fruncir un ceño que un
  // "quieto" no frunce; eso sería un gesto de cara colándose por la puerta de
  // atrás.
  const caraDe = (piezas) => piezas.filter((p) => /Cuenca|Pupila|Ceja/.test(p.nombre));
  const referencia = caraDe(piezasAvatar({ gesto: "quieto" }, { pies: [0, 0, 0] }));
  for (const gesto of GESTOS) {
    const cara = caraDe(piezasAvatar({ gesto }, { pies: [0, 0, 0] }));
    assert.deepEqual(cara, referencia, `${gesto} ha cambiado la cara`);
  }
});

test("avatarDesdeTexto lee raza, clase y gesto en cualquier orden", () => {
  assert.deepEqual(avatarDesdeTexto("enano,mago,brindis"), { raza: "enano", clase: "mago", gesto: "brindis" });
  // El orden no importa: cada trozo se reconoce por a qué catálogo pertenece.
  assert.deepEqual(avatarDesdeTexto("brindis, MAGO ,enano"), { raza: "enano", clase: "mago", gesto: "brindis" });
});

test("avatarDesdeTexto ignora lo que no reconoce en vez de reventar", () => {
  // Lee de una URL escrita a mano: una errata tiene que degradar al avatar
  // genérico, no tirar la escena entera.
  assert.deepEqual(avatarDesdeTexto("dragonborn,ninja"), {});
  assert.deepEqual(avatarDesdeTexto(""), {});
  assert.deepEqual(avatarDesdeTexto(null), {});
  assert.deepEqual(avatarDesdeTexto(undefined), {});
});

test("avatarDesdeTexto toma un número suelto como color de ropa", () => {
  assert.deepEqual(avatarDesdeTexto("elfo,3"), { raza: "elfo", ropa: 3 });
});

test("lo que sale de avatarDesdeTexto lo entiende normalizarAvatar", () => {
  // La pareja tiene que cerrar: si el parseador emitiera una clave que el
  // normalizador no conoce, el avatar saldría por defecto sin que nadie avise.
  const av = normalizarAvatar(avatarDesdeTexto("mediano,picaro,fumar"));
  assert.equal(av.raza, "mediano");
  assert.equal(av.clase, "picaro");
  assert.equal(av.gesto, "fumar");
});

test("cada clase rompe el contorno con una malla válida, o deliberadamente ninguna", () => {
  // El monje es el único caso "sin silueta", y es a propósito (ver la cabecera
  // de piezasSiluetaClase): su distintivo es no llevar nada encima.
  const SIN_SILUETA = new Set(["monje"]);
  for (const clase of CLASES) {
    const piezas = piezasAvatar({ raza: "humano", clase }, { pies: [0, 0, 0] });
    // Las piezas de silueta llevan el nombre "Capa"/"Tunica"/"Capucha"/etc.
    // pegado al prefijo del avatar; basta con que exista alguna para saber que
    // se coló la pieza y no solo el arma al hombro de distintivoDeClase.
    const deSilueta = piezas.filter((p) =>
      /Hombrera|Capa|Tunica|Capucha|Sombrero|Ala|Aureola/.test(p.nombre),
    );
    if (SIN_SILUETA.has(clase)) {
      assert.equal(deSilueta.length, 0, `${clase} no debería llevar pieza de silueta`);
      continue;
    }
    assert.ok(deSilueta.length > 0, `${clase} no rompe el contorno`);
    for (const pieza of deSilueta) {
      assert.ok(Array.isArray(pieza.malla?.vertices) && pieza.malla.vertices.length >= 4, `${clase}: malla sin vértices`);
      assert.ok(Array.isArray(pieza.malla?.caras) && pieza.malla.caras.length > 0, `${clase}: malla sin caras`);
      for (const v of pieza.malla.vertices) {
        assert.ok(v.every(Number.isFinite), `${clase}: vértice no finito en ${pieza.nombre}`);
      }
    }
  }
});

test("la silueta de clase se compone igual con cualquier raza", () => {
  // La raza decide la proporción, la clase el contorno: son capas
  // independientes, y una no debe reventar a la otra.
  for (const raza of RAZAS) {
    const piezas = piezasAvatar({ raza, clase: "mago" }, { pies: [0, 0, 0] });
    const sombrero = piezas.find((p) => p.nombre.includes("Sombrero"));
    assert.ok(sombrero, `mago-${raza}: falta el sombrero cónico`);
  }
});

test("hay dos piernas, no una, y cada una llega al suelo", () => {
  const piezas = piezasAvatar({ raza: "humano" }, { pies: [0, 0, 0] });
  const piernaIzq = piezas.filter((p) => p.nombre.includes("PiernaIzq"));
  const piernaDer = piezas.filter((p) => p.nombre.includes("PiernaDer"));
  assert.equal(piernaIzq.length, 2, "la pierna izquierda no tiene sus dos huesos");
  assert.equal(piernaDer.length, 2, "la pierna derecha no tiene sus dos huesos");
  // El hueso más bajo de cada pierna llega hasta los pies (y=0), no se queda flotando.
  for (const pierna of [piernaIzq, piernaDer]) {
    const yMinimo = Math.min(...pierna.flatMap((p) => p.malla.vertices.map((v) => v[1])));
    assert.ok(yMinimo < 0.05, "la pierna no llega al suelo");
  }
  // Y las dos piernas están separadas: no son la misma columna central de antes.
  const xIzq = piernaIzq[0].malla.vertices[0][0];
  const xDer = piernaDer[0].malla.vertices[0][0];
  assert.ok(xIzq < 0 && xDer > 0, "las piernas no están a los lados");
});

test("el brazo llega exactamente a donde está la mano de cada gesto", () => {
  for (const gesto of GESTOS) {
    const piezas = piezasAvatar({ gesto }, { pies: [0, 0, 0] });
    for (const lado of ["Izq", "Der"]) {
      const mano = piezas.find((p) => p.nombre === `avatar0Mano${lado}`);
      const brazoB = piezas.find((p) => p.nombre === `avatar0Brazo${lado}B`);
      assert.ok(mano && brazoB, `${gesto}: falta la mano o el antebrazo ${lado}`);
      // El segundo anillo del segundo hueso rodea la muñeca a `radioB`: su
      // CENTROIDE, no uno de sus vértices sueltos, es el que tiene que caer
      // sobre el centro de la mano — es el mismo punto por construcción.
      const anilloLejano = brazoB.malla.vertices.slice(brazoB.malla.vertices.length / 2);
      const centroide = anilloLejano.reduce((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]], [0, 0, 0]).map((v) => v / anilloLejano.length);
      const dist = Math.hypot(centroide[0] - mano.centro[0], centroide[1] - mano.centro[1], centroide[2] - mano.centro[2]);
      assert.ok(dist < 1e-6, `${gesto}: el brazo ${lado} no llega a la mano (dist=${dist})`);
    }
  }
});
