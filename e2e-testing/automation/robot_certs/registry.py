"""YAML registry mapping Flex robots to trusted CA certificate files."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import yaml
from pydantic import BaseModel, Field

from automation.robot_certs.paths import ROBOT_CERT_REGISTRY_PATH, ensure_e2e_robot_certs_dir

DEFAULT_HTTP_PORT = 31950
DEFAULT_HTTPS_PORT = 32313


class RobotCertRegistryError(Exception):
    """Raised when the robot certificate registry is missing or invalid."""


class RobotCertEntry(BaseModel):
    """One robot's trusted CA and connection details."""

    robot_serial: str = Field(description="Hardware serial from GET /health (robot_serial)")
    ip: str
    ca_cert: str = Field(description="PEM filename relative to robot-certs/")
    http_port: int = DEFAULT_HTTP_PORT
    https_port: int = DEFAULT_HTTPS_PORT
    robot_name: str | None = None
    updated_at: str | None = None


class RobotCertRegistry(BaseModel):
    robots: list[RobotCertEntry] = Field(default_factory=list)


def load_registry(path: Path | None = None) -> RobotCertRegistry:
    """Load ``registry.yaml``, returning an empty registry if the file is absent."""
    registry_path = path or ROBOT_CERT_REGISTRY_PATH
    if not registry_path.is_file():
        return RobotCertRegistry()
    raw = yaml.safe_load(registry_path.read_text(encoding="utf-8"))
    if raw is None:
        return RobotCertRegistry()
    return RobotCertRegistry.model_validate(raw)


def save_registry(registry: RobotCertRegistry, path: Path | None = None) -> Path:
    """Write ``registry.yaml``."""
    registry_path = path or ROBOT_CERT_REGISTRY_PATH
    ensure_e2e_robot_certs_dir()
    registry_path.write_text(
        yaml.safe_dump(
            registry.model_dump(mode="json", exclude_none=True),
            sort_keys=False,
            default_flow_style=False,
        ),
        encoding="utf-8",
    )
    return registry_path


def ca_pem_path(entry: RobotCertEntry, *, certs_dir: Path | None = None) -> Path:
    """Resolve a registry entry to an absolute PEM path."""
    base = certs_dir or ensure_e2e_robot_certs_dir()
    return base / entry.ca_cert


def find_by_ip(registry: RobotCertRegistry, ip: str) -> RobotCertEntry | None:
    for entry in registry.robots:
        if entry.ip == ip:
            return entry
    return None


def find_by_serial(registry: RobotCertRegistry, robot_serial: str) -> RobotCertEntry | None:
    for entry in registry.robots:
        if entry.robot_serial == robot_serial:
            return entry
    return None


def upsert_robot(entry: RobotCertEntry, path: Path | None = None) -> RobotCertEntry:
    """Insert or replace a robot entry keyed by ``robot_serial``."""
    registry = load_registry(path)
    entry = entry.model_copy(
        update={"updated_at": datetime.now(tz=UTC).isoformat()},
    )
    remaining = [r for r in registry.robots if r.robot_serial != entry.robot_serial]
    remaining.append(entry)
    save_registry(RobotCertRegistry(robots=remaining), path)
    return entry
