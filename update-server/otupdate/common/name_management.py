"""
otupdate.common.name_management: functions for managing machine names

The robot has several names associated with it, some of which we tie together.


- The static hostname:

  This is the traditional computer networking hostname,
  which has limits on length and allowed characters.

  Avahi automatically advertises this over mDNS,
  so it can be used to ping, issue HTTP requests, ssh in, etc.,
  via <static hostname>.local.


- The Avahi service name:

  This is a human-readable Unicode string.
  It affects how the system is advertised over mDNS + DNS-SD.
  Network exploration tools may use it as a user-facing label.

  The DNS-SD spec calls this the "instance name".
  (This is not to be confused with what the DNS-SD spec calls the "service name",
  which is a totally separate thing.)


- The pretty hostname:

  A human-readable Unicode string.
  This is a systemd thing, stored in /etc/machine-info as the PRETTY_HOSTNAME
  and accessible via tools like hostnamectl.


- "The name" (unqualified):

  Over HTTP, we let clients get and set the robot's "name," a human-readable
  Unicode string.

  Behind the scenes, this is implemented in terms of setting other names.
  See `set_name_endpoint()`.
"""

import asyncio
import json
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

    def _set_avahi_service_name_sync(new_service_name: str):
        """The synchronous implementation of setting the Avahi service name.

        The dbus module doesn't natively support async/await.
        """
        # For semantics of the methods we're calling, see Avahi's API docs.
        # For example: https://www.avahi.org/doxygen/html/index.html#good_publish
        # It's mostly in terms of the C API, but the semantics should be the same.
        #
        # For exact method names and argument types, see Avahi's D-Bus bindings,
        # which they specify across several machine-readable files. For example:
        # https://github.com/lathiat/avahi/blob/v0.7/avahi-daemon/org.freedesktop.Avahi.EntryGroup.xml
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

        # TODO(mm, 2022-05-06): This isn't exception-safe.
        # Since we've already reset the entrygroup, if this fails
        # (for example because Avahi doesn't like the new name),
        # we'll be left with no entrygroup and Avahi will stop advertising the machine.
        _BUS_STATE.entrygroup.AddService(
            dbus.Int32(-1),  # avahi.IF_UNSPEC
            dbus.Int32(-1),  # avahi.PROTO_UNSPEC
            dbus.UInt32(0),  # flags
            new_service_name,  # sname
            "_http._tcp",  # stype
            domainname,  # sdomain (.local)
            f"{hostname}.{domainname}",  # shost (hostname.local)
            dbus.UInt16(31950),  # port
            dbus.Array([], signature="ay"),
        )
        _BUS_STATE.entrygroup.Commit()

        # TODO(mm, 2022-05-04): Recover from AVAHI_ENTRY_GROUP_COLLISION in case
        # this name collides with another device on the network.
        # https://github.com/Opentrons/opentrons/issues/10126

except ImportError:
    LOG.exception("Couldn't import dbus, name setting will be nonfunctional")

    def _set_avahi_service_name_sync(new_service_name: str):
        LOG.warning("Not setting name, dbus could not be imported")


_BUS_LOCK = asyncio.Lock()


async def set_avahi_service_name(new_service_name: str) -> None:
    """Set the Avahi service name.

    The new service name will only apply to the current boot.

    Avahi requires a service name.
    It will not advertise the system over mDNS + DNS-SD until one is set.

    Since the Avahi service name corresponds to the DNS-SD instance name,
    it's a human-readable string of mostly arbitrary Unicode,
    at most 63 octets (not 63 code points or 63 characters!) long.
    (See: https://datatracker.ietf.org/doc/html/rfc6763#section-4.1.1)
    Avahi will raise an error if it thinks the new service name is invalid.
    """
    async with _BUS_LOCK:
        await asyncio.get_event_loop().run_in_executor(
            None, _set_avahi_service_name_sync, new_service_name
        )


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

    Intended to be run once when the server starts.

    This function:

    1. Picks a good value for the static hostname.
    2. Persists the new value for future boots.
    3. Updates the "live" value for the current boot.
    4. Restarts Avahi so that it advertises using the new live value.
    5. Returns the new static hostname.
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
            # if it's quoted or contains escaped characters.
            # https://github.com/Opentrons/opentrons/issues/10197
            # Perhaps we should query the pretty hostname from hostnamectl instead of
            # implementing our own parsing.
            return "=".join(line.split("=")[1:])
    LOG.warning(f"No PRETTY_HOSTNAME in {contents}, defaulting to {default}")
    return default


async def persist_pretty_hostname(name: str) -> str:
    """Change the robot's pretty hostname.

    Writes the new name to /etc/machine-info so it persists across reboots.

    :param name: The name to set.
    :returns: The name that was set. This may be different from ``name``,
              if the pretty hostname could not be written.
    """
    try:
        # We can't run `hostnamectl --pretty <name>` to write this for us
        # because it fails with a read-only filesystem error, for unknown reasons.
        _rewrite_machine_info(new_pretty_hostname=name)
        checked_name = name
    except OSError:
        LOG.exception("Could not set pretty hostname")
        checked_name = get_pretty_hostname()
    return checked_name


async def set_name(app: web.Application, new_name: str) -> str:
    """See `set_name_endpoint()`."""
    await set_avahi_service_name(new_name)
    # Setting the Avahi service name can fail if Avahi doesn't like the new name.
    # Persist only after it succeeds, so we don't persist something invalid.
    persisted_pretty_hostname = await persist_pretty_hostname(new_name)
    return persisted_pretty_hostname


async def set_name_endpoint(request: web.Request) -> web.Response:
    """Set the robot's name.

    This comprises a few things:

    * The name returned over HTTP
    * The pretty hostname
    * The Avahi service name

    It does not include the static hostname.

    Request with POST /server/name {"name": new_name}
    Responds with 200 OK {"name": "set_name"}
    or 400 Bad Request

    In general, the name that is set will be the same name that was requested.
    It may be different if it had to be truncated, sanitized, etc.
    """

    def build_400(msg: str) -> web.Response:
        return web.json_response(data={"message": msg}, status=400)

    try:
        body = await request.json()
    except json.JSONDecodeError as exception:
        # stringifying a JSONDecodeError will include an error summary and location,
        # e.g. "Expecting value: line 1 column 1 (char 0)"
        return build_400(str(exception))

    try:
        name_to_set = body["name"]
    except KeyError:
        return build_400('Body has no "name" key')

    if not isinstance(name_to_set, str):
        return build_400('"name" key is not a string"')

    new_name = await set_name(app=request.app, new_name=name_to_set)

    request.app[DEVICE_NAME_VARNAME] = new_name
    return web.json_response(data={"name": new_name}, status=200)


async def get_name_endpoint(request: web.Request) -> web.Response:
    """Get the robot's name, as previously set with `set_name_endpoint()`.

    This information is also accessible in /server/update/health, but this
    endpoint provides symmetry with POST /server/name.

    GET /server/name -> 200 OK, {'name': robot name}
    """
    return web.json_response(
        data={"name": request.app[DEVICE_NAME_VARNAME]}, status=200
    )
