""" Tests for behaviors specific to the OT3 hardware controller.
"""
from typing import cast, Iterator, Union, Dict
from typing_extensions import Literal
from math import copysign
import pytest
from mock import AsyncMock, patch
from opentrons.config.types import GantryLoad, CapacitivePassSettings
from opentrons.hardware_control.dev_types import (
    InstrumentDict,
    AttachedGripper,
)
from opentrons.hardware_control.instruments.ot3.gripper_handler import (
    GripError,
)
from opentrons.hardware_control.types import (
    OT3Mount,
    OT3Axis,
    GripperNotAttachedError,
    InvalidMoveError,
    CriticalPoint,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control import ThreadManager
from opentrons.hardware_control.backends.ot3utils import axis_to_node
from opentrons.types import Point

from opentrons.config import gripper_config as gc
from opentrons_shared_data.gripper.dev_types import GripperModel


@pytest.fixture
def fake_settings() -> CapacitivePassSettings:
    return CapacitivePassSettings(
        prep_distance_mm=1,
        max_overrun_distance_mm=2,
        speed_mm_per_s=4,
        sensor_threshold_pf=1.0,
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


@pytest.mark.parametrize(
    "attached,load",
    (
        (
            {OT3Mount.RIGHT: {"channels": 8}, OT3Mount.LEFT: {"channels": 1}},
            GantryLoad.TWO_LOW_THROUGHPUT,
        ),
        ({}, GantryLoad.NONE),
        ({OT3Mount.GRIPPER: {"name": "gripper"}}, GantryLoad.GRIPPER),
        ({OT3Mount.LEFT: {"channels": 1}}, GantryLoad.LOW_THROUGHPUT),
        ({OT3Mount.RIGHT: {"channels": 8}}, GantryLoad.LOW_THROUGHPUT),
        ({OT3Mount.RIGHT: {"channels": 96}}, GantryLoad.HIGH_THROUGHPUT),
        (
            {OT3Mount.LEFT: {"channels": 1}, OT3Mount.GRIPPER: {"name": "gripper"}},
            GantryLoad.LOW_THROUGHPUT,
        ),
        (
            {OT3Mount.RIGHT: {"channels": 8}, OT3Mount.GRIPPER: {"name": "gripper"}},
            GantryLoad.LOW_THROUGHPUT,
        ),
        (
            {OT3Mount.RIGHT: {"channels": 96}, OT3Mount.GRIPPER: {"name": "gripper"}},
            GantryLoad.HIGH_THROUGHPUT,
        ),
    ),
)
def test_gantry_load_transform(attached, load):
    assert (
        OT3API._gantry_load_from_instruments(
            cast(Dict[OT3Mount, InstrumentDict], attached)
        )
        == load
    )


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
        ) -> None:
            ot3_hardware._backend._position[axis_to_node(moving)] += distance_mm / 2

        mock_probe.side_effect = _update_position

        yield mock_probe


@pytest.fixture
def mock_backend_capacitive_pass(
    ot3_hardware: ThreadManager[OT3API],
) -> Iterator[AsyncMock]:
    backend = ot3_hardware.managed_obj._backend
    with patch.object(
        backend, "capacitive_pass", AsyncMock(spec=backend.capacitive_pass)
    ) as mock_pass:

        async def _update_position(
            mount: OT3Mount, moving: OT3Axis, distance_mm: float, speed_mm_per_s: float
        ) -> None:
            ot3_hardware._backend._position[axis_to_node(moving)] += distance_mm / 2
            return [1, 2, 3, 4, 5, 6, 8]

        mock_pass.side_effect = _update_position
        yield mock_pass


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
    mock_backend_capacitive_probe.assert_called_once_with(mount, moving, 3.0, 4, 1.0)

    original = moving.set_in_point(here, 0)
    for call in mock_move_to.call_args_list:
        this_point = moving.set_in_point(call[0][1], 0)
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
async def test_capacitive_sweep(
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
        OT3Mount.RIGHT, axis, distance, 3
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
    gripper_config = gc.load(GripperModel.V1, "g12345")
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
    gripper_config = gc.load(GripperModel.V1, "g12345")
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
    gripper_config = gc.load(GripperModel.V1, "g12345")
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)

    with pytest.raises(GripError, match="Gripper jaw must be homed before moving"):
        await ot3_hardware.grip(5.0)
    await ot3_hardware.home_gripper_jaw()
    mock_ungrip.assert_called_once()
    mock_ungrip.reset_mock()
    await ot3_hardware.home([OT3Axis.G])
    await ot3_hardware.grip(5.0)
    mock_grip.assert_called_once_with(
        gc.piecewise_force_conversion(5.0, gripper_config.jaw_force_per_duty_cycle),
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
    gripper_config = gc.load(GripperModel.V1, "g12345")
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
        CriticalPoint.XY_CENTER,
        CriticalPoint.FRONT_NOZZLE,
    ],
)
async def test_gripper_fails_for_pipette_cps(
    ot3_hardware: ThreadManager[OT3API], critical_point: CriticalPoint
) -> None:
    gripper_config = gc.load(GripperModel.V1, "g12345")
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)
    assert ot3_hardware._gripper_handler.gripper
    with pytest.raises(InvalidMoveError):
        await ot3_hardware.move_to(
            OT3Mount.GRIPPER, Point(0, 0, 0), critical_point=critical_point
        )


async def test_gripper_position(ot3_hardware: ThreadManager[OT3API]):
    gripper_config = gc.load(GripperModel.V1, "g12345")
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
    gripper_config = gc.load(GripperModel.V1, "g12345")
    instr_data = AttachedGripper(config=gripper_config, id="g12345")
    await ot3_hardware.cache_gripper(instr_data)

    await ot3_hardware.move_to(OT3Mount.GRIPPER, Point(0, 0, 0))
    origin, moves = mock_backend_move.call_args_list[0][0]
    # The moves that it emits should move only x, y, and the gripper z
    assert origin == {
        OT3Axis.X: 0,
        OT3Axis.Y: 0,
        OT3Axis.Z_L: 0,
        OT3Axis.Z_R: 0,
        OT3Axis.P_L: 0,
        OT3Axis.P_R: 0,
        OT3Axis.Z_G: 0,
        OT3Axis.G: 0,
    }
    for move in moves:
        assert list(sorted(move.unit_vector.keys(), key=lambda elem: elem.value)) == [
            OT3Axis.X,
            OT3Axis.Y,
            OT3Axis.Z_G,
        ]
