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
    Iterator,
)

from opentrons.config.types import OT3Config, GantryLoad
from opentrons.config import gripper_config
from .ot3utils import (
    axis_convert,
    create_move_group,
    get_current_settings,
    node_to_axis,
    axis_to_node,
    create_gripper_jaw_hold_group,
    create_gripper_jaw_grip_group,
    create_gripper_jaw_home_group,
    NODEID_SUBSYSTEM,
    motor_nodes,
    target_to_subsystem,
)

from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorId,
    FirmwareTarget,
)
from opentrons_hardware.hardware_control.motion_planning import (
    Move,
    Coordinates,
)
from opentrons.hardware_control.estop_state import EstopStateMachine
from opentrons_hardware.drivers.eeprom import EEPROMData
from opentrons.hardware_control.module_control import AttachedModulesControl
from opentrons.hardware_control import modules
from opentrons.hardware_control.types import (
    BoardRevision,
    Axis,
    OT3Mount,
    OT3AxisMap,
    CurrentConfig,
    InstrumentProbeType,
    MotorStatus,
    UpdateStatus,
    UpdateState,
    SubSystem,
    SubSystemState,
    TipStateType,
)
from opentrons_hardware.hardware_control.motion import MoveStopCondition
from opentrons_hardware.hardware_control import status_bar

from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel
from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
    load_data as load_pipette_data,
)
from opentrons_shared_data.gripper.gripper_definition import GripperModel
from opentrons.hardware_control.dev_types import (
    InstrumentHardwareConfigs,
    PipetteSpec,
    GripperSpec,
    AttachedPipette,
    AttachedGripper,
    OT3AttachedInstruments,
)
from opentrons.util.async_helpers import ensure_yield

log = logging.getLogger(__name__)


class OT3Simulator:
    """OT3 Hardware Controller Backend."""

    _position: Dict[NodeId, float]
    _encoder_position: Dict[NodeId, float]
    _motor_status: Dict[NodeId, MotorStatus]

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
        self._strict_attached = bool(strict_attached_instruments)
        self._stubbed_attached_modules = attached_modules
        self._update_required = False
        self._initialized = False
        self._lights = {"button": False, "rails": False}
        self._estop_state_machine = EstopStateMachine(detector=None)
        self._gear_motor_position: Dict[NodeId, float] = {}

        def _sanitize_attached_instrument(
            mount: OT3Mount, passed_ai: Optional[Dict[str, Optional[str]]] = None
        ) -> Union[PipetteSpec, GripperSpec]:
            if mount is OT3Mount.GRIPPER:
                gripper_spec: GripperSpec = {"model": None, "id": None}
                if passed_ai and passed_ai.get("model"):
                    gripper_spec["model"] = GripperModel.v1
                    gripper_spec["id"] = passed_ai.get("id")
                return gripper_spec

            # TODO (lc 12-5-2022) need to not always pass in defaults here
            # but doing it to satisfy linter errors for now.
            pipette_spec: PipetteSpec = {"model": None, "id": None}
            if not passed_ai or not passed_ai.get("model"):
                return pipette_spec

            if pipette_load_name.supported_pipette(
                cast(PipetteModel, passed_ai["model"])
            ):
                pipette_spec["model"] = cast(PipetteModel, passed_ai.get("model"))
                pipette_spec["id"] = passed_ai.get("id")
                return pipette_spec
            # TODO (lc 12-05-2022) When the time comes we should properly
            # support backwards compatibility
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
        self._encoder_position = self._get_home_position()
        self._motor_status = {}
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
        self._current_settings: Optional[OT3AxisMap[CurrentConfig]] = None

    @property
    def initialized(self) -> bool:
        """True when the hardware controller has initialized and is ready."""
        return self._initialized

    @initialized.setter
    def initialized(self, value: bool) -> None:
        self._initialized = value

    @property
    def eeprom_data(self) -> EEPROMData:
        return EEPROMData()

    @property
    def gear_motor_position(self) -> Dict[NodeId, float]:
        return self._gear_motor_position

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

    @ensure_yield
    async def update_to_default_current_settings(self, gantry_load: GantryLoad) -> None:
        self._current_settings = get_current_settings(
            self._configuration.current_settings, gantry_load
        )

    def _handle_motor_status_update(self, response: Dict[NodeId, float]) -> None:
        self._position.update(response)
        self._encoder_position.update(response)
        self._motor_status.update(
            (node, MotorStatus(True, True)) for node in response.keys()
        )

    @ensure_yield
    async def update_motor_status(self) -> None:
        """Retreieve motor and encoder status and position from all present nodes"""
        if not self._motor_status:
            # Simulate condition at boot, status would not be ok
            self._motor_status.update(
                (node, MotorStatus(False, False)) for node in self._present_nodes
            )
        else:
            self._motor_status.update(
                (node, MotorStatus(True, True)) for node in self._present_nodes
            )

    @ensure_yield
    async def update_motor_estimation(self, axes: Sequence[Axis]) -> None:
        """Update motor position estimation for commanded nodes, and update cache of data."""
        # Simulate conditions as if there are no stalls, aka do nothing
        return None

    def _get_motor_status(self, ax: Sequence[Axis]) -> Iterator[Optional[MotorStatus]]:
        return (self._motor_status.get(axis_to_node(a)) for a in ax)

    def check_motor_status(self, axes: Sequence[Axis]) -> bool:
        return all(
            isinstance(status, MotorStatus) and status.motor_ok
            for status in self._get_motor_status(axes)
        )

    def check_encoder_status(self, axes: Sequence[Axis]) -> bool:
        """If any of the encoder statuses is ok, parking can proceed."""
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

    @asynccontextmanager
    async def monitor_overpressure(
        self, mount: OT3Mount, sensor_id: SensorId = SensorId.S0
    ) -> AsyncIterator[None]:
        yield

    @ensure_yield
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
        pos = self._position
        pos[head_node] += max_z_distance
        self._position.update(pos)
        self._encoder_position.update(pos)
        return self._position

    @ensure_yield
    async def move(
        self,
        origin: Coordinates[Axis, float],
        moves: List[Move[Axis]],
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
        self._encoder_position.update(final_positions)

    @ensure_yield
    async def home(
        self, axes: Sequence[Axis], gantry_load: GantryLoad
    ) -> OT3AxisMap[float]:
        """Home axes.

        Args:
            axes: Optional list of axes.

        Returns:
            Homed position.
        """
        if axes:
            homed = [axis_to_node(a) for a in axes]
        else:
            homed = list(self._position.keys())
        for h in homed:
            self._position[h] = self._get_home_position()[h]
            self._motor_status[h] = MotorStatus(True, True)
        return axis_convert(self._position, 0.0)

    @ensure_yield
    async def gripper_grip_jaw(
        self,
        duty_cycle: float,
        stop_condition: MoveStopCondition = MoveStopCondition.none,
        stay_engaged: bool = True,
    ) -> None:
        """Move gripper inward."""
        _ = create_gripper_jaw_grip_group(duty_cycle, stop_condition, stay_engaged)

    @ensure_yield
    async def gripper_home_jaw(self, duty_cycle: float) -> None:
        """Move gripper outward."""
        _ = create_gripper_jaw_home_group(duty_cycle)
        self._motor_status[NodeId.gripper_g] = MotorStatus(True, True)

    @ensure_yield
    async def gripper_hold_jaw(
        self,
        encoder_position_um: int,
    ) -> None:
        _ = create_gripper_jaw_hold_group(encoder_position_um)
        self._encoder_position[NodeId.gripper_g] = encoder_position_um / 1000.0

    async def get_tip_present(self, mount: OT3Mount, tip_state: TipStateType) -> None:
        """Raise an error if the given state doesn't match the physical state."""
        pass

    async def get_tip_present_state(self, mount: OT3Mount) -> int:
        """Get the state of the tip ejector flag for a given mount."""
        pass

    async def tip_action(
        self,
        moves: Optional[List[Move[Axis]]] = None,
        distance: Optional[float] = None,
        velocity: Optional[float] = None,
        tip_action: str = "home",
        back_off: Optional[bool] = False,
    ) -> None:
        pass

    def _attached_to_mount(
        self, mount: OT3Mount, expected_instr: Optional[PipetteName]
    ) -> OT3AttachedInstruments:
        init_instr = self._attached_instruments.get(mount, {"model": None, "id": None})  # type: ignore
        if mount is OT3Mount.GRIPPER:
            return self._attached_gripper_to_mount(cast(GripperSpec, init_instr))
        return self._attached_pipette_to_mount(
            mount, cast(PipetteSpec, init_instr), expected_instr
        )

    def _attached_gripper_to_mount(self, init_instr: GripperSpec) -> AttachedGripper:
        found_model = init_instr["model"]
        if found_model:
            return {
                "config": gripper_config.load(GripperModel.v1),
                "id": init_instr["id"],
            }
        else:
            return {"config": None, "id": None}

    def _attached_pipette_to_mount(
        self,
        mount: OT3Mount,
        init_instr: PipetteSpec,
        expected_instr: Optional[PipetteName],
    ) -> AttachedPipette:
        found_model = init_instr["model"]

        # TODO (lc 12-05-2022) When the time comes, we should think about supporting
        # backwards compatability -- hopefully not relying on config keys only,
        # but TBD.
        if expected_instr and not pipette_load_name.supported_pipette(
            cast(PipetteModel, expected_instr)
        ):
            raise RuntimeError(
                f"mount {mount.name} requested a {expected_instr} which is not supported on the OT3"
            )
        if found_model and expected_instr and (expected_instr not in found_model):
            if self._strict_attached:
                raise RuntimeError(
                    "mount {}: expected instrument {} but got {}".format(
                        mount.name, expected_instr, found_model
                    )
                )
            else:
                converted_name = pipette_load_name.convert_pipette_name(expected_instr)
                return {
                    "config": load_pipette_data.load_definition(
                        converted_name.pipette_type,
                        converted_name.pipette_channels,
                        converted_name.pipette_version,
                    ),
                    "id": None,
                }
        if found_model and expected_instr or found_model:
            # Instrument detected matches instrument expected (note:
            # "instrument detected" means passed as an argument to the
            # constructor of this class)

            # OR Instrument detected and no expected instrument specified
            converted_name = pipette_load_name.convert_pipette_model(found_model)
            return {
                "config": load_pipette_data.load_definition(
                    converted_name.pipette_type,
                    converted_name.pipette_channels,
                    converted_name.pipette_version,
                ),
                "id": init_instr["id"],
            }
        elif expected_instr:
            # Expected instrument specified and no instrument detected
            converted_name = pipette_load_name.convert_pipette_name(expected_instr)
            return {
                "config": load_pipette_data.load_definition(
                    converted_name.pipette_type,
                    converted_name.pipette_channels,
                    converted_name.pipette_version,
                ),
                "id": None,
            }
        else:
            # No instrument detected or expected
            return {"config": None, "id": None}

    @ensure_yield
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

    @ensure_yield
    async def get_limit_switches(self) -> OT3AxisMap[bool]:
        """Get the state of the gantry's limit switches on each axis."""
        return {}

    @ensure_yield
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

    @ensure_yield
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
            Axis.Z_R: phony_bounds,
            Axis.Z_L: phony_bounds,
            Axis.P_L: phony_bounds,
            Axis.P_R: phony_bounds,
            Axis.Y: phony_bounds,
            Axis.X: phony_bounds,
            Axis.Z_G: phony_bounds,
            Axis.Q: phony_bounds,
        }

    @property
    def fw_version(self) -> Dict[SubSystem, int]:
        """Get the firmware version."""
        return {
            NODEID_SUBSYSTEM[node.application_for()]: 0 for node in self._present_nodes
        }

    def axis_is_present(self, axis: Axis) -> bool:
        try:
            return axis_to_node(axis) in motor_nodes(
                cast(Set[FirmwareTarget], self._present_nodes)
            )
        except KeyError:
            # Currently unhandled axis
            return False

    @property
    def update_required(self) -> bool:
        return self._update_required

    @update_required.setter
    def update_required(self, value: bool) -> None:
        if value != self._update_required:
            log.info(f"Firmware Update Flag set {self._update_required} -> {value}")
            self._update_required = value

    async def update_firmware(
        self,
        subsystems: Set[SubSystem],
        force: bool = False,
    ) -> AsyncIterator[UpdateStatus]:
        """Updates the firmware on the OT3."""
        for subsystem in subsystems:
            yield UpdateStatus(
                subsystem=subsystem, state=UpdateState.done, progress=100
            )

    def engaged_axes(self) -> OT3AxisMap[bool]:
        """Get engaged axes."""
        return {}

    @ensure_yield
    async def disengage_axes(self, axes: List[Axis]) -> None:
        """Disengage axes."""
        return None

    @ensure_yield
    async def engage_axes(self, axes: List[Axis]) -> None:
        """Engage axes."""
        return None

    @ensure_yield
    async def set_lights(self, button: Optional[bool], rails: Optional[bool]) -> None:
        """Set the light states."""
        # Simulate how the real driver does this - there's no button so it's always false
        if rails is not None:
            self._lights["rails"] = rails

    @ensure_yield
    async def get_lights(self) -> Dict[str, bool]:
        """Get the light state."""
        return self._lights

    def pause(self) -> None:
        """Pause the controller activity."""
        return None

    def resume(self) -> None:
        """Resume the controller activity."""
        return None

    @ensure_yield
    async def halt(self) -> None:
        """Halt the motors."""
        return None

    @ensure_yield
    async def probe(self, axis: Axis, distance: float) -> OT3AxisMap[float]:
        """Probe."""
        return {}

    @ensure_yield
    async def clean_up(self) -> None:
        """Clean up."""
        pass

    @ensure_yield
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
            node_to_axis(k): v for k, v in OT3Simulator._get_home_position().items()
        }

    @ensure_yield
    async def capacitive_probe(
        self,
        mount: OT3Mount,
        moving: Axis,
        distance_mm: float,
        speed_mm_per_s: float,
        sensor_threshold_pf: float,
        probe: InstrumentProbeType,
    ) -> None:
        self._position[axis_to_node(moving)] += distance_mm

    @ensure_yield
    async def capacitive_pass(
        self,
        mount: OT3Mount,
        moving: Axis,
        distance_mm: float,
        speed_mm_per_s: float,
        probe: InstrumentProbeType,
    ) -> List[float]:
        self._position[axis_to_node(moving)] += distance_mm
        return []

    @ensure_yield
    async def connect_usb_to_rear_panel(self) -> None:
        """Connect to rear panel over usb."""
        return None

    def status_bar_interface(self) -> status_bar.StatusBar:
        return status_bar.StatusBar(None)

    @property
    def subsystems(self) -> Dict[SubSystem, SubSystemState]:
        return {
            target_to_subsystem(target): SubSystemState(
                ok=True,
                current_fw_version=1,
                next_fw_version=1,
                fw_update_needed=False,
                current_fw_sha="simulated",
                pcba_revision="A1",
                update_state=None,
            )
            for target in self._present_nodes
        }

    @property
    def estop_state_machine(self) -> EstopStateMachine:
        """Return an estop state machine locked in the "disengaged" state."""
        return self._estop_state_machine
