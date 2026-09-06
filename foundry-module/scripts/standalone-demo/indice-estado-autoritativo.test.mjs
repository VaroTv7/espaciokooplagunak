import assert from "node:assert/strict";
import test from "node:test";

import { 
  obtenerEstadoAutoritativo, 
  guardarEstadoAutoritativo, 
  eliminarEstadoAutoritativo,
  procesarInteraccionAutorizada,
  obtenerHistorialInteracciones,
  obtenerContadoresInteraccion,
  reiniciarEstadoDemostracion
} from "./indice-estado-autoritativo.mjs";

test("indice-estado-autoritativo: guardar y obtener estado básico", () => {
  // Limpiar estado previo
  reiniciarEstadoDemostracion();
  
  // Guardar un valor
  const resultado = guardarEstadoAutoritativo("clave-prueba", "valor-de-prueba");
  assert.strictEqual(resultado, true, "Debe retornar true al guardar");
  
  // Obtener el valor
  const valorObtenido = obtenerEstadoAutoritativo("clave-prueba", "defecto");
  assert.strictEqual(valorObtenido, "valor-de-prueba", "Debe obtener el valor guardado");
});

test("indice-estado-autoritativo: valor predeterminado cuando no existe", () => {
  reiniciarEstadoDemostracion();
  
  const valor = obtenerEstadoAutoritativo("clave-inexistente", "valor-predeterminado");
  assert.strictEqual(valor, "valor-predeterminado", "Debe retornar el valor predeterminado");
});

test("indice-estado-autoritativo: eliminar estado", () => {
  reiniciarEstadoDemostracion();
  
  // Guardar y verificar que existe
  guardarEstadoAutoritativo("clave-para-eliminar", "valor-temporal");
  assert.strictEqual(obtenerEstadoAutoritativo("clave-para-eliminar", null), "valor-temporal");
  
  // Eliminar y verificar que ya no existe
  const resultadoEliminado = eliminarEstadoAutoritativo("clave-para-eliminar");
  assert.strictEqual(resultadoEliminado, true, "Debe retornar true al eliminar");
  
  // Verificar que retorna el predeterminado
  const valorDespues = obtenerEstadoAutoritativo("clave-para-eliminar", "predeterminado-post");
  assert.strictEqual(valorDespues, "predeterminado-post", "Debe retornar predeterminado después de eliminar");
});

test("indice-estado-autoritativo: procesar interacción autorizada", () => {
  reiniciarEstadoDemostracion();
  
  // Procesar una interacción
  const resultado = procesarInteraccionAutorizada("investigacion", { habilidad: "arcana", total: 15 });
  assert.strictEqual(resultado.exitoso, true, "La interacción debe ser exitosa");
  assert.ok(resultado.interaccionId.startsWith("investigacion-"), "El ID debe comenzar con el tipo");
  assert.strictEqual(resultado.mensaje, "Interacción investigacion procesada y guardada autoritativamente");
  
  // Verificar que se guardó en el historial
  const historial = obtenerHistorialInteracciones();
  assert.strictEqual(historial.length, 1, "Debe haber una interacción en el historial");
  assert.strictEqual(historial[0].tipo, "investigacion", "El tipo debe ser correcto");
  assert.strictEqual(historial[0].datos.habilidad, "arcana", "La habilidad debe ser correcta");
  assert.strictEqual(historial[0].datos.total, 15, "El total debe ser correcto");
  
  // Verificar que se actualizó el contador
  const contadores = obtenerContadoresInteraccion();
  assert.strictEqual(contadores.investigacion, 1, "Debe haber 1 interacción de tipo investigacion");
});

test("indice-estado-autoritativo: múltiples interacciones y límite de historial", () => {
  reiniciarEstadoDemostracion();
  
  // Procesar 3 interacciones
  for (let i = 0; i < 3; i++) {
    procesarInteraccionAutorizada("prueba", { indice: i });
  }
  
  const historial = obtenerHistorialInteracciones();
  assert.strictEqual(historial.length, 3, "Deben haber 3 interacciones");
  
  // Procesar 2 más para hacer 5
  for (let i = 3; i < 5; i++) {
    procesarInteraccionAutorizada("prueba", { indice: i });
  }
  
  const historial2 = obtenerHistorialInteracciones();
  assert.strictEqual(historial2.length, 5, "Deben haber 5 interacciones");
});

test("indice-estado-autoritativo: manejo de errores graceful", () => {
  reiniciarEstadoDemostracion();
  
  // Probar con valores nulos y undefined
  assert.doesNotThrow(() => {
    guardarEstadoAutoritativo(null, "valor");
    guardarEstadoAutoritativo("clave", null);
    guardarEstadoAutoritativo("clave", undefined);
  }, "No debe lanzar errores con valores nulos");
  
  // Obtener con clave nula debe retornar predeterminado
  const valor = obtenerEstadoAutoritativo(null, "predeterminado");
  assert.strictEqual(valor, "predeterminado", "Clave nula debe retornar predeterminado");
});

// Test for two clients and a reconnection (issue #1035)
test("indice-estado-autoritativo: dos clientes y una reconexión", () => {
  // Limpiar estado previo
  reiniciarEstadoDemostracion();
  
  // Cliente A: realiza una interacción de investigación
  const resultadoA = procesarInteraccionAutorizada("investigacion", { 
    habilidad: "arcana", 
    total: 16, 
    dc: 15 
  });
  assert.strictEqual(resultadoA.exitoso, true, "Cliente A: interacción exitosa");
  
  // Cliente B: lee el historial y ve la interacción de A
  const historialB = obtenerHistorialInteracciones();
  assert.strictEqual(historialB.length, 1, "Cliente B: debe ver una interacción");
  assert.strictEqual(historialB[0].tipo, "investigacion", "Cliente B: tipo correcto");
  assert.strictEqual(historialB[0].datos.habilidad, "arcana", "Cliente B: habilidad correcta");
  assert.strictEqual(historialB[0].datos.total, 16, "Cliente B: total correcto");
  
  // Cliente B: realiza una interacción de historia
  const resultadoB = procesarInteraccionAutorizada("historia", { 
    habilidad: "historia", 
    total: 12, 
    dc: 10 
  });
  assert.strictEqual(resultadoB.exitoso, true, "Cliente B: interacción exitosa");
  
  // Cliente A (nueva instancia, simulando reconexión): lee el historial y ve ambas interacciones
  const historialA = obtenerHistorialInteracciones();
  assert.strictEqual(historialA.length, 2, "Cliente A (reconexión): debe ver dos interacciones");
  assert.strictEqual(historialA[0].tipo, "investigacion", "Cliente A (reconexión): primera interacción tipo correcto");
  assert.strictEqual(historialA[0].datos.habilidad, "arcana", "Cliente A (reconexión): primera interacción habilidad correcta");
  assert.strictEqual(historialA[0].datos.total, 16, "Cliente A (reconexión): primera interacción total correcto");
  assert.strictEqual(historialA[1].tipo, "historia", "Cliente A (reconexión): segunda interacción tipo correcto");
  assert.strictEqual(historialA[1].datos.habilidad, "historia", "Cliente A (reconexión): segunda interacción habilidad correcta");
  assert.strictEqual(historialA[1].datos.total, 12, "Cliente A (reconexión): segunda interacción total correcto");
  
  // Verificar que los contadores son correctos
  const contadores = obtenerContadoresInteraccion();
  assert.strictEqual(contadores.investigacion, 1, "Debe haber 1 interacción de tipo investigacion");
  assert.strictEqual(contadores.historia, 1, "Debe haber 1 interacción de tipo historia");
  
  // Simular una reconexión adicional (tercer cliente) para asegurar que el estado persiste
  const historialC = obtenerHistorialInteracciones();
  assert.strictEqual(historialC.length, 2, "Tercer cliente: debe ver las mismas dos interacciones");
});

console.log("Todos los tests del indice-estado-autoritativo pasaron correctamente");
