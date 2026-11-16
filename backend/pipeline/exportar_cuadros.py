import json, sys
import astropy.units as u
import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from astropy.time import Time
from reproject import reproject_interp
from PIL import Image
import warnings
warnings.filterwarnings("ignore")
from comun import RAIZ, cargar
from motivos import motivo as motivo_registrado

slug = sys.argv[1]
o, c0, centro = cargar(slug)
ENTRADA = RAIZ / "raw" / slug
SALIDA = RAIZ / slug / "frames"
SALIDA.mkdir(parents=True, exist_ok=True)
N, PIX = 58, 6.15

ruta_json = RAIZ / slug / "datos.json"
try:
    datos_anteriores = json.loads(ruta_json.read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError):
    datos_anteriores = {}
latido_anterior = datos_anteriores.get("latido", [])

# Conservar la fotometría ya calculada para observaciones que sigan presentes.
# exportar_cuadros reconstruye los recortes, pero no debe borrar el latido que
# genera pipeline/latido.py al volver a ejecutarse.
datos_json = dict(
    slug=slug, nombre=o["nombre"], tipo=o["tipo"],
    centro={"ra_deg": round(centro.ra.deg, 6), "dec_deg": round(centro.dec.deg, 6)},
    fov_arcmin=round(N * PIX / 60, 2), pixel_arcsec=PIX, tamano_px=N,
    estado="ok", motivo="", motivo_codigo="", cuadros=[], latido=[],
    rastro={"desplazamiento_arcsec": None, "direccion_deg": None,
            "incertidumbre_arcsec": None, "pm_publicado_arcsec_yr": round(float(np.hypot(o["pm_ra_cosdec_mas_yr"], o["pm_dec_mas_yr"])) / 1000, 3)},
    revelar={"snr_vs_cuadros": []},
    conocido={"estado": "sin_datos", "coincidencias": []},
)

def guardar():
    (RAIZ / slug / "datos.json").write_text(
        json.dumps(datos_json, ensure_ascii=False, indent=2), encoding="utf-8")


archivos = sorted(ENTRADA.glob("*.fits")) if ENTRADA.exists() else []
if not archivos:
    datos_json["estado"] = "sin_datos"
    datos_json.update(motivo_registrado("sin_cuadros"))
    guardar()
    raise SystemExit("Sin recortes: se guardó datos.json con estado sin_datos.")

# Grilla común: norte arriba, este a la izquierda
dest = WCS(naxis=2)
dest.wcs.ctype = ["RA---TAN", "DEC--TAN"]
dest.wcs.crval = [centro.ra.deg, centro.dec.deg]
dest.wcs.crpix = [(N + 1) / 2, (N + 1) / 2]
dest.wcs.cdelt = [-PIX / 3600, PIX / 3600]

cuadros = []
for ruta in archivos:
    with fits.open(ruta) as h:
        hdr = h["IMAGE"].header
        datos = h["IMAGE"].data.astype(float)
        fecha = hdr["DATE-AVG"]
        wcs_img = WCS(hdr, fobj=h)
        img, _ = reproject_interp((datos, wcs_img), dest, shape_out=(N, N))
        # Longitud de onda en el pixel del FITS original donde cae la estrella
        try:
            pos_obs = c0.apply_space_motion(new_obstime=Time(fecha))
            xr, yr = [float(t) for t in wcs_img.world_to_pixel(pos_obs)]
            ny, nx = datos.shape
            xr = min(max(xr, 0), nx - 1)
            yr = min(max(yr, 0), ny - 1)
            lam = WCS(hdr, fobj=h, key="W").pixel_to_world(xr, yr)
            longitud_onda = round(float(lam[0].to_value(u.um)), 4)
            ancho_banda = round(float(lam[1].to_value(u.um)), 4)
        except Exception as e:
            print(f"  aviso: no pude leer la longitud de onda de {ruta.name}: {e}")
            longitud_onda, ancho_banda = None, None
    cuadros.append(dict(fecha=fecha, img=img, lam=longitud_onda, ancho=ancho_banda))
cuadros.sort(key=lambda c: c["fecha"])

# Escala de brillo única para todas las fechas.
#
# Los parámetros de abajo definen el asinh y se registran en datos.json
# (bloque 'visualizacion') para que la presentación sea auditable.
ASINH_SIGMA = 5.0        # cuántos sigma de ruido entran antes de comprimir
PERCENTIL_TOPE = 99.99   # recorte de píxeles calientes al fijar el máximo

todo = np.concatenate([c["img"][np.isfinite(c["img"])] for c in cuadros])
lo = np.median(todo)
sigma = 1.4826 * np.median(np.abs(todo - lo))
hi = np.percentile(todo, PERCENTIL_TOPE)
soft = max(ASINH_SIGMA * sigma, 1e-6)
den = np.arcsinh((hi - lo) / soft)

print(f"  asinh: lo={lo:.2f} hi={hi:.2f} soft={soft:.2f} "
      f"({ASINH_SIGMA} sigma, tope p{PERCENTIL_TOPE})")


def snr_en(img, x, y):
    xi, yi = int(round(x)), int(round(y))
    if not (0 <= xi < N and 0 <= yi < N):
        return None
    ventana = img[max(0, yi-1):yi+2, max(0, xi-1):xi+2]
    if not np.isfinite(ventana).any():
        return None
    fondo = np.nanmedian(img)
    s = 1.4826 * np.nanmedian(np.abs(img - fondo))
    return float((np.nanmax(ventana) - fondo) / s) if s > 0 else None


for f in SALIDA.glob("*.png"):
    f.unlink()

print(f"{slug}: {len(cuadros)} cuadros")
for i, c in enumerate(cuadros):
    img = c["img"]
    v = np.clip(np.arcsinh((np.nan_to_num(img, nan=lo) - lo) / soft) / den, 0, 1)
    nombre = f"{i:04d}.png"
    Image.fromarray((np.flipud(v) * 255).astype(np.uint8), mode="L").save(SALIDA / nombre)

    pos = c0.apply_space_motion(new_obstime=Time(c["fecha"]))
    x, y = [float(t) for t in dest.world_to_pixel(pos)]
    snr = snr_en(img, x, y)
    cobertura_pct = round(float(np.isfinite(img).mean()) * 100, 1)

    datos_json["cuadros"].append(dict(
        fecha=c["fecha"][:19] + "Z",
        url=f"/media/{slug}/frames/{nombre}",
        longitud_onda_um=c["lam"],
        ancho_banda_um=c["ancho"],
        cobertura_pct=cobertura_pct,
        calidad_ok=bool(cobertura_pct >= 90),
        pos_esperada_px={"x": round(x, 2), "y": round(N - 1 - y, 2)},
        snr_en_posicion=None if snr is None else round(snr, 1),
    ))
    print(f"  {c['fecha'][:10]}  señal en la posición esperada: "
          f"{'sin dato' if snr is None else f'{snr:.1f} sigma'}")

fechas_cuadros = {cuadro["fecha"][:19] for cuadro in datos_json["cuadros"]}
if isinstance(latido_anterior, list):
    datos_json["latido"] = [
        punto for punto in latido_anterior
        if isinstance(punto, dict)
        and isinstance(punto.get("fecha"), str)
        and punto["fecha"][:19] in fechas_cuadros
    ]

# Registro auditable de la visualización aplicada a los PNG.
# El valor escalar guardado es un asinh con estos parámetros; sin este bloque
# no se podría saber con qué escala se generó cada imagen.
datos_json["visualizacion"] = {
    "metodo": "asinh",
    "asinh_sigma": ASINH_SIGMA,
    "percentil_tope": PERCENTIL_TOPE,
    "rango": {"lo": round(float(lo), 3), "hi": round(float(hi), 3),
              "soft": round(float(soft), 3)},
    "cuadros_procesados": len(cuadros),
    "nota": (
        "Escala de presentación calculada sobre todos los cuadros del objeto "
        "para que un cambio de brillo real no se confunda con un cambio de escala."
    ),
    "version": 1,
}

guardar()
print("Listo:", RAIZ / slug)