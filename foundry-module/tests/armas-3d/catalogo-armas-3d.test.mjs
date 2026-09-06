import assert from "node:assert/strict";
import test from "node:test";

import { 
  CATALOGO_ARMAS_3D,
  validarCatalogoArmas as validarCatalogoPiezas
} from "../../scripts/catalogo-armas-3d.mjs";

test("Catalogo de armas 3D por clase: estructura básica", () => {
  assert.ok(CATALOGO_ARMAS_3D);
  assert.strictEqual(CATALOGO_ARMAS_3D.formato, "espaciokoop-piezas");
  assert.strictEqual(CATALOGO_ARMAS_3D.version, 1);
  assert.ok(Array.isArray(CATALOGO_ARMAS_3D.piezas));
  assert.strictEqual(CATALOGO_ARMAS_3D.piezas.length, 12); // 12 clases
});

test("Catalogo de armas 3D por clase: validación del catalogo", () => {
  // This should not throw if the catalog is valid
  assert.doesNotThrow(() => {
    validarCatalogoPiezas(CATALOGO_ARMAS_3D);
  });
});

test("Catalogo de armas 3D por clase: cada pieza tiene id único", () => {
  const ids = new Set();
  for (const pieza of CATALOGO_ARMAS_3D.piezas) {
    assert.ok(!ids.has(pieza.id), `ID duplicado: ${pieza.id}`);
    ids.add(pieza.id);
    assert.ok(pieza.id.startsWith("arma-"), `ID debe comenzar con 'arma-': ${pieza.id}`);
  }
  assert.strictEqual(ids.size, 12);
});

test("Catalogo de armas 3D por clase: cada pieza tiene malla definida", () => {
  for (const pieza of CATALOGO_ARMAS_3D.piezas) {
    assert.ok(pieza.malla, `Pieza ${pieza.id} debe tener propiedad malla`);
    assert.ok(typeof pieza.malla === "string", `Malla debe ser string: ${pieza.malla}`);
  }
});

test("Catalogo de armas 3D por clase: cada pieza tiene provenance con licencia CC0", () => {
  for (const pieza of CATALOGO_ARMAS_3D.piezas) {
    assert.ok(pieza.provenance, `Pieza ${pieza.id} debe tener provenance`);
    assert.strictEqual(pieza.provenance.kind, "cc", `Provenance kind debe ser 'cc' para ${pieza.id}`);
    assert.strictEqual(pieza.provenance.license, "CC0 1.0", `Provenance license debe ser 'CC0 1.0' para ${pieza.id}`);
    assert.ok(pieza.provenance.source_url, `Provenance debe tener source_url para ${pieza.id}`);
  }
});

test("Catalogo de armas 3D por clase: cobertura de las 12 clases esperadas", () => {
  const expectedClasses = [
    "barbaro-greataxe",
    "bardo-rapier",
    "cleric-mace",
    "druid-scimitar",
    "fighter-longsword",
    "monk-shortsword",
    "paladin-warhammer",
    "ranger-longbow",
    "rogue-rapier",
    "sorcerer-dagger",
    "warlock-wand",
    "wizard-staff"
  ];
  
  const ids = new Set(CATALOGO_ARMAS_3D.piezas.map(p => p.id));
  for (const expected of expectedClasses) {
    const expectedId = `arma-${expected}`;
    assert.ok(ids.has(expectedId), `Falta el ID esperado: ${expectedId}`);
  }
});
