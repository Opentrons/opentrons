"""Install and register robot CA certificates in the e2e-testing store."""

from __future__ import annotations

import shutil
from pathlib import Path

from automation.robot_certs.host import fetch_robot_identity
from automation.robot_certs.paths import APP_CERT_DIR, E2E_ROBOT_CERTS_DIR, ensure_e2e_robot_certs_dir
from automation.robot_certs.registry import RobotCertEntry, RobotCertRegistryError, upsert_robot
from automation.robot_encryption import save_robot_ca_certificate


def copy_pem_into_e2e_store(source_pem: Path) -> Path:
    """Copy a PEM file into ``robot-certs/`` if it is not already there."""
    ensure_e2e_robot_certs_dir()
    destination = E2E_ROBOT_CERTS_DIR / source_pem.name
    if source_pem.resolve() != destination.resolve():
        shutil.copy2(source_pem, destination)
    return destination


def install_der_ca_certificate(der_bytes: bytes) -> Path:
    """Write a DER CA cert into ``robot-certs/`` and return the PEM path."""
    return save_robot_ca_certificate(der_bytes, ensure_e2e_robot_certs_dir())


async def register_robot_ca(
    *,
    robot_ip: str,
    ca_pem_paths: list[Path],
    http_port: int,
    https_port: int,
) -> RobotCertEntry:
    """Copy CA PEMs into ``robot-certs/`` and upsert ``registry.yaml``."""
    if not ca_pem_paths:
        raise RobotCertRegistryError("At least one CA PEM path is required")

    e2e_pems = [copy_pem_into_e2e_store(path) for path in ca_pem_paths]
    primary_pem = e2e_pems[0]

    robot_serial, robot_name = await fetch_robot_identity(robot_ip, http_port=http_port)
    if not robot_serial:
        raise RobotCertRegistryError(
            f"GET http://{robot_ip}:{http_port}/health did not return robot_serial; cannot register CA in registry.yaml"
        )

    return upsert_robot(
        RobotCertEntry(
            robot_serial=robot_serial,
            ip=robot_ip,
            ca_cert=primary_pem.name,
            http_port=http_port,
            https_port=https_port,
            robot_name=robot_name,
        )
    )


def import_legacy_pem_paths() -> list[Path]:
    """Copy all Opentrons App CA PEMs from ``APP_CERT_DIR`` into ``robot-certs/``."""
    if not APP_CERT_DIR.is_dir():
        return []
    imported: list[Path] = []
    for app_pem in sorted(APP_CERT_DIR.glob("*.pem")):
        imported.append(copy_pem_into_e2e_store(app_pem))
    return imported
