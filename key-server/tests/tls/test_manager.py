"""Tests for the TLS system manager."""

from pathlib import Path

import pytest
from cryptography import x509

from key_server.tls import constants
from key_server.tls.manager import TLSManager


@pytest.fixture
def ee_dir(tmp_path: Path) -> Path:
    """A place for end-entity certs."""
    return tmp_path / "ee"


@pytest.fixture
def ca_cert_dir(tmp_path: Path) -> Path:
    """A place for CA certs."""
    return tmp_path / "ca-certs"


@pytest.fixture
def ca_key_dir(tmp_path: Path) -> Path:
    """A place for CA keys."""
    return tmp_path / "ca-keys"


@pytest.fixture
async def subject(ee_dir: Path, ca_cert_dir: Path, ca_key_dir: Path) -> TLSManager:
    """A TLSManager instance."""
    return await TLSManager.create(ca_cert_dir, ca_key_dir, ee_dir)


async def test_initializes_ca_manager(
    subject: TLSManager, ca_cert_dir: Path, ca_key_dir: Path
) -> None:
    """It should build a CA manager and have its task running and CA built."""
    assert subject._ca_manager._expiry_task
    assert subject._ca_manager._current_ca is not None
    assert not subject._ca_manager._expiry_task.done()
    cert_contents = list(ca_cert_dir.iterdir())
    assert len(cert_contents) == 1
    assert constants.CA_CERT_NAME_PATTERN.match(cert_contents[0].name)
    key_contents = list(ca_key_dir.iterdir())
    assert len(key_contents) == 1
    assert constants.CA_KEY_NAME_PATTERN.match(key_contents[0].name)


async def test_initializes_ee_manager(subject: TLSManager, ee_dir: Path) -> None:
    """It should build an EE manager and set up its certs."""
    assert subject._ee_manager.ready()
    ee_contents = list(ee_dir.iterdir())
    assert len(ee_contents) == 2
    assert sorted([content.name for content in ee_contents]) == sorted(
        [constants.TLS_KEY_NAME, constants.TLS_CERT_NAME]
    )


async def test_uses_ca_for_ee_manager(subject: TLSManager) -> None:
    """It should use its linked CA manager for its linked EE manager."""
    ca = subject._ca_manager._current_ca
    ee = subject._ee_manager._ee_pair
    assert ee
    aki = ee.cert.extensions.get_extension_for_class(x509.AuthorityKeyIdentifier)
    # note: this is not a secure way to do tls signature verification in practice. however
    # it is really good for unit tests that make sure we didn't use the wrong cert
    assert (
        aki.value.key_identifier
        == ca.cert.extensions.get_extension_for_class(
            x509.SubjectKeyIdentifier
        ).value.key_identifier
    )


async def test_tears_down_ca_manager(subject: TLSManager) -> None:
    """When torn down it should tear down the CA."""
    await subject.teardown()
    assert subject._ca_manager._expiry_task.done()


async def test_tears_down_ee_manager(subject: TLSManager, ee_dir: Path) -> None:
    """When torn down it should tear down the EE."""
    await subject.teardown()
    assert subject._ee_manager._ee_pair is None
    contents = list(ee_dir.iterdir())
    assert len(contents) == 0
