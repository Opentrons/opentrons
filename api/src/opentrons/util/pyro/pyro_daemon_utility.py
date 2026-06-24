"""Pyro related utilities for daemons and request handling."""

import logging
import socket
from typing import Any, Callable

import Pyro5
from Pyro5 import api as pyro
from Pyro5 import errors

from opentrons.util.pyro.pyro_synchronous_adapter import (
    DaemonUtility,
    PyroSynchronousObject,
)

log = logging.getLogger(__name__)


def create_pyro_daemon(pyroname: str, resource: Any, registry: Callable) -> None:  # type: ignore
    """Function to create a Pyro Daemon request loop servicing a given resource.

    Registers the resource with the NameServer at the given PyroName.
    Runs the type registry provided before creating the Pyro Daemon request loop.
    """
    log.info(f"Running Pyro type registry for {pyroname}.")
    registry()

    # Handle Pyro registration and publication of our synchronized object
    Pyro5.config.THREADPOOL_SIZE = 200  # type: ignore
    with pyro.Daemon() as daemon:  # type: ignore
        utility = DaemonUtility(daemon)
        # Create a guaranteed synchronous adapted alias to the resource
        pyro_object = PyroSynchronousObject(core_obj=resource, utility=utility)
        utility.add_PSO(pyro_object)
        try:
            with pyro.locate_ns() as ns:
                # Register our objects URI with the system nameserver
                try:
                    ns.register(pyroname, daemon.uriFor(pyro_object))
                    log.info(
                        f"Pyro5 Dameon available: pyroname={pyroname} uri={daemon.uriFor(pyro_object)}"
                    )

                    # Maintain a request loop to handle requests on our resource instance from remote processes
                    daemon.requestLoop()
                finally:
                    ns.remove(name=pyroname)
        except (errors.NamingError, errors.CommunicationError, socket.timeout):
            raise errors.CommunicationError("Opentrons Pyro5 Nameserver not found.")
        finally:
            utility.remove_PSO(pyro_object)
            daemon.close()
