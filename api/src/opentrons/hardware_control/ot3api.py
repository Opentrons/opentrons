import asyncio
import contextlib
from functools import partial, lru_cache
from dataclasses import replace
import logging
from collections import OrderedDict
from typing import (
    AsyncIterator,
    Tuple,
    cast,
    Callable,
    Dict,
    Union,
    List,
    Optional,
    Sequence,
    Set,
    Any,
    TypeVar,
)


from opentrons_shared_data.pipette.dev_types import (
    PipetteName,
)
from opentrons_shared_data.gripper.constants import IDLE_STATE_GRIP_FORCE

from opentrons import types as top_types
from opentrons.config import robot_configs, ot3_pipette_config
from opentrons.config.types import (
    RobotConfig,
    OT3Config,
    GantryLoad,
    CapacitivePassSettings,
    LiquidProbeSettings,
)
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons_hardware.hardware_control.motion_planning import (
    MoveManager,
    MoveTarget,
    ZeroLengthMoveError,
)

from opentrons_hardware.hardware_control.motion import MoveStopCondition
from opentrons_shared_data.pipette.pipette_definition import PipetteChannelType

from .util import use_or_initialize_loop, check_motion_bounds

from .instruments.ot3.pipette import (
    Pipette,
    load_from_config_and_check_skip,
)
from .instruments.ot3.gripper import compare_gripper_config_and_check_skip
from .instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset,
    PipetteOffsetByPipetteMount,
)
from .backends.ot3controller import OT3Controller
from .backends.ot3simulator import OT3Simulator
from .backends.ot3utils import get_system_constraints, axis_convert
from .execution_manager import ExecutionManagerProvider
from .pause_manager import PauseManager
from .module_control import AttachedModulesControl
from .util import DeckTransformState
from .types import (
    Axis,
    CriticalPoint,
    DoorState,
    DoorStateNotification,
    ErrorMessageNotification,
    HardwareEventHandler,
    HardwareAction,
    MotionChecks,
    PipetteSubType,
    PauseType,
    OT3Axis,
    OT3Mount,
    OT3AxisMap,
    GripperJawState,
    InstrumentProbeType,
    GripperProbe,
    EarlyLiquidSenseTrigger,
    LiquidNotFound,
    UpdateStatus,
)
from .errors import MustHomeError, GripperNotAttachedError
from . import modules
from .robot_calibration import (
    OT3Transforms,
    RobotCalibration,
    build_ot3_transforms,
)

from .protocols import HardwareControlAPI

# TODO (lc 09/15/2022) We should update our pipette handler to reflect OT-3 properties
# in a follow-up PR.
from .instruments.ot3.pipette_handler import (
    OT3PipetteHandler,
    InstrumentsByMount,
    PickUpTipSpec,
    TipMotorPickUpTipSpec,
)
from .instruments.ot3.instrument_calibration import load_pipette_offset
from .instruments.ot3.gripper_handler import GripperHandler
from .instruments.ot3.instrument_calibration import (
    load_gripper_calibration_offset,
)

from .motion_utilities import (
    target_position_from_absolute,
    target_position_from_relative,
    target_position_from_plunger,
    offset_for_mount,
    deck_from_machine,
    machine_from_deck,
    machine_vector_from_deck_vector,
)

from .dev_types import (
    AttachedGripper,
    OT3AttachedPipette,
    PipetteDict,
    InstrumentDict,
    GripperDict,
)
from opentrons_hardware.hardware_control.motion_planning.move_utils import (
    MoveConditionNotMet,
)

mod_log = logging.getLogger(__name__)


class OT3API(
    ExecutionManagerProvider,
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
        self._current_position: OT3AxisMap[float] = {}
        self._encoder_current_position: OT3AxisMap[float] = {}

        self._last_moved_mount: Optional[OT3Mount] = None
        # The motion lock synchronizes calls to long-running physical tasks
        # involved in motion. This fixes issue where for instance a move()
        # or home() call is in flight and something else calls
        # current_position(), which will not be updated until the move() or
        # home() call succeeds or fails.
        self._motion_lock = asyncio.Lock()
        self._door_state = DoorState.CLOSED
        self._pause_manager = PauseManager()
        self._transforms = build_ot3_transforms(self._config)
        self._gantry_load = GantryLoad.NONE
        self._move_manager = MoveManager(
            constraints=get_system_constraints(
                self._config.motion_settings, self._gantry_load
            )
        )

        self._pipette_handler = OT3PipetteHandler({m: None for m in OT3Mount})
        self._gripper_handler = GripperHandler(gripper=None)
        ExecutionManagerProvider.__init__(self, isinstance(backend, OT3Simulator))

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
    def door_state(self, door_state: DoorState) -> None:
        self._door_state = door_state

    @property
    def gantry_load(self) -> GantryLoad:
        return self._gantry_load

    async def set_gantry_load(self, gantry_load: GantryLoad) -> None:
        mod_log.info(f"Setting gantry load to {gantry_load}")
        self._gantry_load = gantry_load
        self._move_manager.update_constraints(
            get_system_constraints(self._config.motion_settings, gantry_load)
        )
        await self._backend.update_to_default_current_settings(gantry_load)

    def _update_door_state(self, door_state: DoorState) -> None:
        mod_log.info(f"Updating the window switch status: {door_state}")
        self.door_state = door_state
        for cb in self._callbacks:
            hw_event = DoorStateNotification(new_state=door_state)
            try:
                cb(hw_event)
            except Exception:
                mod_log.exception("Errored during door state event callback")

    def _reset_last_mount(self) -> None:
        self._last_moved_mount = None

    @classmethod
    async def build_hardware_controller(
        cls,
        attached_instruments: Optional[
            Dict[Union[top_types.Mount, OT3Mount], Dict[str, Optional[str]]]
        ] = None,
        attached_modules: Optional[List[str]] = None,
        config: Union[OT3Config, RobotConfig, None] = None,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        strict_attached_instruments: bool = True,
    ) -> "OT3API":
        """Build an ot3 hardware controller."""
        checked_loop = use_or_initialize_loop(loop)
        if not isinstance(config, OT3Config):
            checked_config = robot_configs.load_ot3()
        else:
            checked_config = config
        backend = await OT3Controller.build(checked_config)
        api_instance = cls(backend, loop=checked_loop, config=checked_config)
        await api_instance.cache_instruments()
        module_controls = await AttachedModulesControl.build(
            api_instance, board_revision=backend.board_revision
        )
        backend.module_controls = module_controls
        checked_loop.create_task(backend.watch(loop=checked_loop))
        return api_instance

    @classmethod
    async def build_hardware_simulator(
        cls,
        attached_instruments: Optional[
            Dict[Union[top_types.Mount, OT3Mount], Dict[str, Optional[str]]]
        ] = None,
        attached_modules: Optional[List[str]] = None,
        config: Union[RobotConfig, OT3Config, None] = None,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        strict_attached_instruments: bool = True,
    ) -> "OT3API":
        """Build a simulating hardware controller.

        This method may be used both on a real robot and on dev machines.
        Multiple simulating hardware controllers may be active at one time.
        """

        checked_attached = attached_instruments or {}
        checked_modules = attached_modules or []

        checked_loop = use_or_initialize_loop(loop)
        if not isinstance(config, OT3Config):
            checked_config = robot_configs.load_ot3()
        else:
            checked_config = config
        backend = await OT3Simulator.build(
            {OT3Mount.from_mount(k): v for k, v in checked_attached.items()},
            checked_modules,
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

    def __repr__(self) -> str:
        return "<{} using backend {}>".format(type(self), type(self._backend))

    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        """The event loop used by this instance."""
        return self._loop

    @property
    def is_simulator(self) -> bool:
        """`True` if this is a simulator; `False` otherwise."""
        return isinstance(self._backend, OT3Simulator)

    def register_callback(self, cb: HardwareEventHandler) -> Callable[[], None]:
        """Allows the caller to register a callback, and returns a closure
        that can be used to unregister the provided callback
        """
        self._callbacks.add(cb)

        def unregister() -> None:
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

    async def identify(self, duration_s: int = 5) -> None:
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
    async def delay(self, duration_s: float) -> None:
        """Delay execution by pausing and sleeping."""
        self.pause(PauseType.DELAY)
        try:
            await self.do_delay(duration_s)
        finally:
            self.resume(PauseType.DELAY)

    @property
    def attached_modules(self) -> List[modules.AbstractModule]:
        return self._backend.module_controls.available_modules

    async def create_simulating_module(
        self,
        model: modules.types.ModuleModel,
    ) -> modules.AbstractModule:
        """Create a simulating module hardware interface."""
        assert (
            self.is_simulator
        ), "Cannot build simulating module from non-simulating hardware control API"

        return await self._backend.module_controls.build_module(
            port="",
            usb_port=USBPort(name="", port_number=0),
            type=modules.ModuleType.from_model(model),
            sim_model=model.value,
        )

    @staticmethod
    def _pipette_subtype_from_pipette(pipette: Pipette) -> PipetteSubType:
        pipettes = {
            PipetteChannelType.SINGLE_CHANNEL: PipetteSubType.pipette_single,
            PipetteChannelType.EIGHT_CHANNEL: PipetteSubType.pipette_multi,
            PipetteChannelType.NINETY_SIX_CHANNEL: PipetteSubType.pipette_96,
        }
        return pipettes[pipette.channels]

    def get_fw_update_progress(self) -> Tuple[Set[UpdateStatus], int]:
        """Get the progress of updates currently running."""
        return self._backend.get_update_progress()

    async def start_firmware_updates(self) -> None:
        """Helper to start firmware updates without needing to consume iterator."""
        async for updates, progress in self.do_firmware_updates():
            mod_log.debug(f"{updates} {progress}")

    async def do_firmware_updates(self) -> AsyncIterator[Tuple[Set[UpdateStatus], int]]:
        """Update all the firmware."""
        # get the attached instruments so we can get the type of pipettes attached
        pipettes: Dict[OT3Mount, PipetteSubType] = dict()
        attached_instruments = self._pipette_handler.get_attached_instruments()
        for mount, _ in attached_instruments.items():
            if self._pipette_handler.has_pipette(mount):
                pipette = self._pipette_handler.get_pipette(mount)
                pipettes[mount] = self._pipette_subtype_from_pipette(pipette)
        async for updates, progress in self._backend.update_firmware(pipettes):
            yield updates, progress

    def _gantry_load_from_instruments(self) -> GantryLoad:
        """Compute the gantry load based on attached instruments."""
        left = self._pipette_handler.has_pipette(OT3Mount.LEFT)
        right = self._pipette_handler.has_pipette(OT3Mount.RIGHT)
        gripper = self._gripper_handler.has_gripper()
        if left and right:
            # Only low-throughputs can have the two-instrument case
            return GantryLoad.TWO_LOW_THROUGHPUT
        if right:
            # only a low-throughput pipette can be on the right mount
            return GantryLoad.LOW_THROUGHPUT
        if left:
            # as good a measure as any to define low vs high throughput, though
            # we'll want to touch this up as we get pipette definitions for HT
            # pipettes
            left_hw_pipette = self._pipette_handler.get_pipette(OT3Mount.LEFT)
            if left_hw_pipette.config.channels.as_int <= 8:
                return GantryLoad.LOW_THROUGHPUT
            else:
                return GantryLoad.HIGH_THROUGHPUT
        if gripper:
            # only a gripper is attached
            return GantryLoad.GRIPPER
        return GantryLoad.NONE

    async def cache_pipette(
        self,
        mount: OT3Mount,
        instrument_data: OT3AttachedPipette,
        req_instr: Optional[PipetteName],
    ) -> None:
        """Set up pipette based on scanned information."""
        config = instrument_data.get("config")
        pip_id = instrument_data.get("id")
        pip_offset_cal = load_pipette_offset(pip_id, mount)
        p, _ = load_from_config_and_check_skip(
            config,
            self._pipette_handler.hardware_instruments[mount],
            req_instr,
            pip_id,
            pip_offset_cal,
        )
        self._pipette_handler.hardware_instruments[mount] = p
        # TODO (lc 12-5-2022) Properly support backwards compatibility
        # when applicable

    async def cache_gripper(self, instrument_data: AttachedGripper) -> None:
        """Set up gripper based on scanned information."""
        grip_cal = load_gripper_calibration_offset(instrument_data.get("id"))
        g = compare_gripper_config_and_check_skip(
            instrument_data,
            self._gripper_handler._gripper,
            grip_cal,
        )
        self._gripper_handler.gripper = g

    def get_all_attached_instr(self) -> Dict[OT3Mount, Optional[InstrumentDict]]:
        return {
            OT3Mount.LEFT: self.attached_pipettes[top_types.Mount.LEFT],
            OT3Mount.RIGHT: self.attached_pipettes[top_types.Mount.RIGHT],
            OT3Mount.GRIPPER: self.attached_gripper,
        }

    # TODO (spp, 2023-01-31): add unit tests
    async def cache_instruments(
        self, require: Optional[Dict[top_types.Mount, PipetteName]] = None
    ) -> None:
        """
        Scan the attached instruments, take necessary configuration actions,
        and set up hardware controller internal state if necessary.
        """
        self._log.info("Updating instrument model cache")
        checked_require = {
            OT3Mount.from_mount(m): v for m, v in (require or {}).items()
        }
        for mount, name in checked_require.items():
            # TODO (lc 12-5-2022) cache instruments should be receiving
            # a pipette type / channels rather than the named config.
            # We should also check version here once we're comfortable.
            if not ot3_pipette_config.supported_pipette(name):
                raise RuntimeError(f"{name} is not a valid pipette name")
        async with self._motion_lock:
            # we're not actually checking the required instrument except in the context
            # of simulation and it feels like a lot of work for this function
            # actually be doing.
            found = await self._backend.get_attached_instruments(checked_require)

        if OT3Mount.GRIPPER in found.keys():
            await self.cache_gripper(cast(AttachedGripper, found.get(OT3Mount.GRIPPER)))
        elif self._gripper_handler.gripper:
            await self._gripper_handler.reset()

        for pipette_mount in [OT3Mount.LEFT, OT3Mount.RIGHT]:
            if pipette_mount in found.keys():
                req_instr_name = checked_require.get(pipette_mount, None)
                await self.cache_pipette(
                    pipette_mount,
                    cast(OT3AttachedPipette, found.get(pipette_mount)),
                    req_instr_name,
                )
            else:
                self._pipette_handler.hardware_instruments[pipette_mount] = None

        await self._backend.probe_network()
        await self._backend.update_motor_status()
        await self.set_gantry_load(self._gantry_load_from_instruments())

    @ExecutionManagerProvider.wait_for_running
    async def _update_position_estimation(
        self, axes: Optional[Union[List[Axis], List[OT3Axis]]] = None
    ) -> None:
        """
        Function to update motor estimation for a set of axes
        """

        if axes:
            checked_axes = [OT3Axis.from_axis(ax) for ax in axes]
        else:
            checked_axes = [ax for ax in OT3Axis]
        await self._backend.update_motor_estimation(checked_axes)

    # Global actions API
    def pause(self, pause_type: PauseType) -> None:
        """
        Pause motion of the robot after a current motion concludes."""
        self._pause_manager.pause(pause_type)

        async def _chained_calls() -> None:
            await self._execution_manager.pause()
            self._backend.pause()

        asyncio.run_coroutine_threadsafe(_chained_calls(), self._loop)

    def pause_with_message(self, message: str) -> None:
        self._log.warning(f"Pause with message: {message}")
        notification = ErrorMessageNotification(message=message)
        for cb in self._callbacks:
            cb(notification)
        self.pause(PauseType.PAUSE)

    def resume(self, pause_type: PauseType) -> None:
        """
        Resume motion after a call to :py:meth:`pause`.
        """
        self._pause_manager.resume(pause_type)

        if self._pause_manager.should_pause:
            return

        # Resume must be called immediately to awaken thread running hardware
        #  methods (ThreadManager)
        self._backend.resume()

        async def _chained_calls() -> None:
            # mirror what happens API.pause.
            await self._execution_manager.resume()
            self._backend.resume()

        asyncio.run_coroutine_threadsafe(_chained_calls(), self._loop)

    async def halt(self) -> None:
        """Immediately stop motion."""
        await self._backend.hard_halt()
        asyncio.run_coroutine_threadsafe(self._execution_manager.cancel(), self._loop)

    async def stop(self, home_after: bool = True) -> None:
        """Stop motion as soon as possible, reset, and optionally home."""
        await self._backend.halt()
        self._log.info("Recovering from halt")
        await self.reset()

        # TODO: (2022-11-21 AA) remove this logic when encoder is added to the gripper
        # Always refresh gripper z position as a safeguard, since we don't have an
        # encoder position for reference
        await self.home_z(OT3Mount.GRIPPER)

        if home_after:
            await self.home()

    async def reset(self) -> None:
        """Reset the stored state of the system."""
        self._pause_manager.reset()
        await self._execution_manager.reset()
        await self._pipette_handler.reset()
        await self._gripper_handler.reset()
        await self.cache_instruments()

    # Gantry/frame (i.e. not pipette) action API
    # TODO(mc, 2022-07-25): add "home both if necessary" functionality
    # https://github.com/Opentrons/opentrons/pull/11072
    async def home_z(
        self,
        mount: Optional[Union[top_types.Mount, OT3Mount]] = None,
        allow_home_other: bool = True,
    ) -> None:
        """Home all of the z-axes."""
        self._reset_last_mount()
        if isinstance(mount, (top_types.Mount, OT3Mount)):
            axes = [OT3Axis.by_mount(mount)]
        else:
            axes = list(OT3Axis.mount_axes())
        await self.home(axes)

    async def home_gripper_jaw(self) -> None:
        """
        Home the jaw of the gripper.
        """
        gripper = self._gripper_handler.get_gripper()
        dc = self._gripper_handler.get_duty_cycle_by_grip_force(
            gripper.default_home_force
        )
        await self._ungrip(duty_cycle=dc)
        gripper.state = GripperJawState.HOMED_READY

    async def home_plunger(self, mount: Union[top_types.Mount, OT3Mount]) -> None:
        """
        Home the plunger motor for a mount, and then return it to the 'bottom'
        position.
        """

        checked_mount = OT3Mount.from_mount(mount)
        await self.home([OT3Axis.of_main_tool_actuator(checked_mount)])
        instr = self._pipette_handler.hardware_instruments[checked_mount]
        if instr:
            target_pos = target_position_from_plunger(
                checked_mount, instr.plunger_positions.bottom, self._current_position
            )
            self._log.info("Attempting to move the plunger to bottom.")
            await self._move(target_pos, acquire_lock=False, home_flagged_axes=False)
            await self.current_position_ot3(mount=checked_mount, refresh=True)

    @lru_cache(1)
    def _carriage_offset(self) -> top_types.Point:
        return top_types.Point(*self._config.carriage_offset)

    async def current_position(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
        fail_on_not_homed: bool = False,
    ) -> Dict[Axis, float]:
        realmount = OT3Mount.from_mount(mount)
        ot3_pos = await self.current_position_ot3(
            realmount, critical_point, refresh, fail_on_not_homed
        )
        return self._axis_map_from_ot3axis_map(ot3_pos)

    async def current_position_ot3(
        self,
        mount: OT3Mount,
        critical_point: Optional[CriticalPoint] = None,
        # TODO(mc, 2021-11-15): combine with `refresh` for more reliable
        # position reporting when motors are not homed
        refresh: bool = False,
        fail_on_not_homed: bool = False,
    ) -> Dict[OT3Axis, float]:
        """Return the postion (in deck coords) of the critical point of the
        specified mount.
        """
        z_ax = OT3Axis.by_mount(mount)
        plunger_ax = OT3Axis.of_main_tool_actuator(mount)
        position_axes = [OT3Axis.X, OT3Axis.Y, z_ax, plunger_ax]

        if fail_on_not_homed and (
            not self._backend.check_ready_for_movement(position_axes)
            or not self._current_position
        ):
            raise MustHomeError(
                f"Current position of {str(mount)} pipette is unknown, please home."
            )

        elif not self._current_position and not refresh:
            raise MustHomeError("Current position is unknown; please home motors.")

        if refresh:
            await self.refresh_current_position_ot3()
        return self._effector_pos_from_carriage_pos(
            OT3Mount.from_mount(mount), self._current_position, critical_point
        )

    async def refresh_current_position_ot3(self) -> Dict[OT3Axis, float]:
        """Requests the current position and updates _current_position."""
        async with self._motion_lock:
            await self._backend.update_motor_status()
            self._current_position = deck_from_machine(
                await self._backend.update_position(),
                self._transforms.deck_calibration.attitude,
                self._transforms.carriage_offset,
            )
        return self._current_position

    async def encoder_current_position(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
        fail_on_not_homed: bool = False,
    ) -> Dict[Axis, float]:
        """
        Return the encoder position in absolute deck coords specified mount.
        """
        ot3pos = await self.encoder_current_position_ot3(
            mount, critical_point, refresh, fail_on_not_homed
        )
        return {ot3ax.to_axis(): value for ot3ax, value in ot3pos.items()}

    async def encoder_current_position_ot3(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
        fail_on_not_homed: bool = False,
    ) -> Dict[OT3Axis, float]:
        """
        Return the encoder position in absolute deck coords specified mount.
        """
        z_ax = OT3Axis.by_mount(mount)
        plunger_ax = OT3Axis.of_main_tool_actuator(mount)
        position_axes = [OT3Axis.X, OT3Axis.Y, z_ax, plunger_ax]

        if fail_on_not_homed and (
            not self._backend.check_ready_for_movement(position_axes)
            or not self._encoder_current_position
        ):
            raise MustHomeError(
                f"Current position of {str(mount)} pipette is unknown, please home."
            )
        elif not self._encoder_current_position and not refresh:
            raise MustHomeError("Encoder position is unknown; please home motors.")
        async with self._motion_lock:
            self._encoder_current_position = deck_from_machine(
                await self._backend.update_encoder_position(),
                self._transforms.deck_calibration.attitude,
                self._transforms.carriage_offset,
            )
            ot3pos = self._effector_pos_from_carriage_pos(
                OT3Mount.from_mount(mount),
                self._encoder_current_position,
                critical_point,
            )
            return ot3pos

    def _effector_pos_from_carriage_pos(
        self,
        mount: OT3Mount,
        carriage_position: OT3AxisMap[float],
        critical_point: Optional[CriticalPoint],
    ) -> OT3AxisMap[float]:
        offset = offset_for_mount(
            mount,
            top_types.Point(*self._config.left_mount_offset),
            top_types.Point(*self._config.right_mount_offset),
            top_types.Point(*self._config.gripper_mount_offset),
        )
        cp = self.critical_point_for(mount, critical_point)
        z_ax = OT3Axis.by_mount(mount)
        plunger_ax = OT3Axis.of_main_tool_actuator(mount)

        return {
            OT3Axis.X: carriage_position[OT3Axis.X] + offset[0] + cp.x,
            OT3Axis.Y: carriage_position[OT3Axis.Y] + offset[1] + cp.y,
            z_ax: carriage_position[z_ax] + offset[2] + cp.z,
            plunger_ax: carriage_position[plunger_ax],
        }

    async def gantry_position(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
        # TODO(mc, 2021-11-15): combine with `refresh` for more reliable
        # position reporting when motors are not homed
        fail_on_not_homed: bool = False,
    ) -> top_types.Point:
        """Return the position of the critical point as pertains to the gantry."""
        realmount = OT3Mount.from_mount(mount)
        cur_pos = await self.current_position_ot3(
            realmount,
            critical_point,
            refresh,
            fail_on_not_homed,
        )
        return top_types.Point(
            x=cur_pos[OT3Axis.X],
            y=cur_pos[OT3Axis.Y],
            z=cur_pos[OT3Axis.by_mount(realmount)],
        )

    async def move_to(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        abs_position: top_types.Point,
        speed: Optional[float] = None,
        critical_point: Optional[CriticalPoint] = None,
        max_speeds: Union[None, Dict[Axis, float], OT3AxisMap[float]] = None,
        _check_stalls: bool = False,  # For testing only
    ) -> None:
        """Move the critical point of the specified mount to a location
        relative to the deck, at the specified speed."""
        realmount = OT3Mount.from_mount(mount)

        # Refresh current position
        await self.refresh_current_position_ot3()

        axes_moving = [OT3Axis.X, OT3Axis.Y, OT3Axis.by_mount(mount)]
        if not self._backend.check_ready_for_movement(axes_moving):
            await self.home(axes_moving)

        target_position = target_position_from_absolute(
            realmount,
            abs_position,
            partial(self.critical_point_for, cp_override=critical_point),
            top_types.Point(*self._config.left_mount_offset),
            top_types.Point(*self._config.right_mount_offset),
            top_types.Point(*self._config.gripper_mount_offset),
        )
        if max_speeds:
            checked_max: Optional[OT3AxisMap[float]] = {
                OT3Axis.from_axis(k): v for k, v in max_speeds.items()
            }
        else:
            checked_max = None

        await self._cache_and_maybe_retract_mount(realmount)
        await self._move_gripper_to_idle_position(realmount)
        await self._move(
            target_position,
            speed=speed,
            max_speeds=checked_max,
            check_stalls=_check_stalls,
        )

    async def move_rel(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        delta: top_types.Point,
        speed: Optional[float] = None,
        max_speeds: Union[None, Dict[Axis, float], OT3AxisMap[float]] = None,
        check_bounds: MotionChecks = MotionChecks.NONE,
        fail_on_not_homed: bool = False,
        _check_stalls: bool = False,  # For testing only
    ) -> None:
        """Move the critical point of the specified mount by a specified
        displacement in a specified direction, at the specified speed."""

        # TODO: Remove the fail_on_not_homed and make this the behavior all the time.
        # Having the optional arg makes the bug stick around in existing code and we
        # really want to fix it when we're not gearing up for a release.
        mhe = MustHomeError(
            "Cannot make a relative move because absolute position is unknown"
        )

        realmount = OT3Mount.from_mount(mount)
        axes_moving = [OT3Axis.X, OT3Axis.Y, OT3Axis.by_mount(mount)]
        if not self._backend.check_ready_for_movement([axis for axis in axes_moving]):
            if fail_on_not_homed:
                raise mhe
            else:
                await self.home(axes_moving)
        # Refresh current position
        position = await self.refresh_current_position_ot3()
        target_position = target_position_from_relative(realmount, delta, position)
        if fail_on_not_homed and not self._backend.check_ready_for_movement(
            [axis for axis in axes_moving if axis is not None]
        ):
            raise mhe
        if max_speeds:
            checked_max: Optional[OT3AxisMap[float]] = {
                OT3Axis.from_axis(k): v for k, v in max_speeds.items()
            }
        else:
            checked_max = None
        await self._cache_and_maybe_retract_mount(realmount)
        await self._move_gripper_to_idle_position(realmount)
        await self._move(
            target_position,
            speed=speed,
            max_speeds=checked_max,
            check_bounds=check_bounds,
            check_stalls=_check_stalls,
        )

    async def _cache_and_maybe_retract_mount(self, mount: OT3Mount) -> None:
        """Retract the 'other' mount if necessary

        If `mount` does not match the value in :py:attr:`_last_moved_mount`
        (and :py:attr:`_last_moved_mount` exists) then retract the mount
        in :py:attr:`_last_moved_mount`. Also unconditionally update
        :py:attr:`_last_moved_mount` to contain `mount`.
        """
        if mount != self._last_moved_mount and self._last_moved_mount:
            await self.retract(self._last_moved_mount, 10)
        self._last_moved_mount = mount

    async def _move_gripper_to_idle_position(self, mount_in_use: OT3Mount) -> None:
        """Move gripper to its idle, gripped position.

        If the gripper is not currently in use, puts its jaws in a low-current,
        gripped position. Experimental behavior in order to prevent gripper jaws
        from colliding into thermocycler lid & lid latch clips.
        """
        # TODO: see https://opentrons.atlassian.net/browse/RLAB-214
        if (
            self._gripper_handler.gripper
            and mount_in_use != OT3Mount.GRIPPER
            and self._gripper_handler.gripper.state != GripperJawState.GRIPPING
        ):
            if self._gripper_handler.gripper.state == GripperJawState.UNHOMED:
                self._log.warning(
                    "Gripper jaw is not homed. Can't be moved to idle position"
                )
            else:
                # allows for safer gantry movement at minimum force
                await self.grip(force_newtons=IDLE_STATE_GRIP_FORCE)

    @ExecutionManagerProvider.wait_for_running
    async def _move(
        self,
        target_position: "OrderedDict[OT3Axis, float]",
        speed: Optional[float] = None,
        home_flagged_axes: bool = True,
        max_speeds: Optional[OT3AxisMap[float]] = None,
        acquire_lock: bool = True,
        check_bounds: MotionChecks = MotionChecks.NONE,
        check_stalls: bool = False,
    ) -> None:
        """Worker function to apply robot motion."""
        machine_pos = machine_from_deck(
            target_position,
            self._transforms.deck_calibration.attitude,
            self._transforms.carriage_offset,
        )
        bounds = self._backend.axis_bounds
        to_check = {
            ax: machine_pos[ax]
            for ax in target_position.keys()
            if ax in OT3Axis.gantry_axes()
        }
        check_motion_bounds(to_check, target_position, bounds, check_bounds)
        # TODO: (2022-02-10) Use actual max speed for MoveTarget
        checked_speed = speed or 400
        self._move_manager.update_constraints(
            get_system_constraints(self._config.motion_settings, self._gantry_load)
        )
        move_target = MoveTarget.build(position=machine_pos, max_speed=checked_speed)
        origin = await self._backend.update_position()
        try:
            blended, moves = self._move_manager.plan_motion(
                origin=origin, target_list=[move_target]
            )
        except ZeroLengthMoveError as zero_length_error:
            self._log.info(f"{str(zero_length_error)}, ignoring")
            return
        self._log.info(
            f"move: {target_position} becomes {machine_pos} from {origin} "
            f"requiring {moves}"
        )
        async with contextlib.AsyncExitStack() as stack:
            if acquire_lock:
                await stack.enter_async_context(self._motion_lock)
            try:
                await self._backend.move(
                    origin,
                    moves[0],
                    MoveStopCondition.stall if check_stalls else MoveStopCondition.none,
                )
                encoder_machine_pos = await self._backend.update_encoder_position()
            except Exception:
                self._log.exception("Move failed")
                self._current_position.clear()
                raise
            else:
                self._current_position.update(target_position)
                encoder_position = deck_from_machine(
                    encoder_machine_pos,
                    self._transforms.deck_calibration.attitude,
                    self._transforms.carriage_offset,
                )
                self._encoder_current_position.update(encoder_position)

    @ExecutionManagerProvider.wait_for_running
    async def home(
        self, axes: Optional[Union[List[Axis], List[OT3Axis]]] = None
    ) -> None:
        """
        Worker function to home the robot by axis or list of
        desired axes.
        """

        self._reset_last_mount()
        if axes:
            checked_axes = [OT3Axis.from_axis(ax) for ax in axes]
        else:
            checked_axes = [ax for ax in OT3Axis if ax != OT3Axis.Q]
        if self.gantry_load == GantryLoad.HIGH_THROUGHPUT:
            checked_axes.append(OT3Axis.Q)
        self._log.info(f"Homing {axes}")
        async with self._motion_lock:
            try:
                await self._backend.home(checked_axes)
            except MoveConditionNotMet:
                self._log.exception("Homing failed")
                self._current_position.clear()
                raise
            else:
                machine_pos = await self._backend.update_position()
                encoder_machine_pos = await self._backend.update_encoder_position()
                position = deck_from_machine(
                    machine_pos,
                    self._transforms.deck_calibration.attitude,
                    self._transforms.carriage_offset,
                )
                self._current_position.update(position)
                encoder_position = deck_from_machine(
                    encoder_machine_pos,
                    self._transforms.deck_calibration.attitude,
                    self._transforms.carriage_offset,
                )
                self._encoder_current_position.update(encoder_position)
                if OT3Axis.G in checked_axes:
                    try:
                        gripper = self._gripper_handler.get_gripper()
                        gripper.state = GripperJawState.HOMED_READY
                        gripper.current_jaw_displacement = encoder_position[OT3Axis.G]
                    except GripperNotAttachedError:
                        pass

    def get_engaged_axes(self) -> Dict[Axis, bool]:
        """Which axes are engaged and holding."""
        return self._axis_map_from_ot3axis_map(self._backend.engaged_axes())

    @property
    def engaged_axes(self) -> Dict[Axis, bool]:
        return self.get_engaged_axes()

    async def disengage_axes(self, which: Union[List[Axis], List[OT3Axis]]) -> None:
        axes = [OT3Axis.from_axis(ax) for ax in which]
        await self._backend.disengage_axes(axes)

    async def engage_axes(self, which: Union[List[Axis], List[OT3Axis]]) -> None:
        axes = [OT3Axis.from_axis(ax) for ax in which]
        await self._backend.engage_axes(axes)

    async def get_limit_switches(self) -> Dict[OT3Axis, bool]:
        res = await self._backend.get_limit_switches()
        return {ax: val for ax, val in res.items()}

    async def _fast_home(
        self, axes: Sequence[OT3Axis], margin: float
    ) -> OT3AxisMap[float]:
        return await self._backend.fast_home(axes, margin)

    @ExecutionManagerProvider.wait_for_running
    async def retract(
        self, mount: Union[top_types.Mount, OT3Mount], margin: float = 10
    ) -> None:
        """Pull the specified mount up to its home position.

        Works regardless of critical point or home status.
        """
        machine_ax = OT3Axis.by_mount(mount)

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

    async def update_config(self, **kwargs: Any) -> None:
        """Update values of the robot's configuration."""
        self._config = replace(self._config, **kwargs)

    async def update_deck_calibration(self, new_transform: RobotCalibration) -> None:
        pass

    @ExecutionManagerProvider.wait_for_running
    async def _grip(self, duty_cycle: float) -> None:
        """Move the gripper jaw inward to close."""
        try:
            await self._backend.gripper_grip_jaw(duty_cycle=duty_cycle)
            encoder_pos = await self._backend.update_encoder_position()
            self._encoder_current_position = deck_from_machine(
                encoder_pos,
                self._transforms.deck_calibration.attitude,
                self._transforms.carriage_offset,
            )
            self._gripper_handler.set_jaw_displacement(
                self._encoder_current_position[OT3Axis.G]
            )
        except Exception:
            self._log.exception(
                f"Gripper grip failed, encoder pos: {self._encoder_current_position[OT3Axis.G]}"
            )
            raise

    @ExecutionManagerProvider.wait_for_running
    async def _ungrip(self, duty_cycle: float) -> None:
        """Move the gripper jaw outward to reach the homing switch."""
        try:
            await self._backend.gripper_home_jaw(duty_cycle=duty_cycle)
            encoder_pos = await self._backend.update_encoder_position()
            self._encoder_current_position = deck_from_machine(
                encoder_pos,
                self._transforms.deck_calibration.attitude,
                self._transforms.carriage_offset,
            )
            self._gripper_handler.set_jaw_displacement(
                self._encoder_current_position[OT3Axis.G]
            )
        except Exception:
            self._log.exception("Gripper home failed")
            raise

    @ExecutionManagerProvider.wait_for_running
    async def _hold_jaw_width(self, jaw_width_mm: float) -> None:
        """Move the gripper jaw to a specific width."""
        try:
            if not self._gripper_handler.is_valid_jaw_width(jaw_width_mm):
                raise ValueError("Setting gripper jaw width out of bounds")
            await self._backend.gripper_hold_jaw(
                int(
                    1000
                    * (
                        self._gripper_handler.get_gripper().config.geometry.jaw_width[
                            "max"
                        ]
                        - jaw_width_mm
                    )
                    / 2
                )
            )
            encoder_pos = await self._backend.update_encoder_position()
            self._encoder_current_position = deck_from_machine(
                encoder_pos,
                self._transforms.deck_calibration.attitude,
                self._transforms.carriage_offset,
            )
            self._gripper_handler.set_jaw_displacement(
                self._encoder_current_position[OT3Axis.G]
            )
        except Exception:
            self._log.exception("Gripper set width failed")
            raise

    async def grip(self, force_newtons: Optional[float] = None) -> None:
        self._gripper_handler.check_ready_for_jaw_move()
        dc = self._gripper_handler.get_duty_cycle_by_grip_force(
            force_newtons or self._gripper_handler.get_gripper().default_grip_force
        )
        await self._grip(duty_cycle=dc)
        self._gripper_handler.set_jaw_state(GripperJawState.GRIPPING)

    async def ungrip(self, force_newtons: Optional[float] = None) -> None:
        # get default grip force for release if not provided
        self._gripper_handler.check_ready_for_jaw_move()
        dc = self._gripper_handler.get_duty_cycle_by_grip_force(
            force_newtons or self._gripper_handler.get_gripper().default_home_force
        )
        await self._ungrip(duty_cycle=dc)
        self._gripper_handler.set_jaw_state(GripperJawState.HOMED_READY)

    async def hold_jaw_width(self, jaw_width_mm: int) -> None:
        self._gripper_handler.check_ready_for_jaw_move()
        await self._hold_jaw_width(jaw_width_mm)
        self._gripper_handler.set_jaw_state(GripperJawState.HOLDING_CLOSED)

    # Pipette action API
    async def prepare_for_aspirate(
        self, mount: Union[top_types.Mount, OT3Mount], rate: float = 1.0
    ) -> None:
        """Prepare the pipette for aspiration."""
        checked_mount = OT3Mount.from_mount(mount)
        instrument = self._pipette_handler.get_pipette(checked_mount)

        self._pipette_handler.ready_for_tip_action(
            instrument, HardwareAction.PREPARE_ASPIRATE
        )

        if instrument.current_volume == 0:
            speed = self._pipette_handler.plunger_speed(
                instrument, instrument.blow_out_flow_rate, "aspirate"
            )
            bottom = instrument.plunger_positions.bottom
            target_pos = target_position_from_plunger(
                OT3Mount.from_mount(mount), bottom, self._current_position
            )
            await self._move(
                target_pos,
                speed=(speed * rate),
                home_flagged_axes=False,
            )
            instrument.ready_to_aspirate = True

    async def aspirate(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        volume: Optional[float] = None,
        rate: float = 1.0,
    ) -> None:
        """
        Aspirate a volume of liquid (in microliters/uL) using this pipette."""
        realmount = OT3Mount.from_mount(mount)
        aspirate_spec = self._pipette_handler.plan_check_aspirate(
            realmount, volume, rate
        )
        if not aspirate_spec:
            return
        target_pos = target_position_from_plunger(
            realmount,
            aspirate_spec.plunger_distance,
            self._current_position,
        )

        try:
            await self._backend.set_active_current(
                {OT3Axis.from_axis(aspirate_spec.axis): aspirate_spec.current}
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
        mount: Union[top_types.Mount, OT3Mount],
        volume: Optional[float] = None,
        rate: float = 1.0,
    ) -> None:
        """
        Dispense a volume of liquid in microliters(uL) using this pipette."""
        realmount = OT3Mount.from_mount(mount)
        dispense_spec = self._pipette_handler.plan_check_dispense(
            realmount, volume, rate
        )
        if not dispense_spec:
            return
        target_pos = target_position_from_plunger(
            realmount,
            dispense_spec.plunger_distance,
            self._current_position,
        )

        try:
            await self._backend.set_active_current(
                {OT3Axis.from_axis(dispense_spec.axis): dispense_spec.current}
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

    async def blow_out(self, mount: Union[top_types.Mount, OT3Mount]) -> None:
        """
        Force any remaining liquid to dispense. The liquid will be dispensed at
        the current location of pipette
        """
        realmount = OT3Mount.from_mount(mount)
        blowout_spec = self._pipette_handler.plan_check_blow_out(realmount)
        await self._backend.set_active_current(
            {blowout_spec.axis: blowout_spec.current}
        )
        target_pos = target_position_from_plunger(
            realmount,
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

    async def _force_pick_up_tip(
        self, mount: OT3Mount, pipette_spec: PickUpTipSpec
    ) -> None:
        for press in pipette_spec.presses:
            async with self._backend.restore_current():
                await self._backend.set_active_current(
                    {axis: current for axis, current in press.current.items()}
                )
                target_down = target_position_from_relative(
                    mount, press.relative_down, self._current_position
                )
                await self._move(target_down, speed=press.speed)
            target_up = target_position_from_relative(
                mount, press.relative_up, self._current_position
            )
            await self._move(target_up)

    async def _motor_pick_up_tip(
        self, mount: OT3Mount, pipette_spec: TipMotorPickUpTipSpec
    ) -> None:
        async with self._backend.restore_current():
            await self._backend.set_active_current(
                {axis: current for axis, current in pipette_spec.currents.items()}
            )
            # Move to pick up position
            target_down = target_position_from_relative(
                mount,
                pipette_spec.tiprack_down,
                self._current_position,
            )
            await self._move(target_down)
            # perform pick up tip
            await self._backend.tip_action(
                [OT3Axis.of_main_tool_actuator(mount)],
                pipette_spec.pick_up_distance,
                pipette_spec.speed,
                "clamp",
            )
            # back clamps off the adapter posts
            await self._backend.tip_action(
                [OT3Axis.of_main_tool_actuator(mount)],
                pipette_spec.pick_up_distance,
                pipette_spec.speed,
                "home",
            )

    async def pick_up_tip(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        tip_length: float,
        presses: Optional[int] = None,
        increment: Optional[float] = None,
        prep_after: bool = True,
    ) -> None:
        """Pick up tip from current location."""
        realmount = OT3Mount.from_mount(mount)
        spec, _add_tip_to_instrs = self._pipette_handler.plan_check_pick_up_tip(
            realmount, tip_length, presses, increment
        )

        if spec.pick_up_motor_actions:
            await self._motor_pick_up_tip(realmount, spec.pick_up_motor_actions)
        else:
            await self._force_pick_up_tip(realmount, spec)

        # neighboring tips tend to get stuck in the space between
        # the volume chamber and the drop-tip sleeve on p1000.
        # This extra shake ensures those tips are removed
        for rel_point, speed in spec.shake_off_list:
            await self.move_rel(realmount, rel_point, speed=speed)
        # Here we add in the debounce distance for the switch as
        # a safety precaution
        await self.retract(realmount, spec.retract_target)

        _add_tip_to_instrs()

        if prep_after:
            await self.prepare_for_aspirate(realmount)

    def set_current_tiprack_diameter(
        self, mount: Union[top_types.Mount, OT3Mount], tiprack_diameter: float
    ) -> None:
        instrument = self._pipette_handler.get_pipette(OT3Mount.from_mount(mount))
        self._log.info(
            "Updating tip rack diameter on pipette mount: "
            f"{mount.name}, tip diameter: {tiprack_diameter} mm"
        )
        instrument.current_tiprack_diameter = tiprack_diameter

    def set_working_volume(
        self, mount: Union[top_types.Mount, OT3Mount], tip_volume: float
    ) -> None:
        instrument = self._pipette_handler.get_pipette(OT3Mount.from_mount(mount))
        self._log.info(
            "Updating working volume on pipette mount:"
            f"{mount.name}, tip volume: {tip_volume} ul"
        )
        instrument.working_volume = tip_volume

    async def drop_tip(
        self, mount: Union[top_types.Mount, OT3Mount], home_after: bool = True
    ) -> None:
        """Drop tip at the current location."""
        realmount = OT3Mount.from_mount(mount)
        spec, _remove = self._pipette_handler.plan_check_drop_tip(realmount, home_after)
        for move in spec.drop_moves:
            await self._backend.set_active_current(
                {
                    OT3Axis.from_axis(axis): current
                    for axis, current in move.current.items()
                }
            )

            if move.is_ht_tip_action and move.speed:
                # The speed check is needed because speed can sometimes be None.
                # Not sure why
                await self._backend.tip_action(
                    [OT3Axis.of_main_tool_actuator(mount)],
                    move.target_position,
                    move.speed,
                    "clamp",
                )
                await self._backend.tip_action(
                    [OT3Axis.of_main_tool_actuator(mount)],
                    move.target_position,
                    move.speed,
                    "home",
                )
            else:
                target_pos = target_position_from_plunger(
                    realmount, move.target_position, self._current_position
                )
                await self._move(
                    target_pos,
                    speed=move.speed,
                    home_flagged_axes=False,
                )
            if move.home_after:
                machine_pos = await self._backend.fast_home(
                    [OT3Axis.from_axis(ax) for ax in move.home_axes],
                    move.home_after_safety_margin,
                )
                self._current_position = deck_from_machine(
                    machine_pos,
                    self._transforms.deck_calibration.attitude,
                    self._transforms.carriage_offset,
                )

        for shake in spec.shake_moves:
            await self.move_rel(mount, shake[0], speed=shake[1])

        await self._backend.set_active_current(
            {
                OT3Axis.from_axis(axis): current
                for axis, current in spec.ending_current.items()
            }
        )
        _remove()

    async def clean_up(self) -> None:
        """Get the API ready to stop cleanly."""
        await self._backend.clean_up()

    def critical_point_for(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        cp_override: Optional[CriticalPoint] = None,
    ) -> top_types.Point:
        if mount == OT3Mount.GRIPPER:
            return self._gripper_handler.get_critical_point(cp_override)
        else:
            return self._pipette_handler.critical_point_for(
                OT3Mount.from_mount(mount), cp_override
            )

    @property
    def hardware_pipettes(self) -> InstrumentsByMount[top_types.Mount]:
        # TODO (lc 12-5-2022) We should have ONE entry point into knowing
        # what pipettes are attached from the hardware controller.
        return {
            m.to_mount(): i
            for m, i in self._pipette_handler.hardware_instruments.items()
            if m != OT3Mount.GRIPPER
        }

    @property
    def hardware_instruments(self) -> InstrumentsByMount[top_types.Mount]:  # type: ignore
        # see comment in `protocols.instrument_configurer`
        # override required for type matching
        # Warning: don't use this in new code, used `hardware_pipettes` instead
        return self.hardware_pipettes

    def get_attached_pipettes(self) -> Dict[top_types.Mount, PipetteDict]:
        return {
            m.to_mount(): pd
            for m, pd in self._pipette_handler.get_attached_instruments().items()
            if m != OT3Mount.GRIPPER
        }

    def get_attached_instruments(self) -> Dict[top_types.Mount, PipetteDict]:
        # Warning: don't use this in new code, used `get_attached_pipettes` instead
        return self.get_attached_pipettes()

    def reset_instrument(
        self, mount: Union[top_types.Mount, OT3Mount, None] = None
    ) -> None:
        if mount:
            checked_mount: Optional[OT3Mount] = OT3Mount.from_mount(mount)
        else:
            checked_mount = None
        if checked_mount == OT3Mount.GRIPPER:
            self._gripper_handler.reset_gripper()
        else:
            self._pipette_handler.reset_instrument(checked_mount)

    async def reset_instrument_offset(
        self, mount: Union[top_types.Mount, OT3Mount], to_default: bool = True
    ) -> None:
        """Reset the given instrument to system offsets."""
        checked_mount = OT3Mount.from_mount(mount)
        if checked_mount == OT3Mount.GRIPPER:
            self._gripper_handler.reset_instrument_offset(to_default)
        else:
            self._pipette_handler.reset_instrument_offset(checked_mount, to_default)

    async def save_instrument_offset(
        self, mount: Union[top_types.Mount, OT3Mount], delta: top_types.Point
    ) -> Union[GripperCalibrationOffset, PipetteOffsetByPipetteMount]:
        """Save a new offset for a given instrument."""
        checked_mount = OT3Mount.from_mount(mount)
        if checked_mount == OT3Mount.GRIPPER:
            self._log.info(f"Saving instrument offset: {delta} for gripper")
            return self._gripper_handler.save_instrument_offset(delta)
        else:
            return self._pipette_handler.save_instrument_offset(checked_mount, delta)

    def get_attached_pipette(
        self, mount: Union[top_types.Mount, OT3Mount]
    ) -> PipetteDict:
        return self._pipette_handler.get_attached_instrument(OT3Mount.from_mount(mount))

    def get_attached_instrument(
        self, mount: Union[top_types.Mount, OT3Mount]
    ) -> PipetteDict:
        # Warning: don't use this in new code, used `get_attached_pipette` instead
        return self.get_attached_pipette(mount)

    @property
    def attached_instruments(self) -> Any:
        # Warning: don't use this in new code, used `attached_pipettes` instead
        return self.attached_pipettes

    @property
    def attached_pipettes(self) -> Dict[top_types.Mount, PipetteDict]:
        return {
            m.to_mount(): d
            for m, d in self._pipette_handler.attached_instruments.items()
            if m != OT3Mount.GRIPPER
        }

    @property
    def attached_gripper(self) -> Optional[GripperDict]:
        return self._gripper_handler.get_gripper_dict()

    def has_gripper(self) -> bool:
        return self._gripper_handler.has_gripper()

    def calibrate_plunger(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        top: Optional[float] = None,
        bottom: Optional[float] = None,
        blow_out: Optional[float] = None,
        drop_tip: Optional[float] = None,
    ) -> None:
        self._pipette_handler.calibrate_plunger(
            OT3Mount.from_mount(mount), top, bottom, blow_out, drop_tip
        )

    def set_flow_rate(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        return self._pipette_handler.set_flow_rate(
            OT3Mount.from_mount(mount), aspirate, dispense, blow_out
        )

    def set_pipette_speed(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        self._pipette_handler.set_pipette_speed(
            OT3Mount.from_mount(mount), aspirate, dispense, blow_out
        )

    def get_instrument_max_height(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        critical_point: Optional[CriticalPoint] = None,
    ) -> float:
        carriage_pos = deck_from_machine(
            self._backend.home_position(),
            self._transforms.deck_calibration.attitude,
            self._transforms.carriage_offset,
        )
        pos_at_home = self._effector_pos_from_carriage_pos(
            OT3Mount.from_mount(mount), carriage_pos, critical_point
        )

        return pos_at_home[OT3Axis.by_mount(mount)] - self._config.z_retract_distance

    async def add_tip(
        self, mount: Union[top_types.Mount, OT3Mount], tip_length: float
    ) -> None:
        await self._pipette_handler.add_tip(OT3Mount.from_mount(mount), tip_length)

    async def remove_tip(self, mount: Union[top_types.Mount, OT3Mount]) -> None:
        await self._pipette_handler.remove_tip(OT3Mount.from_mount(mount))

    def add_gripper_probe(self, probe: GripperProbe) -> None:
        self._gripper_handler.add_probe(probe)

    def remove_gripper_probe(self) -> None:
        self._gripper_handler.remove_probe()

    async def liquid_probe(
        self,
        mount: OT3Mount,
        probe_settings: Optional[LiquidProbeSettings] = None,
    ) -> float:
        """Search for and return liquid level height.

        This function begins by moving the mount the distance specified by starting_mount_height in the
        LiquidProbeSettings. After this, the mount and plunger motors will move simultaneously while
        reading from the pressure sensor.

        If the move is completed without the specified threshold being triggered, a
        LiquidNotFound error will be thrown.
        If the threshold is triggered before the minimum z distance has been traveled,
        a EarlyLiquidSenseTrigger error will be thrown.

        Otherwise, the function will stop moving once the threshold is triggered,
        and return the position of the
        z axis in deck coordinates, as well as the encoder position, where
        the liquid was found.
        """

        checked_mount = OT3Mount.from_mount(mount)
        instrument = self._pipette_handler.get_pipette(checked_mount)
        self._pipette_handler.ready_for_tip_action(
            instrument, HardwareAction.LIQUID_PROBE
        )

        if not probe_settings:
            probe_settings = self.config.liquid_sense
        mount_axis = OT3Axis.by_mount(mount)

        gantry_position = await self.gantry_position(mount, refresh=True)

        await self.move_to(
            mount,
            top_types.Point(
                x=gantry_position.x,
                y=gantry_position.y,
                z=probe_settings.starting_mount_height,
            ),
        )

        if probe_settings.aspirate_while_sensing:
            await self.home_plunger(mount)

        plunger_direction = -1 if probe_settings.aspirate_while_sensing else 1

        machine_pos_node_id = await self._backend.liquid_probe(
            mount,
            probe_settings.max_z_distance,
            probe_settings.mount_speed,
            (probe_settings.plunger_speed * plunger_direction),
            probe_settings.sensor_threshold_pascals,
            probe_settings.log_pressure,
        )
        machine_pos = axis_convert(machine_pos_node_id, 0.0)
        position = deck_from_machine(
            machine_pos,
            self._transforms.deck_calibration.attitude,
            self._transforms.carriage_offset,
        )
        z_distance_traveled = (
            position[mount_axis] - probe_settings.starting_mount_height
        )
        if z_distance_traveled < probe_settings.min_z_distance:
            min_z_travel_pos = position
            min_z_travel_pos[mount_axis] = probe_settings.min_z_distance
            raise EarlyLiquidSenseTrigger(
                triggered_at=position,
                min_z_pos=min_z_travel_pos,
            )
        elif z_distance_traveled > probe_settings.max_z_distance:
            max_z_travel_pos = position
            max_z_travel_pos[mount_axis] = probe_settings.max_z_distance
            raise LiquidNotFound(
                position=position,
                max_z_pos=max_z_travel_pos,
            )

        return position[mount_axis]

    async def capacitive_probe(
        self,
        mount: OT3Mount,
        moving_axis: OT3Axis,
        target_pos: float,
        pass_settings: CapacitivePassSettings,
    ) -> float:
        """Determine the position of something using the capacitive sensor.

        This function orchestrates detecting the position of a collision between the
        capacitive probe on the tool on the specified mount, and some fixed element
        of the robot.

        When calling this function, the mount's probe critical point should already
        be aligned in the probe axis with the item to be probed.

        It will move the mount's probe critical point to a small distance behind
        the expected position of the element (which is target_pos, in deck coordinates,
        in the axis to be probed) while running the tool's capacitive sensor. When the
        sensor senses contact, the mount stops.

        This function moves away and returns the sensed position.

        This sensed position can be used in several ways, including
        - To get an absolute position in deck coordinates of whatever was
        targeted, if something was guaranteed to be physically present.
        - To detect whether a collision occured at all. If this function
        returns a value far enough past the anticipated position, then it indicates
        there was no material there.
        """
        if moving_axis not in [
            OT3Axis.X,
            OT3Axis.Y,
        ] and moving_axis != OT3Axis.by_mount(mount):
            raise RuntimeError(
                "Probing must be done with a gantry axis or the mount of the sensing"
                " tool"
            )

        here = await self.gantry_position(mount, refresh=True)
        origin_pos = moving_axis.of_point(here)
        if origin_pos < target_pos:
            pass_start = target_pos - pass_settings.prep_distance_mm
            pass_distance = (
                pass_settings.prep_distance_mm + pass_settings.max_overrun_distance_mm
            )
        else:
            pass_start = target_pos + pass_settings.prep_distance_mm
            pass_distance = -1.0 * (
                pass_settings.prep_distance_mm + pass_settings.max_overrun_distance_mm
            )
        machine_pass_distance = moving_axis.of_point(
            machine_vector_from_deck_vector(
                moving_axis.set_in_point(top_types.Point(0, 0, 0), pass_distance),
                self._transforms.deck_calibration.attitude,
            )
        )
        pass_start_pos = moving_axis.set_in_point(here, pass_start)
        await self.move_to(mount, pass_start_pos)
        if mount == OT3Mount.GRIPPER:
            probe = self._gripper_handler.get_attached_probe()
            assert probe
            await self._backend.capacitive_probe(
                mount,
                moving_axis,
                machine_pass_distance,
                pass_settings.speed_mm_per_s,
                pass_settings.sensor_threshold_pf,
                GripperProbe.to_type(probe),
            )
        else:
            await self._backend.capacitive_probe(
                mount,
                moving_axis,
                machine_pass_distance,
                pass_settings.speed_mm_per_s,
                pass_settings.sensor_threshold_pf,
                probe=InstrumentProbeType.PRIMARY,
            )
        end_pos = await self.gantry_position(mount, refresh=True)
        await self.move_to(mount, pass_start_pos)
        return moving_axis.of_point(end_pos)

    async def capacitive_sweep(
        self,
        mount: OT3Mount,
        moving_axis: OT3Axis,
        begin: top_types.Point,
        end: top_types.Point,
        speed_mm_s: float,
    ) -> List[float]:
        if moving_axis not in [
            OT3Axis.X,
            OT3Axis.Y,
        ] and moving_axis != OT3Axis.by_mount(mount):
            raise RuntimeError(
                "Probing must be done with a gantry axis or the mount of the sensing"
                " tool"
            )
        sweep_distance = moving_axis.of_point(
            machine_vector_from_deck_vector(
                end - begin, self._transforms.deck_calibration.attitude
            )
        )

        await self.move_to(mount, begin)
        if mount == OT3Mount.GRIPPER:
            probe = self._gripper_handler.get_attached_probe()
            assert probe
            values = await self._backend.capacitive_pass(
                mount,
                moving_axis,
                sweep_distance,
                speed_mm_s,
                GripperProbe.to_type(probe),
            )
        else:
            values = await self._backend.capacitive_pass(
                mount,
                moving_axis,
                sweep_distance,
                speed_mm_s,
                probe=InstrumentProbeType.PRIMARY,
            )
        await self.move_to(mount, begin)
        return values

    AMKey = TypeVar("AMKey")

    @staticmethod
    def _axis_map_from_ot3axis_map(
        inval: Dict[OT3Axis, "OT3API.AMKey"]
    ) -> Dict[Axis, "OT3API.AMKey"]:
        ret: Dict[Axis, OT3API.AMKey] = {}
        for ax in Axis:
            try:
                ret[ax] = inval[OT3Axis.from_axis(ax)]
            except KeyError:
                pass
        return ret
