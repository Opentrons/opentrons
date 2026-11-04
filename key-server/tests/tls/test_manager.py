"""Tests for the TLS system manager."""

import asyncio
import base64
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import AsyncIterator

import pytest
from cryptography import x509

from key_server.tls import constants, cryptography_utils
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
def cert_password_length_words() -> int:
    return 3


@pytest.fixture
def cert_password_rotation_time_s() -> int:
    return 30


@pytest.fixture
async def subject(
    ee_dir: Path,
    ca_cert_dir: Path,
    ca_key_dir: Path,
    cert_password_length_words: int,
    cert_password_rotation_time_s: int,
) -> AsyncIterator[TLSManager]:
    """A TLSManager instance."""
    manager = await TLSManager.create(
        ca_cert_dir,
        ca_key_dir,
        ee_dir,
        "dev-none",
        cert_password_length_words,
        cert_password_rotation_time_s,
    )
    try:
        yield manager
    finally:
        await manager.teardown()


async def test_initializes_ca_manager(
    subject: TLSManager, ca_cert_dir: Path, ca_key_dir: Path
) -> None:
    """It should build a CA manager and have its task running and CA built."""
    assert subject._ca_manager._current_ca is not None
    cert_contents = list(ca_cert_dir.iterdir())
    assert len(cert_contents) == 1
    assert constants.CA_CERT_NAME_PATTERN.match(cert_contents[0].name)
    key_contents = list(ca_key_dir.iterdir())
    assert len(key_contents) == 1
    assert constants.CA_KEY_NAME_PATTERN.match(key_contents[0].name)


async def test_initializes_ee_manager(subject: TLSManager, ee_dir: Path) -> None:
    """It should build an EE manager and set up its certs."""
    assert subject._ee_manager.ready(datetime.now(timezone.utc))
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


async def test_tears_down_ee_manager(subject: TLSManager, ee_dir: Path) -> None:
    """When torn down it should tear down the EE."""
    await subject.teardown()
    assert subject._ee_manager._ee_pair is None
    contents = list(ee_dir.iterdir())
    assert len(contents) == 0


async def test_expiry_task_lifetime(subject: TLSManager) -> None:
    """Its expiry task control methods should work."""
    assert subject.expiry_task_running()
    await subject.cancel_expiry_task()
    assert not subject.expiry_task_running()
    await subject.schedule_expiry_task(timedelta(seconds=1))
    assert subject.expiry_task_running()
    await subject.schedule_expiry_task(timedelta(seconds=1))
    assert subject.expiry_task_running()
    await subject.cancel_expiry_task()
    assert not subject.expiry_task_running()
    await subject.cancel_expiry_task()
    assert not subject.expiry_task_running()
    await subject.schedule_expiry_task(timedelta(seconds=1))
    assert subject.expiry_task_running()
    await subject.teardown()
    assert not subject.expiry_task_running()


async def test_robot_details_task_lifetime(subject: TLSManager) -> None:
    """Its robot details task control methods should work."""
    assert subject.robot_details_task_running()
    await subject.cancel_robot_details_task()
    assert not subject.robot_details_task_running()
    await subject.schedule_robot_details_task()
    assert subject.robot_details_task_running()
    await subject.schedule_robot_details_task()
    assert subject.robot_details_task_running()
    await subject.cancel_robot_details_task()
    assert not subject.robot_details_task_running()
    await subject.cancel_robot_details_task()
    assert not subject.robot_details_task_running()
    await subject.schedule_robot_details_task()
    assert subject.robot_details_task_running()
    await subject.teardown()
    assert not subject.robot_details_task_running()


async def test_rotates_ca_while_live(
    ca_cert_dir: Path,
    ca_key_dir: Path,
    ee_dir: Path,
    cert_password_length_words: int,
    cert_password_rotation_time_s: int,
) -> None:
    """While the manager is running, if it detects expiry it should rotate CAs."""
    nowish = datetime.now(timezone.utc)
    current = cryptography_utils.create_ca(
        ca_key_dir,
        ca_cert_dir,
        nowish - timedelta(days=365, minutes=59, seconds=58),
        timedelta(days=365, hours=1),
    )
    subject = await TLSManager.create(
        ca_cert_dir=ca_cert_dir,
        ca_key_dir=ca_key_dir,
        tls_ee_dir=ee_dir,
        terminator_reload="dev-none",
        cert_password_length_words=cert_password_length_words,
        cert_password_rotation_time_s=cert_password_rotation_time_s,
    )
    await subject.cancel_expiry_task()

    await subject.schedule_expiry_task(timedelta(seconds=3))
    await asyncio.sleep(4)
    assert cryptography_utils.fingerprint(
        subject._ca_manager._current_ca.cert
    ) != cryptography_utils.fingerprint(current.cert)
    assert not current.certpath.exists()
    assert not current.keypath.exists()


async def test_rotates_tls_while_live(
    ca_cert_dir: Path,
    ca_key_dir: Path,
    ee_dir: Path,
    cert_password_length_words: int,
    cert_password_rotation_time_s: int,
) -> None:
    """It should rotate TLS EE certs when they expire."""
    subject = await TLSManager.create(
        ca_cert_dir=ca_cert_dir,
        ca_key_dir=ca_key_dir,
        tls_ee_dir=ee_dir,
        terminator_reload="dev-none",
        cert_password_length_words=cert_password_length_words,
        cert_password_rotation_time_s=cert_password_rotation_time_s,
    )
    await subject.cancel_expiry_task()
    subject._ee_manager.EE_EXPIRY_DURATION = timedelta(seconds=3)  # type: ignore[misc]
    await subject.refresh_ee()
    assert subject._ee_manager._ee_pair
    old_ee = subject._ee_manager._ee_pair.cert
    await subject.schedule_expiry_task(timedelta(seconds=2))
    await asyncio.sleep(4)
    new_ee = subject._ee_manager._ee_pair.cert
    assert cryptography_utils.fingerprint(new_ee) != cryptography_utils.fingerprint(
        old_ee
    )


async def test_rotates_tls_after_ca(
    ca_cert_dir: Path,
    ca_key_dir: Path,
    ee_dir: Path,
    cert_password_length_words: int,
    cert_password_rotation_time_s: int,
) -> None:
    """If the CA rotated, the EE should also."""
    nowish = datetime.now(timezone.utc)
    old_ca = cryptography_utils.create_ca(
        ca_key_dir,
        ca_cert_dir,
        nowish - timedelta(days=365, minutes=59, seconds=58),
        timedelta(days=365, hours=1),
    )
    subject = await TLSManager.create(
        ca_cert_dir=ca_cert_dir,
        ca_key_dir=ca_key_dir,
        tls_ee_dir=ee_dir,
        terminator_reload="dev-none",
        cert_password_length_words=cert_password_length_words,
        cert_password_rotation_time_s=cert_password_rotation_time_s,
    )
    await subject.cancel_expiry_task()
    subject._ee_manager.EE_EXPIRY_DURATION = timedelta(seconds=5)  # type: ignore[misc]
    await subject.refresh_ee()
    old_ee = subject._ee_manager._ee_pair
    assert old_ee
    # now, the CA expires in less than the expiry check and so does the ee

    await subject.schedule_expiry_task(timedelta(seconds=2))
    await asyncio.sleep(4)
    # the CA should have rotated
    current_ca = subject._ca_manager._current_ca
    assert cryptography_utils.fingerprint(
        current_ca.cert
    ) != cryptography_utils.fingerprint(old_ca.cert)
    assert not old_ca.certpath.exists()
    assert not old_ca.keypath.exists()
    # so should the EE
    current_ee = subject._ee_manager._ee_pair
    assert current_ee
    assert cryptography_utils.fingerprint(
        current_ee.cert
    ) != cryptography_utils.fingerprint(old_ee.cert)
    # and critically the new EE should be signed by the new CA
    aki = current_ee.cert.extensions.get_extension_for_class(
        x509.AuthorityKeyIdentifier
    )
    # note: this is not a secure way to do tls signature verification in practice. however
    # it is really good for unit tests that make sure we didn't use the wrong cert
    assert (
        aki.value.key_identifier
        == current_ca.cert.extensions.get_extension_for_class(
            x509.SubjectKeyIdentifier
        ).value.key_identifier
    )


async def test_does_not_rotate_if_not_needed(subject: TLSManager) -> None:
    """If nothing needs to rotate, nothing should rotate."""
    await subject.cancel_expiry_task()
    orig_ca = subject._ca_manager._current_ca.cert
    assert subject._ee_manager._ee_pair
    orig_ee = subject._ee_manager._ee_pair.cert
    await subject.schedule_expiry_task(timedelta(seconds=1))
    await asyncio.sleep(3)
    current_ca = subject._ca_manager._current_ca.cert
    current_ee = subject._ee_manager._ee_pair.cert
    assert cryptography_utils.fingerprint(current_ca) == cryptography_utils.fingerprint(
        orig_ca
    )
    assert cryptography_utils.fingerprint(current_ee) == cryptography_utils.fingerprint(
        orig_ee
    )


async def test_get_unencrypted_current_encodes(subject: TLSManager) -> None:
    """It should encode unencrypted certs safely."""
    cert = await subject.get_current_ca_cert_der()
    loaded_cert = x509.load_der_x509_certificate(
        base64.urlsafe_b64decode(cert.cert_data)
    )
    assert cryptography_utils.fingerprint(
        loaded_cert
    ) == cryptography_utils.fingerprint(subject._ca_manager._current_ca.cert)


async def test_get_unencrypted_next_ca_returns_none(subject: TLSManager) -> None:
    """It should return None for the next CA if it has no next CA."""
    assert await subject.get_next_ca_cert_der() is None


async def test_get_unencrypted_next_ca_encodes(
    subject: TLSManager, ca_key_dir: Path, ca_cert_dir: Path
) -> None:
    """It should encoded the next CA base64."""
    next_ca = cryptography_utils.create_ca(
        ca_key_dir, ca_cert_dir, datetime.now(timezone.utc), timedelta(days=300)
    )
    subject._ca_manager._next_ca = next_ca
    encoded_next = await subject.get_next_ca_cert_der()
    assert encoded_next is not None
    decoded_cert = x509.load_der_x509_certificate(
        base64.urlsafe_b64decode(encoded_next.cert_data)
    )
    assert cryptography_utils.fingerprint(
        decoded_cert
    ) == cryptography_utils.fingerprint(next_ca.cert)
