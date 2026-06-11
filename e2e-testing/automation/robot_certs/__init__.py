"""Robot CA certificate store and HTTPS host resolution for e2e-testing clients."""

from automation.robot_certs.host import RobotHost, fetch_robot_identity, resolve_robot_host
from automation.robot_certs.paths import (
    APP_CERT_DIR,
    E2E_ROBOT_CERTS_DIR,
    ROBOT_CERT_REGISTRY_PATH,
    ensure_e2e_robot_certs_dir,
)
from automation.robot_certs.registry import (
    RobotCertEntry,
    RobotCertRegistry,
    RobotCertRegistryError,
    find_by_ip,
    find_by_serial,
    load_registry,
    save_registry,
    upsert_robot,
)
from automation.robot_certs.store import import_legacy_pem_paths, install_der_ca_certificate, register_robot_ca

__all__ = [
    "E2E_ROBOT_CERTS_DIR",
    "APP_CERT_DIR",
    "ROBOT_CERT_REGISTRY_PATH",
    "RobotCertEntry",
    "RobotCertRegistry",
    "RobotCertRegistryError",
    "RobotHost",
    "ensure_e2e_robot_certs_dir",
    "fetch_robot_identity",
    "find_by_ip",
    "find_by_serial",
    "import_legacy_pem_paths",
    "install_der_ca_certificate",
    "load_registry",
    "register_robot_ca",
    "resolve_robot_host",
    "save_registry",
    "upsert_robot",
]
