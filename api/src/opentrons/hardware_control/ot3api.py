import asyncio
from concurrent.futures import Future
import contextlib
from functools import partial, lru_cache
from dataclasses import replace
import logging
from copy import deepcopy
from collections import OrderedDict
from typing import (
    AsyncIterator,
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
    Tuple,
    Mapping,
)
from opentrons.hardware_control.modules.module_calibration import (
    ModuleCalibrationOffset,
)


from opentrons_shared_data.pipette.dev_types import (
    PipetteName,
)
from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
)
from opentrons_shared_data.gripper.constants import IDLE_STATE_GRIP_FORCE
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons import types as top_types
from opentrons.config import robot_configs
from opentrons.config.types import (
    RobotConfig,
    OT3Config,
    GantryLoad,
    CapacitivePassSettings,
    LiquidProbeSettings,
)
from opentrons.drivers.rpi_drivers.types import USBPort, PortGroup
from opentrons_hardware.hardware_control.motion_planning import (
    Move,
    MoveManager,
    MoveTarget,
    ZeroLengthMoveError,
)

from opentrons_hardware.hardware_control.motion import MoveStopCondition

from .util import use_or_initialize_loop, check_motion_bounds

from .instruments.ot3.pipette import (
    load_from_config_and_check_skip,
)
from .instruments.ot3.gripper import compare_gripper_config_and_check_skip, Gripper
from .instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset,
    PipetteOffsetByPipetteMount,
)
from .backends.ot3controller import OT3Controller
from .backends.ot3simulator import OT3Simulator
from .backends.ot3utils import (
    axis_convert,
    get_system_constraints,
    get_system_constraints_for_calibration,
    get_system_constraints_for_plunger_acceleration,
)
from .backends.errors import SubsystemUpdating
from .execution_manager import ExecutionManagerProvider
from .pause_manager import PauseManager
from .module_control import AttachedModulesControl
from .types import (
    CriticalPoint,
    DoorState,
    DoorStateNotification,
    ErrorMessageNotification,
    HardwareEvent,
    HardwareEventHandler,
    HardwareAction,
    MotionChecks,
    SubSystem,
    PauseType,
    Axis,
    OT3AxisKind,
    OT3Mount,
    OT3AxisMap,
    GripperJawState,
    InstrumentProbeType,
    GripperProbe,
    UpdateStatus,
    StatusBarState,
    SubSystemState,
    TipStateType,
    EstopOverallStatus,
    EstopAttachLocation,
    EstopStateNotification,
    EstopState,
)
from .errors import (
    MustHomeError,
    GripperNotAttachedError,
    AxisNotPresentError,
    UpdateOngoingError,
    FirmwareUpdateFailed,
)
from . import modules
from .ot3_calibration import OT3Transforms, OT3RobotCalibrationProvider

from .protocols import HardwareControlInterface

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
    AttachedPipette,
    PipetteDict,
    PipetteStateDict,
    InstrumentDict,
    GripperDict,
)


from .status_bar_state import StatusBarStateController

mod_log = logging.getLogger(__name__)

AXES_IN_HOMING_ORDER: Tuple[Axis, Axis, Axis, Axis, Axis, Axis, Axis, Axis, Axis] = (
    *Axis.ot3_mount_axes(),
    Axis.X,
    Axis.Y,
    *Axis.pipette_axes(),
    Axis.G,
    Axis.Q,
)


class OT3API(
    ExecutionManagerProvider,
    OT3RobotCalibrationProvider,
    # This MUST be kept last in the inheritance list so that it is
    # deprioritized in the method resolution order; otherwise, invocations
    # of methods that are present in the protocol will call the (empty,
    # do-nothing) methods in the protocol. This will happily make all the
    # tests fail.
    HardwareControlInterface[OT3Transforms],
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

        def estop_cb(event: HardwareEvent) -> None:
            self._update_estop_state(event)

        backend.estop_state_machine.add_listener(estop_cb)

        self._callbacks: Set[HardwareEventHandler] = set()
        # {'X': 0.0, 'Y': 0.0, 'Z': 0.0, 'A': 0.0, 'B': 0.0, 'C': 0.0}
        self._current_position: OT3AxisMap[float] = {}
        self._encoder_position: OT3AxisMap[float] = {}

        self._last_moved_mount: Optional[OT3Mount] = None
        # The motion lock synchronizes calls to long-running physical tasks
        # involved in motion. This fixes issue where for instance a move()
        # or home() call is in flight and something else calls
        # current_position(), which will not be updated until the move() or
        # home() call succeeds or fails.
        self._motion_lock = asyncio.Lock()
        self._door_state = DoorState.CLOSED
        self._pause_manager = PauseManager()
        self._gantry_load = GantryLoad.LOW_THROUGHPUT
        self._move_manager = MoveManager(
            constraints=get_system_constraints(
                self._config.motion_settings, self._gantry_load
            )
        )
        self._status_bar_controller = StatusBarStateController(
            self._backend.status_bar_interface()
        )

        self._pipette_handler = OT3PipetteHandler({m: None for m in OT3Mount})
        self._gripper_handler = GripperHandler(gripper=None)
        OT3RobotCalibrationProvider.__init__(self, self._config)
        ExecutionManagerProvider.__init__(self, isinstance(backend, OT3Simulator))

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

    async def set_system_constraints_for_calibration(self) -> None:
        self._move_manager.update_constraints(
            get_system_constraints_for_calibration(
                self._config.motion_settings, self._gantry_load
            )
        )
        mod_log.debug(
            f"Set system constraints for calibration: {self._move_manager.get_constraints()}"
        )

    async def set_system_constraints_for_plunger_acceleration(
        self, mount: OT3Mount, acceleration: float
    ) -> None:
        new_constraints = get_system_constraints_for_plunger_acceleration(
            self._config.motion_settings, self._gantry_load, mount, acceleration
        )
        self._move_manager.update_constraints(new_constraints)

    @contextlib.asynccontextmanager
    async def restore_system_constrants(self) -> AsyncIterator[None]:
        old_system_constraints = deepcopy(self._move_manager.get_constraints())
        try:
            yield
        finally:
            self._move_manager.update_constraints(old_system_constraints)
            mod_log.debug(
                f"Restore previous system constraints: {old_system_constraints}"
            )

    def _update_door_state(self, door_state: DoorState) -> None:
        mod_log.info(f"Updating the window switch status: {door_state}")
        self.door_state = door_state
        for cb in self._callbacks:
            hw_event = DoorStateNotification(new_state=door_state)
            try:
                cb(hw_event)
            except Exception:
                mod_log.exception("Errored during door state event callback")

    def _update_estop_state(self, event: HardwareEvent) -> "List[Future[None]]":
        if not isinstance(event, EstopStateNotification):
            return []
        mod_log.info(
            f"Updating the estop status from {event.old_state} to {event.new_state}"
        )
        futures: "List[Future[None]]" = []
        if (
            event.new_state == EstopState.PHYSICALLY_ENGAGED
            and event.old_state != EstopState.PHYSICALLY_ENGAGED
        ):
            # If the estop was just pressed, turn off every module.
            for mod in self._backend.module_controls.available_modules:
                futures.append(
                    asyncio.run_coroutine_threadsafe(
                        modules.utils.disable_module(mod), self._loop
                    )
                )
        for cb in self._callbacks:
            try:
                cb(event)
            except Exception:
                mod_log.exception("Errored during estop state event callback")

        return futures

    def _reset_last_mount(self) -> None:
        self._last_moved_mount = None

    def _deck_from_machine(self, machine_pos: Dict[Axis, float]) -> Dict[Axis, float]:
        return deck_from_machine(
            machine_pos=machine_pos,
            attitude=self._robot_calibration.deck_calibration.attitude,
            offset=self._robot_calibration.carriage_offset,
            robot_type=cast(RobotType, "OT-3 Standard"),
        )

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
        use_usb_bus: bool = False,
        update_firmware: bool = True,
        status_bar_enabled: bool = True,
    ) -> "OT3API":
        """Build an ot3 hardware controller."""
        checked_loop = use_or_initialize_loop(loop)
        if not isinstance(config, OT3Config):
            checked_config = robot_configs.load_ot3()
        else:
            checked_config = config
        backend = await OT3Controller.build(
            checked_config, use_usb_bus, check_updates=update_firmware
        )

        api_instance = cls(backend, loop=checked_loop, config=checked_config)

        await api_instance.set_status_bar_enabled(status_bar_enabled)
        module_controls = await AttachedModulesControl.build(
            api_instance, board_revision=backend.board_revision
        )
        backend.module_controls = module_controls
        await backend.build_estop_detector()
        door_state = await backend.door_state()
        api_instance._update_door_state(door_state)
        backend.add_door_state_listener(api_instance._update_door_state)
        checked_loop.create_task(backend.watch(loop=checked_loop))
        backend.initialized = True
        await api_instance.refresh_positions()
        return api_instance

    @classmethod
    async def build_hardware_simulator(
        cls,
        attached_instruments: Union[
            None,
            Dict[OT3Mount, Dict[str, Optional[str]]],
            Dict[top_types.Mount, Dict[str, Optional[str]]],
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

        checked_modules = attached_modules or []

        checked_loop = use_or_initialize_loop(loop)
        if not isinstance(config, OT3Config):
            checked_config = robot_configs.load_ot3()
        else:
            checked_config = config
        backend = await OT3Simulator.build(
            {OT3Mount.from_mount(k): v for k, v in attached_instruments.items()}
            if attached_instruments
            else {},
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
        await api_instance.refresh_positions()
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
        uniques = set(version for version in from_backend.values())
        if not from_backend:
            return "unknown"
        else:
            return ", ".join(str(version) for version in uniques)

    @property
    def fw_version(self) -> str:
        return self.get_fw_version()

    @property
    def board_revision(self) -> str:
        return str(self._backend.board_revision)

    async def update_firmware(
        self, subsystems: Optional[Set[SubSystem]] = None, force: bool = False
    ) -> AsyncIterator[UpdateStatus]:
        """Start the firmware update for one or more subsystems and return update progress iterator."""
        subsystems = subsystems or set()
        # start the updates and yield the progress
        try:
            async for update_status in self._backend.update_firmware(subsystems, force):
                yield update_status
        except SubsystemUpdating as e:
            raise UpdateOngoingError(e.msg) from e
        except Exception as e:
            mod_log.exception("Firmware update failed")
            raise FirmwareUpdateFailed() from e

    # Incidentals (i.e. not motion) API

    async def set_lights(
        self, button: Optional[bool] = None, rails: Optional[bool] = None
    ) -> None:
        """Control the robot lights."""
        await self._backend.set_lights(button, rails)

    async def get_lights(self) -> Dict[str, bool]:
        """Return the current status of the robot lights."""
        return await self._backend.get_lights()

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

    async def set_status_bar_state(self, state: StatusBarState) -> None:
        await self._status_bar_controller.set_status_bar_state(state)

    async def set_status_bar_enabled(self, enabled: bool) -> None:
        await self._status_bar_controller.set_enabled(enabled)

    def get_status_bar_state(self) -> StatusBarState:
        return self._status_bar_controller.get_current_state()

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
            usb_port=USBPort(name="", port_number=1, port_group=PortGroup.LEFT),
            type=modules.ModuleType.from_model(model),
            sim_model=model.value,
        )

    def _gantry_load_from_instruments(self) -> GantryLoad:
        """Compute the gantry load based on attached instruments."""
        left = self._pipette_handler.has_pipette(OT3Mount.LEFT)
        if left:
            pip = self._pipette_handler.get_pipette(OT3Mount.LEFT)
            if pip.config.channels > 8:
                return GantryLoad.HIGH_THROUGHPUT
        return GantryLoad.LOW_THROUGHPUT

    async def cache_pipette(
        self,
        mount: OT3Mount,
        instrument_data: AttachedPipette,
        req_instr: Optional[PipetteName],
    ) -> bool:
        """Set up pipette based on scanned information."""
        config = instrument_data.get("config")
        pip_id = instrument_data.get("id")
        pip_offset_cal = load_pipette_offset(pip_id, mount)

        p, skipped = load_from_config_and_check_skip(
            config,
            self._pipette_handler.hardware_instruments[mount],
            req_instr,
            pip_id,
            pip_offset_cal,
        )
        self._pipette_handler.hardware_instruments[mount] = p
        # TODO (lc 12-5-2022) Properly support backwards compatibility
        # when applicable
        return skipped

    async def cache_gripper(self, instrument_data: AttachedGripper) -> bool:
        """Set up gripper based on scanned information."""
        grip_cal = load_gripper_calibration_offset(instrument_data.get("id"))
        g, skipped = compare_gripper_config_and_check_skip(
            instrument_data,
            self._gripper_handler._gripper,
            grip_cal,
        )
        self._gripper_handler.gripper = g
        return skipped

    def get_all_attached_instr(self) -> Dict[OT3Mount, Optional[InstrumentDict]]:
        # NOTE (spp, 2023-03-07): The return type of this method indicates that
        #  if a particular mount has no attached instrument then it will provide a
        #  None value for that mount. But in reality, we get an empty dict.
        #  We should either not call the value Optional, or have `_attached_...` return
        #  a None for empty mounts.
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
        skip_configure = await self._cache_instruments(require)
        self._log.info(
            f"Instrument model cache updated, skip configure: {skip_configure}"
        )
        if not skip_configure:
            await self._configure_instruments()

    async def _cache_instruments(  # noqa: C901
        self, require: Optional[Dict[top_types.Mount, PipetteName]] = None
    ) -> bool:
        """Actually cache instruments and scan network.

        Returns True if nothing changed since the last call and can skip any follow-up
        configuration; False if we need to reconfigure.
        """
        checked_require = {
            OT3Mount.from_mount(m): v for m, v in (require or {}).items()
        }
        skip_configure = True
        for mount, name in checked_require.items():
            # TODO (lc 12-5-2022) cache instruments should be receiving
            # a pipette type / channels rather than the named config.
            # We should also check version here once we're comfortable.
            if not pipette_load_name.supported_pipette(name):
                raise RuntimeError(f"{name} is not a valid pipette name")
        async with self._motion_lock:
            # we're not actually checking the required instrument except in the context
            # of simulation and it feels like a lot of work for this function
            # actually be doing.
            found = await self._backend.get_attached_instruments(checked_require)

        if OT3Mount.GRIPPER in found.keys():
            # Is now a gripper, ask if it's ok to skip
            gripper_skip = await self.cache_gripper(
                cast(AttachedGripper, found.get(OT3Mount.GRIPPER))
            )
            skip_configure &= gripper_skip
            if not gripper_skip:
                self._log.info(
                    "cache_instruments: must configure because gripper now attached or changed config"
                )
        elif self._gripper_handler.gripper:
            # Is no gripper, have a cached gripper, definitely need to reconfig
            await self._gripper_handler.reset()
            skip_configure = False
            self._log.info("cache_instruments: must configure because gripper now gone")

        for pipette_mount in [OT3Mount.LEFT, OT3Mount.RIGHT]:
            if pipette_mount in found.keys():
                # is now a pipette, ask if we need to reconfig
                req_instr_name = checked_require.get(pipette_mount, None)
                pipette_skip = await self.cache_pipette(
                    pipette_mount,
                    cast(AttachedPipette, found.get(pipette_mount)),
                    req_instr_name,
                )
                skip_configure &= pipette_skip
                if not pipette_skip:
                    self._log.info(
                        f"cache_instruments: must configure because {pipette_mount.name} now attached or changed"
                    )

            elif self._pipette_handler.hardware_instruments[pipette_mount]:
                # Is no pipette, have a cached pipette, need to reconfig
                skip_configure = False
                self._pipette_handler.hardware_instruments[pipette_mount] = None
                self._log.info(
                    f"cache_instruments: must configure because {pipette_mount.name} now empty"
                )

        return skip_configure

    async def _configure_instruments(self) -> None:
        """Configure instruments"""
        await self.set_gantry_load(self._gantry_load_from_instruments())
        await self.refresh_positions()

    @ExecutionManagerProvider.wait_for_running
    async def _update_position_estimation(
        self, axes: Optional[List[Axis]] = None
    ) -> None:
        """
        Function to update motor estimation for a set of axes
        """

        if axes:
            checked_axes = [ax for ax in axes if ax in Axis]
        else:
            checked_axes = [ax for ax in Axis]
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

    async def stop_motors(self) -> None:
        """Immediately stop motors."""
        await self._backend.halt()

    def stop_modules(self) -> None:
        """Immediately stop modules."""
        asyncio.run_coroutine_threadsafe(self._execution_manager.cancel(), self._loop)

    async def halt(self) -> None:
        """Immediately disengage all present motors and clear motor and module tasks."""
        await self.disengage_axes(
            [ax for ax in Axis if self._backend.axis_is_present(ax)]
        )
        await self.stop_motors()
        self.stop_modules()

    async def stop(self, home_after: bool = True) -> None:
        """Stop motion as soon as possible, reset, and optionally home."""
        await self.stop_motors()
        self._log.info("Recovering from halt")
        await self.reset()

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
            axes = [Axis.by_mount(mount)]
        else:
            axes = list(Axis.ot3_mount_axes())
        await self.home(axes)

    async def home_gripper_jaw(self) -> None:
        """
        Home the jaw of the gripper.
        """
        try:
            gripper = self._gripper_handler.get_gripper()
            self._log.info("Homing gripper jaw.")
            dc = self._gripper_handler.get_duty_cycle_by_grip_force(
                gripper.default_home_force
            )
            await self._ungrip(duty_cycle=dc)
            gripper.state = GripperJawState.HOMED_READY
        except GripperNotAttachedError:
            pass

    async def home_plunger(self, mount: Union[top_types.Mount, OT3Mount]) -> None:
        """
        Home the plunger motor for a mount, and then return it to the 'bottom'
        position.
        """

        checked_mount = OT3Mount.from_mount(mount)
        await self.home([Axis.of_main_tool_actuator(checked_mount)])
        instr = self._pipette_handler.hardware_instruments[checked_mount]
        if instr:
            self._log.info("Attempting to move the plunger to bottom.")
            await self._move_to_plunger_bottom(
                checked_mount, rate=1.0, acquire_lock=False
            )

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
        ot3_pos = await self.current_position_ot3(realmount, critical_point, refresh)
        return ot3_pos

    async def current_position_ot3(
        self,
        mount: OT3Mount,
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
    ) -> Dict[Axis, float]:
        """Return the postion (in deck coords) of the critical point of the
        specified mount.
        """
        if mount == OT3Mount.GRIPPER and not self._gripper_handler.has_gripper():
            raise GripperNotAttachedError(
                f"Cannot return position for {mount} if no gripper is attached"
            )

        if refresh:
            await self.refresh_positions()

        position_axes = [Axis.X, Axis.Y, Axis.by_mount(mount)]
        valid_motor = self._current_position and self._backend.check_motor_status(
            position_axes
        )
        if not valid_motor:
            raise MustHomeError(
                f"Current position of {str(mount)} is invalid; please home motors."
            )

        return self._effector_pos_from_carriage_pos(
            OT3Mount.from_mount(mount), self._current_position, critical_point
        )

    async def refresh_positions(self) -> None:
        """Request and update both the motor and encoder positions from backend."""
        async with self._motion_lock:
            await self._backend.update_motor_status()
            await self._cache_current_position()
            await self._cache_encoder_position()

    async def _cache_current_position(self) -> Dict[Axis, float]:
        """Cache current position from backend and return in absolute deck coords."""
        self._current_position = self._deck_from_machine(
            await self._backend.update_position()
        )
        return self._current_position

    async def _cache_encoder_position(self) -> Dict[Axis, float]:
        """Cache encoder position from backend and return in absolute deck coords."""
        self._encoder_position = self._deck_from_machine(
            await self._backend.update_encoder_position()
        )
        if self.has_gripper():
            self._gripper_handler.set_jaw_displacement(self._encoder_position[Axis.G])
        return self._encoder_position

    async def encoder_current_position(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
    ) -> Dict[Axis, float]:
        """
        Return the encoder position in absolute deck coords specified mount.
        """
        return await self.encoder_current_position_ot3(mount, critical_point, refresh)

    async def encoder_current_position_ot3(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
    ) -> Dict[Axis, float]:
        """
        Return the encoder position in absolute deck coords specified mount.
        """
        if refresh:
            await self.refresh_positions()

        if mount == OT3Mount.GRIPPER and not self._gripper_handler.has_gripper():
            raise GripperNotAttachedError(
                f"Cannot return encoder position for {mount} if no gripper is attached"
            )

        position_axes = [Axis.X, Axis.Y, Axis.by_mount(mount)]
        valid_motor = self._encoder_position and self._backend.check_encoder_status(
            position_axes
        )
        if not valid_motor:
            raise MustHomeError(
                f"Encoder position of {str(mount)} is invalid; please home motors."
            )

        ot3pos = self._effector_pos_from_carriage_pos(
            OT3Mount.from_mount(mount),
            self._encoder_position,
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
        z_ax = Axis.by_mount(mount)
        plunger_ax = Axis.of_main_tool_actuator(mount)

        effector_pos = {
            Axis.X: carriage_position[Axis.X] + offset[0] + cp.x,
            Axis.Y: carriage_position[Axis.Y] + offset[1] + cp.y,
            z_ax: carriage_position[z_ax] + offset[2] + cp.z,
            plunger_ax: carriage_position[plunger_ax],
        }
        if self._gantry_load == GantryLoad.HIGH_THROUGHPUT:
            effector_pos[Axis.Q] = axis_convert(self._backend.gear_motor_position, 0.0)[
                Axis.P_L
            ]

        return effector_pos

    async def gantry_position(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        critical_point: Optional[CriticalPoint] = None,
        refresh: bool = False,
        fail_on_not_homed: bool = False,
    ) -> top_types.Point:
        """Return the position of the critical point as pertains to the gantry."""
        realmount = OT3Mount.from_mount(mount)
        cur_pos = await self.current_position_ot3(
            realmount,
            critical_point,
            refresh,
        )
        return top_types.Point(
            x=cur_pos[Axis.X],
            y=cur_pos[Axis.Y],
            z=cur_pos[Axis.by_mount(realmount)],
        )

    async def move_to(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        abs_position: top_types.Point,
        speed: Optional[float] = None,
        critical_point: Optional[CriticalPoint] = None,
        max_speeds: Union[None, Dict[Axis, float], OT3AxisMap[float]] = None,
        _expect_stalls: bool = False,
    ) -> None:
        """Move the critical point of the specified mount to a location
        relative to the deck, at the specified speed."""
        realmount = OT3Mount.from_mount(mount)
        axes_moving = [Axis.X, Axis.Y, Axis.by_mount(mount)]

        # Cache current position from backend
        if not self._current_position:
            await self.refresh_positions()

        if not self._backend.check_encoder_status(axes_moving):
            # a moving axis has not been homed before, homing robot now
            await self.home()
        elif not self._backend.check_motor_status(axes_moving):
            raise MustHomeError(
                f"Inaccurate motor position for {str(realmount)}, please home motors."
            )

        target_position = target_position_from_absolute(
            realmount,
            abs_position,
            partial(self.critical_point_for, cp_override=critical_point),
            top_types.Point(*self._config.left_mount_offset),
            top_types.Point(*self._config.right_mount_offset),
            top_types.Point(*self._config.gripper_mount_offset),
        )
        if max_speeds:
            checked_max: Optional[OT3AxisMap[float]] = max_speeds
        else:
            checked_max = None

        await self._cache_and_maybe_retract_mount(realmount)
        await self._move_gripper_to_idle_position(realmount)
        await self._move(
            target_position,
            speed=speed,
            max_speeds=checked_max,
            expect_stalls=_expect_stalls,
        )

    async def move_axes(  # noqa: C901
        self,
        position: Mapping[Axis, float],
        speed: Optional[float] = None,
        max_speeds: Optional[Dict[Axis, float]] = None,
    ) -> None:
        """Moves the effectors of the specified axis to the specified position.
        The effector of the x,y axis is the center of the carriage.
        The effector of the pipette mount axis are the mount critical points but only in z.
        """
        if not self._current_position:
            await self.refresh_positions()

        for axis in position.keys():
            if not self._backend.axis_is_present(axis):
                raise AxisNotPresentError(f"{axis} is not present")

        if not self._backend.check_encoder_status(list(position.keys())):
            await self.home()

        valid_motor = self._current_position and self._backend.check_motor_status(
            list(position.keys())
        )
        if not valid_motor:
            raise MustHomeError("Current position is invalid; please home motors.")

        absolute_positions: "OrderedDict[Axis, float]" = OrderedDict()
        current_position = self._current_position
        if Axis.X in position:
            absolute_positions[Axis.X] = position[Axis.X]
        else:
            absolute_positions[Axis.X] = current_position[Axis.X]
        if Axis.Y in position:
            absolute_positions[Axis.Y] = position[Axis.Y]
        else:
            absolute_positions[Axis.Y] = current_position[Axis.Y]

        have_z = False
        for axis in [Axis.Z_L, Axis.Z_R, Axis.Z_G]:
            if axis in position:
                have_z = True
                if Axis.Z_L:
                    carriage_effectors_offset = (
                        self._robot_calibration.left_mount_offset
                    )
                elif Axis.Z_R:
                    carriage_effectors_offset = (
                        self._robot_calibration.right_mount_offset
                    )
                else:
                    carriage_effectors_offset = (
                        self._robot_calibration.gripper_mount_offset
                    )
                absolute_positions[axis] = position[axis] - carriage_effectors_offset.z

        if not have_z:
            absolute_positions[Axis.Z_L] = current_position[Axis.Z_L]
        for axis, position_value in position.items():
            if axis not in absolute_positions:
                absolute_positions[axis] = position_value

        await self._move(target_position=absolute_positions, speed=speed)

    async def move_rel(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        delta: top_types.Point,
        speed: Optional[float] = None,
        max_speeds: Union[None, Dict[Axis, float], OT3AxisMap[float]] = None,
        check_bounds: MotionChecks = MotionChecks.NONE,
        fail_on_not_homed: bool = False,
        _expect_stalls: bool = False,
    ) -> None:
        """Move the critical point of the specified mount by a specified
        displacement in a specified direction, at the specified speed."""
        if not self._current_position:
            await self.refresh_positions()

        realmount = OT3Mount.from_mount(mount)
        axes_moving = [Axis.X, Axis.Y, Axis.by_mount(mount)]

        if not self._backend.check_encoder_status(axes_moving):
            await self.home()

        # Cache current position from backend
        await self._cache_current_position()
        await self._cache_encoder_position()

        if not self._backend.check_motor_status([axis for axis in axes_moving]):
            raise MustHomeError(
                f"Inaccurate motor position for {str(realmount)}, please home motors."
            )

        target_position = target_position_from_relative(
            realmount, delta, self._current_position
        )
        if max_speeds:
            checked_max: Optional[OT3AxisMap[float]] = max_speeds
        else:
            checked_max = None
        await self._cache_and_maybe_retract_mount(realmount)
        await self._move_gripper_to_idle_position(realmount)
        await self._move(
            target_position,
            speed=speed,
            max_speeds=checked_max,
            check_bounds=check_bounds,
            expect_stalls=_expect_stalls,
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

    def _build_moves(
        self,
        origin: Dict[Axis, float],
        target: Dict[Axis, float],
        speed: Optional[float] = None,
    ) -> List[List[Move[Axis]]]:
        """Build move with Move Manager with machine positions."""
        # TODO: (2022-02-10) Use actual max speed for MoveTarget
        checked_speed = speed or 400
        move_target = MoveTarget.build(position=target, max_speed=checked_speed)
        _, moves = self._move_manager.plan_motion(
            origin=origin, target_list=[move_target]
        )
        return moves

    @ExecutionManagerProvider.wait_for_running
    async def _move(
        self,
        target_position: "OrderedDict[Axis, float]",
        speed: Optional[float] = None,
        home_flagged_axes: bool = True,
        max_speeds: Optional[OT3AxisMap[float]] = None,
        acquire_lock: bool = True,
        check_bounds: MotionChecks = MotionChecks.NONE,
        expect_stalls: bool = False,
    ) -> None:
        """Worker function to apply robot motion."""
        machine_pos = machine_from_deck(
            deck_pos=target_position,
            attitude=self._robot_calibration.deck_calibration.attitude,
            offset=self._robot_calibration.carriage_offset,
            robot_type=cast(RobotType, "OT-3 Standard"),
        )
        bounds = self._backend.axis_bounds
        to_check = {
            ax: machine_pos[ax]
            for ax in target_position.keys()
            if ax in Axis.gantry_axes()
        }
        check_motion_bounds(to_check, target_position, bounds, check_bounds)

        origin = await self._backend.update_position()
        try:
            moves = self._build_moves(origin, machine_pos, speed)
        except ZeroLengthMoveError as zero_length_error:
            self._log.info(f"{str(zero_length_error)}, ignoring")
            return
        self._log.info(
            f"move: deck {target_position} becomes machine {machine_pos} from {origin} "
            f"requiring {moves}"
        )
        async with contextlib.AsyncExitStack() as stack:
            if acquire_lock:
                await stack.enter_async_context(self._motion_lock)
            try:
                await self._backend.move(
                    origin,
                    moves[0],
                    MoveStopCondition.stall
                    if expect_stalls
                    else MoveStopCondition.none,
                )
            except Exception:
                self._log.exception("Move failed")
                self._current_position.clear()
                raise
            else:
                await self._cache_current_position()
                await self._cache_encoder_position()

    async def _home_axis(self, axis: Axis) -> None:
        """
        Perform home; base on axis motor/encoder statuses, shorten homing time
        if possible.

        1. If stepper position status is valid, move directly to the home position.
        2. If encoder position status is valid, update position estimation.
           If axis encoder is accurate (Zs & Ps ONLY), move directly to home position.
           Or, if axis encoder is not accurate, move to 20mm away from home position,
           then home.
        3. If both stepper and encoder statuses are invalid, home full axis.

        Note that when an axis is move directly to the home position, the axis limit
        switch will not be triggered.
        """

        async def _retrieve_home_position() -> Tuple[
            OT3AxisMap[float], OT3AxisMap[float]
        ]:
            origin = await self._backend.update_position()
            target_pos = {ax: pos for ax, pos in origin.items()}
            target_pos.update({axis: self._backend.home_position()[axis]})
            return origin, target_pos

        # G, Q should be handled in the backend through `self._home()`
        assert axis not in [Axis.G, Axis.Q]

        encoder_ok = self._backend.check_encoder_status([axis])
        motor_ok = self._backend.check_motor_status([axis])

        if encoder_ok:
            # ensure stepper position can be updated after boot
            await self.engage_axes([axis])
            await self._update_position_estimation([axis])
            # refresh motor and encoder statuses after position estimation update
            motor_ok = self._backend.check_motor_status([axis])
            encoder_ok = self._backend.check_encoder_status([axis])

        # we can move to safe home distance!
        if encoder_ok and motor_ok:
            origin, target_pos = await _retrieve_home_position()
            if Axis.to_kind(axis) in [OT3AxisKind.Z, OT3AxisKind.P]:
                axis_home_dist = self._config.safe_home_distance
            else:
                # FIXME: (AA 2/15/23) This is a temporary workaround because of
                # XY encoder inaccuracy. Otherwise, we should be able to use
                # 5.0 mm for all axes.
                # Move to 20 mm away from the home position and then home
                axis_home_dist = 20.0
            if origin[axis] - target_pos[axis] > axis_home_dist:
                target_pos[axis] += axis_home_dist
                moves = self._build_moves(origin, target_pos)
                await self._backend.move(
                    origin,
                    moves[0],
                    MoveStopCondition.none,
                )
            await self._backend.home([axis], self.gantry_load)
        else:
            # both stepper and encoder positions are invalid, must home
            await self._backend.home([axis], self.gantry_load)

    async def _home(self, axes: Sequence[Axis]) -> None:
        """Home one axis at a time."""
        async with self._motion_lock:
            for axis in axes:
                try:
                    if axis == Axis.G:
                        await self.home_gripper_jaw()
                    elif axis == Axis.Q:
                        await self._backend.home([axis], self.gantry_load)
                    else:
                        await self._home_axis(axis)
                except ZeroLengthMoveError:
                    self._log.info(f"{axis} already at home position, skip homing")
                    continue
                except BaseException as e:
                    self._log.exception(f"Homing failed: {e}")
                    self._current_position.clear()
                    raise
                else:
                    await self._cache_current_position()
                    await self._cache_encoder_position()

    @ExecutionManagerProvider.wait_for_running
    async def home(self, axes: Optional[List[Axis]] = None) -> None:
        """
        Worker function to home the robot by axis or list of
        desired axes.
        """
        # make sure current position is up-to-date
        await self.refresh_positions()

        if axes:
            checked_axes = axes
        else:
            checked_axes = [ax for ax in Axis if ax != Axis.Q]
        if self.gantry_load == GantryLoad.HIGH_THROUGHPUT:
            checked_axes.append(Axis.Q)
        self._log.info(f"Homing {axes}")

        home_seq = [
            ax
            for ax in AXES_IN_HOMING_ORDER
            if (ax in checked_axes and self._backend.axis_is_present(ax))
        ]
        self._log.info(f"home was called with {axes} generating sequence {home_seq}")
        await self._home(home_seq)

    def get_engaged_axes(self) -> Dict[Axis, bool]:
        """Which axes are engaged and holding."""
        return self._backend.engaged_axes()

    @property
    def engaged_axes(self) -> Dict[Axis, bool]:
        return self.get_engaged_axes()

    async def disengage_axes(self, which: List[Axis]) -> None:
        await self._backend.disengage_axes(which)

    async def engage_axes(self, which: List[Axis]) -> None:
        await self._backend.engage_axes(which)

    async def get_limit_switches(self) -> Dict[Axis, bool]:
        res = await self._backend.get_limit_switches()
        return {ax: val for ax, val in res.items()}

    @ExecutionManagerProvider.wait_for_running
    async def retract(
        self, mount: Union[top_types.Mount, OT3Mount], margin: float = 10
    ) -> None:
        """Pull the specified mount up to its home position.

        Works regardless of critical point or home status.
        """
        await self.retract_axis(Axis.by_mount(mount))

    @ExecutionManagerProvider.wait_for_running
    async def retract_axis(self, axis: Axis) -> None:
        """
        Move an axis to its home position, without engaging the limit switch,
        whenever we can.

        OT-2 uses this function to recover from a stall. In order to keep
        the behaviors between the two robots similar, retract_axis on the FLEX
        will call home if the stepper position is inaccurate.
        """
        motor_ok = self._backend.check_motor_status([axis])
        encoder_ok = self._backend.check_encoder_status([axis])

        if motor_ok and encoder_ok:
            # we can move to the home position without checking the limit switch
            origin = await self._backend.update_position()
            target_pos = {axis: self._backend.home_position()[axis]}
            try:
                moves = self._build_moves(origin, target_pos)
                await self._backend.move(origin, moves[0], MoveStopCondition.none)
            except ZeroLengthMoveError:
                self._log.info(f"{axis} already at home position, skip retract")
        else:
            # home the axis
            await self._home_axis(axis)
        await self._cache_current_position()
        await self._cache_encoder_position()

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

    @ExecutionManagerProvider.wait_for_running
    async def _grip(self, duty_cycle: float) -> None:
        """Move the gripper jaw inward to close."""
        try:
            await self._backend.gripper_grip_jaw(duty_cycle=duty_cycle)
            await self._cache_encoder_position()
        except Exception:
            self._log.exception(
                f"Gripper grip failed, encoder pos: {self._encoder_position[Axis.G]}"
            )
            raise

    @ExecutionManagerProvider.wait_for_running
    async def _ungrip(self, duty_cycle: float) -> None:
        """Move the gripper jaw outward to reach the homing switch."""
        try:
            await self._backend.gripper_home_jaw(duty_cycle=duty_cycle)
            await self._cache_encoder_position()
        except Exception:
            self._log.exception("Gripper home failed")
            raise

    @ExecutionManagerProvider.wait_for_running
    async def _hold_jaw_width(self, jaw_width_mm: float) -> None:
        """Move the gripper jaw to a specific width."""
        try:
            if not self._gripper_handler.is_valid_jaw_width(jaw_width_mm):
                raise ValueError("Setting gripper jaw width out of bounds")
            gripper = self._gripper_handler.get_gripper()
            width_max = gripper.config.geometry.jaw_width["max"]
            jaw_displacement_mm = (width_max - jaw_width_mm) / 2.0
            await self._backend.gripper_hold_jaw(int(1000 * jaw_displacement_mm))
            await self._cache_encoder_position()
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

    async def _move_to_plunger_bottom(
        self, mount: OT3Mount, rate: float, acquire_lock: bool = True
    ) -> None:
        """
        Move an instrument's plunger to its bottom position, while no liquids
        are held by said instrument.

        Possible events where this occurs:

        1. After homing the plunger
        2. Between a blow-out and an aspiration (eg: re-using tips)

        Three possible physical tip states when this happens:

        1. no tip on pipette
        2. empty and dry (unused) tip on pipette
        3. empty and wet (used) tip on pipette

        With wet tips, the primary concern is leftover droplets inside the tip.
        These droplets ideally only move down and out of the tip, not up into the tip.
        Therefore, it is preferable to use the "blow-out" speed when moving the
        plunger down, and the slower "aspirate" speed when moving the plunger up.

        Assume all tips are wet, because we do not differentiate between wet/dry tips.

        When no tip is attached, moving at the max speed is preferable, to save time.
        """
        checked_mount = OT3Mount.from_mount(mount)
        instrument = self._pipette_handler.get_pipette(checked_mount)
        if instrument.current_volume > 0:
            raise RuntimeError("cannot position plunger while holding liquid")
        target_pos = target_position_from_plunger(
            OT3Mount.from_mount(mount),
            instrument.plunger_positions.bottom,
            self._current_position,
        )
        pip_ax = Axis.of_main_tool_actuator(mount)
        current_pos = self._current_position[pip_ax]
        if instrument.has_tip:
            if current_pos > target_pos[pip_ax]:
                # using slower aspirate flow-rate, to avoid pulling droplets up
                speed = self._pipette_handler.plunger_speed(
                    instrument, instrument.aspirate_flow_rate, "aspirate"
                )
            else:
                # use blow-out flow-rate, so we can push droplets out
                speed = self._pipette_handler.plunger_speed(
                    instrument, instrument.blow_out_flow_rate, "dispense"
                )
        else:
            # save time by using max speed
            max_speeds = self.config.motion_settings.default_max_speed
            speed = max_speeds[self.gantry_load][OT3AxisKind.P]
        # IMPORTANT: Here is our backlash compensation.
        #            The plunger is pre-loaded in the "aspirate" direction
        # NOTE: plunger position (mm) decreases up towards homing switch
        if current_pos < target_pos[pip_ax]:
            # move down below "bottom", before moving back up to "bottom"
            backlash_pos = target_pos.copy()
            backlash_pos[pip_ax] += instrument.backlash_distance
            await self._move(
                backlash_pos,
                speed=(speed * rate),
                acquire_lock=acquire_lock,
            )
        await self._move(
            target_pos,
            speed=(speed * rate),
            acquire_lock=acquire_lock,
        )

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
            await self._move_to_plunger_bottom(checked_mount, rate)
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
                {aspirate_spec.axis: aspirate_spec.current}
            )
            async with self.restore_system_constrants():
                await self.set_system_constraints_for_plunger_acceleration(
                    realmount, aspirate_spec.acceleration
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
                {dispense_spec.axis: dispense_spec.current}
            )
            async with self.restore_system_constrants():
                await self.set_system_constraints_for_plunger_acceleration(
                    realmount, dispense_spec.acceleration
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

    async def blow_out(
        self,
        mount: Union[top_types.Mount, OT3Mount],
        volume: Optional[float] = None,
    ) -> None:
        """
        Force any remaining liquid to dispense. The liquid will be dispensed at
        the current location of pipette
        """
        realmount = OT3Mount.from_mount(mount)
        instrument = self._pipette_handler.get_pipette(realmount)
        blowout_spec = self._pipette_handler.plan_check_blow_out(realmount, volume)

        max_blowout_pos = instrument.plunger_positions.blow_out
        # start at the bottom position and move additional distance
        # determined by plan_check_blow_out
        blowout_distance = (
            instrument.plunger_positions.bottom + blowout_spec.plunger_distance
        )
        if blowout_distance > max_blowout_pos:
            raise ValueError(
                f"Blow out distance exceeds plunger position limit: blowout dist = {blowout_distance}, "
                f"max blowout distance = {max_blowout_pos}"
            )

        await self._backend.set_active_current(
            {blowout_spec.axis: blowout_spec.current}
        )

        target_pos = target_position_from_plunger(
            realmount,
            blowout_distance,
            self._current_position,
        )

        try:
            async with self.restore_system_constrants():
                await self.set_system_constraints_for_plunger_acceleration(
                    realmount, blowout_spec.acceleration
                )
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
                await self._move(target_down, speed=press.speed, expect_stalls=True)
            # we expect a stall has happened during pick up, so we want to
            # update the motor estimation
            await self._update_position_estimation([Axis.by_mount(mount)])
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
            homing_velocity = self._config.motion_settings.max_speed_discontinuity[
                GantryLoad.HIGH_THROUGHPUT
            ][OT3AxisKind.Q]
            # check if position is known before pick up tip
            if not any(self._backend.gear_motor_position):
                # home gear motor if position not known
                await self._backend.tip_action(
                    distance=self._backend.axis_bounds[Axis.Q][1],
                    velocity=homing_velocity,
                    tip_action="home",
                )
            pipette_axis = Axis.of_main_tool_actuator(mount)
            gear_origin_float = axis_convert(self._backend.gear_motor_position, 0.0)[
                pipette_axis
            ]
            clamp_move_target = pipette_spec.pick_up_distance
            clamp_moves = self._build_moves(
                {Axis.Q: gear_origin_float}, {Axis.Q: clamp_move_target}
            )
            await self._backend.tip_action(moves=clamp_moves[0], tip_action="clamp")

            gear_pos_float = axis_convert(self._backend.gear_motor_position, 0.0)[
                Axis.P_L
            ]

            fast_home_moves = self._build_moves(
                {Axis.Q: gear_pos_float}, {Axis.Q: self._config.safe_home_distance}
            )
            # move toward home until a safe distance
            await self._backend.tip_action(moves=fast_home_moves[0], tip_action="clamp")
            # move the rest of the way home with no acceleration
            await self._backend.tip_action(
                distance=(self._config.safe_home_distance + pipette_spec.home_buffer),
                velocity=homing_velocity,
                tip_action="home",
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

        await self._move_to_plunger_bottom(realmount, rate=1.0)
        if spec.pick_up_motor_actions:
            await self._motor_pick_up_tip(realmount, spec.pick_up_motor_actions)
        else:
            await self._force_pick_up_tip(realmount, spec)

        # neighboring tips tend to get stuck in the space between
        # the volume chamber and the drop-tip sleeve on p1000.
        # This extra shake ensures those tips are removed
        for rel_point, speed in spec.shake_off_list:
            await self.move_rel(realmount, rel_point, speed=speed)

        # TODO: implement tip-detection sequence during pick-up-tip for 96ch,
        #       but not with DVT pipettes because those can only detect drops

        if self.gantry_load != GantryLoad.HIGH_THROUGHPUT:
            await self._backend.get_tip_present(realmount, TipStateType.PRESENT)

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
        self, mount: Union[top_types.Mount, OT3Mount], home_after: bool = False
    ) -> None:
        """Drop tip at the current location."""
        realmount = OT3Mount.from_mount(mount)
        spec, _remove = self._pipette_handler.plan_check_drop_tip(realmount, home_after)

        homing_velocity = self._config.motion_settings.max_speed_discontinuity[
            GantryLoad.HIGH_THROUGHPUT
        ][OT3AxisKind.Q]
        for move in spec.drop_moves:
            await self._backend.set_active_current(move.current)

            if move.is_ht_tip_action and move.speed:
                # The speed check is needed because speed can sometimes be None.
                # Not sure why
                if not any(self._backend.gear_motor_position):
                    # home gear motor if position not known
                    await self._backend.tip_action(
                        distance=self._backend.axis_bounds[Axis.Q][1],
                        velocity=homing_velocity,
                        tip_action="home",
                    )

                gear_start_position = axis_convert(
                    self._backend.gear_motor_position, 0.0
                )[Axis.P_L]
                drop_moves = self._build_moves(
                    {Axis.Q: gear_start_position}, {Axis.Q: move.target_position}
                )
                await self._backend.tip_action(moves=drop_moves[0], tip_action="clamp")

                gear_pos_float = axis_convert(self._backend.gear_motor_position, 0.0)[
                    Axis.P_L
                ]

                fast_home_moves = self._build_moves(
                    {Axis.Q: gear_pos_float}, {Axis.Q: self._config.safe_home_distance}
                )
                # move toward home until a safe distance
                await self._backend.tip_action(
                    moves=fast_home_moves[0], tip_action="clamp"
                )
                # move the rest of the way home with no acceleration
                await self._backend.tip_action(
                    distance=(self._config.safe_home_distance + move.home_buffer),
                    velocity=homing_velocity,
                    tip_action="home",
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
                await self._home(move.home_axes)

        for shake in spec.shake_moves:
            await self.move_rel(mount, shake[0], speed=shake[1])

        await self._backend.set_active_current(spec.ending_current)
        # TODO: implement tip-detection sequence during drop-tip for 96ch
        if self.gantry_load != GantryLoad.HIGH_THROUGHPUT:
            await self._backend.get_tip_present(realmount, TipStateType.ABSENT)

        # home mount axis
        if home_after:
            await self._home([Axis.by_mount(mount)])

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
    def hardware_gripper(self) -> Optional[Gripper]:
        if not self.has_gripper():
            return None
        return self._gripper_handler.get_gripper()

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

    async def get_instrument_state(
        self, mount: Union[top_types.Mount, OT3Mount]
    ) -> PipetteStateDict:
        # TODO we should have a PipetteState that can be returned from
        # this function with additional state (such as critical points)
        realmount = OT3Mount.from_mount(mount)
        res = await self._backend.get_tip_present_state(realmount)
        pipette_state_for_mount: PipetteStateDict = {"tip_detected": bool(res)}
        return pipette_state_for_mount

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

    def get_instrument_offset(
        self, mount: OT3Mount
    ) -> Union[GripperCalibrationOffset, PipetteOffsetByPipetteMount, None]:
        """Get instrument calibration data."""
        # TODO (spp, 2023-04-19): We haven't introduced a 'calibration_offset' key in
        #  PipetteDict because the dict is shared with OT2 pipettes which have
        #  different offset type. Once we figure out if we want the calibration data
        #  to be a part of the dict, this getter can be updated to fetch pipette offset
        #  from the dict, or just remove this getter entirely.

        if mount == OT3Mount.GRIPPER:
            gripper_dict = self._gripper_handler.get_gripper_dict()
            return gripper_dict["calibration_offset"] if gripper_dict else None
        else:
            return self._pipette_handler.get_instrument_offset(mount=mount)

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

    async def save_module_offset(
        self, module_id: str, mount: OT3Mount, slot: str, offset: top_types.Point
    ) -> Optional[ModuleCalibrationOffset]:
        """Save a new offset for a given module."""
        module = self._backend.module_controls.get_module_by_module_id(module_id)
        if not module:
            self._log.warning(f"Could not save calibration: unknown module {module_id}")
            return None
        # TODO (ba, 2023-03-22): gripper_id and pipette_id should probably be combined to instrument_id
        instrument_id = None
        if self._gripper_handler.has_gripper():
            instrument_id = self._gripper_handler.get_gripper().gripper_id
        elif self._pipette_handler.has_pipette(mount):
            instrument_id = self._pipette_handler.get_pipette(mount).pipette_id
        module_type = module.MODULE_TYPE
        self._log.info(
            f"Saving module offset: {offset} for module {module_type.name} {module_id}."
        )
        return self._backend.module_controls.save_module_offset(
            module_type, module_id, mount, slot, offset, instrument_id
        )

    def get_module_calibration_offset(
        self, serial_number: str
    ) -> Optional[ModuleCalibrationOffset]:
        """Get the module calibration offset of a module."""
        module = self._backend.module_controls.get_module_by_module_id(serial_number)
        if not module:
            self._log.warning(
                f"Could not load calibration: unknown module {serial_number}"
            )
            return None
        module_type = module.MODULE_TYPE
        return self._backend.module_controls.load_module_offset(
            module_type, serial_number
        )

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
        carriage_pos = self._deck_from_machine(self._backend.home_position())
        pos_at_home = self._effector_pos_from_carriage_pos(
            OT3Mount.from_mount(mount), carriage_pos, critical_point
        )

        return pos_at_home[Axis.by_mount(mount)] - self._config.z_retract_distance

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

        pos = await self.gantry_position(mount, refresh=True)
        probe_start_pos = pos._replace(z=probe_settings.starting_mount_height)
        await self.move_to(mount, probe_start_pos)

        if probe_settings.aspirate_while_sensing:
            await self._move_to_plunger_bottom(mount, rate=1.0)
        else:
            # TODO: shorten this distance by only moving just far enough
            #       to account for the specified "max-z-distance"
            target_pos = target_position_from_plunger(
                checked_mount, instrument.plunger_positions.top, self._current_position
            )
            # FIXME: this should really be the slower "aspirate" speed,
            #        but this is still in testing phase so let's bias towards speed
            max_speeds = self.config.motion_settings.default_max_speed
            speed = max_speeds[self.gantry_load][OT3AxisKind.P]
            await self._move(target_pos, speed=speed, acquire_lock=True)

        plunger_direction = -1 if probe_settings.aspirate_while_sensing else 1
        await self._backend.liquid_probe(
            mount,
            probe_settings.max_z_distance,
            probe_settings.mount_speed,
            (probe_settings.plunger_speed * plunger_direction),
            probe_settings.sensor_threshold_pascals,
            probe_settings.log_pressure,
            probe_settings.auto_zero_sensor,
            probe_settings.num_baseline_reads,
        )
        end_pos = await self.gantry_position(mount, refresh=True)
        await self.move_to(mount, probe_start_pos)
        return end_pos.z

    async def capacitive_probe(
        self,
        mount: OT3Mount,
        moving_axis: Axis,
        target_pos: float,
        pass_settings: CapacitivePassSettings,
        retract_after: bool = True,
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
            Axis.X,
            Axis.Y,
        ] and moving_axis != Axis.by_mount(mount):
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
                self._robot_calibration.deck_calibration.attitude,
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
        if retract_after:
            await self.move_to(mount, pass_start_pos)
        return moving_axis.of_point(end_pos)

    async def capacitive_sweep(
        self,
        mount: OT3Mount,
        moving_axis: Axis,
        begin: top_types.Point,
        end: top_types.Point,
        speed_mm_s: float,
    ) -> List[float]:
        if moving_axis not in [
            Axis.X,
            Axis.Y,
        ] and moving_axis != Axis.by_mount(mount):
            raise RuntimeError(
                "Probing must be done with a gantry axis or the mount of the sensing"
                " tool"
            )
        sweep_distance = moving_axis.of_point(
            machine_vector_from_deck_vector(
                end - begin,
                self._robot_calibration.deck_calibration.attitude,
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

    @property
    def attached_subsystems(self) -> Dict[SubSystem, SubSystemState]:
        """Get a view of the state of the currently-attached subsystems."""
        return self._backend.subsystems

    @property
    def estop_status(self) -> EstopOverallStatus:
        return EstopOverallStatus(
            state=self._backend.estop_state_machine.state,
            left_physical_state=self._backend.estop_state_machine.get_physical_status(
                EstopAttachLocation.LEFT
            ),
            right_physical_state=self._backend.estop_state_machine.get_physical_status(
                EstopAttachLocation.RIGHT
            ),
        )

    def estop_acknowledge_and_clear(self) -> EstopOverallStatus:
        """Attempt to acknowledge an Estop event and clear the status.

        Returns the estop status after clearing the status."""
        self._backend.estop_state_machine.acknowledge_and_clear()
        return self.estop_status

    def get_estop_state(self) -> EstopState:
        return self._backend.estop_state_machine.state
