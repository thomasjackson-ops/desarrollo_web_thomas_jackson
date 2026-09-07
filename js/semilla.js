// Esto corre en todas las páginas: si es la primera vez que se abre el
// sitio en este navegador, carga algunos voluntarios y avistamientos de
// ejemplo para que el listado, el filtro y los gráficos tengan contenido
// sin tener que registrar todo a mano antes de poder probarlos.
document.addEventListener("DOMContentLoaded", function () {
  sembrarDatosDemo();
});
