import os
import uuid

from flask import Blueprint, current_app, flash, redirect, render_template, request, url_for
from werkzeug.utils import secure_filename

from extensions import db
from models import Ave, Avistamiento, Registro, Voluntario
from validadores import (
    combinar_fecha_hora,
    validar_archivos,
    validar_descripcion,
    validar_fecha_hora_avistamiento,
    validar_lugar,
)

bp = Blueprint("avistamientos", __name__, url_prefix="/avistamientos")

# Mapeo fijo de "valor del parámetro de la URL" -> columna real de orden.
# Nunca interpolo el parámetro "orden" directo en la consulta: si no está
# en este diccionario, caigo al valor por defecto. Esto evita que alguien
# use ?orden=lo-que-sea para intentar meter SQL donde no corresponde.
CRITERIOS_ORDEN = {
    "fecha_desc": Avistamiento.fecha_hora.desc(),
    "fecha_asc": Avistamiento.fecha_hora.asc(),
    "lugar_asc": Avistamiento.lugar.asc(),
    "lugar_desc": Avistamiento.lugar.desc(),
}
TAMANOS_PAGINA_PERMITIDOS = {5, 10, 20}


def _guardar_archivos(archivos_validos, avistamiento_id):
    """Guarda los archivos de verdad en static/uploads/<id_avistamiento>/ y
    devuelve la lista de objetos Registro (todavía sin agregar a la sesión).
    Uso un nombre de archivo random (uuid) para guardarlo en disco -evita
    colisiones y que alguien intente sobreescribir otro archivo jugando con
    el nombre- pero conservo el nombre original del archivo en
    nombre_archivo, que es el que se muestra en la interfaz."""
    carpeta_destino = os.path.join(current_app.config["UPLOAD_FOLDER"], str(avistamiento_id))
    os.makedirs(carpeta_destino, exist_ok=True)

    registros = []
    for archivo in archivos_validos:
        nombre_original = secure_filename(archivo.filename) or "archivo"
        extension = nombre_original.rsplit(".", 1)[-1].lower() if "." in nombre_original else ""
        nombre_en_disco = f"{uuid.uuid4().hex}.{extension}" if extension else uuid.uuid4().hex
        ruta_absoluta = os.path.join(carpeta_destino, nombre_en_disco)
        archivo.save(ruta_absoluta)

        ruta_relativa = f"uploads/{avistamiento_id}/{nombre_en_disco}"
        registros.append(Registro(ruta_archivo=ruta_relativa, nombre_archivo=nombre_original))
    return registros


@bp.route("/nuevo", methods=["GET", "POST"])
def nuevo():
    voluntarios = Voluntario.query.order_by(Voluntario.nombre).all()
    if not voluntarios:
        return render_template("avistamiento_sin_voluntarios.html", active="avistamiento")

    aves = Ave.query.order_by(Ave.nombre).all()
    voluntario_preseleccionado = request.args.get("voluntario_id", type=int)

    if request.method == "GET":
        return render_template(
            "avistamiento_form.html",
            active="avistamiento",
            voluntarios=voluntarios,
            aves=aves,
            valores={"voluntario": voluntario_preseleccionado},
            errores={},
        )

    # --- POST: validación del lado del servidor ---
    valores = {
        "voluntario": request.form.get("voluntario", ""),
        "ave": request.form.get("ave", "").strip(),
        "lugar": request.form.get("lugar", ""),
        "fecha": request.form.get("fecha", ""),
        "hora": request.form.get("hora", ""),
        "descripcion": request.form.get("descripcion", ""),
    }
    voluntario_id = request.form.get("voluntario", type=int)
    errores = {}

    voluntario = Voluntario.query.get(voluntario_id) if voluntario_id is not None else None
    if voluntario is None:
        errores["voluntario"] = "Selecciona quién está informando el avistamiento."

    # El nombre del ave viene de un <input list> (datalist) con las 585
    # especies de la tabla "ave": no hay combo con id, así que busco por
    # nombre exacto (sin distinguir mayúsculas) y uso ese id.
    ave = None
    if valores["ave"]:
        ave = Ave.query.filter(db.func.lower(Ave.nombre) == valores["ave"].lower()).first()
    if ave is None:
        errores["ave"] = "Selecciona un ave de la lista (escribe el nombre y elige una opción)."

    if not validar_lugar(valores["lugar"]):
        errores["lugar"] = "Ingresa el lugar del avistamiento (máximo 200 caracteres)."

    fecha_hora = combinar_fecha_hora(valores["fecha"], valores["hora"])
    if not validar_fecha_hora_avistamiento(fecha_hora):
        errores["fecha"] = "La fecha y hora no pueden ser futuras ni tener más de 5 años de antigüedad."

    if not validar_descripcion(valores["descripcion"]):
        errores["descripcion"] = "La descripción no puede superar los 500 caracteres."

    archivos_subidos = request.files.getlist("archivo")
    archivos_ok, resultado_archivos = validar_archivos(
        archivos_subidos,
        current_app.config["EXTENSIONES_PERMITIDAS"],
        current_app.config["TAMANO_MAXIMO_ARCHIVO_MB"],
    )
    if not archivos_ok:
        errores["archivo"] = resultado_archivos  # acá resultado_archivos es el mensaje de error

    if errores:
        return render_template(
            "avistamiento_form.html",
            active="avistamiento",
            voluntarios=voluntarios,
            aves=aves,
            valores=valores,
            errores=errores,
        ), 400

    archivos_validos = resultado_archivos  # acá sí es la lista de FileStorage válidos

    try:
        avistamiento = Avistamiento(
            voluntario_id=voluntario.id,
            ave_id=ave.id,
            fecha_hora=fecha_hora,
            lugar=valores["lugar"].strip(),
            descripcion=valores["descripcion"].strip() or None,
        )
        db.session.add(avistamiento)
        db.session.flush()  # necesito el id ya asignado para nombrar la carpeta de archivos

        registros = _guardar_archivos(archivos_validos, avistamiento.id)
        for registro in registros:
            registro.avistamiento_id = avistamiento.id
            db.session.add(registro)

        db.session.commit()
    except Exception:
        db.session.rollback()
        flash("Ocurrió un error guardando el avistamiento. Intenta nuevamente.", "error")
        return render_template(
            "avistamiento_form.html",
            active="avistamiento",
            voluntarios=voluntarios,
            aves=aves,
            valores=valores,
            errores={},
        ), 500

    flash("¡Avistamiento registrado correctamente!", "exito")
    return redirect(url_for("main.portada"))


@bp.route("")
def listado():
    pagina = request.args.get("pagina", 1, type=int) or 1
    if pagina < 1:
        pagina = 1

    por_pagina = request.args.get("por_pagina", 10, type=int)
    if por_pagina not in TAMANOS_PAGINA_PERMITIDOS:
        por_pagina = 10

    ave_id = request.args.get("ave_id", type=int)
    orden_parametro = request.args.get("orden", "fecha_desc")
    orden = CRITERIOS_ORDEN.get(orden_parametro, CRITERIOS_ORDEN["fecha_desc"])
    if orden_parametro not in CRITERIOS_ORDEN:
        orden_parametro = "fecha_desc"

    consulta = Avistamiento.query
    ave_filtro = None
    if ave_id is not None:
        ave_filtro = Ave.query.get(ave_id)
        if ave_filtro is not None:
            consulta = consulta.filter(Avistamiento.ave_id == ave_id)

    consulta = consulta.order_by(orden)
    paginacion = consulta.paginate(page=pagina, per_page=por_pagina, error_out=False)

    aves_con_avistamientos = (
        Ave.query.join(Avistamiento).distinct().order_by(Ave.nombre).all()
    )

    return render_template(
        "listado.html",
        active="listado",
        paginacion=paginacion,
        avistamientos=paginacion.items,
        aves_con_avistamientos=aves_con_avistamientos,
        ave_filtro=ave_filtro,
        orden_actual=orden_parametro,
        por_pagina=por_pagina,
    )


@bp.route("/<int:avistamiento_id>")
def detalle(avistamiento_id):
    avistamiento = Avistamiento.query.get_or_404(avistamiento_id)
    return render_template("detalle.html", active="listado", avistamiento=avistamiento)
