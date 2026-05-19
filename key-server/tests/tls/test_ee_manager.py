from datetime import datetime, timedelta, timezone
from ipaddress import IPv4Address
from pathlib import Path

import pytest
from cryptography import x509

from key_server.tls import constants, cryptography_utils, file_utils
from key_server.tls.ee_manager import TLSEEManager


@pytest.fixture
def ee_dir(tmp_path: Path) -> Path:
    """A place to store end-entity data."""
    return tmp_path / "ee-test"


@pytest.fixture
def hostname() -> str:
    """A dummy hostname."""
    return "test-hostname"


@pytest.fixture
def ip_addresses() -> list[str]:
    """Some dummy IP addresses."""
    return ["1.2.3.4", "5.6.7.8"]


@pytest.fixture
def subject(ee_dir: Path, hostname: str, ip_addresses: list[str]) -> TLSEEManager:
    """An end-entity manager with typical settings."""
    return TLSEEManager(
        ee_dir, ee_dir, hostname, ip_addresses, TLSEEManager.rotate_cert_none
    )


@pytest.fixture
async def initialized_subject(
    subject: TLSEEManager,
    ca: cryptography_utils.X509Pair,
    hostname: str,
    ip_addresses: list[str],
) -> TLSEEManager:
    """An end-entity manager with certificates built."""
    precert = subject.generate_precert()
    signed = cryptography_utils.seal_cert_builder_with_ca(precert, ca)
    await subject.install_cert(signed)
    return subject


@pytest.fixture
def ca(tmp_path: Path) -> cryptography_utils.X509Pair:
    """A CA for verifying end-entity certificates."""
    now = datetime.now(timezone.utc)
    return cryptography_utils.create_ca(
        tmp_path / "ca", tmp_path / "ca", now, timedelta(days=1)
    )


def test_subject_does_not_reuse_certs(
    ee_dir: Path, hostname: str, ip_addresses: list[str]
) -> None:
    """It should not load certs and keys already present in the directory on construction."""
    now = datetime.now(timezone.utc)
    ca = cryptography_utils.create_ca(ee_dir, ee_dir, now, timedelta(days=1))
    precert = cryptography_utils.build_tls_precert(
        ee_dir, now, timedelta(hours=1), hostname, ip_addresses
    )
    signed = cryptography_utils.seal_cert_builder_with_ca(precert, ca)
    cryptography_utils.install_tls_cert(ee_dir, signed)
    subject = TLSEEManager(
        ee_dir, ee_dir, hostname, ip_addresses, TLSEEManager.rotate_cert_none
    )
    assert subject._ee_pair is None
    assert not subject.ready(now)


def test_subject_not_born_ready(subject: TLSEEManager) -> None:
    """It should start life unready, as do we all."""
    assert not subject.ready(datetime.now(timezone.utc))


def test_subject_becomes_ready_after_generating_a_cert(
    initialized_subject: TLSEEManager,
) -> None:
    """It should become ready when generating a certificate."""
    assert initialized_subject.ready(datetime.now(timezone.utc))


def test_subject_becomes_unready_after_removing_a_cert(
    initialized_subject: TLSEEManager,
) -> None:
    """It should stop being ready after removing a certificate."""
    initialized_subject.remove_cert("test")
    assert not initialized_subject.ready(datetime.now(timezone.utc))


def test_subject_readiness_based_on_argument(
    initialized_subject: TLSEEManager,
) -> None:
    """It should base its readiness assessment on the time point provided."""
    assert not initialized_subject.ready(
        datetime.now(timezone.utc) + timedelta(hours=23, minutes=1)
    )
    assert initialized_subject.ready(
        datetime.now(timezone.utc) + timedelta(hours=22, minutes=59)
    )
    assert not initialized_subject.ready(
        datetime.now(timezone.utc) - timedelta(hours=1)
    )


def test_subject_uses_robot_details(
    initialized_subject: TLSEEManager, hostname: str, ip_addresses: list[str]
) -> None:
    """It should use the robot identity details provided when generating certs."""
    assert initialized_subject._ee_pair
    san = initialized_subject._ee_pair.cert.extensions.get_extension_for_class(
        x509.SubjectAlternativeName
    )
    assert x509.DNSName(f"{hostname}.local") in san.value
    for ip_address in ip_addresses:
        assert x509.IPAddress(IPv4Address(ip_address)) in san.value


def test_generate_precert_saves_key(ee_dir: Path, subject: TLSEEManager) -> None:
    """Generating a precert should save the key (in a temp name) and the key alone."""
    precert = subject.generate_precert()
    contents = list(ee_dir.iterdir())
    assert len(contents) == 1
    assert contents[0].name.startswith(constants.TLS_KEY_NAME)
    loaded = file_utils.load_key(contents[0])
    assert loaded
    assert (
        loaded.private_numbers().private_value
        == precert.key.private_numbers().private_value
    )


def test_install_cert_saves_cert_and_moves_key(
    ee_dir: Path, initialized_subject: TLSEEManager
) -> None:
    """Installing a cert should save it."""
    ee_contents = list(ee_dir.iterdir())
    assert len(ee_contents) == 2
    assert constants.TLS_CERT_NAME in [entry.name for entry in ee_contents]
    assert constants.TLS_KEY_NAME in [entry.name for entry in ee_contents]
    cert = file_utils.load_cert(ee_dir / constants.TLS_CERT_NAME, "PEM")
    assert cert
    assert initialized_subject._ee_pair
    assert cryptography_utils.fingerprint(cert) == cryptography_utils.fingerprint(
        initialized_subject._ee_pair.cert
    )
