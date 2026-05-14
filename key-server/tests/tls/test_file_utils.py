"""Tests for key and cert file utilities."""

import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Literal

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa

from key_server.tls import constants, file_utils


def test_load_key_handles_unreadable_file(
    caplog: pytest.LogCaptureFixture, tmp_path: Path
) -> None:
    """It should fail if the key cannot be loaded."""
    assert file_utils.load_key(tmp_path / "some-key.pem") is None
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
    assert file_utils.load_key(keyfile) is None
    assert failure_log in caplog.text


def test_load_key_loads_key(tmp_path: Path) -> None:
    """It should correctly load a valid key."""
    key = ec.generate_private_key(ec.SECP256R1())
    keyfile = file_utils.save_key(tmp_path, key, "key.pem", "test-fingerprint")
    keyfile.write_bytes(
        key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    )
    loaded_key = file_utils.load_key(keyfile)
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
    assert file_utils.load_ca_cert(tmp_path / "some-cert.der") is None
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
        builder = builder.subject_name(constants.CA_NAME)
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
        builder = builder.issuer_name(constants.CA_NAME)
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
    assert file_utils.load_ca_cert(cert_path) is None
    assert reason in caplog.text


def test_load_cert_loads_cert(tmp_path: Path) -> None:
    """It should load a valid cert."""
    constructed_valid = _build_cert()
    saved_path = file_utils.save_cert(tmp_path, constructed_valid, "mycert.cer", "test")
    loaded_valid = file_utils.load_ca_cert(saved_path)
    assert loaded_valid is not None
    assert loaded_valid.fingerprint(hashes.SHA256()) == constructed_valid.fingerprint(
        hashes.SHA256()
    )


def test_save_cert_handles_multiple_formats(tmp_path: Path) -> None:
    cert = _build_cert()
    pem = file_utils.save_cert(tmp_path, cert, "cert.pem", "test", "PEM")
    der = file_utils.save_cert(tmp_path, cert, "cert.der", "test", "DER")
    loaded_pem = file_utils.load_cert(pem, "PEM")
    loaded_der = file_utils.load_cert(der, "DER")
    assert loaded_pem
    assert loaded_der
    assert loaded_pem.fingerprint(hashes.SHA256()) == cert.fingerprint(hashes.SHA256())
    assert loaded_der.fingerprint(hashes.SHA256()) == cert.fingerprint(hashes.SHA256())


def test_load_wordlist() -> None:
    """It should load the EFF wordlist."""
    words = file_utils.load_wordlist()
    assert words[0] == "aardvark"
    assert words[-1] == "zucchini"
