"""Pyro related utilities for daemons and request handling."""
import Pyro5.api as pyro
from typing import Callable, Type
from opentrons.util.pyro_synchronous_adapter import PyroSynchronousObject



def create_pyro_daemon(pyroname: str, resource: Type, registry: Callable):
    """Function to create a Pyro Daemon request loop servicing a given resource.
    Registers the resource with the NameServer at the given PyroName.
    Runs the type registry provided before creating the Pyro Daemon request loop.
    """
    print(f"Running Pyro type registry for {pyroname}.")
    registry()

    # Create a gauranteed synchronous adapted alias to the resource
    pyro_object = PyroSynchronousObject(resource)

    # Handle Pyro registration and publication of our synchronized oobject
    with pyro.Daemon() as daemon:
        pyro_uri = daemon.register(pyro_object)

        # Find the currently running nameserver (requires running pyro5-ns)
        with pyro.locate_ns() as ns:
            # Register our objects URI with the system nameserver
            ns.register(pyroname, pyro_uri)
            
        print(f"{pyroname} Pyro5 Dameon available: uri={pyro_uri}")

        # Maintain a request loop to handle requests on our resource instance from remote processes
        daemon.requestLoop()

