// Los 3 gráficos piden su data por separado con fetch a los endpoints que
// armé en routes/main.py (devuelven json), y Chart.js se encarga de
// dibujarlos sobre cada <canvas>. Nada de esto se arma en el servidor.

const COLOR_PRIMARIO = "#2f6f4e";
const PALETA = ["#2f6f4e", "#3f7fa6", "#b3261e", "#c98a2b", "#6b4fa0", "#1e6b3a", "#8a8d29", "#a63f7f"];

document.addEventListener("DOMContentLoaded", function () {
  cargarGraficoLinea();
  cargarGraficoTorta();
  cargarGraficoBarras();
});

function cargarGraficoLinea() {
  fetch("/estadisticas/datos/avistamientos-por-dia")
    .then(function (resp) { return resp.json(); })
    .then(function (datos) {
      new Chart(document.getElementById("grafico-dia"), {
        type: "line",
        data: {
          labels: datos.map(function (d) { return d.dia; }),
          datasets: [{
            label: "Avistamientos",
            data: datos.map(function (d) { return d.cantidad; }),
            borderColor: COLOR_PRIMARIO,
            backgroundColor: COLOR_PRIMARIO,
            tension: 0.2
          }]
        },
        options: {
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    });
}

function cargarGraficoTorta() {
  fetch("/estadisticas/datos/avistamientos-por-ave")
    .then(function (resp) { return resp.json(); })
    .then(function (datos) {
      new Chart(document.getElementById("grafico-ave"), {
        type: "pie",
        data: {
          labels: datos.map(function (d) { return d.ave; }),
          datasets: [{
            data: datos.map(function (d) { return d.cantidad; }),
            backgroundColor: datos.map(function (_, i) { return PALETA[i % PALETA.length]; })
          }]
        },
        options: { maintainAspectRatio: false }
      });
    });
}

function cargarGraficoBarras() {
  fetch("/estadisticas/datos/voluntarios-por-comuna")
    .then(function (resp) { return resp.json(); })
    .then(function (datos) {
      new Chart(document.getElementById("grafico-comuna"), {
        type: "bar",
        data: {
          labels: datos.map(function (d) { return d.comuna; }),
          datasets: [{
            label: "Voluntarios",
            data: datos.map(function (d) { return d.cantidad; }),
            backgroundColor: COLOR_PRIMARIO
          }]
        },
        options: {
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    });
}
