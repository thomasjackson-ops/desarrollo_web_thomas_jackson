from flask import Flask, render_template

from config import Config
from extensions import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    # los imports van aca adentro y no arriba del archivo para evitar lios de
    # import circular (routes/*.py termina importando cosas que dependen de
    # que la app ya exista)
    from routes.main import bp as main_bp
    from routes.voluntarios import bp as voluntarios_bp
    from routes.avistamientos import bp as avistamientos_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(voluntarios_bp)
    app.register_blueprint(avistamientos_bp)

    @app.template_filter("fecha_larga")
    def fecha_larga(valor):
        """dd/mm/aaaa hh:mm, para no repetir el formato en cada template."""
        if valor is None:
            return ""
        return valor.strftime("%d-%m-%Y %H:%M")

    # Manejadores de error propios, para que incluso un 404 o un archivo
    # demasiado pesado se vean con el mismo estilo del sitio y no la
    # pantalla de error por defecto de Flask.
    @app.errorhandler(404)
    def no_encontrado(_error):
        return render_template("error.html", titulo="Página no encontrada", codigo=404), 404

    @app.errorhandler(413)
    def archivo_muy_grande(_error):
        return render_template(
            "error.html",
            titulo="El archivo (o archivos) enviados son demasiado grandes",
            codigo=413,
        ), 413

    @app.errorhandler(500)
    def error_interno(_error):
        return render_template("error.html", titulo="Ocurrió un error inesperado", codigo=500), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
