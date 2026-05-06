"""Utilities for interacting with certs and keys from the filesystem."""

import re
from logging import getLogger
from pathlib import Path
from typing import Iterator, Literal

from cryptography import x509
from cryptography.exceptions import UnsupportedAlgorithm
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec

from . import constants

LOG = getLogger(__name__)


def safe_del(path: Path, kind: str) -> None:
    """Delete a file and swallow errors."""
    try:
        path.unlink()
    except Exception:
        LOG.exception(f"Failed to delete {kind} {str(path)}")


def load_key(maybe_key: Path) -> ec.EllipticCurvePrivateKey | None:
    """Load a prospective private key from a path.

    This function upholds the internal requirements we set on a key to make sure we don't
    accidentally load the wrong thing, or indeed load the wrong thing in the future. This needs
    to be an elliptic curve key that's properly loadable, and if it's anything else we won't load it.
    """
    try:
        key_bytes = maybe_key.read_bytes()
    except Exception:
        LOG.exception(f"Failed to read key bytes from {str(maybe_key)}")
        return None
    try:
        key = serialization.load_pem_private_key(key_bytes, password=None)
    except ValueError:
        LOG.exception(f"Failed to parse key from {str(maybe_key)}: invalid")
        return None
    except TypeError:
        LOG.exception(f"Failed to load key from {str(maybe_key)}: requires password")
        return None
    except UnsupportedAlgorithm:
        LOG.exception(
            f"Failed to load key from {str(maybe_key)}: unsupported algorithm"
        )
        return None
    except Exception:
        LOG.exception(f"Failed to load key from {str(maybe_key)}")
        return None
    if not isinstance(key, ec.EllipticCurvePrivateKey):
        LOG.exception(
            f"Failed to load key from {str(maybe_key)}: wrong key type ({type(key)})"
        )
        return None
    return key


def save_key(
    key_dir: Path, key: ec.EllipticCurvePrivateKey, key_name: str, cert_fingerprint: str
) -> Path:
    """Save a private key to the private key directory."""
    if not key_dir.exists():
        try:
            key_dir.mkdir(parents=True)
        except OSError:
            LOG.warning(
                f"Key directory {str(key_dir)} could not be created! Key for {cert_fingerprint} will not be saved"
            )
    elif not key_dir.is_dir():
        LOG.warning(
            f"Key directory {str(key_dir)} is not a directory! Key for {cert_fingerprint} will not be saved"
        )
    key_path = key_dir / key_name
    try:
        key_path.write_bytes(
            key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            )
        )
        LOG.info(f"Wrote key for {cert_fingerprint} to {str(key_path)}")
    except OSError:
        LOG.error(
            f"Could not write key for {cert_fingerprint} to {str(key_path)}, key will be lost on server shutdown"
        )
    return key_path


def save_cert(
    cert_dir: Path,
    cert: x509.Certificate,
    cert_name: str,
    kind: str,
    format: Literal["DER", "PEM"] = "DER",
) -> Path:
    """Save an x509 cert to a cert directory."""
    if not cert_dir.exists():
        try:
            cert_dir.mkdir(parents=True)
        except OSError:
            LOG.warning(
                f"{kind} cert directory {str(cert_dir)} could not be created! Certs will not be saved"
            )
    elif not cert_dir.is_dir():
        LOG.warning(
            f"{kind} cert directory {str(cert_dir)} is not a directory! Certs will not be saved"
        )
    cert_path = cert_dir / cert_name
    try:
        cert_path.write_bytes(
            cert.public_bytes(
                serialization.Encoding.DER
                if format == "DER"
                else serialization.Encoding.PEM
            )
        )
        LOG.info(
            f"Wrote {kind} cert for {cert.fingerprint(hashes.SHA256()).hex()} to {str(cert_path)}"
        )
    except OSError:
        LOG.error(
            f"Could not write {kind} cert for {cert.fingerprint(hashes.SHA256()).hex()} to {str(cert_path)}, CA will be lost on server shutdown"
        )
    return cert_path


def load_cert(
    maybe_cert: Path, format: Literal["PEM", "DER"]
) -> x509.Certificate | None:
    """Load a prospective x509 cert from a path.

    If the cert can't be loaded, returns None.
    """
    try:
        cert_bytes = maybe_cert.read_bytes()
    except Exception:
        LOG.exception(f"Failed to read CA cert bytes from {str(maybe_cert)}")
        return None
    if format == "DER":
        try:
            cert = x509.load_der_x509_certificate(cert_bytes)
        except ValueError:
            LOG.exception(
                f"Failed to parse x509 cert from DER-encoded {str(maybe_cert)}"
            )
            return None
        return cert
    else:
        try:
            cert = x509.load_pem_x509_certificate(cert_bytes)
        except ValueError:
            LOG.exception(
                f"Failed to parse x509 cert from PEM-encoded {str(maybe_cert)}"
            )
            return None
        return cert


def keys_from_dir(
    key_dir: Path, name_re: re.Pattern[str]
) -> Iterator[tuple[Path, ec.EllipticCurvePrivateKey]]:
    """Load all the keys that match a specified name format from the specified path.

    If any key that is named like the format can't be loaded, delete it.
    """
    for maybe_key in key_dir.iterdir():
        if name_re.match(maybe_key.name):
            key = load_key(maybe_key)
            if key:
                yield (maybe_key, key)
            else:
                safe_del(maybe_key, "bad private key")


def ca_keys_from_dir(
    key_dir: Path,
) -> Iterator[tuple[Path, ec.EllipticCurvePrivateKey]]:
    """Load keys matching the CA key naming style from a directory.

    If a candidate key can't be loaded, delete it.
    """
    return keys_from_dir(key_dir, constants.CA_KEY_NAME_PATTERN)


def ca_certs_from_dir(ca_cert_dir: Path) -> Iterator[tuple[Path, x509.Certificate]]:
    """Load all the keys that match our CA cert format from the specified path.

    If any cert that is named like one of our CAs is not one of our CAs, delete it.
    """
    for maybe_cert in ca_cert_dir.iterdir():
        if constants.CA_CERT_NAME_PATTERN.match(maybe_cert.name):
            # loading the cert requires that it be a valid x509 cert in DER
            cert = load_ca_cert(maybe_cert)
            if cert:
                yield (maybe_cert, cert)
            else:
                safe_del(maybe_cert, "bad CA cert")


def load_ca_cert(maybe_cert: Path) -> x509.Certificate | None:  # noqa: C901
    """Load a prospective OT CA cert from a path.

    This is like load_cert but checks to see if this is one of our CA certs as well as being a valid cert in general.
    """
    cert = load_cert(maybe_cert, "DER")
    if cert is None:
        return None
    # if a cert doesn't have valid extensions, it's not one of ours
    try:
        extensions = cert.extensions
    except x509.DuplicateExtension:
        LOG.exception(
            f"Failed to parse x509 cert from {str(maybe_cert)}: duplicate extension"
        )
        return None
    except x509.UnsupportedGeneralNameType:
        LOG.exception(
            f"Failed to parse x509 cert from {str(maybe_cert)}: unsupported extension name"
        )
        return None
    # if a cert doesn't have BasicConstraints, it can't be a ca since that's where that flag lives
    try:
        basics = extensions.get_extension_for_class(x509.BasicConstraints)
    except x509.ExtensionNotFound:
        LOG.exception(
            f"Failed to parse x509 cert from {str(maybe_cert)}: no BasicConstraints in cert"
        )
        return None
    # if the cert isn't actually a ca, that's bad too
    if not basics.value.ca or basics.value.path_length != 0:
        LOG.exception(f"Failed to parse CA cert from {str(maybe_cert)}: not a CA")
        return None
    try:
        key_usage = extensions.get_extension_for_class(x509.KeyUsage)
    except x509.ExtensionNotFound:
        LOG.exception(
            f"Failed to parse x509 cert from {str(maybe_cert)}: no KeyUsage in cert"
        )
        return None
    if not key_usage.value.digital_signature or not key_usage.value.key_cert_sign:
        LOG.error(
            f"Failed to parse x509 cert from {str(maybe_cert)}: bad KeyUsage in cert"
        )
        return None
    # if the cert doesn't have our static details, we can't have that
    if cert.subject != constants.CA_NAME:
        LOG.error(
            f"Failed to parse Opentrons Flex CA cert from {str(maybe_cert)}: wrong subject {cert.subject}"
        )
        return None
    if cert.issuer != constants.CA_NAME:
        LOG.error(
            f"Failed to parse Opentrons Flex CA cert from {str(maybe_cert)}: wrong issuer {cert.issuer}"
        )
        return None
    if not isinstance(cert.public_key(), ec.EllipticCurvePublicKey):
        LOG.error(
            f"Failed to parse Opentrons Flex CA cert from {str(maybe_cert)}: wrong key type {type(cert.public_key())}"
        )
        return None
    return cert


def make_pem_bundle(
    ca_cert: x509.Certificate,
    tls_cert: x509.Certificate,
    tls_key: ec.EllipticCurvePrivateKey,
    path: Path,
) -> None:
    """Write a CA cert, end entity cert, and end entity key to a single PEM for certain TLS terminators."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as combined_pem:
        combined_pem.write(
            tls_key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            )
        )
        combined_pem.write(b"\n")
        combined_pem.write(tls_cert.public_bytes(serialization.Encoding.PEM))
        combined_pem.write(b"\n")
        combined_pem.write(ca_cert.public_bytes(serialization.Encoding.PEM))


def load_wordlist() -> list[str]:
    """Load the built-in wordlist (EFF Short V2 from https://www.eff.org/files/2016/09/08/eff_short_wordlist_2_0.txt)."""
    wordsfile = Path(__file__).parent / "eff_wordlist_short_2.0.txt"
    words = wordsfile.read_text("UTF-8")
    lines = words.split("\n")
    return [line.split("\t")[1] for line in lines if line]
