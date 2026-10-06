from flask import Blueprint, render_template

from models import Avistamiento

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
    # Las métricas e indicadores quedan para la Tarea 3, según el enunciado.
    # Dejo la página y el link del menú ya armados para no tener que agregar
    # nada a la navegación después.
    return render_template("estadisticas.html", active="estadisticas")
