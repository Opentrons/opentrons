"""Tests for OT3 calibration."""
import copy
from dataclasses import replace
import pytest
import json
from math import isclose
from typing import Iterator, Tuple
from typing_extensions import Literal
from mock import patch, AsyncMock, Mock, call as mock_call
from opentrons.hardware_control import ThreadManager
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.config.types import OT3CalibrationSettings
from opentrons.hardware_control.ot3_calibration import (
    find_edge_binary,
    find_axis_center,
    EarlyCapacitiveSenseTrigger,
    find_calibration_structure_height,
    find_slot_center_binary,
    find_slot_center_noncontact,
    calibrate_pipette,
    CalibrationMethod,
    _edges_from_data,
    _probe_deck_at,
    _verify_edge_pos,
    InaccurateNonContactSweepError,
    CalibrationStructureNotFoundError,
    EdgeNotFoundError,
    PREP_OFFSET_DEPTH,
    EDGES,
)
from opentrons.types import Point
from opentrons_shared_data.deck import get_calibration_square_position_in_slot


@pytest.fixture(autouse=True)
def mock_save_json():
    with patch("json.dump", Mock(spec=json.dump)) as jd:
        yield jd


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
def mock_capacitive_probe(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "capacitive_probe",
        AsyncMock(
            spec=ot3_hardware.managed_obj.capacitive_probe,
            wraps=ot3_hardware.managed_obj.capacitive_probe,
        ),
    ) as mock_probe:
        yield mock_probe


@pytest.fixture
def mock_probe_deck() -> Iterator[AsyncMock]:
    with patch(
        "opentrons.hardware_control.ot3_calibration._probe_deck_at",
        AsyncMock(
            spec=_probe_deck_at,
            wraps=_probe_deck_at,
        ),
    ) as mock_probe_deck:
        yield mock_probe_deck


@pytest.fixture
def mock_capacitive_sweep(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch.object(
        ot3_hardware.managed_obj,
        "capacitive_sweep",
        AsyncMock(
            spec=ot3_hardware.managed_obj.capacitive_sweep,
            wraps=ot3_hardware.managed_obj.capacitive_sweep,
        ),
    ) as mock_sweep:
        yield mock_sweep


@pytest.fixture
def mock_verify_edge(ot3_hardware: ThreadManager[OT3API]) -> Iterator[AsyncMock]:
    with patch(
        "opentrons.hardware_control.ot3_calibration._verify_edge_pos",
        AsyncMock(
            spec=_verify_edge_pos,
        ),
    ) as mock_verify_edge:
        yield mock_verify_edge


@pytest.fixture
def mock_data_analysis() -> Iterator[Mock]:
    with patch(
        "opentrons.hardware_control.ot3_calibration._edges_from_data",
        Mock(spec=_edges_from_data),
    ) as efd:
        yield efd


def _update_edge_sense_config(
    old: OT3CalibrationSettings, **new_edge_sense_settings
) -> OT3CalibrationSettings:
    return replace(old, edge_sense=replace(old.edge_sense, **new_edge_sense_settings))


@pytest.fixture
async def override_cal_config(ot3_hardware: ThreadManager[OT3API]) -> Iterator[None]:
    old_calibration = copy.deepcopy(ot3_hardware.config.calibration)
    await ot3_hardware.update_config(
        calibration=_update_edge_sense_config(
            old_calibration,
            search_initial_tolerance_mm=8,
            search_iteration_limit=3,
            overrun_tolerance_mm=0,
            early_sense_tolerance_mm=2,
        )
    )
    try:
        yield
    finally:
        await ot3_hardware.update_config(calibration=old_calibration)


def _other_axis_val(point: Tuple[float, float, float], main_axis: Axis) -> float:
    if main_axis == Axis.X:
        return point[1]
    if main_axis == Axis.Y:
        return point[0]
    raise KeyError(main_axis)


@pytest.mark.parametrize(
    "search_axis,direction_if_hit,probe_results,search_result",
    [
        # For each axis and direction, test
        # 1. hit-miss-miss
        # 2. miss-hit-hit
        # 3. miss-hit-miss
        (Axis.X, -1, (1, -1, -1), -1),
        (Axis.X, -1, (-1, 1, 1), 1),
        (Axis.X, -1, (-1, 1, -1), 3),
        (Axis.X, 1, (1, -1, -1), 1),
        (Axis.X, 1, (-1, 1, 1), -1),
        (Axis.X, 1, (-1, 1, -1), -3),
    ],
)
async def test_find_edge(
    ot3_hardware: ThreadManager[OT3API],
    mock_capacitive_probe: AsyncMock,
    override_cal_config: None,
    mock_verify_edge: AsyncMock,
    mock_move_to: AsyncMock,
    search_axis: Axis,
    direction_if_hit: Literal[1, -1],
    probe_results: Tuple[float, float, float],
    search_result: float,
) -> None:
    await ot3_hardware.home()
    mock_capacitive_probe.side_effect = probe_results
    result = await find_edge_binary(
        ot3_hardware,
        OT3Mount.RIGHT,
        Point(0, 0, 0),
        search_axis,
        direction_if_hit,
        False,
    )
    assert search_axis.of_point(result) == search_result
    # the first move is in z only to the cal height
    checked_calls = mock_move_to.call_args_list[1:]
    # all other moves should only move in the search axis
    for call in checked_calls:
        assert call[0][0] == OT3Mount.RIGHT
        assert _other_axis_val(call[0][1], search_axis) == pytest.approx(
            _other_axis_val(Point(0, 0, 0), search_axis)
        )


@pytest.mark.parametrize(
    "search_axis,direction_if_hit,probe_results",
    [
        (Axis.X, -1, (1, 1)),
        (Axis.Y, -1, (-1, -1)),
    ],
)
async def test_edge_not_found(
    ot3_hardware: ThreadManager[OT3API],
    mock_capacitive_probe: AsyncMock,
    override_cal_config: None,
    mock_move_to: AsyncMock,
    search_axis: Axis,
    direction_if_hit: Literal[1, -1],
    probe_results: Tuple[float, float, float],
) -> None:
    await ot3_hardware.home()
    mock_capacitive_probe.side_effect = probe_results
    with pytest.raises(EdgeNotFoundError):
        await _verify_edge_pos(
            ot3_hardware,
            OT3Mount.RIGHT,
            search_axis,
            Point(0, 0, 0),
            0.5,
            direction_if_hit,
        )


async def test_find_edge_early_trigger(
    ot3_hardware: ThreadManager[OT3API],
    mock_capacitive_probe: AsyncMock,
    override_cal_config: None,
) -> None:
    await ot3_hardware.home()
    mock_capacitive_probe.side_effect = (3,)
    with pytest.raises(EarlyCapacitiveSenseTrigger):
        await find_edge_binary(
            ot3_hardware,
            OT3Mount.RIGHT,
            Point(0.0, 0.0, 0.0),
            Axis.Y,
            -1,
        )


async def test_deck_not_found(
    ot3_hardware: ThreadManager[OT3API],
    mock_capacitive_probe: AsyncMock,
    override_cal_config: None,
) -> None:
    await ot3_hardware.home()
    mock_capacitive_probe.side_effect = (-25,)
    with pytest.raises(CalibrationStructureNotFoundError):
        await find_calibration_structure_height(
            ot3_hardware,
            OT3Mount.RIGHT,
            Point(0.0, 0.0, 0.0),
        )


@pytest.mark.parametrize("mount", (OT3Mount.RIGHT, OT3Mount.LEFT))
@pytest.mark.parametrize("target", (Point(10, 10, 0), Point(355, 355, 0)))
async def test_find_deck_checks_z_only(
    ot3_hardware: ThreadManager[OT3API],
    mock_capacitive_probe: AsyncMock,
    override_cal_config: None,
    mock_probe_deck: AsyncMock,
    mock_move_to: AsyncMock,
    mount: OT3Mount,
    target: Point,
) -> None:
    await ot3_hardware.home()
    here = await ot3_hardware.gantry_position(mount)
    mock_capacitive_probe.side_effect = (-1.8,)
    await find_calibration_structure_height(ot3_hardware, mount, target)

    z_prep_loc = target + PREP_OFFSET_DEPTH

    mock_probe_deck.assert_called_once_with(
        ot3_hardware,
        mount,
        z_prep_loc,
        ot3_hardware.config.calibration.z_offset.pass_settings,
    )
    # first we move only to safe height from current position
    first_move_point = mock_move_to.call_args_list[0][0][1]
    assert first_move_point.x == here.x
    assert first_move_point.y == here.y

    # actually move to the target position
    second_move_point = mock_move_to.call_args_list[1][0][1]
    assert isclose(second_move_point.x, z_prep_loc.x)
    assert isclose(second_move_point.y, z_prep_loc.y)


async def test_method_enum(
    ot3_hardware: ThreadManager[OT3API],
    override_cal_config: None,
) -> None:
    with patch(
        "opentrons.hardware_control.ot3_calibration.find_slot_center_binary",
        AsyncMock(spec=find_slot_center_binary),
    ) as binary, patch(
        "opentrons.hardware_control.ot3_calibration.get_calibration_square_position_in_slot",
        Mock(),
    ) as calibration_target, patch(
        "opentrons.hardware_control.ot3_calibration.find_slot_center_noncontact",
        AsyncMock(spec=find_slot_center_noncontact),
    ) as noncontact, patch(
        "opentrons.hardware_control.ot3_calibration.find_calibration_structure_height",
        AsyncMock(spec=find_calibration_structure_height),
    ) as find_deck, patch.object(
        ot3_hardware.managed_obj, "reset_instrument_offset", AsyncMock()
    ) as reset_instrument_offset, patch.object(
        ot3_hardware.managed_obj, "save_instrument_offset", AsyncMock()
    ) as save_instrument_offset:
        find_deck.return_value = 10
        calibration_target.return_value = Point(0.0, 0.0, 0.0)
        binary.return_value = Point(1.0, 2.0, 3.0)
        noncontact.return_value = Point(3.0, 4.0, 5.0)
        await ot3_hardware.home()
        binval = await calibrate_pipette(
            ot3_hardware, OT3Mount.RIGHT, 5, CalibrationMethod.BINARY_SEARCH
        )
        reset_instrument_offset.assert_called_once()
        find_deck.assert_called_once()
        binary.assert_called_once()
        noncontact.assert_not_called()
        save_instrument_offset.assert_called_once()
        assert binval == Point(-1.0, -2.0, -3.0)

        reset_instrument_offset.reset_mock()
        find_deck.reset_mock()
        calibration_target.reset_mock()
        binary.reset_mock()
        noncontact.reset_mock()
        save_instrument_offset.reset_mock()

        ncval = await calibrate_pipette(
            ot3_hardware, OT3Mount.LEFT, 5, CalibrationMethod.NONCONTACT_PASS
        )
        reset_instrument_offset.assert_called_once()
        find_deck.assert_called_once()
        binary.assert_not_called()
        noncontact.assert_called_once()
        save_instrument_offset.assert_called_once()
        assert ncval == Point(-3.0, -4.0, -5.0)


async def test_calibrate_mount_errors(
    ot3_hardware: ThreadManager[OT3API], mock_data_analysis: Mock
) -> None:
    with patch.object(
        ot3_hardware.managed_obj, "reset_instrument_offset", AsyncMock()
    ) as reset_instrument_offset, patch.object(
        ot3_hardware.managed_obj, "save_instrument_offset", AsyncMock()
    ) as save_instrument_offset, patch(
        "opentrons.hardware_control.ot3_calibration.find_calibration_structure_height",
        AsyncMock(spec=find_calibration_structure_height),
    ) as find_deck:
        find_deck.return_value = 10
        mock_data_analysis.return_value = (-1000, 1000)

        await ot3_hardware.home()
        # calibrate pipette should re-raise exception
        with pytest.raises(InaccurateNonContactSweepError):
            await calibrate_pipette(
                ot3_hardware, OT3Mount.RIGHT, 5, CalibrationMethod.NONCONTACT_PASS
            )

        reset_calls = [
            mock_call(OT3Mount.RIGHT),
            mock_call(OT3Mount.RIGHT, to_default=False),
        ]
        reset_instrument_offset.assert_has_calls(reset_calls)
        # instrument offset should not be saved
        save_instrument_offset.assert_not_called()

        reset_instrument_offset.reset_mock()
        save_instrument_offset.reset_mock()


async def test_noncontact_sanity(
    ot3_hardware: ThreadManager[OT3API],
    override_cal_config: None,
    mock_move_to: AsyncMock,
    mock_capacitive_sweep: AsyncMock,
    mock_data_analysis: Mock,
) -> None:
    mock_data_analysis.return_value = (-1000, 1000)
    await ot3_hardware.home()
    center = Point(*get_calibration_square_position_in_slot(5))
    with pytest.raises(InaccurateNonContactSweepError):
        await find_axis_center(
            ot3_hardware,
            OT3Mount.RIGHT,
            center + EDGES["left"],
            center + EDGES["right"],
            Axis.X,
        )
