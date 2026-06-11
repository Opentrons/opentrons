"""Bootstrap a uv-managed environment for analyses-snapshot-testing.

This script must be run from the analyses-snapshot-testing directory (cwd contains pyproject.toml).
It will:
  1) Ensure uv is available and create/sync a uv venv (Python 3.12 by default) for this project via `uv venv` and `uv sync`.
  2) Parse ../api and ../shared-data Pipfiles for production [packages] exact pins and install them in this venv via `uv pip install ...`.
  3) Install ../api and ../shared-data themselves editable into the same venv.

Environment variables:
  - UV_PY (default: 3.12)
  - API_DIR (default: ../api)
  - SHARED_DATA_DIR (default: ../shared-data)
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Sequence, Tuple

import tomli
from packaging.utils import canonicalize_name

SKIP_KEYS = {"editable", "path", "file", "git", "ref", "url"}


@dataclass(frozen=True)
class Pin:
    """Represents a single pinned requirement line.

    Attributes:
        name: Canonicalized package name (PEP 503).
        version_spec: Must be an exact pin like '==1.2.3'.
        extras: Optional extras.
        markers: Optional environment markers string.
    """

    name: str
    version_spec: str
    extras: Tuple[str, ...] = ()
    markers: Optional[str] = None

    def to_req(self) -> str:
        extras_part = f"[{','.join(self.extras)}]" if self.extras else ""
        base = f"{self.name}{extras_part}{self.version_spec}"
        if self.markers:
            return f"{base}; {self.markers}"
        return base


def _print(msg: str) -> None:
    print(msg, flush=True)


def _err(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def ensure_cwd_has_pyproject() -> Path:
    """Ensure current working directory contains a pyproject.toml.

    Returns:
        Path to pyproject.toml.
    Raises:
        SystemExit: If no pyproject.toml exists.
    """
    pyproj = Path("pyproject.toml")
    if not pyproj.is_file():
        _err("Error: pyproject.toml not found in current directory. Run from analyses-snapshot-testing/")
        raise SystemExit(2)
    return pyproj


def ensure_uv_available() -> None:
    """Ensure `uv` executable is available in PATH.

    Raises:
        SystemExit: If uv is not found.
    """
    if shutil.which("uv") is None:
        _err("Error: 'uv' not found on PATH. Install uv from https://github.com/astral-sh/uv and try again.")
        raise SystemExit(127)


def run_cmd(cmd: Sequence[str], cwd: Optional[Path] = None) -> None:
    """Run a command, streaming output. Exit on failure.

    Args:
        cmd: Command and arguments.
        cwd: Working directory to run in.

    Raises:
        SystemExit: On nonzero exit; the same exit code is propagated.
    """
    try:
        _print(f"[run] {' '.join(cmd)}")
        subprocess.run(cmd, cwd=str(cwd) if cwd else None, check=True)
    except subprocess.CalledProcessError as e:
        _err(f"Command failed ({e.returncode}): {' '.join(cmd)}")
        raise SystemExit(e.returncode) from e


def uv_version() -> str:
    try:
        out = subprocess.check_output(["uv", "--version"], text=True).strip()
        return out
    except Exception:
        return "unknown"


def uv_python_version() -> str:
    """Get Python version inside the uv-managed environment using `uv run`.

    Falls back to `sys.version.split()[0]` if it fails.
    """
    try:
        out = subprocess.check_output(["uv", "run", "python", "--version"], text=True).strip()
        return out
    except Exception:
        return f"Python {sys.version.split()[0]}"


def ensure_uv_venv_and_sync(python: str) -> None:
    """Ensure uv venv exists with the given Python version, then run `uv sync`.

    Args:
        python: Python version string, e.g., "3.12".
    """
    venv_path = Path(".venv")
    if not venv_path.exists():
        _print(f"[plan] Creating uv venv at {venv_path} with Python {python}")
        run_cmd(["uv", "venv", "--python", python, str(venv_path)])
    _print("[plan] Syncing project dependencies via `uv sync`")
    run_cmd(["uv", "sync"])  # uses pyproject in CWD


def _pin_from_table(name: str, table: dict) -> Optional[Pin]:
    """Convert a Pipfile table entry to a Pin if valid."""
    if any(k in table for k in SKIP_KEYS) or bool(table.get("editable", False)):
        return None
    version_val = table.get("version")
    if not isinstance(version_val, str) or not version_val.startswith("=="):
        return None
    extras: Tuple[str, ...] = ()
    extras_val = table.get("extras")
    if isinstance(extras_val, list) and all(isinstance(x, str) for x in extras_val):
        extras = tuple(extras_val)
    markers_val = table.get("markers")
    markers: Optional[str] = markers_val.strip() if isinstance(markers_val, str) and markers_val.strip() else None
    return Pin(name=canonicalize_name(name), version_spec=version_val, extras=extras, markers=markers)


def parse_pipfile_packages(pipfile_path: Path) -> List[Pin]:
    """Parse Pipenv Pipfile [packages] into exact pins only."""
    try:
        data = tomli.loads(pipfile_path.read_text(encoding="utf-8"))
    except tomli.TOMLDecodeError as e:
        raise RuntimeError(f"Malformed Pipfile at {pipfile_path}: {e}") from e
    packages = data.get("packages")
    if not isinstance(packages, dict):
        return []
    pins: List[Pin] = []
    for raw_name, raw_value in packages.items():
        if isinstance(raw_value, dict):
            pin = _pin_from_table(str(raw_name), raw_value)
            if pin:
                pins.append(pin)
        elif isinstance(raw_value, str) and raw_value.strip().startswith("=="):
            pins.append(Pin(name=canonicalize_name(str(raw_name)), version_spec=raw_value.strip()))
    pins.sort(key=lambda p: (p.name, p.to_req()))
    return pins


def install_pins(target_dir: Path, pins: List[Pin]) -> int:
    """Install a list of pins using `uv pip install`.

    Args:
        target_dir: Directory for which we are installing (for logs only).
        pins: The pins to install.

    Returns:
        Count of installed pins (length of pins).
    """
    if not pins:
        _print(f"[plan] No third-party pins for {target_dir}, skipping to editable install")
        return 0
    reqs = [p.to_req() for p in pins]
    _print(f"[plan] Installing {len(reqs)} third-party pins for {target_dir}:")
    for r in reqs:
        _print(f"  - {r}")
    run_cmd(["uv", "pip", "install", *reqs])
    _print("[ok] Third-party pins installed")
    return len(reqs)


def editable_install(path: Path) -> None:
    """Install a local project in editable mode via uv pip install -e PATH."""
    run_cmd(["uv", "pip", "install", "-e", str(path)])
    _print(f"[ok] Editable install: {path}")


def main() -> int:
    """Main entrypoint following the fixed bootstrap sequence.

    Returns:
        Exit code integer.
    """
    ensure_cwd_has_pyproject()
    ensure_uv_available()

    uv_py = os.environ.get("UV_PY", "3.12")
    api_dir = Path(os.environ.get("API_DIR", "../api"))
    sd_dir = Path(os.environ.get("SHARED_DATA_DIR", "../shared-data"))

    # Step 1: Create/sync uv venv for current project
    ensure_uv_venv_and_sync(uv_py)

    # Step 2: Install third-party exact pins from sibling Pipfiles
    totals: List[Tuple[str, int]] = []
    # Install shared-data first to ensure its dependencies and package are available
    # before api (ordering requirement).
    for sibling in [("shared-data", sd_dir), ("api", api_dir)]:
        label, path = sibling
        pipfile = path / "Pipfile"
        count = 0
        if pipfile.is_file():
            try:
                pins = parse_pipfile_packages(pipfile)
            except Exception as e:  # parse error
                _err(f"Error parsing {pipfile}: {e}")
                return 2
            count = install_pins(path, pins)
        else:
            _print(f"[warn] Pipfile not found for {label} at {pipfile}; skipping third-party pins")
        totals.append((label, count))

    # Step 3: Editable installs of siblings
    # Editable installs: shared-data first, then api
    editable_install(sd_dir)
    editable_install(api_dir)

    # Summary
    venv_path = Path(".venv").resolve()
    _print("")
    _print("==== Bootstrap Summary ====")
    _print(f"uv version: {uv_version()}")
    _print(f"Venv Python: {uv_python_version()}")
    _print(f"Venv path: {venv_path}")
    for label, count in totals:
        _print(f"{label} third-party pins installed: {count}")
    _print("Editable installs: -e ../shared-data, -e ../api")
    _print("===========================")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
