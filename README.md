# Nawi — un ojo infrarrojo para todos

Nawi es una herramienta web abierta para **ver observaciones del telescopio espacial SPHEREx
como una secuencia en el tiempo**. Elegís un objeto del cielo y recorrés los recortes que el
backend precalculó para distintas fechas, con la opción de comparar dos cuadros y, cuando hay
datos, ver la curva de brillo (el "latido") de los objetos variables.

El objetivo es que estudiantes, docentes y curiosos puedan mirar datos infrarrojos reales de
la NASA sin instalar nada ni saber astronomía: la interfaz avisa siempre qué está verificado,
qué es demostración y qué falta.

> El nombre viene del quichua *ñawi* ("ojo").

---

## Stack

| Parte | Tecnología |
|---|---|
| Frontend | Vue 3 + Vite 6 + Bootstrap 5 (y Bootstrap Icons) |
| Backend | Django 6 + astropy (astrometría, FITS, reproyección) |
| Datos | JSON precalculado + PNGs servidos desde `backend/data/` |
| Base de datos | Ninguna externa: Django usa SQLite local solo para su admin |

El frontend es una SPA que consume la API por HTTP. **No recalcula astrometría ni fotometría**:
muestra lo que el backend publica.

---

## Requisitos

- **Node 24** (probado con 24.19.0)
- **Python 3.12** (probado con 3.12.3); el venv del backend vive en `backend/.venv`

## Puesta en marcha

```bash
# 1. Backend: entorno de Python
python3.12 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt

# 2. Frontend: dependencias de Node
npm install

# 3. Levantar los dos a la vez (concurrently)
npm run dev
```

`npm run dev` arranca en paralelo:

- **frontend** → <http://localhost:5178> (Vite, `strictPort`)
- **backend** → <http://127.0.0.1:8010> (Django)

También se pueden correr por separado:

```bash
npm run dev:front     # solo Vite
npm run dev:back      # solo Django (usar backend/.venv)
npm run build         # build de producción del frontend
npm run preview       # sirve el build
```

### ¿Por qué el backend usa 8010 y no 8000?

8000 es el puerto por defecto de Django y en el entorno de desarrollo de este equipo ya lo
usa otro proyecto, así que Nawi quedó fijo en **8010** (y Vite en **5178** por la misma razón:
5173 es el default de Vite y suele estar ocupado). Los dos puertos están declarados en
`package.json` y `vite.config.js`, y el backend tiene CORS habilitado para `localhost:5178`.

---

## Variables de entorno

El frontend usa dos variables de Vite. Están documentadas en **`.env.example`**:

| Variable | Valores | Default | Para qué |
|---|---|---|---|
| `VITE_NAWI_DATA_SOURCE` | `mock` \| `api` | `mock` | Fuente de datos del catálogo |
| `VITE_API_BASE` | URL sin barra final | `http://127.0.0.1:8010` | Base del backend y de las URLs `/media/...` |

```bash
cp .env.example .env.local
# .env.local
VITE_NAWI_DATA_SOURCE=api
VITE_API_BASE=http://127.0.0.1:8010
```

- **Sin `.env.local`** la app arranca en modo `mock`: catálogo de demostración, imágenes de
  relleno y el rótulo "IMAGEN ILUSTRATIVA". Sirve para trabajar en la interfaz sin backend.
- Con `api` la app pide los datos reales; si el backend no responde, **muestra el error** en
  pantalla (no cae al mock ni inventa datos).
- `.env.local` **no se versiona** (está en `.gitignore`). Solo se versiona `.env.example`.

### Build de producción (datos reales)

`.env.local` no se versiona ni lo lee la CI, así que el repo incluye **`.env.production`**
(sí versionado) con:

```dotenv
VITE_NAWI_DATA_SOURCE=api
VITE_API_BASE=http://127.0.0.1:8010
```

Con eso, `npm run build` compila apuntando a la API real y `npm run preview` sirve ese build.

> **Antes de publicar en un servidor público**, `VITE_API_BASE` tiene que apuntar al backend
> real (el de `127.0.0.1:8010` solo existe en la máquina de desarrollo):
>
> ```bash
> VITE_API_BASE=https://api.tu-dominio npm run build
> ```
>
> También se puede crear un `.env.production.local` (ignorado por git) con ese valor. El
> backend, además, habilita CORS solo para los orígenes de desarrollo, así que hay que
> agregar el dominio del frontend a `CORS_ALLOWED_ORIGINS`.
>
> **Precedencia de Vite:** `.env.local` se carga en todos los modos y gana sobre
> `.env.production`. Si tenés un `.env.local` apuntando a otro backend, el build lo usa a él.

### Estado de la fuente (para la interfaz)

`DATA_SOURCE_INFO` (en `src/data/catalog/sourceInfo.js`) es un store **reactivo** que refleja
la realidad de la última consulta, derivada de `apiHealth` de la fuente `api`: no es un valor
fijo. `DATA_SOURCE_INFO.status` puede tomar cuatro valores:

| `status` | Cuándo | Texto que debería mostrar la UI |
|---|---|---|
| `demo` | fuente `mock` | "Catálogo de demostración" · cifras ilustrativas |
| `live` | la última consulta al backend salió bien | "Catálogo del backend" · datos del backend |
| `pending` | todavía no se consultó el backend | "Catálogo sin conectar" · todavía no se consultó |
| `error` | la última consulta falló | "Catálogo no disponible" + `DATA_SOURCE_INFO.error` |

El store también expone `error` (mensaje en español de la última falla), `contacted`,
`updatedAt` y `base`, para que la interfaz pueda ser precisa sin inventar nada.

---

## Endpoints disponibles

Backend Django (desarrollo, `DEBUG=True`):

| Método y ruta | Devuelve |
|---|---|
| `GET /api/estado/` | Estado del servicio (`{"estado": "ok", ...}`) |
| `GET /api/objetos/` | Lista plana de objetos: slug, nombre, tipo, rol, `ra_deg`/`dec_deg`, época, movimiento propio, `estado`, `cantidad_cuadros` |
| `GET /api/objetos/<slug>/` | Ficha completa: `centro`, `pixel_arcsec`, `tamano_px`, `cuadros[]`, `latido[]`, `rastro`, `revelar`, `conocido`, `astrometria`, `fuente` |
| `GET /api/objetos/<slug>/catalogo/` | Datos de catálogo y astrometría del objeto (Gaia/SIMBAD) con su estado de validación |
| `GET /api/objetos/<slug>/posicion/?fecha=YYYY-MM-DD` | Posición propagada por movimiento propio a esa fecha |
| `GET /media/<slug>/frames/NNNN.png` | Recortes PNG alineados que muestra el visor |

Los `slug` acordados: `barnard`, `wise-0855`, `epsilon-indi-b`, `rw-aurigae`, `r-draconis`.
El frontend los usa como identificador estable en la URL (`?obj=`).

Ejemplo rápido:

```bash
curl -s http://127.0.0.1:8010/api/estado/
curl -s http://127.0.0.1:8010/api/objetos/ | python3 -m json.tool | head -30
```

---

## Datos: fuentes y créditos

- **NASA/IPAC IRSA — SPHEREx**: imágenes y cubos infrarrojos de la misión.
- **Gaia (ESA)**: astrometría (posición, paralaje, movimiento propio).
- **SIMBAD (CDS)**: identificación y datos de referencia de los objetos.

Los datos pertenecen a esas misiones y archivos; Nawi los reúne, precalcula recortes
alineados y los muestra, pero **no los recalcula ni los corrige en el frontend**. Cuando un
valor falta, la interfaz lo dice ("Banda sin dato") en lugar de completarlo.

Los avisos científicos (señal débil, núcleo saturado, sin recortes) viajan con un **código
estable** (`motivo_codigo`) además del texto, para que la interfaz los traduzca. El registro
único está en `backend/pipeline/motivos.py` (ver `doc/contrato-api.md` §7).

### Verificación (idiomas y motivos)

```bash
npm run check            # las dos comprobaciones
npm run check:i18n       # catálogos es/en sincronizados
npm run check:motivos    # motivos del backend con código y clave de i18n
```

- **`check:i18n`** falla si a un idioma le falta o le sobra una clave, si un texto quedó vacío
  o si los placeholders no coinciden (`{n}` en español y `{m}` en inglés).
- **`check:motivos`** falla si un `datos.json` tiene motivo sin código, si el código no está en
  el registro, si el texto diverge, o si falta la clave `motivo.*` en algún idioma.
- Requiere el venv del backend (`backend/.venv`) para la segunda. Conviene correrlo antes de
  cada commit y en la demo; no está atado a `npm run build` a propósito, para que el build del
  frontend no dependa de Python.

## Estado real (verificado el 2026-11-15 contra el backend)

| Objeto | Cuadros | Longitud de onda | Latido | Calidad del recorte |
|---|---|---|---|---|
| Estrella de Barnard | 9 | 4,39 – 4,92 μm | sin datos | ok |
| WISE 0855-0714 | 7 | 4,41 – 4,97 μm | sin datos | marcada dudosa |
| Epsilon Indi B | 2 | 4,52 – 4,66 μm | sin datos | marcada dudosa |
| RW Aurigae | 7 | 4,41 – 4,96 μm | **7 puntos** (Jy) | ok |
| R Draconis | 12 | 4,42 – 4,81 μm | sin datos | mixta |

- Total: **37 recortes**, todos de **58 × 58 px** con **6,15″ por píxel** (campo de 5,95′).
- El visor avisa cuando el backend marca un cuadro con **calidad dudosa**, y los objetos traen
  su motivo cuando corresponde: WISE 0855 es **señal débil (1–5 σ)** y en R Draconis el
  **núcleo está saturado** y enmascarado.
- **Rastro medido solo en Barnard**: 10,61 ± 0,23″ en 9 cuadros, frente a los 10,39″/año que
  predice el catálogo, con una frase en lenguaje llano. El resto de los objetos no tiene
  desplazamiento medido.
- `revelar` y `conocido` todavía vienen vacíos en los cinco objetos.
- `latido` (curva de brillo) hoy solo existe para **RW Aurigae**: el backend publica
  **7 mediciones** con brillo, incertidumbre y longitud de onda, calculadas sobre sus
  observaciones y mostradas sin recalcular en el frontend. Los demás objetos responden
  `latido: []`; que el latido esté vacío **no** significa que el objeto no tenga datos:
  el `estado` depende de sus cuadros.
- Al regenerar los recortes de un objeto con `backend/pipeline/exportar_cuadros.py`, se
  conserva el latido existente para las fechas que sigan presentes. Si cambian las
  observaciones, hay que volver a ejecutar `backend/pipeline/latido.py <slug>` para
  actualizar las mediciones.

## Uso de inteligencia artificial

El código, la interfaz y la documentación de Nawi se desarrollaron con **asistencia de IA**, y
todo se valida contra el backend y los datos reales: la regla del proyecto es que la interfaz
nunca afirme más de lo que el backend publica. Los errores y límites conocidos se documentan
en vez de disimularse.

## Licencia

**Falta definirla.** El repositorio todavía no incluye un archivo `LICENSE` ni un titular
declarado, así que no se asigna ninguna licencia por ahora: hasta que el equipo lo defina,
el código no debería reutilizarse sin consultar a sus autores.

## Documentación

- `doc/pr-frontend.md` — resumen de la rama `jorge/frontend` y cuerpo listo para el Pull Request.
- `doc/plan-de-trabajo-nawi-v2.md` — plan de trabajo y reparto de roles.
- `doc/estructura-backend-nawi-simple.md` — cómo está armado el backend.
- `doc/HALLAZGOS_FASE1.md` — hallazgos de la primera fase de datos.
- `doc/contrato-api.md` — contrato real de la API (endpoints, campos, códigos de error y
  cómo los consume el frontend).
