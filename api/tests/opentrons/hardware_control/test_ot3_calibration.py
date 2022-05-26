"""Tests for OT3 calibration."""
import copy
from dataclasses import replace
import pytest
from typing import Iterator, Tuple
from typing_extensions import Literal
from mock import patch, AsyncMock
from opentrons.hardware_control import ThreadManager
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount, OT3Axis
from opentrons.config.types import OT3CalibrationSettings, Offset
from opentrons.hardware_control.ot3_calibration import (
    find_edge,
    EarlyCapacitiveSenseTrigger,
    find_deck_position,
)
from opentrons.types import Point


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


def _update_edge_sense_config(
    old: OT3CalibrationSettings, **new_edge_sense_settings
) -> OT3CalibrationSettings:
    return replace(old, edge_sense=replace(old.edge_sense, **new_edge_sense_settings))


plus_x_point = (0, 10, 0)
plus_y_point = (10, 0, 0)
minus_x_point = (0, -10, 0)
minus_y_point = (-10, 0, 0)


@pytest.fixture
async def override_cal_config(ot3_hardware: ThreadManager[OT3API]) -> Iterator[None]:
    old_calibration = copy.deepcopy(ot3_hardware.config.calibration)
    await ot3_hardware.update_config(
        calibration=_update_edge_sense_config(
            old_calibration,
            search_initial_tolerance_mm=10,
            search_iteration_limit=3,
            overrun_tolerance_mm=0,
            early_sense_tolerance_mm=2,
            plus_x_pos=plus_x_point,
            plus_y_pos=plus_y_point,
            minus_x_pos=minus_x_point,
            minus_y_pos=minus_y_point,
        )
    )
    try:
        yield
    finally:
        await ot3_hardware.update_config(calibration=old_calibration)


def _other_axis_val(point: Tuple[float, float, float], main_axis: OT3Axis) -> float:
    if main_axis == OT3Axis.X:
        return point[1]
    if main_axis == OT3Axis.Y:
        return point[0]
    raise KeyError(main_axis)


@pytest.mark.parametrize(
    "search_axis,search_direction,point,probe_results,search_result",
    [
        # For each axis and direction, test
        # 1. hitting the deck each time
        # 2. missing the deck each time
        # 3. hit-hit-miss
        (OT3Axis.X, -1, plus_x_point, (1, 1, 1), -7.5),
        (OT3Axis.X, -1, plus_x_point, (-1, -1, -1), 27.5),
        (OT3Axis.X, -1, plus_x_point, (1, 1, -1), -2.5),
        (OT3Axis.X, 1, minus_x_point, (1, 1, 1), 7.5),
        (OT3Axis.X, 1, minus_x_point, (-1, -1, -1), -27.5),
        (OT3Axis.X, 1, minus_x_point, (1, 1, -1), 2.5),
        (OT3Axis.Y, -1, plus_y_point, (1, 1, 1), -7.5),
        (OT3Axis.Y, -1, plus_y_point, (-1, -1, -1), 27.5),
        (OT3Axis.Y, -1, plus_y_point, (1, 1, -1), -2.5),
        (OT3Axis.Y, 1, minus_y_point, (1, 1, 1), 7.5),
        (OT3Axis.Y, 1, minus_y_point, (-1, -1, -1), -27.5),
        (OT3Axis.Y, 1, minus_y_point, (1, 1, -1), 2.5),
    ],
)
async def test_find_edge(
    ot3_hardware: ThreadManager[OT3API],
    mock_capacitive_probe: AsyncMock,
    override_cal_config: None,
    mock_move_to: AsyncMock,
    search_axis: OT3Axis,
    search_direction: Literal[1, -1],
    point: Offset,
    probe_results: Tuple[float, float, float],
    search_result: float,
) -> None:
    await ot3_hardware.home()
    mock_capacitive_probe.side_effect = probe_results
    result = await find_edge(
        ot3_hardware,
        OT3Mount.RIGHT,
        Point(*point),
        search_axis,
        search_direction,
    )
    assert result == search_result
    # the first move is in z only to the cal height
    checked_calls = mock_move_to.call_args_list[1:]
    # all other moves should only move in the search axis
    for call in checked_calls:
        assert call[0][0] == OT3Mount.RIGHT
        assert _other_axis_val(call[0][1], search_axis) == _other_axis_val(
            point, search_axis
        )


async def test_find_edge_early_trigger(
    ot3_hardware: ThreadManager[OT3API],
    mock_capacitive_probe: AsyncMock,
    override_cal_config: None,
) -> None:
    await ot3_hardware.home()
    mock_capacitive_probe.side_effect = (3,)
    with pytest.raises(EarlyCapacitiveSenseTrigger):
        await find_edge(
            ot3_hardware,
            OT3Mount.RIGHT,
            Point(*ot3_hardware.config.calibration.edge_sense.plus_y_pos),
            OT3Axis.Y,
            -1,
        )


@pytest.mark.parametrize("mount", (OT3Mount.RIGHT, OT3Mount.LEFT))
async def test_find_deck_checks_z_only(
    ot3_hardware: ThreadManager[OT3API],
    mock_capacitive_probe: AsyncMock,
    override_cal_config: None,
    mock_move_to: AsyncMock,
    mount: OT3Mount,
) -> None:
    await find_deck_position(ot3_hardware, mount)
    config_point = Point(*ot3_hardware.config.calibration.z_offset.point)
    first_move_point = mock_move_to.call_args_list[0][0][1]
    assert first_move_point.x == config_point.x
    assert first_move_point.y == config_point.y

    second_move_point = mock_move_to.call_args_list[1][0][1]
    assert second_move_point.x == config_point.x
    assert second_move_point.y == config_point.y
