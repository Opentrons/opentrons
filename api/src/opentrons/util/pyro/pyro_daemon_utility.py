"""Pyro related utilities for daemons and request handling."""

import logging
import socket
from typing import Any, Callable, Generator

import Pyro5
from Pyro5 import api as pyro
from Pyro5 import errors

from opentrons.util.pyro.pyro_synchronous_adapter import (
    DaemonUtility,
    PyroSynchronousObject,
)

log = logging.getLogger(__name__)


def create_pyro_daemon_with_monitored_start(
    pyroname: str,
    resource: Any,
    registry: Callable,  # type: ignore
    broadcast_mode: bool = False,
) -> Generator[None, None, None]:
    """As create_pyro_daemon, but yields immediately before the call to requestLoop().

    A caller can run next() once, call this done for the purposes of status monitoring,
    and then call next() again to finish.
    """
    log.info(f"Running Pyro type registry for {pyroname}.")
    registry()

    # Handle Pyro registration and publication of our synchronized object
    Pyro5.config.THREADPOOL_SIZE = 512  # type: ignore
    with pyro.Daemon() as daemon:  # type: ignore
        utility = DaemonUtility(daemon)
        # Create a guaranteed synchronous adapted alias to the resource
        pyro_object = PyroSynchronousObject(core_obj=resource, utility=utility)
        utility.add_PSO(pyro_object)
        try:
            with pyro.locate_ns(broadcast=broadcast_mode) as ns:
                # Register our objects URI with the system nameserver
                try:
                    ns.register(pyroname, daemon.uriFor(pyro_object))
                    log.info(
                        f"Pyro5 Daemon available: pyroname={pyroname} uri={daemon.uriFor(pyro_object)}"
                    )
                    yield
                    # Maintain a request loop to handle requests on our resource instance from remote processes
                    daemon.requestLoop()
                finally:
                    ns.remove(name=pyroname)
        except (errors.NamingError, errors.CommunicationError, socket.timeout):
            raise errors.CommunicationError("Opentrons Pyro5 Nameserver not found.")
        finally:
            utility.remove_PSO(pyro_object)
            daemon.close()


def create_pyro_daemon(
    pyroname: str,
    resource: Any,
    registry: Callable,  # type: ignore
    broadcast_mode: bool = False,
) -> None:
    """Function to create a Pyro Daemon request loop servicing a given resource.

    Registers the resource with the NameServer at the given PyroName.
    Runs the type registry provided before creating the Pyro Daemon request loop.
    """
    daemon_gen = create_pyro_daemon_with_monitored_start(
        pyroname, resource, registry, broadcast_mode=broadcast_mode
    )
    next(daemon_gen)
    for _ in daemon_gen:
        pass
