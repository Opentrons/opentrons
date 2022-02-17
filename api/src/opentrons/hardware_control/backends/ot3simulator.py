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

from opentrons.config.types import OT3Config
from opentrons.drivers.rpi_drivers.gpio_simulator import SimulatingGPIOCharDev
from opentrons.types import Mount
from opentrons.config import pipette_config
from opentrons_shared_data.pipette import dummy_model_for_name
from . import ot3utils

try:
    from opentrons_ot3_firmware.constants import NodeId
    from opentrons_hardware.hardware_control.motion_planning import (
        Move,
        Coordinates,
    )
except ModuleNotFoundError:
    pass

from opentrons.hardware_control.module_control import AttachedModulesControl
from opentrons.hardware_control import modules
from opentrons.hardware_control.types import BoardRevision, Axis

if TYPE_CHECKING:
    from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel
    from opentrons.hardware_control.dev_types import (
        AttachedInstruments,
        InstrumentHardwareConfigs,
        InstrumentSpec,
        AttachedInstrument,
    )
    from opentrons.drivers.rpi_drivers.dev_types import GPIODriverLike

log = logging.getLogger(__name__)


AxisValueMap = Dict[str, float]

_FIXED_PIPETTE_ID: str = "P1KSV3120211118A01"
_FIXED_PIPETTE_NAME: PipetteName = "p1000_single_gen3"
_FIXED_PIPETTE_MODEL: PipetteModel = cast("PipetteModel", "p1000_single_v3.0")


class OT3Simulator:
    """OT3 Hardware Controller Backend."""

    _position: Dict[NodeId, float]

    @classmethod
    async def build(
        cls,
        attached_instruments: Dict[Mount, Dict[str, Optional[str]]],
        attached_modules: List[str],
        config: OT3Config,
        loop: asyncio.AbstractEventLoop,
        strict_attached_instruments: bool = True,
    ) -> OT3Simulator:
        """Create the OT3Simulator instance.

        Args:
            config: Robot configuration

        Returns:
            Instance.
        """
        gpio = SimulatingGPIOCharDev("gpiochip0")
        await gpio.setup()
        return cls(
            attached_instruments,
            attached_modules,
            config,
            loop,
            gpio,
            strict_attached_instruments,
        )

    def __init__(
        self,
        attached_instruments: Dict[Mount, Dict[str, Optional[str]]],
        attached_modules: List[str],
        config: OT3Config,
        loop: asyncio.AbstractEventLoop,
        gpio_chardev: GPIODriverLike,
        strict_attached_instruments: bool = True,
    ) -> None:
        """Construct.

        Args:
            config: Robot configuration
            driver: The Can Driver
        """
        self._configuration = config
        self._loop = loop
        self._gpio_dev = SimulatingGPIOCharDev("simulated")
        self._strict_attached = bool(strict_attached_instruments)
        self._stubbed_attached_modules = attached_modules

        def _sanitize_attached_instrument(
            passed_ai: Dict[str, Optional[str]] = None
        ) -> InstrumentSpec:
            if not passed_ai or not passed_ai.get("model"):
                return {"model": None, "id": None}
            if passed_ai["model"] in pipette_config.config_models:
                return passed_ai  # type: ignore
            if passed_ai["model"] in pipette_config.config_names:
                return {
                    "model": dummy_model_for_name(passed_ai["model"]),  # type: ignore
                    "id": passed_ai.get("id"),
                }
            raise KeyError(
                "If you specify attached_instruments, the model "
                "should be pipette names or pipette models, but "
                f'{passed_ai["model"]} is not'
            )

        self._attached_instruments = {
            m: _sanitize_attached_instrument(attached_instruments.get(m)) for m in Mount
        }
        self._module_controls: Optional[AttachedModulesControl] = None
        self._position = self._get_home_position()
        self._present_nodes: Set[NodeId] = set()

    # TODO: These staticmethods exist to defer uses of NodeId to inside
    # method bodies, which won't be evaluated until called. This is needed
    # because the robot server doesn't have opentrons_ot3_firmware as a dep
    # which is where they're defined, and therefore you can't have references
    # to NodeId that are interpreted at import time because then the robot
    # server tests fail when importing hardware controller. This is obviously
    # terrible and needs to be fixed.

    @staticmethod
    def _node_axes() -> List[str]:
        return ["X", "Y", "Z", "A", "B", "C"]

    @staticmethod
    def _axis_to_node(axis: str) -> "NodeId":
        anm: Dict[str, "NodeId"] = {
            "X": NodeId.gantry_x,
            "Y": NodeId.gantry_y,
            "Z": NodeId.head_l,
            "A": NodeId.head_r,
            "B": NodeId.pipette_left,
            "C": NodeId.pipette_right,
        }
        return anm[axis]

    @staticmethod
    def _node_to_axis(node: "NodeId") -> str:
        nam = {
            NodeId.gantry_x: "X",
            NodeId.gantry_y: "Y",
            NodeId.head_l: "Z",
            NodeId.head_r: "A",
            NodeId.pipette_left: "B",
            NodeId.pipette_right: "C",
        }
        return nam[node]

    @staticmethod
    def _node_is_axis(node: "NodeId") -> bool:
        try:
            OT3Simulator._node_to_axis(node)
            return True
        except KeyError:
            return False

    @staticmethod
    def _axis_is_node(axis: str) -> bool:
        try:
            OT3Simulator._axis_to_node(axis)
            return True
        except KeyError:
            return False

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
            # we need to make robot config apply to z or in some other way
            # reflect the sense of the axis direction
            if OT3Simulator._node_is_axis(node):
                ret[OT3Simulator._node_to_axis(node)] = pos
        log.info(f"update_position: {ret}")
        return ret

    async def move(
        self,
        origin: "Coordinates",
        moves: List[Move],
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
        move_group, final_positions = ot3utils.create_move_group(
            origin, moves, self._present_nodes
        )
        self._position.update(final_positions)

    async def home(self, axes: Optional[List[str]] = None) -> AxisValueMap:
        """Home axes.

        Args:
            axes: Optional list of axes.

        Returns:
            Homed position.
        """
        return self._axis_convert(self._position)

    async def fast_home(self, axes: Sequence[str], margin: float) -> AxisValueMap:
        """Fast home axes.

        Args:
            axes: List of axes to home.
            margin: Margin

        Returns:
            New position.
        """
        return self._axis_convert(self._position)

    def _attached_to_mount(
        self, mount: Mount, expected_instr: Optional[PipetteName]
    ) -> AttachedInstrument:
        init_instr = self._attached_instruments.get(mount, {"model": None, "id": None})
        found_model = init_instr["model"]
        back_compat: List["PipetteName"] = []
        if found_model:
            back_compat = pipette_config.configs[found_model].get("backCompatNames", [])
        if (
            expected_instr
            and found_model
            and (
                pipette_config.configs[found_model]["name"] != expected_instr
                and expected_instr not in back_compat
            )
        ):
            if self._strict_attached:
                raise RuntimeError(
                    "mount {}: expected instrument {} but got {}".format(
                        mount.name, expected_instr, found_model
                    )
                )
            else:
                return {
                    "config": pipette_config.load(dummy_model_for_name(expected_instr)),
                    "id": None,
                }
        elif found_model and expected_instr:
            # Instrument detected matches instrument expected (note:
            # "instrument detected" means passed as an argument to the
            # constructor of this class)
            return {
                "config": pipette_config.load(found_model, init_instr["id"]),
                "id": init_instr["id"],
            }
        elif found_model:
            # Instrument detected and no expected instrument specified
            return {
                "config": pipette_config.load(found_model, init_instr["id"]),
                "id": init_instr["id"],
            }
        elif expected_instr:
            # Expected instrument specified and no instrument detected
            return {
                "config": pipette_config.load(dummy_model_for_name(expected_instr)),
                "id": None,
            }
        else:
            # No instrument detected or expected
            return {"config": None, "id": None}

    async def get_attached_instruments(
        self, expected: Dict[Mount, PipetteName]
    ) -> AttachedInstruments:
        """Get attached instruments.

        Args:
            expected: Which mounts are expected.

        Returns:
            A map of mount to pipette name.
        """
        return {
            mount: self._attached_to_mount(mount, expected.get(mount))
            for mount in Mount
        }

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

    async def watch(self, loop: asyncio.AbstractEventLoop):
        new_mods_at_ports = [
            modules.ModuleAtPort(port=f"/dev/ot_module_sim_{mod}{str(idx)}", name=mod)
            for idx, mod in enumerate(self._stubbed_attached_modules)
        ]
        await self.module_controls.register_modules(new_mods_at_ports=new_mods_at_ports)

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

    async def clean_up(self) -> None:
        """Clean up."""
        pass

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
            NodeId.pipette_left: 0,
            NodeId.pipette_right: 0,
        }

    async def probe_network(self) -> None:
        nodes = set((NodeId.head_l, NodeId.head_r, NodeId.gantry_x, NodeId.gantry_y))
        if self._attached_instruments[Mount.LEFT].get("model", None):
            nodes.add(NodeId.pipette_left)
        if self._attached_instruments[Mount.RIGHT].get("model", None):
            nodes.add(NodeId.pipette_right)
        self._present_nodes = nodes
