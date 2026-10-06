document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario-avistamiento");
  if (!formulario) return;

  const descripcion = document.getElementById("descripcion");
  const contadorDescripcion = document.getElementById("contador-descripcion");
  if (descripcion && contadorDescripcion) {
    contadorDescripcion.textContent = String(descripcion.value.length);
    descripcion.addEventListener("input", function () {
      contadorDescripcion.textContent = String(descripcion.value.length);
    });
  }

  const hoy = new Date().toISOString().split("T")[0];
  const campoFecha = document.getElementById("fecha");
  if (campoFecha) campoFecha.setAttribute("max", hoy);

  // el datalist deja escribir cualquier cosa igual, por eso ademas de los
  // <option> en el html tengo esta misma lista en json para poder validar
  // que lo que escribieron matchee con alguna especie real
  const elementoAves = document.getElementById("datos-aves");
  const nombresAves = elementoAves ? JSON.parse(elementoAves.textContent) : [];
  const nombresAvesMinuscula = nombresAves.map(function (n) { return n.toLowerCase(); });

  formulario.addEventListener("submit", function (evento) {
    let esValido = true;

    const voluntario = document.getElementById("voluntario").value;
    const ave = document.getElementById("ave").value;
    const lugar = document.getElementById("lugar").value;
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const archivos = document.getElementById("archivo").files;
    const descripcionValor = descripcion ? descripcion.value : "";

    if (!voluntario) {
      mostrarError("voluntario", "error-voluntario", "Selecciona quién está informando el avistamiento.");
      esValido = false;
    } else {
      limpiarError("voluntario", "error-voluntario");
    }

    if (!ave.trim() || nombresAvesMinuscula.indexOf(ave.trim().toLowerCase()) === -1) {
      mostrarError("ave", "error-ave", "Selecciona un ave de la lista (escribe el nombre y elige una opción).");
      esValido = false;
    } else {
      limpiarError("ave", "error-ave");
    }

    if (!validarLugar(lugar)) {
      mostrarError("lugar", "error-lugar", "Ingresa el lugar del avistamiento (máximo 200 caracteres).");
      esValido = false;
    } else {
      limpiarError("lugar", "error-lugar");
    }

    if (!validarFechaHoraAvistamiento(fecha, hora)) {
      mostrarError("fecha", "error-fecha", "La fecha y hora no pueden ser futuras ni tener más de 5 años de antigüedad.");
      esValido = false;
    } else {
      limpiarError("fecha", "error-fecha");
    }

    if (!validarDescripcion(descripcionValor)) {
      mostrarError("descripcion", "error-descripcion", "La descripción no puede superar los 500 caracteres.");
      esValido = false;
    } else {
      limpiarError("descripcion", "error-descripcion");
    }

    const resultadoArchivo = validarArchivoAdjunto(archivos, 20);
    if (!resultadoArchivo.valido) {
      mostrarError("archivo", "error-archivo", resultadoArchivo.motivo);
      esValido = false;
    } else {
      limpiarError("archivo", "error-archivo");
    }

    if (!esValido) {
      evento.preventDefault();
      const mensaje = document.getElementById("mensaje-formulario");
      mensaje.innerHTML = '<div class="mensaje-formulario error">Revisa los campos marcados en rojo antes de continuar.</div>';
    }
  });
});
