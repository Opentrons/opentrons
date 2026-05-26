"""Ensure electron_regression_test root is on sys.path for local imports."""

from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
_SCRIPTS_DIR = _ROOT.parent / "scripts"

for path in (_ROOT, _SCRIPTS_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))
