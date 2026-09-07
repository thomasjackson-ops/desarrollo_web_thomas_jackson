# Aves de Chile — Tarea 1 (CC5002)

Prototipo del sistema de registro de avistamientos de aves para la Unión de Ornitólogos de Chile. Es solo HTML5 + CSS3 + JavaScript, sin backend, tal como pide el enunciado. Se abre directo con el navegador desde `index.html`, no necesita servidor.

## Páginas

- `index.html` — inicio, con accesos directos a cada parte del sistema.
- `registro-voluntario.html` — registro de voluntario(a).
- `registrar-avistamiento.html` — registrar un avistamiento.
- `listado-avistamientos.html` — listado con filtro, orden y paginación.
- `estadisticas.html` — indicadores y gráficos.

El CSS está todo en `css/estilos.css` y el JS lo separé por archivo según lo que hace cada uno (datos de Chile, datos de aves, "base de datos" en localStorage, validaciones, y un archivo por página con la lógica propia de esa página).

## Cosas que decidí yo y que quiero dejar anotadas para la corrección

**Por qué uso localStorage si el enunciado dice que no hace falta guardar nada.** Literalmente no es obligatorio, pero si no guardaba nada la demo se sentía rota: me registro, cambio de página, y ya no existo. Entonces usé `localStorage` para voluntarios y avistamientos. Todo vive en el navegador, no hay ningún servidor ni backend de por medio, es solo para que la navegación se sienta completa al probarla. Además, la primera vez que se abre el sitio se cargan solos algunos voluntarios y avistamientos de ejemplo (función `sembrarDatosDemo` en `js/almacenamiento.js`), para no tener que llenar el listado a mano antes de poder mostrar el filtro/orden/paginación/gráficos.

**Cómo relaciono el avistamiento con el voluntario, sin inventar un login.**
Al principio hice un sistema de login con contraseña, pero revisando el enunciado de nuevo me di cuenta que eso no lo pedían — piden datos para identificar y contactar al voluntario, no un sistema de autenticación. Lo saqué. Lo que sí exige el enunciado es que sea un "voluntario registrado" quien informa, así que en `registrar-avistamiento.html` hay un select "¿Quién informa?" que se llena con los voluntarios ya registrados (si no hay ninguno, la página pide registrarse primero). Para que no haya que rebuscarlo en la lista cada vez, guardo en `sessionStorage` cuál fue el último voluntario que informó algo en esta pestaña y lo dejo preseleccionado
— es solo una comodidad, se pierde al cerrar la pestaña,no es autenticación de ningún tipo.
**Validaciones todas en JavaScript, nada de confiar en `required`.** Están todas juntas en `js/validaciones.js`:

- Nombre/apellido: solo letras (con tildes y ñ), entre 2 y 50 caracteres.
- Email: formato típico `algo@algo.algo`.
- Celular: tiene que venir como `+56 9 XXXXXXXX`.
- RUT (es opcional): si lo escriben, se calcula el dígito verificador de verdad con el algoritmo módulo 11, no solo el formato.
- Fecha de nacimiento (opcional): entre 15 y 110 años, no puede ser futura.
- Fecha del avistamiento: no puede ser futura ni tener más de 5 años (esto lo saqué del ejemplo que dan en el enunciado).
- Hora: formato válido.
- Foto/video: obligatorio adjuntar al menos uno, se revisa que sea imagen o video y que no pese más de 20 MB. El archivo no se sube a ningún lado ni se guarda de verdad, solo registro su nombre — total, tampoco hay dónde subirlo sin backend.

**Región/comuna y tipo/ave con selects dependientes.** Metí las 16 regiones de Chile con sus comunas en `js/datos-chile.js`, y al elegir región se llena solo el select de comuna. Mismo patrón para tipo de ave → nombre del ave (`js/datos-aves.js`), que también es el que usa el filtro del listado.

**El listado (`js/listado.js`)** junta los avistamientos sembrados con los que voy agregando, y ahí mismo en el cliente aplico el filtro por tipo, el orden (por fecha o por lugar, ambos sentidos) y la paginación con tamaño de página elegible.

**Los gráficos son SVG hechos a mano en JS**, sin ninguna librería externa (no quería depender de un CDN para algo tan simple, y así también me aseguraba de no meter errores raros al validador de HTML/CSS).

**Sobre el HTML.** Traté de usar harto tag semántico (`header`, `nav`, `main`, `section`, `article`, `footer`, `fieldset`/`legend` para agrupar los formularios, `table` con `caption`/`thead`/`tbody`) y evitar `div` metidos porque sí. Los formularios y las páginas las probé con el validador de W3C (HTML y CSS) y no me quedó ningún error.

## Para probar

Basta con abrir `index.html`. Si quieren ver el listado o las estadísticas con contenido sin registrarse, ya vienen datos de ejemplo cargados solos. Para probar el flujo completo: regístrate en `registro-voluntario.html`, eso te deja disponible en el select "¿Quién informa?" de
`registrar-avistamiento.html`.
