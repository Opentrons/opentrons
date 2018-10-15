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
from collections import OrderedDict
import functools
import logging
from typing import Any, Dict, Union, List, Optional, Tuple

from opentrons import types as top_types
from opentrons.util import linal
from .simulator import Simulator
from opentrons.config import robot_configs

try:
    from .controller import Controller
except ModuleNotFoundError:
    # implies windows
    Controller = None  # type: ignore
from . import modules
from .types import Axis


mod_log = logging.getLogger(__name__)


def _log_call(func):
    @functools.wraps(func)
    def _log_call_inner(*args, **kwargs):
        args[0]._log.debug(func.__name__)
        return func(*args, **kwargs)
    return _log_call_inner


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
                 config: robot_configs.robot_config = None,
                 loop: asyncio.AbstractEventLoop = None) -> None:
        """ Initialize an API instance.

        This should rarely be explicitly invoked by an external user; instead,
        one of the factory methods build_hardware_controller or
        build_hardware_simulator should be used.
        """
        self._log = self.CLS_LOG.getChild(str(id(self)))
        self._config = config or robot_configs.load()
        self._backend = backend
        if None is loop:
            self._loop = asyncio.get_event_loop()
        else:
            self._loop = loop
        # {'X': 0.0, 'Y': 0.0, 'Z': 0.0, 'A': 0.0, 'B': 0.0, 'C': 0.0}
        self._current_position: Dict[Axis, float] = {}

        self._attached_instruments = {top_types.Mount.LEFT: None,
                                      top_types.Mount.RIGHT: None}
        self._attached_modules: Dict[str, Any] = {}

    @classmethod
    def build_hardware_controller(
            cls, config: robot_configs.robot_config = None,
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
            attached_instruments: Dict[top_types.Mount, Optional[str]] = None,
            attached_modules: List[str] = None,
            config: robot_configs.robot_config = None,
            loop: asyncio.AbstractEventLoop = None) -> 'API':
        """ Build a simulating hardware controller.

        This method may be used both on a real robot and on dev machines.
        Multiple simulating hardware controllers may be active at one time.
        """
        if None is attached_instruments:
            attached_instruments = {top_types.Mount.LEFT: None,
                                    top_types.Mount.RIGHT: None}
        if None is attached_modules:
            attached_modules = []
        return cls(Simulator(attached_instruments,
                             attached_modules,
                             config, loop),
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
        for mount in top_types.Mount:
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
    async def home_z(self, mount: top_types.Mount):
        """ Home one mount's Z-axis """
        backend_pos = self._backend.home(Axis.by_mount(mount))
        self._current_position = self._deck_from_smoothie(backend_pos)

    @_log_call
    async def home(self):
        """ Home the entire robot and initialize current position.
        """
        # Initialize/update current_position
        smoothie_pos = self._backend.home()
        self._current_position = self._deck_from_smoothie(smoothie_pos)

    def _deck_from_smoothie(
            self, smoothie_pos: Dict[str, float]) -> Dict[Axis, float]:
        """ Build a deck-abs position store from the smoothie's position

        This should take the smoothie style position {'X': float, etc}
        and turn it into the position dict used here {Axis.X: float} in
        deck-absolute coordinates. It runs the reverse deck transformation
        for the axes that require it.

        One piece of complexity is that if the gantry transformation includes
        a transition between non parallel planes, the z position of the left
        mount would depend on its actual position in deck frame, so we have
        to apply the mount offset.

        TODO: Figure out which frame the mount offset is measured in, because
              if it's measured in the deck frame (e.g. by touching off points
              on the deck) it has to go through the reverse transform to be
              added to the smoothie coordinates here.
        """
        with_enum = {Axis[k]: v for k, v in smoothie_pos.items()}
        other = {k: v for k, v in with_enum.items()
                 if k not in Axis.gantry_axes()}
        right = (with_enum[Axis.X], with_enum[Axis.Y],
                 with_enum[Axis.by_mount(top_types.Mount.RIGHT)])
        # Tell apply_transform to just do the change of base part of the
        # transform rather than the full affine transform, because this is
        # an offset
        offset_in_smoothie = linal.apply_transform(
            self.config.gantry_calibration,
            self.config.mount_offset,
            False)
        left = (with_enum[Axis.X] + offset_in_smoothie[0],
                with_enum[Axis.Y] + offset_in_smoothie[1],
                with_enum[Axis.by_mount(top_types.Mount.LEFT)]
                + offset_in_smoothie[2])
        right_deck = linal.apply_reverse(self.config.gantry_calibration,
                                         right)
        left_deck = linal.apply_reverse(self.config.gantry_calibration,
                                        left)
        deck_pos = {Axis.X: right_deck[0],
                    Axis.Y: right_deck[1],
                    Axis.by_mount(top_types.Mount.RIGHT): right_deck[2],
                    Axis.by_mount(top_types.Mount.LEFT): left_deck[2]}
        deck_pos.update(other)
        return deck_pos

    def current_position(self, mount: top_types.Mount) -> Dict[Axis, float]:
        """ Return the postion (in deck coords) of the critical point of the
        specified mount.

        This returns cached position to avoid hitting the smoothie driver
        unless ``refresh`` is ``True``.
        """
        if mount == mount.RIGHT:
            offset = top_types.Point(0, 0, 0)
        else:
            offset = top_types.Point(*self.config.mount_offset)
        z_ax = Axis.by_mount(mount)
        return {
            Axis.X: self._current_position[Axis.X] + offset[0],
            Axis.Y: self._current_position[Axis.Y] + offset[1],
            z_ax: self._current_position[z_ax] + offset[2]
        }

    @_log_call
    async def move_to(
            self, mount: top_types.Mount, abs_position: top_types.Point):
        """ Move the critical point of the specified mount to a location
        relative to the deck.

        The critical point of the mount depends on the current status of
        the mount:
        - If the mount does not have anything attached, its critical point is
          the bottom of the mount attach bracket.
        - If the mount has a pipette attached and it is not known to have a
          pipette tip, the critical point is the end of the nozzle of a single
          pipette or the end of the backmost nozzle of a multipipette
        - If the mount has a pipette attached and it is known to have a
          pipette tip, the critical point is the end of the pipette tip for
          a single pipette or the end of the tip of the backmost nozzle of a
          multipipette
        """
        if not self._current_position:
            raise MustHomeError
        z_axis = Axis.by_mount(mount)
        if mount == top_types.Mount.LEFT:
            offset = top_types.Point(*self.config.mount_offset)
        else:
            offset = top_types.Point(0, 0, 0)
        target_position = OrderedDict(
            ((Axis.X, abs_position.x - offset.x),
             (Axis.Y, abs_position.y - offset.y),
             (z_axis, abs_position.z - offset.z))
        )
        await self._move(target_position)

    @_log_call
    async def move_rel(self, mount: top_types.Mount, delta: top_types.Point):
        """ Move the critical point of the specified mount by a specified
        displacement in a specified direction.
        """
        if not self._current_position:
            raise MustHomeError
        z_axis = Axis.by_mount(mount)
        try:
            target_position = OrderedDict(
                ((Axis.X,
                  self._current_position[Axis.X] + delta.x),
                 (Axis.Y,
                  self._current_position[Axis.Y] + delta.y),
                 (z_axis,
                  self._current_position[z_axis] + delta.z))
                )
        except KeyError:
            raise MustHomeError
        await self._move(target_position)

    async def _move(self, target_position: 'OrderedDict[Axis, float]'):
        """ Worker function to apply robot motion.

        Robot motion means the kind of motions that are relevant to the robot,
        i.e. only one pipette plunger and mount move at the same time, and an
        XYZ move in the coordinate frame of one of the pipettes.

        ``target_position`` should be an ordered dict (ordered by XYZABC)
        containing any specified XY motion and at most one of a ZA or BC
        components. The frame in which to move is identified by the presence of
        (ZA) or (BC).
        """
        # Transform only the x, y, and (z or a) axes specified since this could
        # get the b or c axes as well
        to_transform = tuple((tp
                              for ax, tp in target_position.items()
                              if ax in Axis.gantry_axes()))

        # Pre-fill the dict we’ll send to the backend with the axes we don’t
        # need to transform
        smoothie_pos = {ax.name: pos for ax, pos in target_position.items()
                        if ax not in Axis.gantry_axes()}

        # We’d better have all of (x, y, (z or a)) or none of them since the
        # gantry transform requires them all
        if len(to_transform) != 3:
            self._log.error("Move derived {} axes to transform from {}"
                            .format(len(to_transform), target_position))
            raise ValueError("Moves must specify either exactly an x, y, and "
                             "(z or a) or none of them")

        # Type ignored below because linal.apply_transform (rightly) specifies
        # Tuple[float, float, float] and the implied type from
        # target_position.items() is (rightly) Tuple[float, ...] with unbounded
        # size; unfortunately, mypy can’t quite figure out the length check
        # above that makes this OK
        transformed = linal.apply_transform(  # type: ignore
            self.config.gantry_calibration, to_transform)

        # Since target_position is an OrderedDict with the axes ordered by
        # (x, y, z, a, b, c), and we’ll only have one of a or z (as checked
        # by the len(to_transform) check above) we can use an enumerate to
        # fuse the specified axes and the transformed values back together
        for idx, ax in enumerate(target_position.keys()):
            if ax in Axis.gantry_axes():
                smoothie_pos[ax.name] = transformed[idx]
        try:
            self._backend.move(smoothie_pos)
        except Exception:
            self._log.exception('Move failed')
            self._current_position.clear()
            raise
        else:
            self._current_position.update(target_position)

    # Gantry/frame (i.e. not pipette) config API
    @property
    def config(self) -> robot_configs.robot_config:
        return self._config

    async def update_deck_calibration(self, new_transform):
        pass

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

    @_log_call
    async def discover_modules(self):
        discovered = {port + model: (port, model)
                      for port, model in self._backend.get_attached_modules()}
        these = set(discovered.keys())
        known = set(self._attached_modules.keys())
        new = these - known
        gone = known - these
        for mod in gone:
            self._attached_modules.pop(mod)
        for mod in new:
            self._attached_modules[mod]\
                = self._backend.build_module(discovered[mod][0],
                                             discovered[mod][1])
        return list(self._attached_modules.values())

    @_log_call
    async def update_module(
            self, module: modules.AbstractModule,
            firmware_file: str,
            loop: asyncio.AbstractEventLoop = None) -> Tuple[bool, str]:
        """ Update a module's firmware.

        Returns (ok, message) where ok is True if the update succeeded and
        message is a human readable message.
        """
        details = (module.port, module.name())
        mod = self._attached_modules.pop(details[0] + details[1])
        try:
            new_mod = await self._backend.update_module(
                mod, firmware_file, loop)
        except modules.UpdateError as e:
            return False, e.msg
        else:
            new_details = new_mod.port + new_mod.device_info['model']
            self._attached_modules[new_details] = new_mod
            return True, 'firmware update successful'
