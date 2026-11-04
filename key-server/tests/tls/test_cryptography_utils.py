"""Tests for the free functions cryptography_utils."""

import asyncio
import base64
import random
import re
from datetime import datetime, timedelta, timezone
from ipaddress import IPv4Address
from pathlib import Path
from typing import Any, Callable

import pytest
from cryptography import fernet, x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.kdf import pbkdf2

from key_server.tls import constants, cryptography_utils, file_utils


def test_load_create_ca_cert_roundtrips(tmp_path: Path) -> None:
    """It should be able to load its own saved keys."""
    key_dir = tmp_path / "keys"
    ca_dir = tmp_path / "ca"
    key_dir.mkdir()
    ca_dir.mkdir()
    now = datetime.now(timezone.utc)
    pair = cryptography_utils.create_ca(key_dir, ca_dir, now, timedelta(days=25))
    assert file_utils.load_ca_cert(pair.certpath) == pair.cert


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
            .subject_name(constants.CA_NAME)
            .issuer_name(constants.CA_NAME)
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
            .subject_name(constants.CA_NAME)
            .issuer_name(constants.CA_NAME)
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
            r"Could not write CA cert for",
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


def test_tls_certs_verify_dns(tmp_path: Path) -> None:
    """Its created TLS certs should verify."""
    ca = cryptography_utils.create_ca(
        tmp_path, tmp_path, datetime.now(), timedelta(days=1)
    )
    precert = cryptography_utils.build_tls_precert(
        tmp_path,
        datetime.now(),
        timedelta(hours=1),
        robot_hostname="myrobot",
        robot_ips=["127.0.0.1"],
    )
    sealed = cryptography_utils.seal_cert_builder_with_ca(precert, ca)
    tls_ee = cryptography_utils.install_tls_cert(tmp_path, sealed)
    store = x509.verification.Store([ca.cert])
    verification_time = datetime.now()
    dns_verifier = (
        x509.verification.PolicyBuilder()
        .store(store)
        .time(verification_time)
        .build_server_verifier(x509.DNSName("myrobot.local"))
    )
    dns_chain = dns_verifier.verify(tls_ee.cert, [])
    assert dns_chain[-1].fingerprint(hashes.SHA256()) == ca.cert.fingerprint(
        hashes.SHA256()
    )


def test_tls_certs_verify_ip(tmp_path: Path) -> None:
    """Its created TLS certs should verify."""
    ca = cryptography_utils.create_ca(
        tmp_path, tmp_path, datetime.now(), timedelta(days=1)
    )
    precert = cryptography_utils.build_tls_precert(
        tmp_path,
        datetime.now(),
        timedelta(hours=1),
        robot_hostname="myrobot.local",
        robot_ips=["127.0.0.1"],
    )
    sealed = cryptography_utils.seal_cert_builder_with_ca(precert, ca)
    tls_ee = cryptography_utils.install_tls_cert(tmp_path, sealed)
    store = x509.verification.Store([ca.cert])
    verification_time = datetime.now()
    ip_verifier = (
        x509.verification.PolicyBuilder()
        .store(store)
        .time(verification_time)
        .build_server_verifier(x509.IPAddress(IPv4Address("127.0.0.1")))
    )
    ip_chain = ip_verifier.verify(tls_ee.cert, [])
    assert ip_chain[-1].fingerprint(hashes.SHA256()) == ca.cert.fingerprint(
        hashes.SHA256()
    )


@pytest.mark.parametrize("length", [1, 4, 10])
def test_make_password_makes_password(length: int) -> None:
    """It should make a password of the specified length."""
    password = cryptography_utils.make_password(length)
    # one of the possible words is yo-yo
    words = password.split("-")
    deyoyoed: list[str] = []
    word_iter = iter(words)
    while True:
        try:
            word = next(word_iter)
        except StopIteration:
            break
        if word == "yo":
            try:
                next_word = next(word_iter)
            except StopIteration:
                deyoyoed.append(word)
                break
            if next_word == "yo":
                deyoyoed.append("yo-yo")
            else:
                deyoyoed.extend([word, next_word])
        else:
            deyoyoed.append(word)

    assert len(deyoyoed) == length
    wordlist = file_utils.load_wordlist()
    for word in deyoyoed:
        assert word in wordlist


async def test_make_fernet_key_consistent() -> None:
    """It should make a key that can be recreated with the provided salt."""
    password = "gazpacho salad"
    key = await cryptography_utils.make_fernet_key(password)

    check_key_kdf = pbkdf2.PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=key.salt,
        iterations=constants.KDF_ITERATIONS,
    )
    encoded_check_key = await asyncio.to_thread(
        check_key_kdf.derive, password.encode("utf-8")
    )
    assert len(key.salt) == 16
    assert base64.urlsafe_b64encode(encoded_check_key) == key.urlencoded_key


async def test_fernet_roundtrip(tmp_path: Path) -> None:
    """It should make a fernet key that can be used to decrypt certs encrypted with our functions."""
    certpath = tmp_path / "certs"
    certpath.mkdir()
    password = "orange terrine with strawberry sauce"
    key = await cryptography_utils.make_fernet_key(password)
    cert = cryptography_utils.create_ca(
        certpath, certpath, datetime.now(timezone.utc), timedelta(days=24)
    )
    encrypted = cryptography_utils.encrypt_cert(
        cryptography_utils.get_cert_bytes_der(cert.cert), key
    )

    decrypted_bytes = fernet.Fernet(key.urlencoded_key).decrypt(encrypted)
    decrypted_cert = x509.load_der_x509_certificate(decrypted_bytes)
    assert cert.cert.fingerprint(hashes.SHA256()) == decrypted_cert.fingerprint(
        hashes.SHA256()
    )
