""" A backwards-compatibility shim for the new protocol API

"""

import importlib.util

from typing import TYPE_CHECKING

import opentrons

if TYPE_CHECKING:
    import opentrons.protocol_api as papi # noqa(F401) - used in func sigs


def run(protocol_bytes: bytes, context: 'papi.ProtocolContext'):
    reset(context)
    source = importlib.util.decode_source(protocol_bytes)
    exec(source)


class BCRobot:
    def __init__(self, protocol_ctx: 'papi.ProtocolContext') -> None:
        self._ctx = protocol_ctx


class BCInstruments:
    def __init__(self, ctx: 'papi.ProtocolContext') -> None:
        pass


class BCLabware:
    def __init__(self, ctx: 'papi.ProtocolContext') -> None:
        self._ctx = ctx

    def load(self, *args, **kwargs):
        return self._ctx.load_labware_by_name(*args, **kwargs)

    def create(self,  *args, **kwargs):
        pass

    def list(self, *args, **kwargs):
        pass


class BCModules:
    def __init__(self, ctx: 'papi.ProtocolContext') -> None:
        self._ctx = ctx

    def load(self, *args, **wargs):
        pass


def reset(api: 'papi.ProtocolContext'):
    global robot
    global labware
    global containers
    global instruments
    robot = BCRobot(api)
    labware = BCLabware(api)
    containers = labware
    instruments = BCInstruments(api)
    return robot


__version__ = opentrons.__version__
robot = None
labware = None
containers = None
instruments = None

__all__ = ['containers', 'instruments', 'labware', 'robot', 'reset']
