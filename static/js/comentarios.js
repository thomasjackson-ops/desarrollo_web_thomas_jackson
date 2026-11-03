// Tanto el listado como el alta de comentarios van por fetch, nunca por un
// render de Jinja ni un submit normal de formulario (así lo pide el
// enunciado). Ojo con el XSS acá: el texto del comentario lo escribe
// cualquier visitante y lo insertamos en el DOM nosotros mismos con JS, asi
// que todo se mete con textContent, nunca con innerHTML + texto concatenado.
document.addEventListener("DOMContentLoaded", function () {
  const seccion = document.getElementById("seccion-comentarios");
  if (!seccion) return;

  const avistamientoId = seccion.dataset.avistamientoId;
  const urlComentarios = "/avistamientos/" + avistamientoId + "/comentarios";
  const lista = document.getElementById("lista-comentarios");
  const formulario = document.getElementById("formulario-comentario");

  function renderizarComentarios(comentarios) {
    lista.innerHTML = "";
    if (comentarios.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Todavía no hay comentarios en este avistamiento.";
      lista.appendChild(li);
      return;
    }
    comentarios.forEach(function (c) {
      const li = document.createElement("li");

      const encabezado = document.createElement("p");
      encabezado.className = "comentario-encabezado";
      const nombre = document.createElement("strong");
      nombre.textContent = c.nombre;
      encabezado.appendChild(nombre);
      encabezado.appendChild(document.createTextNode(" — " + c.fecha));

      const texto = document.createElement("p");
      texto.textContent = c.texto;

      li.appendChild(encabezado);
      li.appendChild(texto);
      lista.appendChild(li);
    });
  }

  function cargarComentarios() {
    fetch(urlComentarios)
      .then(function (resp) { return resp.json(); })
      .then(renderizarComentarios)
      .catch(function () {
        lista.innerHTML = "";
        const li = document.createElement("li");
        li.textContent = "No se pudieron cargar los comentarios.";
        lista.appendChild(li);
      });
  }

  cargarComentarios();

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nombre = document.getElementById("nombre-comentario").value.trim();
    const texto = document.getElementById("texto-comentario").value.trim();
    const mensaje = document.getElementById("mensaje-comentario");
    mensaje.textContent = "";

    let esValido = true;
    if (nombre.length < 3 || nombre.length > 50) {
      mostrarError("nombre-comentario", "error-nombre-comentario", "El nombre debe tener entre 3 y 50 caracteres.");
      esValido = false;
    } else {
      limpiarError("nombre-comentario", "error-nombre-comentario");
    }

    if (texto.length < 5) {
      mostrarError("texto-comentario", "error-texto-comentario", "El comentario debe tener al menos 5 caracteres.");
      esValido = false;
    } else {
      limpiarError("texto-comentario", "error-texto-comentario");
    }

    if (!esValido) return;

    fetch(urlComentarios, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre, texto: texto })
    })
      .then(function (resp) {
        return resp.json().then(function (cuerpo) { return { ok: resp.ok, cuerpo: cuerpo }; });
      })
      .then(function (resultado) {
        if (!resultado.ok) {
          const errores = resultado.cuerpo.errores || {};
          if (errores.nombre) mostrarError("nombre-comentario", "error-nombre-comentario", errores.nombre);
          if (errores.texto) mostrarError("texto-comentario", "error-texto-comentario", errores.texto);
          mensaje.innerHTML = '<div class="mensaje-formulario error">Revisa los campos marcados en rojo.</div>';
          return;
        }
        formulario.reset();
        mensaje.innerHTML = '<div class="mensaje-formulario exito">Comentario agregado.</div>';
        cargarComentarios(); // recargo la lista entera, mas facil que armar solo la fila nueva
      })
      .catch(function () {
        mensaje.innerHTML = '<div class="mensaje-formulario error">No se pudo enviar el comentario, intenta de nuevo.</div>';
      });
  });
});
