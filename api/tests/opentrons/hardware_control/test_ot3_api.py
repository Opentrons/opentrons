""" Tests for behaviors specific to the OT3 hardware controller.
"""
from typing import Iterator, Union, Dict, Tuple, List, Any, OrderedDict, Optional
from typing_extensions import Literal
from math import copysign
import pytest
from decoy import Decoy
from mock import AsyncMock, patch, Mock, PropertyMock, MagicMock
from hypothesis import given, strategies, settings, HealthCheck, assume, example

from opentrons.calibration_storage.types import CalibrationStatus, SourceType
from opentrons.config.types import (
    GantryLoad,
    CapacitivePassSettings,
    LiquidProbeSettings,
)
from opentrons.hardware_control.dev_types import (
    AttachedGripper,
    AttachedPipette,
    GripperDict,
)
from opentrons.hardware_control.motion_utilities import target_position_from_plunger
from opentrons.hardware_control.instruments.ot3.gripper_handler import GripperHandler
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset,
    PipetteOffsetByPipetteMount,
)
from opentrons.hardware_control.instruments.ot3.pipette_handler import (
    OT3PipetteHandler,
    TipActionSpec,
    TipActionMoveSpec,
)
from opentrons.hardware_control.instruments.ot3.pipette import Pipette
from opentrons.hardware_control.types import (
    OT3Mount,
    Axis,
    OT3AxisKind,
    CriticalPoint,
    GripperProbe,
    InstrumentProbeType,
    SubSystem,
    GripperJawState,
    StatusBarState,
    EstopState,
    EstopStateNotification,
    TipStateType,
)
from opentrons.hardware_control.nozzle_manager import NozzleConfigurationType
from opentrons.hardware_control.errors import InvalidCriticalPoint
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control import ThreadManager
from opentrons.hardware_control.backends.ot3utils import (
    axis_to_node,
)
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons.types import Point, Mount

from opentrons_hardware.hardware_control.motion import MoveStopCondition
from opentrons_hardware.hardware_control.motion_planning.types import Move

from opentrons.config import gripper_config as gc
from opentrons_shared_data.errors.exceptions import (
    GripperNotPresentError,
    CommandPreconditionViolated,
    CommandParameterLimitViolated,
)
from opentrons_shared_data.gripper.gripper_definition import GripperModel
from opentrons_shared_data.pipette.types import (
    PipetteModelType,
    PipetteChannelType,
    PipetteVersionType,
    LiquidClasses,
)
from opentrons_shared_data.pipette import (
    load_data as load_pipette_data,
)
from opentrons.hardware_control.modules import (
    Thermocycler,
    TempDeck,
    MagDeck,
    HeaterShaker,
    SpeedStatus,
)
from opentrons.hardware_control.module_control import AttachedModulesControl


# TODO (spp, 2023-08-22): write tests for ot3api.stop & ot3api.halt


@pytest.fixture
def fake_settings() -> CapacitivePassSettings:
    return CapacitivePassSettings(
        prep_distance_mm=1,
        max_overrun_distance_mm=2,
        speed_mm_per_s=4,
        sensor_threshold_pf=1.0,
    )


@pytest.fixture
def fake_liquid_settings() -> LiquidProbeSettings:
    return LiquidProbeSettings(
        starting_mount_height=100,
        max_z_distance=15,
        min_z_distance=10,
        mount_speed=40,
        plunger_speed=10,
        sensor_threshold_pascals=15,
        expected_liquid_height=109,
        log_pressure=False,
        aspirate_while_sensing=False,
        auto_zero_sensor=False,
        num_baseline_reads=10,
        data_file="fake_file_name",
    )


@pytest.fixture
def mock_move_to(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "move_to",
        AsyncMock(
            spec=ot3_hardware.managed_obj.move_to,
            wraps=ot3_hardware.managed_obj.move_to,
        ),
    ) as mock_move:
        yield mock_move


@pytest.fixture
def mock_home(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "home",
        AsyncMock(
            spec=ot3_hardware.managed_obj.home,
            wraps=ot3_hardware.managed_obj.home,
        ),
    ) as mock_move:
        yield mock_move


@pytest.fixture
def mock_home_plunger(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "home_plunger",
        AsyncMock(
            spec=ot3_hardware.managed_obj.home_plunger,
        ),
    ) as mock_move:
        yield mock_move


@pytest.fixture
def mock_move_to_plunger_bottom(
    ot3_hardware: ThreadManager[OT3API],
) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "_move_to_plunger_bottom",
        AsyncMock(
            spec=ot3_hardware.managed_obj._move_to_plunger_bottom,
        ),
    ) as mock_move:
        yield mock_move


@pytest.fixture
def mock_move(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "_move",
        AsyncMock(
            spec=ot3_hardware.managed_obj._move,
        ),
    ) as mock_move:
        yield mock_move


@pytest.fixture
def mock_gantry_position(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "gantry_position",
        AsyncMock(
            spec=ot3_hardware.managed_obj.gantry_position,
            wraps=ot3_hardware.managed_obj.gantry_position,
        ),
    ) as mock_gantry_pos:
        yield mock_gantry_pos


@pytest.fixture
def mock_grip(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "_grip",
        AsyncMock(
            spec=ot3_hardware.managed_obj._grip,
            wraps=ot3_hardware.managed_obj._grip,
        ),
    ) as mock_move:
        yield mock_move


@pytest.fixture
def mock_ungrip(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "_ungrip",
        AsyncMock(
            spec=ot3_hardware.managed_obj._ungrip,
            wraps=ot3_hardware.managed_obj._ungrip,
        ),
    ) as mock_move:
        yield mock_move


@pytest.fixture
def mock_home_gear_motors(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "home_gear_motors",
        AsyncMock(
            spec=ot3_hardware.managed_obj.home_gear_motors,
            wraps=ot3_hardware.managed_obj.home_gear_motors,
        ),
    ) as mock_home_gear:
        yield mock_home_gear


@pytest.fixture
def mock_hold_jaw_width(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "_hold_jaw_width",
        AsyncMock(
            spec=ot3_hardware.managed_obj._hold_jaw_width,
            wraps=ot3_hardware.managed_obj._hold_jaw_width,
        ),
    ) as mock_move:
        yield mock_move


@pytest.fixture
async def mock_backend_move(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj._backend,
        "move",
        AsyncMock(spec=ot3_hardware.managed_obj._backend.move),
    ) as mock_move:
        yield mock_move


@pytest.fixture
def mock_check_motor(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj._backend,
        "check_motor_status",
        Mock(spec=ot3_hardware.managed_obj._backend.check_motor_status),
    ) as mock_check:
        yield mock_check


@pytest.fixture
def mock_check_encoder(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj._backend,
        "check_encoder_status",
        Mock(spec=ot3_hardware.managed_obj._backend.check_encoder_status),
    ) as mock_check:
        yield mock_check


@pytest.fixture
async def mock_refresh(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "refresh_positions",
        AsyncMock(
            spec=ot3_hardware.managed_obj.refresh_positions,
            wraps=ot3_hardware.managed_obj.refresh_positions,
        ),
    ) as mock_refresh:
        yield mock_refresh


@pytest.fixture
async def mock_reset(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "reset",
        AsyncMock(),
    ) as mock_reset:
        yield mock_reset


@pytest.fixture
async def mock_instrument_handlers(
    ot3_hardware: ThreadManager[OT3API],
) -> Iterator[Tuple[MagicMock]]:
    with patch.object(
        ot3_hardware.managed_obj,
        "_gripper_handler",
        MagicMock(spec=GripperHandler),
    ) as mock_gripper_handler, patch.object(
        ot3_hardware.managed_obj, "_pipette_handler", MagicMock(spec=OT3PipetteHandler)
    ) as mock_pipette_handler:
        yield mock_gripper_handler, mock_pipette_handler


@pytest.fixture
async def gripper_present(ot3_hardware: ThreadManager[OT3API]) -> None:
    # attach a gripper if we're testing the gripper mount
    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="test")
    ot3_hardware._backend._attached_instruments[OT3Mount.GRIPPER] = {
        "model": GripperModel.v1,
        "id": "test",
    }
    ot3_hardware._backend._present_nodes.add(NodeId.gripper)
    await ot3_hardware.cache_gripper(instr_data)


@pytest.mark.parametrize(
    "load_configs,load",
    (
        (
            {
                OT3Mount.RIGHT: {"channels": 8, "version": (3, 3), "model": "p50"},
                OT3Mount.LEFT: {"channels": 1, "version": (3, 3), "model": "p1000"},
            },
            GantryLoad.LOW_THROUGHPUT,
        ),
        ({}, GantryLoad.LOW_THROUGHPUT),
        (
            {OT3Mount.GRIPPER: {"model": GripperModel.v1, "id": "g12345"}},
            GantryLoad.LOW_THROUGHPUT,
        ),
        (
            {OT3Mount.LEFT: {"channels": 8, "version": (3, 3), "model": "p1000"}},
            GantryLoad.LOW_THROUGHPUT,
        ),
        (
            {OT3Mount.RIGHT: {"channels": 8, "version": (3, 3), "model": "p1000"}},
            GantryLoad.LOW_THROUGHPUT,
        ),
        (
            {OT3Mount.LEFT: {"channels": 96, "model": "p1000", "version": (3, 3)}},
            GantryLoad.HIGH_THROUGHPUT,
        ),
        (
            {
                OT3Mount.LEFT: {"channels": 1, "version": (3, 3), "model": "p1000"},
                OT3Mount.GRIPPER: {"model": GripperModel.v1, "id": "g12345"},
            },
            GantryLoad.LOW_THROUGHPUT,
        ),
        (
            {
                OT3Mount.RIGHT: {"channels": 8, "version": (3, 3), "model": "p1000"},
                OT3Mount.GRIPPER: {"model": GripperModel.v1, "id": "g12345"},
            },
            GantryLoad.LOW_THROUGHPUT,
        ),
        (
            {
                OT3Mount.LEFT: {"channels": 96, "model": "p1000", "version": (3, 3)},
                OT3Mount.GRIPPER: {"model": GripperModel.v1, "id": "g12345"},
            },
            GantryLoad.HIGH_THROUGHPUT,
        ),
    ),
)
async def test_gantry_load_transform(
    ot3_hardware: ThreadManager[OT3API],
    load_configs: Dict[str, Union[int, str, Tuple[int, int]]],
    load: GantryLoad,
) -> None:

    for mount, configs in load_configs.items():
        if mount == OT3Mount.GRIPPER:
            gripper_config = gc.load(configs["model"])
            instr_data = AttachedGripper(config=gripper_config, id="2345")
            await ot3_hardware.cache_gripper(instr_data)
        else:
            pipette_config = load_pipette_data.load_definition(
                PipetteModelType(configs["model"]),
                PipetteChannelType(configs["channels"]),
                PipetteVersionType(*configs["version"]),
            )
            instr_data = AttachedPipette(config=pipette_config, id="fakepip")
            await ot3_hardware.cache_pipette(mount, instr_data, None)
    assert ot3_hardware._gantry_load_from_instruments() == load


@pytest.fixture
def mock_backend_capacitive_probe(
    ot3_hardware: ThreadManager[OT3API],
) -> Iterator[AsyncMock]:
    backend = ot3_hardware.managed_obj._backend
    with patch.object(
        backend, "capacitive_probe", AsyncMock(spec=backend.capacitive_probe)
    ) as mock_probe:

        def _update_position(
            mount: OT3Mount,
            moving: Axis,
            distance_mm: float,
            speed_mm_per_s: float,
            threshold_pf: float,
            probe: InstrumentProbeType,
        ) -> None:
            ot3_hardware._backend._position[axis_to_node(moving)] += distance_mm / 2

        mock_probe.side_effect = _update_position

        yield mock_probe


@pytest.fixture
def mock_current_position_ot3(
    ot3_hardware: ThreadManager[OT3API],
) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "current_position_ot3",
        AsyncMock(spec=ot3_hardware.managed_obj.current_position_ot3),
    ) as mock_position:
        mock_position.return_value = {
            Axis.X: 477.2,
            Axis.Y: 493.8,
            Axis.Z_L: 253.475,
            Axis.Z_R: 253.475,
            Axis.Z_G: 253.475,
            Axis.P_L: 0,
            Axis.P_R: 0,
            Axis.G: 0,
        }
        yield mock_position


@pytest.fixture
def mock_backend_capacitive_pass(
    ot3_hardware: ThreadManager[OT3API],
) -> Iterator[AsyncMock]:
    backend = ot3_hardware.managed_obj._backend
    with patch.object(
        backend, "capacitive_pass", AsyncMock(spec=backend.capacitive_pass)
    ) as mock_pass:

        async def _update_position(
            mount: OT3Mount,
            moving: Axis,
            distance_mm: float,
            speed_mm_per_s: float,
            probe: InstrumentProbeType,
        ) -> None:
            ot3_hardware._backend._position[axis_to_node(moving)] += distance_mm / 2
            return [1, 2, 3, 4, 5, 6, 8]

        mock_pass.side_effect = _update_position
        yield mock_pass


@pytest.fixture
def mock_backend_get_tip_status(
    ot3_hardware: ThreadManager[OT3API],
) -> Iterator[AsyncMock]:
    backend = ot3_hardware.managed_obj._backend
    with patch.object(backend, "get_tip_status", AsyncMock()) as mock_tip_status:
        yield mock_tip_status


@pytest.fixture
def mock_verify_tip_presence(
    ot3_hardware: ThreadManager[OT3API],
) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj, "verify_tip_presence", AsyncMock()
    ) as mock_check_tip:
        yield mock_check_tip


load_pipette_configs = [
    {OT3Mount.LEFT: {"channels": 1, "version": (3, 3), "model": "p1000"}},
    {OT3Mount.RIGHT: {"channels": 8, "version": (3, 3), "model": "p50"}},
    {OT3Mount.LEFT: {"channels": 96, "model": "p1000", "version": (3, 3)}},
]


async def prepare_for_mock_blowout(
    ot3_hardware: ThreadManager[OT3API],
    mock_backend_get_tip_status: AsyncMock,
    mount: OT3Mount,
    configs: Any,
) -> Tuple[Any, ThreadManager[OT3API]]:
    pipette_config = load_pipette_data.load_definition(
        PipetteModelType(configs["model"]),
        PipetteChannelType(configs["channels"]),
        PipetteVersionType(*configs["version"]),
    )
    instr_data = AttachedPipette(config=pipette_config, id="fakepip")
    await ot3_hardware.cache_pipette(mount, instr_data, None)
    await ot3_hardware.refresh_positions()
    mock_backend_get_tip_status.return_value = TipStateType.PRESENT
    with patch.object(
        ot3_hardware, "pick_up_tip", AsyncMock(spec=ot3_hardware.pick_up_tip)
    ) as mock_tip_pickup:
        mock_tip_pickup.side_effect = (
            ot3_hardware._pipette_handler.attached_instruments[mount]["has_tip"]
        ) = (True)
        if not ot3_hardware._pipette_handler.attached_instruments[mount]["has_tip"]:
            await ot3_hardware.pick_up_tip(mount, 100)
    return instr_data, ot3_hardware


@pytest.mark.parametrize("load_configs", load_pipette_configs)
async def test_pickup_moves(
    ot3_hardware: ThreadManager[OT3API],
    mock_instrument_handlers: Tuple[Mock],
    mock_move_to_plunger_bottom: AsyncMock,
    mock_home_gear_motors: AsyncMock,
    load_configs: List[Dict[str, Any]],
) -> None:
    _, pipette_handler = mock_instrument_handlers
    for mount, configs in load_configs.items():
        if configs["channels"] == 96:
            gantry_load = GantryLoad.HIGH_THROUGHPUT
        else:
            gantry_load = GantryLoad.LOW_THROUGHPUT

    await ot3_hardware.set_gantry_load(gantry_load)
    pipette_handler.get_pipette(
        OT3Mount.LEFT
    ).nozzle_manager.current_configuration.configuration = NozzleConfigurationType.FULL
    z_tiprack_distance = 8.0
    end_z_retract_dist = 9.0
    move_plan_return_val = TipActionSpec(
        shake_off_moves=[],
        tip_action_moves=[
            TipActionMoveSpec(
                # Move onto the posts
                distance=10,
                speed=0,
                currents={
                    Axis.of_main_tool_actuator(Mount.LEFT): 0,
                    Axis.Q: 0,
                },
            )
        ],
        z_distance_to_tiprack=z_tiprack_distance,
        ending_z_retract_distance=end_z_retract_dist,
    )
    pipette_handler.plan_ht_pick_up_tip.return_value = move_plan_return_val
    pipette_handler.plan_lt_pick_up_tip.return_value = move_plan_return_val

    with patch.object(
        ot3_hardware.managed_obj,
        "move_rel",
        AsyncMock(spec=ot3_hardware.managed_obj.move_rel),
    ) as mock_move_rel:
        await ot3_hardware.pick_up_tip(Mount.LEFT, 40.0)
        move_call_list = [call.args for call in mock_move_rel.call_args_list]
        if gantry_load == GantryLoad.HIGH_THROUGHPUT:
            assert move_call_list == [
                (OT3Mount.LEFT, Point(z=z_tiprack_distance)),
                (OT3Mount.LEFT, Point(z=end_z_retract_dist)),
            ]
        else:
            assert move_call_list == [(OT3Mount.LEFT, Point(z=end_z_retract_dist))]


@pytest.mark.parametrize("load_configs", load_pipette_configs)
@given(blowout_volume=strategies.floats(min_value=0, max_value=10))
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture], max_examples=10)
@example(blowout_volume=0.0)
async def test_blow_out_position(
    ot3_hardware: ThreadManager[OT3API],
    mock_backend_get_tip_status: AsyncMock,
    load_configs: List[Dict[str, Any]],
    blowout_volume: float,
) -> None:
    liquid_class = LiquidClasses.default
    for mount, configs in load_configs.items():
        if configs["channels"] == 96:
            await ot3_hardware.set_gantry_load(GantryLoad.HIGH_THROUGHPUT)
        instr_data, ot3_hardware = await prepare_for_mock_blowout(
            ot3_hardware, mock_backend_get_tip_status, mount, configs
        )

        max_allowed_input_distance = (
            instr_data["config"].plunger_positions_configurations[liquid_class].blow_out
            - instr_data["config"].plunger_positions_configurations[liquid_class].bottom
        )
        max_input_vol = (
            max_allowed_input_distance * instr_data["config"].shaft_ul_per_mm
        )
        assume(blowout_volume < max_input_vol)
        await ot3_hardware.blow_out(mount, blowout_volume)
        pipette_axis = Axis.of_main_tool_actuator(mount)
        position_result = await ot3_hardware.current_position_ot3(mount)
        expected_position = (
            blowout_volume / instr_data["config"].shaft_ul_per_mm
        ) + instr_data["config"].plunger_positions_configurations[liquid_class].bottom
        # make sure target distance is not more than max blowout position
        assert (
            position_result[pipette_axis]
            < instr_data["config"]
            .plunger_positions_configurations[liquid_class]
            .blow_out
        )
        # make sure calculated position is roughly what we expect
        assert position_result[pipette_axis] == pytest.approx(
            expected_position, rel=0.1
        )


@pytest.mark.parametrize("load_configs", load_pipette_configs)
@given(blowout_volume=strategies.floats(min_value=0, max_value=300))
@settings(
    suppress_health_check=[
        HealthCheck.function_scoped_fixture,
        HealthCheck.filter_too_much,
    ],
    max_examples=20,
)
async def test_blow_out_error(
    ot3_hardware: ThreadManager[OT3API],
    mock_backend_get_tip_status: AsyncMock,
    load_configs: List[Dict[str, Any]],
    blowout_volume: float,
) -> None:
    liquid_class = LiquidClasses.default
    for mount, configs in load_configs.items():
        if configs["channels"] == 96:
            await ot3_hardware.set_gantry_load(GantryLoad.HIGH_THROUGHPUT)
        instr_data, ot3_hardware = await prepare_for_mock_blowout(
            ot3_hardware, mock_backend_get_tip_status, mount, configs
        )

        max_allowed_input_distance = (
            instr_data["config"].plunger_positions_configurations[liquid_class].blow_out
            - instr_data["config"].plunger_positions_configurations[liquid_class].bottom
        )
        max_input_vol = (
            max_allowed_input_distance * instr_data["config"].shaft_ul_per_mm
        )
        assume(blowout_volume > max_input_vol)

        # check that blowout does not allow input values that would blow out too far
        with pytest.raises(CommandParameterLimitViolated):
            await ot3_hardware.blow_out(mount, blowout_volume)


@pytest.mark.parametrize(
    "mount,homed_axis",
    [
        (OT3Mount.RIGHT, [Axis.X, Axis.Y, Axis.Z_R]),
        (OT3Mount.LEFT, [Axis.X, Axis.Y, Axis.Z_L]),
        (OT3Mount.GRIPPER, [Axis.X, Axis.Y, Axis.Z_G]),
        (Mount.EXTENSION, [Axis.X, Axis.Y, Axis.Z_G]),
    ],
)
async def test_move_to_without_homing_first(
    ot3_hardware: ThreadManager[OT3API],
    mock_home: AsyncMock,
    mount: Union[Mount, OT3Mount],
    homed_axis: List[Axis],
) -> None:
    """Before a mount can be moved, XY and the corresponding Z  must be homed first"""
    await ot3_hardware.cache_instruments()
    if mount in (OT3Mount.GRIPPER, Mount.EXTENSION):
        # attach a gripper if we're testing the gripper mount
        gripper_config = gc.load(GripperModel.v1)
        instr_data = AttachedGripper(config=gripper_config, id="test")
        await ot3_hardware.cache_gripper(instr_data)

    ot3_hardware._backend._motor_status = {}
    assert not ot3_hardware._backend.check_motor_status(homed_axis)

    await ot3_hardware.move_to(
        mount,
        Point(0.001, 0.001, 0.001),
    )
    mock_home.assert_called_once()


@pytest.mark.parametrize(
    "mount, head_node, pipette_node",
    [
        (OT3Mount.LEFT, NodeId.head_l, NodeId.pipette_left),
        (OT3Mount.RIGHT, NodeId.head_r, NodeId.pipette_right),
    ],
)
async def test_liquid_probe(
    mock_move_to: AsyncMock,
    ot3_hardware: ThreadManager[OT3API],
    head_node: NodeId,
    pipette_node: Axis,
    mount: OT3Mount,
    fake_liquid_settings: LiquidProbeSettings,
    mock_instrument_handlers: Tuple[MagicMock],
    mock_current_position_ot3: AsyncMock,
    mock_ungrip: AsyncMock,
    mock_move_to_plunger_bottom: AsyncMock,
) -> None:
    mock_ungrip.return_value = None
    backend = ot3_hardware.managed_obj._backend
    await ot3_hardware.home()
    mock_move_to.return_value = None

    with patch.object(
        backend, "liquid_probe", AsyncMock(spec=backend.liquid_probe)
    ) as mock_position:
        return_dict = {
            head_node: 140,
            NodeId.gantry_x: 0,
            NodeId.gantry_y: 0,
            pipette_node: 0,
        }

        # make sure aspirate while sensing reverses direction
        mock_position.return_value = return_dict
        fake_settings_aspirate = LiquidProbeSettings(
            starting_mount_height=100,
            max_z_distance=15,
            min_z_distance=5,
            mount_speed=40,
            plunger_speed=10,
            sensor_threshold_pascals=15,
            expected_liquid_height=109,
            log_pressure=False,
            aspirate_while_sensing=True,
            auto_zero_sensor=False,
            num_baseline_reads=10,
            data_file="fake_file_name",
        )
        await ot3_hardware.liquid_probe(mount, fake_settings_aspirate)
        mock_move_to_plunger_bottom.assert_called_once()
        backend.liquid_probe.assert_called_once_with(
            mount,
            fake_settings_aspirate.max_z_distance,
            fake_settings_aspirate.mount_speed,
            (fake_settings_aspirate.plunger_speed * -1),
            fake_settings_aspirate.sensor_threshold_pascals,
            fake_settings_aspirate.log_pressure,
            fake_settings_aspirate.auto_zero_sensor,
            fake_settings_aspirate.num_baseline_reads,
            probe=InstrumentProbeType.PRIMARY,
        )

        return_dict[head_node], return_dict[pipette_node] = 142, 142
        mock_position.return_value = return_dict
        await ot3_hardware.liquid_probe(
            mount, fake_liquid_settings
        )  # should raise no exceptions


@pytest.mark.parametrize(
    "mount,moving",
    [
        (OT3Mount.RIGHT, Axis.Z_R),
        (OT3Mount.LEFT, Axis.Z_L),
        (OT3Mount.RIGHT, Axis.X),
        (OT3Mount.LEFT, Axis.X),
        (OT3Mount.RIGHT, Axis.Y),
        (OT3Mount.LEFT, Axis.Y),
    ],
)
async def test_capacitive_probe(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_probe: AsyncMock,
    mount: OT3Mount,
    moving: Axis,
    fake_settings: CapacitivePassSettings,
) -> None:
    await ot3_hardware.home()
    here = await ot3_hardware.gantry_position(mount)
    res, _ = await ot3_hardware.capacitive_probe(mount, moving, 2, fake_settings)
    # in reality, this value would be the previous position + the value
    # updated in ot3controller.capacitive_probe, and it kind of is here, but that
    # previous position is always 0. This is a test of ot3api though and checking
    # that the mock got called correctly and the resulting output was handled
    # correctly, by asking for backend._position afterwards, is good enough.
    assert res == pytest.approx(1.5)

    # This is a negative probe because the current position is the home position
    # which is very large.
    mock_backend_capacitive_probe.assert_called_once_with(
        mount, moving, 3, 4, 1.0, InstrumentProbeType.PRIMARY
    )

    original = moving.set_in_point(here, 0)
    for probe_call in mock_move_to.call_args_list:
        this_point = moving.set_in_point(probe_call[0][1], 0)
        assert this_point == original


Direction = Union[Literal[0.0], Literal[1.0], Literal[-1.0]]


@pytest.mark.parametrize(
    "target,origin,prep_direction,probe_direction",
    [
        # Positions here depend on the prep point which is set
        # in the fake_settings fixture.
        # The origin is to the left of the target, exactly on
        # the prep point. Prep should not move, and the probe
        # should be left-to-right (positive in deck coords,
        # negative in machine coords)
        (1, Point(0, 0, 0), 0.0, -1.0),
        # The origin is to the left of the target and the left
        # of the prep point. Prep should move left-to-right
        # and so should probe
        (2, Point(0, 0, 0), 1.0, -1.0),
        # The origin is to the left of the target and the right
        # of the prep point. Prep should move right-to-left
        # (negative) and probe should move left-to-right
        (0.5, Point(0, 0, 0), -1.0, -1.0),
        # Origin to the right of target, on prep point. No prep,
        # probe is right-to-left (negative in deck coords,
        # positive in machine coords)
        (0, Point(1, 0, 0), 0.0, 1.0),
        # Origin to the right of target and prep point. Negative
        # prep, right-to-left probe
        (-1, Point(1, 0, 0), -1.0, 1.0),
        # Origin to the right of target and the left of prep.
        # Positive prep, right-to-left probe
        (0.5, Point(1, 0, 0), 1.0, 1.0),
    ],
)
async def test_probe_direction(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_probe: AsyncMock,
    mock_gantry_position: AsyncMock,
    fake_settings: CapacitivePassSettings,
    target: float,
    origin: Point,
    prep_direction: Direction,
    probe_direction: Direction,
) -> None:
    mock_gantry_position.return_value = origin
    await ot3_hardware.capacitive_probe(OT3Mount.RIGHT, Axis.X, target, fake_settings)
    prep_move = mock_move_to.call_args_list[0]
    if prep_direction == 0.0:
        assert prep_move[0][1].x == origin.x
    elif prep_direction == -1.0:
        assert prep_move[0][1].x < origin.x
    elif prep_direction == 1.0:
        assert prep_move[0][1].x > origin.x
    probe_distance = mock_backend_capacitive_probe.call_args_list[0][0][2]
    assert copysign(1.0, probe_distance) == probe_direction


@pytest.mark.parametrize(
    "mount,moving",
    (
        [OT3Mount.RIGHT, Axis.Z_L],
        [OT3Mount.LEFT, Axis.Z_R],
        [OT3Mount.RIGHT, Axis.P_L],
        [OT3Mount.RIGHT, Axis.P_R],
        [OT3Mount.LEFT, Axis.P_L],
        [OT3Mount.RIGHT, Axis.P_R],
    ),
)
async def test_capacitive_probe_invalid_axes(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_probe: AsyncMock,
    mount: OT3Mount,
    moving: Axis,
    fake_settings: CapacitivePassSettings,
) -> None:
    with pytest.raises(RuntimeError, match=r"Probing must be done with.*"):
        await ot3_hardware.capacitive_probe(mount, moving, 2, fake_settings)
    mock_move_to.assert_not_called()
    mock_backend_capacitive_probe.assert_not_called()


@pytest.mark.parametrize(
    "axis,begin,end,distance",
    [
        # Points must be passed through the attitude transform and therefore
        # flipped
        (Axis.X, Point(0, 0, 0), Point(1, 0, 0), -1),
        (Axis.Y, Point(0, 0, 0), Point(0, -1, 0), 1),
    ],
)
async def test_pipette_capacitive_sweep(
    axis: Axis,
    begin: Point,
    end: Point,
    distance: float,
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_pass: AsyncMock,
) -> None:
    data = await ot3_hardware.capacitive_sweep(OT3Mount.RIGHT, axis, begin, end, 3)
    assert data == [1, 2, 3, 4, 5, 6, 8]
    mock_backend_capacitive_pass.assert_called_once_with(
        OT3Mount.RIGHT, axis, distance, 3, InstrumentProbeType.PRIMARY
    )


@pytest.mark.parametrize(
    "probe,intr_probe",
    [
        (GripperProbe.FRONT, InstrumentProbeType.SECONDARY),
        (GripperProbe.REAR, InstrumentProbeType.PRIMARY),
    ],
)
@pytest.mark.parametrize(
    "axis,begin,end,distance",
    [
        # Points must be passed through the attitude transform and therefore
        # flipped
        (Axis.X, Point(0, 0, 0), Point(1, 0, 0), -1),
        (Axis.Y, Point(0, 0, 0), Point(0, -1, 0), 1),
    ],
)
async def test_gripper_capacitive_sweep(
    probe: GripperProbe,
    intr_probe: InstrumentProbeType,
    axis: Axis,
    begin: Point,
    end: Point,
    distance: float,
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_pass: AsyncMock,
    gripper_present: None,
) -> None:
    await ot3_hardware.home()
    await ot3_hardware.grip(5)
    ot3_hardware._gripper_handler.get_gripper().current_jaw_displacement = 5
    ot3_hardware.add_gripper_probe(probe)
    data = await ot3_hardware.capacitive_sweep(OT3Mount.GRIPPER, axis, begin, end, 3)
    assert data == [1, 2, 3, 4, 5, 6, 8]
    mock_backend_capacitive_pass.assert_called_once_with(
        OT3Mount.GRIPPER, axis, distance, 3, intr_probe
    )


@pytest.mark.parametrize(
    "mount,moving",
    (
        [OT3Mount.RIGHT, Axis.Z_L],
        [OT3Mount.LEFT, Axis.Z_R],
        [OT3Mount.RIGHT, Axis.P_L],
        [OT3Mount.RIGHT, Axis.P_R],
        [OT3Mount.LEFT, Axis.P_L],
        [OT3Mount.RIGHT, Axis.P_R],
    ),
)
async def test_capacitive_sweep_invalid_axes(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_probe: AsyncMock,
    mount: OT3Mount,
    moving: Axis,
    fake_settings: CapacitivePassSettings,
) -> None:
    with pytest.raises(RuntimeError, match=r"Probing must be done with.*"):
        await ot3_hardware.capacitive_sweep(
            mount, moving, Point(0, 0, 0), Point(1, 0, 0), 2
        )
    mock_move_to.assert_not_called()
    mock_backend_capacitive_probe.assert_not_called()


async def test_cache_gripper(ot3_hardware: ThreadManager[OT3API]) -> None:
    assert not ot3_hardware._gripper_handler.gripper
    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)
    assert ot3_hardware._gripper_handler.gripper
    assert ot3_hardware._gripper_handler.gripper.gripper_id == "g12345"
    # make sure the property attached_gripper returns GripperDict
    assert ot3_hardware.attached_gripper is not None
    assert ot3_hardware.attached_gripper["gripper_id"] == "g12345"


async def test_has_gripper(
    ot3_hardware: ThreadManager[OT3API],
) -> None:
    """It should return whether the robot has a gripper attached."""
    assert ot3_hardware.has_gripper() is False
    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)
    assert ot3_hardware.has_gripper() is True


async def test_gripper_action_fails_with_no_gripper(
    ot3_hardware: ThreadManager[OT3API],
    mock_grip: AsyncMock,
    mock_ungrip: AsyncMock,
) -> None:
    with pytest.raises(
        GripperNotPresentError, match="Cannot perform action without gripper attached"
    ):
        await ot3_hardware.grip(5.0)
    mock_grip.assert_not_called()

    with pytest.raises(
        GripperNotPresentError, match="Cannot perform action without gripper attached"
    ):
        await ot3_hardware.ungrip()
    mock_ungrip.assert_not_called()


async def test_gripper_action_works_with_gripper(
    ot3_hardware: ThreadManager[OT3API],
    mock_grip: AsyncMock,
    mock_ungrip: AsyncMock,
    mock_hold_jaw_width: AsyncMock,
    gripper_present: None,
) -> None:

    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="test")
    ot3_hardware._backend._attached_instruments[OT3Mount.GRIPPER] = {
        "model": GripperModel.v1,
        "id": "test",
    }
    await ot3_hardware.cache_gripper(instr_data)

    with pytest.raises(
        CommandPreconditionViolated, match="Cannot grip gripper jaw before homing"
    ):
        await ot3_hardware.grip(5.0)
    await ot3_hardware.home_gripper_jaw()
    mock_ungrip.assert_called_once()
    mock_ungrip.reset_mock()
    await ot3_hardware.home([Axis.G])
    mock_ungrip.assert_called_once()
    mock_ungrip.reset_mock()
    await ot3_hardware.grip(5.0)
    mock_grip.assert_called_once_with(
        gc.duty_cycle_by_force(5.0, gripper_config.grip_force_profile),
        stay_engaged=True,
    )

    await ot3_hardware.ungrip()
    mock_ungrip.assert_called_once()

    with pytest.raises(ValueError, match="Setting gripper jaw width out of bounds"):
        await ot3_hardware.hold_jaw_width(200)
    mock_hold_jaw_width.reset_mock()

    await ot3_hardware.hold_jaw_width(80)
    mock_hold_jaw_width.assert_called_once()


async def test_gripper_move_fails_with_no_gripper(
    ot3_hardware: ThreadManager[OT3API],
) -> None:
    assert not ot3_hardware._gripper_handler.gripper
    with pytest.raises(GripperNotPresentError):
        await ot3_hardware.move_to(OT3Mount.GRIPPER, Point(0, 0, 0))


async def test_gripper_mount_not_movable(
    ot3_hardware: ThreadManager[OT3API],
) -> None:
    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)
    assert ot3_hardware._gripper_handler.gripper
    with pytest.raises(InvalidCriticalPoint):
        await ot3_hardware.move_to(
            OT3Mount.GRIPPER, Point(0, 0, 0), critical_point=CriticalPoint.MOUNT
        )


@pytest.mark.parametrize(
    "critical_point",
    [
        CriticalPoint.NOZZLE,
        CriticalPoint.TIP,
        CriticalPoint.FRONT_NOZZLE,
    ],
)
async def test_gripper_fails_for_pipette_cps(
    ot3_hardware: ThreadManager[OT3API], critical_point: CriticalPoint
) -> None:
    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)
    assert ot3_hardware._gripper_handler.gripper
    with pytest.raises(InvalidCriticalPoint):
        await ot3_hardware.move_to(
            OT3Mount.GRIPPER, Point(0, 0, 0), critical_point=critical_point
        )


@pytest.mark.xfail
async def test_gripper_position(ot3_hardware: ThreadManager[OT3API]):
    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)
    await ot3_hardware.home()
    position = await ot3_hardware.gantry_position(OT3Mount.GRIPPER)
    assert (
        position
        == Point(*ot3_hardware.config.carriage_offset)
        + Point(*ot3_hardware.config.gripper_mount_offset)
        + ot3_hardware._gripper_handler.gripper._jaw_center_offset
    )


async def test_gripper_move_to(
    ot3_hardware: ThreadManager[OT3API], mock_backend_move: AsyncMock
):
    # Moving the gripper should, well, work
    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)

    await ot3_hardware.move_to(OT3Mount.GRIPPER, Point(0, 0, 0))
    _, moves, _ = mock_backend_move.call_args_list[0][0]
    for move in moves:
        assert list(sorted(move.unit_vector.keys(), key=lambda elem: elem.value)) == [
            Axis.X,
            Axis.Y,
            Axis.Z_G,
        ]


async def test_home_plunger(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to_plunger_bottom: AsyncMock,
    mock_home: AsyncMock,
):
    mount = OT3Mount.LEFT
    instr_data = AttachedPipette(
        config=load_pipette_data.load_definition(
            PipetteModelType("p1000"), PipetteChannelType(1), PipetteVersionType(3, 4)
        ),
        id="fakepip",
    )
    await ot3_hardware.cache_pipette(mount, instr_data, None)
    assert ot3_hardware.hardware_pipettes[mount.to_mount()]

    await ot3_hardware.home_plunger(mount)
    mock_home.assert_called_once()
    mock_move_to_plunger_bottom.assert_called_once_with(mount, 1.0, False)


async def test_prepare_for_aspirate(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to_plunger_bottom: AsyncMock,
):
    mount = OT3Mount.LEFT
    instr_data = AttachedPipette(
        config=load_pipette_data.load_definition(
            PipetteModelType("p1000"),
            PipetteChannelType(1),
            PipetteVersionType(3, 4),
        ),
        id="fakepip",
    )
    await ot3_hardware.cache_pipette(mount, instr_data, None)
    assert ot3_hardware.hardware_pipettes[mount.to_mount()]

    await ot3_hardware.add_tip(mount, 100)
    await ot3_hardware.prepare_for_aspirate(OT3Mount.LEFT)
    mock_move_to_plunger_bottom.assert_called_once_with(OT3Mount.LEFT, 1.0)


@pytest.mark.parametrize(
    "asp_vol,disp_vol,push_out,is_ready",
    (
        [5, 1, None, True],  # Partial Dispense
        [5, 5, None, False],  # Full dispense (default push_out)
        [5, 5, 0.0, True],  # explicit no push out
        [5, 5, 1.0, False],  # explicit push out
    ),
)
async def test_plunger_ready_to_aspirate_after_dispense(
    ot3_hardware: ThreadManager[OT3API],
    asp_vol: float,
    disp_vol: float,
    push_out: Optional[float],
    is_ready: bool,
):
    mount = OT3Mount.LEFT

    instr_data = AttachedPipette(
        config=load_pipette_data.load_definition(
            PipetteModelType("p1000"),
            PipetteChannelType(1),
            PipetteVersionType(3, 4),
        ),
        id="fakepip",
    )

    await ot3_hardware.cache_pipette(mount, instr_data, None)
    assert ot3_hardware.hardware_pipettes[mount.to_mount()]

    await ot3_hardware.add_tip(mount, 100)
    await ot3_hardware.prepare_for_aspirate(OT3Mount.LEFT)
    assert ot3_hardware.hardware_pipettes[mount.to_mount()].ready_to_aspirate

    await ot3_hardware.aspirate(OT3Mount.LEFT, asp_vol)
    await ot3_hardware.dispense(OT3Mount.LEFT, disp_vol, push_out=push_out)
    assert (
        ot3_hardware.hardware_pipettes[mount.to_mount()].ready_to_aspirate == is_ready
    )


async def test_move_to_plunger_bottom(
    ot3_hardware: ThreadManager[OT3API],
    mock_move: AsyncMock,
):
    mount = OT3Mount.LEFT
    instr_data = AttachedPipette(
        config=load_pipette_data.load_definition(
            PipetteModelType("p1000"), PipetteChannelType(1), PipetteVersionType(3, 4)
        ),
        id="fakepip",
    )
    await ot3_hardware.cache_pipette(mount, instr_data, None)
    pipette = ot3_hardware.hardware_pipettes[mount.to_mount()]
    assert pipette
    pip_ax = Axis.of_main_tool_actuator(mount)

    max_speeds = ot3_hardware.config.motion_settings.default_max_speed
    target_pos = target_position_from_plunger(
        OT3Mount.from_mount(mount),
        pipette.plunger_positions.bottom,
        ot3_hardware._current_position,
    )
    backlash_pos = target_pos.copy()
    backlash_pos[pip_ax] += pipette.backlash_distance

    # plunger will move at different speeds, depending on if:
    #  - no tip attached (max speed)
    #  - tip attached and moving down (blowout speed)
    #  - tip attached and moving up (aspirate speed)
    expected_speed_no_tip = max_speeds[ot3_hardware.gantry_load][OT3AxisKind.P]
    expected_speed_moving_down = ot3_hardware._pipette_handler.plunger_speed(
        pipette, pipette.blow_out_flow_rate, "dispense"
    )
    expected_speed_moving_up = ot3_hardware._pipette_handler.plunger_speed(
        pipette, pipette.aspirate_flow_rate, "aspirate"
    )

    # no tip attached
    await ot3_hardware.home()
    mock_move.reset_mock()
    await ot3_hardware.home_plunger(mount)
    # make sure we've done the backlash compensation
    mock_move.assert_any_call(
        backlash_pos, speed=expected_speed_no_tip, acquire_lock=False
    )
    # make sure the final move is to our target position
    mock_move.assert_called_with(
        target_pos, speed=expected_speed_no_tip, acquire_lock=False
    )

    # tip attached, moving DOWN towards "bottom" position
    await ot3_hardware.home()
    await ot3_hardware.add_tip(mount, 100)
    mock_move.reset_mock()
    await ot3_hardware.prepare_for_aspirate(mount)
    # make sure we've done the backlash compensation
    mock_move.assert_any_call(
        backlash_pos, speed=expected_speed_moving_down, acquire_lock=True
    )
    # make sure the final move is to our target position
    mock_move.assert_called_with(
        target_pos, speed=expected_speed_moving_down, acquire_lock=True
    )

    # tip attached, moving UP towards "bottom" position
    # NOTE: _move() is mocked, so we need to update the OT3API's
    #       cached coordinates in the test
    ot3_hardware._current_position[pip_ax] = target_pos[pip_ax] + 1
    mock_move.reset_mock()
    await ot3_hardware.prepare_for_aspirate(mount)
    # make sure the final move is to our target position
    mock_move.assert_called_with(
        target_pos, speed=expected_speed_moving_up, acquire_lock=True
    )


@pytest.mark.parametrize(
    "input_position, expected_move_pos",
    [
        ({Axis.X: 13}, {Axis.X: 13, Axis.Y: 493.8, Axis.Z_L: 253.475}),
        (
            {Axis.X: 13, Axis.Y: 14, Axis.Z_R: 15},
            {Axis.X: 13, Axis.Y: 14, Axis.Z_R: -240.675},
        ),
        (
            {Axis.Z_R: 15, Axis.Z_L: 16},
            {
                Axis.X: 477.2,
                Axis.Y: 493.8,
                Axis.Z_L: -239.675,
                Axis.Z_R: -240.675,
            },
        ),
    ],
)
async def test_move_axes(
    ot3_hardware: ThreadManager[OT3API],
    mock_move: AsyncMock,
    mock_check_motor: Mock,
    input_position: Dict[Axis, float],
    expected_move_pos: OrderedDict[Axis, float],
):

    await ot3_hardware.move_axes(position=input_position)
    mock_check_motor.return_value = True

    mock_move.assert_called_once_with(target_position=expected_move_pos, speed=None)


async def test_move_gripper_mount_without_gripper_attached(
    ot3_hardware: ThreadManager[OT3API], mock_backend_move: AsyncMock
) -> None:
    """It should move the empty gripper mount to specified position."""


@pytest.mark.parametrize("expect_stalls", [True, False])
async def test_move_expect_stall_flag(
    ot3_hardware: ThreadManager[OT3API],
    mock_backend_move: AsyncMock,
    expect_stalls: bool,
) -> None:

    expected = MoveStopCondition.stall if expect_stalls else MoveStopCondition.none

    await ot3_hardware.move_to(Mount.LEFT, Point(0, 0, 0), _expect_stalls=expect_stalls)
    mock_backend_move.assert_called_once()
    _, _, condition = mock_backend_move.call_args_list[0][0]
    assert condition == expected

    mock_backend_move.reset_mock()
    await ot3_hardware.move_rel(
        Mount.LEFT, Point(10, 0, 0), _expect_stalls=expect_stalls
    )
    mock_backend_move.assert_called_once()
    _, _, condition = mock_backend_move.call_args_list[0][0]
    assert condition == expected


@pytest.mark.parametrize(
    "mount",
    (
        OT3Mount.RIGHT,
        OT3Mount.LEFT,
        OT3Mount.GRIPPER,
        Mount.RIGHT,
        Mount.LEFT,
    ),
)
async def test_reset_instrument_offset(
    ot3_hardware: ThreadManager[OT3API],
    mount: Union[OT3Mount, Mount],
    mock_instrument_handlers: Tuple[Mock],
) -> None:
    gripper_handler, pipette_handler = mock_instrument_handlers
    await ot3_hardware.reset_instrument_offset(mount)
    if mount == OT3Mount.GRIPPER:
        gripper_handler.reset_instrument_offset.assert_called_once_with(True)
    else:
        converted_mount = OT3Mount.from_mount(mount)
        pipette_handler.reset_instrument_offset.assert_called_once_with(
            converted_mount, True
        )


@pytest.mark.parametrize(
    argnames=["mount", "expected_offset"],
    argvalues=[
        [
            OT3Mount.GRIPPER,
            GripperCalibrationOffset(
                offset=Point(1, 2, 3),
                source=SourceType.default,
                status=CalibrationStatus(),
                last_modified=None,
            ),
        ],
        [
            OT3Mount.RIGHT,
            PipetteOffsetByPipetteMount(
                offset=Point(10, 20, 30),
                source=SourceType.default,
                status=CalibrationStatus(),
                last_modified=None,
            ),
        ],
        [
            OT3Mount.LEFT,
            PipetteOffsetByPipetteMount(
                offset=Point(100, 200, 300),
                source=SourceType.default,
                status=CalibrationStatus(),
                last_modified=None,
            ),
        ],
    ],
)
def test_get_instrument_offset(
    ot3_hardware: ThreadManager[OT3API],
    mount: OT3Mount,
    expected_offset: Union[GripperCalibrationOffset, PipetteOffsetByPipetteMount],
    mock_instrument_handlers: Tuple[Mock],
) -> None:
    gripper_handler, pipette_handler = mock_instrument_handlers
    if mount == OT3Mount.GRIPPER:
        gripper_handler.get_gripper_dict.return_value = GripperDict(
            model=GripperModel.v1,
            gripper_id="abc",
            state=GripperJawState.UNHOMED,
            display_name="abc",
            fw_update_required=False,
            fw_current_version=100,
            fw_next_version=None,
            calibration_offset=expected_offset,
        )
    else:
        pipette_handler.get_instrument_offset.return_value = expected_offset

    found_offset = ot3_hardware.get_instrument_offset(mount=mount)
    assert found_offset == expected_offset


@pytest.mark.parametrize(
    "mount",
    (
        OT3Mount.RIGHT,
        OT3Mount.LEFT,
        OT3Mount.GRIPPER,
        Mount.RIGHT,
        Mount.LEFT,
    ),
)
async def test_save_instrument_offset(
    ot3_hardware: ThreadManager[OT3API],
    mount: Union[OT3Mount, Mount],
    mock_instrument_handlers: Tuple[Mock],
) -> None:
    gripper_handler, pipette_handler = mock_instrument_handlers
    await ot3_hardware.save_instrument_offset(mount, Point(1, 1, 1))
    if mount == OT3Mount.GRIPPER:
        gripper_handler.save_instrument_offset.assert_called_once_with(Point(1, 1, 1))
    else:
        converted_mount = OT3Mount.from_mount(mount)
        pipette_handler.save_instrument_offset.assert_called_once_with(
            converted_mount, Point(1, 1, 1)
        )


@pytest.mark.xfail()
async def test_pick_up_tip_full_tiprack(
    ot3_hardware: ThreadManager[OT3API],
    mock_instrument_handlers: Tuple[Mock],
    mock_ungrip: AsyncMock,
    mock_move_to_plunger_bottom: AsyncMock,
    mock_home_gear_motors: AsyncMock,
    mock_verify_tip_presence: AsyncMock,
) -> None:
    mock_ungrip.return_value = None
    await ot3_hardware.home()
    _, pipette_handler = mock_instrument_handlers
    backend = ot3_hardware.managed_obj._backend
    instr_mock = AsyncMock(spec=Pipette)
    instr_mock.nozzle_manager.current_configruation.configuration.return_value = (
        NozzleConfigurationType.FULL
    )
    with patch.object(
        backend, "tip_action", AsyncMock(spec=backend.tip_action)
    ) as tip_action:
        backend._gear_motor_position = {NodeId: 0}
        pipette_handler.get_pipette.return_value = instr_mock

        pipette_handler.plan_ht_pick_up_tip.return_value = TipActionSpec(
            shake_off_moves=[],
            tip_action_moves=[
                TipActionMoveSpec(
                    # Move onto the posts
                    distance=10,
                    speed=0,
                    currents={
                        Axis.of_main_tool_actuator(Mount.LEFT): 0,
                        Axis.Q: 0,
                    },
                )
            ],
        )

        def _update_gear_motor_pos(
            moves: Optional[List[Move[Axis]]] = None,
            distance: Optional[float] = None,
        ) -> None:
            if NodeId.pipette_left not in backend._gear_motor_position:
                backend._gear_motor_position = {NodeId.pipette_left: 0.0}
            if moves:
                for move in moves:
                    for block in move.blocks:
                        backend._gear_motor_position[NodeId.pipette_left] += (
                            block.distance * move.unit_vector[Axis.Q]
                        )
            elif distance:
                backend._gear_motor_position[NodeId.pipette_left] += distance

        tip_action.side_effect = _update_gear_motor_pos
        await ot3_hardware.set_gantry_load(GantryLoad.HIGH_THROUGHPUT)
        await ot3_hardware.pick_up_tip(Mount.LEFT, 40.0)
        pipette_handler.plan_ht_pick_up_tip.assert_called_once_with()
        # first call should be "clamp", moving down
        assert tip_action.call_args_list[0][-1]["moves"][0].unit_vector == {Axis.Q: 1}
        # next call should be "clamp", moving back up
        assert tip_action.call_args_list[1][-1]["moves"][0].unit_vector == {Axis.Q: -1}
        assert len(tip_action.call_args_list) == 2
        # home should be called after tip_action is done
        assert len(mock_home_gear_motors.call_args_list) == 1


async def test_drop_tip_full_tiprack(
    ot3_hardware: ThreadManager[OT3API],
    mock_instrument_handlers: Tuple[Mock],
    mock_home_gear_motors: AsyncMock,
    mock_verify_tip_presence: AsyncMock,
) -> None:
    _, pipette_handler = mock_instrument_handlers
    backend = ot3_hardware.managed_obj._backend

    with patch.object(
        backend, "tip_action", AsyncMock(spec=backend.tip_action)
    ) as tip_action:
        backend._gear_motor_position = {NodeId.pipette_left: 0}
        pipette_handler.plan_ht_drop_tip.return_value = TipActionSpec(
            tip_action_moves=[
                TipActionMoveSpec(
                    distance=10,
                    speed=1,
                    currents={Axis.P_L: 1.0},
                ),
            ],
            shake_off_moves=[],
        )

        def set_mock_plunger_configs() -> None:
            mock_instr = pipette_handler.get_pipette(Mount.LEFT)
            mock_instr.backlash_distance = 0.1
            mock_instr.config.plunger_homing_configurations.current = 1.0
            mock_instr.plunger_positions.bottom = -18.5

        def _update_gear_motor_pos(
            moves: Optional[List[Move[Axis]]] = None,
            distance: Optional[float] = None,
            velocity: Optional[float] = None,
            tip_action: str = "home",
        ) -> None:
            if NodeId.pipette_left not in backend._gear_motor_position:
                backend._gear_motor_position = {NodeId.pipette_left: 0.0}
            if moves:
                for move in moves:
                    for block in move.blocks:
                        backend._gear_motor_position[
                            NodeId.pipette_left
                        ] += block.distance
            elif distance:
                backend._gear_motor_position[NodeId.pipette_left] += distance

        tip_action.side_effect = _update_gear_motor_pos
        set_mock_plunger_configs()

        await ot3_hardware.set_gantry_load(GantryLoad.HIGH_THROUGHPUT)
        mock_backend_get_tip_status.return_value = TipStateType.ABSENT
        await ot3_hardware.drop_tip(Mount.LEFT, home_after=True)
        pipette_handler.plan_ht_drop_tip.assert_called_once_with()
        # first call should be "clamp", moving down
        assert tip_action.call_args_list[0][-1]["moves"][0].unit_vector == {Axis.Q: 1}
        # next call should be "clamp", moving back up
        assert tip_action.call_args_list[1][-1]["moves"][0].unit_vector == {Axis.Q: -1}
        assert len(tip_action.call_args_list) == 2
        # home should be called after tip_action is done
        assert len(mock_home_gear_motors.call_args_list) == 1


@pytest.mark.parametrize(
    "axes",
    [[Axis.X], [Axis.X, Axis.Y], [Axis.X, Axis.Y, Axis.P_L], None],
)
async def test_update_position_estimation(
    ot3_hardware: ThreadManager[OT3API], axes: List[Axis]
) -> None:

    backend = ot3_hardware.managed_obj._backend
    with patch.object(
        backend,
        "update_motor_estimation",
        AsyncMock(spec=backend.update_motor_estimation),
    ) as mock_update:
        await ot3_hardware._update_position_estimation(axes)
        if axes is None:
            axes = [ax for ax in Axis]
        mock_update.assert_called_once_with(axes)


async def test_refresh_positions(ot3_hardware: ThreadManager[OT3API]) -> None:

    backend = ot3_hardware.managed_obj._backend
    ot3_hardware._current_position.clear()
    ot3_hardware._encoder_position.clear()

    with patch.object(
        backend,
        "update_motor_status",
        AsyncMock(spec=backend.update_motor_status),
    ) as mock_update_status, patch.object(
        backend,
        "update_position",
        AsyncMock(spec=backend.update_position),
    ) as mock_pos, patch.object(
        backend,
        "update_encoder_position",
        AsyncMock(spec=backend.update_encoder_position),
    ) as mock_encoder:

        mock_pos.return_value = {ax: 100 for ax in Axis}
        mock_encoder.return_value = {ax: 99 for ax in Axis}

        await ot3_hardware.refresh_positions()

        mock_update_status.assert_called_once()
        mock_pos.assert_called_once()
        mock_encoder.assert_called_once()

        assert (ax in ot3_hardware._current_position.keys() for ax in Axis)
        assert (ax in ot3_hardware._encoder_position.keys() for ax in Axis)


@pytest.mark.parametrize("axis", [Axis.X, Axis.Z_L, Axis.P_L, Axis.Y])
@pytest.mark.parametrize(
    "stepper_ok,encoder_ok",
    [
        (True, True),
        (False, True),
        (False, False),
    ],
)
async def test_home_axis(
    ot3_hardware: ThreadManager[OT3API],
    mock_check_motor: Mock,
    mock_check_encoder: Mock,
    axis: Axis,
    stepper_ok: bool,
    encoder_ok: bool,
) -> None:
    if axis in Axis.pipette_axes():
        pipette_config = load_pipette_data.load_definition(
            PipetteModelType("p1000"),
            PipetteChannelType(1),
            PipetteVersionType(3, 3),
        )
        instr_data = AttachedPipette(config=pipette_config, id="fakepip")
        await ot3_hardware.cache_pipette(Axis.to_ot3_mount(axis), instr_data, None)

    backend = ot3_hardware.managed_obj._backend
    origin_pos = {ax: 100 for ax in Axis}
    origin_encoder = {ax: 99 for ax in Axis}
    backend._position = {axis_to_node(ax): v for ax, v in origin_pos.items()}
    backend._encoder_position = {
        axis_to_node(ax): v for ax, v in origin_encoder.items()
    }

    mock_check_motor.return_value = stepper_ok
    mock_check_encoder.return_value = encoder_ok

    with patch.object(
        backend,
        "move",
        AsyncMock(
            spec=backend.move,
            wraps=backend.move,
        ),
    ) as mock_backend_move, patch.object(
        backend,
        "home",
        AsyncMock(
            spec=backend.home,
            wraps=backend.home,
        ),
    ) as mock_backend_home, patch.object(
        backend,
        "update_motor_estimation",
        AsyncMock(
            spec=backend.update_motor_estimation,
            wraps=backend.update_motor_estimation,
        ),
    ) as mock_estimate:

        await ot3_hardware._home_axis(axis)

        if not stepper_ok and encoder_ok:
            # position estimation updated!
            mock_estimate.assert_awaited_once()
            mock_check_motor.return_value = encoder_ok
            mock_check_encoder.return_value = encoder_ok

        if stepper_ok and encoder_ok:
            """Copy encoder position to stepper pos"""
            # for accurate axis, we just move to home pos:
            if axis in [Axis.Z_L, Axis.P_L]:
                # move is called
                mock_backend_move.assert_awaited_once()
                move = mock_backend_move.call_args_list[0][0][1][0]
                assert move.distance == 95.0
                # then home is called
                mock_backend_home.assert_awaited_once()
            else:
                # we move to 20 mm away from home
                mock_backend_move.assert_awaited_once()
                move = mock_backend_move.call_args_list[0][0][1][0]
                assert move.distance == 80.0
                # then home is called
                mock_backend_home.assert_awaited_once()
        else:
            # home axis
            mock_backend_home.assert_awaited_once()
            # move not called
            mock_backend_move.assert_not_awaited()

    # axis is at the home position
    expected_pos = {axis_to_node(ax): v for ax, v in origin_pos.items()}
    expected_pos.update({axis_to_node(axis): 0})
    assert backend._position == expected_pos


@pytest.mark.parametrize("setting", [True, False])
async def test_light_settings(
    ot3_hardware: ThreadManager[OT3API], setting: bool
) -> None:
    await ot3_hardware.set_lights(rails=setting)
    check = await ot3_hardware.get_lights()
    assert check["rails"] == setting
    assert not check["button"]

    await ot3_hardware.set_lights(rails=not setting)
    check = await ot3_hardware.get_lights()
    assert check["rails"] != setting
    assert not check["button"]

    # Make sure setting the button doesn't affect the rails
    await ot3_hardware.set_lights(button=setting)
    check = await ot3_hardware.get_lights()
    assert check["rails"] != setting
    assert not check["button"]


@pytest.mark.parametrize(
    "versions,version_str",
    [
        ({}, "unknown"),
        ({SubSystem.pipette_right: 2}, "2"),
        (
            {
                SubSystem.pipette_left: 2,
                SubSystem.gantry_x: 2,
                SubSystem.gantry_y: 2,
            },
            "2",
        ),
        ({SubSystem.gripper: 3, SubSystem.head: 1}, "1, 3"),
    ],
)
def test_fw_version(
    ot3_hardware: ThreadManager[OT3API],
    versions: Dict[SubSystem, int],
    version_str: str,
) -> None:
    with patch(
        "opentrons.hardware_control.ot3api.OT3Simulator.fw_version",
        new_callable=PropertyMock,
    ) as mock_fw_version:
        mock_fw_version.return_value = versions
        assert ot3_hardware.get_fw_version() == version_str


@pytest.mark.parametrize(argnames=["enabled"], argvalues=[[True], [False]])
async def test_status_bar_interface(
    ot3_hardware: ThreadManager[OT3API],
    enabled: bool,
) -> None:
    """Test setting status bar statuses and make sure the cached status is correct."""
    await ot3_hardware.set_status_bar_enabled(enabled)

    settings = {
        StatusBarState.IDLE: StatusBarState.IDLE,
        StatusBarState.RUNNING: StatusBarState.RUNNING,
        StatusBarState.PAUSED: StatusBarState.PAUSED,
        StatusBarState.HARDWARE_ERROR: StatusBarState.HARDWARE_ERROR,
        StatusBarState.SOFTWARE_ERROR: StatusBarState.SOFTWARE_ERROR,
        StatusBarState.CONFIRMATION: StatusBarState.IDLE,
        StatusBarState.RUN_COMPLETED: StatusBarState.RUN_COMPLETED,
        StatusBarState.UPDATING: StatusBarState.UPDATING,
        StatusBarState.ACTIVATION: StatusBarState.IDLE,
        StatusBarState.DISCO: StatusBarState.IDLE,
        StatusBarState.OFF: StatusBarState.OFF,
    }

    for setting, response in settings.items():
        await ot3_hardware.set_status_bar_state(state=setting)
        assert ot3_hardware.get_status_bar_state() == response


@pytest.mark.parametrize(
    argnames=["old_state", "new_state", "should_trigger"],
    argvalues=[
        [EstopState.DISENGAGED, EstopState.NOT_PRESENT, False],
        [EstopState.DISENGAGED, EstopState.PHYSICALLY_ENGAGED, True],
        [EstopState.LOGICALLY_ENGAGED, EstopState.PHYSICALLY_ENGAGED, True],
        [EstopState.NOT_PRESENT, EstopState.PHYSICALLY_ENGAGED, True],
        [EstopState.PHYSICALLY_ENGAGED, EstopState.LOGICALLY_ENGAGED, False],
        [EstopState.PHYSICALLY_ENGAGED, EstopState.PHYSICALLY_ENGAGED, False],
    ],
)
async def test_estop_event_deactivate_module(
    ot3_hardware: ThreadManager[OT3API],
    decoy: Decoy,
    old_state: EstopState,
    new_state: EstopState,
    should_trigger: bool,
) -> None:
    """Test the helper to deactivate modules."""
    api = ot3_hardware.wrapped()
    api._backend.module_controls = decoy.mock(cls=AttachedModulesControl)
    tc = decoy.mock(cls=Thermocycler)
    hs = decoy.mock(cls=HeaterShaker)
    md = decoy.mock(cls=MagDeck)
    td = decoy.mock(cls=TempDeck)

    decoy.when(hs.speed_status).then_return(SpeedStatus.HOLDING)

    decoy.when(api._backend.module_controls.available_modules).then_return(
        [tc, hs, md, td]
    )

    estop_event = EstopStateNotification(old_state=old_state, new_state=new_state)

    futures = api._update_estop_state(estop_event)

    if should_trigger:
        assert len(futures) != 0

        for fut in futures:
            fut.result()

        decoy.verify(
            await tc.deactivate(must_be_running=False),
            await hs.deactivate_heater(must_be_running=False),
            await hs.deactivate_shaker(must_be_running=False),
            await md.deactivate(must_be_running=False),
            await td.deactivate(must_be_running=False),
        )
    else:
        assert len(futures) == 0


@pytest.mark.parametrize(
    "jaw_state",
    [
        GripperJawState.UNHOMED,
        GripperJawState.HOMED_READY,
        GripperJawState.GRIPPING,
        GripperJawState.HOLDING,
    ],
)
async def test_stop_only_home_necessary_axes(
    ot3_hardware: ThreadManager[OT3API],
    mock_home: AsyncMock,
    mock_reset: AsyncMock,
    jaw_state: GripperJawState,
):
    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="test")
    await ot3_hardware.cache_gripper(instr_data)
    ot3_hardware._gripper_handler.get_gripper().current_jaw_displacement = 0
    ot3_hardware._gripper_handler.get_gripper().state = jaw_state

    await ot3_hardware.stop(home_after=True)
    if jaw_state == GripperJawState.GRIPPING:
        mock_home.assert_called_once_with(skip=[Axis.G])
