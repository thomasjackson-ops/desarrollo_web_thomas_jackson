import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class Config:
    # Credenciales fijas que exige el enunciado de la Tarea 2. Las dejo con
    # un valor por defecto hardcodeado (en vez de solo leerlas de variables
    # de entorno) porque el enunciado pide exactamente este host/puerto/
    # usuario/clave, y así el proyecto corre "out of the box" al clonarlo.
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2?charset=utf8mb4",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Clave para firmar la sesión (se usa para flash messages). No hay nada
    # sensible guardado en sesión en este prototipo, así que no me compliqué
    # con manejarla por variable de entorno.
    SECRET_KEY = os.environ.get("SECRET_KEY", "cc5002-tarea2-aves-de-chile")

    # Carpeta donde quedan guardadas de verdad las fotos/videos subidos.
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
    EXTENSIONES_PERMITIDAS = {"jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "webm", "ogg"}
    TAMANO_MAXIMO_ARCHIVO_MB = 20

    # Límite global de Flask para el tamaño del request completo (algo de
    # margen por si se suben varios archivos cercanos al máximo individual).
    MAX_CONTENT_LENGTH = 80 * 1024 * 1024

    AVISTAMIENTOS_POR_PAGINA = 10
