# Imagen de fondo del hero

## Archivo

`src/assets/cielo-vialactea.webp` (2100×1400) y las variantes
`cielo-vialactea-1500.webp` (1500×1000) y `cielo-vialactea-1100.webp` (1100×733),
servidas en un `srcset` de tres anchos.

Los JPEG anteriores (`cielo-wise.jpg`, `cielo-wise-1100.jpg`) siguen en el
repositorio sin uso, conservados por pedido explícito. No se referencian desde
el código.

## Qué es

Fotografía de la Vía Láctea: la banda galáctica cruza el encuadre en diagonal,
con el núcleo y las nebulosas rojizas sobre el centro. Es imagen de archivo.

**No es una observación de Ñawi ni de SPHEREx.** El hero la distingue con la
aclaración visible al pie del texto: *«Imagen de archivo, no una observación de
Ñawi»*.

### Sobre el crédito

La versión anterior de este fondo era el mapa de todo el cielo de **WISE**
(NASA/JPL-Caltech) y llevaba ese crédito al pie. Al reemplazar la imagen por
esta fotografía ese crédito dejó de ser cierto —no es una imagen de WISE—, así
que se retiró la atribución de origen y se conservó únicamente la aclaración de
que es archivo y no dato propio. Esa aclaración es obligatoria y no debe
quitarse: sin ella el hero sugiere que el fondo es una observación del producto.

Si en el futuro se incorpora una imagen con autoría y licencia conocidas, hay
que agregar el crédito correspondiente. Mientras la procedencia de esta foto no
esté documentada, **no debe atribuirse a ninguna misión ni institución**.

## Cómo se procesó

Fuente: `milky-way-full-stars-space.jpg`, 6000×4000 px, 13,8 MB, calidad JPEG
100. La orientación es 3:2, así que se mantiene la proporción y el recorte a
cover lo hace el CSS (`object-fit: cover`, `object-position: center 48%`).

```
2000→2100 px de ancho, LANCZOS, desenfoque gaussiano 0.4, WebP q74  → 221 KB
1500 px de ancho,          idem                          WebP q74  →  97 KB
1100 px de ancho,          idem                          WebP q78  →  58 KB
```

**Por qué WebP y no JPEG**: la imagen original pesa 13,8 MB, inviable para el
hero. En WebP se sirve en tres anchos con un peso total de 375 KB y el navegador
descarga sólo uno.

**Por qué el desenfoque de 0.4 px**: la foto tiene grano de ISO alto en todas
las zonas oscuras. El grano es información de alta frecuencia que el códec gasta
en preservar, y a tamaño de pantalla no aporta nada. Un gaussiano de 0.4 px lo
atenúa sin tocar las estrellas grandes ni las nebulosas, y baja el archivo un
~22% (273 KB → 221 KB en el ancho mayor). Verificado a 1:1 con el brillo
levantado 2,4×: sin pérdida visible de detalle.

**Calidad elegida por prueba, no por defecto**: en un recorte 1:1 sobre la zona
más poblada de estrellas, q70 ya se sostiene y q76 es limpio. Se usa q74 en los
anchos grandes y q78 en el chico, porque a 1100 px el archivo es tan liviano que
no vale la pena comprimir más.

## La animación

El fondo no es estático: desde que el hero se convirtió en cover, la imagen
deriva lentamente. Es un Ken Burns de `scale 1.04 → 1.09` con paneo de 2.8%,
`60s ease-in-out alternate`, sobre una capa contenedora (`.cover-fondo-capa`)
para no re-renderizar el `filter` en cada frame.

**El archivo no cambió por esto.** La deriva es transformación CSS sobre el WebP
existente: no hay video, no hay GIF, no hay sprite. Se anima lo que ya estaba,
en vez de reemplazarlo por un asset más pesado.

La animación se apaga en `prefers-reduced-motion`, en `max-width: 900px` y
cuando el cover sale de pantalla. Detalle y razones: `DESIGN.md` §7.

## Contraste

La foto es más oscura que el mapa de WISE anterior (luma media 25 contra 32), y
el `filter` del CSS la oscurece otro tanto (`saturate .8 brightness .92 contrast
1.04`). Se midió el resultado con el velo compuesto sobre la zona del titular:
**16,7:1** contra la tinta clara en el peor punto. El velo está dimensionado
para la composición anterior y sigue alcanzando con esta; si se cambia el
encuadre, hay que volver a medir en los dos extremos de la deriva, no en un solo
frame.

## Por qué importa la etiqueta

Esta imagen **no es una observación de Ñawi ni de SPHEREx**: es archivo. El hero
la distingue explícitamente de dos maneras:

1. La aclaración al pie del texto: *«Imagen de archivo, no una observación de
   Ñawi»*.
2. El recorte de la derecha lleva su propia etiqueta: *«Observación real de
   SPHEREx»*, con objeto, fecha y longitud de onda.

Si se quita la aclaración, el hero pasa a afirmar algo falso. No lo hagas.

## Qué NO es

- No es una imagen de SPHEREx. SPHEREx es la misión que Ñawi visualiza.
- No es la vista de ningún objeto del catálogo. Los recortes de los cinco
  objetos son los PNG de `backend/data/<slug>/frames/`.
- No es el mapa de WISE. Ese era el fondo anterior; esta es otra fotografía.
