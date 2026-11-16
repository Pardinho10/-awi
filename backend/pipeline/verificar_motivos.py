"""
Verifica la convención de motivos (backend ↔ frontend).

Qué controla
------------
1. Cada `datos.json` con `motivo` no vacío tiene `motivo_codigo` y ese código
   existe en `pipeline/motivos.py`.
2. El texto guardado coincide con el del registro (si no, se avisa: puede ser
   un texto viejo o editado a mano).
3. Cada código del registro tiene su clave `motivo.<codigo>` en `src/i18n/es.js`
   y en `src/i18n/en.js`, y no hay claves de i18n sin código en el registro.

Uso
---
    cd backend && ./.venv/bin/python pipeline/verificar_motivos.py

Sale con código 1 si hay errores (sirve como chequeo previo a un commit o a la
demo). Sale con 0 y un resumen si todo está en orden.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from motivos import MOTIVOS, codigo_por_texto

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent
I18N = REPO / "src" / "i18n"


def _datos() -> list[Path]:
    return sorted(BACKEND.glob("data/*/datos.json"))


def _claves_i18n(path: Path) -> set[str]:
    """Extrae las claves del bloque `motivo: { ... }` del catálogo de i18n."""
    if not path.exists():
        return set()
    texto = path.read_text(encoding="utf-8")
    bloque = re.search(r"motivo:\s*\{(?P<cuerpo>.*?)\n  \}", texto, re.S)
    if not bloque:
        return set()
    return set(re.findall(r"^\s*([a-z0-9_]+):", bloque.group("cuerpo"), re.M))


def main() -> int:
    errores: list[str] = []
    avisos: list[str] = []

    print("Motivos registrados:", ", ".join(sorted(MOTIVOS)) or "(ninguno)")
    print()

    # 1 y 2: datos.json
    for ruta in _datos():
        slug = ruta.parent.name
        try:
            d = json.loads(ruta.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            errores.append(f"{slug}: datos.json no es JSON válido ({error})")
            continue

        motivo = (d.get("motivo") or "").strip()
        codigo = (d.get("motivo_codigo") or "").strip()

        if not motivo:
            if codigo:
                errores.append(f"{slug}: tiene motivo_codigo «{codigo}» pero motivo vacío")
            else:
                print(f"  {slug:16} sin motivo (ok)")
            continue

        if not codigo:
            deducido = codigo_por_texto(motivo)
            sugerencia = f" (se deduce «{deducido}»)" if deducido else ""
            errores.append(f"{slug}: motivo sin motivo_codigo{sugerencia}")
            continue

        if codigo not in MOTIVOS:
            errores.append(f"{slug}: motivo_codigo «{codigo}» no existe en pipeline/motivos.py")
            continue

        if " ".join(motivo.split()) != " ".join(MOTIVOS[codigo].split()):
            avisos.append(f"{slug}: el texto de «{codigo}» difiere del registro (¿editado a mano?)")

        print(f"  {slug:16} «{codigo}» (ok)")

    # 3: paridad con i18n
    print()
    for idioma in ("es", "en"):
        claves = _claves_i18n(I18N / f"{idioma}.js")
        faltan = sorted(set(MOTIVOS) - claves)
        sobran = sorted(claves - set(MOTIVOS))
        if faltan:
            errores.append(f"i18n {idioma}: falta la clave motivo.* para {', '.join(faltan)}")
        if sobran:
            errores.append(f"i18n {idioma}: sobran claves sin código en el registro: {', '.join(sobran)}")
        print(f"  i18n {idioma}: {len(claves)} claves de motivo")

    print()
    for aviso in avisos:
        print(f"AVISO  {aviso}")
    for error in errores:
        print(f"ERROR  {error}")

    if errores:
        print(f"\n{len(errores)} error(es). La convención de motivos no se cumple.")
        return 1

    print("\nConvención de motivos: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
