"""Pyro related utilities for daemons and request handling."""

from typing import Any, Callable

import Pyro5.api as pyro

from opentrons.util.pyro_synchronous_adapter import PyroSynchronousObject


def create_pyro_daemon(pyroname: str, resource: Any, registry: Callable) -> None:  # type: ignore
    """Function to create a Pyro Daemon request loop servicing a given resource.
    Registers the resource with the NameServer at the given PyroName.
    Runs the type registry provided before creating the Pyro Daemon request loop.
    """
    print(f"Running Pyro type registry for {pyroname}.")
    registry()

    # Create a guaranteed synchronous adapted alias to the resource
    pyro_object = PyroSynchronousObject(resource)

    # Handle Pyro registration and publication of our synchronized object
    with pyro.Daemon() as daemon:
        pyro_uri = daemon.register(pyro_object)

        # Find the currently running nameserver
        # todo(chb, 2026-02-18): Need error handling if the namerserver is not present
        with pyro.locate_ns() as ns:
            # Register our objects URI with the system nameserver
            ns.register(pyroname, pyro_uri)

        print(f"{pyroname} Pyro5 Dameon available: uri={pyro_uri}")

        # Maintain a request loop to handle requests on our resource instance from remote processes
        daemon.requestLoop()
