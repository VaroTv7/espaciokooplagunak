/** 
 * Demostración de integración standalone mínima con autoridad y persistencia
 * Para el issue #1035: feat(render): integración standalone mínima con autoridad y persistencia
 * 
 * Este módulo implementa un patrón similar a dado-util.mjs pero para estado de juego:
 * - Usa el sistema de Foundry cuando está disponible (autoridad de sesión)
 * - Caerá a persistencia apropiada según el entorno:
 *   * En navegador: localStorage
 *   * En Node.js (tests): almacenamiento en memoria
 * - Mantiene lógica pura y testeable sin dependencia de DOM
 */

import { MODULE_ID } from "../lagunak-constantes.mjs";

// Almacenamiento en memoria para entornos donde localStorage no está disponible (Node.js tests)
const memoriaStorage = new Map();

/**
 * Obtiene el objeto de almacenamiento apropiado según el entorno.
 * @returns {Object} Objeto con métodos getItem, setItem, removeItem
 */
function obtenerAlmacenamiento() {
  // Si estamos en un entorno de navegador con localStorage disponible
  if (typeof window !== 'undefined' && window?.localStorage) {
    return window.localStorage;
  }
  
  // De lo contrario, usar almacenamiento en memoria (para tests de Node.js)
  return {
    getItem: (key) => memoriaStorage.get(key) || null,
    setItem: (key, value) => { memoriaStorage.set(key, value); return null; },
    removeItem: (key) => { memoriaStorage.delete(key); return null; }
  };
}

/**
 * Obtiene el valor autoritativo para una clave de estado.
 * En Foundry: usa game.settings.get(MODULE_ID, key) si disponible
 * En standalone: usa el almacenamiento apropiado según el entorno
 * 
 * @param {string} key - Clave del estado a obtener
 * @param {*} valorPredeterminado - Valor a retornar si no existe
 * @returns {*} El valor autoritativo o el predeterminado
 */
export function obtenerEstadoAutoritativo(key, valorPredeterminado = null) {
  // Manejo de claves inválidas: retornar directamente el predeterminado
  if (key === null || key === undefined) {
    return valorPredeterminado;
  }
  
  // Intentar usar el sistema de Foundry si está disponible
  if (typeof game !== 'undefined' && game?.settings) {
    try {
      const valor = game.settings.get(MODULE_ID, key);
      return valor !== null ? valor : valorPredeterminado;
    } catch (error) {
      // Si falla, continuar con fallback al almacenamiento apropiado
      console.warn(`Falló obtener de game.settings para ${key}:`, error);
    }
  }
  
  // Fallback al almacenamiento apropiado para el entorno
  try {
    const almacenamiento = obtenerAlmacenamiento();
    const almacenado = almacenamiento.getItem(`${MODULE_ID}:${key}`);
    return almacenado !== null ? JSON.parse(almacenado) : valorPredeterminado;
  } catch (error) {
    console.warn(`Falló obtener del almacenamiento para ${key}:`, error);
    return valorPredeterminado;
  }
}

/**
 * Guarda un valor de estado usando autoridad de sesión cuando está disponible.
 * 
 * @param {string} key - Clave del estado a guardar
 * @param {*} valor - Valor a guardar
 * @returns {boolean} true si se guardó exitosamente
 */
export function guardarEstadoAutoritativo(key, valor) {
  // Manejo de claves inválidas: no guardar y retornar false
  if (key === null || key === undefined) {
    return false;
  }
  
  let exito = false;
  
  // Intentar usar el sistema de Foundry si está disponible
  if (typeof game !== 'undefined' && game?.settings) {
    try {
      game.settings.set(MODULE_ID, key, valor);
      exito = true;
    } catch (error) {
      console.warn(`Falló guardar en game.settings para ${key}:`, error);
    }
  }
  
  // Siempre también guardar en el almacenamiento apropiado como fallback y para standalone
  try {
    const almacenamiento = obtenerAlmacenamiento();
    almacenamiento.setItem(`${MODULE_ID}:${key}`, JSON.stringify(valor));
    exito = true;
  } catch (error) {
    console.warn(`Falló guardar en el almacenamiento para ${key}:`, error);
  }
  
  return exito;
}

/**
 * Elimina un valor de estado.
 * 
 * @param {string} key - Clave del estado a eliminar
 * @returns {boolean} true si se eliminó exitosamente
 */
export function eliminarEstadoAutoritativo(key) {
  // Manejo de claves inválidas: no eliminar y retornar false
  if (key === null || key === undefined) {
    return false;
  }
  
  let exito = false;
  
  // Intentar usar el sistema de Foundry si está disponible
  if (typeof game !== 'undefined' && game?.settings) {
    try {
      game.settings.delete(MODULE_ID, key);
      exito = true;
    } catch (error) {
      console.warn(`Falló eliminar de game.settings para ${key}:`, error);
    }
  }
  
  // También eliminar del almacenamiento apropiado
  try {
    const almacenamiento = obtenerAlmacenamiento();
    almacenamiento.removeItem(`${MODULE_ID}:${key}`);
    exito = true;
  } catch (error) {
    console.warn(`Falló eliminar del almacenamiento para ${key}:`, error);
  }
  
  return exito;
}

/**
 * Simula una interacción autorizada que cambia el estado.
 * Esta sería la función que llamaría un cliente tras una interacción.
 * 
 * @param {string} tipoInteraccion - Tipo de interacción realizada
 * @param {*} datos - Datos asociados a la interacción
 * @returns {object} Resultado de la interacción
 */
export function procesarInteraccionAutorizada(tipoInteraccion, datos) {
  // Generar un ID único para esta interacción
  const idInteraccion = `${tipoInteraccion}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Crear el registro de interacción
  const registro = {
    id: idInteraccion,
    tipo: tipoInteraccion,
    timestamp: Date.now(),
    datos: datos,
    procesadoPor: typeof game !== 'undefined' && game.user ? game.user.id : 'standalone-client'
  };
  
  // Obtener el historial existente
  const historial = obtenerEstadoAutoritativo('interaccionesHistorial', []);
  
  // Añadir la nueva interacción
  historial.push(registro);
  
  // Mantener solo las últimas 100 interacciones para evitar crecimiento ilimitado
  if (historial.length > 100) {
    historial.splice(0, historial.length - 100);
  }
  
  // Guardar el historial actualizado
  guardarEstadoAutoritativo('interaccionesHistorial', historial);
  
  // También guardar un contador por tipo para consultas rápidas
  const contadores = obtenerEstadoAutoritativo('contadoresInteraccion', {});
  contadores[tipoInteraccion] = (contadores[tipoInteraccion] || 0) + 1;
  guardarEstadoAutoritativo('contadoresInteraccion', contadores);
  
  return {
    exitoso: true,
    interaccionId: idInteraccion,
    mensaje: `Interacción ${tipoInteraccion} procesada y guardada autoritativamente`
  };
}

/**
 * Obtiene el historial de interacciones para demostración y testing.
 * 
 * @returns {Array} Historial de interacciones
 */
export function obtenerHistorialInteracciones() {
  return obtenerEstadoAutoritativo('interaccionesHistorial', []);
}

/**
 * Obtiene contadores de interacciones por tipo.
 * 
 * @returns {object} Contadores {tipo: count}
 */
export function obtenerContadoresInteraccion() {
  return obtenerEstadoAutoritativo('contadoresInteraccion', {});
}

/**
 * Reinicia todo el estado de demostración (útil para tests).
 * 
 * @returns {boolean} true si se reinició exitosamente
 */
export function reiniciarEstadoDemostracion() {
  // Limpiar tanto Foundry settings como el almacenamiento apropiado
  let exito = true;
  
  // Intentar limpiar el sistema de Foundry si está disponible
  if (typeof game !== 'undefined' && game?.settings) {
    try {
      game.settings.delete(MODULE_ID, 'interaccionesHistorial');
      game.settings.delete(MODULE_ID, 'contadoresInteraccion');
    } catch (error) {
      console.warn(`Falló eliminar de game.settings:`, error);
      exito = false;
    }
  }
  
  // Limpiar el almacenamiento apropiado
  try {
    const almacenamiento = obtenerAlmacenamiento();
    almacenamiento.removeItem(`${MODULE_ID}:interaccionesHistorial`);
    almacenamiento.removeItem(`${MODULE_ID}:contadoresInteraccion`);
  } catch (error) {
    console.warn(`Falló eliminar del almacenamiento:`, error);
    exito = false;
  }
  
  // También limpiar el almacenamiento en memoria si se usó
  memoriaStorage.clear();
  
  return exito;
}
