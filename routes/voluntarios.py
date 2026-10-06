from flask import Blueprint, redirect, render_template, request, url_for

from extensions import db
from models import Comuna, Region, Voluntario
from validadores import validar_email, validar_nombre, validar_telefono

bp = Blueprint("voluntarios", __name__, url_prefix="/voluntarios")


def _regiones_para_formulario():
    """Arma {region_id: {"nombre": ..., "comunas": [{"id":, "nombre":}, ...]}}
    para mandarlo como JSON al template y que el JS arme el select de
    comuna dependiente del de región, igual que en la Tarea 1 (ahí el dato
    salía de un objeto hardcodeado en JS; acá sale de la base de datos)."""
    regiones = Region.query.order_by(Region.nombre).all()
    return {
        region.id: {
            "nombre": region.nombre,
            "comunas": [{"id": c.id, "nombre": c.nombre} for c in region.comunas],
        }
        for region in regiones
    }


@bp.route("/nuevo", methods=["GET", "POST"])
def nuevo():
    regiones = Region.query.order_by(Region.nombre).all()
    regiones_json = _regiones_para_formulario()

    if request.method == "GET":
        return render_template(
            "voluntario_form.html",
            active="voluntario",
            regiones=regiones,
            regiones_json=regiones_json,
            valores={},
            errores={},
        )

    # --- POST: validación del lado del servidor ---
    valores = {
        "nombre": request.form.get("nombre", ""),
        "email": request.form.get("email", ""),
        "telefono": request.form.get("telefono", ""),
        "region": request.form.get("region", ""),
        "comuna": request.form.get("comuna", ""),
    }
    comuna_id = request.form.get("comuna", type=int)  # None si no es un entero válido
    errores = {}

    if not validar_nombre(valores["nombre"]):
        errores["nombre"] = "Ingresa un nombre válido (solo letras, entre 2 y 255 caracteres)."

    if not validar_email(valores["email"]):
        errores["email"] = "Ingresa un correo electrónico con formato válido."
    elif Voluntario.query.filter_by(email=valores["email"].strip()).first() is not None:
        errores["email"] = "Ya existe un voluntario registrado con este correo."

    if not validar_telefono(valores["telefono"]):
        errores["telefono"] = "Ingresa un celular con formato +56 9 XXXXXXXX."

    comuna = Comuna.query.get(comuna_id) if comuna_id is not None else None
    if comuna is None:
        errores["comuna"] = "Selecciona una región y una comuna válidas."

    if errores:
        return render_template(
            "voluntario_form.html",
            active="voluntario",
            regiones=regiones,
            regiones_json=regiones_json,
            valores=valores,
            errores=errores,
        ), 400

    voluntario = Voluntario(
        nombre=valores["nombre"].strip(),
        email=valores["email"].strip(),
        telefono=valores["telefono"].strip(),
        comuna_id=comuna.id,
    )
    db.session.add(voluntario)
    db.session.commit()

    # Patrón POST/Redirect/GET: si la persona refresca la página de éxito,
    # no se vuelve a insertar el mismo voluntario.
    return redirect(url_for("voluntarios.exito", voluntario_id=voluntario.id))


@bp.route("/exito/<int:voluntario_id>")
def exito(voluntario_id):
    voluntario = Voluntario.query.get_or_404(voluntario_id)
    return render_template("voluntario_exito.html", active="voluntario", voluntario=voluntario)
