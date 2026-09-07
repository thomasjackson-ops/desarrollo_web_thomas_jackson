document.addEventListener("DOMContentLoaded", function () {
  const voluntarios = obtenerVoluntarios();
  if (voluntarios.length === 0) {
    document.getElementById("aviso-sin-voluntarios").hidden = false;
    document.getElementById("contenedor-formulario").hidden = true;
    return;
  }

  inicializarSelectVoluntario(voluntarios);
  inicializarSelectTipoAve("tipo-ave", "nombre-ave");
  inicializarSelectRegionComuna("region", "comuna");

  const formulario = document.getElementById("formulario-avistamiento");
  const mensaje = document.getElementById("mensaje-formulario");
  const descripcion = document.getElementById("descripcion");
  const contadorDescripcion = document.getElementById("contador-descripcion");

  descripcion.addEventListener("input", function () {
    contadorDescripcion.textContent = String(descripcion.value.length);
  });

  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").setAttribute("max", hoy);

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    mensaje.textContent = "";
    mensaje.className = "";

    let esValido = true;

    const voluntarioEmail = document.getElementById("voluntario").value;
    const tipoAve = document.getElementById("tipo-ave").value;
    const nombreAve = document.getElementById("nombre-ave").value;
    const cantidad = document.getElementById("cantidad").value;
    const region = document.getElementById("region").value;
    const comuna = document.getElementById("comuna").value;
    const lugar = document.getElementById("lugar").value;
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const archivos = document.getElementById("archivo").files;
    const descripcionValor = descripcion.value;

    if (!voluntarioEmail) {
      mostrarError("voluntario", "error-voluntario", "Selecciona quién está informando el avistamiento.");
      esValido = false;
    } else {
      limpiarError("voluntario", "error-voluntario");
    }

    if (!tipoAve) {
      mostrarError("tipo-ave", "error-tipo-ave", "Selecciona el tipo de ave.");
      esValido = false;
    } else {
      limpiarError("tipo-ave", "error-tipo-ave");
    }

    if (!nombreAve) {
      mostrarError("nombre-ave", "error-nombre-ave", "Selecciona el nombre del ave.");
      esValido = false;
    } else {
      limpiarError("nombre-ave", "error-nombre-ave");
    }

    if (cantidad && (Number(cantidad) < 1 || Number(cantidad) > 500 || !Number.isInteger(Number(cantidad)))) {
      mostrarError("cantidad", "error-cantidad", "La cantidad debe ser un número entero entre 1 y 500.");
      esValido = false;
    } else {
      limpiarError("cantidad", "error-cantidad");
    }

    if (!region) {
      mostrarError("region", "error-region", "Selecciona una región.");
      esValido = false;
    } else {
      limpiarError("region", "error-region");
    }

    if (!comuna) {
      mostrarError("comuna", "error-comuna", "Selecciona una comuna.");
      esValido = false;
    } else {
      limpiarError("comuna", "error-comuna");
    }

    if (lugar && lugar.trim().length > 100) {
      mostrarError("lugar", "error-lugar", "El lugar específico no puede superar los 100 caracteres.");
      esValido = false;
    } else {
      limpiarError("lugar", "error-lugar");
    }

    if (!validarFechaAvistamiento(fecha)) {
      mostrarError("fecha", "error-fecha", "La fecha no puede ser futura ni tener más de 5 años de antigüedad.");
      esValido = false;
    } else {
      limpiarError("fecha", "error-fecha");
    }

    if (!validarHora(hora)) {
      mostrarError("hora", "error-hora", "Ingresa una hora válida.");
      esValido = false;
    } else {
      limpiarError("hora", "error-hora");
    }

    const resultadoArchivo = validarArchivoAdjunto(archivos, 20);
    if (!resultadoArchivo.valido) {
      mostrarError("archivo", "error-archivo", resultadoArchivo.motivo);
      esValido = false;
    } else {
      limpiarError("archivo", "error-archivo");
    }

    if (!esValido) {
      mensaje.textContent = "Revisa los campos marcados en rojo antes de continuar.";
      mensaje.className = "mensaje-formulario error";
      return;
    }

    const nombresArchivos = Array.from(archivos).map(function (a) { return a.name; }).join(", ");
    const primerArchivo = archivos[0];

    guardarAvistamiento({
      tipoAve: tipoAve,
      nombreAve: nombreAve,
      cantidad: cantidad ? Number(cantidad) : null,
      region: region,
      comuna: comuna,
      lugar: lugar.trim() || null,
      fecha: fecha,
      hora: hora,
      descripcion: descripcionValor.trim() || null,
      archivoNombre: nombresArchivos,
      archivoTipo: primerArchivo.type,
      voluntarioEmail: voluntarioEmail,
      fechaRegistro: new Date().toISOString()
    });
    recordarVoluntarioActivo(voluntarioEmail);

    mensaje.textContent = "¡Avistamiento registrado! Puedes verlo en el listado de avistamientos.";
    mensaje.className = "mensaje-formulario exito";
    formulario.reset();
    document.getElementById("voluntario").value = voluntarioEmail; // mantenerlo seleccionado, es lo más probable que siga informando el mismo
    document.getElementById("nombre-ave").disabled = true;
    document.getElementById("comuna").disabled = true;
    contadorDescripcion.textContent = "0";
  });
});

// Llena el select "¿Quién informa?" con los voluntarios ya registrados y
// deja preseleccionado al último que informó un avistamiento en esta pestaña
// (si lo hay), para no tener que buscarlo cada vez en la lista.
function inicializarSelectVoluntario(voluntarios) {
  const select = document.getElementById("voluntario");
  voluntarios.forEach(function (v) {
    const opcion = document.createElement("option");
    opcion.value = v.email;
    opcion.textContent = v.nombres + " " + v.apellidos + " (" + v.email + ")";
    select.appendChild(opcion);
  });

  const ultimoEmail = obtenerVoluntarioActivoEmail();
  if (ultimoEmail && voluntarios.some(function (v) { return v.email === ultimoEmail; })) {
    select.value = ultimoEmail;
  }
}
