// Catálogo de aves de Chile, agrupadas por tipo. No es exhaustivo, elegí
// algunas especies conocidas de cada categoría para que el prototipo tenga
// contenido real. Se usa tanto en el formulario de avistamiento (Tipo -> Ave)
// como en el filtro del listado.
const TIPOS_AVE = {
  "Rapaz": ["Águila mora", "Cóndor andino", "Tiuque", "Peuco", "Cernícalo"],
  "Acuática": ["Cisne de cuello negro", "Flamenco chileno", "Pato jergón grande", "Pato cortacorrientes", "Cuervo de pantano"],
  "Zancuda": ["Garza grande", "Garza cuca", "Bandurria", "Perrito (pluvial)"],
  "Paseriforme": ["Zorzal", "Chincol", "Diucón", "Loica", "Chercán", "Tordo"],
  "Otra": ["Picaflor gigante", "Pingüino de Humboldt", "Perdiz chilena", "Tórtola"]
};

function inicializarSelectTipoAve(selectTipoId, selectNombreId) {
  const selectTipo = document.getElementById(selectTipoId);
  const selectNombre = document.getElementById(selectNombreId);
  if (!selectTipo || !selectNombre) return;

  Object.keys(TIPOS_AVE).forEach(function (tipo) {
    const opcion = document.createElement("option");
    opcion.value = tipo;
    opcion.textContent = tipo;
    selectTipo.appendChild(opcion);
  });

  function actualizarNombres() {
    selectNombre.innerHTML = "";
    const tipo = selectTipo.value;
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = tipo ? "Seleccione ave" : "Seleccione primero un tipo";
    placeholder.disabled = true;
    placeholder.selected = true;
    selectNombre.appendChild(placeholder);

    if (tipo && TIPOS_AVE[tipo]) {
      TIPOS_AVE[tipo].forEach(function (nombre) {
        const opcion = document.createElement("option");
        opcion.value = nombre;
        opcion.textContent = nombre;
        selectNombre.appendChild(opcion);
      });
      selectNombre.disabled = false;
    } else {
      selectNombre.disabled = true;
    }
  }

  selectTipo.addEventListener("change", actualizarNombres);
  actualizarNombres();
}

// Mismo catálogo pero para el filtro del listado (con opción "Todos" ya puesta en el HTML)
function inicializarSelectFiltroTipo(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  Object.keys(TIPOS_AVE).forEach(function (tipo) {
    const opcion = document.createElement("option");
    opcion.value = tipo;
    opcion.textContent = tipo;
    select.appendChild(opcion);
  });
}
