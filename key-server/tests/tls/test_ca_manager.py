import asyncio
import random
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from shutil import rmtree
from typing import Any, AsyncIterator, Callable, Iterator, Literal

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa

from key_server.tls import ca_manager


def test_load_key_handles_unreadable_file(
    caplog: pytest.LogCaptureFixture, tmp_path: Path
) -> None:
    """It should fail if the key cannot be loaded."""
    assert ca_manager._load_key(tmp_path / "some-key.pem") is None
    assert "Failed to read key bytes" in caplog.text


@pytest.mark.parametrize(
    "key_contents,failure_log",
    [
        pytest.param(random.randbytes(1024), ": invalid", id="random-contents"),
        pytest.param(
            ec.generate_private_key(ec.SECP256R1()).private_bytes(
                serialization.Encoding.DER,
                serialization.PrivateFormat.TraditionalOpenSSL,
                serialization.NoEncryption(),
            ),
            ": invalid",
            id="der-format",
        ),
        pytest.param(
            ec.generate_private_key(ec.SECP256R1()).private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.BestAvailableEncryption(password=b"oh no"),
            ),
            "requires password",
            id="requires-password",
        ),
        pytest.param(
            rsa.generate_private_key(
                public_exponent=65537, key_size=2048
            ).private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            ),
            "wrong key type",
            id="wrong-key-type",
        ),
    ],
)
def test_load_key_requires_key_characteristics(
    caplog: pytest.LogCaptureFixture,
    tmp_path: Path,
    key_contents: bytes,
    failure_log: str,
) -> None:
    """It should require our key characteristics."""
    keyfile = tmp_path / "key.pem"
    keyfile.write_bytes(key_contents)
    assert ca_manager._load_key(keyfile) is None
    assert failure_log in caplog.text


def test_load_key_loads_key(tmp_path: Path) -> None:
    """It should correctly load a valid key."""
    keyfile = tmp_path / "key.pem"
    key = ec.generate_private_key(ec.SECP256R1())
    keyfile.write_bytes(
        key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    )
    loaded_key = ca_manager._load_key(keyfile)
    assert loaded_key
    # surprisingly hard to compare the keys as python objects, but this works (the private number
    # is unique to the key)
    assert (
        loaded_key.private_numbers().private_value
        == key.private_numbers().private_value
    ), "loaded keys do not match"


def test_load_cert_handles_unreadable_file(
    caplog: pytest.LogCaptureFixture, tmp_path: Path
) -> None:
    """It should fail if the cert file cannot be read."""
    assert ca_manager._load_ca_cert(tmp_path / "some-cert.der") is None
    assert "Failed to read CA cert bytes" in caplog.text


def _build_cert(
    with_bc: bool = True,
    with_ca: bool = True,
    with_name: Literal["valid", "invalid"] = "valid",
    with_issuer: Literal["valid", "invalid"] = "valid",
    with_keyusage: Literal["valid", "invalid", False] = "valid",
    with_key: Literal["valid", "invalid"] = "valid",
) -> x509.Certificate:
    if with_key == "valid":
        key: ec.EllipticCurvePrivateKey | rsa.RSAPrivateKey = ec.generate_private_key(
            ec.SECP256R1()
        )
    else:
        key = rsa.generate_private_key(65537, key_size=2048)

    builder = (
        x509.CertificateBuilder()
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.now())
        .not_valid_after(datetime.now() + timedelta(seconds=1))
    )
    if with_bc:
        builder = builder.add_extension(
            x509.BasicConstraints(ca=with_ca, path_length=0 if with_ca else None),
            critical=True,
        )
    if with_name == "valid":
        builder = builder.subject_name(ca_manager._NAME)
    else:
        builder = builder.subject_name(
            x509.Name(
                [
                    x509.NameAttribute(x509.NameOID.COUNTRY_NAME, "ZA"),
                    x509.NameAttribute(x509.NameOID.STATE_OR_PROVINCE_NAME, "uh oh"),
                    x509.NameAttribute(x509.NameOID.LOCALITY_NAME, "nope"),
                    x509.NameAttribute(x509.NameOID.ORGANIZATION_NAME, "O"),
                    x509.NameAttribute(x509.NameOID.COMMON_NAME, "who knows"),
                ]
            )
        )
    if with_issuer == "valid":
        builder = builder.issuer_name(ca_manager._ISSUER)
    else:
        builder = builder.issuer_name(
            x509.Name(
                [
                    x509.NameAttribute(x509.NameOID.COUNTRY_NAME, "ZA"),
                    x509.NameAttribute(x509.NameOID.STATE_OR_PROVINCE_NAME, "uh oh"),
                    x509.NameAttribute(x509.NameOID.LOCALITY_NAME, "nope"),
                    x509.NameAttribute(x509.NameOID.ORGANIZATION_NAME, "O"),
                    x509.NameAttribute(x509.NameOID.COMMON_NAME, "who knows"),
                ]
            )
        )
    if with_keyusage == "valid":
        builder = builder.add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=False,
                key_encipherment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=True,
                crl_sign=True,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
    elif with_keyusage == "invalid":
        builder = builder.add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=False,
                key_encipherment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=True,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )

    return builder.sign(key, hashes.SHA256())


@pytest.mark.parametrize(
    "file_contents,reason",
    [
        pytest.param(
            random.randbytes(1024), "Failed to parse x509 cert", id="random-bytes"
        ),
        pytest.param(
            _build_cert().public_bytes(serialization.Encoding.PEM),
            "Failed to parse x509 cert",
            id="pem-encoded",
        ),
        pytest.param(
            ec.generate_private_key(ec.SECP256R1())
            .public_key()
            .public_bytes(
                serialization.Encoding.DER,
                serialization.PublicFormat.SubjectPublicKeyInfo,
            ),
            "Failed to parse x509 cert",
            id="not-cert",
        ),
        pytest.param(
            _build_cert(with_bc=False).public_bytes(serialization.Encoding.DER),
            "no BasicConstraints in cert",
            id="no-basic-constrains",
        ),
        pytest.param(
            _build_cert(with_ca=False).public_bytes(serialization.Encoding.DER),
            "not a CA",
            id="not-a-ca",
        ),
        pytest.param(
            _build_cert(with_name="invalid").public_bytes(serialization.Encoding.DER),
            "wrong subject",
            id="wrong-name",
        ),
        pytest.param(
            _build_cert(with_issuer="invalid").public_bytes(serialization.Encoding.DER),
            "wrong issuer",
            id="wrong-issuer",
        ),
        pytest.param(
            _build_cert(with_keyusage="invalid").public_bytes(
                serialization.Encoding.DER
            ),
            "bad KeyUsage in cert",
            id="wrong-keyusage",
        ),
        pytest.param(
            _build_cert(with_keyusage=False).public_bytes(serialization.Encoding.DER),
            "no KeyUsage in cert",
            id="no-keyusage",
        ),
        pytest.param(
            _build_cert(with_key="invalid").public_bytes(serialization.Encoding.DER),
            "wrong key type",
            id="wrong-key-type",
        ),
    ],
)
def test_load_cert_handles_invalid_bytes(
    caplog: pytest.LogCaptureFixture, tmp_path: Path, file_contents: bytes, reason: str
) -> None:
    """It should handle loading something that isn't a DER-encoded cert."""
    cert_path = tmp_path / "cert.cer"
    cert_path.write_bytes(file_contents)
    assert ca_manager._load_ca_cert(cert_path) is None
    assert reason in caplog.text


def test_load_create_ca_cert_roundtrips(tmp_path: Path) -> None:
    """It should be able to load its own saved keys."""
    key_dir = tmp_path / "keys"
    ca_dir = tmp_path / "ca"
    key_dir.mkdir()
    ca_dir.mkdir()
    now = datetime.now(timezone.utc)
    pair = ca_manager._create_ca(key_dir, ca_dir, now, timedelta(days=25))
    assert ca_manager._load_ca_cert(pair.certpath) == pair.cert


def test_match_keys_and_certs() -> None:
    """It should match up various keys and certificates."""
    matched_originals: list[ca_manager.X509Pair] = []
    for idx in range(3):
        key = ec.generate_private_key(ec.SECP256R1())
        cert = (
            x509.CertificateBuilder()
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.now())
            .not_valid_after(datetime.now() + timedelta(seconds=1))
            .subject_name(ca_manager._NAME)
            .issuer_name(ca_manager._ISSUER)
            .sign(key, hashes.SHA256())
        )
        matched_originals.append(
            ca_manager.X509Pair(
                cert=cert,
                key=key,
                keypath=Path(f"/matched/key/{idx}"),
                certpath=Path(f"/matched/cert/{idx}"),
            )
        )
    solo_keys = [
        (Path(f"/solo/key/{idx}"), ec.generate_private_key(ec.SECP256R1()))
        for idx in range(2)
    ]
    keys_to_dump = [ec.generate_private_key(ec.SECP256R1()) for idx in range(2)]
    solo_certs = [
        (
            Path(f"/solo/cert/{idx}"),
            x509.CertificateBuilder()
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.now())
            .not_valid_after(datetime.now() + timedelta(seconds=1))
            .subject_name(ca_manager._NAME)
            .issuer_name(ca_manager._ISSUER)
            .sign(key, hashes.SHA256()),
        )
        for idx, key in enumerate(keys_to_dump)
    ]
    keys = [(el.keypath, el.key) for el in matched_originals] + solo_keys
    random.shuffle(keys)
    certs = [(el.certpath, el.cert) for el in matched_originals] + solo_certs
    random.shuffle(certs)
    matched_outputs = list(ca_manager._match_keys_and_certs(keys, certs))
    # we should ignore the unmatched certs and keys
    assert len(matched_outputs) == 3

    sorted_matched_originals = sorted(
        matched_originals, key=lambda pair: pair.cert.serial_number
    )
    sorted_matched_outputs = sorted(
        matched_outputs, key=lambda pair: pair.cert.serial_number
    )
    # they should be the correct certs and keys
    for original, output in zip(sorted_matched_originals, sorted_matched_outputs):
        assert original.cert.fingerprint(hashes.SHA256()) == output.cert.fingerprint(
            hashes.SHA256()
        )
        assert original.certpath == output.certpath
        assert (
            original.key.private_numbers().private_value
            == output.key.private_numbers().private_value
        )
        assert original.keypath == output.keypath


@pytest.mark.parametrize(
    "prep_fs,key_subdir,cert_subdir,log_pattern",
    [
        pytest.param(
            lambda tmp_path: (tmp_path / "key_dir").touch(),
            Path("key_dir"),
            Path("ca_cert_dir"),
            r"Key directory .* is not a directory",
            id="key-dir-is-file",
        ),
        pytest.param(
            lambda tmp_path: (tmp_path / "ca_cert_dir").touch(),
            Path("key_dir"),
            Path("ca_cert_dir"),
            r"CA cert directory .* is not a directory",
            id="ca-dir-is-file",
        ),
        pytest.param(
            lambda tmp_path: (tmp_path / "key_intermediate").touch(),
            Path("key_intermediate") / "key_dir",
            Path("ca_cert_dir"),
            r"Key directory .* could not be created",
            id="key-dir-not-created",
        ),
        pytest.param(
            lambda tmp_path: (tmp_path / "ca_intermediate").touch(),
            Path("key_dir"),
            Path("ca_intermediate") / "ca_cert_dir",
            r"CA cert directory .* could not be created",
            id="ca-cert-dir-not-created",
        ),
        pytest.param(
            lambda tmp_path: (tmp_path / "key_dir").mkdir(mode=0o000),
            Path("key_dir"),
            Path("ca_cert_dir"),
            r"Could not write key",
            id="key-not-writable",
        ),
        pytest.param(
            lambda tmp_path: (tmp_path / "ca_cert_dir").mkdir(mode=0o000),
            Path("key_dir"),
            Path("ca_cert_dir"),
            r"Could not write cert for",
            id="cert-not-writable",
        ),
    ],
)
def test_create_ca_handles_fs_issues(
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
    prep_fs: Callable[[Path], Any],
    key_subdir: Path,
    cert_subdir: Path,
    log_pattern: str,
) -> None:
    """It should deal with various filesystem vagaries and still create a cert pair."""
    # note that this test causes a lot of warnings because it does some deep fs
    # manipulation.
    prep_fs(tmp_path)
    pair = ca_manager._create_ca(
        tmp_path / key_subdir,
        tmp_path / cert_subdir,
        datetime.now(),
        timedelta(days=25),
    )
    assert pair.key.public_key() == pair.cert.public_key()
    assert re.search(log_pattern, caplog.text)


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
            await self._manager.teardown()
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
    not_yet_valid = ca_manager._create_ca(
        key_dir,
        ca_cert_dir,
        datetime.now() + timedelta(days=1),
        timedelta(days=365, hours=1),
    )
    already_invalid = ca_manager._create_ca(
        key_dir,
        ca_cert_dir,
        datetime.now() - timedelta(days=365 * 10),
        timedelta(days=365, hours=1),
    )
    current = ca_manager._create_ca(
        key_dir,
        ca_cert_dir,
        datetime.now() - timedelta(days=30 * 6),
        timedelta(days=365, hours=1),
    )
    next = ca_manager._create_ca(
        key_dir,
        ca_cert_dir,
        datetime.now() - timedelta(days=30 * 3),
        timedelta(days=365, hours=1),
    )
    should_delete = [
        ca_manager._create_ca(
            key_dir,
            ca_cert_dir,
            datetime.now() - timedelta(days=10),
            timedelta(days=365, hours=1),
        ),
        ca_manager._create_ca(
            key_dir,
            ca_cert_dir,
            datetime.now() - timedelta(days=5),
            timedelta(days=365, hours=1),
        ),
    ]
    subject = subject_factory.create()

    assert subject._current_ca.certpath == current.certpath
    assert subject._current_ca.cert.fingerprint(
        hashes.SHA256()
    ) == current.cert.fingerprint(hashes.SHA256())
    assert subject._next_ca
    assert subject._next_ca.certpath == next.certpath
    assert subject._next_ca.cert.fingerprint(hashes.SHA256()) == next.cert.fingerprint(
        hashes.SHA256()
    )
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
    current = ca_manager._create_ca(
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
    current = ca_manager._create_ca(
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
    ca_manager._create_ca(
        key_dir,
        ca_cert_dir,
        nowish - timedelta(days=365, hours=3),
        timedelta(days=365, hours=1),
    )
    next = ca_manager._create_ca(
        key_dir, ca_cert_dir, nowish - timedelta(days=30), timedelta(days=365, hours=1)
    )
    subject = subject_factory.create()
    assert subject._current_ca.cert.fingerprint(
        hashes.SHA256()
    ) == next.cert.fingerprint(hashes.SHA256())
    assert subject._next_ca is None


async def test_rotates_ca_while_live(
    key_dir: Path, ca_cert_dir: Path, subject_factory: SubjectFactory
) -> None:
    """While the manager is running, if it detects expiry it should rotate CAs."""
    nowish = datetime.now(timezone.utc)
    current = ca_manager._create_ca(
        key_dir,
        ca_cert_dir,
        nowish - timedelta(days=365, minutes=59, seconds=58),
        timedelta(days=365, hours=1),
    )
    subject = subject_factory.create()
    await subject.teardown()
    # this is a Final so we have to ignore a type error to overwrite it
    subject.CA_EXPIRY_CHECK_POLL_PERIOD = timedelta(seconds=3)  # type: ignore[misc]
    subject._expiry_task = asyncio.create_task(subject._expiry_task_outer())
    await asyncio.sleep(4)
    assert subject._current_ca.cert.fingerprint(
        hashes.SHA256()
    ) != current.cert.fingerprint(hashes.SHA256())
    assert not current.certpath.exists()
    assert not current.keypath.exists()
