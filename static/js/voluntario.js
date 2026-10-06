// A diferencia de la Tarea 1 (donde el JS armaba todo el objeto y lo
// guardaba en localStorage), acá el formulario es un <form method=post>
// de verdad: si las validaciones pasan, dejo que el navegador lo mande
// normal a Flask (no uso fetch ni preventDefault en ese caso). Si algo
// está mal, freno el envío y muestro los errores, igual que antes.
document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario-voluntario");
  if (!formulario) return;

  formulario.addEventListener("submit", function (evento) {
    let esValido = true;

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const telefono = document.getElementById("telefono").value;
    const comuna = document.getElementById("comuna").value;

    if (!validarNombreTexto(nombre)) {
      mostrarError("nombre", "error-nombre", "Ingresa un nombre válido (solo letras, entre 2 y 255 caracteres).");
      esValido = false;
    } else {
      limpiarError("nombre", "error-nombre");
    }

    if (!validarEmail(email)) {
      mostrarError("email", "error-email", "Ingresa un correo electrónico con formato válido.");
      esValido = false;
    } else {
      limpiarError("email", "error-email");
    }

    if (!validarCelularChileno(telefono)) {
      mostrarError("telefono", "error-telefono", "Ingresa un celular con formato +56 9 XXXXXXXX.");
      esValido = false;
    } else {
      limpiarError("telefono", "error-telefono");
    }

    if (!comuna) {
      mostrarError("comuna", "error-comuna", "Selecciona una región y una comuna.");
      esValido = false;
    } else {
      limpiarError("comuna", "error-comuna");
    }

    if (!esValido) {
      evento.preventDefault();
      const mensaje = document.getElementById("mensaje-formulario");
      mensaje.innerHTML = '<div class="mensaje-formulario error">Revisa los campos marcados en rojo antes de continuar.</div>';
    }
  });
});
