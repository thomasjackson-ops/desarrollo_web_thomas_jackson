# Aves de Chile — Tarea 3 (CC5002)

Backend en Flask + SQLAlchemy + MySQL. Sobre lo que ya estaba hecho en la
Tarea 2 (registro de voluntario, registro de avistamiento con archivos,
listado paginado/filtrado/con detalle) esta entrega agrega las
estadísticas con gráficos y los comentarios en el detalle de cada
avistamiento.

## Cómo correrlo

```bash
python -m venv venv
venv\Scripts\activate          # en Windows
pip install -r requirements.txt
```

Antes de levantar la app hay que tener MySQL corriendo en `localhost:3306`
y cargar la base de datos con los 3 scripts de `bdds_y_modelorelacional/`,
en este orden (el primero ya crea el usuario `cc5002`/`programacionweb` que
exige el enunciado):

```bash
mysql -u root < bdds_y_modelorelacional/tarea2.sql
mysql -u root tarea2 --default-character-set=utf8 < bdds_y_modelorelacional/region-comuna.sql
mysql -u root tarea2 --default-character-set=utf8 < bdds_y_modelorelacional/aves.sql
mysql -u root tarea2 < bdds_y_modelorelacional/tabla-comentario.sql
```

El último script es nuevo de esta tarea: agrega la tabla `comentario` sobre
la misma base de datos de la Tarea 2, no toca nada de lo que ya existía.

Lo del `--default-character-set=utf8` no es opcional: si se cargan esos dos
archivos sin especificarlo, el cliente de mysql asume otro charset y los
acentos quedan guardados corruptos (tipo "Regi├│n" en vez de "Región"). Por
la misma razón la URI de conexión en `config.py` lleva `?charset=utf8mb4`.

Y después:

```bash
python app.py
```

Abre `http://127.0.0.1:5000/`.

## Decisiones y detalles a tener en cuenta

**El esquema de `tarea2.sql` no se tocó.** Los modelos de `models.py`
mapean tabla por tabla, columna por columna, exactamente como viene ese
script. No se usa `db.create_all()` en ningún lado: la base de datos se
arma corriendo los 3 scripts que dieron, la app solo se conecta y los usa
con SQLAlchemy.

**El formulario de voluntario quedó recortado respecto a la Tarea 1 para
calzar con el modelo real.** La tabla `voluntario` solo tiene `nombre` (un
campo, no nombres/apellidos separados), `email`, `telefono` y `comuna_id`
— no hay columnas para RUT, fecha de nacimiento ni dirección (calle/
número), que sí estaban en la Tarea 1. En vez de forzar el modelo para
soportar campos que no pedían, el formulario se ajustó al esquema que
dieron. `fecha_registro` la pone el propio servidor (`default=datetime.now`
en el modelo) en el momento del insert, tal como pide el enunciado.

**No existe "tipo de ave".** La tabla `ave` solo tiene `nombre` (585
especies cargadas desde `aves.sql`, sin ninguna categoría), así que el
formulario de avistamiento usa un `<input list>` (datalist nativo de
HTML5) con las 585 especies, y el listado filtra directo por ave en vez de
por "tipo".

**`fecha_hora` es una sola columna DATETIME.** El formulario sigue pidiendo
fecha y hora por separado (dos inputs, mejor UX), pero se combinan en el
servidor antes de guardar (`combinar_fecha_hora` en `validadores.py`).

**Las validaciones existen dos veces.** Las de JavaScript de la Tarea 1 se
mantienen, adaptadas al nuevo set de campos (sin RUT, sin fecha de
nacimiento, sin "tipo de ave") y sirven para el feedback inmediato en el
formulario. Pero el cliente se puede saltar sin problema (JS deshabilitado,
un POST armado a mano con curl, etc.), así que cada regla se vuelve a
chequear en el servidor, en `validadores.py`: nombres con números, emails
mal formados, teléfonos fuera de formato, fechas futuras, aves que no
existen, descripciones muy largas, archivos con extensión no permitida,
todo se rechaza igual aunque no pase por el navegador.

**Patrón POST/Redirect/GET.** Tanto el registro de voluntario como el de
avistamiento, si salen bien, terminan en un redirect (no en un render
directo del resultado), para que si la persona refresca la página no se
vuelva a insertar el mismo registro. El de voluntario redirige a una
página de éxito con las dos opciones que pide el enunciado ("registrar un
avistamiento para este voluntario" o "volver al inicio"); el de
avistamiento redirige directo a la portada con un mensaje flash, como pide
el enunciado.

**Los archivos se guardan de verdad, uno por fila en `registro`.** Cuando
se sube más de un archivo en un mismo avistamiento, cada uno genera su
propia fila en `registro` (la tabla está pensada para eso: `avistamiento_id`
se repite). Se guardan en `static/uploads/<id_avistamiento>/<nombre
aleatorio>.<extensión>` — el nombre en disco es un UUID para que nadie
pueda sobrescribir el archivo de otro avistamiento jugando con el nombre
original, pero `nombre_archivo` en la base de datos guarda el nombre real
que subió la persona (ese es el que se muestra en la interfaz). El insert
del avistamiento y el de sus archivos van en la misma transacción
(`db.session.flush()` para tener el id antes de guardar los archivos en
disco, y si algo falla a mitad de camino se hace rollback).

**Sobre entradas maliciosas.** Las consultas pasan todas por el ORM de
SQLAlchemy, nunca se concatenan strings para armar SQL. El criterio de
orden del listado (`?orden=...`) tampoco se interpola directo: hay un
diccionario fijo de valores permitidos y cualquier otra cosa cae al valor
por defecto. Los IDs en la URL (`/avistamientos/<int:id>`) usan el
conversor `<int:...>` de Flask, que ya rechaza con 404 cualquier cosa que
no sea un entero. Los parámetros de query (`?pagina=`, `?ave_id=`,
`?por_pagina=`) se leen con `request.args.get(..., type=int)` y caen a un
valor por defecto si vienen vacíos, negativos o no numéricos. Jinja2
escapa por defecto todo lo que se imprime con `{{ }}`, así que tampoco hay
XSS vía nombre, lugar o descripción. Y para los archivos: se valida
extensión (lista blanca) y tamaño máximo antes de guardar nada en disco, y
el nombre con el que se guardan en el filesystem nunca es el que mandó el
usuario (`secure_filename` + UUID), para evitar path traversal.

## Decisiones de la Tarea 3

**La torta agrupa por especie, no por "tipo de ave".** El enunciado pide
un gráfico "por tipo de ave", pero la tabla `ave` (igual que en la T2)
solo tiene `nombre`, sin ninguna columna de categoría. Preferí no meterle
una columna al esquema que dieron ni inventar una clasificación para 585
especies que el curso nunca definió, así que la torta agrupa por
`ave.nombre` no mas, que es la única clasificación real que existe en los
datos.

**Los 3 gráficos piden su data por separado con `fetch`.**
`static/js/estadisticas.js` hace un fetch a cada uno de los 3 endpoints
JSON que agregué en `routes/main.py` (`/estadisticas/datos/avistamientos-por-dia`,
`-por-ave` y `/estadisticas/datos/voluntarios-por-comuna`) y dibuja los
gráficos con esa respuesta. El servidor nunca arma HTML para esto, solo
devuelve JSON con una consulta agregada (GROUP BY + COUNT) por gráfico.

**Librería de gráficos: Chart.js.** No es ninguna de las dos que nombra el
enunciado (Flot/Highcharts), pero entra en "u otras para la cual tenga
derecho de uso": es MIT, gratis para cualquier uso, y se carga desde CDN
(cdn.jsdelivr.net) en `estadisticas.html`. La elegí por ser mas liviana que
Flot (no depende de jQuery) y por no tener las restricciones de licencia
comercial que tiene Highcharts para uso no educacional.

**Agregar y listar comentarios son 100% asíncronos**, tal como pide el
enunciado — ninguno de los dos pasa por un render de Jinja. Al cargar
`detalle.html`, `comentarios.js` hace un fetch GET a
`/avistamientos/<id>/comentarios` para pintar el listado, y al enviar el
formulario hace un fetch POST a esa misma URL. Después de un alta exitosa
se vuelve a pedir la lista entera, así aparece el comentario nuevo sin
recargar la página.

**El nombre del comentarista no tiene regla de "solo letras".** El
enunciado pide exactamente "obligatorio con largo mínimo 3 y máximo 50",
nada más — a diferencia del nombre del voluntario (que sí exige solo
letras, porque esa regla la definí yo desde la Tarea 1 y no venía en
ningún enunciado). Acá me ceñí estricto a lo que pedían y no le agregué
una restricción de mas.

**Ojo con el XSS en los comentarios.** A diferencia del resto del sitio
(donde todo pasa por Jinja2, que escapa automático), el texto de un
comentario lo inserta en el DOM `comentarios.js` directamente, porque
llega por fetch como JSON. Por eso el listado se arma con `textContent` (y
`createElement`/`createTextNode`), nunca con `innerHTML` concatenando el
texto — si no, cualquiera podría dejar un comentario con `<script>` y se
ejecutaría en el navegador de quien abra ese avistamiento después. Lo
probé a propósito mandando un comentario con `<script>alert(1)</script>` y
confirmé que queda como texto plano, no se ejecuta.

## Estructura

```
app.py                  # crea la app, registra blueprints, errorhandlers
config.py                # credenciales de BD, carpeta de uploads, límites
extensions.py             # instancia de SQLAlchemy
models.py                 # mapea 1 a 1 las tablas de tarea2 (+ comentario)
validadores.py            # todas las reglas de validación de servidor
routes/
  main.py                 # portada + estadísticas (página y los 3 endpoints JSON)
  voluntarios.py           # registrar voluntario
  avistamientos.py          # avistamiento (alta/listado/detalle) + comentarios (JSON)
templates/                # Jinja2, heredan de base.html
static/css/estilos.css     # mismo sistema visual desde la Tarea 1
static/js/
  validaciones.js           # reglas de validación compartidas en el cliente
  region-comuna.js           # cascading select región→comuna
  voluntario.js               # validación del formulario de voluntario
  avistamiento.js              # validación del formulario de avistamiento
  listado.js                    # fila clickeable del listado
  estadisticas.js                 # fetch a los 3 endpoints + Chart.js
  comentarios.js                   # fetch GET/POST de comentarios (async)
static/uploads/             # fotos/video subidos (no se suben al repo)
bdds_y_modelorelacional/     # los .sql que dio el curso + los enunciados
```
