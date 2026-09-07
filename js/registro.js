document.addEventListener("DOMContentLoaded", function () {
  inicializarSelectRegionComuna("region", "comuna");

  const formulario = document.getElementById("formulario-voluntario");
  const mensaje = document.getElementById("mensaje-formulario");

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    mensaje.textContent = "";
    mensaje.className = "";

    let esValido = true;

    const nombres = document.getElementById("nombres").value;
    const apellidos = document.getElementById("apellidos").value;
    const rut = document.getElementById("rut").value.trim();
    const fechaNacimiento = document.getElementById("fecha-nacimiento").value;
    const email = document.getElementById("email").value;
    const celular = document.getElementById("celular").value;
    const region = document.getElementById("region").value;
    const comuna = document.getElementById("comuna").value;
    const direccion = document.getElementById("direccion").value;
    const aceptaTerminos = document.getElementById("acepta-terminos").checked;

    if (!validarNombreTexto(nombres)) {
      mostrarError("nombres", "error-nombres", "Ingresa un nombre válido (solo letras, entre 2 y 50 caracteres).");
      esValido = false;
    } else {
      limpiarError("nombres", "error-nombres");
    }

    if (!validarNombreTexto(apellidos)) {
      mostrarError("apellidos", "error-apellidos", "Ingresa un apellido válido (solo letras, entre 2 y 50 caracteres).");
      esValido = false;
    } else {
      limpiarError("apellidos", "error-apellidos");
    }

    if (rut && !validarRUT(rut)) {
      mostrarError("rut", "error-rut", "El RUT ingresado no es válido (verifica el dígito verificador).");
      esValido = false;
    } else {
      limpiarError("rut", "error-rut");
    }

    if (fechaNacimiento && !validarFechaNacimiento(fechaNacimiento)) {
      mostrarError("fecha-nacimiento", "error-fecha-nacimiento", "Debes tener entre 15 y 110 años, y la fecha no puede ser futura.");
      esValido = false;
    } else {
      limpiarError("fecha-nacimiento", "error-fecha-nacimiento");
    }

    if (!validarEmail(email)) {
      mostrarError("email", "error-email", "Ingresa un correo electrónico con formato válido.");
      esValido = false;
    } else if (buscarVoluntarioPorEmail(email)) {
      mostrarError("email", "error-email", "Ya existe un voluntario registrado con este correo.");
      esValido = false;
    } else {
      limpiarError("email", "error-email");
    }

    if (!validarCelularChileno(celular)) {
      mostrarError("celular", "error-celular", "Ingresa un celular con formato +56 9 XXXXXXXX.");
      esValido = false;
    } else {
      limpiarError("celular", "error-celular");
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

    if (direccion && direccion.trim().length > 100) {
      mostrarError("direccion", "error-direccion", "La dirección no puede superar los 100 caracteres.");
      esValido = false;
    } else {
      limpiarError("direccion", "error-direccion");
    }

    if (!aceptaTerminos) {
      mostrarError("acepta-terminos", "error-acepta-terminos", "Debes aceptar esta condición para continuar.");
      esValido = false;
    } else {
      limpiarError("acepta-terminos", "error-acepta-terminos");
    }

    if (!esValido) {
      mensaje.textContent = "Revisa los campos marcados en rojo antes de continuar.";
      mensaje.className = "mensaje-formulario error";
      return;
    }

    const nuevoVoluntario = {
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      rut: rut || null,
      fechaNacimiento: fechaNacimiento || null,
      email: email.trim(),
      celular: celular.trim(),
      region: region,
      comuna: comuna,
      direccion: direccion.trim() || null,
      fechaRegistro: new Date().toISOString()
    };

    guardarVoluntario(nuevoVoluntario);
    // No hay login: solo dejo guardado que fuiste tú quien se acaba de
    // registrar, para que el formulario de avistamiento te proponga tu
    // nombre de primera en vez de dejarlo en blanco.
    recordarVoluntarioActivo(nuevoVoluntario.email);

    mensaje.textContent = "¡Registro exitoso! Ya puedes informar avistamientos. Redirigiendo…";
    mensaje.className = "mensaje-formulario exito";
    formulario.reset();
    document.getElementById("comuna").disabled = true;

    setTimeout(function () {
      window.location.href = "registrar-avistamiento.html";
    }, 1500);
  });
});
