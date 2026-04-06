from datetime import datetime, timedelta, timezone
from pathlib import Path
from shutil import rmtree
from typing import Any, AsyncIterator, Iterator

import pytest
from cryptography import x509

from key_server.tls import ca_manager, cryptography_utils


@pytest.fixture
def key_dir(tmp_path: Path) -> Iterator[Path]:
    """Key directory for the CA manager."""
    key_dir = tmp_path / "key_dir"
    yield key_dir
    rmtree(key_dir)


@pytest.fixture
def ca_cert_dir(tmp_path: Path) -> Iterator[Path]:
    """Cert directory for the CA manager."""
    ca_dir = tmp_path / "ca_certs"
    yield ca_dir
    rmtree(ca_dir)


class SubjectFactory:
    def __init__(self, key_dir: Path, ca_cert_dir: Path) -> None:
        self._key_dir = key_dir
        self._ca_cert_dir = ca_cert_dir
        self._manager: None | ca_manager.TLSCAManager

    def create(self) -> ca_manager.TLSCAManager:
        self._manager = ca_manager.TLSCAManager(self._key_dir, self._ca_cert_dir)
        return self._manager

    async def destroy(self, *args: Any, **kwargs: Any) -> None:
        if self._manager:
            self._manager = None


@pytest.fixture
async def subject_factory(
    key_dir: Path, ca_cert_dir: Path
) -> AsyncIterator[SubjectFactory]:
    ctm = SubjectFactory(key_dir, ca_cert_dir)
    yield ctm
    await ctm.destroy()


async def test_init_limits_to_two_certs(
    key_dir: Path, ca_cert_dir: Path, subject_factory: SubjectFactory
) -> None:
    """It should use multiple criteria to limit itself to two valid CAs."""
    not_yet_valid = cryptography_utils.create_ca(
        key_dir,
        ca_cert_dir,
        datetime.now() + timedelta(days=1),
        timedelta(days=365, hours=1),
    )
    already_invalid = cryptography_utils.create_ca(
        key_dir,
        ca_cert_dir,
        datetime.now() - timedelta(days=365 * 10),
        timedelta(days=365, hours=1),
    )
    current = cryptography_utils.create_ca(
        key_dir,
        ca_cert_dir,
        datetime.now() - timedelta(days=30 * 6),
        timedelta(days=365, hours=1),
    )
    next = cryptography_utils.create_ca(
        key_dir,
        ca_cert_dir,
        datetime.now() - timedelta(days=30 * 3),
        timedelta(days=365, hours=1),
    )
    should_delete = [
        cryptography_utils.create_ca(
            key_dir,
            ca_cert_dir,
            datetime.now() - timedelta(days=10),
            timedelta(days=365, hours=1),
        ),
        cryptography_utils.create_ca(
            key_dir,
            ca_cert_dir,
            datetime.now() - timedelta(days=5),
            timedelta(days=365, hours=1),
        ),
    ]
    subject = subject_factory.create()

    assert subject._current_ca.certpath == current.certpath
    assert cryptography_utils.fingerprint(
        subject._current_ca.cert
    ) == cryptography_utils.fingerprint(current.cert)
    assert subject._next_ca
    assert subject._next_ca.certpath == next.certpath
    assert cryptography_utils.fingerprint(
        subject._next_ca.cert
    ) == cryptography_utils.fingerprint(next.cert)
    assert current.certpath.exists()
    assert current.keypath.exists()
    assert next.certpath.exists()
    assert next.keypath.exists()
    assert not not_yet_valid.certpath.exists()
    assert not not_yet_valid.keypath.exists()
    assert not already_invalid.certpath.exists()
    assert not already_invalid.keypath.exists()
    for sd in should_delete:
        assert not sd.certpath.exists()
        assert not sd.keypath.exists()


async def test_does_not_create_next_ca(
    key_dir: Path, ca_cert_dir: Path, subject_factory: SubjectFactory
) -> None:
    """If it finds only one CA and it expires in more than 3 months it should not create a next."""
    current = cryptography_utils.create_ca(
        key_dir,
        ca_cert_dir,
        datetime.now() - timedelta(days=1),
        timedelta(days=365, hours=1),
    )
    subject = subject_factory.create()
    assert subject._current_ca.cert == current.cert
    assert subject._next_ca is None


def dt_isclose(a: datetime, b: datetime) -> bool:
    return (a > b - timedelta(minutes=1)) and (a < b + timedelta(minutes=1))


async def test_creates_next_ca(
    key_dir: Path, ca_cert_dir: Path, subject_factory: SubjectFactory
) -> None:
    """If it finds only one CA and it expires in less than 3 months it should create a next."""
    nowish = datetime.now(timezone.utc)
    current = cryptography_utils.create_ca(
        key_dir,
        ca_cert_dir,
        nowish - timedelta(days=350),
        timedelta(days=365, hours=1),
    )
    subject = subject_factory.create()
    assert subject._current_ca.cert == current.cert
    assert subject._next_ca is not None

    assert dt_isclose(
        subject._next_ca.cert.not_valid_after_utc, nowish + timedelta(days=365, hours=1)
    )


async def test_creates_current_ca(
    key_dir: Path, ca_cert_dir: Path, subject_factory: SubjectFactory
) -> None:
    """If it finds no CAs, it should make a current one and not a next one."""
    subject = subject_factory.create()
    assert dt_isclose(
        subject._current_ca.cert.not_valid_after_utc,
        datetime.now(timezone.utc) + timedelta(days=365, hours=1),
    )
    assert subject._next_ca is None


async def test_rotates_ca_if_necessary_on_boot(
    key_dir: Path, ca_cert_dir: Path, subject_factory: SubjectFactory
) -> None:
    """If the current CA is soon to expire, it should switch to the next."""
    nowish = datetime.now(timezone.utc)
    cryptography_utils.create_ca(
        key_dir,
        ca_cert_dir,
        nowish - timedelta(days=365, hours=3),
        timedelta(days=365, hours=1),
    )
    next = cryptography_utils.create_ca(
        key_dir, ca_cert_dir, nowish - timedelta(days=30), timedelta(days=365, hours=1)
    )
    subject = subject_factory.create()
    assert cryptography_utils.fingerprint(
        subject._current_ca.cert
    ) == cryptography_utils.fingerprint(next.cert)
    assert subject._next_ca is None


async def test_signs_ee_certificates(
    key_dir: Path, ca_cert_dir: Path, subject_factory: SubjectFactory
) -> None:
    """The manager should sign end-entity certificates with its current CA."""
    subject = subject_factory.create()
    now = datetime.now(timezone.utc)
    precert = cryptography_utils.build_tls_precert(
        key_dir, now, timedelta(hours=1), "hello", ["12.13.14.15"]
    )
    signed = subject.sign_precert(precert)
    aki = signed.cert.extensions.get_extension_for_class(x509.AuthorityKeyIdentifier)
    # note: this is not a secure way to do tls signature verification in practice. however
    # it is really good for unit tests that make sure we didn't use the wrong cert
    assert (
        aki.value.key_identifier
        == subject._current_ca.cert.extensions.get_extension_for_class(
            x509.SubjectKeyIdentifier
        ).value.key_identifier
    )
