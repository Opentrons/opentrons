"""Code for managing TLS end entities."""

import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Final

from . import cryptography_utils

LOG = logging.getLogger(__name__)


class TLSEEManager:
    """Class that manages TLS end-entity certificates.

    Unlike the CA manager, TLS end-entity certificates are very short lived and thus can be
    very frequently regenerated, including whenever we create this object - so we do not need
    to manage loading things from disk quite as much.

    We install TLS certificates that chain to the CA certificates managed by the CA manager into
    a place that nginx can see them. We keep track of when they need to be rotated (which happens
    only if we've been running for longer than the cert lifetime) and let the higher-level
    controller know if that needs to happen.

    Unlike the CA system, we don't have the ability to do everything we need to do on our own -
    we can generate part of the data we need for a cert, but it needs to be signed by the CA. So
    this class is built around the concept of "readiness", and if the class isn't currently ready
    something needs to tell us to generate a cert to sign, and then install the signed cert.

    Reasons we might not be ready include:
    - We just got built
    - The robot has changed IP addresses
    - The robot has changed names
    - The TLS certificate has expired
    - The CA certificate has expired
    """

    EE_EXPIRY_DURATION: Final = timedelta(days=1)

    def __init__(
        self,
        key_dir: Path,
        ee_cert_dir: Path,
        robot_hostname: str,
        robot_ips: list[str],
    ) -> None:
        """Build the TLSEEManager.

        Note that we do not load a previous end-entity certificate, because we want to rotate
        them on boot.
        """
        self._ready = False
        self._key_dir = key_dir
        self._ee_cert_dir = ee_cert_dir
        self._ee_pair: cryptography_utils.X509Pair | None = None
        self._robot_hostname = robot_hostname
        self._robot_ips = robot_ips

    def generate_precert(self) -> cryptography_utils.PartialCertWithSigningRequired:
        """Generate a new precertificate for signing."""
        LOG.info("Generating precertificate")
        return cryptography_utils.build_tls_precert(
            self._key_dir,
            datetime.now(timezone.utc),
            self.EE_EXPIRY_DURATION,
            self._robot_hostname,
            self._robot_ips,
        )

    def ready(self, now: datetime) -> bool:
        """True if the system is ready; False otherwise.

        The system is ready if it has a certificate and the certificate expires in more than 1 hour.

        There are circumstances beyond this that would make this cert a bad choice to terminate TLS
        with - for instance, the robot's hostname or IP has changed, or the CA has rotated - but this
        system is only checking the validity of the certificate itself.
        """
        return self._ee_pair is not None and (
            now + timedelta(hours=1) < self._ee_pair.cert.not_valid_after_utc
        )

    def install_cert(self, cert: cryptography_utils.SignedCert) -> None:
        """Install a signed EE cert."""
        LOG.info(
            f"Installing TLS certificate with fingerprint {cryptography_utils.fingerprint(cert.cert)}"
        )
        self.remove_cert("EE cert outdated")
        self._ee_pair = cryptography_utils.install_tls_cert(self._ee_cert_dir, cert)

    def remove_cert(self, reason: str) -> None:
        """Remove the currently-managed certificate, if there is one."""
        if not self._ee_pair:
            return
        LOG.info(
            f"Removing EE cert {cryptography_utils.fingerprint(self._ee_pair.cert)} because {reason}"
        )
        pair = self._ee_pair
        self._ee_pair = None
        cryptography_utils.delete_certpair(pair, reason)
