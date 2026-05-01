"""Code for managing TLS CAs."""

import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Final

from . import cryptography_utils, file_utils

LOG = logging.getLogger(__name__)


class TLSCAManager:
    """Class that manages TLS CAs.

    This is a mix of code that reads and manages data from the filesystem and code that keeps state in its
    attributes. It manages
    - CA generation, expiry, and management
    - CA cert export
    """

    CA_EXPIRY_DURATION: Final = timedelta(days=365, hours=1)
    CA_OVERLAP_DURATION: Final = timedelta(days=30 * 3)
    CA_ROTATION_TIME_BEFORE_EXPIRY: Final = timedelta(days=1)
    CA_EXPIRY_CHECK_POLL_PERIOD: Final = timedelta(days=1)

    def __init__(self, key_dir: Path, ca_cert_dir: Path) -> None:
        """Build the object. Scans the given directories to set up the first set of CAs."""
        self._key_dir = key_dir
        self._ca_cert_dir = ca_cert_dir

        try:
            pairs = list(
                cryptography_utils.match_keys_and_certs(
                    file_utils.ca_keys_from_dir(key_dir),
                    file_utils.ca_certs_from_dir(ca_cert_dir),
                )
            )
        except OSError:
            # if at least one of these directories doesn't exist or isn't readable, we have no certs
            pairs = []

        now = datetime.now(timezone.utc)
        # remove any certificates that have expired
        valid = cryptography_utils.remove_certs(
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
            valid = cryptography_utils.remove_certs(
                valid,
                lambda pair: pair.cert.not_valid_before_utc > now,
                "not yet valid",
            )

        # - the furthest-in-the-future expiring ones
        if len(valid) > 2:
            valid = cryptography_utils.remove_certs(
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
                f"Loaded {cryptography_utils.fingerprint(self._current_ca.cert)} ({self._current_ca.cert.not_valid_before_utc}-{self._current_ca.cert.not_valid_after_utc}) as current CA"
            )
            self._next_ca: cryptography_utils.X509Pair | None = valid[1]
            LOG.info(
                f"Loaded {cryptography_utils.fingerprint(self._next_ca.cert)} ({self._next_ca.cert.not_valid_before_utc}-{self._next_ca.cert.not_valid_after_utc}) as next CA"
            )
        elif len(valid) == 1:
            self._current_ca = valid[0]
            LOG.info(
                f"Loaded {cryptography_utils.fingerprint(self._current_ca.cert)} ({self._current_ca.cert.not_valid_before_utc}-{self._current_ca.cert.not_valid_after_utc}) as current CA"
            )
            self._next_ca = None
            LOG.info("Found no next CA to load")
        else:
            LOG.info("Found no CAs to load, creating")
            self._current_ca = cryptography_utils.create_ca(
                key_dir, ca_cert_dir, now, self.CA_EXPIRY_DURATION
            )
            LOG.info(
                f"Created {cryptography_utils.fingerprint(self._current_ca.cert)} ({self._current_ca.cert.not_valid_before_utc}-{self._current_ca.cert.not_valid_after_utc}) as current CA"
            )
            self._next_ca = None

        # if we don't have a next CA and our current expires in <90 days (ish), make a next one
        if self.must_build_next(now):
            LOG.info(
                f"Current CA expires at {self._current_ca.cert.not_valid_after_utc} which is less than 3 months from {now} and we have no next CA, creating"
            )
            self.build_next(now)

    def get_current_certificate_der_bytes(self) -> bytes:
        """Get the currently-valid CA certificate in DER-encoded form.

        This data should not be sent in unencrypted form over an unencrypted connection.
        """
        return cryptography_utils.get_cert_bytes_der(self._current_ca.cert)

    def get_next_certificate_der_bytes(self) -> bytes | None:
        """Get the next valid CA certificate, if there is one, in DER-encoded form.

        This data should not be sent in unencrypted form over an unencrypted connection.
        """
        return (
            cryptography_utils.get_cert_bytes_der(self._next_ca.cert)
            if self._next_ca
            else None
        )

    def must_rotate(self, now: datetime) -> bool:
        """True if we need to rotate certificates."""
        must_rotate = self._current_ca.cert.not_valid_after_utc < (
            now + self.CA_ROTATION_TIME_BEFORE_EXPIRY
        )
        LOG.info(
            f"Rotation required at {now} for cert expiring at {self._current_ca.cert.not_valid_after_utc}: {must_rotate}"
        )
        return must_rotate

    def must_build_next(self, now: datetime) -> bool:
        """True if we need to build the next certificate."""
        return (
            self._current_ca.cert.not_valid_after_utc < (now + self.CA_OVERLAP_DURATION)
            and not self._next_ca
        )

    def rotate(self, now: datetime) -> None:
        """Rotate the CAs, removing the current and replacing it with the next."""
        LOG.info("Rotating CA certificates")
        if self.must_build_next(now):
            LOG.warning("No next CA present at rotation")
            self.build_next(now)

        old_current = self._current_ca
        assert self._next_ca
        self._current_ca = self._next_ca
        self._next_ca = None
        cryptography_utils.delete_certpair(old_current, "rotated away")
        if self.must_build_next(now):
            self.build_next(now)

    def build_next(self, now: datetime) -> None:
        """Build the next CA that will be used."""
        self._next_ca = cryptography_utils.create_ca(
            self._key_dir, self._ca_cert_dir, now, self.CA_EXPIRY_DURATION
        )
        LOG.info(
            f"Created {cryptography_utils.fingerprint(self._next_ca.cert)} ({self._next_ca.cert.not_valid_before_utc}-{self._next_ca.cert.not_valid_after_utc}) as next CA"
        )

    def sign_precert(
        self, precert: cryptography_utils.PartialCertWithSigningRequired
    ) -> cryptography_utils.SignedCert:
        """Sign a TLS end-entity certificate that needs signing."""
        LOG.info(
            f"Sealing TLS EE precertificate with current ca {cryptography_utils.fingerprint(self._current_ca.cert)}"
        )
        sealed = cryptography_utils.seal_cert_builder_with_ca(precert, self._current_ca)
        LOG.info(
            f"Sealed TLS EE precertificate with fingerprint {cryptography_utils.fingerprint(sealed.cert)}"
        )
        return sealed
