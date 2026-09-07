// El enunciado dice que no es necesario guardar los datos que ingresa el
// usuario, pero para que la demo se sienta "real" (poder registrarme, iniciar
// sesión, informar un avistamiento y verlo después en el listado y en las
// estadísticas) decidí usar localStorage/sessionStorage. Todo queda guardado
// solo en el navegador, no hay ningún servidor detrás.
const CLAVE_VOLUNTARIOS = "aves_voluntarios";
const CLAVE_AVISTAMIENTOS = "aves_avistamientos";
const CLAVE_VOLUNTARIO_ACTIVO = "aves_voluntario_activo";
const CLAVE_SEMILLA = "aves_semilla_v1";

function obtenerVoluntarios() {
  return JSON.parse(localStorage.getItem(CLAVE_VOLUNTARIOS) || "[]");
}

function guardarVoluntario(voluntario) {
  const lista = obtenerVoluntarios();
  lista.push(voluntario);
  localStorage.setItem(CLAVE_VOLUNTARIOS, JSON.stringify(lista));
}

function buscarVoluntarioPorEmail(email) {
  return obtenerVoluntarios().find(function (v) {
    return v.email.toLowerCase() === email.toLowerCase();
  });
}

function obtenerAvistamientos() {
  return JSON.parse(localStorage.getItem(CLAVE_AVISTAMIENTOS) || "[]");
}

function guardarAvistamiento(avistamiento) {
  const lista = obtenerAvistamientos();
  lista.push(avistamiento);
  localStorage.setItem(CLAVE_AVISTAMIENTOS, JSON.stringify(lista));
}

// No hay login ni contraseña: esto es solo para que, si ya informaste un
// avistamiento antes en esta misma pestaña, el formulario te proponga de
// nuevo tu nombre en vez de dejar el select en blanco cada vez. Se guarda
// en sessionStorage (se pierde al cerrar la pestaña), no es autenticación.
function recordarVoluntarioActivo(email) {
  sessionStorage.setItem(CLAVE_VOLUNTARIO_ACTIVO, email);
}

function obtenerVoluntarioActivoEmail() {
  return sessionStorage.getItem(CLAVE_VOLUNTARIO_ACTIVO);
}

// Crea un par de voluntarios y avistamientos de ejemplo la primera vez que
// se abre el sitio, para no tener que llenar todo a mano antes de poder
// probar el filtro, el orden, la paginación y los gráficos.
function sembrarDatosDemo() {
  if (localStorage.getItem(CLAVE_SEMILLA)) return;

  const voluntariosDemo = [
    { nombres: "Camila", apellidos: "Rojas", email: "camila.rojas@demo.cl", celular: "+56 9 12345678", region: "Metropolitana de Santiago", comuna: "Ñuñoa" },
    { nombres: "Benjamín", apellidos: "Soto", email: "benjamin.soto@demo.cl", celular: "+56 9 23456789", region: "Valparaíso", comuna: "Viña del Mar" },
    { nombres: "Florencia", apellidos: "Muñoz", email: "florencia.munoz@demo.cl", celular: "+56 9 34567890", region: "Biobío", comuna: "Concepción" },
    { nombres: "Tomás", apellidos: "Pizarro", email: "tomas.pizarro@demo.cl", celular: "+56 9 45678901", region: "Los Lagos", comuna: "Puerto Varas" },
    { nombres: "Isidora", apellidos: "Contreras", email: "isidora.contreras@demo.cl", celular: "+56 9 56789012", region: "Coquimbo", comuna: "La Serena" },
    { nombres: "Matías", apellidos: "Fuentes", email: "matias.fuentes@demo.cl", celular: "+56 9 67890123", region: "La Araucanía", comuna: "Temuco" }
  ].map(function (v) {
    return Object.assign({}, v, { fechaRegistro: new Date().toISOString() });
  });
  voluntariosDemo.forEach(guardarVoluntario);

  const avistamientosDemo = [
    { tipoAve: "Acuática", nombreAve: "Cisne de cuello negro", region: "Los Lagos", comuna: "Puerto Varas", lugar: "Humedal Río Maullín", fecha: "2026-06-02", hora: "08:30", cantidad: 4, descripcion: "Grupo alimentándose cerca de la orilla.", archivoNombre: "cisnes.jpg", archivoTipo: "image/jpeg", voluntarioEmail: "tomas.pizarro@demo.cl" },
    { tipoAve: "Rapaz", nombreAve: "Águila mora", region: "Biobío", comuna: "Concepción", lugar: "Cerro Caracol", fecha: "2026-05-20", hora: "11:15", cantidad: 1, descripcion: "Sobrevolando el sector alto del cerro.", archivoNombre: "aguila.mp4", archivoTipo: "video/mp4", voluntarioEmail: "florencia.munoz@demo.cl" },
    { tipoAve: "Paseriforme", nombreAve: "Loica", region: "Coquimbo", comuna: "La Serena", lugar: "Parque Pedro de Valdivia", fecha: "2026-07-10", hora: "09:00", cantidad: 2, descripcion: "", archivoNombre: "loica.jpg", archivoTipo: "image/jpeg", voluntarioEmail: "isidora.contreras@demo.cl" },
    { tipoAve: "Zancuda", nombreAve: "Bandurria", region: "Metropolitana de Santiago", comuna: "La Reina", lugar: "Parque Mahuida", fecha: "2026-04-18", hora: "17:45", cantidad: 6, descripcion: "Bandada sobre el sendero principal.", archivoNombre: "bandurrias.jpg", archivoTipo: "image/jpeg", voluntarioEmail: "camila.rojas@demo.cl" },
    { tipoAve: "Otra", nombreAve: "Pingüino de Humboldt", region: "Valparaíso", comuna: "Algarrobo", lugar: "Isla de Algarrobo", fecha: "2026-03-05", hora: "16:20", cantidad: 12, descripcion: "Colonia visible desde el mirador costero.", archivoNombre: "pinguinos.jpg", archivoTipo: "image/jpeg", voluntarioEmail: "benjamin.soto@demo.cl" },
    { tipoAve: "Acuática", nombreAve: "Flamenco chileno", region: "La Araucanía", comuna: "Temuco", lugar: "Laguna Xoloco", fecha: "2026-06-28", hora: "07:50", cantidad: 3, descripcion: "", archivoNombre: "flamencos.mp4", archivoTipo: "video/mp4", voluntarioEmail: "matias.fuentes@demo.cl" },
    { tipoAve: "Rapaz", nombreAve: "Tiuque", region: "Metropolitana de Santiago", comuna: "Providencia", lugar: "Parque Bustamante", fecha: "2026-07-22", hora: "13:10", cantidad: 2, descripcion: "Posados sobre un poste de luz.", archivoNombre: "tiuques.jpg", archivoTipo: "image/jpeg", voluntarioEmail: "camila.rojas@demo.cl" },
    { tipoAve: "Paseriforme", nombreAve: "Chincol", region: "Valparaíso", comuna: "Quilpué", lugar: "Plaza de Armas", fecha: "2026-08-01", hora: "10:05", cantidad: 5, descripcion: "", archivoNombre: "chincoles.jpg", archivoTipo: "image/jpeg", voluntarioEmail: "benjamin.soto@demo.cl" },
    { tipoAve: "Zancuda", nombreAve: "Garza grande", region: "Los Lagos", comuna: "Osorno", lugar: "Río Rahue", fecha: "2026-02-14", hora: "18:30", cantidad: 1, descripcion: "Pescando en la orilla del río.", archivoNombre: "garza.jpg", archivoTipo: "image/jpeg", voluntarioEmail: "tomas.pizarro@demo.cl" },
    { tipoAve: "Otra", nombreAve: "Picaflor gigante", region: "Coquimbo", comuna: "Ovalle", lugar: "Valle del Encanto", fecha: "2026-08-10", hora: "12:40", cantidad: 1, descripcion: "Visitando flores de un chagual.", archivoNombre: "picaflor.jpg", archivoTipo: "image/jpeg", voluntarioEmail: "isidora.contreras@demo.cl" }
  ].map(function (a) {
    return Object.assign({}, a, { fechaRegistro: new Date().toISOString() });
  });
  avistamientosDemo.forEach(guardarAvistamiento);

  localStorage.setItem(CLAVE_SEMILLA, "1");
}
