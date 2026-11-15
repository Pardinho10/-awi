# Helios Theme — Guía de aplicación

Guía para usar el tema **Helios** en un proyecto existente sin romperlo.

> **Versión**: `theme/dropin/` (prefijada). Si el proyecto es nuevo y no tiene CSS propio, usa `theme/` en su lugar.

---

## 1. Qué es esto

Un tema visual de estética cósmica y minimalista: fondo índigo-negro, tipografía ultrafina con tracking amplio, estructura dibujada solo con hairlines de 1px, y un acento dorado.

Todo va prefijado para que **no pueda colisionar** con el proyecto donde lo metas:

| Prefijo | Qué cubre |
|---|---|
| `.hx-*` | todas las clases |
| `--hx-*` | todas las variables CSS |
| `html.hx-js` | estado de JS activo |
| `.hx-is-loaded` | estado de carga completada |

---

## 2. Archivos

```
dropin/
├── helios-tokens.css   obligatorio — variables
├── helios-base.css     obligatorio — componentes
├── helios.js           opcional — animaciones y cursor
└── example.html        referencia, NO copiar
```

Copia los tres primeros:

```bash
mkdir -p /tu-proyecto/src/styles/helios
cp theme/dropin/helios-*.css theme/dropin/helios.js  /tu-proyecto/src/styles/helios/
```

---

## 3. Instalación

### Paso 1 — Fuentes

En el `<head>`, antes del CSS del tema:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@100;200;300;400;500&family=JetBrains+Mono:wght@300;400&display=swap" rel="stylesheet">
```

Dos familias, ambas gratuitas en Google Fonts:
- **Urbanist** — titulares y texto. Los pesos 200/300 son el carácter del tema.
- **JetBrains Mono** — etiquetas, contadores, metadatos.

### Paso 2 — CSS del tema, después del tuyo

```html
<!-- tu CSS existente, como siempre -->
<link rel="stylesheet" href="/styles/main.css">

<!-- el tema, DESPUÉS -->
<link rel="stylesheet" href="/styles/helios/helios-tokens.css">
<link rel="stylesheet" href="/styles/helios/helios-base.css">
```

### Paso 3 — Marca la zona

Añade `hx-theme` al elemento que debe adoptar el tema. Puede ser una sección, no necesariamente `<body>`:

```html
<section class="hx-theme">
  ...
</section>
```

> **Esto es lo que hace el aislamiento.** El tema se aplica a `.hx-theme` y a sus descendientes. Todo lo que quede fuera conserva el estilo original.

### Paso 4 — JS (opcional)

Al final del `<body>`:

```html
<script src="/styles/helios/helios.js"></script>
```

El script **solo actúa si encuentra `.hx-theme`**. Sin él la página funciona igual: no hay animaciones ni cursor, pero nada se oculta.

---

## 4. Alcance: elige antes de empezar

### Opción A — el tema en zonas concretas *(recomendado)*

```html
<nav>…</nav>                          <!-- estilo original -->

<section class="hx-theme">
  <div class="hx-wrap">
    <h2 class="hx-h2">Titular</h2>
    <div class="hx-panel"><p>Panel</p></div>
  </div>
</section>

<footer>…</footer>                    <!-- estilo original -->
```

Migración incremental, riesgo cero. **Empieza por aquí.**

### Opción B — el tema como sistema del proyecto

```html
<body class="hx-theme">
```

Migras componentes poco a poco; lo no migrado sigue con el CSS viejo. El `<body>` sí cambia: fondo `--hx-void`, texto `--hx-ink`, Urbanist. **Hazlo en una rama.**

---

## 5. Variables disponibles

Todas con prefijo `--hx-`. No inventes valores sueltos; usa estas.

### Superficies

| Variable | Valor | Uso |
|---|---|---|
| `--hx-void` | `#07080F` | Fondo de página |
| `--hx-void-deep` | `#04050A` | Capa más profunda |
| `--hx-surface` | `#0C0E1C` | Superficie elevada |
| `--hx-surface-2` | `#11142A` | Superficie elevada 2 |

### Tinta

| Variable | Valor | Uso |
|---|---|---|
| `--hx-ink` | `#E8ECFB` | Texto principal (blanco frío) |
| `--hx-ink-mute` | `rgba(232,236,251,.52)` | Texto secundario |
| `--hx-ink-faint` | `rgba(232,236,251,.30)` | Metadatos |
| `--hx-ink-ghost` | `rgba(232,236,251,.14)` | Detalles casi invisibles |

### Acento solar

| Variable | Valor |
|---|---|
| `--hx-solar` | `#E8B04B` |
| `--hx-solar-hot` | `#FFD27A` |
| `--hx-solar-deep` | `#B9822C` |
| `--hx-solar-glow` | `rgba(232,176,75,.14)` |
| `--hx-solar-wash` | `rgba(232,176,75,.055)` |

### Acento plasma

| Variable | Valor |
|---|---|
| `--hx-plasma` | `#7FB4E8` |
| `--hx-plasma-glow` | `rgba(127,180,232,.24)` |

### Hairlines — toda la estructura se dibuja con estas

| Variable | Valor | Uso |
|---|---|---|
| `--hx-line` | `rgba(196,208,245,.16)` | Borde de panel |
| `--hx-line-soft` | `rgba(196,208,245,.08)` | Separador de sección |
| `--hx-line-faint` | `rgba(196,208,245,.05)` | Guía vertical |
| `--hx-line-hot` | `rgba(232,176,75,.30)` | Borde en hover |

### Tipografía

| Variable | Valor |
|---|---|
| `--hx-font-display` | `"Urbanist", system-ui, sans-serif` |
| `--hx-font-mono` | `"JetBrains Mono", ui-monospace, monospace` |
| `--hx-fs-display` | `clamp(3.4rem, 12.5vw, 9.5rem)` |
| `--hx-fs-h1` | `clamp(2.4rem, 7vw, 5rem)` |
| `--hx-fs-h2` | `clamp(1.9rem, 4.4vw, 3.2rem)` |
| `--hx-fs-h3` | `clamp(1.35rem, 2.6vw, 2rem)` |
| `--hx-fs-lead` | `clamp(0.95rem, 1.4vw, 1.15rem)` |
| `--hx-fs-body` | `1rem` |
| `--hx-fs-small` | `0.875rem` |
| `--hx-fs-label` | `11px` |
| `--hx-fs-micro` | `10px` |
| `--hx-track-display` | `0.085em` |
| `--hx-track-heading` | `0.06em` |
| `--hx-track-label` | `0.20em` |
| `--hx-track-wide` | `0.34em` |

### Movimiento

| Variable | Valor |
|---|---|
| `--hx-t-fast` | `0.15s ease` |
| `--hx-t-base` | `0.3s ease` |
| `--hx-t-slow` | `0.55s cubic-bezier(0.77, 0, 0.175, 1)` |
| `--hx-t-rise` | `1.1s cubic-bezier(0.16, 1, 0.3, 1)` |
| `--hx-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |

### Layout

| Variable | Valor | Nota |
|---|---|---|
| `--hx-pad` | `40px` | → `28px` @900px → `20px` @560px |
| `--hx-pad-sm` | `28px` | |
| `--hx-pad-xs` | `20px` | |
| `--hx-nav-h` | `80px` | → `72px` @900px |
| `--hx-maxw` | `1280px` | |
| `--hx-space-xs` … `--hx-space-xl` | `8px` … `128px` | `--hx-space-xl` → `88px` @900px |

---

## 6. Componentes

### Tipografía

```html
<h1 class="hx-display">Titular enorme</h1>   <!-- hasta 9.5rem, peso 200 -->
<h2 class="hx-h1">Titular 1</h2>
<h2 class="hx-h2">Titular 2</h2>
<h3 class="hx-h3">Titular 3</h3>

<span class="hx-label hx-label--solar">Etiqueta</span>   <!-- mono, oro -->
<span class="hx-label hx-label--bright">Etiqueta</span>  <!-- mono, blanca -->
<span class="hx-micro">Micro 10px</span>
<span class="hx-num">1,392,700 km</span>                 <!-- cifras tabulares -->

<p class="hx-lead">Párrafo de entrada</p>
<p class="hx-body">Texto de cuerpo</p>
<p class="hx-subtitle">Subtítulo con tracking amplio</p>
```

**`.hx-gild`** aplica el degradado blanco→oro. Úsalo en **una** palabra del titular:

```html
<h1 class="hx-display">
  <span class="hx-rise"><span>Helios</span></span>
  <span class="hx-rise"><span class="hx-gild">Transit</span></span>
</h1>
```

### Estructura

```html
<div class="hx-wrap">…</div>                          <!-- centrado, max 1280px -->
<section class="hx-section">…</section>              <!-- padding vertical grande -->
<section class="hx-section hx-section--ruled">…</section>       <!-- + hairline arriba -->
<section class="hx-section hx-section--clears-nav">…</section>  <!-- primera bajo nav fijo -->

<div class="hx-rule-broken"><span></span><span></span></div>    <!-- regla partida -->
<div class="hx-edge hx-edge--left"></div>                       <!-- guía vertical -->
<div class="hx-edge hx-edge--right"></div>
```

### Paneles

El contenedor por defecto: borde hairline, **sin radio, sin relleno, sin sombra**.

```html
<div class="hx-panel"><p>Primer panel</p></div>
<div class="hx-panel hx-panel--stacked"><p>Segundo — comparte borde</p></div>
```

### Botones

```html
<button class="hx-btn">Ghost pill</button>
<button class="hx-btn hx-btn--solar">Solar</button>
<button class="hx-btn hx-btn--round" aria-label="Siguiente">↓</button>
```

`.hx-btn--solar` es el botón de máxima jerarquía. **Uno por pantalla como máximo.**

### Luces

El motivo firma: núcleo brillante con corona difusa.

```html
<span class="hx-light"></span>                     <!-- oro, 6px -->
<span class="hx-light hx-light--plasma"></span>    <!-- azul -->
<span class="hx-light hx-light--ink"></span>       <!-- blanca -->
<span class="hx-light hx-light--lg"></span>        <!-- 10px -->
<span class="hx-light hx-light--breathe"></span>   <!-- pulsa 6s -->
```

### Anillos orbitales

```html
<div style="position:relative; height:300px">
  <div class="hx-ring" style="width:40vmin;height:40vmin;position:absolute;top:50%;left:50%;translate:-50% -50%"></div>
  <div class="hx-ring hx-ring--dashed" style="…"></div>
  <div class="hx-ring hx-ring--bright" style="…"></div>
</div>
```

⚠️ Necesitan `position: absolute` y un ancestro con `position: relative`.

### Nav y hero

```html
<header class="hx-theme hx-nav">…</header>

<section class="hx-theme hx-hero">
  <h1 class="hx-display">
    <span class="hx-rise"><span>Línea uno</span></span>
    <span class="hx-rise"><span>Línea dos</span></span>
  </h1>
</section>
```

`.hx-nav` añade `.hx-is-scrolled` al hacer scroll (lo gestiona el JS).

### Animaciones de entrada

```html
<!-- aparece al entrar en viewport -->
<p class="hx-lead" data-reveal>Aparece al hacer scroll</p>

<!-- aparece al cargar -->
<p data-reveal="now">Aparece al cargar</p>

<!-- título con máscara: dentro de .hx-hero libera al cargar,
     fuera de .hx-hero libera al hacer scroll -->
<h1 class="hx-display">
  <span class="hx-rise"><span>Línea</span></span>
</h1>

<!-- escalonado: --hx-i se pasa inline en cada hijo, no es un token global -->
<div class="hx-stagger">
  <div class="hx-panel" style="--hx-i:0">…</div>
  <div class="hx-panel" style="--hx-i:1">…</div>
  <div class="hx-panel" style="--hx-i:2">…</div>
</div>
```

`--hx-i` es la única variable que **no** está en `:root`: se declara por elemento y el CSS la usa con fallback `var(--hx-i, 0)`, así que si la omites el retardo es 0. El CSS calcula `calc(var(--hx-i, 0) * 90ms)`.

### Cursor custom

Opcional. Dos divs dentro de la zona:

```html
<div class="hx-cursor-ring" aria-hidden="true"></div>
<div class="hx-cursor-dot" aria-hidden="true"></div>
```

Sin ellos, el JS simplemente se salta esa función. Se desactiva solo en puntero táctil.

---

## 7. Reglas del estilo

Si creas componentes nuevos, respeta esto o se rompe el lenguaje:

1. **Sin negro puro.** Ni `#000` ni `#111`. Usa `--hx-void`.
2. **Sin blanco puro.** Usa `--hx-ink` (blanco frío, tintado de azul).
3. **Los contenedores no se rellenan.** La estructura se dibuja con hairlines de 1px.
4. **Sin sombras difusas.** La única permitida es el `box-shadow` de halo en `.hx-light` y `.hx-ring`.
5. **Sin `border-radius`** salvo en botones (`500px`) y luces (`50%`). Los paneles van a radio 0.
6. **Los titulares no pasan de peso 300.** Nunca `bold`.
7. **`uppercase` siempre en titulares**, con tracking entre `0.06em` y `0.10em`.
8. **El cuerpo va en peso 300**, no 400.
9. **Una sola palabra en oro por titular.** `.hx-gild` no se repite.
10. **El movimiento es lento.** Nada por debajo de `150ms`. Nada que rebote.

---

## 8. Cambiar la paleta

Todo está en `helios-tokens.css`, en el bloque `:root`.

**Colores base** — cámbialos directamente:

```css
--hx-void:   #07080F;   /* fondo */
--hx-ink:    #E8ECFB;   /* texto */
--hx-solar:  #E8B04B;   /* acento principal */
--hx-plasma: #7FB4E8;   /* acento secundario */
```

**Colores derivados** — están escritos como `rgba()` literales. **Debes editarlos a mano** para que casen con los nuevos base:

```css
--hx-ink-mute:   rgba(232, 236, 251, 0.52);  /* ← RGB de --hx-ink */
--hx-line:       rgba(196, 208, 245, 0.16);  /* ← derivado de --hx-ink */
--hx-solar-glow: rgba(232, 176, 75, 0.14);   /* ← RGB de --hx-solar */
```

No usé `color-mix()` porque su soporte no es fiable en todos los navegadores objetivo. Si tu proyecto solo apunta a navegadores modernos, puedes migrar a `color-mix(in srgb, var(--hx-ink) 52%, transparent)` y olvidarte del mantenimiento manual.

---

## 9. Advertencias

1. **`html.hx-js` es global.** El JS lo pone en `<html>`, no en la zona. Necesario porque las animaciones deben saber que hay scripting antes de que exista el `<body>`. Solo contiene reglas del tema.

2. **`box-sizing: border-box` en `*` es global.** Si tu proyecto usa `content-box`, esto lo cambia. Es la norma en el 99% de proyectos, pero conviene saberlo.

3. **`.hx-nav` necesita `min-height: 0`** cuando lleva también `.hx-theme` — ya está resuelto en el CSS, pero si creas tu propio nav con ambas clases, recuérdalo: `.hx-theme` aplica `min-height: 100vh`.

4. **`.hx-nav` es `position: fixed` y ocupa todo el ancho.** Si lo pones en una zona del tema que convive con contenido claro, el nav oscuro se superpone al contenido del proyecto y se ve mal. Para zonas concretas (opción A), **no uses `.hx-nav`** — quédate con el nav original del proyecto. `.hx-nav` solo tiene sentido con la opción B (tema en `<body>`).

5. **Z-index.** El cursor usa `9999`, `.hx-nav` usa `200`. Hay una franja de 80px arriba reservada por el nav; si tu proyecto ya tiene nav fijo, se solapan.

5. **Fuentes nuevas.** Urbanist y JetBrains Mono se suman al proyecto. Si ya cargas muchas familias, considera self-hostearlas.

6. **No mezcles `theme/` y `theme/dropin/`.** `theme/` es para proyectos nuevos sin CSS propio; `dropin/` para proyectos existentes. Elige uno.

7. **Verifica el contraste** si cambias la paleta. `--hx-ink-mute` al 52% sobre `--hx-void` da ~7:1 (AA), pero si aclaras el fondo baja.

---

## 10. Checklist de integración

```
[ ] Copiados helios-tokens.css, helios-base.css, helios.js
[ ] Fuentes (Urbanist + JetBrains Mono) en el <head>
[ ] tokens.css cargado ANTES de base.css
[ ] Ambos cargados DESPUÉS del CSS del proyecto
[ ] Algún elemento con class="hx-theme"
[ ] Script helios.js al final del <body>
[ ] Comprobado que el CSS viejo sigue intacto fuera de la zona
[ ] Probado en móvil (375px) y desktop
[ ] Probado con JS desactivado → el contenido debe verse
[ ] Decidido alcance: zonas concretas (A) o body entero (B)
```

---

## 11. Comprobar que funciona

**El CSS viejo no se tocó.** Abre DevTools y comprueba un elemento fuera de la zona: su `font-family` debe seguir siendo el original, no Urbanist.

**Consola limpia.** No debe haber errores 404 de las fuentes ni del JS.

**Sin JS.** Desactiva JavaScript y recarga: todo el contenido debe verse. Si algo queda invisible, la clase `hx-js` se está aplicando sin que el script corra.

**Móvil.** A 375px el padding baja a 20px, el nav a 72px y los trackings se aprietan. Es automático vía tokens.

**Movimiento reducido.** Activa "reducir movimiento" en el SO: las animaciones se desactivan y todo se fuerza visible.

---

## 12. Equivalencias rápidas

Si vienes de la carpeta `theme/` sin prefijo:

| Sin prefijo | Prefijado |
|---|---|
| `.panel` | `.hx-panel` |
| `.btn` | `.hx-btn` |
| `.display` | `.hx-display` |
| `.h2` | `.hx-h2` |
| `.gild` | `.hx-gild` |
| `.lead` | `.hx-lead` |
| `.label` | `.hx-label` |
| `.light` | `.hx-light` |
| `.ring` | `.hx-ring` |
| `.wrap` | `.hx-wrap` |
| `.section` | `.hx-section` |
| `.rise` | `.hx-rise` |
| `.reveal` | `.hx-reveal` |
| `data-reveal` | `data-reveal` *(igual)* |
| `var(--void)` | `var(--hx-void)` |
| `var(--solar)` | `var(--hx-solar)` |
| `var(--ink)` | `var(--hx-ink)` |
| `var(--line)` | `var(--hx-line)` |
