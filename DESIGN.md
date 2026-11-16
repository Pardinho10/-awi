# ÑAWI — sistema visual

Documento del mundo visual tal como quedó implementado. No es una guía aspiracional:
si algo de acá no coincide con el CSS, el equivocado es este archivo.

**Mundo**: Helios (`src/styles/helios/`) — estética cósmica y minimalista.
Fondo índigo-negro, tipografía ultrafina con tracking amplio, estructura dibujada
sólo con hairlines de 1px y un acento dorado.

---

## 1. Archivos

| Archivo | Rol |
|---|---|
| `src/styles/helios/helios-tokens.css` | Tokens de color, tipo, movimiento y layout. **No se edita.** |
| `src/styles/helios/helios-base.css` | Componentes base del tema (`.hx-*`). **No se edita.** |
| `src/styles/helios/helios-tokens-light.css` | Derivación del tema claro. |
| `src/styles/helios/helios.js` | Reveal al hacer scroll, estado del nav, cursor. Opcional. |
| `src/styles/nawi.css` | **Capa propia de Ñawi**: traduce la interfaz al lenguaje del tema. |
| `src/components/IconoNawi.vue` | Los 29 iconos SVG del proyecto. |
| `src/components/HeroNawi.vue` | El hero: imagen de archivo animada + recorte real. |
| `src/components/GlosarioNawi.vue` | Glosario flotante de términos, desde el `?` de la barra. |
| `src/assets/cielo-vialactea*.webp` | Fondo del hero. Ver `doc/imagen-hero.md`. |
| `src/styles.css` | Hoja anterior. **En retirada**, ver §7. |

Orden de carga en `src/main.js`. El orden importa: las hojas tienen especificidad
parecida y gana la última.

```
helios-tokens.css → styles.css → helios-base.css → helios-tokens-light.css → nawi.css
```

Activación: `<body class="hx-theme">` en `index.html`. Todo el CSS propio cuelga de
`.hx-theme`, lo que da aislamiento y, de paso, la especificidad para ganarle a `styles.css`.

---

## 2. Estrategia de color

**Restrained.** Neutros tintados del mundo + un acento cálido y uno frío. No hay
rellenos de color a escala de página: el color aparece en hairlines, cifras y un
único filete de acento por bloque.

| Rol | Oscuro | Claro | Uso |
|---|---|---|---|
| `--hx-void` | `#07080F` | `#E9ECF5` | Fondo de página |
| `--hx-surface` | `#0C0E1C` | `#F1F4FB` | Superficie elevada |
| `--hx-ink` | `#E8ECFB` | `#14182B` | Texto principal |
| `--hx-ink-mute` | 52 % | 78 % | Texto secundario |
| `--hx-ink-faint` | 30 % | 66 % | Metadatos |
| `--hx-ink-ghost` | 14 % | 14 % | **Sólo separadores.** No es texto |
| `--hx-solar` | `#E8B04B` | `#7A4A08` | Acento principal |
| `--hx-plasma` | `#7FB4E8` | `#1B5E9E` | Acento secundario |
| `--hx-line` | 16 % | 20 % | Borde de panel |

En claro el oro **baja a ámbar profundo**: `#E8B04B` sobre fondo claro da 1.9:1 y
falla AA. El oro brillante queda reservado a superficies oscuras. La matriz de
contrastes medida está en `doc/paleta-clara-helios.md`; el peor caso de texto
informativo es 5.01:1.

---

## 3. Hero: dos capas que no se pueden confundir

El hero mezcla una imagen de archivo con un dato real, y la distinción es
deliberada y visible:

| Capa | Qué es | Cómo se identifica |
|---|---|---|
| Fondo | Fotografía de archivo de la Vía Láctea | Aclaración al pie del texto: «Imagen de archivo, no una observación de Ñawi» |
| Recorte derecho | **Observación real de SPHEREx**, 58×58 px a 6× | Etiqueta «Observación real de SPHEREx» + objeto, fecha y longitud de onda |

La imagen de fondo va desaturada y oscurecida (`saturate .8 / brightness .92 /
contrast 1.04`) para que no compita con el titular ni con el recorte, y debajo
lleva un velo de `--nawi-sky` que garantiza el contraste del texto sobre
cualquier zona de la imagen.

Medido sobre el fondo, con el texto oculto, en los dos extremos de la deriva
(§7) y en los dos temas —el velo es el mismo, así que la diferencia la hace el
navegador al componer—. Valores tomados de un render real en Chrome headless a
1920×1080, sobre el percentil 99.9 de luminancia de cada zona (el peor punto de
fondo, no el promedio):

| Zona | Oscuro | Claro | Mínimo AA |
|---|---|---|---|
| Titular | 8.65 – 8.70:1 | 9.78 – 9.83:1 | 3:1 (texto grande) |
| Copy | 11.99 – 12.17:1 | 12.99 – 13.20:1 | 4.5:1 |
| Riel de cifras | 16.01 – 16.10:1 | 16.55 – 16.56:1 | 3:1 |
| Aclaración | 16.53 – 16.56:1 | 16.93 – 16.94:1 | 4.5:1 |

El peor caso real es el titular en oscuro, 8.65:1: casi el triple del 3:1 que
pide un texto de ese tamaño. Medir en los dos extremos de la deriva y no en un
frame promedio es obligatorio, porque el paneo desplaza la banda galáctica —la
zona más clara— justo por detrás del titular.

Procedencia, licencia y procesado: `doc/imagen-hero.md`.

El recorte se muestra siempre en múltiplo entero (6× escritorio, 4× tablet,
3× móvil) y con `image-rendering: pixelated`. El tamaño vive en el CSS, no
inline: un estilo inline gana la media query y el recorte desborda en móvil.

El borde inferior del cover **no corta**. En tema claro, un `::after` de
88–150px disuelve la foto en el fondo de la página (`--hx-void`): evita el salto
brusco de una imagen nocturna contra una página luminosa. En tema oscuro ese
fundido **no se dibuja** (la regla vive bajo `html[data-theme="light"]`): el
destino del degradado era el mismo negro índigo de la foto, así que no producía
transición y sólo dejaba una banda visible en el borde. El padding inferior del
cover reserva el alto en ambos temas, así que el texto nunca toca el borde.

## 4. La excepción: el visor no cambia de tema

Los cuadros son PNG de fondo negro. Sobre una página clara el recorte se lee como
un bloque pegado y el polvo tenue desaparece contra el borde. El visor es una
ventana al espacio: **se queda oscuro en ambos temas**, y sus rótulos llevan tinta
fija porque la tinta del tema los volvería invisibles en claro (1.16:1).

```css
--nawi-sky / --nawi-sky-line / --nawi-sky-ink / --nawi-sky-ink-mute
```

Están fuera del sistema de temas a propósito. Si alguien los mueve adentro, el
visor deja de funcionar en uno de los dos temas.

### El oro también es de las superficies oscuras

Hay un segundo token fijo, `--nawi-sky-solar`, con el mismo motivo. En tema claro
el oro del sistema **baja a ámbar profundo** (`#7A4A08`) para alcanzar AA sobre
el fondo claro de la página; ese ámbar, puesto sobre la foto del cover o sobre
el recorte negro del visor, se apaga y deja de leerse. Todo lo que vive sobre
esas dos superficies —la palabra en oro del titular, la etiqueta del dato, la
cruz de posición, el punto de "datos reales", el punto que late en el nav—
usa el oro brillante del mundo oscuro (`#E8B04B`), que es el único acento
legible sobre una imagen o un PNG negro.

La regla para no romperlo: si un elemento se apoya sobre la foto del hero o
sobre el recorte del visor, no puede usar `--hx-solar`. Usa `--nawi-sky-solar`.

---

## 5. Tipografía

Dos familias, ambas de Google Fonts.

- **Urbanist** 200/300 — titulares y texto. Los pesos finos son el carácter del tema.
- **JetBrains Mono** 300/400 — rótulos, cifras, metadatos, todo lo que se lee como dato.

Reglas que se aplican sin excepción:

1. Los titulares nunca pasan de peso 300, en versalitas, con tracking `0.06em`–`0.10em`.
2. El cuerpo va en peso 300 en oscuro y **400 en claro**. Sobre fondo oscuro el
trazo fino se separa solo del fondo; sobre el ground claro el mismo trazo se
lava y la letra parece que le falta tinta. Por eso el peso sube un paso en
claro, en vez de bajar el contraste tipográfico en un solo tema. Los dos pesos
viven en tokens (`--nawi-fw-display`, `--nawi-fw-text`): ningún 200/300 va
literal en el CSS, así que el ajuste se hace en un solo lugar.
3. **Una sola palabra en oro por titular**, en oro liso. Nada de degradados con
   `background-clip`.
4. Las cifras llevan `font-variant-numeric: tabular-nums`. Sin eso los números bailan
   al cambiar de cuadro.
5. El wordmark `ñawi.` va en minúscula: un logo no es un titular. `ÑAWI` en
   versalitas sólo cuando el nombre aparece como titular.

---

## 6. Vocabulario de componentes

| Necesidad | Solución | Prohibido |
|---|---|---|
| Contenedor | hairline `1px var(--hx-line)`, radio 0, sin relleno | relleno, radio, sombra |
| Separador de sección | hairline `--hx-line-soft` | bloques de color |
| Botón de acción | píldora fantasma `1px` + radio 500px | relleno sólido |
| Controles circulares | `1px` + radio 50 %, 30–34px | relleno |
| Control segmentado (zoom) | cuadros radio 0, activo en oro sin relleno | pestañas con fondo |
| Estado activo de una fila | hairline solar a la izquierda | barra de 3px, relleno |
| Aviso | hairline solar a la izquierda + `--hx-solar-wash` | caja con fondo de color |
| Estado correcto / incorrecto | plasma / oro | verde y rojo |
| Foco | `outline: 1px var(--hx-solar)`, offset 3px | halo difuso |

Sombra difusa: no existe en el tema. Las únicas permitidas son los halos de
`.hx-light` y del pulso dorado del punto de estado.

### El glosario: un panel, no un modal

El `?` de la barra abre un panel de términos anclado al botón. No es un modal y
la diferencia es deliberada:

| | Modal | Panel (lo que se hizo) |
|---|---|---|
| Velo sobre la página | sí | no |
| `aria-modal` + trampa de foco | sí | no |
| Foco | se mueve al panel y no sale | entra al panel, pero Tab sigue |
| Para qué sirve | bloquear y decidir | consultar sin perder de vista |

Un glosario se consulta **mientras** se mira la pantalla: tapar el visor para
explicar qué es un segundo de arco es exactamente lo contrario de lo que hace
falta. `role="dialog"` sin `aria-modal` es correcto acá: anuncia región, no
bloqueo.

Cierra con `pointerdown` fuera (no `click`: con `click`, arrastrar desde el
panel hacia afuera lo cerraba sin intención) y con `Escape`, que es obligatorio
—sin él, quien navega con teclado queda atrapado—. Al cerrar, el foco vuelve al
botón.

Dos detalles que se midieron y no se adivinaron:

- **`text-transform: uppercase` está prohibido en los términos.** «μm» se
  convertía en «ΜM» y «σ» en «Σ». Los símbolos no sobreviven a la versalita y
  los dos dicen algo distinto.
- **El pie de procedencia va en `--hx-ink-mute`, no en `--hx-ink-faint`.** Faint
  daba 2.43:1 sobre el panel en oscuro y no pasaba AA. La procedencia es texto
  informativo: la jerarquía se hace con tamaño y mono, no bajando el contraste
  hasta volverlo ilegible.

---

## 7. Movimiento

- Nada por debajo de `150ms`. Nada que rebote.
- Transiciones de `150ms` para hover y foco, `300ms` para cambios de estado.
- `prefers-reduced-motion` desactiva el pulso del indicador y las animaciones de entrada.

### El fondo del hero deriva

La imagen de archivo del hero hace un Ken Burns lento: `scale 1.04 → 1.09` con
un paneo de 2.8% del ancho, `60s`, `ease-in-out`, `alternate` (ida y vuelta, sin
costura de loop). Lo único animado es el contenedor `.cover-fondo-capa`; el
`filter` vive en la imagen, para que no se re-renderice en cada frame.

Tres frenos, todos deliberados:

| Condición | Qué pasa | Por qué |
|---|---|---|
| `prefers-reduced-motion: reduce` | `animation: none` | El fondo es la capa más grande del hero: es la que más justifica apagarse |
| `max-width: 900px` | `animation: none` | En móvil la imagen se recorta a una franja, el paneo se lee como inestabilidad y la batería importa más |
| `.cover.is-fuera` | `paused` | El cover salió de pantalla. Se pausa, no se quita: quitarla devolvería la imagen al inicio del recorrido y habría un salto al volver |

El `scale` mínimo para que el paneo no descubra el borde es 1.04; se llega a 1.09
para que el acercamiento también se lea. El contraste del titular se midió en los
dos extremos del recorrido (6.76:1 al inicio, 6.91:1 al final, en tema oscuro),
no en un frame promedio: la deriva desplaza la banda galáctica por detrás del
titular, que es la parte más clara de la imagen. La tabla completa está en §3.

La velocidad es una decisión editorial, no técnica: a 60s por tramo el fondo no
se lee como animación. Si alguien nota que se movió, es que se quedó mirando el
fondo en vez del titular.

---

## 8. Deuda declarada

`src/styles.css` (1898 líneas, la hoja anterior) sigue cargándose y `nawi.css` la
pisa por especificidad. Quedan dos consecuencias:

1. **El bloque puente** al final de `nawi.css` reasigna los nombres de la paleta
   vieja (Gruvbox) a tokens de Helios, y fuerza `--radius` a 0 y `--shadow` a none.
   Sin él, el tema claro quedaba mitad Helios mitad Gruvbox.
2. Hay reglas viejas que ya nadie usa.

Borrar `styles.css` es el paso que falta, pero exige auditar qué clases siguen
dependiendo de ella (toast, comparador, modo ilustrativo, estados vacíos) antes de
tocarla. No es un cambio de una línea.

**Bootstrap y bootstrap-icons ya no se cargan** ni figuran en `package.json`. La
grilla del workspace es un grid propio y los iconos son SVG de `IconoNawi`. El CSS
del bundle pasó de 385 KB a 73 KB.
