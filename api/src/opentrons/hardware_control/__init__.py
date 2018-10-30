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
from .pipette import Pipette
try:
    from .controller import Controller
except ModuleNotFoundError:
    # implies windows
    Controller = None  # type: ignore
from . import modules
from .types import Axis


mod_log = logging.getLogger(__name__)
PICK_UP_SPEED = 30


def _log_call(func):
    @functools.wraps(func)
    def _log_call_inner(*args, **kwargs):
        args[0]._log.debug(func.__name__)
        return func(*args, **kwargs)
    return _log_call_inner


class MustHomeError(RuntimeError):
    pass


class PipetteNotAttachedError(KeyError):
    pass


_Backend = Union[Controller, Simulator]
Instruments = Dict[top_types.Mount, Optional[Pipette]]
SHAKE_OFF_TIPS_SPEED = 50
SHAKE_OFF_TIPS_DISTANCE = 2.25
DROP_TIP_RELEASE_DISTANCE = 20


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

        self._attached_instruments: Instruments = {
            top_types.Mount.LEFT: None,
            top_types.Mount.RIGHT: None
        }
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
        backend = Controller(config, loop)
        backend._connect()
        return cls(backend, config=config, loop=loop)

    @classmethod
    def build_hardware_simulator(
            cls,
            attached_instruments: Dict[top_types.Mount, Dict[str, Optional[str]]] = None,  # noqa E501
            attached_modules: List[str] = None,
            config: robot_configs.robot_config = None,
            loop: asyncio.AbstractEventLoop = None) -> 'API':
        """ Build a simulating hardware controller.

        This method may be used both on a real robot and on dev machines.
        Multiple simulating hardware controllers may be active at one time.
        """
        if None is attached_instruments:
            attached_instruments = {}

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
    async def cache_instruments(self,
                                require: Dict[top_types.Mount, str] = None):
        """
         - Get the attached instrument on each mount and
         - Cache their pipette configs from pipette-config.json

        If specified, the require element should be a dict of mounts to
        instrument models describing the instruments expected to be present.
        This can save a subsequent of :py:attr:`attached_instruments` and also
        serves as the hook for the hardware simulator to decide what is
        attached.
        """
        checked_require = require or {}
        self._log.info("Updating instrument model cache")
        found = self._backend.get_attached_instruments(checked_require)
        for mount, instrument_data in found.items():
            model = instrument_data.get('model')
            if model is not None:
                p = Pipette(model, instrument_data['id'])
                self._attached_instruments[mount] = p
            else:
                self._attached_instruments[mount] = None
        mod_log.info("Instruments found: {}".format(
            self._attached_instruments))

    @property
    def attached_instruments(self):
        configs = ['name', 'min_volume', 'max_volume',
                   'aspirate_flow_rate', 'dispense_flow_rate',
                   'pipette_id']
        instruments = {top_types.Mount.LEFT: {},
                       top_types.Mount.RIGHT: {}}
        for mount in top_types.Mount:
            instr = self._attached_instruments[mount]
            if not instr:
                continue
            instr_dict = instr.as_dict()
            for key in configs:
                instruments[mount][key] = instr_dict[key]
        return instruments

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

    @_log_call
    async def reset(self):
        pass

    # Gantry/frame (i.e. not pipette) action API
    @_log_call
    async def home_z(self):
        """ Home the two z-axes """
        await self.home([Axis.Z, Axis.A])

    @_log_call
    async def home(self, axes: List[Axis] = None):
        """ Home the entire robot and initialize current position.
        :param axes: A list of axes to home. Default is `None`, which will
                     home everything.
        """
        # Initialize/update current_position
        checked_axes = axes or [ax for ax in Axis]
        smoothie_axes = [ax.name.upper() for ax in checked_axes]
        smoothie_pos = self._backend.home(smoothie_axes)
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
        plunger_axes = {k: v for k, v in with_enum.items()
                        if k not in Axis.gantry_axes()}
        right = (with_enum[Axis.X], with_enum[Axis.Y],
                 with_enum[Axis.by_mount(top_types.Mount.RIGHT)])
        # Tell apply_transform to just do the change of base part of the
        # transform rather than the full affine transform, because this is
        # an offset
        left = (with_enum[Axis.X],
                with_enum[Axis.Y],
                with_enum[Axis.by_mount(top_types.Mount.LEFT)])
        right_deck = linal.apply_reverse(self.config.gantry_calibration,
                                         right)
        left_deck = linal.apply_reverse(self.config.gantry_calibration,
                                        left)
        deck_pos = {Axis.X: right_deck[0],
                    Axis.Y: right_deck[1],
                    Axis.by_mount(top_types.Mount.RIGHT): right_deck[2],
                    Axis.by_mount(top_types.Mount.LEFT): left_deck[2]}
        deck_pos.update(plunger_axes)
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
        plunger_ax = Axis.of_plunger(mount)
        cp = self._critical_point_for(mount)
        return {
            Axis.X: self._current_position[Axis.X] + offset[0] + cp.x,
            Axis.Y: self._current_position[Axis.Y] + offset[1] + cp.y,
            z_ax: self._current_position[z_ax] + offset[2] + cp.z,
            plunger_ax: self._current_position[plunger_ax]
        }

    @_log_call
    async def move_to(
            self, mount: top_types.Mount, abs_position: top_types.Point,
            speed: float = None):
        """ Move the critical point of the specified mount to a location
        relative to the deck, at the specified speed. 'speed' sets the speed
        of all robot axes to the given value. So, if multiple axes are to be
        moved, they will do so at the same speed

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
        cp = self._critical_point_for(mount)
        target_position = OrderedDict(
            ((Axis.X, abs_position.x - offset.x - cp.x),
             (Axis.Y, abs_position.y - offset.y - cp.y),
             (z_axis, abs_position.z - offset.z - cp.z))
        )
        await self._move(target_position, speed=speed)

    @_log_call
    async def move_rel(self, mount: top_types.Mount, delta: top_types.Point,
                       speed: float = None):
        """ Move the critical point of the specified mount by a specified
        displacement in a specified direction, at the specified speed.
        'speed' sets the speed of all axes to the given value. So, if multiple
        axes are to be moved, they will do so at the same speed
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
        await self._move(target_position, speed=speed)

    async def _move_plunger(self, mount: top_types.Mount, dist: float,
                            speed: float = None):
        z_axis = Axis.by_mount(mount)
        pl_axis = Axis.of_plunger(mount)
        all_axes_pos = OrderedDict(
            ((Axis.X,
              self._current_position[Axis.X]),
             (Axis.Y,
              self._current_position[Axis.Y]),
             (z_axis,
              self._current_position[z_axis]),
             (pl_axis, dist))
        )
        try:
            await self._move(all_axes_pos, speed)
        except KeyError:
            raise MustHomeError

    async def _move(self, target_position: 'OrderedDict[Axis, float]',
                    speed: float = None):
        """ Worker function to apply robot motion.

        Robot motion means the kind of motions that are relevant to the robot,
        i.e. only one pipette plunger and mount move at the same time, and an
        XYZ move in the coordinate frame of one of the pipettes.

        ``target_position`` should be an ordered dict (ordered by XYZABC)
        of deck calibrated values, containing any specified XY motion and
        at most one of a ZA or BC components. The frame in which to move
        is identified by the presence of (ZA) or (BC).
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
            self._backend.move(smoothie_pos, speed=speed)
        except Exception:
            self._log.exception('Move failed')
            self._current_position.clear()
            raise
        else:
            self._current_position.update(target_position)

    @_log_call
    async def retract(self, mount: top_types.Mount, margin: float):
        """ Pull the specified mount up to its home position.

        Works regardless of critical point or home status.
        """
        smoothie_ax = Axis.by_mount(mount).name.upper()
        smoothie_pos = self._backend.fast_home(smoothie_ax, margin)
        self._current_position = self._deck_from_smoothie(smoothie_pos)

    def _critical_point_for(self, mount: top_types.Mount) -> top_types.Point:
        """ Return the current critical point of the specified mount.

        The mount's critical point is the position of the mount itself, if no
        pipette is attached, or the pipette's critical point (which depends on
        tip status).
        """
        pip = self._attached_instruments[mount]
        if pip is not None:
            return pip.critical_point
        else:
            # TODO: The smoothie’s z/a home position is calculated to provide
            # the offset for a P300 single. Here we should decide whether we
            # implicitly accept this as correct (by returning a null offset)
            # or not (by returning an offset calculated to move back up the
            # length of the P300 single).
            return top_types.Point(0, 0, 0)

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
    async def aspirate(self, mount: top_types.Mount, volume: float = None,
                       rate: float = 1.0):
        """
        Aspirate a volume of liquid (in microliters/uL) using this pipette
        from the *current location*. If no volume is passed, `aspirate` will
        default to max available volume (after taking into account the volume
        already present in the tip).

        mount : Mount.LEFT or Mount.RIGHT
        volume : [float] The number of microliters to aspirate
        rate : [float] Set plunger speed for this aspirate, where
            speed = rate * aspirate_speed
        """
        this_pipette = self._attached_instruments[mount]
        if not this_pipette:
            raise PipetteNotAttachedError("No pipette attached to {} mount"
                                          .format(mount.name))
        if volume is None:
            asp_vol = this_pipette.available_volume
            mod_log.debug(
                "No aspirate volume defined. Aspirating up to pipette "
                "max_volume ({}uL)".format(this_pipette.config.max_volume))
        else:
            asp_vol = volume

        assert this_pipette.ok_to_add_volume(asp_vol), \
            "Cannot aspirate more than pipette max volume"
        if asp_vol == 0:
            return

        self._backend.set_active_current(
             Axis.of_plunger(mount), this_pipette.config.plunger_current)
        dist = self._plunger_position(
                this_pipette,
                this_pipette.current_volume + asp_vol,
                'aspirate')
        speed = this_pipette.config.aspirate_flow_rate * rate
        try:
            await self._move_plunger(mount, dist, speed=speed)
        except Exception:
            self._log.exception('Aspirate failed')
            this_pipette.set_current_volume(0)
            raise
        else:
            this_pipette.add_current_volume(asp_vol)

    @_log_call
    async def dispense(self, mount: top_types.Mount, volume: float = None,
                       rate: float = 1.0):
        """
        Dispense a volume of liquid in microliters(uL) using this pipette
        at the current location. If no volume is specified, `dispense` will
        dispense all volume currently present in pipette

        mount : Mount.LEFT or Mount.RIGHT
        volume : [float] The number of microliters to dispense
        rate : [float] Set plunger speed for this dispense, where
            speed = rate * dispense_speed
        """
        this_pipette = self._attached_instruments[mount]
        if not this_pipette:
            raise PipetteNotAttachedError("No pipette attached to {} mount"
                                          .format(mount.name))
        if volume is None:
            disp_vol = this_pipette.current_volume
            mod_log.debug("No dispense volume specified. Dispensing all "
                          "remaining liquid ({}uL) from pipette".format
                          (disp_vol))
        else:
            disp_vol = volume
        # Ensure we don't dispense more than the current volume
        disp_vol = min(this_pipette.current_volume, disp_vol)

        if disp_vol == 0:
            return

        self._backend.set_active_current(
            Axis.of_plunger(mount), this_pipette.config.plunger_current)
        dist = self._plunger_position(
                this_pipette,
                this_pipette.current_volume - disp_vol,
                'dispense')
        speed = this_pipette.config.dispense_flow_rate * rate
        try:
            await self._move_plunger(mount, dist, speed)
        except Exception:
            self._log.exception('Dispense failed')
            this_pipette.set_current_volume(0)
            raise
        else:
            this_pipette.remove_current_volume(disp_vol)

    def _plunger_position(self, instr: Pipette, ul: float,
                          action: str) -> float:
        mm = ul / instr.ul_per_mm(ul, action)
        position = mm + instr.config.plunger_positions['bottom']
        return round(position, 6)

    @_log_call
    async def blow_out(self, mount):
        """
        Force any remaining liquid to dispense. The liquid will be dispensed at
        the current location of pipette
        """
        this_pipette = self._attached_instruments[mount]
        if not this_pipette:
            raise PipetteNotAttachedError("No pipette attached to {} mount"
                                          .format(mount.name))

        self._backend.set_active_current(Axis.of_plunger(mount),
                                         this_pipette.config.plunger_current)
        try:
            await self._move_plunger(
                mount, this_pipette.config.plunger_positions['blow_out'])
        except Exception:
            self._log.exception('Blow out failed')
            raise
        finally:
            this_pipette.set_current_volume(0)

    @_log_call
    async def pick_up_tip(self, mount, presses: int = 3, increment: float = 1):
        """
        Pick up tip from current location
        """
        instr = self._attached_instruments[mount]
        assert instr
        assert not instr.has_tip, 'Tip already attached'
        instr_ax = Axis.by_mount(mount)
        plunger_ax = Axis.of_plunger(mount)
        self._log.info('Picking up tip on {}'.format(instr.name))
        # Initialize plunger to bottom position
        self._backend.set_active_current(plunger_ax,
                                         instr.config.plunger_current)
        await self._move_plunger(
            mount, instr.config.plunger_positions['bottom'])

        # Press the nozzle into the tip <presses> number of times,
        # moving further by <increment> mm after each press
        for i in range(presses):
            # move nozzle down into the tip
            with self._backend.save_current():
                self._backend.set_active_current(instr_ax,
                                                 instr.config.pick_up_current)
                dist = -1 * instr.config.pick_up_distance + -1 * increment * i
                target_pos = top_types.Point(0, 0, dist)
                await self.move_rel(mount, target_pos, PICK_UP_SPEED)
            # move nozzle back up
            backup_pos = top_types.Point(0, 0, -dist)
            await self.move_rel(mount, backup_pos)
        instr.add_tip()
        instr.set_current_volume(0)

        # neighboring tips tend to get stuck in the space between
        # the volume chamber and the drop-tip sleeve on p1000.
        # This extra shake ensures those tips are removed
        if 'needs-pickup-shake' in instr.config.quirks:
            await self._shake_off_tips(mount)
            await self._shake_off_tips(mount)

        await self.retract(mount, instr.config.pick_up_distance)

    @_log_call
    async def drop_tip(self, mount):
        """
        Drop tip at the current location
        """
        instr = self._attached_instruments[mount]
        assert instr
        assert instr.has_tip, 'Cannot drop tip without a tip attached'
        self._log.info("Dropping tip off from {}".format(instr.name))
        plunger_ax = Axis.of_plunger(mount)
        self._backend.set_active_current(plunger_ax,
                                         instr.config.plunger_current)
        await self._move_plunger(mount,
                                 instr.config.plunger_positions['bottom'])
        self._backend.set_active_current(plunger_ax,
                                         instr.config.drop_tip_current)
        await self._move_plunger(mount,
                                 instr.config.plunger_positions['drop_tip'])
        await self._shake_off_tips(mount)
        await self._home_plunger_after_drop_tip(mount)
        instr.set_current_volume(0)
        instr.remove_tip()

    async def _shake_off_tips(self, mount):
        # tips don't always fall off, especially if resting against
        # tiprack or other tips below it. To ensure the tip has fallen
        # first, shake the pipette to dislodge partially-sealed tips,
        # then second, raise the pipette so loosened tips have room to fall
        shake_off_dist = SHAKE_OFF_TIPS_DISTANCE
        # TODO: ensure the distance is not >25% the diameter of placeable
        shake_pos = top_types.Point(-shake_off_dist, 0, 0)  # move left
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        shake_pos = top_types.Point(2*shake_off_dist, 0, 0)    # move right
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        shake_pos = top_types.Point(-shake_off_dist, 0, 0)  # original position
        await self.move_rel(mount, shake_pos, speed=SHAKE_OFF_TIPS_SPEED)
        # raise the pipette upwards so we are sure tip has fallen off
        up_pos = top_types.Point(0, 0, DROP_TIP_RELEASE_DISTANCE)
        await self.move_rel(mount, up_pos)

    async def _home_plunger_after_drop_tip(self, mount):
        # incase plunger motor stalled while dropping a tip, add a
        # safety margin of the distance between `bottom` and `drop_tip`
        instr = self._attached_instruments[mount]
        b = instr.config.plunger_positions['bottom']
        d = instr.config.plunger_positions['drop_tip']
        safety_margin = abs(b-d)
        self._backend.set_active_current(Axis.of_plunger(mount),
                                         instr.config.plunger_current)
        await self._move_plunger(mount, safety_margin)
        await self.home([Axis.of_plunger(mount)])
        await self._move_plunger(mount,
                                 instr.config.plunger_positions['bottom'])

    # Pipette config api
    @_log_call
    def calibrate_plunger(self,
                          mount: top_types.Mount,
                          top: float = None, bottom: float = None,
                          blow_out: float = None, drop_tip: float = None):
        """
        Set calibration values for the pipette plunger.
        This can be called multiple times as the user sets each value,
        or you can set them all at once.
        :param top: Touching but not engaging the plunger.
        :param bottom: Must be above the pipette's physical hard-stop, while
        still leaving enough room for 'blow_out'
        :param blow_out: Plunger is pushed down enough to expel all liquids.
        :param drop_tip: Position that causes the tip to be released from the
        pipette
        """
        instr = self._attached_instruments[mount]
        if not instr:
            raise PipetteNotAttachedError("No pipette attached to {} mount"
                                          .format(mount.name))

        pos_dict: Dict = instr.config.plunger_positions
        if top is not None:
            pos_dict['top'] = top
        if bottom is not None:
            pos_dict['bottom'] = bottom
        if blow_out is not None:
            pos_dict['blow_out'] = blow_out
        if bottom is not None:
            pos_dict['drop_tip'] = drop_tip
        instr.update_config_item('plunger_positions', pos_dict)

    @_log_call
    def set_flow_rate(self, mount, aspirate=None, dispense=None):
        this_pipette = self._attached_instruments[mount]
        if not this_pipette:
            raise PipetteNotAttachedError("No pipette attached to {} mount"
                                          .format(mount))
        if aspirate:
            this_pipette.update_config_item('aspirate_flow_rate', aspirate)
        if dispense:
            this_pipette.update_config_item('dispense_float_rate', dispense)

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
