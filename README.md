# Aves de Chile — Tarea 4 (CC5002)

El grueso del sitio (registro de voluntario, avistamientos con archivos,
listado, gráficos, comentarios) sigue siendo el Flask + SQLAlchemy de las
tareas 2 y 3, sin tocar. Esta entrega agrega, aparte, un buscador de
avistamientos y un sistema de notas — y el enunciado pide explícito que
esto nuevo se haga con **Spring Boot + JPA**, asi que es un proyecto Java
corriendo al lado, independiente, conversando con la misma base de datos.

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
mysql -u root tarea2 < bdds_y_modelorelacional/tabla-nota.sql
```

El penultimo script es de la Tarea 3 (tabla `comentario`), el último es
nuevo de esta tarea (tabla `nota`). Los dos son aditivos, ninguno toca lo
que ya existía.

Lo del `--default-character-set=utf8` no es opcional: si se cargan esos dos
archivos sin especificarlo, el cliente de mysql asume otro charset y los
acentos quedan guardados corruptos (tipo "Regi├│n" en vez de "Región"). Por
la misma razón la URI de conexión en `config.py` lleva `?charset=utf8mb4`.

Y después, Flask de siempre:

```bash
python app.py
```

Abre `http://127.0.0.1:5000/`.

Y en otra terminal, el proyecto de Spring Boot (usa su propio wrapper de
Maven, no hace falta tener Maven instalado):

```bash
cd buscador-notas
./mvnw spring-boot:run      # en Windows: mvnw.cmd spring-boot:run
```

Abre `http://127.0.0.1:8080/`. Necesita Java 17 o más nuevo — tarda un rato
la primera vez porque el wrapper se descarga Maven y las dependencias de
Spring.

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

## Decisiones de la Tarea 4

**Por qué Spring Boot quedó como proyecto aparte y no reescribí todo lo
anterior.** El enunciado pide que lo NUEVO (buscador + notas) se haga con
Spring Boot, pero no pide ni pondera portar de nuevo el registro de
voluntario, los archivos, los comentarios ni los gráficos — eso ya estaba
hecho y funcionando en Flask. Reescribir todo el sitio en Java hubiese sido
varias veces mas trabajo que lo que esta tarea pondera, y el enunciado en
ningún momento lo pide, así que `buscador-notas/` es un proyecto Spring
Boot chico e independiente, que conversa con la misma base de datos
`tarea2` (mismas credenciales de siempre) y corre aparte en el puerto 8080.
Flask (puerto 5000) y Spring Boot se enlazan entre sí con un link en el
menú, como si fueran dos secciones del mismo sitio — porque en la práctica
lo son.

**Entidades JPA mínimas.** Solo mapeé `Comuna`, `Voluntario`, `Ave`,
`Avistamiento` y `Nota` — ni `Registro` ni `Comentario` hacen falta para
esta funcionalidad, así que no los recreé en Java. Tampoco mapeé `Region`
(el buscador no necesita mostrarla). `Nota` es la única entidad en la que
de verdad se escribe.

**El buscador es en vivo, con debounce de 300ms.** El enunciado pide que la
búsqueda arranque sola apenas la persona empieza a escribir, sin botón. Si
mandara un fetch por cada letra tecleada sería un poco bruto (y mas con
585 aves en la tabla), así que `buscador.js` espera 300ms de silencio
después de la última tecla antes de preguntarle al servidor. Esto no lo
pide el enunciado explícito, es una decisión mía de rendimiento.

**La búsqueda es por substring, sin acentos ni mayúsculas de por medio.**
`LOWER(columna) LIKE :patron` en JPQL, con el patrón armado en el
servidor (`%texto%`) y pasado como parámetro, nunca concatenado a mano —
mismo criterio anti-inyección que ya veníamos aplicando en Flask. Busca a
la vez en ave, voluntario y comuna; si el texto calza con cualquiera de
los 3, el avistamiento aparece.

**El resaltado (`<mark>`) se arma en el cliente, con nodos de texto, no con
innerHTML.** Los nombres que se resaltan vienen de la base de datos y los
escribió una persona real al registrarse (el nombre de un voluntario, por
ejemplo) — si se armara la fila concatenando strings en innerHTML, alguien
con un nombre tipo `<script>` podría ejecutar código en el navegador de
cualquiera que buscara después. `buscador.js` corta el string en 3 pedazos
(antes/coincide/después) y arma cada uno como nodo de texto aparte,
envolviendo solo el que coincide en un `<mark>`.

**La nota se valida en 3 capas.** El `<select>` del HTML solo ofrece 1 a 7
(no se puede mandar un número fuera de rango desde la interfaz), el DTO
`NuevaNotaRequest` lo revalida con Bean Validation (`@Min`/`@Max`) por si
llega un POST hecho a mano, y si ni siquiera llega un número (JSON mal
formado) hay un manejador de excepción aparte para que el error sea legible
y no el stacktrace gigante que tira Spring por defecto.

**El promedio no se guarda en ninguna parte, se recalcula siempre.** La
tabla `nota` solo guarda notas individuales (una fila por evaluación); el
promedio es un `AVG()` que se calcula al vuelo cada vez que se necesita
—al buscar, y de nuevo después de insertar una nota nueva—, para no tener
que mantener sincronizado un campo "promedio" en otra tabla.

## Estructura (Flask)

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

## Estructura (Spring Boot, carpeta `buscador-notas/`)

```
pom.xml                              # Maven, incluye el wrapper (mvnw) así no hace falta tener Maven instalado
src/main/resources/
  application.properties              # datasource MySQL, mismo tarea2 de siempre, puerto 8080
  static/
    index.html                         # la pagina del buscador (input + tabla de resultados)
    css/estilos.css                     # copia del mismo estilo del resto del sitio
    js/buscador.js                       # busqueda en vivo, resaltado, y el flujo de evaluar
src/main/java/cl/avesdechile/buscadornotas/
  modelo/                               # entidades JPA: Comuna, Voluntario, Ave, Avistamiento, Nota
  repositorio/                           # interfaces Spring Data JPA (ahi vive el @Query del buscador)
  dto/                                    # lo que viaja como JSON (ResultadoBusqueda, NuevaNotaRequest, etc)
  controlador/
    BuscadorController.java               # GET /api/avistamientos/buscar
    NotaController.java                    # POST /api/avistamientos/{id}/notas
```
