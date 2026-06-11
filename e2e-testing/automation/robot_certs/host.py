"""Resolve HTTP vs HTTPS robot host settings for httpx clients."""

from __future__ import annotations

import ssl
from dataclasses import dataclass
from pathlib import Path

import httpx

from automation.robot_certs.paths import APP_CERT_DIR, ensure_e2e_robot_certs_dir
from automation.robot_certs.registry import (
    DEFAULT_HTTP_PORT,
    DEFAULT_HTTPS_PORT,
    RobotCertRegistryError,
    ca_pem_path,
    find_by_ip,
    load_registry,
)
from automation.robot_encryption import (
    ROBOT_API_VERSION,
    ROBOT_API_VERSION_HEADER,
    build_ssl_context_for_robot_cas,
    load_saved_ca_pem_paths,
)


@dataclass(frozen=True, slots=True)
class RobotHost:
    """Connection target for a physical Flex robot."""

    ip: str
    http_port: int
    https_port: int
    secure: bool
    ca_cert_paths: tuple[Path, ...]
    robot_serial: str | None = None
    robot_name: str | None = None

    @property
    def base_url(self) -> str:
        return f"https://{self.ip}:{self.https_port}"

    @property
    def default_headers(self) -> dict[str, str]:
        return {ROBOT_API_VERSION_HEADER: ROBOT_API_VERSION}

    def httpx_verify(self) -> ssl.SSLContext:
        if not self.ca_cert_paths:
            raise RobotCertRegistryError(f"No CA certificate paths configured for robot {self.ip!r}")
        return build_ssl_context_for_robot_cas(list(self.ca_cert_paths))


def _resolve_ca_paths_for_ip(robot_ip: str) -> tuple[Path, ...]:
    registry = load_registry()
    entry = find_by_ip(registry, robot_ip)
    if entry is not None:
        pem_path = ca_pem_path(entry)
        if not pem_path.is_file():
            raise RobotCertRegistryError(f"Registry entry for {robot_ip!r} points to missing file {pem_path}")
        return (pem_path,)

    e2e_paths = load_saved_ca_pem_paths(ensure_e2e_robot_certs_dir())
    if e2e_paths:
        return tuple(e2e_paths)

    app_paths = load_saved_ca_pem_paths(APP_CERT_DIR)
    if app_paths:
        return tuple(app_paths)

    raise RobotCertRegistryError(
        f"No CA certificate found for robot {robot_ip!r}. Run scripts/verify_robot_encryption.py {robot_ip} first."
    )


def resolve_robot_host(
    robot_ip: str,
    *,
    http_port: int | None = None,
    https_port: int | None = None,
) -> RobotHost:
    """Build an HTTPS :class:`RobotHost` for ``robot_ip``.

    Loads the trusted CA from ``robot-certs/registry.yaml`` (or falls back to PEM
    files in ``robot-certs/``, then :data:`APP_CERT_DIR`).
    """
    registry = load_registry()
    entry = find_by_ip(registry, robot_ip)

    resolved_http_port = http_port or (entry.http_port if entry else DEFAULT_HTTP_PORT)
    resolved_https_port = https_port or (entry.https_port if entry else DEFAULT_HTTPS_PORT)
    ca_paths = _resolve_ca_paths_for_ip(robot_ip)

    return RobotHost(
        ip=robot_ip,
        http_port=resolved_http_port,
        https_port=resolved_https_port,
        secure=True,
        ca_cert_paths=ca_paths,
        robot_serial=entry.robot_serial if entry else None,
        robot_name=entry.robot_name if entry else None,
    )


async def fetch_robot_identity(
    robot_ip: str,
    *,
    http_port: int = DEFAULT_HTTP_PORT,
    timeout: float = 15.0,
) -> tuple[str | None, str | None]:
    """GET /health over HTTP and return ``(robot_serial, robot_name)``."""
    base_url = f"http://{robot_ip}:{http_port}"
    headers = {ROBOT_API_VERSION_HEADER: ROBOT_API_VERSION}
    async with httpx.AsyncClient(base_url=base_url, timeout=timeout) as client:
        response = await client.get("/health", headers=headers)
        response.raise_for_status()
        payload = response.json()
    if not isinstance(payload, dict):
        return None, None
    serial = payload.get("robot_serial")
    name = payload.get("name")
    return (
        serial if isinstance(serial, str) else None,
        name if isinstance(name, str) else None,
    )
