"""OT3 Hardware Controller Backend."""

from __future__ import annotations
import asyncio
from contextlib import contextmanager
import logging
from typing import Dict, List, Optional, Tuple, TYPE_CHECKING, Sequence, Generator

from opentrons.config.types import RobotConfig
from opentrons.drivers.rpi_drivers.gpio_simulator import SimulatingGPIOCharDev
from opentrons.types import Mount

try:
    from opentrons_hardware.drivers.can_bus import CanDriver, CanMessenger
    from opentrons_hardware.hardware_control.motion import create
    from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
    from opentrons_ot3_firmware.constants import NodeId
    from opentrons_ot3_firmware.messages.message_definitions import (
        SetupRequest,
        EnableMotorRequest,
    )
    from opentrons_ot3_firmware.messages.payloads import EmptyPayload
except ModuleNotFoundError:
    pass

from .module_control import AttachedModulesControl
from .types import BoardRevision, Axis

if TYPE_CHECKING:
    from opentrons_shared_data.pipette.dev_types import PipetteName
    from .dev_types import (
        AttachedInstruments,
        InstrumentHardwareConfigs,
    )
    from opentrons.drivers.rpi_drivers.dev_types import GPIODriverLike

log = logging.getLogger(__name__)


AxisValueMap = Dict[str, float]


class OT3Controller:
    """OT3 Hardware Controller Backend."""

    _messenger: CanMessenger
    _position: Dict[NodeId, float]

    @classmethod
    async def build(cls, config: RobotConfig) -> OT3Controller:
        """Create the OT3Controller instance.

        Args:
            config: Robot configuration

        Returns:
            Instance.
        """
        driver = await CanDriver.from_env()
        return cls(config, driver=driver)

    def __init__(self, config: RobotConfig, driver: CanDriver) -> None:
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

    def is_homed(self, axes: Sequence[str]) -> bool:
        return True

    async def update_position(self) -> AxisValueMap:
        """Get the current position."""
        return self._axis_convert(self._position)

    @staticmethod
    def _axis_convert(position: Dict[NodeId, float]) -> AxisValueMap:
        ret: AxisValueMap = {"A": 0, "B": 0, "C": 0, "X": 0, "Y": 0, "Z": 0}
        for node, pos in position.items():
            if node == NodeId.head_l:
                ret["A"] = pos
            elif node == NodeId.head_r:
                ret["Z"] = pos
            elif node == NodeId.gantry_x:
                ret["X"] = pos
            elif node == NodeId.gantry_y:
                ret["Y"] = pos
        log.info(f"update_position: {ret}")
        return ret

    async def move(
        self,
        target_position: AxisValueMap,
        home_flagged_axes: bool = True,
        speed: Optional[float] = None,
        axis_max_speeds: Optional[AxisValueMap] = None,
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
        log.info(f"move: {target_position}")
        target: Dict[NodeId, float] = {}
        for axis, pos in target_position.items():
            if axis == "A":
                target[NodeId.head_l] = pos
            elif axis == "Z":
                target[NodeId.head_r] = pos
            elif axis == "X":
                target[NodeId.gantry_x] = pos
            elif axis == "Y":
                target[NodeId.gantry_y] = pos

        log.info(f"move targets: {target}")
        move_group = create(origin=self._position, target=target, speed=speed or 5000.0)
        runner = MoveGroupRunner(move_groups=move_group)
        await runner.run(can_messenger=self._messenger)
        self._position = target

    async def home(self, axes: Optional[List[str]] = None) -> AxisValueMap:
        """Home axes.

        Args:
            axes: Optional list of axes.

        Returns:
            Homed position.
        """
        self._position = self._get_home_position()
        return self._axis_convert(self._position)

    async def fast_home(self, axes: Sequence[str], margin: float) -> AxisValueMap:
        """Fast home axes.

        Args:
            axes: List of axes to home.
            margin: Margin

        Returns:
            New position.
        """
        self._position = self._get_home_position()
        return self._axis_convert(self._position)

    async def get_attached_instruments(
        self, expected: Dict[Mount, PipetteName]
    ) -> AttachedInstruments:
        """Get attached instruments.

        Args:
            expected: Which mounts are expected.

        Returns:
            A map of mount to pipette name.
        """
        return {}

    def set_active_current(self, axis_currents: Dict[Axis, float]) -> None:
        """Set the active current.

        Args:
            axis_currents: Axes' currents

        Returns:
            None
        """
        return None

    @contextmanager
    def save_current(self) -> Generator[None, None, None]:
        """Save the current."""
        yield

    async def watch(self, loop: asyncio.AbstractEventLoop) -> None:
        """Watch hardware events."""
        return None

    @property
    def axis_bounds(self) -> Dict[Axis, Tuple[float, float]]:
        """Get the axis bounds."""
        # TODO (AL, 2021-11-18): The bounds need to be defined
        phony_bounds = (0, 10000)
        return {
            Axis.A: phony_bounds,
            Axis.B: phony_bounds,
            Axis.C: phony_bounds,
            Axis.X: phony_bounds,
            Axis.Y: phony_bounds,
            Axis.Z: phony_bounds,
        }

    @property
    def fw_version(self) -> Optional[str]:
        """Get the firmware version."""
        return None

    async def update_firmware(
        self, filename: str, loop: asyncio.AbstractEventLoop, modeset: bool
    ) -> str:
        """Update the firmware."""
        return "Done"

    def engaged_axes(self) -> Dict[str, bool]:
        """Get engaged axes."""
        return {}

    async def disengage_axes(self, axes: List[str]) -> None:
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

    async def probe(self, axis: str, distance: float) -> AxisValueMap:
        """Probe."""
        return {}

    def clean_up(self) -> None:
        """Clean up."""
        return None

    async def configure_mount(
        self, mount: Mount, config: InstrumentHardwareConfigs
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
        }
