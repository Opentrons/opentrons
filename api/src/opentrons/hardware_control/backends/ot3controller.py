"""OT3 Hardware Controller Backend."""

from __future__ import annotations
import asyncio
from contextlib import contextmanager
import logging
from typing import (
    Dict,
    List,
    Optional,
    Tuple,
    TYPE_CHECKING,
    Sequence,
    Generator,
    cast,
    Set,
)
from opentrons.config.types import OT3Config, GantryLoad
from opentrons.drivers.rpi_drivers.gpio_simulator import SimulatingGPIOCharDev
from opentrons.config import pipette_config
from .ot3utils import (
    axis_convert,
    create_move_group,
    axis_to_node,
    get_current_settings,
    create_home_group,
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

from opentrons_hardware.hardware_control.network import probe
from opentrons_hardware.hardware_control.current_settings import (
    set_run_current,
    set_hold_current,
    set_currents,
)
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    SetupRequest,
    EnableMotorRequest,
)
from opentrons_hardware.firmware_bindings.messages.payloads import EmptyPayload

from opentrons.hardware_control.module_control import AttachedModulesControl
from opentrons.hardware_control.types import (
    BoardRevision,
    OT3Axis,
    AionotifyEvent,
    OT3Mount,
    OT3AxisMap,
    CurrentConfig,
)
from opentrons_hardware.hardware_control.motion import MoveStopCondition

if TYPE_CHECKING:
    from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel
    from ..dev_types import (
        AttachedInstrument,
        InstrumentHardwareConfigs,
    )
    from opentrons.drivers.rpi_drivers.dev_types import GPIODriverLike

log = logging.getLogger(__name__)

_FIXED_PIPETTE_ID: str = "P1KSV3120211118A01"
_FIXED_PIPETTE_NAME: PipetteName = "p1000_single_gen3"
_FIXED_PIPETTE_MODEL: PipetteModel = cast("PipetteModel", "p1000_single_v3.0")


class OT3Controller:
    """OT3 Hardware Controller Backend."""

    _messenger: CanMessenger
    _position: Dict[NodeId, float]

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
        self._gpio_dev = SimulatingGPIOCharDev("simulated")
        self._module_controls: Optional[AttachedModulesControl] = None
        self._messenger = CanMessenger(driver=driver)
        self._messenger.start()
        self._position = self._get_home_position()
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

    async def setup_motors(self) -> None:
        """Set up the motors."""
        await self._messenger.send(
            node_id=NodeId.broadcast,
            message=SetupRequest(payload=EmptyPayload()),
        )
        await self._messenger.send(
            node_id=NodeId.broadcast,
            message=EnableMotorRequest(payload=EmptyPayload()),
        )

    @property
    def gpio_chardev(self) -> GPIODriverLike:
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

    async def move(
        self,
        origin: Coordinates[OT3Axis, float],
        moves: List[Move[OT3Axis]],
        stop_condition: MoveStopCondition = MoveStopCondition.none,
    ) -> None:
        """Move to a position.

        Args:
            target_position: Map of axis to position.
            home_flagged_axes: Whether to home afterwords.
            speed: Optional speed
            axis_max_speeds: Optional map of axis to speed.

        Returns:
            None
        """
        group = create_move_group(origin, moves, self._present_nodes, stop_condition)
        move_group, final_positions = group
        runner = MoveGroupRunner(move_groups=[move_group])
        await runner.run(can_messenger=self._messenger)
        self._position.update(final_positions)

    async def home(self, axes: List[OT3Axis]) -> OT3AxisMap[float]:
        """Home each axis passed in, and reset the positions to 0.

        Args:
            axes: List[OT3Axis]

        Returns:
            A dictionary containing the new positions of each axis
        """
        if not axes:
            return {}
        distances = {
            ax: -1 * self.axis_bounds[ax][1] - self.axis_bounds[ax][0] for ax in axes
        }
        speed_settings = (
            self._configuration.motion_settings.max_speed_discontinuity.none
        )
        velocities = {ax: -1 * speed_settings[OT3Axis.to_kind(ax)] for ax in axes}
        group = create_home_group(distances, velocities)
        runner = MoveGroupRunner(move_groups=[group])
        await runner.run(can_messenger=self._messenger)

        for ax in axes:
            self._position[axis_to_node(ax)] = 0
        axis_positions = {ax: 0.0 for ax in axes}

        return axis_positions

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
        return axis_convert(self._position, 0.0)

    async def get_attached_instruments(
        self, expected: Dict[OT3Mount, PipetteName]
    ) -> Dict[OT3Mount, AttachedInstrument]:
        """Get attached instruments.

        Args:
            expected: Which mounts are expected.

        Returns:
            A map of mount to pipette name.
        """
        if (
            expected.get(OT3Mount.LEFT)
            and expected.get(OT3Mount.LEFT) != _FIXED_PIPETTE_NAME
        ):
            raise RuntimeError(f"only support {_FIXED_PIPETTE_NAME}  right now")

        return {
            OT3Mount.LEFT: {
                "config": pipette_config.load(_FIXED_PIPETTE_MODEL, _FIXED_PIPETTE_ID),
                "id": _FIXED_PIPETTE_ID,
            }
        }

    async def set_default_currents(self) -> None:
        """Set both run and hold currents from robot config to each node."""
        assert self._current_settings, "Invalid current settings"
        await set_currents(
            self._messenger,
            {axis_to_node(k): v.as_tuple() for k, v in self._current_settings.items()},
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
            self._messenger, {axis_to_node(k): v for k, v in axis_currents.items()}
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
            self._messenger, {axis_to_node(k): v for k, v in axis_currents.items()}
        )
        for axis, current in axis_currents.items():
            self._current_settings[axis].hold_current = current

    @contextmanager
    def save_current(self) -> Generator[None, None, None]:
        """Save the current."""
        yield

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

    async def update_firmware(
        self, filename: str, loop: asyncio.AbstractEventLoop, modeset: bool
    ) -> str:
        """Update the firmware."""
        return "Done"

    def engaged_axes(self) -> OT3AxisMap[bool]:
        """Get engaged axes."""
        return {}

    async def disengage_axes(self, axes: List[OT3Axis]) -> None:
        """Disengage axes."""
        return None

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
        }

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
        expected = set((NodeId.gantry_x, NodeId.gantry_y, NodeId.head))
        if instrs.get(OT3Mount.LEFT, cast("AttachedInstrument", {})).get(
            "config", None
        ):
            expected.add(NodeId.pipette_left)
        if instrs.get(OT3Mount.RIGHT, cast("AttachedInstrument", {})).get(
            "config", None
        ):
            expected.add(NodeId.pipette_right)
        present = await probe(self._messenger, expected, timeout)
        if NodeId.head in present:
            present.remove(NodeId.head)
            present.add(NodeId.head_r)
            present.add(NodeId.head_l)
        self._present_nodes = present
