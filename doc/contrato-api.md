# Contrato de API — Nawi (frontend ↔ backend)

**Estado:** implementado y en uso. Este documento reemplaza la propuesta original
(que decía que los endpoints no existían).
Verificado el **2026-11-15** contra `backend/api/urls.py` y el servidor real en
`http://127.0.0.1:8010`.

- Backend: Django (`DEBUG=True` en desarrollo) + `astropy` para astrometría.
- CORS habilitado para `http://localhost:5178` y `http://127.0.0.1:5178`
  (el frontend de Nawi). También 5173 por compatibilidad histórica.
- Respuestas en JSON UTF-8, salvo los PNG de `/media/`.
- No hay autenticación: la API es de lectura y abierta en desarrollo.

---

## Objetos y slugs

Cinco objetos fijos. El `slug` es la clave estable que viaja en la URL del frontend
(`?obj=`); no debe cambiar sin avisar.

| slug | nombre | tipo |
|---|---|---|
| `barnard` | Estrella de Barnard | `estrella_movimiento_propio` |
| `wise-0855` | WISE 0855-0714 | `enana_marron_Y` |
| `epsilon-indi-b` | Epsilon Indi B | `enana_marron` |
| `rw-aurigae` | RW Aurigae | `estrella_variable` |
| `r-draconis` | R Draconis | `estrella_variable` |

`rol` es `principal` o `secundario` y el frontend solo lo usa para mostrar texto.

---

## 1. `GET /api/estado/`

Ping del servicio.

```json
{ "estado": "ok", "mensaje": "API de NAWI funcionando", "version": "1.1" }
```

---

## 2. `GET /api/objetos/`

Array plano, uno por objeto, con lo necesario para pintar el selector.

```json
[
  {
    "slug": "barnard",
    "nombre": "Estrella de Barnard",
    "tipo": "estrella_movimiento_propio",
    "rol": "principal",
    "fov_arcmin": 5.95,
    "ra_deg": 269.448503,
    "dec_deg": 4.73942,
    "epoca": "J2016.0",
    "pm_ra_cosdec_mas_yr": -801.551,
    "pm_dec_mas_yr": 10362.394,
    "astrometria_disponible": true,
    "estado": "ok",
    "cantidad_cuadros": 9
  }
]
```

| Campo | Tipo | Notas |
|---|---|---|
| `ra_deg`, `dec_deg` | number \| null | Posición de referencia publicada por el backend (no la calcula el frontend) |
| `epoca` | string \| null | Época de referencia (`J2016.0`, etc.) |
| `pm_ra_cosdec_mas_yr`, `pm_dec_mas_yr` | number \| null | Movimiento propio publicado |
| `astrometria_disponible` | boolean | Si el objeto tiene bloque de astrometría |
| `estado` | `ok` \| `sin_datos` | Estado del objeto según sus datos precalculados |
| `cantidad_cuadros` | integer | Cantidad de recortes disponibles |

---

## 3. `GET /api/objetos/<slug>/`

Ficha completa del objeto: catálogo, astrometría, recortes, curva de brillo y
análisis precalculados.

```json
{
  "slug": "rw-aurigae",
  "nombre": "RW Aurigae",
  "tipo": "estrella_variable",
  "rol": "secundario",
  "centro": { "ra_deg": 76.956587, "dec_deg": 30.401291 },
  "fov_arcmin": 5.95,
  "pixel_arcsec": 6.15,
  "tamano_px": 58,
  "estado": "ok",
  "motivo": "",
  "cuadros": [ ... ],
  "latido": [ ... ],
  "rastro": { ... },
  "revelar": { "snr_vs_cuadros": [] },
  "conocido": { "estado": "sin_datos", "coincidencias": [] },
  "astrometria": { ... },
  "fuente": { ... }
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `centro` | `{ra_deg, dec_deg}` | Centro del recorte |
| `pixel_arcsec` | number | Escala del recorte (hoy 6.15″/píxel) |
| `tamano_px` | integer | Lado del recorte en píxeles (hoy 58) |
| `estado` | `ok` \| `sin_datos` | Estado de los datos del objeto |
| `motivo` | string | Explicación legible del objeto (puede ser `""`). Es el respaldo en español. |
| `motivo_codigo` | string | **Código estable** del motivo (`""` si no hay). Es lo que traduce el frontend. Ver §7. |

### 3.1 `cuadros[]` — serie temporal

```json
{
  "fecha": "2025-09-11T16:16:31Z",
  "url": "/media/rw-aurigae/frames/0000.png",
  "longitud_onda_um": 4.9565,
  "ancho_banda_um": 0.0369,
  "calidad_ok": true,
  "pos_esperada_px": { "x": 28.5, "y": 28.5 },
  "snr_en_posicion": 8153.4
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `fecha` | string ISO8601 UTC | Fecha de la observación |
| `url` | string | **Relativa**; se resuelve contra la base del backend (`/media/...`) |
| `longitud_onda_um` | number \| null | Puede faltar: el frontend muestra "Banda sin dato" |
| `ancho_banda_um` | number \| null | Ancho de banda del filtro |
| `calidad_ok` | boolean | `false` = el backend marca el recorte como dudoso y la UI lo avisa |
| `pos_esperada_px` | `{x, y}` | Posición esperada del objeto en el recorte, en píxeles |
| `snr_en_posicion` | number \| null | Señal/ruido en esa posición |

### 3.2 `latido[]` — curva de brillo

```json
{
  "fecha": "2025-09-11T16:16:31Z",
  "longitud_onda_um": 4.9565,
  "brillo": 3.237246,
  "brillo_error": 0.006059,
  "unidad": "Jy"
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `fecha` | string ISO8601 UTC | Fecha de la medición |
| `longitud_onda_um` | number \| null | Longitud de onda de la medición |
| `brillo` | number | Flujo medido |
| `brillo_error` | number \| null | Incertidumbre del flujo |
| `unidad` | string | Hoy siempre `"Jy"` |

Notas de honestidad:

- Hoy **solo `rw-aurigae`** tiene curva (7 puntos), publicados en `backend/data/rw-aurigae/datos.json`. En el resto viene `[]`.
- El frontend descarta puntos sin fecha o sin brillo y no interpola nada.
- Un `latido` vacío **no** significa que el objeto no tenga datos: `barnard` tiene
  recortes y `latido: []`. Son estados distintos y se reportan por separado.
- `backend/pipeline/exportar_cuadros.py` conserva los puntos de latido ya calculados
  cuyas fechas sigan en los cuadros. Si cambian las observaciones, recalcular con
  `backend/.venv/bin/python backend/pipeline/latido.py <slug>`.

### 3.3 `rastro` — desplazamiento medido

```json
{
  "desplazamiento_arcsec": null,
  "direccion_deg": null,
  "incertidumbre_arcsec": null,
  "pm_publicado_arcsec_yr": 0.022,
  "pm_medido_arcsec_yr": null,
  "cuadros_usados": null,
  "fecha_inicio": null,
  "fecha_fin": null,
  "frase_simple": null
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `desplazamiento_arcsec` | number \| null | Desplazamiento medido entre el primer y el último cuadro |
| `direccion_deg` | number \| null | Dirección del movimiento, en grados |
| `incertidumbre_arcsec` | number \| null | Incertidumbre de la medición |
| `pm_publicado_arcsec_yr` | number \| null | Movimiento propio del catálogo (Gaia/SIMBAD) |
| `pm_medido_arcsec_yr` | number \| null | Movimiento propio medido en los recortes |
| `cuadros_usados` | integer \| null | Cuántos cuadros entraron en la medición |
| `fecha_inicio`, `fecha_fin` | string \| null | Rango de fechas usado |
| `frase_simple` | string \| null | Texto llano **en español** que redacta el backend. La interfaz **no lo usa**: compone la frase en el idioma activo con los valores medidos (`desplazamiento_arcsec`, `pm_publicado_arcsec_yr`, `fecha_inicio`, `fecha_fin`, `pixel_arcsec`). Se mantiene como respaldo para otros consumidores de la API. |

**Hoy el backend todavía no calcula el rastro**: `backend/pipeline/exportar_cuadros.py`
escribe el bloque con los cuatro primeros campos en `null` (salvo
`pm_publicado_arcsec_yr`) y `backend/pipeline/rastro.py` ya tiene el cálculo completo
para cuando se conecte.

### 3.4 `revelar` y `conocido`

```json
"revelar": { "snr_vs_cuadros": [] },
"conocido": { "estado": "sin_datos", "coincidencias": [] }
```

Hoy vienen vacíos en los cinco objetos.

---

## 4. `GET /api/objetos/<slug>/catalogo/`

Bloque de catálogo y astrometría (sin recortes), útil para mostrar de dónde salen
las coordenadas.

```json
{
  "slug": "barnard",
  "nombre": "Estrella de Barnard",
  "tipo": "estrella_movimiento_propio",
  "rol": "principal",
  "fov_arcmin": 5.95,
  "astrometria": {
    "ra_deg": 269.448503,
    "dec_deg": 4.73942,
    "pm_ra_cosdec_mas_yr": -801.551,
    "pm_dec_mas_yr": 10362.394,
    "parallax_mas": 546.97594,
    "radial_velocity_km_s": -110.46822,
    "fecha_referencia": "J2016.0"
  },
  "fuente": {
    "catalogo": "Gaia DR3",
    "identificador": "4472832130942575872",
    "referencia": "Gaia Archive - Gaia Data Release 3",
    "estado": "verificado"
  }
}
```

`fuente.estado` puede ser `verificado`, `pendiente de validación`, etc.:
el frontend lo muestra tal cual, sin reinterpretarlo.

---

## 5. `GET /api/objetos/<slug>/posicion/?fecha=YYYY-MM-DD`

Posición del objeto propagada por movimiento propio a una fecha (necesita `astropy`).

```json
{
  "slug": "barnard",
  "nombre": "Estrella de Barnard",
  "ra_deg": 269.446220192521,
  "dec_deg": 4.768829805830304,
  "fecha_referencia": "2016-01-01T12:00:00.000",
  "fecha_observacion": "2026-03-19T00:00:00.000",
  "anios_transcurridos": 10.210814510609225,
  "desplazamiento_arcsec": 106.19158497740537,
  "distancia_pc": 1.8282339804562517,
  "parallax_mas": 546.97594,
  "radial_velocity_km_s": -110.46822,
  "fuente": { ... }
}
```

- `fecha` es obligatoria → sin ella responde **400**.
- Si el entorno no tiene `astropy` → **503**.

---

## 6. `GET /media/<slug>/frames/NNNN.png`

Recortes alineados que muestra el visor (`0000.png`, `0001.png`, …). Responden
`image/png`; una ruta inexistente devuelve **404**.

En el frontend, `cuadros[].url` viene relativa y se resuelve contra
`VITE_API_BASE`, así que el visor siempre pide la URL absoluta.

---

## 7. Convención de motivos (`motivo_codigo`)

Un **motivo** explica por qué un objeto no tiene un dato (señal débil, núcleo
saturado, sin recortes). No es un error de la aplicación: es información
científica que la interfaz muestra con honestidad, y por eso viaja con un
**código estable** además del texto.

| Campo | Quién lo consume | Ejemplo |
|---|---|---|
| `motivo` | respaldo legible (JSON crudo, consola, depuración) | `"Objeto muy tenue: la señal es débil (1 a 5 sigma)…"` |
| `motivo_codigo` | **la interfaz**, para traducir | `"senal_debil"` |

### Reglas

1. **El registro es único:** `backend/pipeline/motivos.py`. Los códigos no se
   escriben a mano en `datos.json` ni en el frontend.
2. **Todo motivo con texto lleva código.** Si un `datos.json` viejo no lo tiene,
   la API lo deduce del texto (`codigo_por_texto`); si no coincide con ningún
   registro, lo entrega con `motivo_codigo: ""` y el frontend muestra el texto
   original sin inventar traducción.
3. **Cada código necesita su clave** `motivo.<codigo>` en `src/i18n/es.js` y
   `src/i18n/en.js`.
4. **Códigos reservados:** `""` (sin motivo), `sin_datos` (el objeto existe pero
   no tiene datos precalculados), `sin_cuadros` (no hay recortes de SPHEREx).

### Códigos vigentes

| `motivo_codigo` | Cuándo |
|---|---|
| `senal_debil` | Objeto muy tenue; el movimiento no se puede medir de forma confiable |
| `nucleo_saturado` | El núcleo está saturado y enmascarado; no hay fotometría de apertura |
| `sin_cuadros` | El pipeline no encontró recortes para el objeto |
| `sin_datos` | Falta `datos.json` para ese objeto |

### Cómo agregar un motivo

```bash
# 1. registrar el código (una sola vez)
#    backend/pipeline/motivos.py  →  MOTIVOS["mi_motivo"] = "Texto en español…"

# 2. usarlo al exportar
#    from motivos import motivo
#    datos_json.update(motivo("mi_motivo"))

# 3. agregar las dos claves de i18n
#    src/i18n/es.js  →  motivo: { mi_motivo: "…" }
#    src/i18n/en.js  →  motivo: { mi_motivo: "…" }

# 4. verificar que backend y frontend coinciden
cd backend && ./.venv/bin/python pipeline/verificar_motivos.py
```

El verificador sale con código **1** si un `datos.json` tiene motivo sin código,
si el código no existe en el registro, si el texto guardado difiere del registro
o si falta/sobra una clave en los catálogos de i18n. Conviene correrlo antes de
cada commit y en la demo.

---

## Códigos de error

| HTTP | Cuándo | Cuerpo |
|---|---|---|
| **404** | Slug desconocido en `/objetos/<slug>/`, `/catalogo/` o `/posicion/` | `{"error": "objeto_desconocido", "mensaje": "Ese objeto no está en Nawi.", "slug": "no-existe"}` |
| **400** | `posicion` sin el parámetro `fecha` | `{"error": "Falta el parámetro obligatorio: fecha (YYYY-MM-DD)"}` |
| **503** | `posicion` sin `astropy` en el entorno | `{"error": "astrometria_no_disponible", "mensaje": "Falta astropy en el entorno del backend."}` |
| **500** | El catálogo (`backend/pipeline/objetos.json`) no se puede leer | `{"error": "<detalle>"}` |
| **404** | PNG inexistente en `/media/...` | Página 404 de Django (HTML) |

Ejemplo de 404 (el único que el frontend traduce a mensaje propio):

```bash
curl -i http://127.0.0.1:8010/api/objetos/no-existe/
# HTTP/1.1 404 Not Found
# {"error": "objeto_desconocido", "mensaje": "Ese objeto no está en Nawi.", "slug": "no-existe"}
```

---

## Cómo lo consume el frontend

Capa de datos en `src/data/catalog/`:

| Método | Endpoint | Devuelve |
|---|---|---|
| `catalog.listObjects()` | `GET /api/objetos/` | Modelo de vista de los 5 objetos |
| `catalog.listFrames(slug)` | `GET /api/objetos/<slug>/` → `cuadros` | Frames con `date`, `band`, `url` absoluta, `illustrative: false`, `longitudOndaUm`, `calidadOk` |
| `catalog.getDetalleObjeto(slug)` | `GET /api/objetos/<slug>/` | `{ slug, estado, motivo, motivoCodigo, latido, latidoEstado, motivoLatido, cuadros, metadatos, rastro, revelar, conocido }` |

Estado de la fuente (`DATA_SOURCE_INFO.status`, en `src/data/catalog/sourceInfo.js`),
derivado de la última consulta real:

| Valor | Cuándo | Qué debería mostrar la UI |
|---|---|---|
| `demo` | fuente `mock` | "Catálogo de demostración" / cifras ilustrativas |
| `live` | última consulta al backend OK | "Catálogo del backend" / datos del backend |
| `pending` | todavía no se consultó | "Catálogo sin conectar" / "todavía no se consultó el backend" |
| `error` | última consulta falló | "Catálogo no disponible" + el mensaje de `DATA_SOURCE_INFO.error` |

Reglas de honestidad que el frontend aplica sobre esta API:

1. Nada se inventa: si el backend falla, se muestra el error y no hay datos.
2. `illustrative: false` solo para cuadros que vinieron de una respuesta 200.
3. Longitud de onda ausente → "Banda sin dato".
4. `latido` vacío → `latido: []` y `latidoEstado: "sin_datos"`; el `estado` del
   objeto depende de sus cuadros, no de la curva.
5. El frontend no recalcula posiciones, distancias ni brillos.
