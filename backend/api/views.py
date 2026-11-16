import json
from pathlib import Path

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from pipeline.catalogo import (
    cargar_catalogo,
    obtener_objeto,
    ObjetoNoEncontradoError,
    ErrorCatalogo,
)
from pipeline.astrometria import calcular_posicion
from pipeline.motivos import normalizar as normalizar_motivo

DATA = Path(settings.BASE_DIR) / "data"


def _leer(slug):
    ruta = DATA / slug / "datos.json"
    if ruta.exists():
        return json.loads(ruta.read_text(encoding="utf-8"))
    return None


def _no_encontrado(slug):
    return JsonResponse(
        {"error": "objeto_desconocido",
         "mensaje": "Ese objeto no está en Nawi.",
         "slug": slug},
        status=404)


@require_GET
def estado_api(request):
    return JsonResponse({"estado": "ok", "mensaje": "API de Nawi funcionando", "version": "1.0"})


@require_GET
def lista_objetos(request):
    try:
        objetos = cargar_catalogo()["objetos"]
    except ErrorCatalogo as error:
        return JsonResponse({"error": str(error)}, status=500)
    salida = []
    for slug, o in objetos.items():
        d = _leer(slug)
        salida.append({
            "slug": slug,
            "nombre": o.get("nombre", slug),
            "tipo": o.get("tipo"),
            "rol": o.get("rol"),
            "fov_arcmin": o.get("fov_arcmin"),
            "estado": d.get("estado", "ok") if d else "sin_datos",
            "cantidad_cuadros": len(d.get("cuadros", [])) if d else 0,
        })
    return JsonResponse(salida, safe=False)


@require_GET
def detalle_objeto(request, slug):
    try:
        o = obtener_objeto(slug)
    except ObjetoNoEncontradoError:
        return _no_encontrado(slug)
    except ErrorCatalogo as error:
        return JsonResponse({"error": str(error)}, status=500)
    d = _leer(slug)
    if d is None:
        ficha = {"slug": slug, "nombre": o.get("nombre", slug), "tipo": o.get("tipo"),
                 "estado": "sin_datos", "cuadros": [], "latido": []}
        ficha.update(normalizar_motivo("", "sin_datos"))
        return JsonResponse(ficha)
    d.setdefault("estado", "ok")
    d.setdefault("latido", [])
    # Convención: si el registro trae motivo pero no código (dato viejo), se deduce
    # del texto; nunca se inventa uno nuevo.
    d.update(normalizar_motivo(d.get("motivo"), d.get("motivo_codigo")))
    return JsonResponse(d)


@require_GET
def catalogo_objeto(request, slug):
    try:
        return JsonResponse({"slug": slug, **obtener_objeto(slug)})
    except ObjetoNoEncontradoError:
        return _no_encontrado(slug)
    except ErrorCatalogo as error:
        return JsonResponse({"error": str(error)}, status=500)


@require_GET
def posicion_objeto(request, slug):
    fecha = request.GET.get("fecha")
    if not fecha:
        return JsonResponse(
            {"error": "Falta el parámetro obligatorio: fecha (YYYY-MM-DD)"}, status=400)
    try:
        return JsonResponse(calcular_posicion(slug, fecha))
    except ObjetoNoEncontradoError:
        return _no_encontrado(slug)
    except ErrorCatalogo as error:
        return JsonResponse({"error": str(error)}, status=500)
    except (ValueError, TypeError, OverflowError) as error:
        return JsonResponse(
            {"error": f"No se pudo calcular la posición: {error}"}, status=400)