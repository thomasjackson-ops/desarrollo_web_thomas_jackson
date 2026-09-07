document.addEventListener("DOMContentLoaded", function () {
  inicializarSelectFiltroTipo("filtro-tipo");

  const selectFiltroTipo = document.getElementById("filtro-tipo");
  const selectOrden = document.getElementById("orden");
  const selectPorPagina = document.getElementById("por-pagina");
  const cuerpoTabla = document.getElementById("cuerpo-tabla");
  const resumenResultados = document.getElementById("resumen-resultados");
  const indicadorPagina = document.getElementById("indicador-pagina");
  const botonAnterior = document.getElementById("boton-anterior");
  const botonSiguiente = document.getElementById("boton-siguiente");

  let paginaActual = 1;

  function obtenerDatosFiltradosYOrdenados() {
    let datos = obtenerAvistamientos();

    const tipo = selectFiltroTipo.value;
    if (tipo) {
      datos = datos.filter(function (a) { return a.tipoAve === tipo; });
    }

    const criterio = selectOrden.value;
    datos.sort(function (a, b) {
      if (criterio === "fecha-asc") return (a.fecha + a.hora).localeCompare(b.fecha + b.hora);
      if (criterio === "fecha-desc") return (b.fecha + b.hora).localeCompare(a.fecha + a.hora);
      const lugarA = (a.comuna + " " + (a.lugar || "")).toLowerCase();
      const lugarB = (b.comuna + " " + (b.lugar || "")).toLowerCase();
      if (criterio === "lugar-asc") return lugarA.localeCompare(lugarB);
      if (criterio === "lugar-desc") return lugarB.localeCompare(lugarA);
      return 0;
    });

    return datos;
  }

  function renderizar() {
    const datos = obtenerDatosFiltradosYOrdenados();
    const porPagina = Number(selectPorPagina.value);
    const totalPaginas = Math.max(1, Math.ceil(datos.length / porPagina));
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * porPagina;
    const datosPagina = datos.slice(inicio, inicio + porPagina);

    cuerpoTabla.innerHTML = "";
    if (datosPagina.length === 0) {
      const fila = document.createElement("tr");
      const celda = document.createElement("td");
      celda.colSpan = 9;
      celda.textContent = "No hay avistamientos que coincidan con el filtro seleccionado.";
      fila.appendChild(celda);
      cuerpoTabla.appendChild(fila);
    } else {
      datosPagina.forEach(function (avistamiento) {
        const fila = document.createElement("tr");
        const voluntario = buscarVoluntarioPorEmail(avistamiento.voluntarioEmail);
        const nombreVoluntario = voluntario ? voluntario.nombres + " " + voluntario.apellidos : avistamiento.voluntarioEmail;

        [
          avistamiento.fecha,
          avistamiento.hora,
          avistamiento.tipoAve,
          avistamiento.nombreAve,
          avistamiento.region,
          avistamiento.comuna,
          avistamiento.lugar || "—",
          avistamiento.archivoNombre || "—",
          nombreVoluntario
        ].forEach(function (valor) {
          const celda = document.createElement("td");
          celda.textContent = valor;
          fila.appendChild(celda);
        });

        cuerpoTabla.appendChild(fila);
      });
    }

    resumenResultados.textContent = datos.length + " avistamiento(s) encontrado(s).";
    indicadorPagina.textContent = "Página " + paginaActual + " de " + totalPaginas;
    botonAnterior.disabled = paginaActual <= 1;
    botonSiguiente.disabled = paginaActual >= totalPaginas;
  }

  selectFiltroTipo.addEventListener("change", function () { paginaActual = 1; renderizar(); });
  selectOrden.addEventListener("change", function () { paginaActual = 1; renderizar(); });
  selectPorPagina.addEventListener("change", function () { paginaActual = 1; renderizar(); });

  botonAnterior.addEventListener("click", function () {
    if (paginaActual > 1) { paginaActual--; renderizar(); }
  });
  botonSiguiente.addEventListener("click", function () {
    paginaActual++;
    renderizar();
  });

  renderizar();
});
