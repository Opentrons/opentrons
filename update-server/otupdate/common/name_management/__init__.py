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
import urllib.parse

from aiohttp import web

from ..constants import DEVICE_NAME_VARNAME

from .avahi import set_avahi_service_name
from .pretty_hostname import (
    get_pretty_hostname,
    persist_pretty_hostname,
)

LOG = logging.getLogger(__name__)


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
        return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
            data={"message": msg}, status=400
        )

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
    return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
        data={"name": new_name}, status=200
    )


async def get_name_endpoint(request: web.Request) -> web.Response:
    """Get the robot's name, as previously set with `set_name_endpoint()`.

    This information is also accessible in /server/update/health, but this
    endpoint provides symmetry with POST /server/name.

    GET /server/name -> 200 OK, {'name': robot name}
    """
    return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
        data={"name": request.app[DEVICE_NAME_VARNAME]}, status=200
    )


__all__ = [
    "get_pretty_hostname",
    "set_avahi_service_name",
    "get_name_endpoint",
    "set_name_endpoint",
]
