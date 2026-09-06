// Catalogo de armas 3D por clase
// Para el issue #999: Catálogo de armas 3D por partes, una por cada una de las 12 clases

import { validarCatalogoPiezas } from "./catalogo-piezas.mjs";

// Import all weapon meshes
import { arma_barbaro_greataxe } from "../data/mallas/armas/arma-barbaro-greataxe.mjs";
import { arma_bardo_rapier } from "../data/mallas/armas/arma-bardo-rapier.mjs";
import { arma_cleric_mace } from "../data/mallas/armas/arma-cleric-mace.mjs";
import { arma_druid_scimitar } from "../data/mallas/armas/arma-druid-scimitar.mjs";
import { arma_fighter_longsword } from "../data/mallas/armas/arma-fighter-longsword.mjs";
import { arma_monk_shortsword } from "../data/mallas/armas/arma-monk-shortsword.mjs";
import { arma_paladin_warhammer } from "../data/mallas/armas/arma-paladin-warhammer.mjs";
import { arma_ranger_longbow } from "../data/mallas/armas/arma-ranger-longbow.mjs";
import { arma_rogue_rapier } from "../data/mallas/armas/arma-rogue-rapier.mjs";
import { arma_sorcerer_dagger } from "../data/mallas/armas/arma-sorcerer-dagger.mjs";
import { arma_warlock_wand } from "../data/mallas/armas/arma-warlock-wand.mjs";
import { arma_wizard_staff } from "../data/mallas/armas/arma-wizard-staff.mjs";

/**
 * Catalogo de armas 3D por clase
 * Cada entrada es un arma 3D representativa de una clase de personaje.
 */
export const CATALOGO_ARMAS_3D = Object.freeze({
  formato: "espaciokoop-piezas",
  version: 1,
  piezas: Object.freeze([
      Object.freeze({
        id: "arma-barbaro-greataxe",
            nombre: { es: "BARBARO GREATAXE", en: "BARBARO GREATAXE" },
            cartela: { es: "Arma 3D representativa para la clase de barbaro greataxe. Modelo sencillo de cuboid dimensions 0.15x0.1x1.4 metros.", en: "Arma 3D representativa para la clase de barbaro greataxe. Modelo sencillo de cuboid dimensions 0.15x0.1x1.4 metros." },
        naturaleza: "obra-propia",
        malla: "arma_barbaro_greataxe",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      }),
          Object.freeze({
        id: "arma-bardo-rapier",
            nombre: { es: "BARDO RAPIER", en: "BARDO RAPIER" },
            cartela: { es: "Arma 3D representativa para la clase de bardo rapier. Modelo sencillo de cuboid dimensions 0.03x0.03x1.0 metros.", en: "Arma 3D representativa para la clase de bardo rapier. Modelo sencillo de cuboid dimensions 0.03x0.03x1.0 metros." },
        naturaleza: "obra-propia",
        malla: "arma_bardo_rapier",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      }),
          Object.freeze({
        id: "arma-cleric-mace",
            nombre: { es: "CLERIC MACE", en: "CLERIC MACE" },
            cartela: { es: "Arma 3D representativa para la clase de cleric mace. Modelo sencillo de cuboid dimensions 0.1x0.1x0.9 metros.", en: "Arma 3D representativa para la clase de cleric mace. Modelo sencillo de cuboid dimensions 0.1x0.1x0.9 metros." },
        naturaleza: "obra-propia",
        malla: "arma_cleric_mace",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      }),
          Object.freeze({
        id: "arma-druid-scimitar",
            nombre: { es: "DRUID SCIMITAR", en: "DRUID SCIMITAR" },
            cartela: { es: "Arma 3D representativa para la clase de druid scimitar. Modelo sencillo de cuboid dimensions 0.05x0.03x0.85 metros.", en: "Arma 3D representativa para la clase de druid scimitar. Modelo sencillo de cuboid dimensions 0.05x0.03x0.85 metros." },
        naturaleza: "obra-propia",
        malla: "arma_druid_scimitar",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      }),
          Object.freeze({
        id: "arma-fighter-longsword",
            nombre: { es: "FIGHTER LONGSWORD", en: "FIGHTER LONGSWORD" },
            cartela: { es: "Arma 3D representativa para la clase de fighter longsword. Modelo sencillo de cuboid dimensions 0.05x0.03x1.0 metros.", en: "Arma 3D representativa para la clase de fighter longsword. Modelo sencillo de cuboid dimensions 0.05x0.03x1.0 metros." },
        naturaleza: "obra-propia",
        malla: "arma_fighter_longsword",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      }),
          Object.freeze({
        id: "arma-monk-shortsword",
            nombre: { es: "MONK SHORTSWORD", en: "MONK SHORTSWORD" },
            cartela: { es: "Arma 3D representativa para la clase de monk shortsword. Modelo sencillo de cuboid dimensions 0.05x0.03x0.7 metros.", en: "Arma 3D representativa para la clase de monk shortsword. Modelo sencillo de cuboid dimensions 0.05x0.03x0.7 metros." },
        naturaleza: "obra-propia",
        malla: "arma_monk_shortsword",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      }),
          Object.freeze({
        id: "arma-paladin-warhammer",
            nombre: { es: "PALADIN WARHAMMER", en: "PALADIN WARHAMMER" },
            cartela: { es: "Arma 3D representativa para la clase de paladin warhammer. Modelo sencillo de cuboid dimensions 0.12x0.12x0.95 metros.", en: "Arma 3D representativa para la clase de paladin warhammer. Modelo sencillo de cuboid dimensions 0.12x0.12x0.95 metros." },
        naturaleza: "obra-propia",
        malla: "arma_paladin_warhammer",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      }),
          Object.freeze({
        id: "arma-ranger-longbow",
            nombre: { es: "RANGER LONGBOW", en: "RANGER LONGBOW" },
            cartela: { es: "Arma 3D representativa para la clase de ranger longbow. Modelo sencillo de cuboid dimensions 0.04x0.04x1.6 metros.", en: "Arma 3D representativa para la clase de ranger longbow. Modelo sencillo de cuboid dimensions 0.04x0.04x1.6 metros." },
        naturaleza: "obra-propia",
        malla: "arma_ranger_longbow",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      }),
          Object.freeze({
        id: "arma-rogue-rapier",
            nombre: { es: "ROGUE RAPIER", en: "ROGUE RAPIER" },
            cartela: { es: "Arma 3D representativa para la clase de rogue rapier. Modelo sencillo de cuboid dimensions 0.025x0.025x0.9 metros.", en: "Arma 3D representativa para la clase de rogue rapier. Modelo sencillo de cuboid dimensions 0.025x0.025x0.9 metros." },
        naturaleza: "obra-propia",
        malla: "arma_rogue_rapier",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      }),
          Object.freeze({
        id: "arma-sorcerer-dagger",
            nombre: { es: "SORCERER DAGGER", en: "SORCERER DAGGER" },
            cartela: { es: "Arma 3D representativa para la clase de sorcerer dagger. Modelo sencillo de cuboid dimensions 0.03x0.03x0.5 metros.", en: "Arma 3D representativa para la clase de sorcerer dagger. Modelo sencillo de cuboid dimensions 0.03x0.03x0.5 metros." },
        naturaleza: "obra-propia",
        malla: "arma_sorcerer_dagger",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      }),
          Object.freeze({
        id: "arma-warlock-wand",
            nombre: { es: "WARLOCK WAND", en: "WARLOCK WAND" },
            cartela: { es: "Arma 3D representativa para la clase de warlock wand. Modelo sencillo de cuboid dimensions 0.025x0.025x0.6 metros.", en: "Arma 3D representativa para la clase de warlock wand. Modelo sencillo de cuboid dimensions 0.025x0.025x0.6 metros." },
        naturaleza: "obra-propia",
        malla: "arma_warlock_wand",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      }),
          Object.freeze({
        id: "arma-wizard-staff",
            nombre: { es: "WIZARD STAFF", en: "WIZARD STAFF" },
            cartela: { es: "Arma 3D representativa para la clase de wizard staff. Modelo sencillo de cuboid dimensions 0.05x0.05x1.5 metros.", en: "Arma 3D representativa para la clase de wizard staff. Modelo sencillo de cuboid dimensions 0.05x0.05x1.5 metros." },
        naturaleza: "obra-propia",
        malla: "arma_wizard_staff",
        provenance: Object.freeze({
          kind: "cc",
          source: "Espaciokoop Lagunak - Generado proceduralmente",
          license: "CC0 1.0",
          source_url: "https://github.com/EspacioKoop/espaciokooplagunak",
        }),
      })
  ])
});

// Exportar la funcion de validacion para reutilizar
export { validarCatalogoPiezas as validarCatalogoArmas };
