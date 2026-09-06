/**
 * Combat status overlay for tokens.
 * Manages ephemeral combat status indicators (herido, ventaja, concentraci�n rota, muerto)
 * using Foundry's token status icon system.
 */

import { codificarPngIndexado, pngADataUri, MAX_PALETA } from "./png-indexado.mjs";

/** Map of combat status to icon name and color. */
export const COMBAT_STATUS_ICONS = {
  herido: { name: "herido", color: "#ff0000" },
  ventaja: { name: "ventaja", color: "#ffff00" },
  concentraci: { name: "concentraci", color: "#0000ff" },
  muerto: { name: "muerto", color: "#000000" }
};

/**
 * Creates a solid color PNG image of the given size and color.
 * @param {number} width  Width in pixels.
 * @param {number} height Height in pixels.
 * @param {string} color  Hex color string (e.g., "#ff0000").
 * @returns {string} Data URI of the PNG image.
 */
function crearColorPNG(width, height, color) {
  // Parse hex color.
  const hex = color.replace(/^#/, "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Palette: index 0 = transparent, index 1 = color.
  // We need to provide RGB triplets for the palette.
  const palette = new Uint8Array([
    0, 0, 0,   // index 0: transparent (black, but alpha 0)
    r, g, b    // index 1: the actual color
  ]);
  
  // Create indices array: all pixels are index 1 (the color).
  const indices = new Uint8Array(width * height);
  indices.fill(1);
  
  // Encode as PNG using the existing functions.
  const bytes = codificarPngIndexado(width, height, indices, palette);
  return pngADataUri(bytes);
}

/**
 * Registers combat status icons with Foundry's TokenStatusEffect system.
 * This should be called once when the module initializes.
 */
export function registerCombatStatusIcons() {
  // Ensure Foundry's TokenStatusEffect is available.
  if (!game || !game.i18n || !TokenStatusEffect) {
    console.warn("[lagunak] Foundry API not ready for combat status icon registration.");
    return;
  }
  
  // For each status, create a placeholder icon and register it.
  for (const [status, { name, color }] of Object.entries(COMBAT_STATUS_ICONS)) {
    const iconID = `lagunak-combat-status-${name}`;
    // Check if already registered.
    if (game.i18n.localize(`TOKEN_STATUS_${iconID.toUpperCase()}`)) {
      // Already registered.
      continue;
    }
    // Create a simple PNG icon.
    const iconPNG = crearColorPNG(24, 24, color);
    // Register the icon.
    TokenStatusEffect.registerIcon(iconID, {
      name: game.i18n.localize ? game.i18n.format(`LAGUNAK.CombatStatus.${name}.Name`, {}) : name,
      src: iconPNG,
      path: `modules/espaciokoop-lagunak/assets/status-icons/${name}.png`
    });
  }
}

/**
 * Applies a combat status to a token by adding the corresponding status icon.
 * @param {Token} token  The Token object to update.
 * @param {string|null} status  The combat status to apply, or null to clear.
 */
export function setTokenCombatStatus(token, status) {
  if (!token) return;
  
  // Remove any existing combat status icons from this token.
  for (const [iconKey] of Object.entries(COMBAT_STATUS_ICONS)) {
    const iconID = `lagunak-combat-status-${COMBAT_STATUS_ICONS[iconKey].name}`;
    if (token.status.includes(iconID)) {
      token.status = token.status.filter(id => id !== iconID);
    }
  }
  
  // If a status is specified, add its icon.
  if (status && COMBAT_STATUS_ICONS[status]) {
    const iconID = `lagunak-combat-status-${COMBAT_STATUS_ICONS[status].name}`;
    if (!token.status.includes(iconID)) {
      token.status.push(iconID);
    }
  }
  
  // Notify Foundry of the change.
  token.release(); // This triggers an update to all clients.
}

/**
 * Clears all combat status icons from a token.
 * @param {Token} token  The Token object to clear.
 */
export function clearTokenCombatStatus(token) {
  setTokenCombatStatus(token, null);
}
