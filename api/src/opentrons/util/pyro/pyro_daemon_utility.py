"""Pyro related utilities for daemons and request handling."""

import logging
import socket
from typing import Any, Callable

from Pyro5 import api as pyro
from Pyro5 import errors

from opentrons.util.pyro.pyro_synchronous_adapter import PyroSynchronousObject

log = logging.getLogger(__name__)

PYRO_TIMEOUT = 100


def create_pyro_daemon(pyroname: str, resource: Any, registry: Callable) -> None:  # type: ignore
    """Function to create a Pyro Daemon request loop servicing a given resource.

    Registers the resource with the NameServer at the given PyroName.
    Runs the type registry provided before creating the Pyro Daemon request loop.
    """
    log.info(f"Running Pyro type registry for {pyroname}.")
    registry()

    # Create a guaranteed synchronous adapted alias to the resource
    pyro_object = PyroSynchronousObject(resource)

    # Handle Pyro registration and publication of our synchronized object
    pyro.config.COMMTIMEOUT = PYRO_TIMEOUT
    with pyro.Daemon() as daemon:  # type: ignore
        pyro_uri = daemon.register(pyro_object)

        # Find the currently running nameserver
        try:
            with pyro.locate_ns() as ns:
                # Register our objects URI with the system nameserver
                ns.register(pyroname, pyro_uri)

            log.info(f"Pyro5 Dameon available: pyroname={pyroname} uri={pyro_uri}")

            # Maintain a request loop to handle requests on our resource instance from remote processes
            daemon.requestLoop()
        except (errors.NamingError, errors.CommunicationError, socket.timeout):
            raise errors.CommunicationError(
                f"Opentrons Pyro5 Nameserver not found within {PYRO_TIMEOUT} seconds."
            )
