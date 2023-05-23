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
from opentrons.config import ot3_pipette_config, gripper_config, feature_flags as ff
from .ot3utils import (
    UpdateProgress,
    axis_convert,
    create_move_group,
    axis_to_node,
    get_current_settings,
    create_home_group,
    node_to_axis,
    pipette_type_for_subtype,
    sensor_node_for_mount,
    sensor_id_for_instrument,
    create_gripper_jaw_grip_group,
    create_gripper_jaw_home_group,
    create_gripper_jaw_hold_group,
    create_tip_action_group,
    PipetteAction,
    sub_system_to_node_id,
    NODEID_SUBSYSTEM,
    USBTARGET_SUBSYSTEM,
    filter_probed_core_nodes,
    motor_nodes,
)

try:
    import aionotify  # type: ignore[import]
except (OSError, ModuleNotFoundError):
    aionotify = None

from opentrons_hardware.drivers.can_bus import CanMessenger, DriverSettings
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.binary_usb import (
    BinaryMessenger,
    SerialUsbDriver,
    build_rear_panel_driver,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.hardware_control.motion_planning import (
    Move,
    Coordinates,
)

from opentrons_hardware.hardware_control.motor_enable_disable import (
    set_enable_motor,
    set_disable_motor,
)
from opentrons_hardware.hardware_control.motor_position_status import (
    get_motor_position,
    update_motor_position_estimation,
)
from opentrons_hardware.hardware_control.limit_switches import get_limit_switches
from opentrons_hardware.hardware_control.network import NetworkInfo
from opentrons_hardware.hardware_control.current_settings import (
    set_run_current,
    set_hold_current,
    set_currents,
)
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    PipetteName as FirmwarePipetteName,
    SensorId,
    PipetteType,
    USBTarget,
    FirmwareTarget,
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
from opentrons_hardware import firmware_update


from opentrons.hardware_control.module_control import AttachedModulesControl
from opentrons.hardware_control.types import (
    BoardRevision,
    InstrumentFWInfo,
    OT3Axis,
    AionotifyEvent,
    OT3Mount,
    OT3AxisMap,
    CurrentConfig,
    MotorStatus,
    InstrumentProbeType,
    PipetteSubType,
    UpdateStatus,
    mount_to_subsystem,
    DoorState,
    OT3SubSystem,
)
from opentrons.hardware_control.errors import (
    InvalidPipetteName,
    InvalidPipetteModel,
    FirmwareUpdateRequired,
)
from opentrons_hardware.hardware_control.motion import (
    MoveStopCondition,
    MoveGroup,
)
from opentrons_hardware.hardware_control.types import NodeMap
from opentrons_hardware.hardware_control.tools import detector, types as ohc_tool_types

from opentrons_hardware.hardware_control.tool_sensors import (
    capacitive_probe,
    capacitive_pass,
    liquid_probe,
)
from opentrons_hardware.hardware_control.rear_panel_settings import (
    get_door_state,
    set_deck_light,
    get_deck_light_state,
)

from opentrons_hardware.drivers.gpio import OT3GPIO, RemoteOT3GPIO
from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons_shared_data.gripper.gripper_definition import GripForceProfile

if TYPE_CHECKING:
    from ..dev_types import (
        OT3AttachedPipette,
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

    _messenger: CanMessenger
    _usb_messenger: Optional[BinaryMessenger]
    _position: Dict[NodeId, float]
    _encoder_position: Dict[NodeId, float]
    _motor_status: Dict[NodeId, MotorStatus]
    _tool_detector: detector.OneshotToolDetector

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
        return cls(
            config, driver=driver, usb_driver=usb_driver, check_updates=check_updates
        )

    def __init__(
        self,
        config: OT3Config,
        driver: AbstractCanDriver,
        usb_driver: Optional[SerialUsbDriver] = None,
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
        self._gpio_dev, self._usb_messenger = self._build_system_hardware(usb_driver)
        self._tool_detector = detector.OneshotToolDetector(self._messenger)
        self._network_info = NetworkInfo(self._messenger, self._usb_messenger)
        self._position = self._get_home_position()
        self._encoder_position = self._get_home_position()
        self._motor_status = {}
        self._check_updates = check_updates
        self._update_required = False
        self._initialized = False
        self._update_tracker: Optional[UpdateProgress] = None
        self._status_bar = status_bar.StatusBar(messenger=self._usb_messenger)
        try:
            self._event_watcher = self._build_event_watcher()
        except AttributeError:
            log.warning(
                "Failed to initiate aionotify, cannot watch modules "
                "or door, likely because not running on linux"
            )
        self._present_devices: Set[FirmwareTarget] = set()
        self._current_settings: Optional[OT3AxisMap[CurrentConfig]] = None

    @property
    def initialized(self) -> bool:
        """True when the hardware controller has initialized and is ready."""
        return self._initialized

    @initialized.setter
    def initialized(self, value: bool) -> None:
        self._initialized = value

    @property
    def fw_version(self) -> Dict[OT3SubSystem, int]:
        """Get the firmware version."""
        subsystem_map: Dict[Union[NodeId, USBTarget], OT3SubSystem] = deepcopy(
            cast(Dict[Union[NodeId, USBTarget], OT3SubSystem], USBTARGET_SUBSYSTEM)
        )
        subsystem_map.update(
            cast(Dict[Union[NodeId, USBTarget], OT3SubSystem], NODEID_SUBSYSTEM)
        )
        return {
            subsystem_map[node.application_for()]: device.version
            for node, device in self._network_info.device_info.items()
        }

    @property
    def update_required(self) -> bool:
        return self._update_required and self._check_updates

    @update_required.setter
    def update_required(self, value: bool) -> None:
        if self._update_required != value:
            log.info(f"Firmware Update Flag set {self._update_required} -> {value}")
            self._update_required = value

    @staticmethod
    def _build_system_hardware(
        usb_driver: Optional[SerialUsbDriver],
    ) -> Tuple[Union[OT3GPIO, RemoteOT3GPIO], Optional[BinaryMessenger]]:
        if usb_driver is None:
            return OT3GPIO("hardware_control"), None
        else:
            usb_messenger = BinaryMessenger(usb_driver)
            usb_messenger.start()
            return RemoteOT3GPIO(usb_messenger), usb_messenger

    @staticmethod
    def _attached_pipettes_to_nodes(
        attached_pipettes: Dict[OT3Mount, PipetteSubType]
    ) -> Dict[NodeId, PipetteType]:
        pipette_nodes = {}
        for mount, subtype in attached_pipettes.items():
            subsystem = mount_to_subsystem(mount)
            node_id = sub_system_to_node_id(subsystem)
            pipette_type = pipette_type_for_subtype(subtype)
            pipette_nodes[node_id] = pipette_type
        return pipette_nodes

    def _motor_nodes(self) -> Set[NodeId]:
        return motor_nodes(self._present_devices)

    def get_instrument_update(
        self, mount: OT3Mount, pipette_subtype: Optional[PipetteSubType] = None
    ) -> InstrumentFWInfo:
        """Check whether the given instrument requires an update."""
        subsystem = mount_to_subsystem(mount)
        node_id = sub_system_to_node_id(subsystem)
        # get the pipette_type if this is a pipette
        attached_pipettes: Dict[NodeId, PipetteType] = dict()
        if mount in [OT3Mount.LEFT, OT3Mount.RIGHT] and pipette_subtype:
            attached_pipettes[node_id] = pipette_type_for_subtype(pipette_subtype)

        # check if this instrument requires an update
        firmware_updates = firmware_update.check_firmware_updates(
            self._network_info.device_info, attached_pipettes, targets={node_id}
        )
        device_info = self._network_info.device_info.get(node_id)
        current_fw_version = device_info.version if device_info else 0
        update_info = firmware_updates.get(node_id)
        update_required = bool(update_info)
        next_version = update_info[0] if update_info else None
        # set our global firmware update state if any updates are available
        self.update_required |= bool(firmware_updates)
        return InstrumentFWInfo(
            mount, update_required, current_fw_version, next_version
        )

    def get_update_progress(self) -> Set[UpdateStatus]:
        """Returns a set of UpdateStatus of the updates."""
        updates: Set[UpdateStatus] = set()
        if self._update_tracker:
            updates = self._update_tracker.get_progress()
        return updates

    async def update_firmware(
        self,
        attached_pipettes: Dict[OT3Mount, PipetteSubType],
        targets: Optional[Set[FirmwareTarget]] = None,
        force: bool = False,
    ) -> AsyncIterator[Set[UpdateStatus]]:
        """Updates the firmware on the OT3."""
        # Check that there arent updates already running for given nodes
        targets = targets or set(self._network_info.device_info)
        targets_updating = (
            self._update_tracker.targets if self._update_tracker else set()
        )
        targets_to_update = targets - targets_updating
        if not targets_to_update:
            log.info("No viable subsystem to update.")
            return

        attached_pipette_nodes = self._attached_pipettes_to_nodes(attached_pipettes)
        # Check if devices need an update, only checks nodes if given
        firmware_updates = firmware_update.check_firmware_updates(
            self._network_info.device_info,
            attached_pipette_nodes,
            targets=targets_to_update,
            force=force,
        )
        if not firmware_updates:
            log.info("No firmware updates required.")
            self.update_required = False
            return

        log.info("Firmware updates are available.")
        self._update_tracker = UpdateProgress(set(firmware_updates))
        self.update_required = True

        update_details = {
            target: update_info[1] for target, update_info in firmware_updates.items()
        }
        updater = firmware_update.RunUpdate(
            can_messenger=self._messenger,
            usb_messenger=self._usb_messenger,
            update_details=update_details,
            retry_count=3,
            timeout_seconds=20,
            erase=True,
        )

        # start the updates and yield progress to caller
        async for target, status_element in updater.run_updates():
            progress = self._update_tracker.update(target, status_element)
            yield progress

        # refresh the device_info cache and reset internal states
        await self._network_info.probe()
        self._update_tracker = None
        self.update_required = False

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

    async def update_motor_estimation(self, axes: Sequence[OT3Axis]) -> None:
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
        return BoardRevision.UNKNOWN

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

    def _get_motor_status(
        self, ax: Sequence[OT3Axis]
    ) -> Iterator[Optional[MotorStatus]]:
        return (self._motor_status.get(axis_to_node(a)) for a in ax)

    def check_motor_status(self, axes: Sequence[OT3Axis]) -> bool:
        return all(
            isinstance(status, MotorStatus) and status.motor_ok
            for status in self._get_motor_status(axes)
        )

    def check_encoder_status(self, axes: Sequence[OT3Axis]) -> bool:
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
            self._motor_status.update(
                {axis: MotorStatus(motor_ok=pos[2], encoder_ok=pos[3])}
            )

    @requires_update
    async def move(
        self,
        origin: Coordinates[OT3Axis, float],
        moves: List[Move[OT3Axis]],
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
        positions = await runner.run(can_messenger=self._messenger)
        self._handle_motor_status_response(positions)

    def _build_home_pipettes_runner(
        self,
        axes: Sequence[OT3Axis],
        gantry_load: GantryLoad,
    ) -> Optional[MoveGroupRunner]:
        speed_settings = self._configuration.motion_settings.max_speed_discontinuity[
            gantry_load
        ]

        distances_pipette = {
            ax: -1 * self.axis_bounds[ax][1] - self.axis_bounds[ax][0]
            for ax in axes
            if ax in OT3Axis.pipette_axes()
        }
        velocities_pipette = {
            ax: -1 * speed_settings[OT3Axis.to_kind(ax)]
            for ax in axes
            if ax in OT3Axis.pipette_axes()
        }

        move_group_pipette = []
        if distances_pipette and velocities_pipette:
            pipette_move = self._filter_move_group(
                create_home_group(distances_pipette, velocities_pipette)
            )
            move_group_pipette.append(pipette_move)

        if move_group_pipette:
            return MoveGroupRunner(move_groups=move_group_pipette, start_at_index=2)
        return None

    def _build_home_gantry_z_runner(
        self,
        axes: Sequence[OT3Axis],
        gantry_load: GantryLoad,
    ) -> Optional[MoveGroupRunner]:
        speed_settings = self._configuration.motion_settings.max_speed_discontinuity[
            gantry_load
        ]

        distances_gantry = {
            ax: -1 * self.axis_bounds[ax][1] - self.axis_bounds[ax][0]
            for ax in axes
            if ax in OT3Axis.gantry_axes() and ax not in OT3Axis.mount_axes()
        }
        velocities_gantry = {
            ax: -1 * speed_settings[OT3Axis.to_kind(ax)]
            for ax in axes
            if ax in OT3Axis.gantry_axes() and ax not in OT3Axis.mount_axes()
        }
        distances_z = {
            ax: -1 * self.axis_bounds[ax][1] - self.axis_bounds[ax][0]
            for ax in axes
            if ax in OT3Axis.mount_axes()
        }
        velocities_z = {
            ax: -1 * speed_settings[OT3Axis.to_kind(ax)]
            for ax in axes
            if ax in OT3Axis.mount_axes()
        }
        move_group_gantry_z = []
        if distances_z and velocities_z:
            z_move = self._filter_move_group(
                create_home_group(distances_z, velocities_z)
            )
            move_group_gantry_z.append(z_move)
        if distances_gantry and velocities_gantry:
            # home X axis before Y axis, to avoid collision with thermo-cycler lid
            # that could be in the back-left corner
            for ax in [OT3Axis.X, OT3Axis.Y]:
                if ax in axes:
                    gantry_move = self._filter_move_group(
                        create_home_group(
                            {ax: distances_gantry[ax]}, {ax: velocities_gantry[ax]}
                        )
                    )
                    move_group_gantry_z.append(gantry_move)
        if move_group_gantry_z:
            return MoveGroupRunner(move_groups=move_group_gantry_z)
        return None

    @requires_update
    async def home(
        self, axes: Sequence[OT3Axis], gantry_load: GantryLoad
    ) -> OT3AxisMap[float]:
        """Home each axis passed in, and reset the positions to 0.

        Args:
            axes: List[OT3Axis]

        Returns:
            A dictionary containing the new positions of each axis
        """
        checked_axes = [axis for axis in axes if self.axis_is_present(axis)]
        assert (
            OT3Axis.G not in checked_axes
        ), "Please home G axis using gripper_home_jaw()"
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
        positions = await asyncio.gather(*coros)
        if OT3Axis.Q in checked_axes:
            await self.tip_action(
                [OT3Axis.Q],
                self.axis_bounds[OT3Axis.Q][1] - self.axis_bounds[OT3Axis.Q][0],
                self._configuration.motion_settings.max_speed_discontinuity.high_throughput[
                    OT3Axis.to_kind(OT3Axis.Q)
                ],
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
        axes: Sequence[OT3Axis],
        distance: float,
        speed: float,
        tip_action: str = "home",
    ) -> None:
        if tip_action == "home":
            speed = speed * -1
        move_group = create_tip_action_group(
            axes, distance, speed, cast(PipetteAction, tip_action)
        )
        runner = MoveGroupRunner(move_groups=[move_group])
        positions = await runner.run(can_messenger=self._messenger)
        for axis, point in positions.items():
            self._position.update({axis: point[0]})
            self._encoder_position.update({axis: point[1]})

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
        version = ot3_pipette_config.version_from_string(pipette_info.model)
        return f"{serialized_name}V{version.major}{version.minor}{pipette_info.serial}"

    @staticmethod
    def _build_attached_pip(
        attached: ohc_tool_types.PipetteInformation, mount: OT3Mount
    ) -> OT3AttachedPipette:
        if attached.name == FirmwarePipetteName.unknown:
            raise InvalidPipetteName(name=attached.name_int, mount=mount)
        try:
            # TODO (lc 12-8-2022) We should return model as an int rather than
            # a string.
            # TODO (lc 12-6-2022) We should also provide the full serial number
            # for PipetteInformation.serial so we don't have to use
            # helper methods to convert the serial back to what was flashed
            # on the eeprom.
            return {
                "config": ot3_pipette_config.load_ot3_pipette(
                    ot3_pipette_config.convert_pipette_name(
                        cast(PipetteName, attached.name.name), attached.model
                    )
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
        await self._probe_core()
        attached = await self._tool_detector.detect()

        current_tools = dict(OT3Controller._generate_attached_instrs(attached))
        # remove pipette_left, pipette_right and gripper
        self._present_devices -= set(
            axis_to_node(OT3Axis.of_main_tool_actuator(mount)) for mount in OT3Mount
        )
        # add pipette_left, pipette_right and gripper if present
        for mount in current_tools.keys():
            self._present_devices.add(
                axis_to_node(OT3Axis.of_main_tool_actuator(mount))
            )
        return current_tools

    async def get_limit_switches(self) -> OT3AxisMap[bool]:
        """Get the state of the gantry's limit switches on each axis."""
        motor_nodes = self._motor_nodes()
        assert motor_nodes, "No nodes available to read limit switch status from"
        res = await get_limit_switches(self._messenger, motor_nodes)
        return {node_to_axis(node): bool(val) for node, val in res.items()}

    @staticmethod
    def _tip_motor_nodes(axis_current_keys: KeysView[OT3Axis]) -> List[NodeId]:
        return [axis_to_node(OT3Axis.Q)] if OT3Axis.Q in axis_current_keys else []

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
            OT3Axis.Z_L: phony_bounds,
            OT3Axis.Z_R: phony_bounds,
            OT3Axis.P_L: phony_bounds,
            OT3Axis.P_R: phony_bounds,
            OT3Axis.X: phony_bounds,
            OT3Axis.Y: phony_bounds,
            OT3Axis.Z_G: phony_bounds,
            OT3Axis.Q: phony_bounds,
        }

    def engaged_axes(self) -> OT3AxisMap[bool]:
        """Get engaged axes."""
        return {}

    async def disengage_axes(self, axes: List[OT3Axis]) -> None:
        """Disengage axes."""
        nodes = {axis_to_node(ax) for ax in axes}
        await set_disable_motor(self._messenger, nodes)

    async def engage_axes(self, axes: List[OT3Axis]) -> None:
        """Engage axes."""
        nodes = {axis_to_node(ax) for ax in axes}
        await set_enable_motor(self._messenger, nodes)

    async def set_lights(self, button: Optional[bool], rails: Optional[bool]) -> None:
        """Set the light states."""
        if rails is not None:
            await set_deck_light(1 if rails else 0, self._usb_messenger)

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

    async def probe(self, axis: OT3Axis, distance: float) -> OT3AxisMap[float]:
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

    async def _probe_core(self, timeout: float = 5.0) -> None:
        """Update the list of core nodes present on the network.

        Unlike probe_network, this always waits for the nodes that must be present for
        a working machine, and no more.
        """
        core_nodes: Set[FirmwareTarget] = {
            NodeId.gantry_x,
            NodeId.gantry_y,
            NodeId.head,
        }
        if self._usb_messenger is not None:
            core_nodes.add(USBTarget.rear_panel)
        core_present = set(await self._network_info.probe(core_nodes, timeout))
        self._present_devices = filter_probed_core_nodes(
            self._present_devices, core_present
        )

    async def probe_network(self, timeout: float = 5.0) -> None:
        """Update the list of nodes present on the network.

        The stored result is used to make sure that move commands include entries
        for all present axes, so none incorrectly move before the others are ready.
        """
        # TODO: Only add pipette ids to expected if the head indicates
        # they're present. In the meantime, we'll use get_attached_instruments to
        # see if we should expect instruments to be present, which should be removed
        # when that method actually does canbus stuff
        instrs = await self.get_attached_instruments({})
        expected: Set[FirmwareTarget] = {NodeId.gantry_x, NodeId.gantry_y, NodeId.head}
        if self._usb_messenger:
            expected.add(USBTarget.rear_panel)
        if instrs.get(OT3Mount.LEFT, cast("OT3AttachedPipette", {})).get(
            "config", None
        ):
            expected.add(NodeId.pipette_left)
        if instrs.get(OT3Mount.RIGHT, cast("OT3AttachedPipette", {})).get(
            "config", None
        ):
            expected.add(NodeId.pipette_right)
        if instrs.get(OT3Mount.GRIPPER, cast("AttachedGripper", {})).get(
            "config", None
        ):
            expected.add(NodeId.gripper)
        core_present = set(await self._network_info.probe(expected, timeout))
        self._present_devices = core_present
        log.info(f"The present devices are now {self._present_devices}")

    def axis_is_present(self, axis: OT3Axis) -> bool:
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
        head_node = axis_to_node(OT3Axis.by_mount(mount))
        tool = sensor_node_for_mount(OT3Mount(mount.value))
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
        moving: OT3Axis,
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
        moving: OT3Axis,
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
