# Paleta clara de Helios — derivación, evaluación de pares y cierre AA

**Archivo entregado:** `src/styles/helios/helios-tokens-light.css`
**Base:** `src/styles/helios/helios-tokens.css` (Helios oficial, tema único oscuro)
**Alcance:** solo tokens de color. Tipografía, movimiento y layout no se tocan.
**Método:** fórmula WCAG de luminancia relativa con `numpy` (`backend/.venv/bin/python`),
incluyendo composición alfa sobre el fondo real de cada par (no sobre blanco).
**Estado:** cerrado. Todos los pares de texto informativo pasan AA; lo único que queda por
debajo es decorativo (hairlines y `ink-ghost`) y está declarado.

---

## 0. Veredicto

| | |
|---|---|
| Tokens de color derivados | **19** (de 49 totales; los otros 30 son tipografía/movimiento/layout y no cambian) |
| Pares de texto con AA (≥ 4.5:1) | **todos**: peor caso **5.01:1** (`ink-faint` sobre fila seleccionada) |
| Pares decorativos bajo AA | `ink-ghost` 1.33:1 (separadores, anillos, chevron en reposo) y `--hx-line*` 1.22–1.95:1 (hairlines de 1px) |
| Oro original sobre claro | **1.66:1** (`#E8B04B` sobre `#E9ECF5`) → se reemplaza por ámbar profundo `#7A4A08` (6.33:1) |
| Tema oscuro | **intacto** (verificado en navegador, §10) |
| Bloqueante externo detectado | los rótulos sobre el recorte en `nawi.css` usan `--hx-ink` sobre un chip oscuro fijo: en claro darían **1.16:1**. Parche exacto en §7.2 |

---

## 1. Mecanismo de activación

| Pieza | Cómo funciona |
|---|---|
| Nawi | `document.documentElement.dataset.theme = 'light'` → `<html data-theme="light">`. `styles.css` lo lee con `:root[data-theme='light']`. |
| Helios | La zona es cualquier elemento con `class="hx-theme"` (puede ser una sección; en Nawi hoy es `body`). |
| Este archivo | `html[data-theme="light"] .hx-theme { … }` → especificidad (0,2,1) contra (0,1,0) de `:root`: gana sin depender del orden. |

**Importación:** después de `helios-base.css`, porque incluye parches a valores fijos de la base
(§9). Estado actual: **no está importado** (no se tocó `main.js` ni `index.html`).

---

## 2. Inventario de los 49 tokens

**Color (19, los únicos derivados):**
`--hx-void`, `--hx-void-deep`, `--hx-surface`, `--hx-surface-2` ·
`--hx-ink`, `--hx-ink-mute`, `--hx-ink-faint`, `--hx-ink-ghost` ·
`--hx-solar`, `--hx-solar-hot`, `--hx-solar-deep`, `--hx-solar-glow`, `--hx-solar-wash` ·
`--hx-plasma`, `--hx-plasma-glow` ·
`--hx-line`, `--hx-line-soft`, `--hx-line-faint`, `--hx-line-hot`

**Tipografía (15, no cambian):** `--hx-font-display`, `--hx-font-mono`, `--hx-fs-display`,
`--hx-fs-h1`, `--hx-fs-h2`, `--hx-fs-h3`, `--hx-fs-lead`, `--hx-fs-body`, `--hx-fs-small`,
`--hx-fs-label`, `--hx-fs-micro`, `--hx-track-display`, `--hx-track-heading`,
`--hx-track-label`, `--hx-track-wide`

**Movimiento (5, no cambian):** `--hx-t-fast`, `--hx-t-base`, `--hx-t-slow`, `--hx-t-rise`,
`--hx-ease-out`

**Layout (10, no cambian):** `--hx-pad`, `--hx-pad-sm`, `--hx-pad-xs`, `--hx-nav-h`,
`--hx-maxw`, `--hx-space-xs`, `--hx-space-sm`, `--hx-space-md`, `--hx-space-lg`, `--hx-space-xl`

---

## 3. Derivación token por token (valores finales)

| Token | Oscuro | Claro | Compuesto real | Ratio | AA |
|---|---|---|---|---|---|
| `--hx-void` | `#07080F` | `#E9ECF5` | — | — | fondo |
| `--hx-void-deep` | `#04050A` | `#F5F7FD` | — | 6.98:1 sobre ámbar | **AA** (texto sobre relleno) |
| `--hx-surface` | `#0C0E1C` | `#F1F4FB` | — | — | fondo |
| `--hx-surface-2` | `#11142A` | `#F7F9FE` | — | — | fondo |
| `--hx-ink` | `#E8ECFB` | `#14182B` | — | **14.88:1** | AAA |
| `--hx-ink-mute` | `rgba(232,236,251,.52)` | `rgba(20,24,43,.78)` | `#434757` | **7.81:1** | AAA |
| `--hx-ink-faint` | `rgba(232,236,251,.30)` | `rgba(20,24,43,.66)` | `#5C6070` | **5.29:1** | **AA** |
| `--hx-ink-ghost` | `rgba(232,236,251,.14)` | `rgba(20,24,43,.14)` | `#CBCED9` | 1.33:1 | decorativo |
| `--hx-solar` | `#E8B04B` | `#7A4A08` | — | **6.33:1** | **AA** |
| `--hx-solar-hot` | `#FFD27A` | `#8A5209` | — | **5.40:1** | **AA** |
| `--hx-solar-deep` | `#B9822C` | `#5A3705` | — | **8.97:1** | AAA |
| `--hx-solar-glow` | `rgba(232,176,75,.14)` | `rgba(122,74,8,.18)` | — | — | halo |
| `--hx-solar-wash` | `rgba(232,176,75,.055)` | `rgba(122,74,8,.08)` | `#E0DFE2` sobre void | — | tinte |
| `--hx-plasma` | `#7FB4E8` | `#1B5E9E` | — | **5.66:1** | **AA** |
| `--hx-plasma-glow` | `rgba(127,180,232,.24)` | `rgba(27,94,158,.22)` | — | — | halo |
| `--hx-line` | `rgba(196,208,245,.16)` | `rgba(20,24,43,.20)` | `#BEC2CD` | 1.51:1 | hairline |
| `--hx-line-soft` | `rgba(196,208,245,.08)` | `rgba(20,24,43,.14)` | `#CBCED9` | 1.33:1 | hairline |
| `--hx-line-faint` | `rgba(196,208,245,.05)` | `rgba(20,24,43,.10)` | `#D4D7E1` | 1.22:1 | hairline |
| `--hx-line-hot` | `rgba(232,176,75,.30)` | `rgba(122,74,8,.42)` | `#BAA891` | 1.95:1 | hairline |

Sin blanco puro (ground `#E9ECF5`, paneles `#F1F4FB`/`#F7F9FE`, ninguno `#FFF`/`#FEFEFE`) y sin
negro puro (tinta `#14182B`).

---

## 4. Matriz de contraste medida

Cada color con alfa se compone **sobre el fondo de ese par** (no sobre blanco).

| Par | Fondo | Ratio | AA |
|---|---|---|---|
| `ink` / void | `#E9ECF5` | **14.88:1** | AAA |
| `ink` / surface | `#F1F4FB` | **15.96:1** | AAA |
| `ink` / surface-2 | `#F7F9FE` | **16.68:1** | AAA |
| `ink-mute` / void | `#E9ECF5` | **7.81:1** | AAA |
| `ink-mute` / surface | `#F1F4FB` | **8.21:1** | AAA |
| `ink-mute` / surface-2 | `#F7F9FE` | **8.36:1** | AAA |
| `ink-mute` / fila seleccionada | `#E0DFE2` | **7.27:1** | AAA |
| `ink-faint` / void | `#E9ECF5` | **5.29:1** | AA |
| `ink-faint` / surface | `#F1F4FB` | **5.43:1** | AA |
| `ink-faint` / surface-2 | `#F7F9FE` | **5.57:1** | AA |
| `ink-faint` / fila seleccionada | `#E0DFE2` | **5.01:1** | AA (peor caso del sistema) |
| `ink-ghost` / void | `#E9ECF5` | 1.33:1 | decorativo |
| `solar` / void | `#E9ECF5` | **6.33:1** | AA |
| `solar` / surface | `#F1F4FB` | **6.79:1** | AA |
| `solar` / fila seleccionada | `#E0DFE2` | **5.63:1** | AA |
| `solar-hot` / void | `#E9ECF5` | **5.40:1** | AA |
| `solar-hot` / surface | `#F1F4FB` | **5.79:1** | AA |
| `solar-hot` / fila seleccionada | `#E0DFE2` | **4.81:1** | AA |
| `solar-deep` / void | `#E9ECF5` | **8.97:1** | AAA |
| `plasma` / void | `#E9ECF5` | **5.66:1** | AA |
| `plasma` / surface-2 | `#F7F9FE` | **6.35:1** | AA |
| `void-deep` / `solar` (`::selection`, CTA) | `#7A4A08` | **6.98:1** | AA |
| `void-deep` / `solar-hot` (hover CTA) | `#8A5209` | **5.96:1** | AA |
| anillo de foco (`solar`) / void | `#E9ECF5` | **6.33:1** | AA/UI |
| `line` / void | `#E9ECF5` | 1.51:1 | hairline |
| `line-soft` / void | `#E9ECF5` | 1.33:1 | hairline |
| `line-faint` / void | `#E9ECF5` | 1.22:1 | hairline |
| `line-hot` / void | `#E9ECF5` | 1.95:1 | hairline |

### Comparación con el oscuro (calibración)

| Par | Oscuro | Claro |
|---|---|---|
| `ink` / ground | 16.96 | 14.88 |
| `ink-mute` / ground | 5.01 | 7.81 |
| `ink-faint` / ground | 2.34 | 5.29 |
| `solar` / ground | 10.22 | 6.33 |
| `plasma` / ground | 9.13 | 5.66 |
| `void-deep` / `solar` | 10.42 | 6.98 |
| `line` / ground | 1.36 | 1.51 |
| `line-soft` / ground | 1.13 | 1.33 |
| `line-faint` / ground | 1.07 | 1.22 |
| `line-hot` / ground | 1.83 | 1.95 |

---

## 5. Hairlines: calibración

No son bordes de control: el criterio es "visibles pero discretos". Medí la fuerza real de los
hairlines del **tema oscuro** sobre su propio ground (`line` 1.36, `line-soft` 1.13,
`line-faint` 1.07) y en claro usé **un escalón más** (1.51 / 1.33 / 1.22): sobre fondos luminosos
el ojo necesita más separación para leer la misma retícula. Las alfas quedaron 0.20 / 0.14 / 0.10
sobre `#14182B`, equivalentes compositivos de 0.16 / 0.08 / 0.05 en tinta clara sobre índigo.

---

## 6. Decisiones y compromisos

1. **El oro se invierte de rol, no de función.** `#E8B04B` mide **1.66:1** sobre el ground claro
   (y `#FFD27A`, 1.21:1): no sirve ni como texto ni como borde. El token baja a **ámbar profundo
   `#7A4A08`** (6.33:1), que funciona como texto, filete de foco y borde. El oro brillante queda
   reservado a superficies oscuras.
2. **`--hx-void-deep` se invierte** (`#04050A` → `#F5F7FD`). Su único uso en Helios es ser el
   color del texto **sobre** el relleno dorado (`::selection`, `.hx-btn--solar`). Si quedaba
   oscuro, el botón ámbar era ilegible; si dejaba el botón dorado, violaba la regla de no usar
   oro brillante en claro. Resultado: píldora ámbar con texto claro, AA en ambos temas. **Es el
   único token cuyo nombre deja de describir su luminancia.**
3. **El azul se profundiza** (`#7FB4E8` → `#1B5E9E`): el original daba 1.85:1 sobre claro.
4. **Los grises se derivan por alfa sobre el ground real**, igual que en oscuro.
5. **Los halos suben de alfa** (`glow` .14→.18, `wash` .055→.08): un halo claro sobre fondo claro
   se lee como suciedad, no como luz.
6. **En claro los grises "quietos" son más fuertes que en oscuro** (mute 7.81 vs 5.01; faint 5.29
   vs 2.34). Es deliberado: el mandato del tema claro es AA y el oscuro de Helios no se toca. La
   escala se comprime (14.88 / 7.81 / 5.29) porque el ground claro ya está cerca del techo de
   luminancia; la jerarquía fina la sostienen tamaño, peso y tracking.
7. **Se agregó `color-scheme: light`** en el bloque claro, para scrollbars y controles nativos.
8. **Siete parches a `helios-base.css`** (§9): colores fijos que no pasan por tokens.

### Lo que se sacrifica

- **El "brillo dorado" no existe en claro.** Un CTA dorado sobre papel no puede ser AA y visible a
  la vez: se eligió legibilidad. `.hx-gild` sigue funcionando (tinta → ámbar → ámbar), pero ahora
  es "tinta dorada", no oro luminoso.
- **El escalón de los grises se acorta**: entre `ink` y `mute` hay menos recorrido relativo que en
  oscuro, y `mute`/`faint` quedan más cerca entre sí.
- **`--hx-void-deep` cambia de significado** (compromiso 2).

---

## 7. Auditoría contra el uso real (`src/styles/nawi.css`)

La matriz de arriba no alcanza si los tokens se usan en combinaciones distintas. Revisé **todos**
los usos de tokens Helios en la capa Ñawi (P5): `--hx-solar` ×22, `--hx-ink-faint` ×16,
`--hx-ink-mute` ×10, `--hx-line` ×15, `--hx-ink-ghost` ×4, `--hx-solar-wash` ×3,
`--hx-void-deep` ×1, `--hx-plasma` ×1, `--hx-solar-glow` ×1, `--hx-line-hot` ×1.

### 7.1 Pares verificados que ya cumplen

| Uso real | Par | Ratio |
|---|---|---|
| `.object-option.selected` / `:hover` (fondo `--hx-solar-wash`) con nombre, tipo y chevron | `ink` / fila | **13.24**, `mute` **7.27**, `faint` **5.01**, `solar` **5.63** |
| `.viewer-aviso` (fondo `--hx-solar-wash`) con texto y rótulo | `mute` **7.27**, `solar` **5.63** |
| `.hero-gild` (gradiente `solar → solar-hot → solar` recortado a texto) | **5.40 – 6.33** |
| `.hx-btn:hover` (fondo wash, texto `solar-hot`) | **4.81** |
| `::selection` (fondo `solar`, texto `void-deep`) | **6.98** |
| `.live-dot`, `.caption-dot`, `border-left: solar` (marcas) | ≥ 5.63 |
| `.object-chevron` (ghost en reposo → `solar` en hover/selección) | 1.33 → **5.63** (es un ícono de reposo, decorativo) |
| `.label-divider`, `.toolbar-slash` (separadores con ghost) | 1.33 (decorativo) |

### 7.2 BLOQUEANTE (fuera de mis archivos): rótulos sobre el recorte

`nawi.css` pinta los chips sobre la imagen con un token **propio y fijo**, fuera del sistema de
temas (decisión documentada por P5: el recorte siempre es oscuro):

```css
:root { --nawi-sky: #04050A; }
.hx-theme .image-caption, .coordinate-label, .image-date, .escala-aviso {
  background: color-mix(in srgb, var(--nawi-sky) 74%, transparent);
  color: var(--hx-ink);          /* ← en claro, ink es OSCURO */
}
```

En modo claro, `--hx-ink` (`#14182B`) sobre un chip `#04050A` da **1.16:1**: texto invisible.
No lo parcheé porque `nawi.css` es de P5 y la decisión de cómo resolverlo es de diseño. Dos
opciones, ambas válidas:

**Opción A (recomendada, mínimo cambio):** forzar tinta clara en esos chips.

```css
html[data-theme="light"] .hx-theme .image-caption,
html[data-theme="light"] .hx-theme .coordinate-label,
html[data-theme="light"] .hx-theme .image-date,
html[data-theme="light"] .hx-theme .escala-aviso {
  color: var(--hx-void-deep);   /* 19.01:1 sobre el chip oscuro */
}
```

**Opción B (chip claro):** darle al chip un valor claro por tema
(`html[data-theme="light"] .hx-theme { --nawi-sky: #F5F7FD; --nawi-sky-line: rgba(20,24,43,.18); }`)
y conservar `--hx-ink` (14.88:1 sobre `--hx-void-deep`). Cambia el look: etiqueta clara sobre foto
oscura.

### 7.3 Segundo hallazgo: `.meta-origen` con `ink-ghost`

`nawi.css` usa `color: var(--hx-ink-ghost)` para `.meta-origen` (metadato real, `--hx-fs-micro`):
**1.33:1 en claro** y **1.36:1** en oscuro. Ya era casi invisible en el tema original, así que no es
una regresión del claro, pero conviene subirlo a `--hx-ink-faint` (5.29:1 en claro).

---

## 8. Pares que NO llegan a AA: qué hacer

| Par | Ratio | Naturaleza | Recomendación |
|---|---|---|---|
| `ink-ghost` / void | **1.33:1** | `.label-divider`, `.toolbar-slash` (separadores "/"), chevron en reposo, anillos | **Sin acción** en separadores/anillos. Para `.meta-origen` (metadato real) usar `--hx-ink-faint` (§7.3). |
| `--hx-line*` / void | 1.22 – 1.95:1 | Hairlines de 1px, separadores estructurales | **Sin acción**: no son bordes de control. Si algo necesita borde "de verdad" (input), `--hx-line-hot` + `--hx-solar` en foco. |
| Rótulos sobre recorte (claro) | **1.16:1** | Chip oscuro fijo + `--hx-ink` oscuro | **Parche obligatorio antes de publicar el claro** (§7.2, opción A). |

Ningún par de texto informativo queda por debajo de 4.5:1 dentro de los tokens de Helios.

---

## 9. Parches a `helios-base.css` (7 valores fijos)

| Línea | Regla | Oscuro (fijo) | Claro (parche) | Motivo |
|---|---|---|---|---|
| 22 | `.hx-theme::before` velo inferior | `rgba(127,180,232,.045)` | `rgba(27,94,158,.05)` | conserva el tinte frío con el plasma profundo |
| 133 | `.hx-panel > p:first-child` | `rgba(232,236,251,.72)` | `rgba(20,24,43,.78)` | 7.81:1 sobre ground |
| 168 | `.hx-light--ink` halo | `rgba(232,236,251,.16)` | `rgba(20,24,43,.14)` | en claro el halo debe oscurecer |
| 199 | `.hx-cursor-ring` borde | `rgba(232,176,75,.45)` | `rgba(90,55,5,.45)` | ámbar profundo, mismo gesto |
| 204 | `.hx-cursor-ring:hover` | `rgba(232,176,75,.85)` | `rgba(90,55,5,.85)` | ídem |
| 230 | `.hx-nav` degradado | `rgba(7,8,15,.9)` | `rgba(233,236,245,.92)` | la nav sigue al ground |
| 233 | `.hx-nav.hx-is-scrolled` | `rgba(6,7,13,.9)` | `rgba(233,236,245,.94)` | ídem |

---

## 10. Verificación reproducible

**a) Contraste** (fórmula WCAG + composición alfa):

```bash
backend/.venv/bin/python - <<'PY'
import numpy as np
rgb=lambda h: np.array([int(h.lstrip('#')[i:i+2],16) for i in (0,2,4)], dtype=float)
lin=lambda c: np.where((c/255)<=0.04045, (c/255)/12.92, (((c/255)+0.055)/1.055)**2.4)
rel=lambda h: float(np.dot([0.2126,0.7152,0.0722], lin(rgb(h))))
ratio=lambda a,b: round((max(rel(a),rel(b))+0.05)/(min(rel(a),rel(b))+0.05), 2)
comp=lambda fg,a,bg: '#%02X%02X%02X'%tuple(int(round(v)) for v in (a*rgb(fg)+(1-a)*rgb(bg)))
row='#E0DFE2'                                  # fila seleccionada (wash 8% ámbar sobre void)
print(ratio(comp('#14182B',0.66,row), row))    # 5.01  → ink-faint AA en el peor caso
print(ratio('#7A4A08','#E9ECF5'))              # 6.33  → solar como texto
print(ratio('#F5F7FD','#7A4A08'))              # 6.98  → texto del CTA
PY
```

**b) Que los tokens ganen y el oscuro no cambie** (probe HTML en `/tmp` con las tres hojas en
orden y `--dump-dom` en Chrome headless):

```
light → zoneBg=rgb(233,236,245) zoneInk=rgb(20,24,43) solar=#7A4A08
        btnBg=rgb(122,74,8) btnInk=rgb(245,247,253)  nav=rgba(233,236,245,0.92)…
        panelFirst=rgba(20,24,43,0.78)  inkLightShadow=rgba(20,24,43,0.14) 0 0 15px 6px
dark  → zoneBg=rgb(7,8,15) zoneInk=rgb(232,236,251) solar=#E8B04B
        btnBg=rgb(232,176,75) btnInk=rgb(4,5,10)  nav=rgba(7,8,15,0.9)…
        panelFirst=rgba(232,236,251,0.72)  inkLightShadow=rgba(232,236,251,0.16)…
```

---

## 11. Para activarlo (3 pasos, cuando el equipo lo decida)

1. Importar `helios-tokens-light.css` **al final** de la lista de hojas en `main.js`.
2. Que el interruptor de tema escriba `document.documentElement.dataset.theme = 'light'` (ya lo
   hace hoy).
3. Aplicar el parche de §7.2 (rótulos sobre el recorte) en `nawi.css`, o pedir que se aplique.
