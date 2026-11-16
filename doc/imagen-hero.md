# Imagen de fondo del hero

## Archivo

`src/assets/cielo-wise.jpg` (1600×780) y `src/assets/cielo-wise-1100.jpg` (900×439).

## Qué es

Mapa de **todo el cielo en infrarrojo**, mosaico de la misión **WISE**
(Wide-field Infrared Survey Explorer) de NASA, publicado como parte del
All-Sky Data Release de 2012.

- **Producto**: PIA15481 — *Mapping the Infrared Universe: The Entire WISE Sky*
- **Crédito**: NASA / JPL-Caltech
- **Original**: `https://science.nasa.gov/wp-content/uploads/2023/09/jpegpia15481-2.jpg` (10000×5030 px, 6,8 MB)

## Licencia

NASA no registra derechos de autor sobre su material en Estados Unidos y el
uso está permitido, incluido el comercial, siempre que se acredite la fuente y
no se sugiera endoso. La política de imágenes de JPL lo confirma: las imágenes
de sitios públicos `jpl.nasa.gov` pueden usarse para cualquier propósito sin
permiso previo.

- https://www.nasa.gov/nasa-brand-center/images-and-media/
- https://www.jpl.nasa.gov/jpl-image-use-policy/

**Condición que cumplimos**: el crédito `NASA/JPL-Caltech` es visible en el
hero, junto con la aclaración de que es imagen de archivo.

## Cómo se procesó

Recorte de la franja central del original —la Vía Láctea y las nebulosas— para
evitar el borde del óvalo de la proyección, que se veía como un marco. Después
se reescaló y comprimió en dos anchos para `srcset`.

```
caja = (2630, 1359, 7370, 3671)   # 4740×2312 px del original
1600×780  → calidad 76, progresivo, optimizado  (194 KB)
 900×439  → calidad 74, progresivo, optimizado  ( 50 KB)
```

Los JPEG se sirven tal cual: **no se convirtieron a WebP** porque esta máquina
no tiene conversor de imágenes disponible.

## Por qué importa la etiqueta

Esta imagen **no es una observación de Ñawi ni de SPHEREx**: es archivo de otra
misión. El hero la distingue explícitamente de dos maneras:

1. El crédito al pie del texto: *«Fondo: mapa de todo el cielo en infrarrojo,
   WISE · NASA/JPL-Caltech · imagen de archivo, no una observación de Ñawi»*.
2. El recorte de la derecha lleva su propia etiqueta: *«Observación real de
   SPHEREx»*, con objeto, fecha y longitud de onda.

Si se quita el crédito, el hero pasa a afirmar algo falso. No lo hagas.

## Qué NO es

- No es una imagen de SPHEREx. SPHEREx es la misión que Ñawi visualiza; WISE es
  otra misión distinta, anterior, que también mapeó el cielo en infrarrojo.
- No es la vista de ningún objeto del catálogo. Los recortes de los cinco
  objetos son los PNG de `backend/data/<slug>/frames/`.
