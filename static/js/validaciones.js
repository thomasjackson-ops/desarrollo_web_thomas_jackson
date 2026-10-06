// Mismas reglas que valido en el servidor (validadores.py), para que el
// usuario vea el error al tiro sin esperar el round-trip al servidor. El
// servidor igual las vuelve a chequear todas: estas de acá son solo para
// la experiencia de uso, no son la fuente de verdad.

function validarNombreTexto(valor) {
  return /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+(?:[ '-][A-Za-zÁÉÍÓÚÑÜáéíóúñü]+)*$/.test(valor.trim()) &&
    valor.trim().length >= 2 && valor.trim().length <= 255;
}

function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(valor.trim()) && valor.trim().length <= 80;
}

function validarCelularChileno(valor) {
  return /^\+56\s?9\s?\d{4}\s?\d{4}$/.test(valor.trim());
}

function validarLugar(valor) {
  return valor.trim().length > 0 && valor.trim().length <= 200;
}

function validarDescripcion(valor) {
  return valor.trim().length <= 500;
}

function validarFechaHoraAvistamiento(valorFecha, valorHora) {
  if (!valorFecha || !valorHora) return false;
  const fechaHora = new Date(valorFecha + "T" + valorHora);
  if (isNaN(fechaHora.getTime())) return false;
  const ahora = new Date();
  if (fechaHora > ahora) return false;
  const limiteInferior = new Date(ahora);
  limiteInferior.setFullYear(limiteInferior.getFullYear() - 5);
  return fechaHora >= limiteInferior;
}

function validarArchivoAdjunto(fileList, tamañoMaximoMB) {
  if (!fileList || fileList.length === 0) return { valido: false, motivo: "Debe adjuntar al menos una foto o un video." };
  for (let i = 0; i < fileList.length; i++) {
    const archivo = fileList[i];
    const esImagenOVideo = archivo.type.startsWith("image/") || archivo.type.startsWith("video/");
    if (!esImagenOVideo) return { valido: false, motivo: "Solo se aceptan archivos de imagen o video." };
    if (archivo.size > tamañoMaximoMB * 1024 * 1024) {
      return { valido: false, motivo: "El archivo \"" + archivo.name + "\" supera los " + tamañoMaximoMB + " MB permitidos." };
    }
  }
  return { valido: true };
}

function mostrarError(idCampo, idError, mensaje) {
  const campo = document.getElementById(idCampo);
  const error = document.getElementById(idError);
  if (error) error.textContent = mensaje;
  if (campo) campo.setAttribute("aria-invalid", "true");
}

function limpiarError(idCampo, idError) {
  const campo = document.getElementById(idCampo);
  const error = document.getElementById(idError);
  if (error) error.textContent = "";
  if (campo) campo.removeAttribute("aria-invalid");
}
