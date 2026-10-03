"""
Todas las validaciones "de verdad" del lado del servidor. Son casi un
calco de las que ya tenía en JavaScript en la Tarea 1 (mismos regex, mismas
reglas de fecha), porque la idea es que el servidor no confíe en nada de lo
que mande el cliente: alguien podría mandar el POST directo con curl, con
el JS deshabilitado, o con el formulario manipulado, así que cada regla se
vuelve a chequear acá antes de tocar la base de datos.
"""
import os
import re
from datetime import datetime, timedelta

NOMBRE_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+(?:[ '\-][A-Za-zÁÉÍÓÚÑÜáéíóúñü]+)*$")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$")
TELEFONO_RE = re.compile(r"^\+56\s?9\s?\d{4}\s?\d{4}$")


def validar_nombre(valor):
    valor = (valor or "").strip()
    return bool(valor) and 2 <= len(valor) <= 255 and bool(NOMBRE_RE.match(valor))


def validar_email(valor):
    valor = (valor or "").strip()
    return bool(valor) and len(valor) <= 80 and bool(EMAIL_RE.match(valor))


def validar_telefono(valor):
    valor = (valor or "").strip()
    return bool(valor) and len(valor) <= 15 and bool(TELEFONO_RE.match(valor))


def validar_lugar(valor):
    valor = (valor or "").strip()
    return bool(valor) and len(valor) <= 200


def validar_descripcion(valor):
    # Es opcional, por eso una cadena vacía también es válida.
    valor = (valor or "").strip()
    return len(valor) <= 500


def combinar_fecha_hora(fecha_texto, hora_texto):
    """Junta los inputs separados <input type=date> + <input type=time> del
    formulario en un solo datetime (la tabla avistamiento tiene una sola
    columna fecha_hora). Devuelve None si vienen vacíos o mal formados en
    vez de reventar con una excepción no capturada."""
    if not fecha_texto or not hora_texto:
        return None
    try:
        return datetime.strptime(f"{fecha_texto} {hora_texto}", "%Y-%m-%d %H:%M")
    except ValueError:
        return None


def validar_fecha_hora_avistamiento(fecha_hora):
    """No puede ser futura ni tener más de 5 años, mismo criterio que usé
    en la Tarea 1."""
    if fecha_hora is None:
        return False
    ahora = datetime.now()
    if fecha_hora > ahora:
        return False
    limite_inferior = ahora - timedelta(days=5 * 365)
    return fecha_hora >= limite_inferior


def extension_archivo(nombre_archivo):
    if "." not in nombre_archivo:
        return ""
    return nombre_archivo.rsplit(".", 1)[1].lower()


def validar_archivos(archivos, extensiones_permitidas, tamano_maximo_mb):
    """archivos: lista de FileStorage (de request.files.getlist(...)).
    Se filtran los "vacíos" que manda el navegador cuando el <input
    multiple> no tiene nada seleccionado. Devuelve (True, lista_valida) o
    (False, mensaje_de_error)."""
    archivos_reales = [a for a in archivos if a and a.filename]
    if not archivos_reales:
        return False, "Debes adjuntar al menos una foto o un video."

    for archivo in archivos_reales:
        extension = extension_archivo(archivo.filename)
        if extension not in extensiones_permitidas:
            return False, f'El archivo "{archivo.filename}" no es una foto o video permitido.'

        archivo.stream.seek(0, os.SEEK_END)
        tamano_bytes = archivo.stream.tell()
        archivo.stream.seek(0)
        if tamano_bytes > tamano_maximo_mb * 1024 * 1024:
            return False, f'El archivo "{archivo.filename}" supera los {tamano_maximo_mb} MB permitidos.'
        if tamano_bytes == 0:
            return False, f'El archivo "{archivo.filename}" está vacío.'

    return True, archivos_reales
