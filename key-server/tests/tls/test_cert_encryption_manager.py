"""Tests for the certificate encryption manager."""

import asyncio
import base64
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from cryptography import fernet, x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf import pbkdf2

from key_server.tls import cryptography_utils
from key_server.tls.cert_encryption_manager import CertEncryptionManager


@pytest.fixture
def password_size_words() -> int:
    """The number of words for a password."""
    return 3


@pytest.fixture
def password_timestep_s() -> int:
    """How long the password validity duration quanta are."""
    return 30


@pytest.fixture
def t0() -> datetime:
    """The epoch time for password validity durations."""
    return datetime.now(timezone.utc)


@pytest.fixture
async def subject(
    password_size_words: int,
    password_timestep_s: int,
    t0: datetime,
) -> CertEncryptionManager:
    """A CertEncryptionManager set up with a keygen task."""
    return await CertEncryptionManager.create(
        password_size_words, password_timestep_s, t0
    )


async def test_current_key_refreshes(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """It should give you a new password after the password duration quantum ticks."""
    first_pass = await subject.current_key(
        t0 + timedelta(seconds=password_timestep_s // 2)
    )
    second_pass = await subject.current_key(
        t0 + timedelta(seconds=(password_timestep_s * 3) // 2)
    )
    assert first_pass.key.urlencoded_key != second_pass.key.urlencoded_key


async def test_pass_lifecycle_no_initial_keys(subject: CertEncryptionManager) -> None:
    """It should not start with a key."""
    assert subject._current_key is None
    assert subject._previous_key is None


async def test_pass_lifecycle_has_initial_task(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """It should start with a task."""
    assert subject._keygen_task is not None


async def test_pass_lifecycle_first_key_use_marks(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """When a key is first requested it should be realized and marked with the current time."""
    first_key = await subject.current_key(
        t0 + timedelta(seconds=(password_timestep_s // 2))
    )
    assert first_key.first_used_at_discretized == t0


async def test_pass_lifecycle_first_key_reused_within_window(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """When a key is requested multiple times in a window it should be reused."""
    first_key = await subject.current_key(
        t0 + timedelta(seconds=(password_timestep_s * 0.5))
    )
    second_key = await subject.current_key(
        t0 + timedelta(seconds=password_timestep_s * 0.6)
    )
    assert first_key == second_key


async def test_pass_lifecycle_key_not_reused_across_window(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """When a key is requested in a window after another key was in the previous window, the new key should be new."""
    first_key = await subject.current_key(
        t0 + timedelta(seconds=(password_timestep_s * 0.5))
    )
    second_key = await subject.current_key(
        t0 + timedelta(seconds=password_timestep_s * 1.5)
    )
    assert second_key != first_key


async def test_pass_lifecycle_first_key_becomes_previous(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """If keys are requested in subsequent windows the old one should be tracked."""
    first_key = await subject.current_key(
        t0 + timedelta(seconds=password_timestep_s * 10.1)
    )
    first_as_prev = await subject.previous_key(
        t0 + timedelta(seconds=password_timestep_s * 11.1)
    )
    assert first_as_prev == first_key


async def test_pass_lifecycle_does_not_keep_too_previous_keys(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """If keys are requested in non-subsequent windows the old one should not be tracked."""
    await subject.current_key(t0 + timedelta(seconds=password_timestep_s * 10.1))
    none_prev = await subject.previous_key(
        t0 + timedelta(seconds=password_timestep_s * 12.1)
    )
    assert none_prev is None


@pytest.mark.parametrize("quanta", [0.5, 10])
async def test_pass_lifecycle_has_no_previous_keys_initially(
    subject: CertEncryptionManager,
    t0: datetime,
    password_timestep_s: int,
    quanta: float,
) -> None:
    """When the initial key is requested there should be no previous key."""
    assert (
        await subject.previous_key(t0 + timedelta(seconds=password_timestep_s * quanta))
        is None
    )


@pytest.mark.parametrize(
    "quantum_multiple,quanta",
    [(0, 0), (1, 1), (0.75, 0), (1.25, 1), (10, 10), (20.2, 20)],
)
def test_discretize_now(
    password_timestep_s: int,
    subject: CertEncryptionManager,
    t0: datetime,
    quantum_multiple: float,
    quanta: int,
) -> None:
    """It should discretize times into chunks."""
    assert subject._discretize_now(
        t0 + timedelta(seconds=password_timestep_s * quantum_multiple)
    ) == (t0 + timedelta(seconds=password_timestep_s * quanta))


async def test_encrypt_cert_roundtrips_both_passwords(
    subject: CertEncryptionManager,
    t0: datetime,
    password_timestep_s: int,
    tmp_path: Path,
) -> None:
    """It should encrypt certs with old and new passwords."""
    previous_key = await subject.current_key(
        t0 + timedelta(seconds=password_timestep_s * 0.5)
    )
    current_key = await subject.current_key(
        t0 + timedelta(seconds=password_timestep_s * 1.5)
    )
    cert_path = tmp_path / "certs"
    cert_path.mkdir()
    cert = cryptography_utils.create_ca(cert_path, cert_path, t0, timedelta(days=2))
    encrypted = await subject.encrypt_cert(
        t0 + timedelta(seconds=password_timestep_s * 1.8), cert
    )
    assert encrypted.previous is not None
    assert encrypted.previous != encrypted.current
    current_decrypt = fernet.Fernet(current_key.key.urlencoded_key).decrypt(
        encrypted.current.cert_data
    )
    previous_decrypt = fernet.Fernet(previous_key.key.urlencoded_key).decrypt(
        encrypted.previous.cert_data
    )
    current_loaded = x509.load_der_x509_certificate(current_decrypt)
    previous_loaded = x509.load_der_x509_certificate(previous_decrypt)
    assert cryptography_utils.fingerprint(cert.cert) == cryptography_utils.fingerprint(
        current_loaded
    )
    assert cryptography_utils.fingerprint(cert.cert) == cryptography_utils.fingerprint(
        previous_loaded
    )


async def test_encrypt_cert_handles_no_previous(
    subject: CertEncryptionManager,
    t0: datetime,
    password_timestep_s: int,
    tmp_path: Path,
) -> None:
    """If there is no previous key it should not send a previous-encryption cert."""
    cert_path = tmp_path / "certs"
    cert_path.mkdir()
    cert = cryptography_utils.create_ca(cert_path, cert_path, t0, timedelta(days=10))
    encrypted = await subject.encrypt_cert(
        t0 + timedelta(seconds=password_timestep_s * 10.3), cert
    )
    assert encrypted.previous is None


async def test_encrypt_cert_roundtrips_from_password(
    subject: CertEncryptionManager,
    t0: datetime,
    password_timestep_s: int,
    tmp_path: Path,
) -> None:
    """It should rountrip decrypt with only the password."""
    cert_path = tmp_path / "certs"
    cert_path.mkdir()
    cert = cryptography_utils.create_ca(cert_path, cert_path, t0, timedelta(days=10))
    encrypted = await subject.encrypt_cert(
        t0 + timedelta(seconds=password_timestep_s * 100.2), cert
    )
    current_key = await subject.current_key(
        t0 + timedelta(seconds=password_timestep_s * 100.2)
    )
    kdf = pbkdf2.PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=base64.urlsafe_b64decode(encrypted.current.key_salt),
        iterations=encrypted.current.kdf_iterations,
    )
    key = await asyncio.to_thread(kdf.derive, current_key.key.password.encode("utf-8"))
    decrypted_bytes = fernet.Fernet(base64.urlsafe_b64encode(key)).decrypt(
        encrypted.current.cert_data
    )
    decrypted_cert = x509.load_der_x509_certificate(decrypted_bytes)
    assert cryptography_utils.fingerprint(cert.cert) == cryptography_utils.fingerprint(
        decrypted_cert
    )
