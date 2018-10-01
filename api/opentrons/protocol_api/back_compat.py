""" A backwards-compatibility shim for the new protocol API

"""

import importlib.util

import opentrons
import opentrons.hardware_control as hc
import protocol_api as papi
import sys

def run(protocol_bytes: bytes, context: 'papi.ProtocolContext'):
    initialize(context)
    source = importlib.util.decode_source(protocol_bytes)
    exec(source)


class BCRobot:
    def __init__(self, protocol_ctx: 'papi.ProtocolContext'):
        self._ctx = protocol_ctx


class BCOpentrons:

    def __init__(self, controller: hc.API):
        self._controller = controller
        self._robot = BCRobot()

    @property
    def __version__(self):
        return opentrons.__version__

    @property
    def robot(self):
        return self._robot

    @property
    def labware(self):
        pass

    @property
    def containers(self):
        return self.labware

    @property
    def instruments(self):
        pass

    def reset(self):
        pass

class BCInstruments:
    def __init__(self, ctx: 'papi.ProtocolContext'):
        pass

class BCLabware:
    def __init__(self, ctx: 'papi.ProtocolContext'):
        self._ctx =  ctx

    def load(self, *args, **kwargs):
        return self._ctx.load_labware_by_name(*args, **kwargs)

    def create(self,  *args, **kwargs):
        pass

    def list(self, *args, **kwargs):
        pass


def reset(api: 'papi.ProtocolContext' = None):
    global robot
    global labware
    global containers
    global instruments
    if not api:
        sim = hardware_control.API.build_hardware_simulator()
        api = pap.ProtocolContext(sim)
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

__all__ = [containers, instruments, labware, robot, reset, initialize]

