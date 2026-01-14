/**
 * Validadores para datos argentinos
 */

/**
 * Valida un CUIT/CUIL argentino
 * Formato: XX-XXXXXXXX-X (11 dígitos)
 * Para MVP: validación simplificada (solo formato y prefijo)
 */
export function validarCUIL(cuil: string): boolean {
  // Limpiar: solo números
  const clean = cuil.replace(/\D/g, "");

  if (clean.length !== 11) return false;

  // Validar prefijo (20, 23, 24, 27 para personas, 30, 33, 34 para empresas)
  const prefijo = parseInt(clean.slice(0, 2));
  const prefijosValidos = [20, 23, 24, 27, 30, 33, 34];
  if (!prefijosValidos.includes(prefijo)) return false;

  // Para MVP: aceptar si tiene formato correcto y prefijo válido
  // La validación del dígito verificador se puede agregar después
  return true;
}

/**
 * Formatea un CUIL/CUIT con guiones
 * Input: "20123456789" -> Output: "20-12345678-9"
 */
export function formatearCUIL(cuil: string): string {
  const clean = cuil.replace(/\D/g, "");
  if (clean.length !== 11) return cuil;
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
}

/**
 * Limpia un CUIL/CUIT (solo números)
 */
export function limpiarCUIL(cuil: string): string {
  return cuil.replace(/\D/g, "");
}

/**
 * Valida formato de email
 */
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida teléfono argentino
 * Formatos aceptados:
 * - +54 9 223 XXX-XXXX (celular con código área)
 * - 223 XXX-XXXX (celular sin código país)
 * - 11 XXXX-XXXX (CABA/GBA)
 */
export function validarTelefono(telefono: string): boolean {
  const clean = telefono.replace(/\D/g, "");
  // Debe tener entre 10 y 13 dígitos
  return clean.length >= 10 && clean.length <= 13;
}

/**
 * Formatea teléfono para envío (formato internacional)
 * Input: "223 456-7890" -> Output: "+5492234567890"
 */
export function formatearTelefonoInternacional(telefono: string): string {
  let clean = telefono.replace(/\D/g, "");

  // Si ya empieza con 54, verificar formato
  if (clean.startsWith("54")) {
    // Si tiene 54 pero no tiene 9, agregarlo después del 54
    if (!clean.startsWith("549")) {
      clean = "549" + clean.slice(2);
    }
  } else if (clean.startsWith("9")) {
    // Celular argentino sin código país
    clean = "54" + clean;
  } else if (clean.length === 10) {
    // Número local sin código país ni 9
    clean = "549" + clean;
  }

  return "+" + clean;
}

/**
 * Formatea teléfono para mostrar
 * Input: "+5492234567890" -> Output: "+54 9 223 456-7890"
 */
export function formatearTelefonoDisplay(telefono: string): string {
  const clean = telefono.replace(/\D/g, "");

  if (clean.length === 13 && clean.startsWith("549")) {
    const codigoArea = clean.slice(3, 6);
    const parte1 = clean.slice(6, 9);
    const parte2 = clean.slice(9, 13);
    return `+54 9 ${codigoArea} ${parte1}-${parte2}`;
  }

  return telefono;
}
