"""Utility types and code for dealing with certs and keys."""

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Callable, Iterable, Iterator

from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec

from . import constants, file_utils

LOG = logging.getLogger(__name__)


@dataclass
class X509Pair:
    """Store a CA cert/key pair."""

    keypath: Path
    certpath: Path
    key: ec.EllipticCurvePrivateKey
    cert: x509.Certificate


def match_keys_and_certs(
    keys: Iterable[tuple[Path, ec.EllipticCurvePrivateKey]],
    certs: Iterable[tuple[Path, x509.Certificate]],
) -> Iterator[X509Pair]:
    """Read a key dir and a cert dir and match up the keys and certs there."""
    cert_set = set(certs)
    for keypath, key in keys:
        pubkey = key.public_key()
        for certpath, cert in cert_set:
            if cert.public_key() == pubkey:
                yield X509Pair(keypath=keypath, key=key, certpath=certpath, cert=cert)
                cert_set.remove((certpath, cert))
                break
        else:
            LOG.info(f"No matching cert for key {str(keypath)}")
    LOG.info(f"{len(cert_set)} certs remain unmatched")


def remove_certs(
    certlist: list[X509Pair], predicate: Callable[[X509Pair], bool], reason: str
) -> list[X509Pair]:
    """Remove certs from a list if they match a predicate. The predicate is called exactly once for each candidate."""
    invalid = [cert for cert in certlist if predicate(cert)]
    valid = [cert for cert in certlist if cert not in invalid]
    LOG.info(
        f"Invalid {len(invalid)} certs for {reason} leaving {len(valid)} certs (removed: {', '.join([fingerprint(cert.cert) for cert in invalid])})"
    )
    for cert in invalid:
        delete_certpair(cert, reason)
    return valid


def fingerprint(cert: x509.Certificate) -> str:
    """Useful alias for a fingerprint with a fixed hash alg."""
    return cert.fingerprint(hashes.SHA256()).hex()


def create_ca(
    key_dir: Path, ca_cert_dir: Path, now: datetime, duration: timedelta
) -> X509Pair:
    """Make a new CA pair."""
    expiry = now + duration
    key = ec.generate_private_key(ec.SECP256R1())
    cert = (
        x509.CertificateBuilder()
        .subject_name(constants.CA_NAME)
        .issuer_name(constants.CA_NAME)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(expiry)
        .add_extension(constants.CA_BASIC_CONSTRAINTS, critical=True)
        .add_extension(constants.CA_KU, critical=True)
        .add_extension(
            x509.SubjectKeyIdentifier.from_public_key(key.public_key()), critical=False
        )
        .sign(key, hashes.SHA256())
    )
    LOG.info(f"Created CA {fingerprint(cert)}")
    pair = X509Pair(
        keypath=file_utils.save_key(
            key_dir,
            key,
            constants.CA_KEY_NAME_FORMAT.format(expiry=expiry.strftime("%Y-%m-%d")),
            fingerprint(cert),
        ),
        certpath=file_utils.save_cert(
            ca_cert_dir,
            cert,
            constants.CA_CERT_NAME_FORMAT.format(expiry=expiry.strftime("%Y-%m-%d")),
            "CA",
        ),
        key=key,
        cert=cert,
    )
    return pair


def delete_certpair(pair: X509Pair, reason: str) -> None:
    """Delete the key and certificate from the pair."""
    file_utils.safe_del(pair.certpath, reason)
    file_utils.safe_del(pair.keypath, reason)
