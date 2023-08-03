"""OT3 Hardware Controller Backend."""

from __future__ import annotations
import asyncio
from contextlib import asynccontextmanager
from functools import wraps
import logging
from copy import deepcopy
from typing import (
    Any,
    Awaitable,
    Callable,
    Dict,
    List,
    Optional,
    Tuple,
    TYPE_CHECKING,
    Sequence,
    AsyncIterator,
    cast,
    Set,
    TypeVar,
    Iterator,
    KeysView,
    Union,
)
from opentrons.config.types import OT3Config, GantryLoad
from opentrons.config import gripper_config, feature_flags as ff
from .ot3utils import (
    axis_convert,
    create_move_group,
    axis_to_node,
    get_current_settings,
    create_home_groups,
    node_to_axis,
    sensor_node_for_mount,
    sensor_node_for_pipette,
    sensor_id_for_instrument,
    create_gripper_jaw_grip_group,
    create_gripper_jaw_home_group,
    create_gripper_jaw_hold_group,
    create_tip_action_group,
    create_gear_motor_home_group,
    motor_nodes,
    LIMIT_SWITCH_OVERTRAVEL_DISTANCE,
    map_pipette_type_to_sensor_id,
)

try:
    import aionotify  # type: ignore[import]
except (OSError, ModuleNotFoundError):
    aionotify = None


from opentrons_hardware.drivers import SystemDrivers
from opentrons_hardware.drivers.can_bus import CanMessenger, DriverSettings
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.binary_usb import (
    BinaryMessenger,
    SerialUsbDriver,
    build_rear_panel_driver,
)
from opentrons_hardware.drivers.eeprom import EEPROMDriver, EEPROMData
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.hardware_control.motion_planning import (
    Move,
    Coordinates,
)
from opentrons_hardware.hardware_control.estop.detector import (
    EstopDetector,
)

from opentrons.hardware_control.estop_state import EstopStateMachine

from opentrons_hardware.hardware_control.motor_enable_disable import (
    set_enable_motor,
    set_disable_motor,
)
from opentrons_hardware.hardware_control.motor_position_status import (
    get_motor_position,
    update_motor_position_estimation,
)
from opentrons_hardware.hardware_control.limit_switches import get_limit_switches
from opentrons_hardware.hardware_control.tip_presence import get_tip_ejector_state
from opentrons_hardware.hardware_control.current_settings import (
    set_run_current,
    set_hold_current,
    set_currents,
)
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    PipetteName as FirmwarePipetteName,
    SensorId,
    ErrorCode,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    StopRequest,
)
from opentrons_hardware.firmware_bindings.messages.payloads import EmptyPayload
from opentrons_hardware.hardware_control import status_bar

from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
    DoorSwitchStateInfo,
)
from opentrons_hardware.firmware_update import FirmwareUpdate
from opentrons_hardware.hardware_control import network, tools

from opentrons.hardware_control.module_control import AttachedModulesControl
from opentrons.hardware_control.types import (
    BoardRevision,
    Axis,
    AionotifyEvent,
    OT3Mount,
    OT3AxisMap,
    OT3AxisKind,
    CurrentConfig,
    MotorStatus,
    InstrumentProbeType,
    UpdateStatus,
    DoorState,
    SubSystemState,
    SubSystem,
    TipStateType,
    FailedTipStateCheck,
)
from opentrons.hardware_control.errors import (
    InvalidPipetteName,
    InvalidPipetteModel,
    FirmwareUpdateRequired,
    OverPressureDetected,
)
from opentrons_hardware.hardware_control.motion import (
    MoveStopCondition,
    MoveGroup,
)
from opentrons_hardware.hardware_control.types import NodeMap
from opentrons_hardware.hardware_control.tools import types as ohc_tool_types

from opentrons_hardware.hardware_control.tool_sensors import (
    capacitive_probe,
    capacitive_pass,
    liquid_probe,
    check_overpressure,
)
from opentrons_hardware.hardware_control.rear_panel_settings import (
    get_door_state,
    set_deck_light,
    get_deck_light_state,
)

from opentrons_hardware.drivers.gpio import OT3GPIO, RemoteOT3GPIO
from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
    load_data as load_pipette_data,
)
from opentrons_shared_data.gripper.gripper_definition import GripForceProfile

from .subsystem_manager import SubsystemManager

if TYPE_CHECKING:
    from ..dev_types import (
        AttachedPipette,
        AttachedGripper,
        OT3AttachedInstruments,
    )

log = logging.getLogger(__name__)

MapPayload = TypeVar("MapPayload")
Wrapped = TypeVar("Wrapped", bound=Callable[..., Awaitable[Any]])


def requires_update(func: Wrapped) -> Wrapped:
    """Decorator that raises FirmwareUpdateRequired if the update_required flag is set."""

    @wraps(func)
    async def wrapper(self: Any, *args: Any, **kwargs: Any) -> Any:
        if self.update_required and self.initialized:
            raise FirmwareUpdateRequired()
        return await func(self, *args, **kwargs)

    return cast(Wrapped, wrapper)


class OT3Controller:
    """OT3 Hardware Controller Backend."""

    _initialized: bool
    _messenger: CanMessenger
    _usb_messenger: Optional[BinaryMessenger]
    _position: Dict[NodeId, float]
    _encoder_position: Dict[NodeId, float]
    _motor_status: Dict[NodeId, MotorStatus]
    _subsystem_manager: SubsystemManager

    @classmethod
    async def build(
        cls, config: OT3Config, use_usb_bus: bool = False, check_updates: bool = True
    ) -> OT3Controller:
        """Create the OT3Controller instance.

        Args:
            config: Robot configuration

        Returns:
            Instance.
        """
        driver = await build_driver(DriverSettings())
        usb_driver = None
        if use_usb_bus:
            try:
                usb_driver = await build_rear_panel_driver()
            except IOError as e:
                log.error(
                    "No rear panel device found, probably an EVT bot, disable rearPanelIntegration feature flag if it is"
                )
                raise e
        inst = cls(
            config, driver=driver, usb_driver=usb_driver, check_updates=check_updates
        )
        await inst._subsystem_manager.start()
        return inst

    def __init__(
        self,
        config: OT3Config,
        driver: AbstractCanDriver,
        usb_driver: Optional[SerialUsbDriver] = None,
        eeprom_driver: Optional[EEPROMDriver] = None,
        check_updates: bool = True,
    ) -> None:
        """Construct.

        Args:
            config: Robot configuration
            driver: The Can Driver
        """
        self._configuration = config
        self._module_controls: Optional[AttachedModulesControl] = None
        self._messenger = CanMessenger(driver=driver)
        self._messenger.start()
        self._drivers = self._build_system_hardware(
            self._messenger, usb_driver, eeprom_driver
        )
        self._usb_messenger = self._drivers.usb_messenger
        self._gpio_dev = self._drivers.gpio_dev
        self._subsystem_manager = SubsystemManager(
            self._messenger,
            self._usb_messenger,
            tools.detector.ToolDetector(self._messenger),
            network.NetworkInfo(self._messenger, self._usb_messenger),
            FirmwareUpdate(),
        )
        self._estop_detector: Optional[EstopDetector] = None
        self._estop_state_machine = EstopStateMachine(detector=None)
        self._position = self._get_home_position()
        self._gear_motor_position: Dict[NodeId, float] = {}
        self._encoder_position = self._get_home_position()
        self._motor_status = {}
        self._check_updates = check_updates
        self._initialized = False
        self._status_bar = status_bar.StatusBar(messenger=self._usb_messenger)
        try:
            self._event_watcher = self._build_event_watcher()
        except AttributeError:
            log.warning(
                "Failed to initiate aionotify, cannot watch modules "
                "or door, likely because not running on linux"
            )
        self._current_settings: Optional[OT3AxisMap[CurrentConfig]] = None

    @property
    def initialized(self) -> bool:
        """True when the hardware controller has initialized and is ready."""
        return self._initialized

    @initialized.setter
    def initialized(self, value: bool) -> None:
        self._initialized = value

    @property
    def subsystems(self) -> Dict[SubSystem, SubSystemState]:
        return self._subsystem_manager.subsystems

    @property
    def fw_version(self) -> Dict[SubSystem, int]:
        """Get the firmware version."""
        return {
            subsystem: info.current_fw_version
            for subsystem, info in self.subsystems.items()
        }

    @property
    def eeprom_driver(self) -> EEPROMDriver:
        """The eeprom driver interface."""
        return self._drivers.eeprom

    @property
    def eeprom_data(self) -> EEPROMData:
        """Get the data on the eeprom."""
        return self._drivers.eeprom.data

    @property
    def update_required(self) -> bool:
        return self._subsystem_manager.update_required and self._check_updates

    @staticmethod
    def _build_system_hardware(
        can_messenger: CanMessenger,
        usb_driver: Optional[SerialUsbDriver],
        eeprom_driver: Optional[EEPROMDriver],
    ) -> SystemDrivers:
        gpio = OT3GPIO("hardware_control")
        eeprom_driver = eeprom_driver or EEPROMDriver(gpio)
        eeprom_driver.setup()
        gpio_dev: Union[OT3GPIO, RemoteOT3GPIO] = gpio
        usb_messenger: Optional[BinaryMessenger] = None
        if usb_driver:
            usb_messenger = BinaryMessenger(usb_driver)
            usb_messenger.start()
            gpio_dev = RemoteOT3GPIO(usb_messenger)
        return SystemDrivers(
            can_messenger,
            gpio_dev,
            eeprom_driver,
            usb_messenger=usb_messenger,
        )

    @property
    def gear_motor_position(self) -> Dict[NodeId, float]:
        return self._gear_motor_position

    def _motor_nodes(self) -> Set[NodeId]:
        """Get a list of the motor controller nodes of all attached and ok devices."""
        return motor_nodes(self._subsystem_manager.targets)

    async def update_firmware(
        self,
        subsystems: Set[SubSystem],
        force: bool = False,
    ) -> AsyncIterator[UpdateStatus]:
        """Updates the firmware on the OT3."""
        async for update in self._subsystem_manager.update_firmware(subsystems, force):
            yield update

    async def update_to_default_current_settings(self, gantry_load: GantryLoad) -> None:
        self._current_settings = get_current_settings(
            self._configuration.current_settings, gantry_load
        )
        await self.set_default_currents()

    async def update_motor_status(self) -> None:
        """Retreieve motor and encoder status and position from all present nodes"""
        motor_nodes = self._motor_nodes()
        assert len(motor_nodes)
        response = await get_motor_position(self._messenger, motor_nodes)
        self._handle_motor_status_response(response)

    async def update_motor_estimation(self, axes: Sequence[Axis]) -> None:
        """Update motor position estimation for commanded nodes, and update cache of data."""
        nodes = set([axis_to_node(a) for a in axes])
        response = await update_motor_position_estimation(self._messenger, nodes)
        self._handle_motor_status_response(response)

    @property
    def grip_force_profile(self) -> Optional[GripForceProfile]:
        return self._gripper_force_settings

    @grip_force_profile.setter
    def grip_force_profile(self, profile: Optional[GripForceProfile]) -> None:
        self._gripper_force_settings = profile

    @property
    def motor_run_currents(self) -> OT3AxisMap[float]:
        assert self._current_settings
        run_currents: OT3AxisMap[float] = {}
        for axis, settings in self._current_settings.items():
            run_currents[axis] = settings.run_current
        return run_currents

    @property
    def motor_hold_currents(self) -> OT3AxisMap[float]:
        assert self._current_settings
        hold_currents: OT3AxisMap[float] = {}
        for axis, settings in self._current_settings.items():
            hold_currents[axis] = settings.hold_current
        return hold_currents

    @property
    def gpio_chardev(self) -> Union[OT3GPIO, RemoteOT3GPIO]:
        """Get the GPIO device."""
        return self._gpio_dev

    @property
    def board_revision(self) -> BoardRevision:
        """Get the board revision"""
        return BoardRevision.FLEX_B2

    @property
    def module_controls(self) -> AttachedModulesControl:
        """Get the module controls."""
        if self._module_controls is None:
            raise AttributeError("Module controls not found.")
        return self._module_controls

    @module_controls.setter
    def module_controls(self, module_controls: AttachedModulesControl) -> None:
        """Set the module controls"""
        self._module_controls = module_controls

    def _get_motor_status(self, ax: Sequence[Axis]) -> Iterator[Optional[MotorStatus]]:
        return (self._motor_status.get(axis_to_node(a)) for a in ax)

    def check_motor_status(self, axes: Sequence[Axis]) -> bool:
        return all(
            isinstance(status, MotorStatus) and status.motor_ok
            for status in self._get_motor_status(axes)
        )

    def check_encoder_status(self, axes: Sequence[Axis]) -> bool:
        return all(
            isinstance(status, MotorStatus) and status.encoder_ok
            for status in self._get_motor_status(axes)
        )

    async def update_position(self) -> OT3AxisMap[float]:
        """Get the current position."""
        return axis_convert(self._position, 0.0)

    async def update_encoder_position(self) -> OT3AxisMap[float]:
        """Get the encoder current position."""
        return axis_convert(self._encoder_position, 0.0)

    def _handle_motor_status_response(
        self,
        response: NodeMap[Tuple[float, float, bool, bool]],
    ) -> None:
        for axis, pos in response.items():
            self._position.update({axis: pos[0]})
            self._encoder_position.update({axis: pos[1]})
            # TODO (FPS 6-01-2023): Remove this once the Feature Flag to ignore stall detection is removed.
            # This check will latch the motor status for an axis at "true" if it was ever set to true.
            # To account for the case where a motor axis has its power reset, we also depend on the
            # "encoder_ok" flag staying set (it will only be False if the motor axis has not been
            # homed since a power cycle)
            motor_ok_latch = (
                (not ff.stall_detection_enabled())
                and ((axis in self._motor_status) and self._motor_status[axis].motor_ok)
                and self._motor_status[axis].encoder_ok
            )
            self._motor_status.update(
                {
                    axis: MotorStatus(
                        motor_ok=(pos[2] or motor_ok_latch), encoder_ok=pos[3]
                    )
                }
            )

    @requires_update
    async def move(
        self,
        origin: Coordinates[Axis, float],
        moves: List[Move[Axis]],
        stop_condition: MoveStopCondition = MoveStopCondition.none,
    ) -> None:
        """Move to a position.

        Args:
            origin: The starting point of the move
            moves: List of moves.
            stop_condition: The stop condition.

        Returns:
            None
        """
        group = create_move_group(origin, moves, self._motor_nodes(), stop_condition)
        move_group, _ = group
        runner = MoveGroupRunner(
            move_groups=[move_group],
            ignore_stalls=True if not ff.stall_detection_enabled() else False,
        )
        mounts_moving = [
            k
            for g in move_group
            for k in g.keys()
            if k in [NodeId.pipette_left, NodeId.pipette_right]
        ]
        async with self._monitor_overpressure(mounts_moving):
            positions = await runner.run(can_messenger=self._messenger)
        self._handle_motor_status_response(positions)

    def _get_axis_home_distance(self, axis: Axis) -> float:
        if self.check_motor_status([axis]):
            return -1 * (
                self._position[axis_to_node(axis)] + LIMIT_SWITCH_OVERTRAVEL_DISTANCE
            )
        else:
            return -1 * self.axis_bounds[axis][1] - self.axis_bounds[axis][0]

    def _build_axes_home_groups(
        self, axes: Sequence[Axis], speed_settings: Dict[OT3AxisKind, float]
    ) -> List[MoveGroup]:
        present_axes = [ax for ax in axes if self.axis_is_present(ax)]
        if not present_axes:
            return []
        else:
            distances = {ax: self._get_axis_home_distance(ax) for ax in present_axes}
            velocities = {
                ax: -1 * speed_settings[Axis.to_kind(ax)] for ax in present_axes
            }
            return create_home_groups(distances, velocities)

    def _build_home_pipettes_runner(
        self,
        axes: Sequence[Axis],
        gantry_load: GantryLoad,
    ) -> Optional[MoveGroupRunner]:
        pipette_axes = [ax for ax in axes if ax in Axis.pipette_axes()]
        if not pipette_axes:
            return None

        speed_settings = self._configuration.motion_settings.max_speed_discontinuity[
            gantry_load
        ]
        move_groups: List[MoveGroup] = self._build_axes_home_groups(
            pipette_axes, speed_settings
        )
        return MoveGroupRunner(move_groups=move_groups)

    def _build_home_gantry_z_runner(
        self,
        axes: Sequence[Axis],
        gantry_load: GantryLoad,
    ) -> Optional[MoveGroupRunner]:
        gantry_axes = [ax for ax in axes if ax in Axis.gantry_axes()]
        if not gantry_axes:
            return None

        speed_settings = self._configuration.motion_settings.max_speed_discontinuity[
            gantry_load
        ]

        # first home all the present mount axes
        z_axes = list(filter(lambda ax: ax in Axis.ot3_mount_axes(), gantry_axes))
        z_groups = self._build_axes_home_groups(z_axes, speed_settings)

        # home X axis before Y axis, to avoid collision with thermo-cycler lid
        # that could be in the back-left corner
        x_groups = (
            self._build_axes_home_groups([Axis.X], speed_settings)
            if Axis.X in gantry_axes
            else []
        )
        y_groups = (
            self._build_axes_home_groups([Axis.Y], speed_settings)
            if Axis.Y in gantry_axes
            else []
        )

        move_groups = [*z_groups, *x_groups, *y_groups]
        if move_groups:
            return MoveGroupRunner(move_groups=move_groups)
        return None

    @requires_update
    async def home(
        self, axes: Sequence[Axis], gantry_load: GantryLoad
    ) -> OT3AxisMap[float]:
        """Home each axis passed in, and reset the positions to 0.

        Args:
            axes: List[Axis]

        Returns:
            A dictionary containing the new positions of each axis
        """
        checked_axes = [axis for axis in axes if self.axis_is_present(axis)]
        assert Axis.G not in checked_axes, "Please home G axis using gripper_home_jaw()"
        if not checked_axes:
            return {}

        maybe_runners = (
            self._build_home_gantry_z_runner(checked_axes, gantry_load),
            self._build_home_pipettes_runner(checked_axes, gantry_load),
        )
        coros = [
            runner.run(can_messenger=self._messenger)
            for runner in maybe_runners
            if runner
        ]
        moving_pipettes = [
            axis_to_node(ax) for ax in checked_axes if ax in Axis.pipette_axes()
        ]
        async with self._monitor_overpressure(moving_pipettes):
            positions = await asyncio.gather(*coros)
        # TODO(CM): default gear motor homing routine to have some acceleration
        if Axis.Q in checked_axes:
            await self.tip_action(
                distance=self.axis_bounds[Axis.Q][1] - self.axis_bounds[Axis.Q][0],
                velocity=self._configuration.motion_settings.max_speed_discontinuity.high_throughput[
                    Axis.to_kind(Axis.Q)
                ],
                tip_action="home",
            )
        for position in positions:
            self._handle_motor_status_response(position)
        return axis_convert(self._position, 0.0)

    def _filter_move_group(self, move_group: MoveGroup) -> MoveGroup:
        new_group: MoveGroup = []
        for step in move_group:
            new_group.append(
                {
                    node: axis_step
                    for node, axis_step in step.items()
                    if node in self._motor_nodes()
                }
            )
        return new_group

    async def tip_action(
        self,
        moves: Optional[List[Move[Axis]]] = None,
        distance: Optional[float] = None,
        velocity: Optional[float] = None,
        tip_action: str = "home",
        back_off: Optional[bool] = False,
    ) -> None:
        # TODO: split this into two functions for homing and 'clamp'
        move_group = []
        # make sure either moves or distance and velocity is not None
        assert bool(moves) ^ (bool(distance) and bool(velocity))
        if moves is not None:
            move_group = create_tip_action_group(
                moves, [NodeId.pipette_left], tip_action
            )
        elif distance is not None and velocity is not None:
            move_group = create_gear_motor_home_group(
                float(distance), float(velocity), back_off
            )

        runner = MoveGroupRunner(
            move_groups=[move_group],
            ignore_stalls=True if not ff.stall_detection_enabled() else False,
        )
        positions = await runner.run(can_messenger=self._messenger)
        if NodeId.pipette_left in positions:
            self._gear_motor_position = {
                NodeId.pipette_left: positions[NodeId.pipette_left][0]
            }
        else:
            log.debug("no position returned from NodeId.pipette_left")

    @requires_update
    async def gripper_grip_jaw(
        self,
        duty_cycle: float,
        stop_condition: MoveStopCondition = MoveStopCondition.none,
    ) -> None:
        move_group = create_gripper_jaw_grip_group(duty_cycle, stop_condition)
        runner = MoveGroupRunner(move_groups=[move_group])
        positions = await runner.run(can_messenger=self._messenger)
        self._handle_motor_status_response(positions)

    @requires_update
    async def gripper_hold_jaw(
        self,
        encoder_position_um: int,
    ) -> None:
        move_group = create_gripper_jaw_hold_group(encoder_position_um)
        runner = MoveGroupRunner(move_groups=[move_group])
        positions = await runner.run(can_messenger=self._messenger)
        self._handle_motor_status_response(positions)

    @requires_update
    async def gripper_home_jaw(self, duty_cycle: float) -> None:
        move_group = create_gripper_jaw_home_group(duty_cycle)
        runner = MoveGroupRunner(move_groups=[move_group])
        positions = await runner.run(can_messenger=self._messenger)
        self._handle_motor_status_response(positions)

    @staticmethod
    def _lookup_serial_key(pipette_name: FirmwarePipetteName) -> str:
        lookup_name = {
            FirmwarePipetteName.p1000_single: "P1KS",
            FirmwarePipetteName.p1000_multi: "P1KM",
            FirmwarePipetteName.p50_single: "P50S",
            FirmwarePipetteName.p50_multi: "P50M",
            FirmwarePipetteName.p1000_96: "P1KH",
            FirmwarePipetteName.p50_96: "P50H",
        }
        return lookup_name[pipette_name]

    @staticmethod
    def _combine_serial_number(pipette_info: ohc_tool_types.PipetteInformation) -> str:
        serialized_name = OT3Controller._lookup_serial_key(pipette_info.name)
        version = pipette_load_name.version_from_string(pipette_info.model)
        return f"{serialized_name}V{version.major}{version.minor}{pipette_info.serial}"

    @staticmethod
    def _build_attached_pip(
        attached: ohc_tool_types.PipetteInformation, mount: OT3Mount
    ) -> AttachedPipette:
        if attached.name == FirmwarePipetteName.unknown:
            raise InvalidPipetteName(name=attached.name_int, mount=mount)
        try:
            # TODO (lc 12-8-2022) We should return model as an int rather than
            # a string.
            # TODO (lc 12-6-2022) We should also provide the full serial number
            # for PipetteInformation.serial so we don't have to use
            # helper methods to convert the serial back to what was flashed
            # on the eeprom.
            converted_name = pipette_load_name.convert_pipette_name(
                cast(PipetteName, attached.name.name), attached.model
            )
            return {
                "config": load_pipette_data.load_definition(
                    converted_name.pipette_type,
                    converted_name.pipette_channels,
                    converted_name.pipette_version,
                ),
                "id": OT3Controller._combine_serial_number(attached),
            }
        except KeyError:
            raise InvalidPipetteModel(
                name=attached.name.name, model=attached.model, mount=mount
            )

    @staticmethod
    def _build_attached_gripper(
        attached: ohc_tool_types.GripperInformation,
    ) -> AttachedGripper:
        model = gripper_config.info_num_to_model(attached.model)
        serial = attached.serial
        return {
            "config": gripper_config.load(model),
            "id": f"GRPV{attached.model.replace('.', '')}{serial}",
        }

    @staticmethod
    def _generate_attached_instrs(
        attached: ohc_tool_types.ToolSummary,
    ) -> Iterator[Tuple[OT3Mount, OT3AttachedInstruments]]:
        if attached.left:
            yield (
                OT3Mount.LEFT,
                OT3Controller._build_attached_pip(attached.left, OT3Mount.LEFT),
            )
        if attached.right:
            yield (
                OT3Mount.RIGHT,
                OT3Controller._build_attached_pip(attached.right, OT3Mount.RIGHT),
            )
        if attached.gripper:
            yield (
                OT3Mount.GRIPPER,
                OT3Controller._build_attached_gripper(attached.gripper),
            )

    async def get_attached_instruments(
        self, expected: Dict[OT3Mount, PipetteName]
    ) -> Dict[OT3Mount, OT3AttachedInstruments]:
        """Get attached instruments.

        Args:
            expected: Which mounts are expected.

        Returns:
            A map of mount to instrument name.
        """
        return dict(
            OT3Controller._generate_attached_instrs(self._subsystem_manager.tools)
        )

    async def get_limit_switches(self) -> OT3AxisMap[bool]:
        """Get the state of the gantry's limit switches on each axis."""
        motor_nodes = self._motor_nodes()
        assert motor_nodes, "No nodes available to read limit switch status from"
        res = await get_limit_switches(self._messenger, motor_nodes)
        return {node_to_axis(node): bool(val) for node, val in res.items()}

    async def get_tip_present(self, mount: OT3Mount, tip_state: TipStateType) -> None:
        """Raise an error if the expected tip state does not match the current state."""
        res = await self.get_tip_present_state(mount)
        if res != tip_state.value:
            raise FailedTipStateCheck(tip_state, res)

    async def get_tip_present_state(self, mount: OT3Mount) -> int:
        """Get the state of the tip ejector flag for a given mount."""
        res = await get_tip_ejector_state(
            self._messenger, sensor_node_for_mount(OT3Mount(mount.value))  # type: ignore
        )
        return res

    @staticmethod
    def _tip_motor_nodes(axis_current_keys: KeysView[Axis]) -> List[NodeId]:
        return [axis_to_node(Axis.Q)] if Axis.Q in axis_current_keys else []

    async def set_default_currents(self) -> None:
        """Set both run and hold currents from robot config to each node."""
        assert self._current_settings, "Invalid current settings"
        await set_currents(
            self._messenger,
            self._axis_map_to_present_nodes(
                {k: v.as_tuple() for k, v in self._current_settings.items()}
            ),
            use_tip_motor_message_for=self._tip_motor_nodes(
                self._current_settings.keys()
            ),
        )

    @requires_update
    async def set_active_current(self, axis_currents: OT3AxisMap[float]) -> None:
        """Set the active current.

        Args:
            axis_currents: Axes' currents

        Returns:
            None
        """
        assert self._current_settings, "Invalid current settings"
        await set_run_current(
            self._messenger,
            self._axis_map_to_present_nodes(axis_currents),
            use_tip_motor_message_for=self._tip_motor_nodes(axis_currents.keys()),
        )
        for axis, current in axis_currents.items():
            self._current_settings[axis].run_current = current

    @requires_update
    async def set_hold_current(self, axis_currents: OT3AxisMap[float]) -> None:
        """Set the hold current for motor.

        Args:
            axis_currents: Axes' currents

        Returns:
            None
        """
        assert self._current_settings, "Invalid current settings"
        await set_hold_current(
            self._messenger,
            self._axis_map_to_present_nodes(axis_currents),
            use_tip_motor_message_for=self._tip_motor_nodes(axis_currents.keys()),
        )
        for axis, current in axis_currents.items():
            self._current_settings[axis].hold_current = current

    @asynccontextmanager
    async def restore_current(self) -> AsyncIterator[None]:
        """Save the current."""
        old_current_settings = deepcopy(self._current_settings)
        try:
            yield
        finally:
            self._current_settings = old_current_settings
            await self.set_default_currents()

    @staticmethod
    def _build_event_watcher() -> aionotify.Watcher:
        watcher = aionotify.Watcher()
        watcher.watch(
            alias="modules",
            path="/dev",
            flags=(aionotify.Flags.CREATE | aionotify.Flags.DELETE),
        )
        return watcher

    async def _handle_watch_event(self) -> None:
        try:
            event = await self._event_watcher.get_event()
        except asyncio.IncompleteReadError:
            log.debug("incomplete read error when quitting watcher")
            return
        if event is not None:
            if "ot_module" in event.name:
                event_name = event.name
                flags = aionotify.Flags.parse(event.flags)
                event_description = AionotifyEvent.build(event_name, flags)
                await self.module_controls.handle_module_appearance(event_description)

    async def watch(self, loop: asyncio.AbstractEventLoop) -> None:
        can_watch = aionotify is not None
        if can_watch:
            await self._event_watcher.setup(loop)

        while can_watch and (not self._event_watcher.closed):
            await self._handle_watch_event()

    @property
    def axis_bounds(self) -> OT3AxisMap[Tuple[float, float]]:
        """Get the axis bounds."""
        # TODO (AL, 2021-11-18): The bounds need to be defined
        phony_bounds = (0, 10000)
        return {
            Axis.Z_L: phony_bounds,
            Axis.Z_R: phony_bounds,
            Axis.P_L: phony_bounds,
            Axis.P_R: phony_bounds,
            Axis.X: phony_bounds,
            Axis.Y: phony_bounds,
            Axis.Z_G: phony_bounds,
            Axis.Q: phony_bounds,
        }

    def engaged_axes(self) -> OT3AxisMap[bool]:
        """Get engaged axes."""
        return {}

    async def disengage_axes(self, axes: List[Axis]) -> None:
        """Disengage axes."""
        nodes = {axis_to_node(ax) for ax in axes}
        await set_disable_motor(self._messenger, nodes)

    async def engage_axes(self, axes: List[Axis]) -> None:
        """Engage axes."""
        nodes = {axis_to_node(ax) for ax in axes}
        await set_enable_motor(self._messenger, nodes)

    @requires_update
    async def set_lights(self, button: Optional[bool], rails: Optional[bool]) -> None:
        """Set the light states."""
        if rails is not None:
            await set_deck_light(1 if rails else 0, self._usb_messenger)

    @requires_update
    async def get_lights(self) -> Dict[str, bool]:
        """Get the light state."""
        return {
            "rails": await get_deck_light_state(self._usb_messenger),
            "button": False,
        }

    def pause(self) -> None:
        """Pause the controller activity."""
        return None

    def resume(self) -> None:
        """Resume the controller activity."""
        return None

    async def halt(self) -> None:
        """Halt the motors."""
        error = await self._messenger.ensure_send(
            NodeId.broadcast, StopRequest(payload=EmptyPayload())
        )
        if error != ErrorCode.ok:
            log.warning(f"Halt stop request failed: {error}")

    async def probe(self, axis: Axis, distance: float) -> OT3AxisMap[float]:
        """Probe."""
        return {}

    async def clean_up(self) -> None:
        """Clean up."""

        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            return

        if hasattr(self, "_event_watcher"):
            if loop.is_running() and self._event_watcher:
                self._event_watcher.close()
        return None

    @staticmethod
    def _get_home_position() -> Dict[NodeId, float]:
        return {
            NodeId.head_l: 0,
            NodeId.head_r: 0,
            NodeId.gantry_x: 0,
            NodeId.gantry_y: 0,
            NodeId.pipette_left: 0,
            NodeId.pipette_right: 0,
            NodeId.gripper_z: 0,
            NodeId.gripper_g: 0,
        }

    @staticmethod
    def home_position() -> OT3AxisMap[float]:
        return {
            node_to_axis(k): v for k, v in OT3Controller._get_home_position().items()
        }

    async def probe_network(self, timeout: float = 5.0) -> None:
        """Update the list of nodes present on the network.

        The stored result is used to make sure that move commands include entries
        for all present axes, so none incorrectly move before the others are ready.
        """
        await self._subsystem_manager.refresh()

    def axis_is_present(self, axis: Axis) -> bool:
        try:
            return axis_to_node(axis) in self._motor_nodes()
        except KeyError:
            # Currently unhandled axis
            return False

    def _axis_map_to_present_nodes(
        self, to_xform: OT3AxisMap[MapPayload]
    ) -> NodeMap[MapPayload]:
        by_node = {axis_to_node(k): v for k, v in to_xform.items()}
        return {k: v for k, v in by_node.items() if k in self._motor_nodes()}

    @asynccontextmanager
    async def _monitor_overpressure(self, mounts: List[NodeId]) -> AsyncIterator[None]:
        if ff.overpressure_detection_enabled() and mounts:
            tools_with_id = map_pipette_type_to_sensor_id(
                mounts, self._subsystem_manager.device_info
            )
            # FIXME we should switch the sensor type based on the channel
            # used when partial tip pick up is implemented.
            provided_context_manager = await check_overpressure(
                self._messenger, tools_with_id
            )
            errors: asyncio.Queue[Tuple[NodeId, ErrorCode]] = asyncio.Queue()

            async with provided_context_manager() as errors:
                try:
                    yield
                finally:

                    def _pop_queue() -> Optional[Tuple[NodeId, ErrorCode]]:
                        try:
                            return errors.get_nowait()
                        except asyncio.QueueEmpty:
                            return None

                    q_msg = _pop_queue()
                    if q_msg:
                        mount = Axis.to_ot3_mount(node_to_axis(q_msg[0]))
                        raise OverPressureDetected(
                            f"The pressure sensor on the {mount} mount has exceeded operational limits."
                        )
        else:
            yield

    async def liquid_probe(
        self,
        mount: OT3Mount,
        max_z_distance: float,
        mount_speed: float,
        plunger_speed: float,
        threshold_pascals: float,
        log_pressure: bool = True,
        auto_zero_sensor: bool = True,
        num_baseline_reads: int = 10,
        sensor_id: SensorId = SensorId.S0,
    ) -> Dict[NodeId, float]:
        head_node = axis_to_node(Axis.by_mount(mount))
        tool = sensor_node_for_pipette(OT3Mount(mount.value))
        positions = await liquid_probe(
            self._messenger,
            tool,
            head_node,
            max_z_distance,
            plunger_speed,
            mount_speed,
            threshold_pascals,
            log_pressure,
            auto_zero_sensor,
            num_baseline_reads,
            sensor_id,
        )
        for node, point in positions.items():
            self._position.update({node: point[0]})
            self._encoder_position.update({node: point[1]})
        return self._position

    async def capacitive_probe(
        self,
        mount: OT3Mount,
        moving: Axis,
        distance_mm: float,
        speed_mm_per_s: float,
        sensor_threshold_pf: float,
        probe: InstrumentProbeType,
    ) -> None:
        pos, _ = await capacitive_probe(
            self._messenger,
            sensor_node_for_mount(mount),
            axis_to_node(moving),
            distance_mm,
            speed_mm_per_s,
            sensor_id_for_instrument(probe),
            relative_threshold_pf=sensor_threshold_pf,
        )

        self._position[axis_to_node(moving)] = pos

    async def capacitive_pass(
        self,
        mount: OT3Mount,
        moving: Axis,
        distance_mm: float,
        speed_mm_per_s: float,
        probe: InstrumentProbeType,
    ) -> List[float]:
        data = await capacitive_pass(
            self._messenger,
            sensor_node_for_mount(mount),
            axis_to_node(moving),
            distance_mm,
            speed_mm_per_s,
            sensor_id_for_instrument(probe),
        )
        self._position[axis_to_node(moving)] += distance_mm
        return data

    async def release_estop(self) -> None:
        if self._gpio_dev is None:
            log.error("no gpio control available")
            raise IOError("no gpio control")
        elif isinstance(self._gpio_dev, RemoteOT3GPIO):
            await self._gpio_dev.deactivate_estop()
        else:
            self._gpio_dev.deactivate_estop()

    async def engage_estop(self) -> None:
        if self._gpio_dev is None:
            log.error("no gpio control available")
            raise IOError("no gpio control")
        elif isinstance(self._gpio_dev, RemoteOT3GPIO):
            await self._gpio_dev.activate_estop()
        else:
            self._gpio_dev.activate_estop()

    async def release_sync(self) -> None:
        if self._gpio_dev is None:
            log.error("no gpio control available")
            raise IOError("no gpio control")
        elif isinstance(self._gpio_dev, RemoteOT3GPIO):
            await self._gpio_dev.deactivate_nsync_out()
        else:
            self._gpio_dev.deactivate_nsync_out()

    async def engage_sync(self) -> None:
        if self._gpio_dev is None:
            log.error("no gpio control available")
            raise IOError("no gpio control")
        elif isinstance(self._gpio_dev, RemoteOT3GPIO):
            await self._gpio_dev.activate_nsync_out()
        else:
            self._gpio_dev.activate_nsync_out()

    async def door_state(self) -> DoorState:
        door_open = await get_door_state(self._usb_messenger)
        return DoorState.OPEN if door_open else DoorState.CLOSED

    def add_door_state_listener(self, callback: Callable[[DoorState], None]) -> None:
        def _door_listener(msg: BinaryMessageDefinition) -> None:
            door_state = (
                DoorState.OPEN
                if cast(DoorSwitchStateInfo, msg).door_open.value
                else DoorState.CLOSED
            )
            callback(door_state)

        if self._usb_messenger is not None:
            self._usb_messenger.add_listener(
                _door_listener,
                lambda message_id: bool(
                    message_id == BinaryMessageId.door_switch_state_info
                ),
            )

    def status_bar_interface(self) -> status_bar.StatusBar:
        return self._status_bar

    async def build_estop_detector(self) -> bool:
        """Must be called to set up the estop detector & state machine."""
        if self._drivers.usb_messenger is None:
            return False
        self._estop_detector = await EstopDetector.build(
            usb_messenger=self._drivers.usb_messenger
        )
        self._estop_state_machine.subscribe_to_detector(self._estop_detector)
        return True

    @property
    def estop_state_machine(self) -> EstopStateMachine:
        """Accessor for the API to get the state machine, if it exists."""
        return self._estop_state_machine
