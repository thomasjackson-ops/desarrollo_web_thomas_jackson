// No quise depender de ninguna librería de gráficos (Chart.js, etc.) para
// no tener que cargar nada externo, así que armo las barras a mano con SVG.
const SVG_NS = "http://www.w3.org/2000/svg";

// Dibuja un gráfico de barras bien simple dentro de un <svg> que ya existe
// en el HTML. Recibe un objeto {etiqueta: valor} y calcula el alto de cada
// barra en base al valor más grande.
function dibujarGraficoBarras(idSvg, datosPorEtiqueta) {
  const svg = document.getElementById(idSvg);
  const etiquetas = Object.keys(datosPorEtiqueta);
  svg.innerHTML = "";

  if (etiquetas.length === 0) {
    svg.setAttribute("viewBox", "0 0 400 60");
    const texto = document.createElementNS(SVG_NS, "text");
    texto.setAttribute("x", "10");
    texto.setAttribute("y", "30");
    texto.textContent = "Aún no hay datos suficientes para graficar.";
    svg.appendChild(texto);
    return;
  }

  const valores = etiquetas.map(function (e) { return datosPorEtiqueta[e]; });
  const valorMaximo = Math.max.apply(null, valores);

  const anchoBarra = 60;
  const espacio = 20;
  const altoGrafico = 200;
  const margenInferior = 50;
  const margenSuperior = 20;
  const ancho = etiquetas.length * (anchoBarra + espacio) + espacio;
  const alto = altoGrafico + margenInferior;

  svg.setAttribute("viewBox", "0 0 " + ancho + " " + alto);

  const ejeX = document.createElementNS(SVG_NS, "line");
  ejeX.setAttribute("class", "eje");
  ejeX.setAttribute("x1", "0");
  ejeX.setAttribute("y1", String(margenSuperior + altoGrafico));
  ejeX.setAttribute("x2", String(ancho));
  ejeX.setAttribute("y2", String(margenSuperior + altoGrafico));
  svg.appendChild(ejeX);

  etiquetas.forEach(function (etiqueta, indice) {
    const valor = datosPorEtiqueta[etiqueta];
    const alturaBarra = valorMaximo > 0 ? (valor / valorMaximo) * (altoGrafico - 10) : 0;
    const x = espacio + indice * (anchoBarra + espacio);
    const y = margenSuperior + altoGrafico - alturaBarra;

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("class", "barra");
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(anchoBarra));
    rect.setAttribute("height", String(alturaBarra));
    rect.setAttribute("rx", "3");
    const titulo = document.createElementNS(SVG_NS, "title");
    titulo.textContent = etiqueta + ": " + valor;
    rect.appendChild(titulo);
    svg.appendChild(rect);

    const textoValor = document.createElementNS(SVG_NS, "text");
    textoValor.setAttribute("x", String(x + anchoBarra / 2));
    textoValor.setAttribute("y", String(y - 6));
    textoValor.setAttribute("text-anchor", "middle");
    textoValor.textContent = String(valor);
    svg.appendChild(textoValor);

    const textoEtiqueta = document.createElementNS(SVG_NS, "text");
    textoEtiqueta.setAttribute("x", String(x + anchoBarra / 2));
    textoEtiqueta.setAttribute("y", String(margenSuperior + altoGrafico + 18));
    textoEtiqueta.setAttribute("text-anchor", "middle");
    textoEtiqueta.textContent = etiqueta.length > 12 ? etiqueta.slice(0, 11) + "…" : etiqueta;
    svg.appendChild(textoEtiqueta);
  });
}

function contarPorClave(lista, obtenerClave) {
  const conteo = {};
  lista.forEach(function (elemento) {
    const clave = obtenerClave(elemento);
    conteo[clave] = (conteo[clave] || 0) + 1;
  });
  return conteo;
}

function obtenerEtiquetasUltimosMeses(cantidad) {
  const etiquetas = [];
  const fecha = new Date();
  fecha.setDate(1);
  for (let i = cantidad - 1; i >= 0; i--) {
    const f = new Date(fecha.getFullYear(), fecha.getMonth() - i, 1);
    const clave = f.getFullYear() + "-" + String(f.getMonth() + 1).padStart(2, "0");
    etiquetas.push(clave);
  }
  return etiquetas;
}

document.addEventListener("DOMContentLoaded", function () {
  const voluntarios = obtenerVoluntarios();
  const avistamientos = obtenerAvistamientos();

  document.getElementById("total-voluntarios").textContent = String(voluntarios.length);
  document.getElementById("total-avistamientos").textContent = String(avistamientos.length);
  document.getElementById("total-especies").textContent = String(new Set(avistamientos.map(function (a) { return a.nombreAve; })).size);
  document.getElementById("total-regiones").textContent = String(new Set(avistamientos.map(function (a) { return a.region; })).size);

  dibujarGraficoBarras("grafico-tipos", contarPorClave(avistamientos, function (a) { return a.tipoAve; }));
  dibujarGraficoBarras("grafico-regiones", contarPorClave(voluntarios, function (v) { return v.region; }));

  const etiquetasMeses = obtenerEtiquetasUltimosMeses(6);
  const conteoMeses = {};
  etiquetasMeses.forEach(function (mes) { conteoMeses[mes] = 0; });
  avistamientos.forEach(function (a) {
    const clave = a.fecha ? a.fecha.slice(0, 7) : null;
    if (clave && conteoMeses.hasOwnProperty(clave)) conteoMeses[clave]++;
  });
  dibujarGraficoBarras("grafico-meses", conteoMeses);
});
