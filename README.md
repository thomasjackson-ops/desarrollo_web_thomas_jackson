# Aves de Chile — Tarea 2 (CC5002)

Backend en Flask + SQLAlchemy + MySQL para las funcionalidades de registro
de voluntario, registro de avistamiento (con archivos de verdad) y listado
paginado/filtrado/con detalle, construido sobre el prototipo de la Tarea 1.
Las estadísticas quedan para la Tarea 3, según el enunciado.

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
```

Y después:

```bash
python app.py
```

Abre `http://127.0.0.1:5000/`.

## Decisiones que tomé y por qué (para la entrevista)

**No toqué el esquema que dieron (`tarea2.sql`).** Los modelos de
`models.py` mapean tabla por tabla, columna por columna, exactamente como
viene ese script. No llamo `db.create_all()` en ningún lado: la base de
datos se arma corriendo los 3 scripts que dieron, la app solo se conecta y
los usa con SQLAlchemy.

**Recorté el formulario de voluntario de la Tarea 1 para que calzara con
el modelo real.** La tabla `voluntario` solo tiene `nombre` (un campo, no
nombres/apellidos separados), `email`, `telefono` y `comuna_id` — no hay
columnas para RUT, fecha de nacimiento ni dirección (calle/número), que sí
había inventado en la Tarea 1. En vez de forzar el modelo para que
soportara campos que no pedían, preferí ajustar el formulario al modelo
real que me dieron. `fecha_registro` la pone el propio servidor
(`default=datetime.now` en el modelo) en el momento del insert, tal como
pide el enunciado.

**Saqué el concepto de "tipo de ave" que había inventado en la Tarea 1.**
La tabla `ave` solo tiene `nombre` (585 especies cargadas desde `aves.sql`,
sin ninguna categoría). En vez de inventarme yo una clasificación que no
está en los datos, el formulario de avistamiento usa un `<input list>`
(datalist nativo de HTML5) con las 585 especies, y el listado filtra
directo por ave en vez de por "tipo".

**`fecha_hora` es una sola columna DATETIME.** El formulario sigue pidiendo
fecha y hora por separado (dos inputs, mejor UX), pero se combinan en el
servidor antes de guardar (`combinar_fecha_hora` en `validadores.py`).

**Las validaciones de JavaScript de la Tarea 1 se mantienen**, adaptadas al
nuevo set de campos (sin RUT, sin fecha de nacimiento, sin "tipo de ave").
Pero el enunciado pide explícitamente validar también en el servidor, así
que **cada regla existe dos veces**: una en `static/js/validaciones.js`
(UX, feedback inmediato) y la misma regla de nuevo en `validadores.py`
(la que de verdad importa, porque el cliente se puede saltar). Lo probé
mandando requests directo con Python sin pasar por el navegador —
fingiendo que alguien deshabilitó el JS o mandó el POST con curl — y el
servidor rechaza todo igual: nombres con números, emails mal formados,
teléfonos fuera de formato, fechas futuras, aves que no existen,
descripciones muy largas, archivos con extensión no permitida, etc.

**Patrón POST/Redirect/GET.** Tanto el registro de voluntario como el de
avistamiento, si salen bien, terminan en un redirect (no en un render
directo del resultado), para que si la persona refresca la página no se
vuelva a insertar el mismo registro. El de voluntario redirige a una
página de éxito con las dos opciones que pide el enunciado ("registrar un
avistamiento para este voluntario" o "volver al inicio"); el de
avistamiento redirige directo a la portada con un mensaje flash, como pide
el enunciado.

**Archivos: se guardan de verdad, uno por fila en `registro`.** Cuando se
sube más de un archivo en un mismo avistamiento, cada uno genera su propia
fila en `registro` (la tabla está pensada para eso: `avistamiento_id` se
repite). Los guardo en `static/uploads/<id_avistamiento>/<nombre
aleatorio>.<extensión>` — el nombre en disco es un UUID para que nadie
pueda sobrescribir el archivo de otro avistamiento jugando con el nombre
original, pero `nombre_archivo` en la base de datos guarda el nombre real
que subió la persona (ese es el que se muestra en la interfaz). El insert
del avistamiento y el de sus archivos van en la misma transacción
(`db.session.flush()` para tener el id antes de guardar los archivos en
disco, y si algo falla a mitad de camino hago rollback).

**Entradas maliciosas.** Lo que probé explícitamente:
- *Inyección SQL*: todas las consultas pasan por el ORM de SQLAlchemy
  (nunca concateno strings para armar SQL). Además, el criterio de orden
  del listado (`?orden=...`) nunca se interpola directo: hay un
  diccionario fijo de valores permitidos y cualquier otra cosa cae al
  valor por defecto.
- *IDs en la URL* (`/avistamientos/<int:id>`): el conversor `<int:...>` de
  Flask ya rechaza con 404 cualquier cosa que no sea un entero, antes de
  que el código de la ruta llegue a ejecutarse.
- *Parámetros de query manipulados* (`?pagina=-5`, `?pagina=abc`,
  `?ave_id=abc`, `?por_pagina=99999`, etc.): todos se leen con
  `request.args.get(..., type=int)` y se les pone un valor por defecto si
  vienen vacíos, negativos o no numéricos, en vez de dejar que truene.
- *XSS*: Jinja2 escapa por defecto todo lo que se imprime con `{{ }}`, así
  que un nombre con `<script>` no se ejecuta aunque de algún modo quedara
  guardado (en la práctica ni siquiera llega a guardarse: el validador de
  nombre solo acepta letras).
- *Archivos*: se valida la extensión contra una lista blanca y el tamaño
  máximo (20 MB) ANTES de guardar nada en disco, y el nombre con el que se
  guarda en el filesystem nunca es el que mandó el usuario
  (`secure_filename` + UUID), para evitar path traversal.

**Un bug real que encontré probando esto:** al cargar `region-comuna.sql` y
`aves.sql` por primera vez con el cliente `mysql` sin especificar charset,
los acentos quedaron guardados corruptos (mojibake tipo "Regi├│n"), porque
el cliente asumió un charset distinto al UTF-8 del archivo. Por eso en las
instrucciones de arriba agrego `--default-character-set=utf8` al cargar
esos dos scripts, y en `config.py` dejé la URI de conexión con
`?charset=utf8mb4` explícito para que tampoco pase al insertar datos nuevos
desde la propia app.

**Probé todo esto con una base MySQL real** (no con SQLite ni con mocks):
instalé una copia portable de MySQL 8.0 localmente, cargué los 3 scripts
tal cual los dieron, y corrí un script de pruebas con `requests` que
registra voluntarios y avistamientos (válidos e inválidos), sube archivos
de verdad, navega la paginación con más de una página de resultados,
filtra y ordena, y prueba varios de los ataques descritos arriba. Las 6
páginas renderizadas (portada, los 2 formularios con y sin errores, la
página de éxito, el listado con 2 páginas de datos, el detalle con
evidencia, y una 404) también pasan limpias por el validador de HTML5/CSS3
de W3C.

## Estructura

```
app.py                  # crea la app, registra blueprints, errorhandlers
config.py                # credenciales de BD, carpeta de uploads, límites
extensions.py             # instancia de SQLAlchemy
models.py                 # mapea 1 a 1 las tablas de tarea2.sql
validadores.py            # TODAS las reglas de validación de servidor
routes/
  main.py                 # portada + placeholder de estadísticas
  voluntarios.py           # registrar voluntario
  avistamientos.py          # informar avistamiento, listado, detalle
templates/                # Jinja2, heredan de base.html
static/css/estilos.css     # mismo sistema visual que la Tarea 1
static/js/                 # validaciones de cliente + cascading selects
static/uploads/             # fotos/video subidos (no se suben al repo)
bdds_y_modelorelacional/     # los 3 .sql que dio el curso + el diagrama
```
