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
import enum
from typing import Dict, Union
from opentrons import types
from .simulator import Simulator
try:
    from .controller import Controller
except ModuleNotFoundError:
    # implies windows
    Controller = None  # type: ignore


mod_log = logging.getLogger(__name__)


def _log_call(func):
    @functools.wraps(func)
    def _log_call_inner(*args, **kwargs):
        args[0]._log.debug(func.__name__)
        return func(*args, **kwargs)
    return _log_call_inner


class _Axis(enum.Enum):
    X = enum.auto()
    Y = enum.auto()
    Z = enum.auto()
    A = enum.auto()

    @classmethod
    def by_mount(cls, mount):
        bm = {types.Mount.LEFT: cls.Z, types.Mount.RIGHT: cls.A}
        return bm[mount]


class MustHomeError(RuntimeError):
    pass


_Backend = Union[Controller, Simulator]


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
                 backend: _Backend,
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
        # {'X': 0.0, 'Y': 0.0, 'Z': 0.0, 'A': 0.0, 'B': 0.0, 'C': 0.0}
        self._current_position: Dict[str, float] = {}

        self._attached_instruments = {types.Mount.LEFT: None,
                                      types.Mount.RIGHT: None}

    @classmethod
    def build_hardware_controller(
            cls, config: dict = None,
            loop: asyncio.AbstractEventLoop = None) -> 'API':
        """ Build a hardware controller that will actually talk to hardware.

        This method should not be used outside of a real robot, and on a
        real robot only one true hardware controller may be active at one
        time.
        """
        if None is Controller:
            raise RuntimeError(
                'The hardware controller may only be instantiated on a robot')
        return cls(Controller(config, loop),
                   config=config, loop=loop)

    @classmethod
    def build_hardware_simulator(
            cls,
            attached_instruments,
            config: dict = None,
            loop: asyncio.AbstractEventLoop = None) -> 'API':
        """ Build a simulating hardware controller.

        This method may be used both on a real robot and on dev machines.
        Multiple simulating hardware controllers may be active at one time.
        """
        return cls(Simulator(attached_instruments, config, loop),
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
        self._log.info("Updating instrument model cache")
        for mount in types.Mount:
            self._attached_instruments[mount] = \
                self._backend.get_attached_instruments(mount)

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
        # Initialize/update current_position
        self._current_position = self._backend.home()

    @_log_call
    async def home_z(self):
        pass

    @_log_call
    async def move_to(
            self, mount: types.Mount, abs_position: types.Point):
        if not self._current_position:
            raise MustHomeError
        z_axis = _Axis.by_mount(mount)
        try:
            target_position = {_Axis.X.name: abs_position.x,
                               _Axis.Y.name: abs_position.y,
                               z_axis.name: abs_position.z}
        except KeyError:
            raise MustHomeError
        await self._move(target_position)

    @_log_call
    async def move_rel(self, mount: types.Mount, delta: types.Point):
        if not self._current_position:
            raise MustHomeError
        z_axis = _Axis.by_mount(mount)
        try:
            target_position = \
                {_Axis.X.name: self._current_position[_Axis.X.name] + delta.x,
                 _Axis.Y.name: self._current_position[_Axis.Y.name] + delta.y,
                 z_axis.name: self._current_position[z_axis.name] + delta.z}
        except KeyError:
            raise MustHomeError
        await self._move(target_position)

    async def _move(self, target_position: Dict[str, float]):
        self._current_position.update(target_position)
        try:
            self._backend.move(target_position)
        except Exception:
            self._log.exception('Move failed')
            self._current_position.clear()
            raise

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
