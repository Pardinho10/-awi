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
| `src/components/IconoNawi.vue` | Los 28 iconos SVG del proyecto. |
| `src/components/HeroNawi.vue` | El hero: imagen de archivo animada + recorte real. |
| `src/assets/cielo-wise*.jpg` | Fondo del hero. Ver `doc/imagen-hero.md`. |
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
| Fondo | Mapa de todo el cielo en infrarrojo, **WISE / NASA-JPL-Caltech** | Crédito al pie del texto, con la aclaración «imagen de archivo, no una observación de Ñawi» |
| Recorte derecho | **Observación real de SPHEREx**, 58×58 px a 6× | Etiqueta «Observación real de SPHEREx» + objeto, fecha y longitud de onda |

La imagen de fondo va desaturada y oscurecida (`saturate .8 / brightness .92 /
contrast 1.04`) para que no compita con el titular ni con el recorte, y debajo
lleva un velo que garantiza el contraste del texto sobre cualquier zona de la
imagen: medido entre 6.7:1 y 17:1. El 6.7:1 es el peor caso, medido en los dos
extremos de la deriva del fondo (ver §7).

Procedencia, licencia y procesado: `doc/imagen-hero.md`.

El recorte se muestra siempre en múltiplo entero (6× escritorio, 4× tablet,
3× móvil) y con `image-rendering: pixelated`. El tamaño vive en el CSS, no
inline: un estilo inline gana la media query y el recorte desborda en móvil.

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

---

## 5. Tipografía

Dos familias, ambas de Google Fonts.

- **Urbanist** 200/300 — titulares y texto. Los pesos finos son el carácter del tema.
- **JetBrains Mono** 300/400 — rótulos, cifras, metadatos, todo lo que se lee como dato.

Reglas que se aplican sin excepción:

1. Los titulares nunca pasan de peso 300, en versalitas, con tracking `0.06em`–`0.10em`.
2. El cuerpo va en peso 300.
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
dos extremos del recorrido (6.71:1 al inicio, 6.83:1 al final), no en un frame
promedio.

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
