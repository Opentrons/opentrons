import asyncio
import contextlib
from functools import partial, lru_cache
from dataclasses import replace
import logging
from collections import OrderedDict
from typing import (
    Callable,
    Dict,
    Union,
    List,
    Optional,
    Tuple,
    Sequence,
    Set,
)


from opentrons_shared_data.pipette import name_config
from opentrons import types as top_types
from opentrons.config import robot_configs
from opentrons.config.types import RobotConfig, OT3Config, PipetteKind
from .backends.ot3utils import get_system_constraints

try:
    from opentrons_hardware.hardware_control.motion_planning import (
        MoveManager,
        MoveTarget,
        Coordinates,
        ZeroLengthMoveError,
    )
except ModuleNotFoundError:
    pass

from .util import use_or_initialize_loop, check_motion_bounds
from .pipette import (
    Pipette,
    generate_hardware_configs_ot3,
    load_from_config_and_check_skip,
)
from .backends import OT3Controller, OT3Simulator
from .execution_manager import ExecutionManagerProvider
from .pause_manager import PauseManager
from .module_control import AttachedModulesControl
from .util import DeckTransformState
from .types import (
    Axis,
    CriticalPoint,
    MustHomeError,
    DoorState,
    DoorStateNotification,
    ErrorMessageNotification,
    HardwareEventHandler,
    HardwareAction,
    MotionChecks,
    PauseType,
)
from . import modules
from .robot_calibration import (
    load_pipette_offset,
    OT3Transforms,
    RobotCalibration,
    build_ot3_transforms,
)


from .protocols import HardwareControlAPI
from .instrument_handler import InstrumentHandlerProvider
from .motion_utilities import (
    target_position_from_absolute,
    target_position_from_relative,
    target_position_from_plunger,
    offset_for_mount,
    deck_from_machine,
    machine_from_deck,
)

from opentrons_shared_data.pipette.dev_types import UlPerMmAction, PipetteName


mod_log = logging.getLogger(__name__)


InstrumentsByMount = Dict[top_types.Mount, Optional[Pipette]]
PipetteHandlingData = Tuple[Pipette, top_types.Mount]


class OT3API(
    ExecutionManagerProvider,
    InstrumentHandlerProvider,
    # This MUST be kept last in the inheritance list so that it is
    # deprioritized in the method resolution order; otherwise, invocations
    # of methods that are present in the protocol will call the (empty,
    # do-nothing) methods in the protocol. This will happily make all the
    # tests fail.
    HardwareControlAPI,
):
    """This API is the primary interface to the hardware controller.

    Because the hardware manager controls access to the system's hardware
    as a whole, it is designed as a class of which only one should be
    instantiated at a time. This class's methods should be the only method
    of external access to the hardware. Each method may be minimal - it may
    only delegate the call to another submodule of the hardware manager -
    but its purpose is to be gathered here to provide a single interface.

    This implements the protocols in opentrons.hardware_control.protocols,
    and longer method docstrings may be found there. Docstrings for the
    methods in this class only note where their behavior is different or
    extended from that described in the protocol.
    """

    CLS_LOG = mod_log.getChild("OT3API")

    def __init__(
        self,
        backend: Union[OT3Simulator, OT3Controller],
        loop: asyncio.AbstractEventLoop,
        config: OT3Config,
    ) -> None:
        """Initialize an API instance.

        This should rarely be explicitly invoked by an external user; instead,
        one of the factory methods build_hardware_controller or
        build_hardware_simulator should be used.
        """
        self._log = self.CLS_LOG.getChild(str(id(self)))
        self._config = config
        self._backend = backend
        self._loop = loop

        self._callbacks: Set[HardwareEventHandler] = set()
        # {'X': 0.0, 'Y': 0.0, 'Z': 0.0, 'A': 0.0, 'B': 0.0, 'C': 0.0}
        self._current_position: Dict[Axis, float] = {}

        self._last_moved_mount: Optional[top_types.Mount] = None
        # The motion lock synchronizes calls to long-running physical tasks
        # involved in motion. This fixes issue where for instance a move()
        # or home() call is in flight and something else calls
        # current_position(), which will not be updated until the move() or
        # home() call succeeds or fails.
        self._motion_lock = asyncio.Lock(loop=self._loop)
        self._door_state = DoorState.CLOSED
        self._pause_manager = PauseManager(self._door_state)
        self._transforms = build_ot3_transforms(self._config)
        self._pipette_kind = PipetteKind.NONE
        self._move_manager = MoveManager(
            constraints=get_system_constraints(
                self._config.speed_settings, self._pipette_kind
            )
        )

        ExecutionManagerProvider.__init__(self, loop, isinstance(backend, OT3Simulator))
        InstrumentHandlerProvider.__init__(self)

    def set_robot_calibration(self, robot_calibration: RobotCalibration) -> None:
        self._transforms.deck_calibration = robot_calibration.deck_calibration

    def reset_robot_calibration(self) -> None:
        self._transforms = build_ot3_transforms(self._config)

    @property
    def robot_calibration(self) -> OT3Transforms:
        return self._transforms

    def validate_calibration(self) -> DeckTransformState:
        return DeckTransformState.OK

    @property
    def door_state(self) -> DoorState:
        return self._door_state

    @door_state.setter
    def door_state(self, door_state: DoorState):
        self._door_state = door_state

    @property
    def pipette_kind(self) -> PipetteKind:
        return self._pipette_kind

    @pipette_kind.setter
    def pipette_kind(self, pipette_kind: PipetteKind):
        self._pipette_kind = pipette_kind
        self._move_manager.update_constraints(
            get_system_constraints(self._config, pipette_kind)
        )

    def _update_door_state(self, door_state: DoorState):
        mod_log.info(f"Updating the window switch status: {door_state}")
        self.door_state = door_state
        self._pause_manager.set_door(self.door_state)
        for cb in self._callbacks:
            hw_event = DoorStateNotification(
                new_state=door_state, blocking=self._pause_manager.blocked_by_door
            )
            try:
                cb(hw_event)
            except Exception:
                mod_log.exception("Errored during door state event callback")

    def _reset_last_mount(self):
        self._last_moved_mount = None

    @classmethod
    async def build_hardware_controller(
        cls,
        attached_instruments: Dict[top_types.Mount, Dict[str, Optional[str]]] = None,
        attached_modules: List[str] = None,
        config: Union[OT3Config, RobotConfig] = None,
        loop: asyncio.AbstractEventLoop = None,
        strict_attached_instruments: bool = True,
    ) -> "OT3API":
        """Build an ot3 hardware controller."""
        checked_loop = use_or_initialize_loop(loop)
        if not isinstance(config, OT3Config):
            checked_config = robot_configs.load_ot3()
        else:
            checked_config = config
        backend = await OT3Controller.build(checked_config)
        await backend.setup_motors()
        return cls(backend, loop=checked_loop, config=checked_config)

    @classmethod
    async def build_hardware_simulator(
        cls,
        attached_instruments: Dict[top_types.Mount, Dict[str, Optional[str]]] = None,
        attached_modules: List[str] = None,
        config: Union[RobotConfig, OT3Config] = None,
        loop: asyncio.AbstractEventLoop = None,
        strict_attached_instruments: bool = True,
    ) -> "OT3API":
        """Build a simulating hardware controller.

        This method may be used both on a real robot and on dev machines.
        Multiple simulating hardware controllers may be active at one time.
        """

        if None is attached_instruments:
            attached_instruments = {}

        if None is attached_modules:
            attached_modules = []

        checked_loop = use_or_initialize_loop(loop)
        if not isinstance(config, OT3Config):
            checked_config = robot_configs.load_ot3()
        else:
            checked_config = config
        backend = await OT3Simulator.build(
            attached_instruments,
            attached_modules,
            checked_config,
            checked_loop,
            strict_attached_instruments,
        )
        api_instance = cls(backend, loop=checked_loop, config=checked_config)
        await api_instance.cache_instruments()
        module_controls = await AttachedModulesControl.build(
            api_instance, board_revision=backend.board_revision
        )
        backend.module_controls = module_controls
        await backend.watch(api_instance.loop)
        return api_instance

    def __repr__(self):
        return "<{} using backend {}>".format(type(self), type(self._backend))

    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        """The event loop used by this instance."""
        return self._loop

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop
        self._motion_lock = asyncio.Lock(loop=loop)

    @property
    def is_simulator(self):
        """`True` if this is a simulator; `False` otherwise."""
        return isinstance(self._backend, OT3Simulator)

    def register_callback(self, cb: HardwareEventHandler) -> Callable[[], None]:
        """Allows the caller to register a callback, and returns a closure
        that can be used to unregister the provided callback
        """
        self._callbacks.add(cb)

        def unregister():
            self._callbacks.remove(cb)

        return unregister

    def get_fw_version(self) -> str:
        """
        Return the firmware version of the connected hardware.
        """
        from_backend = self._backend.fw_version
        if from_backend is None:
            return "unknown"
        else:
            return from_backend

    @property
    def fw_version(self) -> str:
        return self.get_fw_version()

    @property
    def board_revision(self) -> str:
        return str(self._backend.board_revision)

    # Incidentals (i.e. not motion) API

    async def set_lights(
        self, button: Optional[bool] = None, rails: Optional[bool] = None
    ) -> None:
        """Control the robot lights."""
        self._backend.set_lights(button, rails)

    def get_lights(self) -> Dict[str, bool]:
        """Return the current status of the robot lights."""
        return self._backend.get_lights()

    async def identify(self, duration_s: int = 5):
        """Blink the button light to identify the robot."""
        count = duration_s * 4
        on = False
        for sec in range(count):
            then = self._loop.time()
            await self.set_lights(button=on)
            on = not on
            now = self._loop.time()
            await asyncio.sleep(max(0, 0.25 - (now - then)))
        await self.set_lights(button=True)

    @ExecutionManagerProvider.wait_for_running
    async def delay(self, duration_s: float):
        """Delay execution by pausing and sleeping."""
        self.pause(PauseType.DELAY)
        try:
            await self.do_delay(duration_s)
        finally:
            self.resume(PauseType.DELAY)

    @property
    def attached_modules(self) -> List[modules.AbstractModule]:
        return self._backend.module_controls.available_modules

    async def update_firmware(
        self,
        firmware_file: str,
        loop: asyncio.AbstractEventLoop = None,
        explicit_modeset: bool = True,
    ) -> str:
        """Update the firmware on the hardware."""
        if None is loop:
            checked_loop = self._loop
        else:
            checked_loop = loop
        return await self._backend.update_firmware(
            firmware_file, checked_loop, explicit_modeset
        )

    async def cache_instruments(
        self, require: Optional[Dict[top_types.Mount, PipetteName]] = None
    ) -> None:
        """
        Scan the attached instruments, take necessary configuration actions,
        and set up hardware controller internal state if necessary.
        """
        self._log.info("Updating instrument model cache")
        checked_require = require or {}
        for mount, name in checked_require.items():
            if name not in name_config():
                raise RuntimeError(f"{name} is not a valid pipette name")
        async with self._motion_lock:
            found = await self._backend.get_attached_instruments(checked_require)

        for mount, instrument_data in found.items():
            config = instrument_data.get("config")
            req_instr = checked_require.get(mount, None)
            pip_id = instrument_data.get("id")
            pip_offset_cal = load_pipette_offset(pip_id, mount)
            p, may_skip = load_from_config_and_check_skip(
                config,
                self._attached_instruments[mount],
                req_instr,
                pip_id,
                pip_offset_cal,
            )
            self._attached_instruments[mount] = p
            if req_instr and p:
                p.act_as(req_instr)

            if may_skip:
                self._log.info(f"Skipping configuration on {mount.name}")
                continue

            self._log.info(f"Doing full configuration on {mount.name}")
            hw_config = generate_hardware_configs_ot3(
                p, self._config, self._backend.board_revision
            )
            await self._backend.configure_mount(mount, hw_config)
        await self._backend.probe_network()
        # TODO: (AA, 2022-02-09) Set correct pipette kind based on attached instr
        self.pipette_kind = PipetteKind.TWO_LOW_THROUGHPUT

    # Global actions API
    def pause(self, pause_type: PauseType):
        """
        Pause motion of the robot after a current motion concludes."""
        self._pause_manager.pause(pause_type)

        async def _chained_calls():
            await self._execution_manager.pause()
            self._backend.pause()

        asyncio.run_coroutine_threadsafe(_chained_calls(), self._loop)

    def pause_with_message(self, message: str):
        self._log.warning(f"Pause with message: {message}")
        notification = ErrorMessageNotification(message=message)
        for cb in self._callbacks:
            cb(notification)
        self.pause(PauseType.PAUSE)

    def resume(self, pause_type: PauseType):
        """
        Resume motion after a call to :py:meth:`pause`.
        """
        self._pause_manager.resume(pause_type)

        if self._pause_manager.should_pause:
            return

        # Resume must be called immediately to awaken thread running hardware
        #  methods (ThreadManager)
        self._backend.resume()

        async def _chained_calls():
            # mirror what happens API.pause.
            await self._execution_manager.resume()
            self._backend.resume()

        asyncio.run_coroutine_threadsafe(_chained_calls(), self._loop)

    async def halt(self) -> None:
        """Immediately stop motion."""
        await self._backend.hard_halt()
        asyncio.run_coroutine_threadsafe(self._execution_manager.cancel(), self._loop)

    async def stop(self, home_after: bool = True):
        """Stop motion as soon as possible, reset, and optionally home."""
        await self._backend.halt()
        self._log.info("Recovering from halt")
        await self.reset()

        if home_after:
            await self.home()

    async def reset(self):
        """Reset the stored state of the system."""
        self._pause_manager.reset()
        await self._execution_manager.reset()
        await InstrumentHandlerProvider.reset(self)
        await self.cache_instruments()

    # Gantry/frame (i.e. not pipette) action API
    async def home_z(self, mount: Optional[top_types.Mount] = None):
        """Home the two z-axes"""
        self._reset_last_mount()
        if not mount:
            axes = [Axis.Z, Axis.A]
        else:
            axes = [Axis.by_mount(mount)]
        await self.home(axes)

    async def _do_plunger_home(
        self,
        axis: Axis = None,
        mount: top_types.Mount = None,
        acquire_lock: bool = True,
    ):
        assert (axis is not None) ^ (mount is not None), "specify either axis or mount"
        if axis:
            checked_axis = axis
            checked_mount = Axis.to_mount(checked_axis)
        if mount:
            checked_mount = mount
            checked_axis = Axis.of_plunger(checked_mount)
        instr = self._attached_instruments[checked_mount]
        if not instr:
            return
        async with contextlib.AsyncExitStack() as stack:
            if acquire_lock:
                await stack.enter_async_context(self._motion_lock)
            with self._backend.save_current():
                self._backend.set_active_current(
                    {checked_axis: instr.config.plunger_current}
                )
                await self._backend.home([checked_axis.name.upper()])
                # either we were passed False for our acquire_lock and we
                # should pass it on, or we acquired the lock above and
                # shouldn't do it again
                target_pos = target_position_from_plunger(
                    checked_mount, instr.config.bottom, self._current_position
                )
                await self._move(
                    target_pos,
                    acquire_lock=False,
                    home_flagged_axes=False,
                )

    async def home_plunger(self, mount: top_types.Mount):
        """
        Home the plunger motor for a mount, and then return it to the 'bottom'
        position.
        """
        await self.current_position(mount=mount, refresh=True)
        await self._do_plunger_home(mount=mount, acquire_lock=True)

    @ExecutionManagerProvider.wait_for_running
    async def home(self, axes: Optional[List[Axis]] = None):
        """Home the entire robot and initialize current position."""
        self._reset_last_mount()
        # Initialize/update current_position
        checked_axes = axes or [ax for ax in Axis]
        gantry = [ax for ax in checked_axes if ax in Axis.gantry_axes()]
        machine_gantry = [ax.name.upper() for ax in gantry]
        machine_pos = {}
        plungers = [ax for ax in checked_axes if ax not in Axis.gantry_axes()]

        async with self._motion_lock:
            if machine_gantry:
                machine_pos.update(await self._backend.home(machine_gantry))
                self._current_position = deck_from_machine(
                    machine_pos,
                    self._transforms.deck_calibration.attitude,
                    self._transforms.carriage_offset,
                )
            for plunger in plungers:
                await self._do_plunger_home(axis=plunger, acquire_lock=False)

    @lru_cache(1)
    def _carriage_offset(self) -> top_types.Point:
        return top_types.Point(*self._config.carriage_offset)

    async def current_position(
        self,
        mount: top_types.Mount,
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
        # TODO(mc, 2021-11-15): combine with `refresh` for more reliable
        # position reporting when motors are not homed
        fail_on_not_homed: bool = False,
    ) -> Dict[Axis, float]:
        """Return the postion (in deck coords) of the critical point of the
        specified mount.
        """
        z_ax = Axis.by_mount(mount)
        plunger_ax = Axis.of_plunger(mount)
        position_axes = [Axis.X, Axis.Y, z_ax, plunger_ax]

        if fail_on_not_homed and (
            not self._backend.is_homed([str(a) for a in position_axes])
            or not self._current_position
        ):
            raise MustHomeError(
                f"Current position of {str(mount)} pipette is unknown, please home."
            )

        elif not self._current_position and not refresh:
            raise MustHomeError("Current position is unknown; please home motors.")
        async with self._motion_lock:
            if refresh:
                self._current_position = deck_from_machine(
                    await self._backend.update_position(),
                    self._transforms.deck_calibration.attitude,
                    self._transforms.carriage_offset,
                )
            offset = offset_for_mount(
                mount, self._config.left_mount_offset, self._config.right_mount_offset
            )
            cp = self.critical_point_for(mount, critical_point)
            return {
                Axis.X: self._current_position[Axis.X] + offset[0] + cp.x,
                Axis.Y: self._current_position[Axis.Y] + offset[1] + cp.y,
                z_ax: self._current_position[z_ax] + offset[2] + cp.z,
                plunger_ax: self._current_position[plunger_ax],
            }

    async def gantry_position(
        self,
        mount: top_types.Mount,
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
        # TODO(mc, 2021-11-15): combine with `refresh` for more reliable
        # position reporting when motors are not homed
        fail_on_not_homed: bool = False,
    ) -> top_types.Point:
        """Return the position of the critical point as pertains to the gantry."""
        cur_pos = await self.current_position(
            mount,
            critical_point,
            refresh,
            fail_on_not_homed,
        )
        return top_types.Point(
            x=cur_pos[Axis.X], y=cur_pos[Axis.Y], z=cur_pos[Axis.by_mount(mount)]
        )

    async def move_to(
        self,
        mount: top_types.Mount,
        abs_position: top_types.Point,
        speed: Optional[float] = None,
        critical_point: Optional[CriticalPoint] = None,
        max_speeds: Optional[Dict[Axis, float]] = None,
    ):
        """Move the critical point of the specified mount to a location
        relative to the deck, at the specified speed."""
        if not self._current_position:
            await self.home()

        target_position = target_position_from_absolute(
            mount,
            abs_position,
            partial(self.critical_point_for, cp_override=critical_point),
            top_types.Point(*self._config.left_mount_offset),
            top_types.Point(*self._config.right_mount_offset),
        )

        await self._cache_and_maybe_retract_mount(mount)
        await self._move(target_position, speed=speed, max_speeds=max_speeds)

    async def move_rel(
        self,
        mount: top_types.Mount,
        delta: top_types.Point,
        speed: Optional[float] = None,
        max_speeds: Optional[Dict[Axis, float]] = None,
        check_bounds: MotionChecks = MotionChecks.NONE,
        fail_on_not_homed: bool = False,
    ):
        """Move the critical point of the specified mount by a specified
        displacement in a specified direction, at the specified speed."""

        # TODO: Remove the fail_on_not_homed and make this the behavior all the time.
        # Having the optional arg makes the bug stick around in existing code and we
        # really want to fix it when we're not gearing up for a release.
        mhe = MustHomeError(
            "Cannot make a relative move because absolute position is unknown"
        )
        if not self._current_position:
            if fail_on_not_homed:
                raise mhe
            else:
                await self.home()

        target_position = target_position_from_relative(
            mount, delta, self._current_position
        )
        axes_moving = [Axis.X, Axis.Y, Axis.by_mount(mount)]
        if fail_on_not_homed and not self._backend.is_homed(
            [axis.name for axis in axes_moving if axis is not None]
        ):
            raise mhe
        await self._cache_and_maybe_retract_mount(mount)
        await self._move(
            target_position,
            speed=speed,
            max_speeds=max_speeds,
            check_bounds=check_bounds,
        )

    async def _cache_and_maybe_retract_mount(self, mount: top_types.Mount):
        """Retract the 'other' mount if necessary

        If `mount` does not match the value in :py:attr:`_last_moved_mount`
        (and :py:attr:`_last_moved_mount` exists) then retract the mount
        in :py:attr:`_last_moved_mount`. Also unconditionally update
        :py:attr:`_last_moved_mount` to contain `mount`.
        """
        if mount != self._last_moved_mount and self._last_moved_mount:
            await self.retract(self._last_moved_mount, 10)
        self._last_moved_mount = mount

    @ExecutionManagerProvider.wait_for_running
    async def _move(
        self,
        target_position: "OrderedDict[Axis, float]",
        speed: float = None,
        home_flagged_axes: bool = True,
        max_speeds: Dict[Axis, float] = None,
        acquire_lock: bool = True,
        check_bounds: MotionChecks = MotionChecks.NONE,
    ):
        """Worker function to apply robot motion."""
        machine_pos = machine_from_deck(
            target_position,
            self._transforms.deck_calibration.attitude,
            self._transforms.carriage_offset,
        )
        bounds = self._backend.axis_bounds
        to_check = {
            ax: machine_pos[ax.name]
            for ax in target_position.keys()
            if ax in Axis.gantry_axes()
        }
        check_motion_bounds(to_check, target_position, bounds, check_bounds)

        # TODO: (2022-02-10) Use actual max speed for MoveTarget
        checked_speed = speed or 500
        self._move_manager.update_constraints(
            get_system_constraints(self._config, self._pipette_kind)
        )
        move_target = MoveTarget.build(
            position=Coordinates(**machine_pos), max_speed=checked_speed
        )
        backend_position = await self._backend.update_position()
        origin = Coordinates.from_iter(iter([backend_position[ax.name] for ax in Axis]))
        try:
            blended, moves = self._move_manager.plan_motion(
                origin=origin, target_list=[move_target]
            )
        except ZeroLengthMoveError as zero_length_error:
            self._log.info(f"{str(zero_length_error)}, ignoring")
            return
        async with contextlib.AsyncExitStack() as stack:
            if acquire_lock:
                await stack.enter_async_context(self._motion_lock)
            try:
                await self._backend.move(origin, moves[0])
            except Exception:
                self._log.exception("Move failed")
                self._current_position.clear()
                raise
            else:
                self._current_position.update(target_position)

    def get_engaged_axes(self) -> Dict[Axis, bool]:
        """Which axes are engaged and holding."""
        return {Axis[ax]: eng for ax, eng in self._backend.engaged_axes().items()}

    @property
    def engaged_axes(self):
        return self.get_engaged_axes()

    async def disengage_axes(self, which: List[Axis]):
        await self._backend.disengage_axes([ax.name for ax in which])

    async def _fast_home(self, axes: Sequence[str], margin: float) -> Dict[str, float]:
        converted_axes = "".join(axes)
        return await self._backend.fast_home(converted_axes, margin)

    @ExecutionManagerProvider.wait_for_running
    async def retract(self, mount: top_types.Mount, margin: float = 10):
        """Pull the specified mount up to its home position.

        Works regardless of critical point or home status.
        """
        machine_ax = Axis.by_mount(mount).name.upper()

        async with self._motion_lock:
            machine_pos = await self._fast_home((machine_ax,), margin)
            self._current_position = deck_from_machine(
                machine_pos,
                self._transforms.deck_calibration.attitude,
                self._transforms.carriage_offset,
            )

    # Gantry/frame (i.e. not pipette) config API
    @property
    def config(self) -> OT3Config:
        """Get the robot's configuration object.

        :returns .RobotConfig: The object.
        """
        return self._config

    @config.setter
    def config(self, config: Union[OT3Config, RobotConfig]) -> None:
        """Replace the currently-loaded config"""
        if isinstance(config, OT3Config):
            self._config = config
        else:
            self._log.error("Tried to specify an OT2 config object")

    def get_config(self) -> OT3Config:
        """
        Get the robot's configuration object.

        :returns .RobotConfig: The object.
        """
        return self.config

    def set_config(self, config: Union[OT3Config, RobotConfig]) -> None:
        """Replace the currently-loaded config"""
        if isinstance(config, OT3Config):
            self.config = config
        else:
            self._log.error("Tried to specify an OT2 config object")

    async def update_config(self, **kwargs):
        """Update values of the robot's configuration."""
        self._config = replace(self._config, **kwargs)

    async def update_deck_calibration(self, new_transform):
        pass

    # Pipette action API
    async def prepare_for_aspirate(self, mount: top_types.Mount, rate: float = 1.0):
        """Prepare the pipette for aspiration."""
        instrument = self.get_pipette(mount)

        self.ready_for_tip_action(instrument, HardwareAction.PREPARE_ASPIRATE)

        if instrument.current_volume == 0:
            speed = self.plunger_speed(
                instrument, instrument.blow_out_flow_rate, "aspirate"
            )
            bottom = instrument.config.bottom
            target_pos = target_position_from_plunger(
                mount, bottom, self._current_position
            )
            await self._move(
                target_pos,
                speed=(speed * rate),
                home_flagged_axes=False,
            )
            instrument.ready_to_aspirate = True

    async def aspirate(
        self,
        mount: top_types.Mount,
        volume: Optional[float] = None,
        rate: float = 1.0,
    ):
        """
        Aspirate a volume of liquid (in microliters/uL) using this pipette."""
        aspirate_spec = self.plan_check_aspirate(mount, volume, rate)
        if not aspirate_spec:
            return
        target_pos = target_position_from_plunger(
            mount,
            aspirate_spec.plunger_distance,
            self._current_position,
        )

        try:
            self._backend.set_active_current(
                {aspirate_spec.axis: aspirate_spec.current}
            )

            await self._move(
                target_pos,
                speed=aspirate_spec.speed,
                home_flagged_axes=False,
            )
        except Exception:
            self._log.exception("Aspirate failed")
            aspirate_spec.instr.set_current_volume(0)
            raise
        else:
            aspirate_spec.instr.add_current_volume(aspirate_spec.volume)

    async def dispense(
        self,
        mount: top_types.Mount,
        volume: Optional[float] = None,
        rate: float = 1.0,
    ):
        """
        Dispense a volume of liquid in microliters(uL) using this pipette."""
        dispense_spec = self.plan_check_dispense(mount, volume, rate)
        if not dispense_spec:
            return
        target_pos = target_position_from_plunger(
            mount,
            dispense_spec.plunger_distance,
            self._current_position,
        )

        try:
            self._backend.set_active_current(
                {dispense_spec.axis: dispense_spec.current}
            )
            await self._move(
                target_pos,
                speed=dispense_spec.speed,
                home_flagged_axes=False,
            )
        except Exception:
            self._log.exception("Dispense failed")
            dispense_spec.instr.set_current_volume(0)
            raise
        else:
            dispense_spec.instr.remove_current_volume(dispense_spec.volume)

    async def blow_out(self, mount: top_types.Mount) -> None:
        """
        Force any remaining liquid to dispense. The liquid will be dispensed at
        the current location of pipette
        """
        blowout_spec = self.plan_check_blow_out(mount)
        self._backend.set_active_current({blowout_spec.axis: blowout_spec.current})
        target_pos = target_position_from_plunger(
            mount,
            blowout_spec.plunger_distance,
            self._current_position,
        )

        try:
            await self._move(
                target_pos,
                speed=blowout_spec.speed,
                home_flagged_axes=False,
            )
        except Exception:
            self._log.exception("Blow out failed")
            raise
        finally:
            blowout_spec.instr.set_current_volume(0)
            blowout_spec.instr.ready_to_aspirate = False

    async def pick_up_tip(
        self,
        mount: top_types.Mount,
        tip_length: float,
        presses: Optional[int] = None,
        increment: Optional[float] = None,
    ):
        """Pick up tip from current location."""
        spec, _add_tip_to_instrs = self.plan_check_pick_up_tip(
            mount, tip_length, presses, increment
        )
        self._backend.set_active_current(spec.plunger_currents)
        target_absolute = target_position_from_plunger(
            mount, spec.plunger_prep_pos, self._current_position
        )
        await self._move(
            target_absolute,
            home_flagged_axes=False,
        )

        for press in spec.presses:
            with self._backend.save_current():
                self._backend.set_active_current(press.current)
                target_down = target_position_from_relative(
                    mount, press.relative_down, self._current_position
                )
                await self._move(target_down, speed=press.speed)
                target_up = target_position_from_relative(
                    mount, press.relative_up, self._current_position
                )
                await self._move(target_up)

        _add_tip_to_instrs()

        # neighboring tips tend to get stuck in the space between
        # the volume chamber and the drop-tip sleeve on p1000.
        # This extra shake ensures those tips are removed
        for rel_point, speed in spec.shake_off_list:
            await self.move_rel(mount, rel_point, speed=speed)
        # Here we add in the debounce distance for the switch as
        # a safety precaution
        await self.retract(mount, spec.retract_target)

    def set_current_tiprack_diameter(
        self, mount: top_types.Mount, tiprack_diameter: float
    ):
        instrument = self.get_pipette(mount)
        self._log.info(
            "Updating tip rack diameter on pipette mount: "
            f"{mount}, tip diameter: {tiprack_diameter} mm"
        )
        instrument.current_tiprack_diameter = tiprack_diameter

    def set_working_volume(self, mount: top_types.Mount, tip_volume: int):
        instrument = self.get_pipette(mount)
        self._log.info(
            "Updating working volume on pipette mount:"
            f"{mount}, tip volume: {tip_volume} ul"
        )
        instrument.working_volume = tip_volume

    async def drop_tip(self, mount: top_types.Mount, home_after=True):
        """Drop tip at the current location."""

        spec, _remove = self.plan_check_drop_tip(mount, home_after)

        for move in spec.drop_moves:
            self._backend.set_active_current(move.current)
            target_pos = target_position_from_plunger(
                mount, move.target_position, self._current_position
            )
            await self._move(
                target_pos,
                speed=move.speed,
                home_flagged_axes=False,
            )
            if move.home_after:
                machine_pos = await self._backend.fast_home(
                    [ax.name.upper() for ax in move.home_axes],
                    move.home_after_safety_margin,
                )
                self._current_position = deck_from_machine(
                    machine_pos,
                    self._transforms.deck_calibration.attitude,
                    self._transforms.carriage_offset,
                )

        for shake in spec.shake_moves:
            await self.move_rel(mount, shake[0], speed=shake[1])

        self._backend.set_active_current(spec.ending_current)
        _remove()

    async def find_modules(
        self,
        by_model: modules.types.ModuleModel,
        resolved_type: modules.types.ModuleType,
    ) -> Tuple[List[modules.AbstractModule], Optional[modules.AbstractModule]]:
        modules_result = await self._backend.module_controls.parse_modules(
            by_model, resolved_type
        )
        return modules_result

    def clean_up(self) -> None:
        """Get the API ready to stop cleanly."""
        self._backend.clean_up()

    def plunger_position(
        self, instr: Pipette, ul: float, action: "UlPerMmAction"
    ) -> float:
        mm = ul / instr.ul_per_mm(ul, action)
        position = instr.config.bottom - mm
        return round(position, 6)

    def get_instrument_max_height(
        self, mount: top_types.Mount, critical_point: Optional[CriticalPoint] = None
    ) -> float:
        return InstrumentHandlerProvider.instrument_max_height(
            self, mount, self._config.z_retract_distance, critical_point
        )
