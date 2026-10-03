from datetime import datetime

from extensions import db

# Estos modelos mapean EXACTAMENTE las tablas que ya vienen creadas por
# bdds_y_modelorelacional/tarea2.sql (nombres de tabla y de columna tal
# cual). No uso db.create_all() en ninguna parte: la base de datos se arma
# corriendo ese script (y después region-comuna.sql y aves.sql), tal como
# indica el enunciado. Estos modelos solo describen esa estructura para
# poder consultarla/insertarla con SQLAlchemy en vez de escribir SQL a mano.


class Region(db.Model):
    __tablename__ = "region"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)

    comunas = db.relationship("Comuna", backref="region", lazy=True, order_by="Comuna.nombre")


class Comuna(db.Model):
    __tablename__ = "comuna"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    region_id = db.Column(db.Integer, db.ForeignKey("region.id"), nullable=False)

    voluntarios = db.relationship("Voluntario", backref="comuna", lazy=True)


class Voluntario(db.Model):
    __tablename__ = "voluntario"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(80), nullable=False)
    telefono = db.Column(db.String(15), nullable=False)
    fecha_registro = db.Column(db.DateTime, nullable=False, default=datetime.now)
    comuna_id = db.Column(db.Integer, db.ForeignKey("comuna.id"), nullable=False)

    avistamientos = db.relationship("Avistamiento", backref="voluntario", lazy=True)


class Ave(db.Model):
    __tablename__ = "ave"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(80), nullable=False)

    avistamientos = db.relationship("Avistamiento", backref="ave", lazy=True)


class Avistamiento(db.Model):
    __tablename__ = "avistamiento"

    id = db.Column(db.Integer, primary_key=True)
    voluntario_id = db.Column(db.Integer, db.ForeignKey("voluntario.id"), nullable=False)
    ave_id = db.Column(db.Integer, db.ForeignKey("ave.id"), nullable=False)
    fecha_hora = db.Column(db.DateTime, nullable=False)
    lugar = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)

    # Un avistamiento puede traer más de una foto/video: cada archivo es
    # una fila aparte en "registro". Si alguna vez se borra un avistamiento
    # de prueba, que se vayan sus registros con él (cascade).
    registros = db.relationship(
        "Registro", backref="avistamiento", lazy=True, cascade="all, delete-orphan"
    )


class Registro(db.Model):
    __tablename__ = "registro"

    id = db.Column(db.Integer, primary_key=True)
    ruta_archivo = db.Column(db.String(300), nullable=False)
    nombre_archivo = db.Column(db.String(300), nullable=False)
    avistamiento_id = db.Column(db.Integer, db.ForeignKey("avistamiento.id"), nullable=False)

    @property
    def es_video(self):
        extension = self.nombre_archivo.rsplit(".", 1)[-1].lower() if "." in self.nombre_archivo else ""
        return extension in {"mp4", "mov", "webm", "ogg"}
