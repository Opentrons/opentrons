"""Tests for the free functions cryptography_utils."""

import random
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Literal

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa

from key_server.tls import cryptography_utils


def test_load_key_handles_unreadable_file(
    caplog: pytest.LogCaptureFixture, tmp_path: Path
) -> None:
    """It should fail if the key cannot be loaded."""
    assert cryptography_utils.load_key(tmp_path / "some-key.pem") is None
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
    assert cryptography_utils.load_key(keyfile) is None
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
    loaded_key = cryptography_utils.load_key(keyfile)
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
    assert cryptography_utils.load_ca_cert(tmp_path / "some-cert.der") is None
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
        builder = builder.subject_name(cryptography_utils._NAME)
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
        builder = builder.issuer_name(cryptography_utils._ISSUER)
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
    assert cryptography_utils.load_ca_cert(cert_path) is None
    assert reason in caplog.text


def test_load_create_ca_cert_roundtrips(tmp_path: Path) -> None:
    """It should be able to load its own saved keys."""
    key_dir = tmp_path / "keys"
    ca_dir = tmp_path / "ca"
    key_dir.mkdir()
    ca_dir.mkdir()
    now = datetime.now(timezone.utc)
    pair = cryptography_utils.create_ca(key_dir, ca_dir, now, timedelta(days=25))
    assert cryptography_utils.load_ca_cert(pair.certpath) == pair.cert


def test_match_keys_and_certs() -> None:
    """It should match up various keys and certificates."""
    matched_originals: list[cryptography_utils.X509Pair] = []
    for idx in range(3):
        key = ec.generate_private_key(ec.SECP256R1())
        cert = (
            x509.CertificateBuilder()
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.now())
            .not_valid_after(datetime.now() + timedelta(seconds=1))
            .subject_name(cryptography_utils._NAME)
            .issuer_name(cryptography_utils._ISSUER)
            .sign(key, hashes.SHA256())
        )
        matched_originals.append(
            cryptography_utils.X509Pair(
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
            .subject_name(cryptography_utils._NAME)
            .issuer_name(cryptography_utils._ISSUER)
            .sign(key, hashes.SHA256()),
        )
        for idx, key in enumerate(keys_to_dump)
    ]
    keys = [(el.keypath, el.key) for el in matched_originals] + solo_keys
    random.shuffle(keys)
    certs = [(el.certpath, el.cert) for el in matched_originals] + solo_certs
    random.shuffle(certs)
    matched_outputs = list(cryptography_utils.match_keys_and_certs(keys, certs))
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
    pair = cryptography_utils.create_ca(
        tmp_path / key_subdir,
        tmp_path / cert_subdir,
        datetime.now(),
        timedelta(days=25),
    )
    assert pair.key.public_key() == pair.cert.public_key()
    assert re.search(log_pattern, caplog.text)
