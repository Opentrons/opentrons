"""Code for getting robot hostname and IPs on a real robot.

Code in this module must be kept as absolutely simple as possible because it is a real
pain to test - it relies on dbus and is almost useless to mock.

The D-Bus apis interacted with here are:
- NetworkManager: https://people.freedesktop.org/~lkundrak/nm-dbus-api/spec.html
- systemd-hostnamed: https://www.freedesktop.org/software/systemd/man/latest/org.freedesktop.hostname1.html
"""

import asyncio
import logging
from typing import Any, AsyncGenerator

import dbus

from .interface import RobotDetails

LOG = logging.getLogger(__name__)


def _fd_dotpath(rightpart: str) -> str:
    return f"org.freedesktop.{rightpart}"


def _nm_iface(rightpart: str | None = None) -> str:
    if rightpart is None:
        return _fd_dotpath("NetworkManager")
    else:
        return _fd_dotpath(f"NetworkManager.{rightpart}")


def _hn_iface(rightpart: str | None = None) -> str:
    if rightpart is None:
        return _fd_dotpath("hostname1")
    else:
        return _fd_dotpath(f"hostname1.{rightpart}")


class RobotDetailsMachine(RobotDetails):
    """Get robot details on a real robot using system interfaces."""

    def __init__(self) -> None:
        """Build a RobotDetailsMachine."""
        self._bus = dbus.SystemBus()

    def _get_prop(self, app: str, path: str, iface: str, propname: str) -> Any:
        bus_obj = self._bus.get_object(app, path)
        props_iface = dbus.Interface(bus_obj, "org.freedesktop.DBus.Properties")
        return props_iface.Get(iface, propname)

    def _get_nm_prop(self, path: str, iface: str, propname: str) -> Any:
        return self._get_prop(_nm_iface(), path, iface, propname)

    def _get_hn_prop(self, path: str, iface: str, propname: str) -> Any:
        return self._get_prop(_hn_iface(), path, iface, propname)

    def _sync_get_hostname(self) -> str | None:
        """Get the hostname through hostnamed."""
        try:
            # hostname is straightforwardly a DBus string, which can be made into a regular string
            # with str()
            hostname = self._get_hn_prop(
                "/org/freedesktop/hostname1",
                _hn_iface(),
                "StaticHostname",
            )
            return str(hostname)
        except Exception:
            LOG.exception("Failed to get hostname information through avahi")
            return None

    def _sync_get_ipv4_addresses(self) -> list[str]:
        """Get IP addresses through NetworkManager."""
        ips = []
        try:
            # devices is an array of dbus paths in the networkmanager application space
            nm_devices = self._get_nm_prop(
                "/org/freedesktop/NetworkManager",
                _nm_iface(),
                "Devices",
            )
            for device_path in nm_devices:
                # nm_ip4_config_obj_path is a DBus path to the ipv4 config for the connection
                nm_ip4_config_obj_path = self._get_nm_prop(
                    device_path, _nm_iface("Device"), "Ip4Config"
                )
                if nm_ip4_config_obj_path == "/":
                    # sometimes the ip4config will return / which isn't valid. maybe a weirdness of the python-dbus connection
                    continue
                # AddressData is an array of maps with the stringified ip address in the address key
                nm_address_data = self._get_nm_prop(
                    nm_ip4_config_obj_path,
                    _nm_iface("IP4Config"),
                    "AddressData",
                )
                for address_conf in nm_address_data:
                    ips.append(str(address_conf["address"]))
        except Exception:
            LOG.exception("Failed to get IP address information through NetworkManager")
        # We shouldn't list the loopback ip address in the cert because it's only for external access
        return [ip for ip in ips if ip != "127.0.0.1"]

    async def get_details(self) -> tuple[str | None, list[str]]:
        """Get the robot address details once."""
        hostname = self._sync_get_hostname()
        addresses = sorted(self._sync_get_ipv4_addresses())
        return hostname, addresses

    async def yield_details_on_change(
        self,
    ) -> AsyncGenerator[tuple[str | None, list[str]], None]:
        """Generates new robot details pairs when they change.

        Frustratingly, it does this by polling because until we switch dbus implementations we can't use
        dbus's very convenient notification system because it relies on GLib polling event loop which is
        incompatible with asyncio.
        """
        current_hostname, current_addresses = await self.get_details()
        while True:
            # we need to react to changes pretty quickly, since any requests made to nginx via HTTPS that
            # are secured with a certificate that doesn't match the current IP address will fail.
            await asyncio.sleep(1)
            hostname, addresses = await self.get_details()
            if hostname != current_hostname or addresses != current_addresses:
                yield hostname, addresses
                current_hostname = hostname
                current_addresses = addresses
