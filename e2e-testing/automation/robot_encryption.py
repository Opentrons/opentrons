"""Decrypt and store Flex robot TLS CA certificates for HTTPS clients."""

from __future__ import annotations

import base64
import ssl
from pathlib import Path

import httpx
from cryptography import fernet, x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf import pbkdf2

from automation.clients.keys_models import (
    EncryptedCACertificatesData,
    EncryptedCertificate,
    OldAndNewEncryptedCertificate,
)
from automation.robot_certs.paths import E2E_ROBOT_CERTS_DIR

DEFAULT_CERT_DIR = E2E_ROBOT_CERTS_DIR
ROBOT_API_VERSION_HEADER = "Opentrons-Version"
ROBOT_API_VERSION = "3"


class RobotEncryptionError(Exception):
    """Raised when certificate decryption or validation fails."""

    def __init__(self, message: str, *, details: list[str] | None = None) -> None:
        super().__init__(message)
        self.details = details or []


def decrypt_encrypted_ca_cert(
    password: str,
    encrypted: EncryptedCertificate,
) -> bytes:
    """Decrypt a Fernet-encrypted CA certificate and return DER-encoded x509 bytes."""
    salt = base64.urlsafe_b64decode(encrypted.key_salt)
    kdf = pbkdf2.PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=encrypted.kdf_iterations,
    )
    key = kdf.derive(password.encode("utf-8"))
    fernet_key = fernet.Fernet(base64.urlsafe_b64encode(key))
    try:
        # ``cert_data`` from JSON is the Fernet token string (url-safe base64). Do not
        # base64-decode it first; Fernet.decrypt handles that internally.
        return fernet_key.decrypt(encrypted.cert_data)
    except Exception as err:
        raise RobotEncryptionError("Incorrect encryption key or corrupt certificate data") from err


def _try_decrypt_bundle(
    password: str,
    bundle: OldAndNewEncryptedCertificate,
) -> bytes | None:
    candidates = [bundle.current]
    if bundle.previous is not None:
        candidates.append(bundle.previous)
    for candidate in candidates:
        try:
            return decrypt_encrypted_ca_cert(password, candidate)
        except RobotEncryptionError:
            continue
    return None


def decrypt_encrypted_ca_certificates(
    password: str,
    payload: EncryptedCACertificatesData,
) -> list[bytes]:
    """Decrypt all available CA certificates from an encryptedCerts response."""
    decrypted: list[bytes] = []

    current_der = _try_decrypt_bundle(password, payload.current)
    if current_der is None:
        details = _decryption_failure_details(password, payload.current, label="current CA")
        raise RobotEncryptionError(
            "Could not decrypt the current CA certificate with the supplied key",
            details=details,
        )
    decrypted.append(current_der)

    if payload.next is not None:
        next_der = _try_decrypt_bundle(password, payload.next)
        if next_der is not None:
            decrypted.append(next_der)

    return decrypted


def _decryption_failure_details(
    password: str,
    bundle: OldAndNewEncryptedCertificate,
    *,
    label: str,
) -> list[str]:
    """Build human-readable hints after a failed decrypt attempt."""
    word_count = len(password.split("-")) if password else 0
    details = [
        f"Tried decrypting the {label} with the password you entered.",
        f"Password shape: {len(password)} characters, {word_count} hyphen-separated segment(s) "
        "(Flex keys are usually three English words like word-word-word).",
    ]
    if bundle.previous is None:
        details.append(
            "The robot did not include a previous-password variant in this response. "
            "If the on-screen key rotated while you were typing, retry with a fresh key."
        )
    else:
        details.append("The robot included current and previous password variants; neither matched your input.")
    details.extend(
        [
            "Keep the Robot encryption key screen open on the Flex for the whole attempt.",
            "Enter the key, then let this script fetch certs immediately (do not pause between steps).",
            "Copy hyphens exactly; do not add spaces.",
        ]
    )
    return details


def save_robot_ca_certificate(der_bytes: bytes, cert_dir: Path) -> Path:
    """Write a robot CA certificate to disk as PEM; return the file path."""
    cert = x509.load_der_x509_certificate(der_bytes)
    fingerprint = cert.fingerprint(hashes.SHA256()).hex()
    cert_dir.mkdir(parents=True, exist_ok=True)
    pem_path = cert_dir / f"{fingerprint}.pem"
    pem_path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    return pem_path


def load_saved_ca_pem_paths(cert_dir: Path) -> list[Path]:
    """Return all saved robot CA PEM files under ``cert_dir``."""
    if not cert_dir.is_dir():
        return []
    return sorted(cert_dir.glob("*.pem"))


def build_ssl_context_for_robot_cas(cert_paths: list[Path]) -> ssl.SSLContext:
    """Build an SSL context that trusts the given robot CA PEM files."""
    if not cert_paths:
        raise RobotEncryptionError("No robot CA certificates found to build SSL context")
    ctx = ssl.create_default_context()
    for path in cert_paths:
        ctx.load_verify_locations(cafile=str(path))
    return ctx


async def probe_robot_https(
    *,
    robot_ip: str,
    port: int,
    ssl_context: ssl.SSLContext,
    timeout: float = 15.0,
) -> httpx.Response:
    """GET /health over HTTPS using a custom CA trust store."""
    base_url = f"https://{robot_ip}:{port}"
    headers = {ROBOT_API_VERSION_HEADER: ROBOT_API_VERSION}
    async with httpx.AsyncClient(
        base_url=base_url,
        verify=ssl_context,
        timeout=timeout,
    ) as client:
        response = await client.get("/health", headers=headers)
        response.raise_for_status()
        return response


def format_trusted_ca_paths(cert_paths: list[Path]) -> list[str]:
    """Return display paths for CA files loaded into the SSL context."""
    return [str(path) for path in cert_paths]
