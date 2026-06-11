"""Paths for robot CA certificates used by e2e-testing HTTP clients."""

from __future__ import annotations

from pathlib import Path

# e2e-testing/ (parent of automation/)
E2E_TESTING_ROOT = Path(__file__).resolve().parents[2]

# Primary, gitignored store for robot CA PEM files and registry.yaml
E2E_ROBOT_CERTS_DIR = E2E_TESTING_ROOT / "robot-certs"

ROBOT_CERT_REGISTRY_PATH = E2E_ROBOT_CERTS_DIR / "registry.yaml"

# Opentrons App robot CA store (~/.opentrons/robot-certificates)
APP_CERT_DIR = Path.home() / ".opentrons" / "robot-certificates"


def ensure_e2e_robot_certs_dir() -> Path:
    """Create ``robot-certs/`` if needed and return it."""
    E2E_ROBOT_CERTS_DIR.mkdir(parents=True, exist_ok=True)
    return E2E_ROBOT_CERTS_DIR
