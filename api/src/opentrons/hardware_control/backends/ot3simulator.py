"""OT3 Hardware Controller Backend."""

from __future__ import annotations
import asyncio
from contextlib import asynccontextmanager
import logging
from typing import (
    Dict,
    List,
    Optional,
    Tuple,
    Sequence,
    AsyncIterator,
    cast,
    Set,
    Union,
    Mapping,
)

from opentrons.config.types import OT3Config, GantryLoad
from opentrons.config import pipette_config, gripper_config
from opentrons_shared_data.pipette import dummy_model_for_name
from .ot3utils import (
    axis_convert,
    create_move_group,
    get_current_settings,
    node_to_axis,
    axis_to_node,
)

from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.hardware_control.motion_planning import (
    Move,
    Coordinates,
)

from opentrons.hardware_control.module_control import AttachedModulesControl
from opentrons.hardware_control import modules
from opentrons.hardware_control.types import (
    BoardRevision,
    OT3Axis,
    OT3Mount,
    OT3AxisMap,
    CurrentConfig,
    OT3SubSystem,
)
from opentrons_hardware.hardware_control.motion import MoveStopCondition

from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel
from opentrons.hardware_control.dev_types import (
    InstrumentHardwareConfigs,
    PipetteSpec,
    GripperSpec,
    AttachedPipette,
    AttachedGripper,
    OT3AttachedInstruments,
)
from opentrons_hardware.drivers.gpio import OT3GPIO

log = logging.getLogger(__name__)


_FIXED_PIPETTE_ID: str = "P1KSV3120211118A01"
_FIXED_PIPETTE_NAME: PipetteName = "p1000_single_gen3"
_FIXED_PIPETTE_MODEL: PipetteModel = cast("PipetteModel", "p1000_single_v3.0")


class OT3Simulator:
    """OT3 Hardware Controller Backend."""

    _position: Dict[NodeId, float]

    @classmethod
    async def build(
        cls,
        attached_instruments: Dict[OT3Mount, Dict[str, Optional[str]]],
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
        return cls(
            attached_instruments,
            attached_modules,
            config,
            loop,
            strict_attached_instruments,
        )

    def __init__(
        self,
        attached_instruments: Dict[OT3Mount, Dict[str, Optional[str]]],
        attached_modules: List[str],
        config: OT3Config,
        loop: asyncio.AbstractEventLoop,
        strict_attached_instruments: bool = True,
    ) -> None:
        """Construct.

        Args:
            config: Robot configuration
            driver: The Can Driver
        """
        self._configuration = config
        self._loop = loop
        self._gpio_dev = OT3GPIO()
        self._strict_attached = bool(strict_attached_instruments)
        self._stubbed_attached_modules = attached_modules

        def _sanitize_attached_instrument(
            mount: OT3Mount, passed_ai: Optional[Dict[str, Optional[str]]] = None
        ) -> Union[PipetteSpec, GripperSpec]:
            if mount is OT3Mount.GRIPPER:
                gripper_spec: GripperSpec = {"model": None, "id": None}
                if passed_ai and passed_ai.get("model"):
                    gripper_spec["model"] = "gripper_v1"
                    gripper_spec["id"] = passed_ai.get("id")
                return gripper_spec

            pipette_spec: PipetteSpec = {"model": None, "id": None}
            if not passed_ai or not passed_ai.get("model"):
                return pipette_spec
            if passed_ai["model"] in pipette_config.config_models:
                return passed_ai  # type: ignore
            if passed_ai["model"] in pipette_config.config_names:
                pipette_spec["model"] = dummy_model_for_name(
                    passed_ai["model"]  # type: ignore
                )
                pipette_spec["id"] = passed_ai.get("id")
                return pipette_spec
            raise KeyError(
                "If you specify attached_instruments, the model "
                "should be pipette names or pipette models, but "
                f'{passed_ai["model"]} is not'
            )

        self._attached_instruments = {
            m: _sanitize_attached_instrument(m, attached_instruments.get(m))
            for m in OT3Mount
        }
        self._module_controls: Optional[AttachedModulesControl] = None
        self._position = self._get_home_position()
        self._present_nodes: Set[NodeId] = set()
        self._current_settings: Optional[OT3AxisMap[CurrentConfig]] = None

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

    async def update_to_default_current_settings(self, gantry_load: GantryLoad) -> None:
        self._current_settings = get_current_settings(
            self._configuration.current_settings, gantry_load
        )

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
        _, final_positions = create_move_group(origin, moves, self._present_nodes)
        self._position.update(final_positions)

    async def home(self, axes: Optional[List[OT3Axis]] = None) -> OT3AxisMap[float]:
        """Home axes.

        Args:
            axes: Optional list of axes.

        Returns:
            Homed position.
        """
        return axis_convert(self._position, 0.0)

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

    def _attached_to_mount(
        self, mount: OT3Mount, expected_instr: Optional[PipetteName]
    ) -> OT3AttachedInstruments:
        init_instr = self._attached_instruments.get(
            mount, {"model": None, "id": None}  # type: ignore
        )
        if mount is OT3Mount.GRIPPER:
            return self._attached_gripper_to_mount(cast(GripperSpec, init_instr))
        return self._attached_pipette_to_mount(
            mount, cast(PipetteSpec, init_instr), expected_instr
        )

    def _attached_gripper_to_mount(self, init_instr: GripperSpec) -> AttachedGripper:
        found_model = init_instr["model"]
        if found_model:
            return {"config": gripper_config.load(), "id": init_instr["id"]}
        else:
            return {"config": None, "id": None}

    def _attached_pipette_to_mount(
        self,
        mount: OT3Mount,
        init_instr: PipetteSpec,
        expected_instr: Optional[PipetteName],
    ) -> AttachedPipette:
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
        self, expected: Mapping[OT3Mount, Optional[PipetteName]]
    ) -> Mapping[OT3Mount, OT3AttachedInstruments]:
        """Get attached instruments.

        Args:
            expected: Which mounts are expected.

        Returns:
            A map of mount to pipette name.
        """
        return {
            mount: self._attached_to_mount(mount, expected.get(mount))
            for mount in OT3Mount
        }

    async def set_active_current(self, axis_currents: OT3AxisMap[float]) -> None:
        """Set the active current.

        Args:
            axis_currents: Axes' currents

        Returns:
            None
        """
        return None

    @asynccontextmanager
    async def restore_current(self) -> AsyncIterator[None]:
        """Save the current."""
        yield

    async def watch(self, loop: asyncio.AbstractEventLoop) -> None:
        new_mods_at_ports = [
            modules.ModuleAtPort(port=f"/dev/ot_module_sim_{mod}{str(idx)}", name=mod)
            for idx, mod in enumerate(self._stubbed_attached_modules)
        ]
        await self.module_controls.register_modules(new_mods_at_ports=new_mods_at_ports)

    @property
    def axis_bounds(self) -> OT3AxisMap[Tuple[float, float]]:
        """Get the axis bounds."""
        # TODO (AL, 2021-11-18): The bounds need to be defined
        phony_bounds = (0, 10000)
        return {
            OT3Axis.Z_R: phony_bounds,
            OT3Axis.Z_L: phony_bounds,
            OT3Axis.P_L: phony_bounds,
            OT3Axis.P_R: phony_bounds,
            OT3Axis.Y: phony_bounds,
            OT3Axis.X: phony_bounds,
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
        pass

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
        pass

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
        }

    @staticmethod
    def home_position() -> OT3AxisMap[float]:
        return {
            node_to_axis(k): v for k, v in OT3Simulator._get_home_position().items()
        }

    async def probe_network(self) -> None:
        nodes = set((NodeId.head_l, NodeId.head_r, NodeId.gantry_x, NodeId.gantry_y))
        if self._attached_instruments[OT3Mount.LEFT].get("model", None):
            nodes.add(NodeId.pipette_left)
        if self._attached_instruments[OT3Mount.RIGHT].get("model", None):
            nodes.add(NodeId.pipette_right)
        if self._attached_instruments.get(
            OT3Mount.GRIPPER
        ) and self._attached_instruments[OT3Mount.GRIPPER].get("model", None):
            nodes.add(NodeId.gripper)
        self._present_nodes = nodes

    async def capacitive_probe(
        self,
        mount: OT3Mount,
        moving: OT3Axis,
        distance_mm: float,
        speed_mm_per_s: float,
    ) -> None:
        self._position[axis_to_node(moving)] += distance_mm

    async def capacitive_pass(
        self,
        mount: OT3Mount,
        moving: OT3Axis,
        distance_mm: float,
        speed_mm_per_s: float,
    ) -> List[float]:
        self._position[axis_to_node(moving)] += distance_mm
        return []
