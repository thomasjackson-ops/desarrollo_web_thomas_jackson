from flask import Blueprint, jsonify, render_template

from extensions import db
from models import Avistamiento, Ave, Comuna, Voluntario

bp = Blueprint("main", __name__)


@bp.route("/")
def portada():
    # "los últimos 2 avistamientos agregados en la base de datos": ordeno
    # por id descendente (el autoincremental refleja el orden de inserción),
    # no por fecha_hora del avistamiento, que es un dato que escribe el
    # propio voluntario y no tiene por qué coincidir con cuándo se agregó.
    ultimos_avistamientos = (
        Avistamiento.query.order_by(Avistamiento.id.desc()).limit(2).all()
    )
    return render_template(
        "index.html", active="inicio", ultimos_avistamientos=ultimos_avistamientos
    )


@bp.route("/estadisticas")
def estadisticas():
    return render_template("estadisticas.html", active="estadisticas")


# --- De aca para abajo son endpoints de datos para los gráficos, los ---
# --- consume estadisticas.js por fetch, no se usan directo en ningún template ---

@bp.route("/estadisticas/datos/avistamientos-por-dia")
def datos_avistamientos_por_dia():
    # avistamiento no tiene una columna de "fecha en que se agregó", asi
    # que agrupo por el día de fecha_hora (la fecha del avistamiento en si)
    dia = db.func.date(Avistamiento.fecha_hora)
    filas = (
        db.session.query(dia.label("dia"), db.func.count(Avistamiento.id))
        .group_by(dia)
        .order_by(dia)
        .all()
    )
    return jsonify([
        {"dia": d.strftime("%d-%m-%Y") if hasattr(d, "strftime") else str(d), "cantidad": c}
        for d, c in filas
    ])


@bp.route("/estadisticas/datos/avistamientos-por-ave")
def datos_avistamientos_por_ave():
    # El modelo de datos no trae un "tipo" de ave (la tabla ave solo tiene
    # nombre), asi que la torta agrupa por especie, que es la única
    # clasificación que existe de verdad en la base de datos
    filas = (
        db.session.query(Ave.nombre, db.func.count(Avistamiento.id))
        .join(Avistamiento, Avistamiento.ave_id == Ave.id)
        .group_by(Ave.id)
        .order_by(db.func.count(Avistamiento.id).desc())
        .all()
    )
    return jsonify([{"ave": nombre, "cantidad": cantidad} for nombre, cantidad in filas])


@bp.route("/estadisticas/datos/voluntarios-por-comuna")
def datos_voluntarios_por_comuna():
    filas = (
        db.session.query(Comuna.nombre, db.func.count(Voluntario.id))
        .join(Voluntario, Voluntario.comuna_id == Comuna.id)
        .group_by(Comuna.id)
        .order_by(db.func.count(Voluntario.id).desc())
        .all()
    )
    return jsonify([{"comuna": nombre, "cantidad": cantidad} for nombre, cantidad in filas])
