""" Tests for behaviors specific to the OT3 hardware controller.
"""
from typing import Iterator, Union, Dict, Tuple, List
from typing_extensions import Literal
from math import copysign
import pytest
from mock import AsyncMock, patch, Mock, call
from opentrons.config.types import (
    GantryLoad,
    CapacitivePassSettings,
    LiquidProbeSettings,
)
from opentrons.hardware_control.dev_types import AttachedGripper, OT3AttachedPipette
from opentrons.hardware_control.instruments.ot3.gripper_handler import (
    GripError,
    GripperHandler,
)
from opentrons.hardware_control.instruments.ot3.pipette_handler import (
    OT3PipetteHandler,
    PickUpTipSpec,
    TipMotorPickUpTipSpec,
    DropTipMove,
    DropTipSpec,
)
from opentrons.hardware_control.types import (
    OT3Mount,
    OT3Axis,
    CriticalPoint,
    GripperProbe,
    InstrumentProbeType,
    LiquidNotFound,
    EarlyLiquidSenseTrigger,
)
from opentrons.hardware_control.errors import (
    GripperNotAttachedError,
    InvalidMoveError,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control import ThreadManager
from opentrons.hardware_control.backends.ot3utils import (
    axis_to_node,
)
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons.types import Point, Mount

from opentrons_hardware.hardware_control.motion import MoveStopCondition

from opentrons.config import gripper_config as gc, ot3_pipette_config
from opentrons_shared_data.gripper.gripper_definition import GripperModel
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteModelType,
    PipetteChannelType,
    PipetteVersionType,
)


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
async def mock_instrument_handlers(
    ot3_hardware: ThreadManager[OT3API],
) -> Iterator[Tuple[Mock]]:
    with patch.object(
        ot3_hardware.managed_obj,
        "_gripper_handler",
        Mock(spec=GripperHandler),
    ) as mock_gripper_handler, patch.object(
        ot3_hardware.managed_obj, "_pipette_handler", Mock(spec=OT3PipetteHandler)
    ) as mock_pipette_handler:
        yield mock_gripper_handler, mock_pipette_handler


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
            pipette_config = ot3_pipette_config.load_ot3_pipette(
                ot3_pipette_config.PipetteModelVersionType(
                    PipetteModelType(configs["model"]),
                    PipetteChannelType(configs["channels"]),
                    PipetteVersionType(*configs["version"]),
                )
            )
            instr_data = OT3AttachedPipette(config=pipette_config, id="fakepip")
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
            moving: OT3Axis,
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
            OT3Axis.X: 477.2,
            OT3Axis.Y: 493.8,
            OT3Axis.Z_L: 253.475,
            OT3Axis.Z_R: 253.475,
            OT3Axis.Z_G: 253.475,
            OT3Axis.P_L: 0,
            OT3Axis.P_R: 0,
            OT3Axis.G: 0,
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
            moving: OT3Axis,
            distance_mm: float,
            speed_mm_per_s: float,
            probe: InstrumentProbeType,
        ) -> None:
            ot3_hardware._backend._position[axis_to_node(moving)] += distance_mm / 2
            return [1, 2, 3, 4, 5, 6, 8]

        mock_pass.side_effect = _update_position
        yield mock_pass


@pytest.mark.parametrize(
    "mount,homed_axis",
    [
        (OT3Mount.RIGHT, [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_R]),
        (OT3Mount.LEFT, [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L]),
        (OT3Mount.GRIPPER, [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_G]),
    ],
)
async def test_move_to_without_homing_first(
    ot3_hardware: ThreadManager[OT3API],
    mock_home: AsyncMock,
    mount: OT3Mount,
    homed_axis: List[OT3Axis],
) -> None:
    """Before a mount can be moved, XY and the corresponding Z  must be homed first"""
    if mount == OT3Mount.GRIPPER:
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
    mock_home.assert_called_once_with(homed_axis)
    assert ot3_hardware._backend.check_motor_status(homed_axis)


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
    pipette_node: OT3Axis,
    mount: OT3Mount,
    fake_liquid_settings: LiquidProbeSettings,
    mock_instrument_handlers: Tuple[Mock],
    mock_current_position_ot3: AsyncMock,
    mock_ungrip: AsyncMock,
    mock_home_plunger: AsyncMock,
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
        mock_home_plunger.assert_called_once()
        backend.liquid_probe.assert_called_once_with(
            mount,
            fake_settings_aspirate.max_z_distance,
            fake_settings_aspirate.mount_speed,
            (fake_settings_aspirate.plunger_speed * -1),
            fake_settings_aspirate.sensor_threshold_pascals,
            fake_settings_aspirate.log_pressure,
            fake_settings_aspirate.auto_zero_sensor,
            fake_settings_aspirate.num_baseline_reads,
        )

        return_dict[head_node], return_dict[pipette_node] = 142, 142
        mock_position.return_value = return_dict
        await ot3_hardware.liquid_probe(
            mount, fake_liquid_settings
        )  # should raise no exceptions


@pytest.mark.parametrize(
    "mount, head_node, pipette_node",
    [
        (OT3Mount.LEFT, NodeId.head_l, NodeId.pipette_left),
        (OT3Mount.RIGHT, NodeId.head_r, NodeId.pipette_right),
    ],
)
async def test_liquid_sensing_errors(
    mock_move_to: AsyncMock,
    ot3_hardware: ThreadManager[OT3API],
    head_node: NodeId,
    pipette_node: NodeId,
    mount: OT3Mount,
    fake_liquid_settings: LiquidProbeSettings,
    mock_instrument_handlers: Tuple[Mock],
    mock_current_position_ot3: AsyncMock,
    mock_home_plunger: AsyncMock,
    mock_ungrip: AsyncMock,
) -> None:
    backend = ot3_hardware.managed_obj._backend
    mock_ungrip.return_value = None
    await ot3_hardware.home()
    mock_move_to.return_value = None

    with patch.object(
        backend, "liquid_probe", AsyncMock(spec=backend.liquid_probe)
    ) as mock_position:
        return_dict = {
            head_node: 103,
            NodeId.gantry_x: 0,
            NodeId.gantry_y: 0,
            pipette_node: 200,
        }
        # should raise LiquidNotFound
        mock_position.return_value = return_dict
        with pytest.raises(LiquidNotFound):
            await ot3_hardware.liquid_probe(mount, fake_liquid_settings)

        # should raise EarlyLiquidSenseTrigger
        return_dict[head_node], return_dict[pipette_node] = 150, 150
        mock_position.return_value = return_dict
        with pytest.raises(EarlyLiquidSenseTrigger):
            await ot3_hardware.liquid_probe(mount, fake_liquid_settings)


@pytest.mark.parametrize(
    "mount,moving",
    [
        (OT3Mount.RIGHT, OT3Axis.Z_R),
        (OT3Mount.LEFT, OT3Axis.Z_L),
        (OT3Mount.RIGHT, OT3Axis.X),
        (OT3Mount.LEFT, OT3Axis.X),
        (OT3Mount.RIGHT, OT3Axis.Y),
        (OT3Mount.LEFT, OT3Axis.Y),
    ],
)
async def test_capacitive_probe(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_probe: AsyncMock,
    mount: OT3Mount,
    moving: OT3Axis,
    fake_settings: CapacitivePassSettings,
) -> None:
    await ot3_hardware.home()
    here = await ot3_hardware.gantry_position(mount)
    res = await ot3_hardware.capacitive_probe(mount, moving, 2, fake_settings)
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
    await ot3_hardware.capacitive_probe(
        OT3Mount.RIGHT, OT3Axis.X, target, fake_settings
    )
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
        [OT3Mount.RIGHT, OT3Axis.Z_L],
        [OT3Mount.LEFT, OT3Axis.Z_R],
        [OT3Mount.RIGHT, OT3Axis.P_L],
        [OT3Mount.RIGHT, OT3Axis.P_R],
        [OT3Mount.LEFT, OT3Axis.P_L],
        [OT3Mount.RIGHT, OT3Axis.P_R],
    ),
)
async def test_capacitive_probe_invalid_axes(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_probe: AsyncMock,
    mount: OT3Mount,
    moving: OT3Axis,
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
        (OT3Axis.X, Point(0, 0, 0), Point(1, 0, 0), -1),
        (OT3Axis.Y, Point(0, 0, 0), Point(0, -1, 0), 1),
    ],
)
async def test_pipette_capacitive_sweep(
    axis: OT3Axis,
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
        (OT3Axis.X, Point(0, 0, 0), Point(1, 0, 0), -1),
        (OT3Axis.Y, Point(0, 0, 0), Point(0, -1, 0), 1),
    ],
)
async def test_gripper_capacitive_sweep(
    probe: GripperProbe,
    intr_probe: InstrumentProbeType,
    axis: OT3Axis,
    begin: Point,
    end: Point,
    distance: float,
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_pass: AsyncMock,
) -> None:
    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)
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
        [OT3Mount.RIGHT, OT3Axis.Z_L],
        [OT3Mount.LEFT, OT3Axis.Z_R],
        [OT3Mount.RIGHT, OT3Axis.P_L],
        [OT3Mount.RIGHT, OT3Axis.P_R],
        [OT3Mount.LEFT, OT3Axis.P_L],
        [OT3Mount.RIGHT, OT3Axis.P_R],
    ),
)
async def test_capacitive_sweep_invalid_axes(
    ot3_hardware: ThreadManager[OT3API],
    mock_move_to: AsyncMock,
    mock_backend_capacitive_probe: AsyncMock,
    mount: OT3Mount,
    moving: OT3Axis,
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


async def test_gripper_action(
    ot3_hardware: ThreadManager[OT3API],
    mock_grip: AsyncMock,
    mock_ungrip: AsyncMock,
    mock_hold_jaw_width: AsyncMock,
) -> None:
    with pytest.raises(
        GripperNotAttachedError, match="Cannot perform action without gripper attached"
    ):
        await ot3_hardware.grip(5.0)
    mock_grip.assert_not_called()

    with pytest.raises(
        GripperNotAttachedError, match="Cannot perform action without gripper attached"
    ):
        await ot3_hardware.ungrip()
    mock_ungrip.assert_not_called()

    # cache gripper
    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)

    with pytest.raises(GripError, match="Gripper jaw must be homed before moving"):
        await ot3_hardware.grip(5.0)
    await ot3_hardware.home_gripper_jaw()
    mock_ungrip.assert_called_once()
    mock_ungrip.reset_mock()
    await ot3_hardware.home([OT3Axis.G])
    mock_ungrip.assert_called_once()
    mock_ungrip.reset_mock()
    await ot3_hardware.grip(5.0)
    mock_grip.assert_called_once_with(
        gc.duty_cycle_by_force(5.0, gripper_config.grip_force_profile),
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
    with pytest.raises(GripperNotAttachedError):
        await ot3_hardware.move_to(OT3Mount.GRIPPER, Point(0, 0, 0))


async def test_gripper_mount_not_movable(
    ot3_hardware: ThreadManager[OT3API],
) -> None:
    gripper_config = gc.load(GripperModel.v1)
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)
    assert ot3_hardware._gripper_handler.gripper
    with pytest.raises(InvalidMoveError):
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
    with pytest.raises(InvalidMoveError):
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
            OT3Axis.X,
            OT3Axis.Y,
            OT3Axis.Z_G,
        ]


@pytest.mark.parametrize("enable_stalls", [True, False])
async def test_move_stall_flag(
    ot3_hardware: ThreadManager[OT3API],
    mock_backend_move: AsyncMock,
    enable_stalls: bool,
) -> None:

    expected = MoveStopCondition.stall if enable_stalls else MoveStopCondition.none

    await ot3_hardware.move_to(Mount.LEFT, Point(0, 0, 0), _check_stalls=enable_stalls)
    mock_backend_move.assert_called_once()
    _, _, condition = mock_backend_move.call_args_list[0][0]
    assert condition == expected

    mock_backend_move.reset_mock()
    await ot3_hardware.move_rel(
        Mount.LEFT, Point(10, 0, 0), _check_stalls=enable_stalls
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


async def test_pick_up_tip_full_tiprack(
    ot3_hardware: ThreadManager[OT3API],
    mock_instrument_handlers: Tuple[Mock],
    mock_ungrip: AsyncMock,
) -> None:
    mock_ungrip.return_value = None
    await ot3_hardware.home()
    _, pipette_handler = mock_instrument_handlers
    backend = ot3_hardware.managed_obj._backend

    def _fake_function():
        return None

    with patch.object(
        backend, "tip_action", AsyncMock(spec=backend.tip_action)
    ) as tip_action:

        pipette_handler.plan_check_pick_up_tip.return_value = (
            PickUpTipSpec(
                plunger_prep_pos=0,
                plunger_currents={
                    OT3Axis.of_main_tool_actuator(Mount.LEFT): 0,
                },
                presses=[],
                shake_off_list=[],
                retract_target=0,
                pick_up_motor_actions=TipMotorPickUpTipSpec(
                    # Move onto the posts
                    tiprack_down=Point(0, 0, 0),
                    tiprack_up=Point(0, 0, 0),
                    pick_up_distance=0,
                    speed=0,
                    currents={OT3Axis.Q: 0},
                ),
            ),
            _fake_function,
        )
        await ot3_hardware.pick_up_tip(Mount.LEFT, 40.0)
        pipette_handler.plan_check_pick_up_tip.assert_called_once_with(
            OT3Mount.LEFT, 40.0, None, None
        )
        tip_action.assert_has_calls(
            calls=[
                call([OT3Axis.P_L], 0, 0, "clamp"),
                call([OT3Axis.P_L], 0, 0, "home"),
            ]
        )


async def test_drop_tip_full_tiprack(
    ot3_hardware: ThreadManager[OT3API],
    mock_instrument_handlers: Tuple[Mock],
) -> None:
    _, pipette_handler = mock_instrument_handlers
    backend = ot3_hardware.managed_obj._backend

    def _fake_function():
        return None

    with patch.object(
        backend, "tip_action", AsyncMock(spec=backend.tip_action)
    ) as tip_action:
        pipette_handler.plan_check_drop_tip.return_value = (
            DropTipSpec(
                drop_moves=[
                    DropTipMove(
                        target_position=1,
                        current={OT3Axis.P_L: 1.0},
                        speed=1,
                        is_ht_tip_action=True,
                    )
                ],
                shake_moves=[],
                ending_current={OT3Axis.P_L: 1.0},
            ),
            _fake_function,
        )
        await ot3_hardware.drop_tip(Mount.LEFT, home_after=True)
        pipette_handler.plan_check_drop_tip.assert_called_once_with(OT3Mount.LEFT, True)
        tip_action.assert_has_calls(
            calls=[
                call([OT3Axis.P_L], 1, 1, "clamp"),
                call([OT3Axis.P_L], 1, 1, "home"),
            ]
        )


@pytest.mark.parametrize(
    "axes",
    [[OT3Axis.X], [OT3Axis.X, OT3Axis.Y], [OT3Axis.X, OT3Axis.Y, OT3Axis.P_L], None],
)
async def test_update_position_estimation(
    ot3_hardware: ThreadManager[OT3API], axes: List[OT3Axis]
) -> None:

    backend = ot3_hardware.managed_obj._backend
    with patch.object(
        backend,
        "update_motor_estimation",
        AsyncMock(spec=backend.update_motor_estimation),
    ) as mock_update:
        await ot3_hardware._update_position_estimation(axes)
        if axes is None:
            axes = [ax for ax in OT3Axis]
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

        mock_pos.return_value = {ax: 100 for ax in OT3Axis}
        mock_encoder.return_value = {ax: 99 for ax in OT3Axis}

        await ot3_hardware.refresh_positions()

        mock_update_status.assert_called_once()
        mock_pos.assert_called_once()
        mock_encoder.assert_called_once()

        assert (ax in ot3_hardware._current_position.keys() for ax in OT3Axis)
        assert (ax in ot3_hardware._encoder_position.keys() for ax in OT3Axis)


@pytest.mark.parametrize("axis", [OT3Axis.X, OT3Axis.Z_L, OT3Axis.P_L, OT3Axis.Y])
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
    axis: OT3Axis,
    stepper_ok: bool,
    encoder_ok: bool,
) -> None:

    backend = ot3_hardware.managed_obj._backend
    origin_pos = {ax: 100 for ax in OT3Axis}
    origin_encoder = {ax: 99 for ax in OT3Axis}
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

        # FIXME: uncomment the following when stall detection
        # is fully re-enable
        # if stepper_ok:
        #     """Move to home position"""
        #     # move is called
        #     mock_backend_move.assert_awaited_once()
        #     move = mock_backend_move.call_args_list[0][0][1][0]
        #     assert move.distance == 100.0
        #     # home is NOT called
        #     mock_backend_home.assert_not_awaited()
        if encoder_ok:
            """Copy encoder position to stepper pos"""
            mock_estimate.assert_awaited_once()
            # for accurate axis, we just move to home pos:
            if axis in [OT3Axis.Z_L, OT3Axis.P_L]:
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
