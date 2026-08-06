"""Code for managing TLS end entities."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Awaitable, Callable, Final

from cryptography import x509

from . import cryptography_utils
from key_server.util import subproc_wait_timeout

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
    EE_EXPIRY_GRACE_DURATION: Final = timedelta(hours=1)

    @staticmethod
    async def rotate_cert_nginx() -> None:
        """Notify nginx that it should rotate certs."""
        LOG.info("Using systemd/nginx TLS terminator cert rotation")
        reload_proc = await asyncio.create_subprocess_exec(
            "/usr/bin/systemctl", "reload", "nginx-https.service"
        )

        reload_code = await subproc_wait_timeout(reload_proc)
        if reload_code != 0:
            LOG.warning(f"nginx could not reload ({reload_code}), restarting")
            restart_proc = await asyncio.create_subprocess_exec(
                "/usr/bin/systemctl", "restart", "nginx-https.service"
            )
            restart_code = await subproc_wait_timeout(restart_proc)
            if restart_code != 0:
                LOG.error(
                    f"nginx could not restart ({restart_code}), https unavailable"
                )

    @staticmethod
    async def rotate_cert_none() -> None:
        """Notify (quote-unquote) nothing that certs should be rotated."""
        LOG.info("Using none TLS terminator cert rotation")

    def __init__(
        self,
        key_dir: Path,
        ee_cert_dir: Path,
        robot_hostname: str,
        robot_ips: list[str],
        rotate_fn: Callable[[], Awaitable[None]],
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
        self._tls_terminator_rotate = rotate_fn

    def set_robot_details(
        self, now: datetime, robot_hostname: str | None, robot_ips: list[str] | None
    ) -> bool:
        """Alter the robot details stored by the end entity certs.

        Returns a built-in call to ready(), so if it returns false the caller should rotate the certs.
        """
        if robot_hostname is not None:
            self._robot_hostname = robot_hostname
        if robot_ips is not None:
            self._robot_ips = robot_ips
        return self.ready(now)

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

    def ready(self, as_of: datetime) -> bool:
        """True if the system is ready; False otherwise.

        The system is ready if it has a certificate and the certificate will be valid one hour after the
        time specified.

        There are circumstances beyond this that would make this cert a bad choice to terminate TLS
        with - for instance, the robot's hostname or IP has changed, or the CA has rotated - but this
        system is only checking the validity of the certificate itself.
        """
        return (
            self._ee_pair is not None
            and (self._ee_pair.cert.not_valid_before_utc < as_of)
            and (
                (as_of + self.EE_EXPIRY_GRACE_DURATION)
                < self._ee_pair.cert.not_valid_after_utc
            )
            and self._robot_hostname == self._current_hostname()
            and self._robot_ips == self._current_ips()
        )

    async def install_cert(self, cert: cryptography_utils.SignedCert) -> None:
        """Install a signed EE cert."""
        LOG.info(
            f"Installing TLS certificate with fingerprint {cryptography_utils.fingerprint(cert.cert)}"
        )
        self.remove_cert("EE cert outdated")
        self._ee_pair = cryptography_utils.install_tls_cert(self._ee_cert_dir, cert)
        await self._tls_terminator_rotate()

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

    def _current_hostname(self) -> str | None:
        if not self._ee_pair:
            return None
        san = self._ee_pair.cert.extensions.get_extension_for_class(
            x509.SubjectAlternativeName
        )
        for altname in san.value:
            if isinstance(altname, x509.DNSName):
                return altname.value.split(".local")[0]
        return None

    def _current_ips(self) -> list[str] | None:
        if not self._ee_pair:
            return None
        ips: list[str] = []
        san = self._ee_pair.cert.extensions.get_extension_for_class(
            x509.SubjectAlternativeName
        )
        for name in san.value:
            if isinstance(name, x509.IPAddress):
                ips.append(str(name.value))
        return ips
