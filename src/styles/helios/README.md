# Helios — versión drop-in (para meter en un proyecto existente)

Esta carpeta es para **añadir el tema a un proyecto que ya existe** sin romperlo.

```
dropin/
├── APLICACION.md       ← GUÍA COMPLETA. Empieza aquí.
├── helios-tokens.css   variables (--hx-*)
├── helios-base.css     componentes (.hx-*)
├── helios.js           opcional
└── example.html        demo con proyecto simulado
```

📖 **Para integrarlo en otro proyecto, lee `APLICACION.md`** — instalación paso a paso, inventario de tokens y componentes, reglas del estilo, checklist y advertencias.

Todo va prefijado:

- clases → `.hx-panel`, `.hx-btn`, `.hx-h2`…
- variables → `--hx-void`, `--hx-solar`…
- estados → `html.hx-js`, `.hx-is-loaded`, `.hx-cursor-active`

**Nada puede colisionar con tu proyecto.** Verificado contra un proyecto simulado con `.btn`, `.panel`, `.label`, `.wrap` y `.section` ya definidos: cero fugas.

## Por qué existe esta carpeta

La carpeta `theme/` de al lado usa clases sin prefijo (`.panel`, `.btn`). Si la metes en un proyecto que ya tiene un `.panel` de Bootstrap, se pisan. Lo probé:

| Situación | Resultado medido |
|---|---|
| `theme/` + CSS existente | `.btn` heredó `JetBrains Mono` y `text-transform: uppercase` en silencio |
| `@layer` para aislarlo | **No sirve** — el CSS existente no declara `font-family` en `.btn`, así que no hay conflicto que resolver y el valor del tema pasa igual |
| `dropin/` con prefijo | Aislamiento total, verificado |

## Instalación (3 pasos)

### 1. Copia los archivos

```bash
cp -r theme/dropin  /tu-proyecto/src/styles/helios
```

### 2. Fuentes + CSS

En el `<head>`, **después** de tu CSS existente:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@100;200;300;400;500&family=JetBrains+Mono:wght@300;400&display=swap" rel="stylesheet">

<link rel="stylesheet" href="/styles/helios/helios-tokens.css">
<link rel="stylesheet" href="/styles/helios/helios-base.css">
```

### 3. Marca la zona que adopta el tema

Añade `hx-theme` al elemento contenedor. **No hace falta ponerlo en `<body>`** — puedes aplicar el tema a una sola sección:

```html
<!-- tu web normal -->
<nav>…</nav>

<!-- zona con el tema Helios -->
<section class="hx-theme">
  <div class="hx-wrap">
    <h2 class="hx-h2">Titular Helios</h2>
    <div class="hx-panel"><p>Panel Helios</p></div>
    <button class="hx-btn hx-btn--solar">Acción</button>
  </div>
</section>

<!-- tu web normal sigue -->
<footer>…</footer>
```

### 4. JS (opcional)

```html
<script src="/styles/helios/helios.js"></script>
```

El script **solo actúa si encuentra `.hx-theme`**. Si no existe, no hace nada. Sin él la página funciona igual; simplemente no hay animaciones ni cursor.

---

## Tabla de equivalencias

Si vienes de `theme/` (sin prefijo), cambia esto:

| theme/ | dropin/ |
|---|---|
| `.panel` | `.hx-panel` |
| `.panel--stacked` | `.hx-panel--stacked` |
| `.btn` | `.hx-btn` |
| `.btn--solar` | `.hx-btn--solar` |
| `.btn--round` | `.hx-btn--round` |
| `.display` `.h1` `.h2` `.h3` | `.hx-display` `.hx-h1` `.hx-h2` `.hx-h3` |
| `.gild` | `.hx-gild` |
| `.lead` `.body` `.subtitle` | `.hx-lead` `.hx-body` `.hx-subtitle` |
| `.label` `.micro` `.num` | `.hx-label` `.hx-micro` `.hx-num` |
| `.light` `.light--plasma` | `.hx-light` `.hx-light--plasma` |
| `.ring` `.ring--dashed` | `.hx-ring` `.hx-ring--dashed` |
| `.wrap` `.section` `.edge` | `.hx-wrap` `.hx-section` `.hx-edge` |
| `.rule-broken` | `.hx-rule-broken` |
| `.reveal` `.rise` `.stagger` | `.hx-reveal` `.hx-rise` `.hx-stagger` |
| `data-reveal` | `data-reveal` (sin cambios) |
| `var(--void)` | `var(--hx-void)` |
| `var(--solar)` | `var(--hx-solar)` |
| `var(--ink)` | `var(--hx-ink)` |

Todos los tokens llevan `--hx-` delante. `--hx-void`, `--hx-ink`, `--hx-solar`, `--hx-line`, `--hx-font-display`, `--hx-fs-h2`, etc.

---

## Antes de copiar: decide el alcance

Tienes dos formas de usar esto, y eligen cosas distintas:

### Opción A — el tema como sistema nuevo del proyecto

Pones `hx-theme` en `<body>` y migras los componentes poco a poco. Convive con lo viejo: lo existente no se toca, y lo nuevo usa `.hx-*`.

```html
<body class="hx-theme">
```

⚠️ Con esto el `<body>` **sí** cambia: fondo `--hx-void`, texto `--hx-ink`, Urbanist. Es lo esperado, pero es un cambio visible global. Hazlo en una rama.

### Opción B — el tema en zonas concretas

`hx-theme` solo en las secciones nuevas. El resto del proyecto queda intacto.

```html
<section class="hx-theme hx-section">…</section>
```

Recomiendo empezar por **B**. Verificado en `example.html`: la zona de arriba y la de abajo quedan idénticas, solo la del medio cambia.

---

## Advertencias reales

1. **`html.hx-js` es global.** El JS lo pone en `<html>`, no en la zona. Es necesario porque las animaciones necesitan saber que hay JS antes de que cargue el `<body>`. Contiene solo reglas del tema, pero está ahí.

2. **`box-sizing: border-box` es global.** Lo aplica `*` en `helios-base.css`. Si tu proyecto usa `content-box`, esto lo cambia. Es la norma en el 99% de proyectos, pero conviene saberlo.

3. **El wrapper necesita `position: relative`** si usas `.hx-ring` absolutos. Los anillos se posicionan respecto al ancestro posicionado más cercano.

4. **Z-index.** El cursor usa `9999`, el nav del tema `200`. Si tu proyecto tiene capas por encima, súbelo.

5. **Fuentes nuevas.** Urbanist y JetBrains Mono se añaden al proyecto. Si ya cargas muchas, considera self-hostearlas.

6. **No mezcles `theme/` y `dropin/`.** Elige uno. `theme/` es para proyectos nuevos; `dropin/` para proyectos que ya tienen CSS propio.

---

## Verificación hecha

`example.html` simula un proyecto con `.btn`, `.panel`, `.label`, `.wrap` ya definidos y el tema aplicado solo a una sección. Medido con Playwright:

| Elemento | Resultado |
|---|---|
| `<h1>` fuera de la zona | `system-ui`, sin cambios ✅ |
| `.btn` existente | `system-ui`, `radius 6px`, azul `#0d6efd` ✅ |
| `.panel` existente | `system-ui`, `radius 8px`, fondo `#f8f9fa` ✅ |
| `.label` existente | `system-ui`, sin `uppercase` ✅ |
| `.panel` de abajo (post-zona) | `system-ui`, intacto ✅ |
| `.hx-panel` dentro de la zona | tema aplicado ✅ |
| `.hx-btn--solar` | JetBrains Mono, pill, oro ✅ |
| `.hx-light--plasma` | círculo azul con halo ✅ |
| Colisiones `hx-hx` | 0 ✅ |
| `html.hx-js` / `.hx-is-loaded` | ambos presentes ✅ |

Captura: `.design/screenshots/dropin-final.png`
