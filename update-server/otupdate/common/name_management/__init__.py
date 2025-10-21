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

from __future__ import annotations

import json

from aiohttp import web

from .name_synchronizer import (
    NameSynchronizer,
    install_name_synchronizer,
    get_name_synchronizer,
)
from .static_hostname import set_up_static_hostname


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

    name_synchronizer = get_name_synchronizer(request)
    new_name = await name_synchronizer.set_name(new_name=name_to_set)

    return web.json_response(data={"name": new_name}, status=200)


async def get_name_endpoint(request: web.Request) -> web.Response:
    """Get the robot's name, as previously set with `set_name_endpoint()`.

    This information is also accessible in /server/update/health, but this
    endpoint provides symmetry with POST /server/name.

    GET /server/name -> 200 OK, {'name': robot name}
    """
    name_synchronizer = get_name_synchronizer(request)
    return web.json_response(
        data={"name": await name_synchronizer.get_name()}, status=200
    )


__all__ = [
    "NameSynchronizer",
    "install_name_synchronizer",
    "get_name_synchronizer",
    "set_up_static_hostname",
    "get_name_endpoint",
    "set_name_endpoint",
]
