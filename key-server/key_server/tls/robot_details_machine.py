"""tls.robot_details_machine: code for getting robot hostname and IPs on a real robot.

Code in this module must be kept as absolutely simple as possible because it is a real
pain to test - it relies on dbus and is almost useless to mock.
"""

import asyncio
import dbus
import logging
from typing import Type, Self

LOG = logging.getLogger(__name__)


class RobotDetailsAvahiAndNMCLIServer:
    """Get robot details on a real robot using system interfaces."""

    async def get_hostname(self) -> str | None:
        """The way to get the hostname that we care about is to get it from avahi.

        Avahi is the system that clients will use for hostname resolution and therefore
        the most straightforward way to figure out what clients are going to use for
        hostnames is to just ask it.
        """
        return await asyncio.get_running_loop().run_in_executor(
            None, self._sync_get_hostname
        )

    def _sync_get_hostname(self) -> str | None:
        try:
            bus = dbus.SystemBus()
            server_obj = bus.get_object("org.freedesktop.Avahi", "/")
            server_if = dbus.Interface(server_obj, "org.freedesktop.Avahi.Server")
            hostname = server_if.GetHostName()
            domain = server_if.GetDomainName()
        except Exception:
            LOG.exception("Failed to get hostname information through avahi")
            return None
        return f"{hostname}.{domain}"

    async def get_ips(self) -> list[str] | None:
        """The way to get IPs that we care about is to get them from NetworkManager.

        We could do that with nmcli, but then we'd have to poll. D-Bus lets us wait
        for signals.
        """
