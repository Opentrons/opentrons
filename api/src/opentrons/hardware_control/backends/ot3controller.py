"""OT3 Hardware Controller Backend."""

from __future__ import annotations
import asyncio
from contextlib import asynccontextmanager
import logging
from copy import deepcopy
from typing import (
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
)
from opentrons.config.types import OT3Config, GantryLoad
from opentrons.config import pipette_config, gripper_config
from .ot3utils import (
    axis_convert,
    create_move_group,
    axis_to_node,
    get_current_settings,
    create_home_group,
    node_to_axis,
    sub_system_to_node_id,
    sensor_node_for_mount,
    create_gripper_jaw_grip_group,
    create_gripper_jaw_home_group,
    create_gripper_jaw_hold_group,
)

try:
    import aionotify  # type: ignore[import]
except (OSError, ModuleNotFoundError):
    aionotify = None

from opentrons_hardware.drivers.can_bus import CanMessenger, DriverSettings
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.hardware_control.motion_planning import (
    Move,
    Coordinates,
)

from opentrons_hardware.hardware_control.motor_enable_disable import (
    set_enable_motor,
    set_disable_motor,
)
from opentrons_hardware.hardware_control.limit_switches import get_limit_switches
from opentrons_hardware.hardware_control.network import probe
from opentrons_hardware.hardware_control.current_settings import (
    set_run_current,
    set_hold_current,
    set_currents,
)
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    PipetteName as FirmwarePipetteName,
)
from opentrons_hardware import firmware_update

from opentrons.hardware_control.module_control import AttachedModulesControl
from opentrons.hardware_control.types import (
    BoardRevision,
    OT3Axis,
    AionotifyEvent,
    OT3Mount,
    OT3AxisMap,
    CurrentConfig,
    OT3SubSystem,
    InvalidPipetteName,
    InvalidPipetteModel,
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
)
from opentrons_hardware.drivers.gpio import OT3GPIO

if TYPE_CHECKING:
    from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel
    from ..dev_types import (
        AttachedPipette,
        AttachedGripper,
        OT3AttachedInstruments,
        InstrumentHardwareConfigs,
    )

log = logging.getLogger(__name__)

MapPayload = TypeVar("MapPayload")


class OT3Controller:
    """OT3 Hardware Controller Backend."""

    _messenger: CanMessenger
    _position: Dict[NodeId, float]
    _encoder_position: Dict[NodeId, float]
    _tool_detector: detector.OneshotToolDetector

    @classmethod
    async def build(cls, config: OT3Config) -> OT3Controller:
        """Create the OT3Controller instance.

        Args:
            config: Robot configuration

        Returns:
            Instance.
        """
        driver = await build_driver(DriverSettings())
        return cls(config, driver=driver)

    def __init__(self, config: OT3Config, driver: AbstractCanDriver) -> None:
        """Construct.

        Args:
            config: Robot configuration
            driver: The Can Driver
        """
        self._configuration = config
        self._gpio_dev = OT3GPIO("hardware_control")
        self._module_controls: Optional[AttachedModulesControl] = None
        self._messenger = CanMessenger(driver=driver)
        self._messenger.start()
        self._tool_detector = detector.OneshotToolDetector(self._messenger)
        self._position = self._get_home_position()
        self._encoder_position = self._get_home_position()
        try:
            self._event_watcher = self._build_event_watcher()
        except AttributeError:
            log.warning(
                "Failed to initiate aionotify, cannot watch modules "
                "or door, likely because not running on linux"
            )
        self._present_nodes: Set[NodeId] = set()
        self._current_settings: Optional[OT3AxisMap[CurrentConfig]] = None

    async def update_to_default_current_settings(self, gantry_load: GantryLoad) -> None:
        self._current_settings = get_current_settings(
            self._configuration.current_settings, gantry_load
        )
        await self.set_default_currents()

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
    def gpio_chardev(self) -> OT3GPIO:
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

    def is_homed(self, axes: Sequence[OT3Axis]) -> bool:
        return True

    async def update_position(self) -> OT3AxisMap[float]:
        """Get the current position."""
        return axis_convert(self._position, 0.0)

    async def update_encoder_position(self) -> OT3AxisMap[float]:
        """Get the encoder current position."""
        return axis_convert(self._encoder_position, 0.0)

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
        group = create_move_group(origin, moves, self._present_nodes, stop_condition)
        move_group, _ = group
        runner = MoveGroupRunner(move_groups=[move_group])
        positions = await runner.run(can_messenger=self._messenger)
        for axis, point in positions.items():
            self._position.update({axis: point[0]})
            self._encoder_position.update({axis: point[1]})

    def _build_home_pipettes_runner(
        self, axes: Sequence[OT3Axis]
    ) -> Optional[MoveGroupRunner]:
        speed_settings = (
            self._configuration.motion_settings.max_speed_discontinuity.none
        )

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
        self, axes: Sequence[OT3Axis]
    ) -> Optional[MoveGroupRunner]:
        speed_settings = (
            self._configuration.motion_settings.max_speed_discontinuity.none
        )

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
            gantry_move = self._filter_move_group(
                create_home_group(distances_gantry, velocities_gantry)
            )
            move_group_gantry_z.append(gantry_move)
        if move_group_gantry_z:
            return MoveGroupRunner(move_groups=move_group_gantry_z)
        return None

    async def home(self, axes: Sequence[OT3Axis]) -> OT3AxisMap[float]:
        """Home each axis passed in, and reset the positions to 0.

        Args:
            axes: List[OT3Axis]

        Returns:
            A dictionary containing the new positions of each axis
        """
        checked_axes = [axis for axis in axes if self._axis_is_present(axis)]
        if not checked_axes:
            return {}

        maybe_runners = (
            self._build_home_gantry_z_runner(checked_axes),
            self._build_home_pipettes_runner(checked_axes),
        )
        coros = [
            runner.run(can_messenger=self._messenger)
            for runner in maybe_runners
            if runner
        ]
        positions = await asyncio.gather(*coros)
        if OT3Axis.G in checked_axes:
            await self.gripper_home_jaw()
        for position in positions:
            for p in position.items():
                self._position.update({p[0]: p[1][0]})
                self._encoder_position.update({p[0]: p[1][1]})
        return axis_convert(self._position, 0.0)

    def _filter_move_group(self, move_group: MoveGroup) -> MoveGroup:
        new_group: MoveGroup = []
        for step in move_group:
            new_group.append(
                {
                    node: axis_step
                    for node, axis_step in step.items()
                    if node in self._present_nodes
                }
            )
        return new_group

    async def fast_home(
        self, axes: Sequence[OT3Axis], margin: float
    ) -> OT3AxisMap[float]:
        """Fast home axes.

        Args:
            axes: List of axes to home.
            margin: Margin

        Returns:
            New position.
        """
        return await self.home(axes)

    async def gripper_grip_jaw(
        self,
        duty_cycle: float,
        stop_condition: MoveStopCondition = MoveStopCondition.none,
    ) -> None:
        move_group = create_gripper_jaw_grip_group(duty_cycle, stop_condition)
        runner = MoveGroupRunner(move_groups=[move_group])
        positions = await runner.run(can_messenger=self._messenger)
        for axis, point in positions.items():
            self._position.update({axis: point[0]})
            self._encoder_position.update({axis: point[1]})

    async def gripper_hold_jaw(
        self,
        encoder_position_um: int,
    ) -> None:
        move_group = create_gripper_jaw_hold_group(encoder_position_um)
        runner = MoveGroupRunner(move_groups=[move_group])
        positions = await runner.run(can_messenger=self._messenger)
        for axis, point in positions.items():
            self._position.update({axis: point[0]})
            self._encoder_position.update({axis: point[1]})

    async def gripper_home_jaw(self) -> None:
        move_group = create_gripper_jaw_home_group()
        runner = MoveGroupRunner(move_groups=[move_group])
        positions = await runner.run(can_messenger=self._messenger)
        for axis, point in positions.items():
            self._position.update({axis: point[0]})
            self._encoder_position.update({axis: point[1]})

    @staticmethod
    def _synthesize_model_name(name: FirmwarePipetteName, model: str) -> "PipetteModel":
        return cast("PipetteModel", f"{name.name}_v{model}")

    @staticmethod
    def _build_attached_pip(
        attached: ohc_tool_types.PipetteInformation, mount: OT3Mount
    ) -> AttachedPipette:
        if attached.name == FirmwarePipetteName.unknown:
            raise InvalidPipetteName(name=attached.name_int, mount=mount)
        try:
            return {
                "config": pipette_config.load(
                    OT3Controller._synthesize_model_name(attached.name, attached.model)
                ),
                "id": attached.serial,
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
            "config": gripper_config.load(model, serial),
            "id": serial,
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
        self._present_nodes -= set(
            axis_to_node(OT3Axis.of_main_tool_actuator(mount)) for mount in OT3Mount
        )
        for mount in current_tools.keys():
            self._present_nodes.add(axis_to_node(OT3Axis.of_main_tool_actuator(mount)))
        return current_tools

    async def get_limit_switches(self) -> OT3AxisMap[bool]:
        """Get the state of the gantry's limit switches on each axis."""
        assert (
            self._present_nodes
        ), "No nodes available to read limit switch status from"
        res = await get_limit_switches(self._messenger, self._present_nodes)
        return {node_to_axis(node): bool(val) for node, val in res.items()}

    async def set_default_currents(self) -> None:
        """Set both run and hold currents from robot config to each node."""
        assert self._current_settings, "Invalid current settings"
        await set_currents(
            self._messenger,
            self._axis_map_to_present_nodes(
                {k: v.as_tuple() for k, v in self._current_settings.items()}
            ),
        )

    async def set_active_current(self, axis_currents: OT3AxisMap[float]) -> None:
        """Set the active current.

        Args:
            axis_currents: Axes' currents

        Returns:
            None
        """
        assert self._current_settings, "Invalid current settings"
        await set_run_current(
            self._messenger, self._axis_map_to_present_nodes(axis_currents)
        )
        for axis, current in axis_currents.items():
            self._current_settings[axis].run_current = current

    async def set_hold_current(self, axis_currents: OT3AxisMap[float]) -> None:
        """Set the hold current for motor.

        Args:
            axis_currents: Axes' currents

        Returns:
            None
        """
        assert self._current_settings, "Invalid current settings"
        await set_hold_current(
            self._messenger, self._axis_map_to_present_nodes(axis_currents)
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
        }

    def single_boundary(self, boundary: int) -> OT3AxisMap[float]:
        return {ax: bound[boundary] for ax, bound in self.axis_bounds.items()}

    @property
    def fw_version(self) -> Optional[str]:
        """Get the firmware version."""
        return None

    async def update_firmware(self, filename: str, target: OT3SubSystem) -> None:
        """Update the firmware."""
        with open(filename, "r") as f:
            await firmware_update.run_update(
                messenger=self._messenger,
                node_id=sub_system_to_node_id(target),
                hex_file=f,
                # TODO (amit, 2022-04-05): Fill in retry_count and timeout_seconds from
                #  config values.
                retry_count=3,
                timeout_seconds=20,
                erase=True,
            )

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

    def set_lights(self, button: Optional[bool], rails: Optional[bool]) -> None:
        """Set the light states."""
        return None

    def get_lights(self) -> Dict[str, bool]:
        """Get the light state."""
        return {}

    def pause(self) -> None:
        """Pause the controller activity."""
        return None

    def resume(self) -> None:
        """Resume the controller activity."""
        return None

    async def halt(self) -> None:
        """Halt the motors."""
        return None

    async def hard_halt(self) -> None:
        """Halt the motors."""
        return None

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

    async def configure_mount(
        self, mount: OT3Mount, config: InstrumentHardwareConfigs
    ) -> None:
        """Configure a mount."""
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

    @staticmethod
    def _replace_head_node(nodes: Set[NodeId]) -> Set[NodeId]:
        """Replace the head core node with its two sides.

        The node ID for the head central controller is what shows up in a network probe,
        but what we actually send commands to an overwhelming majority of the time is
        the head_l and head_r synthetic node IDs, and those are what we want in the
        network map.
        """
        if NodeId.head in nodes:
            nodes.remove(NodeId.head)
            nodes.add(NodeId.head_r)
            nodes.add(NodeId.head_l)
        return nodes

    @staticmethod
    def _replace_gripper_node(nodes: Set[NodeId]) -> Set[NodeId]:
        """Replace the gripper core node with its two axes.

        The node ID for the gripper controller is what shows up in a network probe,
        but what we actually send most commands to is the gripper_z and gripper_g
        synthetic nodes, so we should have them in the network map instead.
        """
        if NodeId.gripper in nodes:
            nodes.remove(NodeId.gripper)
            nodes.add(NodeId.gripper_z)
            nodes.add(NodeId.gripper_g)
        return nodes

    @staticmethod
    def _filter_probed_core_nodes(
        current_set: Set[NodeId], probed_set: Set[NodeId]
    ) -> Set[NodeId]:
        probed_set = OT3Controller._replace_head_node(probed_set)
        core_replaced: Set[NodeId] = {
            NodeId.gantry_x,
            NodeId.gantry_y,
            NodeId.head_l,
            NodeId.head_r,
        }
        current_set -= core_replaced
        current_set |= probed_set
        return current_set

    async def _probe_core(self, timeout: float = 5.0) -> None:
        """Update the list of core nodes present on the network.

        Unlike probe_network, this always waits for the nodes that must be present for
        a working machine, and no more.
        """
        core_nodes = {NodeId.gantry_x, NodeId.gantry_y, NodeId.head}
        core_present = await probe(self._messenger, core_nodes, timeout)
        self._present_nodes = self._filter_probed_core_nodes(
            self._present_nodes, core_present
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
        expected = {NodeId.gantry_x, NodeId.gantry_y, NodeId.head}
        if instrs.get(OT3Mount.LEFT, cast("AttachedPipette", {})).get("config", None):
            expected.add(NodeId.pipette_left)
        if instrs.get(OT3Mount.RIGHT, cast("AttachedPipette", {})).get("config", None):
            expected.add(NodeId.pipette_right)
        if instrs.get(OT3Mount.GRIPPER, cast("AttachedGripper", {})).get(
            "config", None
        ):
            expected.add(NodeId.gripper)
        present = await probe(self._messenger, expected, timeout)
        self._present_nodes = self._replace_gripper_node(
            self._replace_head_node(present)
        )

    def _axis_is_present(self, axis: OT3Axis) -> bool:
        try:
            return axis_to_node(axis) in self._present_nodes
        except KeyError:
            # Currently unhandled axis
            return False

    def _axis_map_to_present_nodes(
        self, to_xform: OT3AxisMap[MapPayload]
    ) -> NodeMap[MapPayload]:
        by_node = {axis_to_node(k): v for k, v in to_xform.items()}
        return {k: v for k, v in by_node.items() if k in self._present_nodes}

    async def capacitive_probe(
        self,
        mount: OT3Mount,
        moving: OT3Axis,
        distance_mm: float,
        speed_mm_per_s: float,
        sensor_threshold_pf: float,
    ) -> None:
        pos, _ = await capacitive_probe(
            self._messenger,
            sensor_node_for_mount(mount),
            axis_to_node(moving),
            distance_mm,
            speed_mm_per_s,
            relative_threshold_pf=sensor_threshold_pf,
            log_sensor_values=True,
        )

        self._position[axis_to_node(moving)] = pos

    async def capacitive_pass(
        self,
        mount: OT3Mount,
        moving: OT3Axis,
        distance_mm: float,
        speed_mm_per_s: float,
    ) -> List[float]:
        data = await capacitive_pass(
            self._messenger,
            sensor_node_for_mount(mount),
            axis_to_node(moving),
            distance_mm,
            speed_mm_per_s,
        )
        self._position[axis_to_node(moving)] += distance_mm
        return data
