"""Unit tests for robot TLS CA decryption helpers."""

import base64

import pytest
from cryptography import fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf import pbkdf2

from automation.clients.keys_models import EncryptedCertificate
from automation.robot_encryption import RobotEncryptionError, decrypt_encrypted_ca_cert


@pytest.mark.unit
def test_decrypt_encrypted_ca_cert_roundtrip() -> None:
    """PBKDF2 + Fernet roundtrip matches key-server behavior."""
    password = "hello-world-password"
    salt = b"\x01" * 16
    plaintext = b"badger badger badger SNAKE"

    kdf = pbkdf2.PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=10,
    )
    kdf_key = kdf.derive(password.encode("utf-8"))
    token = fernet.Fernet(base64.urlsafe_b64encode(kdf_key)).encrypt(plaintext)

    encrypted = EncryptedCertificate(
        cert_data=token.decode("ascii"),
        key_salt=base64.urlsafe_b64encode(salt).decode("ascii"),
        key_expires_at="2099-01-01T00:00:00+00:00",
        kdf_iterations=10,
    )

    assert decrypt_encrypted_ca_cert(password, encrypted) == plaintext


@pytest.mark.unit
def test_decrypt_encrypted_ca_cert_wrong_password() -> None:
    encrypted = EncryptedCertificate(
        cert_data="AAAA",
        key_salt=base64.urlsafe_b64encode(b"\x02" * 16).decode("ascii"),
        key_expires_at="2099-01-01T00:00:00+00:00",
        kdf_iterations=10,
    )
    with pytest.raises(RobotEncryptionError):
        decrypt_encrypted_ca_cert("wrong-password", encrypted)
