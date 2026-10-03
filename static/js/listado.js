// Hace clickeable toda la fila (no solo el link de la fecha), guardando la
// URL del detalle en data-href. El <a> dentro de la celda sigue ahí como
// respaldo accesible (funciona con teclado y sin este JS).
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("tr.fila-avistamiento[data-href]").forEach(function (fila) {
    fila.addEventListener("click", function (evento) {
      if (evento.target.closest("a")) return; // ya lo maneja el link
      window.location.href = fila.dataset.href;
    });
  });
});
