"""
hardware_control: The sole authority for controlling the hardware of an OT2.

The hardware_control module presents a unified api for the lowest level of
hardware command that takes into account the robot as a whole. For instance,
it presents an API for moving a specific pipette mount (not a specific motor
or axis)  to a deck-absolute point (not a Smoothie-coordinate point).

This module is not for use outside the opentrons api module. Higher-level
functions are available elsewhere.
"""

import asyncio
import functools
import logging

from . import simulator
try:
    from . import controller
except ModuleNotFoundError:
    # implies windows
    controller = None  # type: ignore


mod_log = logging.getLogger(__name__)


def _log_call(func):
    @functools.wraps(func)
    def _log_call_inner(*args, **kwargs):
        args[0]._log.debug(func.__name__)
        return func(*args, **kwargs)
    return _log_call_inner


class API:
    """ This API is the primary interface to the hardware controller.

    Because the hardware manager controls access to the system's hardware
    as a whole, it is designed as a class of which only one should be
    instantiated at a time. This class's methods should be the only method
    of external access to the hardware. Each method may be minimal - it may
    only delegate the call to another submodule of the hardware manager -
    but its purpose is to be gathered here to provide a single interface.
    """

    CLS_LOG = mod_log.getChild('API')

    def __init__(self,
                 backend: object,
                 config: dict = None,
                 loop: asyncio.AbstractEventLoop = None) -> None:
        """ Initialize an API instance.

        This should rarely be explicitly invoked by an external user; instead,
        one of the factory methods build_hardware_controller or
        build_hardware_simulator should be used.
        """
        self._log = self.CLS_LOG.getChild(str(id(self)))
        self._backend = backend
        if None is loop:
            self._loop = asyncio.get_event_loop()
        else:
            self._loop = loop

    @classmethod
    def build_hardware_controller(
            cls, config: dict = None,
            loop: asyncio.AbstractEventLoop = None) -> 'API':
        """ Build a hardware controller that will actually talk to hardware.

        This method should not be used outside of a real robot, and on a
        real robot only one true hardware controller may be active at one
        time.
        """
        if None is controller:
            raise RuntimeError(
                'The hardware controller may only be instantiated on a robot')
        return cls(controller.Controller(config, loop),
                   config=config, loop=loop)

    @classmethod
    def build_hardware_simulator(
            cls, config: dict = None,
            loop: asyncio.AbstractEventLoop = None) -> 'API':
        """ Build a simulating hardware controller.

        This method may be used both on a real robot and on dev machines.
        Multiple simulating hardware controllers may be active at one time.
        """
        return cls(simulator.Simulator(config, loop),
                   config=config, loop=loop)

    # Query API
    @_log_call
    def get_connected_hardware(self):
        """ Get the cached hardware connected to the robot.
        """
        pass

    # Incidentals (i.e. not motion) API
    @_log_call
    async def turn_on_button_light(self):
        pass

    @_log_call
    async def turn_off_button_light(self):
        pass

    @_log_call
    async def turn_on_rail_lights(self):
        pass

    @_log_call
    async def turn_off_rail_lights(self):
        pass

    @_log_call
    async def identify(self, seconds):
        pass

    @_log_call
    async def cache_instrument_models(self):
        pass

    @_log_call
    async def update_smoothie_firmware(self, firmware_file):
        pass

    # Global actions API
    @_log_call
    async def pause(self):
        pass

    @_log_call
    async def resume(self):
        pass

    @_log_call
    async def halt(self):
        pass

    # Gantry/frame (i.e. not pipette) action API
    @_log_call
    async def home(self, *args, **kwargs):
        pass

    @_log_call
    async def home_z(self):
        pass

    @_log_call
    async def move_to(self, mount, position=None, position_rel=None):
        pass

    # Gantry/frame (i.e. not pipette) config API
    @_log_call
    async def head_speed(self, combined_speed=None,
                         x=None, y=None, z=None, a=None, b=None, c=None):
        pass

    # Pipette action API
    @_log_call
    async def aspirate(self, mount, volume=None, rate=None):
        pass

    @_log_call
    async def dispense(self, mount, volume=None, rate=None):
        pass

    @_log_call
    async def blow_out(self, mount):
        pass

    @_log_call
    async def air_gap(self, mount, volume=None):
        pass

    @_log_call
    async def pick_up_tip(self, mount, tip_length):
        pass

    @_log_call
    async def drop_tip(self, mount):
        pass

    # Pipette config api
    @_log_call
    async def calibrate_plunger(
            self, mount, top=None, bottom=None, blow_out=None, drop_tip=None):
        pass

    @_log_call
    async def set_flow_rate(self, mount, aspirate=None, dispense=None):
        pass

    @_log_call
    async def set_pick_up_current(self, mount, amperes):
        pass
