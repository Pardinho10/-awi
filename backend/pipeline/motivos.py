"""
Registro único de motivos de la API de Ñawi.

Un `motivo` es la explicación científica de por qué un objeto no tiene un dato
(núcleo saturado, señal muy débil, sin recortes). No es un error de la
aplicación: es información que la interfaz muestra con honestidad.

CONVENCIÓN
----------
1. Todo motivo que viaje al frontend lleva CÓDIGO ESTABLE en `motivo_codigo`.
   El texto de `motivo` es el respaldo en español (humanos, consola, JSON crudo).
2. Los códigos viven SOLO acá. No se escriben a mano en los `datos.json` ni en
   el frontend.
3. Cada código nuevo necesita su clave `motivo.<codigo>` en
   `src/i18n/es.js` y `src/i18n/en.js`. `verificar_motivos.py` falla si falta
   o si sobra alguna.
4. Un motivo sin código (dato viejo) se deduce del texto con
   `codigo_por_texto()`; si no coincide con ningún registro, la API lo entrega
   igual con `motivo_codigo: ""` y la interfaz muestra el texto tal cual, sin
   inventar traducción.

Códigos reservados:
  - ""                → sin motivo (objeto con datos y sin advertencias)
  - "sin_datos"       → el objeto existe pero todavía no tiene datos precalculados
  - "sin_cuadros"     → no hay recortes de SPHEREx para ese objeto
"""

from __future__ import annotations

# código estable → texto de respaldo en español
MOTIVOS: dict[str, str] = {
    "senal_debil": (
        "Objeto muy tenue: la señal es débil (1 a 5 sigma) y su movimiento "
        "no se pudo medir de forma confiable."
    ),
    "nucleo_saturado": (
        "El núcleo de la estrella está saturado y enmascarado en las imágenes de "
        "SPHEREx, así que no se puede medir su brillo con fotometría de apertura "
        "estándar."
    ),
    "sin_cuadros": "No hay recortes de SPHEREx para este objeto.",
    "sin_datos": "Todavía no se precalcularon datos para este objeto.",
}


def motivo(codigo: str) -> dict[str, str]:
    """Devuelve el par {motivo, motivo_codigo} listo para datos.json.

    Un código desconocido no se inventa: se registra vacío y se avisa por stderr
    para que la validación lo detecte.
    """
    codigo = (codigo or "").strip()
    if not codigo:
        return {"motivo": "", "motivo_codigo": ""}
    texto = MOTIVOS.get(codigo)
    if texto is None:
        raise ValueError(
            f"Motivo desconocido: {codigo!r}. Agregalo a pipeline/motivos.py "
            f"(códigos válidos: {', '.join(sorted(MOTIVOS))})."
        )
    return {"motivo": texto, "motivo_codigo": codigo}


def codigo_por_texto(texto: str | None) -> str | None:
    """Deduce el código a partir del texto (compatibilidad con datos previos)."""
    if not isinstance(texto, str) or not texto.strip():
        return None
    limpio = " ".join(texto.split())
    for codigo, referencia in MOTIVOS.items():
        if " ".join(referencia.split()) == limpio:
            return codigo
    return None


def normalizar(motivo_texto: str | None, motivo_codigo: str | None) -> dict[str, str]:
    """Garantiza que un registro con motivo tenga código.

    - Si viene el código y existe, se respeta (y se rellena el texto si falta).
    - Si falta el código, se deduce del texto.
    - Si no hay motivo, se devuelven ambos vacíos.
    """
    texto = (motivo_texto or "").strip()
    codigo = (motivo_codigo or "").strip()
    if codigo and codigo in MOTIVOS:
        return {"motivo": texto or MOTIVOS[codigo], "motivo_codigo": codigo}
    if texto:
        deducido = codigo_por_texto(texto)
        return {"motivo": texto, "motivo_codigo": deducido or ""}
    return {"motivo": "", "motivo_codigo": ""}
