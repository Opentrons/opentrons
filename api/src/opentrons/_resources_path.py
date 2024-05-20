"""The path to the package's `resources/` directory."""

from pathlib import Path

_THIS = Path(__file__)
RESOURCES_PATH = (_THIS.parent / "resources").absolute()
