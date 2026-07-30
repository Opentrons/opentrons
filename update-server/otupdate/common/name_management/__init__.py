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
from typing import Annotated

import fastapi
from pydantic import BaseModel

from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope

from ..api_error import APIError, MessageBody
from .name_synchronizer import (
    NameSynchronizer,
    get_name_synchronizer,
    install_name_synchronizer,
)
from .static_hostname import set_up_static_hostname

router = fastapi.APIRouter()


class NameResponse(BaseModel):
    """The robot's current human-readable name."""

    name: str


def _bad_request(message: str) -> APIError:
    return APIError(400, MessageBody(message=message))


@router.post(
    "/server/name",
    summary="Set the robot's name.",
    dependencies=[fastapi.Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE))],
)
async def set_name_endpoint(
    request: fastapi.Request,
    name_synchronizer: Annotated[
        NameSynchronizer, fastapi.Depends(get_name_synchronizer)
    ],
) -> NameResponse:
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
    try:
        body = await request.json()
    except json.JSONDecodeError as exception:
        # stringifying a JSONDecodeError will include an error summary and location,
        # e.g. "Expecting value: line 1 column 1 (char 0)"
        raise _bad_request(str(exception)) from exception

    try:
        name_to_set = body["name"]
    except KeyError as exception:
        raise _bad_request('Body has no "name" key') from exception

    if not isinstance(name_to_set, str):
        raise _bad_request('"name" key is not a string"')

    new_name = await name_synchronizer.set_name(new_name=name_to_set)

    return NameResponse(name=new_name)


@router.get("/server/name", summary="Get the robot's name.")
async def get_name_endpoint(
    name_synchronizer: Annotated[
        NameSynchronizer, fastapi.Depends(get_name_synchronizer)
    ],
) -> NameResponse:
    """Get the robot's name, as previously set with `set_name_endpoint()`.

    This information is also accessible in /server/update/health, but this
    endpoint provides symmetry with POST /server/name.

    GET /server/name -> 200 OK, {'name': robot name}
    """
    return NameResponse(name=await name_synchronizer.get_name())


__all__ = [
    "NameSynchronizer",
    "install_name_synchronizer",
    "get_name_synchronizer",
    "set_up_static_hostname",
    "get_name_endpoint",
    "set_name_endpoint",
    "router",
]
