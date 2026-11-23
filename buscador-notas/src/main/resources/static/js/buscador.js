// Buscador en vivo: cada vez que el usuario escribe, pedimos los resultados
// de nuevo (con un pequeño debounce para no mandar un fetch por cada tecla).
// Ojo con el resaltado: los nombres que vienen de la bd los escribio otra
// persona (el que se registro como voluntario, por ejemplo), asi que todo
// se arma con nodos de texto y <mark>, nunca concatenando strings dentro de
// innerHTML. Si no, alguien con un nombre tipo "<script>..." la embarra para
// todos los que usen el buscador despues.

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("buscador");
  const mensaje = document.getElementById("mensaje-busqueda");
  const tabla = document.getElementById("tabla-resultados");
  const cuerpo = document.getElementById("cuerpo-resultados");

  let temporizador = null;

  input.addEventListener("input", function () {
    clearTimeout(temporizador);
    const texto = input.value.trim();

    if (texto.length === 0) {
      mensaje.textContent = "";
      tabla.hidden = true;
      cuerpo.innerHTML = "";
      return;
    }

    // 300ms de espera despues de que la persona deja de tipear, asi no
    // disparamos un request por cada letra si escribe rapido
    temporizador = setTimeout(function () {
      buscar(texto);
    }, 300);
  });

  function buscar(texto) {
    mensaje.textContent = "Buscando...";
    fetch("/api/avistamientos/buscar?q=" + encodeURIComponent(texto))
      .then(function (resp) { return resp.json(); })
      .then(function (resultados) { pintarResultados(resultados, texto); })
      .catch(function () {
        mensaje.textContent = "Ocurrió un error buscando, intenta de nuevo.";
        tabla.hidden = true;
      });
  }

  function pintarResultados(resultados, texto) {
    cuerpo.innerHTML = "";

    if (resultados.length === 0) {
      mensaje.textContent = "No se encontraron avistamientos que coincidan con \"" + texto + "\".";
      tabla.hidden = true;
      return;
    }

    mensaje.textContent = resultados.length + " avistamiento(s) encontrado(s).";
    tabla.hidden = false;

    resultados.forEach(function (r) {
      cuerpo.appendChild(armarFila(r, texto));
    });
  }

  function armarFila(resultado, texto) {
    const fila = document.createElement("tr");

    fila.appendChild(celdaConResaltado(resultado.voluntario, texto));
    fila.appendChild(celdaTexto(resultado.dia));
    fila.appendChild(celdaConResaltado(resultado.ave, texto));
    fila.appendChild(celdaConResaltado(resultado.comuna, texto));

    const celdaNota = document.createElement("td");
    celdaNota.className = "celda-nota";
    celdaNota.textContent = resultado.promedioNota == null ? "-" : resultado.promedioNota.toFixed(1);
    fila.appendChild(celdaNota);

    fila.appendChild(celdaEvaluar(resultado.avistamientoId, celdaNota));

    return fila;
  }

  function celdaTexto(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
  }

  // Arma una celda resaltando (con <mark>) la parte del texto que calza con
  // la busqueda, sin tocar innerHTML. Si el valor no contiene el patron (por
  // ej. el match vino de otro campo de la misma fila), se muestra normal.
  function celdaConResaltado(valor, patron) {
    const celda = document.createElement("td");
    const idx = valor.toLowerCase().indexOf(patron.toLowerCase());

    if (idx === -1) {
      celda.textContent = valor;
      return celda;
    }

    const antes = valor.slice(0, idx);
    const coincide = valor.slice(idx, idx + patron.length);
    const despues = valor.slice(idx + patron.length);

    if (antes) celda.appendChild(document.createTextNode(antes));
    const marca = document.createElement("mark");
    marca.textContent = coincide;
    celda.appendChild(marca);
    if (despues) celda.appendChild(document.createTextNode(despues));

    return celda;
  }

  // De ves en cuando conviene dejar el boton original guardado para poder
  // volver a mostrarlo si la persona cancela o si la nota se guarda bien.
  function celdaEvaluar(avistamientoId, celdaNota) {
    const celda = document.createElement("td");

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "secundario boton-evaluar";
    boton.textContent = "Evaluar";

    boton.addEventListener("click", function () {
      celda.innerHTML = "";
      celda.appendChild(formularioEvaluar(avistamientoId, celdaNota, celda, boton));
    });

    celda.appendChild(boton);
    return celda;
  }

  function formularioEvaluar(avistamientoId, celdaNota, celda, botonOriginal) {
    const contenedor = document.createElement("span");
    contenedor.className = "evaluar-inline";

    const select = document.createElement("select");
    select.setAttribute("aria-label", "Nota del 1 al 7");
    for (let n = 1; n <= 7; n++) {
      const opcion = document.createElement("option");
      opcion.value = String(n);
      opcion.textContent = String(n);
      select.appendChild(opcion);
    }

    const confirmar = document.createElement("button");
    confirmar.type = "button";
    confirmar.textContent = "Confirmar";

    const error = document.createElement("p");
    error.className = "error";

    confirmar.addEventListener("click", function () {
      const notaElegida = parseInt(select.value, 10);
      confirmar.disabled = true;

      fetch("/api/avistamientos/" + avistamientoId + "/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota: notaElegida })
      })
        .then(function (resp) {
          return resp.json().then(function (cuerpo) { return { ok: resp.ok, cuerpo: cuerpo }; });
        })
        .then(function (resultado) {
          if (!resultado.ok) {
            error.textContent = resultado.cuerpo.error || "No se pudo guardar la nota.";
            confirmar.disabled = false;
            return;
          }
          const promedio = resultado.cuerpo.promedio;
          celdaNota.textContent = promedio == null ? "-" : promedio.toFixed(1);
          celda.innerHTML = "";
          celda.appendChild(botonOriginal);
        })
        .catch(function () {
          error.textContent = "No se pudo conectar con el servidor.";
          confirmar.disabled = false;
        });
    });

    contenedor.appendChild(select);
    contenedor.appendChild(confirmar);
    contenedor.appendChild(error);
    return contenedor;
  }
});
