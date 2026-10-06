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

## Estructura

```
app.py                  # crea la app, registra blueprints, errorhandlers
config.py                # credenciales de BD, carpeta de uploads, límites
extensions.py             # instancia de SQLAlchemy
models.py                 # mapea 1 a 1 las tablas de tarea2.sql
validadores.py            # todas las reglas de validación de servidor
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
