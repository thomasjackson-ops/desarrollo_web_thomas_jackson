// Todas las validaciones "de verdad" del sistema están acá. Ninguna depende
// del atributo required de HTML (el enunciado pide que eso no cuente).
// Las usan tanto registro-voluntario.html como registrar-avistamiento.html.

function validarNombreTexto(valor) {
  return /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+(?:[ '-][A-Za-zÁÉÍÓÚÑÜáéíóúñü]+)*$/.test(valor.trim()) &&
    valor.trim().length >= 2 && valor.trim().length <= 50;
}

function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(valor.trim());
}

// Pide formato +56 9 XXXXXXXX (celular chileno, 8 dígitos después del 9)
function validarCelularChileno(valor) {
  return /^\+56\s?9\s?\d{4}\s?\d{4}$/.test(valor.trim());
}

// Valida un RUT con puntos y guión (ej: 12.345.678-5) calculando el dígito
// verificador con el algoritmo módulo 11 de siempre.
function validarRUT(rutCompleto) {
  const limpio = rutCompleto.replace(/\./g, "").replace(/-/g, "").trim().toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === dvEsperado;
}

// Pide al menos 15 años (defini este mínimo yo, no lo dice el enunciado)
// y que la fecha no sea futura obviamente.
function validarFechaNacimiento(valorFecha) {
  if (!valorFecha) return false;
  const fecha = new Date(valorFecha + "T00:00:00");
  const hoy = new Date();
  if (fecha > hoy) return false;
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const meses = hoy.getMonth() - fecha.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < fecha.getDate())) edad--;
  return edad >= 15 && edad <= 110;
}

// La fecha del avistamiento no puede ser futura (no se puede avistar algo
// que no ha pasado) ni tener más de 5 años, para que el registro siga
// siendo relevante.
function validarFechaAvistamiento(valorFecha) {
  if (!valorFecha) return false;
  const fecha = new Date(valorFecha + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fecha > hoy) return false;
  const limiteInferior = new Date(hoy);
  limiteInferior.setFullYear(limiteInferior.getFullYear() - 5);
  return fecha >= limiteInferior;
}

function validarHora(valorHora) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(valorHora);
}

// Chequea que venga al menos un archivo, que sea imagen o video, y que no
// pase el tamaño máximo (esto era requisito obligatorio: "al menos un
// registro en foto o video").
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

// Un par de helpers para no repetir el mismo código en cada validación:
// muestran/limpian el mensaje de error de un campo y el aria-invalid.
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
