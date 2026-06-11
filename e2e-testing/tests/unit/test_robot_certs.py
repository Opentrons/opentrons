"""Unit tests for robot CA registry and HTTPS host resolution."""

from pathlib import Path

import pytest

from automation.robot_certs import paths as paths_module
from automation.robot_certs import registry as registry_module
from automation.robot_certs.host import resolve_robot_host
from automation.robot_certs.registry import (
    RobotCertEntry,
    RobotCertRegistry,
    RobotCertRegistryError,
    find_by_ip,
    load_registry,
    save_registry,
    upsert_robot,
)


@pytest.mark.unit
def test_upsert_robot_replaces_by_serial(tmp_path: Path) -> None:
    registry_path = tmp_path / "registry.yaml"
    upsert_robot(
        RobotCertEntry(robot_serial="SN1", ip="10.0.0.1", ca_cert="a.pem"),
        path=registry_path,
    )
    upsert_robot(
        RobotCertEntry(robot_serial="SN1", ip="10.0.0.2", ca_cert="b.pem"),
        path=registry_path,
    )

    loaded = load_registry(registry_path)
    assert len(loaded.robots) == 1
    entry = find_by_ip(loaded, "10.0.0.2")
    assert entry is not None
    assert entry.ca_cert == "b.pem"


@pytest.mark.unit
def test_resolve_robot_host_https_from_registry(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    certs_dir = tmp_path / "certs"
    certs_dir.mkdir()
    pem = certs_dir / "ca.pem"
    pem.write_bytes(b"dummy")

    registry_path = tmp_path / "registry.yaml"
    save_registry(
        RobotCertRegistry(
            robots=[
                RobotCertEntry(
                    robot_serial="SN99",
                    ip="192.168.0.20",
                    ca_cert="ca.pem",
                )
            ]
        ),
        registry_path,
    )

    monkeypatch.setattr(registry_module, "ROBOT_CERT_REGISTRY_PATH", registry_path)
    monkeypatch.setattr(paths_module, "E2E_ROBOT_CERTS_DIR", certs_dir)
    monkeypatch.setattr(registry_module, "ensure_e2e_robot_certs_dir", lambda: certs_dir)

    host = resolve_robot_host("192.168.0.20")
    assert host.secure is True
    assert host.base_url == "https://192.168.0.20:32313"
    assert host.ca_cert_paths == (pem,)
    assert host.robot_serial == "SN99"


@pytest.mark.unit
def test_resolve_robot_host_https_missing_cert(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    certs_dir = tmp_path / "certs"
    certs_dir.mkdir()
    registry_path = tmp_path / "registry.yaml"
    save_registry(RobotCertRegistry(robots=[]), registry_path)

    monkeypatch.setattr(registry_module, "ROBOT_CERT_REGISTRY_PATH", registry_path)
    monkeypatch.setattr(paths_module, "E2E_ROBOT_CERTS_DIR", certs_dir)
    monkeypatch.setattr(
        "automation.robot_certs.host.APP_CERT_DIR",
        tmp_path / "empty-app-certs",
    )
    monkeypatch.setattr(registry_module, "ensure_e2e_robot_certs_dir", lambda: certs_dir)

    with pytest.raises(RobotCertRegistryError):
        resolve_robot_host("192.168.0.99")
