"""
otupdate.common.name_management: functions for managing machine names

The robot has two names associated with it:

- The static hostname:

  This is the traditional computer networking hostname,
  which has limits on length and allowed characters.
  This is the name by which the machine is advertised on mDNS,
  so it can be used to ping, issue HTTP requests, ssh in, etc.,
  via <static_hostname>.local.

  It should be set when the update server starts by :py:func:`set_up_static_hostname`.

- The pretty hostname:

  This is a human-readable Unicode string.
  It's stored in /etc/machine-info as the PRETTY_HOSTNAME, as specified by systemd,
  and is used in the Avahi service name.

  We also expose the pretty hostname over HTTP as the robot's "display name"
  or "name" (unqualified). This is what users normally see in the Opentrons App.
"""

import asyncio
import logging
import os
from typing import Optional
import urllib.parse

from aiohttp import web

from .constants import DEVICE_NAME_VARNAME

LOG = logging.getLogger(__name__)


try:
    import dbus

    class DBusState:
        """Bundle of state for dbus"""

        def __init__(
            self,
            bus: dbus.SystemBus,
            server: dbus.Interface,
            entrygroup: dbus.Interface,
        ) -> None:
            """
            Build the state bundle.

            :param bus: The system bus instance
            :param server: An org.freedesktop.Avahi.Server interface
            :param entrygroup: An org.freedesktop.Avahi.EntryGroup interface
            """
            self.bus = bus
            #: The system bus
            self.entrygroup = entrygroup
            #: The entry group interface
            self.server = server
            #: The avahi server interface

    _BUS_STATE: Optional[DBusState] = None

    def _set_pretty_hostname_future(name: str):
        """
        The implementation of the pretty hostname setting, to be run in a concurrent
        executor since the dbus module doesn't work with asyncio
        """
        global _BUS_STATE
        if not _BUS_STATE:
            bus = dbus.SystemBus()
            server_obj = bus.get_object("org.freedesktop.Avahi", "/")
            server_if = dbus.Interface(server_obj, "org.freedesktop.Avahi.Server")
            entrygroup_path = server_if.EntryGroupNew()
            entrygroup_obj = bus.get_object("org.freedesktop.Avahi", entrygroup_path)
            entrygroup_if = dbus.Interface(
                entrygroup_obj, "org.freedesktop.Avahi.EntryGroup"
            )
            _BUS_STATE = DBusState(bus, server_if, entrygroup_if)

        _BUS_STATE.entrygroup.Reset()
        hostname = _BUS_STATE.server.GetHostName()
        domainname = _BUS_STATE.server.GetDomainName()
        _BUS_STATE.entrygroup.AddService(
            dbus.Int32(-1),  # avahi.IF_UNSPEC
            dbus.Int32(-1),  # avahi.PROTO_UNSPEC
            dbus.UInt32(0),  # flags
            name,  # sname
            "_http._tcp",  # stype
            domainname,  # sdomain (.local)
            f"{hostname}.{domainname}",  # shost (hostname.local)
            dbus.UInt16(31950),  # port
            dbus.Array([], signature="ay"),
        )
        _BUS_STATE.entrygroup.Commit()

except ImportError:
    LOG.exception("Couldn't import dbus, name setting will be nonfunctional")

    def _set_pretty_hostname_future(name: str):
        LOG.warning("Not setting name, dbus could not be imported")


_BUS_LOCK = asyncio.Lock()


def _choose_static_hostname() -> str:
    """Get a good value for the system's static hostname.

    The static hostname is loaded from, in order of preference:

    1. url-encoding the contents of /var/serial-number, if it is present and not empty.
    2. the systemd-generated machine-id.
    """
    if os.path.exists("/var/serial"):
        serial = open("/var/serial").read().strip()
        if serial:
            # TODO(mm, 2022-04-27): This uses the serial number even if it hasn't
            # been configured and is still the default, like "opentrons."
            LOG.info("Using serial for hostname")
            hn = "".join([c for c in urllib.parse.quote(serial, safe="") if c != "%"])
            if hn != serial:
                LOG.warning(f"Reencoded serial to {hn}")
            return hn

        else:
            LOG.info("Using machine-id for hostname: empty /var/serial")
    else:
        LOG.info("Using machine-id for hostname: no /var/serial")

    with open("/etc/machine-id") as f:
        return f.read().strip()[:6]


async def set_up_static_hostname() -> str:
    """Automatically configure the machine's static hostname.

    Intended to be run when the server starts.

    Once the hostname is set, we restart avahi.

    :returns: the static hostname
    """
    hostname = _choose_static_hostname()
    with open("/etc/hostname", "w") as ehn:
        ehn.write(f"{hostname}\n")

    # First, we run hostnamed which will set the transient hostname
    # and loaded static hostname from the value we just wrote to
    # /etc/hostname
    LOG.debug("Setting hostname")
    proc = await asyncio.create_subprocess_exec(
        "hostname",
        hostname,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    ret = proc.returncode
    if ret != 0:
        LOG.error(
            f"Error starting hostname: {ret} " f"stdout: {stdout!r} stderr: {stderr!r}"
        )
        raise RuntimeError("Couldn't run hostname")

    # Then, with the hostname set, we can restart avahi
    LOG.debug("Restarting avahi")
    proc = await asyncio.create_subprocess_exec(
        "systemctl",
        "restart",
        "avahi-daemon",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    ret = proc.returncode
    if ret != 0:
        LOG.error(
            f"Error restarting avahi-daemon: {ret} "
            f"stdout: {stdout!r} stderr: {stderr!r}"
        )
        raise RuntimeError("Error restarting avahi")
    LOG.debug("Updated hostname and restarted avahi OK")
    return hostname


def _rewrite_machine_info(new_pretty_hostname: str):
    """Write a new value for the pretty hostname.

    :raises OSError: If the new value could not be written.
    """
    try:
        with open("/etc/machine-info") as emi:
            contents = emi.read()
    except OSError:
        LOG.exception("Couldn't read /etc/machine-info")
        contents = ""
    new_contents = _rewrite_machine_info_str(
        current_machine_info_contents=contents, new_pretty_hostname=new_pretty_hostname
    )
    with open("/etc/machine-info", "w") as emi:
        emi.write(new_contents)


def _rewrite_machine_info_str(
    current_machine_info_contents: str, new_pretty_hostname: str
) -> str:
    """
    Return current_machine_info_contents - the full contents of
    /etc/machine-info - with the PRETTY_HOSTNAME=... line rewritten to refer
    to new_pretty_hostname.
    """
    current_lines = current_machine_info_contents.splitlines()
    preserved_lines = [
        ln for ln in current_lines if not ln.startswith("PRETTY_HOSTNAME")
    ]
    # FIXME(mm, 2022-04-27): This will not correctly store the pretty hostname
    # if it contains newlines or certain other special characters.
    # https://github.com/Opentrons/opentrons/issues/9960
    new_lines = preserved_lines + [f"PRETTY_HOSTNAME={new_pretty_hostname}"]
    new_contents = "\n".join(new_lines) + "\n"
    return new_contents


def get_pretty_hostname(default: str = "no name set"):
    """Get the currently-configured pretty hostname"""
    try:
        with open("/etc/machine-info") as emi:
            contents = emi.read()
    except OSError:
        LOG.exception("Couldn't read /etc/machine-info")
        contents = ""
    for line in contents.split("\n"):
        if line.startswith("PRETTY_HOSTNAME="):
            # FIXME(mm, 2022-04-27): This will not correctly read the pretty hostname
            # if it contains newlines or certain other special characters.
            # https://github.com/Opentrons/opentrons/issues/9960
            return "=".join(line.split("=")[1:])
    LOG.warning(f"No PRETTY_HOSTNAME in {contents}, defaulting to {default}")
    return default


async def set_pretty_hostname(name: str) -> str:
    """Change the robot's pretty hostname.

    Writes the new name to /etc/machine-info so it persists across reboots,
    and so it can be picked up by Avahi on its next restart.

    Also notifies the currently-running Avahi daemon the updated pretty hostname,
    to apply it immediately.

    :param name: The name to set.
    :returns: The name that was set. This may be different from ``name``,
              if the pretty hostname could not be written.
    """
    try:
        _rewrite_machine_info(new_pretty_hostname=name)
        checked_name = name
    except OSError:
        LOG.exception("Could not set pretty hostname")
        checked_name = get_pretty_hostname()

    async with _BUS_LOCK:
        await asyncio.get_event_loop().run_in_executor(
            None, _set_pretty_hostname_future, checked_name
        )

    return checked_name


async def set_display_name_endpoint(request: web.Request) -> web.Response:
    """Set the robot's display name.

    Request with POST /server/name {"name": new_name}
    Responds with 200 OK {"name": "set_name"}

    In general, the name that is set will be the same name that was requested.
    """

    def build_400(msg: str) -> web.Response:
        return web.json_response(data={"message": msg}, status=400)

    body = await request.json()
    if "name" not in body or not isinstance(body["name"], str):
        return build_400('Body has no "name" key with a string')

    new_name = await set_pretty_hostname(body["name"])
    request.app[DEVICE_NAME_VARNAME] = new_name

    return web.json_response(data={"name": new_name}, status=200)


async def get_display_name_endpoint(request: web.Request) -> web.Response:
    """Get the robot's display name.

    This information is also accessible in /server/update/health, but this
    endpoint provides symmetry with POST /server/name.

    GET /server/name -> 200 OK, {'name': robot name}
    """
    return web.json_response(
        data={"name": request.app[DEVICE_NAME_VARNAME]}, status=200
    )
