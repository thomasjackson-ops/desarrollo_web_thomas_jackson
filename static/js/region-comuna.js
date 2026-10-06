// Arma el select de comuna dependiente del de región. A diferencia de la
// Tarea 1 (donde las regiones/comunas estaban hardcodeadas en un archivo
// JS), acá el dato sale de la base de datos: el template Jinja lo deja
// embebido como JSON en un <script type="application/json">, y este
// archivo solo lo lee y arma los <option>.
document.addEventListener("DOMContentLoaded", function () {
  const selectRegion = document.getElementById("region");
  const selectComuna = document.getElementById("comuna");
  const elementoDatos = document.getElementById("datos-regiones");
  if (!selectRegion || !selectComuna || !elementoDatos) return;

  const regiones = JSON.parse(elementoDatos.textContent);
  const elementoComunaSeleccionada = document.getElementById("comuna-seleccionada");
  const comunaPreseleccionada = elementoComunaSeleccionada ? JSON.parse(elementoComunaSeleccionada.textContent) : "";

  function actualizarComunas() {
    selectComuna.innerHTML = "";
    const regionId = selectRegion.value;
    const datosRegion = regiones[regionId];

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = datosRegion ? "Seleccione comuna" : "Seleccione primero una región";
    placeholder.disabled = true;
    placeholder.selected = true;
    selectComuna.appendChild(placeholder);

    if (datosRegion) {
      datosRegion.comunas.forEach(function (comuna) {
        const opcion = document.createElement("option");
        opcion.value = comuna.id;
        opcion.textContent = comuna.nombre;
        if (String(comuna.id) === String(comunaPreseleccionada)) {
          opcion.selected = true;
          placeholder.selected = false;
        }
        selectComuna.appendChild(opcion);
      });
      selectComuna.disabled = false;
    } else {
      selectComuna.disabled = true;
    }
  }

  // Si el formulario vuelve con errores y ya había una comuna elegida,
  // hay que adivinar su región para dejar el select de región también
  // preseleccionado (si no, el usuario tendría que elegir todo de nuevo).
  if (comunaPreseleccionada) {
    for (const regionId in regiones) {
      if (regiones[regionId].comunas.some(function (c) { return String(c.id) === String(comunaPreseleccionada); })) {
        selectRegion.value = regionId;
        break;
      }
    }
  }

  selectRegion.addEventListener("change", actualizarComunas);
  actualizarComunas();
});
