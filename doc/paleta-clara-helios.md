# Paleta clara de Helios — derivación y verificación AA

**Archivo entregado:** `src/styles/helios/helios-tokens-light.css`
**Base:** `src/styles/helios/helios-tokens.css` (Helios oficial, tema único oscuro)
**Alcance:** solo tokens de color. Tipografía, movimiento y layout no se tocan.
**Método de medición:** fórmula WCAG de luminancia relativa con `numpy`
(`backend/.venv/bin/python`), no estimaciones a ojo. Reproducible con el script
de la sección 9.

---

## 0. Veredicto rápido

- **19 tokens de color** derivados; **30 tokens** (tipografía, movimiento, layout) intactos.
- **7 tokens de texto** con AA verificado: `ink` 14.88:1, `ink-mute` 5.62:1, `solar` 6.33:1,
  `solar-hot` 5.08:1, `solar-deep` 8.97:1, `plasma` 5.66:1 y `void-deep` 6.98:1 (texto sobre
  el ámbar). Los otros 12 no tienen rol de texto: 3 fondos, 4 hairlines, 3 halos/tintes y
  2 decorativos (`ink-faint` 3.76:1 y `ink-ghost` 1.33:1).
- El **oro brillante** deja de usarse en claro: se reemplaza por un ámbar profundo
  (`#7A4A08`, 6.33:1). El oro del tema oscuro mide **1.66:1** sobre el ground claro (`#E9ECF5`)
  y **1.21:1** en su variante `solar-hot`.
- El tema oscuro **no cambia**: los mismos archivos siguen dando los valores originales
  (verificado en navegador, sección 9).

---

## 1. Mecanismo de activación

Nawi ya tiene un interruptor de tema y Helios tiene un aislamiento por zona. La paleta clara
respeta los dos:

| Pieza | Cómo funciona |
|---|---|
| Nawi | `document.documentElement.dataset.theme = 'light'` → `<html data-theme="light">`. `styles.css` lo lee con `:root[data-theme='light']`. |
| Helios | La zona es cualquier elemento con `class="hx-theme"` (puede ser una sección, no hace falta `<body>`). |
| Este archivo | `html[data-theme="light"] .hx-theme { … }` → especificidad (0,2,1), gana sobre `:root` (0,1,0) de `helios-tokens.css` sin importar el orden. |

**Importación:** debe ir **después** de `helios-base.css`, porque incluye parches a siete
valores fijos de la base (sección 8):

```js
import './styles/helios/helios-tokens.css';
import './styles/helios/helios-base.css';
import './styles/helios/helios-tokens-light.css'; // ← último
```

> Estado actual: **el archivo no está importado** (no se tocó `main.js` ni `index.html`, según lo
> pedido). Hasta que se agregue esa línea, no afecta a nadie: el tema claro de Helios simplemente
> no existe en la página.

---

## 2. Inventario completo de tokens (49)

### 2.1 Color (19) — los únicos que se derivan

| Grupo | Tokens |
|---|---|
| Superficies | `--hx-void`, `--hx-void-deep`, `--hx-surface`, `--hx-surface-2` |
| Tinta | `--hx-ink`, `--hx-ink-mute`, `--hx-ink-faint`, `--hx-ink-ghost` |
| Solar (oro) | `--hx-solar`, `--hx-solar-hot`, `--hx-solar-deep`, `--hx-solar-glow`, `--hx-solar-wash` |
| Plasma (azul) | `--hx-plasma`, `--hx-plasma-glow` |
| Hairlines | `--hx-line`, `--hx-line-soft`, `--hx-line-faint`, `--hx-line-hot` |

### 2.2 Tipografía (15) — no cambian

`--hx-font-display`, `--hx-font-mono`,
`--hx-fs-display`, `--hx-fs-h1`, `--hx-fs-h2`, `--hx-fs-h3`, `--hx-fs-lead`, `--hx-fs-body`,
`--hx-fs-small`, `--hx-fs-label`, `--hx-fs-micro`,
`--hx-track-display`, `--hx-track-heading`, `--hx-track-label`, `--hx-track-wide`.

### 2.3 Movimiento (5) — no cambian

`--hx-t-fast`, `--hx-t-base`, `--hx-t-slow`, `--hx-t-rise`, `--hx-ease-out`.

### 2.4 Layout (10) — no cambian

`--hx-pad`, `--hx-pad-sm`, `--hx-pad-xs`, `--hx-nav-h`, `--hx-maxw`,
`--hx-space-xs`, `--hx-space-sm`, `--hx-space-md`, `--hx-space-lg`, `--hx-space-xl`.

_(Las variantes responsive de `--hx-pad`, `--hx-nav-h`, `--hx-space-xl` y los tres `--hx-track-*`
en `@media` tampoco cambian: son layout/tipografía.)_

---

## 3. Derivación token por token

Ratios medidos sobre el **ground claro** (`--hx-void` #E9ECF5) salvo que se indique otro fondo.
Los grises con alfa se informan con su **compuesto efectivo** sobre ese ground.

| Token | Oscuro (original) | Claro (derivado) | Compuesto en claro | Ratio | AA |
|---|---|---|---|---|---|
| `--hx-void` | `#07080F` | `#E9ECF5` | — | — | n/a (fondo) |
| `--hx-void-deep` | `#04050A` | `#F5F7FD` | — | 6.98:1 sobre `solar` | **AA** (texto sobre ámbar) |
| `--hx-surface` | `#0C0E1C` | `#F1F4FB` | — | — | n/a (fondo) |
| `--hx-surface-2` | `#11142A` | `#F7F9FE` | — | — | n/a (fondo) |
| `--hx-ink` | `#E8ECFB` | `#14182B` | — | **14.88:1** | AAA |
| `--hx-ink-mute` | `rgba(232,236,251,.52)` | `rgba(20,24,43,.68)` | `#585C6C` | **5.62:1** | **AA** |
| `--hx-ink-faint` | `rgba(232,236,251,.30)` | `rgba(20,24,43,.55)` | `#747786` | 3.76:1 | no (decorativo) |
| `--hx-ink-ghost` | `rgba(232,236,251,.14)` | `rgba(20,24,43,.14)` | `#CBCED9` | 1.33:1 | no (decorativo) |
| `--hx-solar` | `#E8B04B` | `#7A4A08` | — | **6.33:1** | **AA** |
| `--hx-solar-hot` | `#FFD27A` | `#8F560A` | — | **5.08:1** | **AA** |
| `--hx-solar-deep` | `#B9822C` | `#5A3705` | — | **8.97:1** | AAA |
| `--hx-solar-glow` | `rgba(232,176,75,.14)` | `rgba(122,74,8,.18)` | — | n/a (halo) | n/a |
| `--hx-solar-wash` | `rgba(232,176,75,.055)` | `rgba(122,74,8,.08)` | — | n/a (tinte) | n/a |
| `--hx-plasma` | `#7FB4E8` | `#1B5E9E` | — | **5.66:1** | **AA** |
| `--hx-plasma-glow` | `rgba(127,180,232,.24)` | `rgba(27,94,158,.22)` | — | n/a (halo) | n/a |
| `--hx-line` | `rgba(196,208,245,.16)` | `rgba(20,24,43,.20)` | `#BEC2CD` | 1.51:1 | n/a (hairline) |
| `--hx-line-soft` | `rgba(196,208,245,.08)` | `rgba(20,24,43,.14)` | `#CBCED9` | 1.33:1 | n/a (hairline) |
| `--hx-line-faint` | `rgba(196,208,245,.05)` | `rgba(20,24,43,.10)` | `#D4D7E1` | 1.22:1 | n/a (hairline) |
| `--hx-line-hot` | `rgba(232,176,75,.30)` | `rgba(122,74,8,.42)` | `#BAA891` | 1.95:1 | n/a (hairline) |

**Sin blanco puro ni negro puro:** el ground es `#E9ECF5` (índigo muy leve, B > G > R), los
paneles suben a `#F1F4FB` / `#F7F9FE` (ninguno es `#FFF` ni `#FEFEFE`), y la tinta es `#14182B`
(índigo-negro, no `#000`).

---

## 4. Matriz de contraste medida

Todos los pares pedidos, más los que aparecen en `helios-base.css`.

| # | Par | Fondo | Ratio | Veredicto |
|---|---|---|---|---|
| 1 | `ink` sobre `void` | #E9ECF5 | **14.88:1** | AAA |
| 2 | `ink` sobre `surface` | #F1F4FB | **15.96:1** | AAA |
| 3 | `ink` sobre `surface-2` | #F7F9FE | **16.68:1** | AAA |
| 4 | `ink-mute` sobre `void` | #E9ECF5 | **5.62:1** | AA |
| 5 | `ink-mute` sobre `surface` | #F1F4FB | **6.03:1** | AA |
| 6 | `ink-mute` sobre `surface-2` | #F7F9FE | **6.30:1** | AA |
| 7 | `ink-faint` sobre `void` | #E9ECF5 | 3.76:1 | **no AA** — decorativo (ver §7) |
| 8 | `ink-faint` sobre `surface` | #F1F4FB | 4.04:1 | no AA — decorativo |
| 9 | `solar` (texto) sobre `void` | #E9ECF5 | **6.33:1** | AA |
| 10 | `solar` (texto) sobre `surface` | #F1F4FB | **6.79:1** | AA |
| 11 | `solar` (texto) sobre `surface-2` | #F7F9FE | **7.09:1** | AA |
| 12 | `solar-hot` (hover) sobre `void` | #E9ECF5 | **5.08:1** | AA |
| 13 | `solar-deep` sobre `void` | #E9ECF5 | **8.97:1** | AAA |
| 14 | `plasma` sobre `void` | #E9ECF5 | **5.66:1** | AA |
| 15 | `plasma` sobre `surface` | #F1F4FB | **6.07:1** | AA |
| 16 | `plasma` sobre `surface-2` | #F7F9FE | **6.35:1** | AA |
| 17 | `void-deep` sobre `solar` (botón y `::selection`) | #7A4A08 | **6.98:1** | AA |
| 18 | `void-deep` sobre `solar-hot` (hover del botón) | #8F560A | **5.60:1** | AA |
| 19 | anillo de foco (`solar`) sobre `void` | #E9ECF5 | **6.33:1** | AA / UI ≥3 |
| 20 | `ink` al 78% (`.hx-panel p:first-child`) sobre `void` | #E9ECF5 | **7.81:1** | AA |
| 21 | `ink-ghost` sobre `void` | #E9ECF5 | 1.33:1 | decorativo (anillos) |

### Comparación con el tema oscuro (para calibrar)

| Par | Oscuro | Claro |
|---|---|---|
| `ink` / ground | 16.96:1 | 14.88:1 |
| `ink-mute` / ground | 5.01:1 | 5.62:1 |
| `ink-faint` / ground | 2.34:1 | 3.76:1 |
| `solar` / ground | 10.22:1 | 6.33:1 |
| `plasma` / ground | 9.13:1 | 5.66:1 |
| `void-deep` / `solar` | 10.42:1 | 6.98:1 |
| `line` / ground | 1.36:1 | 1.51:1 |
| `line-soft` / ground | 1.13:1 | 1.33:1 |
| `line-faint` / ground | 1.07:1 | 1.22:1 |
| `line-hot` / ground | 1.83:1 | 1.95:1 |

La jerarquía del tema oscuro se conserva; el claro es un poco más contrastado en los grises y
más "apretado" en los acentos, porque los colores luminosos se van al extremo opuesto.

---

## 5. Hairlines: cómo se calibraron

La estructura de Helios son filetes de 1px (`--hx-line*`). No son bordes de control, así que no
les aplica el 3:1 de componentes de UI: el criterio es **visibilidad discreta**.

- Medí primero la fuerza real de los hairlines **del tema oscuro** sobre su propio ground:
  `line` 1.36:1, `line-soft` 1.13:1, `line-faint` 1.07:1.
- En claro usé **un escalón más de fuerza** (1.51 / 1.33 / 1.22) porque sobre fondos luminosos el
  ojo necesita más separación para leer la misma retícula. `line-hot` (hover de paneles) sube de
  1.83 a 1.95 y gana temperatura con el ámbar profundo al 42%.
- Las alfas quedaron en 0.20 / 0.14 / 0.10 sobre `#14182B`, que es el equivalente compositivo del
  0.16 / 0.08 / 0.05 en tinta clara sobre índigo-negro.

---

## 6. Decisiones y compromisos

1. **El oro se invierte de rol, no de función.** En oscuro `--hx-solar` es un relleno/acento
   luminoso (`#E8B04B`, 10.22:1 sobre el void). En claro ese mismo color mide **1.66:1** y no sirve
   ni para texto ni para borde. Por eso el token baja a **ámbar profundo `#7A4A08`** (6.33:1), que
   funciona como texto, filete de foco y borde. El oro brillante no se usa en claro.
2. **Consecuencia: `--hx-void-deep` se invierte.** Su único uso en `helios-base.css` es ser el
   color del texto **sobre** oro (`::selection` y `.hx-btn--solar`). Si en claro lo dejaba oscuro,
   el botón ámbar quedaba ilegible; si dejaba el botón dorado, violaba la regla de no usar oro
   brillante sobre claro. Se resolvió dejando `void-deep` como casi-blanco frío `#F5F7FD`
   (6.98:1 sobre el ámbar): el botón pasa a ser una píldora ámbar con texto claro, el mismo par
   estructural que en oscuro, con AA en ambos temas. **Este es el compromiso principal** y el
   único token cuyo nombre deja de describir su luminancia.
3. **El azul (`--hx-plasma`) también se profundiza** (`#7FB4E8` → `#1B5E9E`). Es el color
   "frío" del sistema: sobre claro el original daba **1.85:1** y el derivado da 5.66:1, así que puede
   usarse como texto (`.hx-light--plasma` ya era solo un punto, pero `--hx-plasma` también se usa
   como color de acento en consumidores).
4. **Los grises se derivan por alfa, igual que en oscuro**, para que el sistema se comporte
   igual: `ink-mute` al 0.68 (5.62:1), `faint` al 0.55, `ghost` al 0.14. El compuesto se midió
   sobre el ground real, no sobre blanco.
5. **`--hx-solar-glow` y `--hx-solar-wash` suben de alfa en claro** (0.14→0.18 y 0.055→0.08):
   un halo claro sobre fondo claro se lee como suciedad, no como luz; con un poco más de alfa
   tiñe sin ensuciar.
6. **`--hx-ink-faint` mejora respecto del original pero no llega a AA.** En oscuro mide 2.34:1; en
   claro 3.76:1. Se decidió no igualarlo a `ink-mute` (que daría AA pero borraría el escalón de
   jerarquía de Helios, donde `faint` es el nivel de los rótulos micro). Ver §7.
7. **Se agregó `color-scheme: light`** dentro del bloque claro, para que scrollbars y controles
   nativos acompañen. No es un token de Helios; es una propiedad de presentación ligada al tema.
8. **Siete parches a `helios-base.css`** (sección 8): la base tiene colores fijos que no pasan por
   tokens. No se editó la base: se sobreescribe con los mismos selectores.

### Lo que se sacrifica

- **El "brillo dorado" del tema oscuro no existe en claro.** Un CTA dorado sobre papel no puede
  ser AA y visible a la vez; se eligió legibilidad (ámbar profundo) y se perdió el efecto de luz.
  El gradiente `.hx-gild` sigue funcionando (tinta → ámbar → ámbar claro), pero ahora es "tinta
  dorada", no "oro luminoso".
- **La jerarquía de grises se comprime**: entre `ink` (14.88) y `ink-mute` (5.62) hay menos
  recorrido relativo que en oscuro (16.96 vs 5.01), porque el ground claro ya está cerca del
  techo de luminancia.
- **`--hx-void-deep` cambia de significado** (compromiso 2).

---

## 7. Pares que NO alcanzan AA 4.5:1 y qué recomiendo

| Par | Ratio | Naturaleza | Recomendación |
|---|---|---|---|
| `ink-faint` / `void` | **3.76:1** | Texto decorativo: `.hx-label`, `.hx-micro` (10–11px, mayúsculas, tracking amplio) | **Aceptarlo como decorativo** (supera el 3:1 de texto grande y mejora el 2.34:1 del tema oscuro). Si algún rótulo lleva información real (unidad, fecha, estado), usar **`--hx-ink-mute`** (5.62:1) o `--hx-ink` en ese caso puntual. |
| `ink-ghost` / `void` | 1.33:1 | Solo relleno de anillos (`.hx-ring--dashed`), nunca texto | Sin acción: es geometría decorativa. |
| `--hx-line*` / `void` | 1.22–1.51:1 | Hairlines de 1px, separadores estructurales | Sin acción: son filetes, no bordes de control (no les aplica 3:1). Si un contenedor necesita borde "de verdad" (por ejemplo, un input), usar `--hx-line-hot` (1.95:1) más `--hx-solar` para el estado de foco (6.33:1). |

Ningún par de **texto informativo** queda por debajo de AA.

---

## 8. Parches a `helios-base.css` (7 valores fijos)

`helios-base.css` tiene colores escritos a mano que no pasan por tokens. Sin corregirlos, el modo
claro quedaría con texto casi blanco sobre fondo claro, una nav negra y halos blancos. El archivo
nuevo los sobreescribe **sin editar la base**:

| Línea base | Regla | Oscuro (fijo) | Claro (parche) | Ratio / motivo |
|---|---|---|---|---|
| 22 | `.hx-theme::before` (velo inferior) | `rgba(127,180,232,.045)` | `rgba(27,94,158,.05)` | Mantiene el tinte frío con el plasma profundo |
| 133 | `.hx-panel > p:first-child` | `rgba(232,236,251,.72)` | `rgba(20,24,43,.78)` | **7.81:1** sobre ground |
| 168 | `.hx-light--ink` halo | `rgba(232,236,251,.16)` | `rgba(20,24,43,.14)` | En claro el halo debe oscurecer |
| 199 | `.hx-cursor-ring` borde | `rgba(232,176,75,.45)` | `rgba(90,55,5,.45)` | Ámbar profundo (mismo gesto) |
| 204 | `.hx-cursor-ring:hover` | `rgba(232,176,75,.85)` | `rgba(90,55,5,.85)` | Ídem |
| 230 | `.hx-nav` degradado | `rgba(7,8,15,.9)` | `rgba(233,236,245,.92)` | La nav sigue al ground |
| 233 | `.hx-nav.hx-is-scrolled` | `rgba(6,7,13,.9)` | `rgba(233,236,245,.94)` | Ídem |

---

## 9. Cómo verifiqué (reproducible)

**a) Contraste.** Fórmula WCAG con numpy:

```bash
backend/.venv/bin/python - <<'PY'
import numpy as np
def rgb(h):
    h=h.lstrip('#'); return np.array([int(h[i:i+2],16) for i in (0,2,4)],dtype=float)
def lin(c):
    c=c/255.0; return np.where(c<=0.04045,c/12.92,((c+0.055)/1.055)**2.4)
def rel(h):
    c=lin(rgb(h)); return float(0.2126*c[0]+0.7152*c[1]+0.0722*c[2])
def ratio(a,b):
    la,lb=rel(a),rel(b); hi,lo=max(la,lb),min(la,lb); return round((hi+0.05)/(lo+0.05),2)
def comp(fg,alpha,bg):                      # alfa sobre el ground real
    f,b=rgb(fg),rgb(bg); o=alpha*f+(1-alpha)*b
    return '#%02X%02X%02X'%tuple(int(round(v)) for v in o)
print(ratio('#14182B','#E9ECF5'), ratio(comp('#14182B',0.68,'#E9ECF5'),'#E9ECF5'))
PY
```

**b) Que los tokens realmente ganen.** Probe HTML en `/tmp` con las tres hojas en orden
(`helios-tokens.css`, `helios-base.css`, `helios-tokens-light.css`) y `--dump-dom` en Chrome
headless. Resultado con `data-theme="light"`:

```
zoneBg=rgb(233, 236, 245)   zoneInk=rgb(20, 24, 43)   solar=#7A4A08
btnBg=rgb(122, 74, 8)       btnInk=rgb(245, 247, 253)     ← CTA ámbar con texto claro
nav=linear-gradient(rgba(233, 236, 245, 0.92), …)
panelFirst=rgba(20, 24, 43, 0.78)   inkLightShadow=rgba(20, 24, 43, 0.14) 0 0 15px 6px
```

**c) Que el tema oscuro no cambió.** Mismo probe con `data-theme="dark"`:

```
zoneBg=rgb(7, 8, 15)  zoneInk=rgb(232, 236, 251)  solar=#E8B04B
btnBg=rgb(232, 176, 75)  btnInk=rgb(4, 5, 10)  nav=rgba(7, 8, 15, 0.9)…
panelFirst=rgba(232, 236, 251, 0.72)  inkLightShadow=rgba(232, 236, 251, 0.16)…
```

Los 19 tokens claros resuelven con los valores de la tabla §3 y el oscuro queda idéntico al
original de Helios.

---

## 10. Para activarlo (3 pasos, cuando el equipo lo decida)

1. Importar `helios-tokens-light.css` **al final** de la lista de hojas en `main.js`.
2. Asegurar que el interruptor de tema escriba `document.documentElement.dataset.theme = 'light'`
   (ya lo hace hoy).
3. Poner `class="hx-theme"` en la zona que deba adoptar Helios (por ejemplo, `<body>` o la sección
   pública).

No hace falta JavaScript nuevo, ni media queries de `prefers-color-scheme`: el tema lo decide el
interruptor existente.
