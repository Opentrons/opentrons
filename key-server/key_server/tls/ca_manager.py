"""Code for managing TLS CAs."""

import logging
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable, Final, Iterable, Iterator

from cryptography import x509
from cryptography.exceptions import UnsupportedAlgorithm
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec

LOG = logging.getLogger(__name__)


@dataclass
class X509Pair:
    """Store a CA cert/key pair."""

    keypath: Path
    certpath: Path
    key: ec.EllipticCurvePrivateKey
    cert: x509.Certificate


# these are the x509 cert details that are the same for all of our CA certs

# our CA style: no intermediate CAs (we rotate these pretty frequently, and wouldn't be storing them
# anywhere different)
_OT_CA_BASIC_CONSTRAINTS = x509.BasicConstraints(ca=True, path_length=0)
# standard ca KU
_OT_CA_KU = x509.KeyUsage(
    digital_signature=True,  # required for any signature
    content_commitment=False,
    key_encipherment=False,
    data_encipherment=False,
    key_agreement=False,
    key_cert_sign=True,
    crl_sign=True,  # we don't use CRLs, at least not yet, but browsers may choke without this
    encipher_only=False,
    decipher_only=False,
)
# our ca name field
_NAME = _ISSUER = x509.Name(
    [
        x509.NameAttribute(x509.NameOID.COUNTRY_NAME, "US"),
        x509.NameAttribute(x509.NameOID.STATE_OR_PROVINCE_NAME, "New York"),
        x509.NameAttribute(x509.NameOID.LOCALITY_NAME, "New York"),
        x509.NameAttribute(x509.NameOID.ORGANIZATION_NAME, "Opentrons"),
        x509.NameAttribute(x509.NameOID.COMMON_NAME, "Opentrons Flex TLS CA"),
    ]
)

_CA_NAME_PATTERN: Final = re.compile(
    r"^ot-robot-tls-ca-(\d{4}-\d{2}-\d{2})\.(pem|cer)$"
)


def _safe_del(path: Path, kind: str) -> None:
    try:
        path.unlink()
    except Exception:
        LOG.exception(f"Failed to delete {kind} {str(path)}")


def _load_key(maybe_key: Path) -> ec.EllipticCurvePrivateKey | None:
    """Load a prospective private key from a path.

    This function upholds the internal requirements we set on a key to make sure we don't
    accidentally load the wrong thing, or indeed load the wrong thing in the future. This needs
    to be an elliptic curve key that's properly loadable, and if it's anything else we won't load it
    and will delete the file (so be careful calling this in an iterdir()).
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


def _load_cert(maybe_cert: Path) -> x509.Certificate | None:
    """Load a prospective x509 cert from a path.

    If the cert can't be loaded, returns None and deletes the malformed file.
    """
    try:
        cert_bytes = maybe_cert.read_bytes()
    except Exception:
        LOG.exception(f"Failed to read CA cert bytes from {str(maybe_cert)}")
        return None
    try:
        cert = x509.load_der_x509_certificate(cert_bytes)
    except ValueError:
        LOG.exception(f"Failed to parse x509 cert from {str(maybe_cert)}")
        return None
    return cert


def _load_ca_cert(maybe_cert: Path) -> x509.Certificate | None:  # noqa: C901
    """Load a prospective OT CA cert from a path.

    This is like _load_cert but checks to see if this is one of our CA certs as well as being a valid cert in general.
    """
    cert = _load_cert(maybe_cert)
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
    if cert.subject != _NAME:
        LOG.error(
            f"Failed to parse Opentrons Flex CA cert from {str(maybe_cert)}: wrong subject {cert.subject}"
        )
        return None
    if cert.issuer != _NAME:
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


def _keys_from_dir(key_dir: Path) -> Iterator[tuple[Path, ec.EllipticCurvePrivateKey]]:
    """Load all the keys that match our CA key format from the specified path."""
    for maybe_key in key_dir.iterdir():
        if _CA_NAME_PATTERN.match(maybe_key.name):
            key = _load_key(maybe_key)
            if key:
                yield (maybe_key, key)
            else:
                _safe_del(maybe_key, "bad CA private key")


def _ca_certs_from_dir(ca_cert_dir: Path) -> Iterator[tuple[Path, x509.Certificate]]:
    """Load all the keys that match our CA cert format from the specified path.

    If any cert that is named like one of our CAs is not one of our CAs, delete it.
    """
    for maybe_cert in ca_cert_dir.iterdir():
        if _CA_NAME_PATTERN.match(maybe_cert.name):
            # loading the cert requires that it be a valid x509 cert in DER
            cert = _load_ca_cert(maybe_cert)
            if cert:
                yield (maybe_cert, cert)
            else:
                _safe_del(maybe_cert, "bad CA cert")


def _match_keys_and_certs(
    keys: Iterable[tuple[Path, ec.EllipticCurvePrivateKey]],
    certs: Iterable[tuple[Path, x509.Certificate]],
) -> Iterator[X509Pair]:
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


def _remove_certpair(pair: X509Pair) -> None:
    try:
        pair.keypath.unlink()
    except OSError:
        LOG.exception(f"Failed to remove key {str(pair.keypath)}")
    try:
        pair.certpath.unlink()
    except OSError:
        LOG.exception(f"Failed to remove cert {str(pair.certpath)}")


def _remove_certs(
    certlist: list[X509Pair], predicate: Callable[[X509Pair], bool], reason: str
) -> list[X509Pair]:
    """Remove certs from a list if they match a predicate. The predicate is called exactly once for each candidate."""
    invalid = [cert for cert in certlist if predicate(cert)]
    valid = [cert for cert in certlist if cert not in invalid]
    LOG.info(
        f"Invalid {len(invalid)} certs for {reason} leaving {len(valid)} certs (removed: {', '.join([_fingerprint(cert.cert) for cert in invalid])})"
    )
    for cert in invalid:
        _remove_certpair(cert)
    return valid


def _fingerprint(cert: x509.Certificate) -> str:
    return cert.fingerprint(hashes.SHA256()).hex()


def _create_ca(key_dir: Path, ca_cert_dir: Path, now: datetime) -> X509Pair:
    """Make a new CA pair."""
    expiry = now + timedelta(days=365, hours=1)
    key = ec.generate_private_key(ec.SECP256R1())
    cert = (
        x509.CertificateBuilder()
        .subject_name(_NAME)
        .issuer_name(_ISSUER)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(expiry)
        .add_extension(_OT_CA_BASIC_CONSTRAINTS, critical=True)
        .add_extension(_OT_CA_KU, critical=True)
        .add_extension(
            x509.SubjectKeyIdentifier.from_public_key(key.public_key()), critical=False
        )
        .sign(key, hashes.SHA256())
    )
    LOG.info(f"Created CA {_fingerprint(cert)}")
    pair = X509Pair(
        keypath=key_dir / f"ot-robot-tls-ca-{expiry.strftime('%Y-%m-%d')}.pem",
        certpath=ca_cert_dir / f"ot-robot-tls-ca-{expiry.strftime('%Y-%m-%d')}.cer",
        key=key,
        cert=cert,
    )
    if not key_dir.exists():
        try:
            key_dir.mkdir(parents=True)
        except OSError:
            LOG.warning(
                f"Key directory {str(key_dir)} could not be created! Keys will not be saved"
            )
    elif not key_dir.is_dir():
        LOG.warning(
            f"Key directory {str(key_dir)} is not a directory! Keys will not be saved"
        )
    try:
        pair.keypath.write_bytes(
            key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            )
        )
        LOG.info(f"Wrote key for {_fingerprint(pair.cert)} to {str(pair.keypath)}")
    except OSError:
        LOG.error(
            f"Could not write key for {_fingerprint(pair.cert)} to {str(pair.keypath)}, CA will be lost on server shutdown"
        )
    if not ca_cert_dir.exists():
        try:
            ca_cert_dir.mkdir(parents=True)
        except OSError:
            LOG.warning(
                f"CA cert directory {str(ca_cert_dir)} could not be created! Certs will not be saved"
            )
    elif not ca_cert_dir.is_dir():
        LOG.warning(
            f"CA cert directory {str(ca_cert_dir)} is not a directory! Certs will not be saved"
        )
    try:
        pair.certpath.write_bytes(cert.public_bytes(serialization.Encoding.DER))
        LOG.info(f"Wrote cert for {_fingerprint(pair.cert)} to {str(pair.certpath)}")
    except OSError:
        LOG.error(
            f"Could not write cert for {_fingerprint(pair.cert)} to {str(pair.certpath)}, CA will be lost on server shutdown"
        )
    return pair


class TLSCAManager:
    """Class that manages TLS CAs.

    This is a mix of code that reads and manages data from the filesystem and code that keeps state in its
    attributes. It manages
    - CA generation, expiry, and management
    - CA cert export
    """

    def __init__(self, key_dir: Path, ca_cert_dir: Path) -> None:
        """Build the object. Scans the given directories to set up the first set of CAs."""
        self._key_dir = key_dir
        self._ca_cert_dir = ca_cert_dir

        try:
            pairs = list(
                _match_keys_and_certs(
                    _keys_from_dir(key_dir), _ca_certs_from_dir(ca_cert_dir)
                )
            )
        except OSError:
            # if at least one of these directories doesn't exist or isn't readable, we have no certs
            pairs = []

        now = datetime.now(timezone.utc)
        # remove any certificates that have expired
        valid = _remove_certs(
            pairs, lambda pair: pair.cert.not_valid_after_utc < now, "no longer valid"
        )
        # we should never have more CAs than 2 (a current and a next). if we do, we need to delete some.
        # unfortunately, this leaves us open to something else creating some certs that replace whatever
        # we were using before reboot, but if someone can do that to the filesystem there's not much we
        # can do - this is better understood as bug robustness.
        valid = sorted(valid, key=lambda pair: pair.cert.not_valid_after_utc)
        # delete in order
        # - any that are not yet valid
        if len(valid) > 2:
            valid = _remove_certs(
                valid,
                lambda pair: pair.cert.not_valid_before_utc > now,
                "not yet valid",
            )

        # - the furthest-in-the-future expiring ones
        if len(valid) > 2:
            valid = _remove_certs(
                valid,
                lambda pair: valid.index(pair) >= 2,
                "furthest-in-the-future",
            )

        # if there are still two CAs, that's allowed - the sooner-to-expire one is current and the
        # later-to-expire one is next. If there's just one, that's fine too - it's current, and there's no
        # next. If there are none, we need to make one.
        if len(valid) == 2:
            self._current_ca = valid[0]
            LOG.info(
                f"Loaded {_fingerprint(self._current_ca.cert)} ({self._current_ca.cert.not_valid_before_utc}-{self._current_ca.cert.not_valid_after_utc}) as current CA"
            )
            self._next_ca: X509Pair | None = valid[1]
            LOG.info(
                f"Loaded {_fingerprint(self._next_ca.cert)} ({self._next_ca.cert.not_valid_before_utc}-{self._next_ca.cert.not_valid_after_utc}) as next CA"
            )
        elif len(valid) == 1:
            self._current_ca = valid[0]
            LOG.info(
                f"Loaded {_fingerprint(self._current_ca.cert)} ({self._current_ca.cert.not_valid_before_utc}-{self._current_ca.cert.not_valid_after_utc}) as current CA"
            )
            self._next_ca = None
            LOG.info("Found no next CA to load")
        else:
            LOG.info("Found no CAs to load, creating")
            self._current_ca = _create_ca(key_dir, ca_cert_dir, now)
            LOG.info(
                f"Created {_fingerprint(self._current_ca.cert)} ({self._current_ca.cert.not_valid_before_utc}-{self._current_ca.cert.not_valid_after_utc}) as current CA"
            )
            self._next_ca = None

        # if we don't have a next CA and our current expires in <90 days (ish), make a next one
        if (
            self._current_ca.cert.not_valid_after_utc < (now + timedelta(days=3 * 30))
            and not self._next_ca
        ):
            LOG.info(
                f"Current CA expires at {self._current_ca.cert.not_valid_after_utc} which is less than 3 months from {now} and we have no next CA, creating"
            )
            self._next_ca = _create_ca(key_dir, ca_cert_dir, now)
            LOG.info(
                f"Created {_fingerprint(self._next_ca.cert)} ({self._next_ca.cert.not_valid_before_utc}-{self._next_ca.cert.not_valid_after_utc}) as next CA"
            )
