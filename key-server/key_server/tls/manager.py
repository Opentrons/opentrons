"""tls.manager contains code for managing the robot's TLS stack."""

import socket
from pathlib import Path
from typing import Self, Type

from .ca_manager import TLSCAManager
from .ee_manager import TLSEEManager


class TLSManager:
    """A class for managing the combination of CAs and end-entities that allows TLS communication."""

    def __init__(self, ca_manager: TLSCAManager, ee_manager: TLSEEManager) -> None:
        """Build the TLSManager."""
        self._ca_manager = ca_manager
        self._ee_manager = ee_manager

    @classmethod
    async def create(
        cls: Type[Self], ca_cert_dir: Path, ca_key_dir: Path, tls_ee_dir: Path
    ) -> Self:
        """Create a TLS manager, taking several useful setup steps."""
        hostname = socket.gethostname()
        ca_manager = TLSCAManager(key_dir=ca_key_dir, ca_cert_dir=ca_cert_dir)
        ee_manager = TLSEEManager(
            key_dir=tls_ee_dir,
            ee_cert_dir=tls_ee_dir,
            robot_hostname=hostname,
            # note: we are an early-init system. NetworkManager may not be up by this time, and while
            # we could use a subprocess to ifconfig -a, we may not have DHCP resolution by this time.
            # the easiest way is to start with no IP addresses and then to let the system that configures
            # IP addresses tell us when they start to exist.
            robot_ips=[],
        )
        obj = cls(ca_manager=ca_manager, ee_manager=ee_manager)
        obj.refresh_ee()
        return obj

    async def teardown(self) -> None:
        """Tear down the TLS manager at the end of a session."""
        await self._ca_manager.teardown()
        self._ee_manager.remove_cert("shutting down")

    def refresh_ee(self) -> None:
        """Refresh the end-entity cert that we're presenting."""
        precert = self._ee_manager.generate_precert()
        signed = self._ca_manager.sign_precert(precert)
        self._ee_manager.install_cert(signed)
