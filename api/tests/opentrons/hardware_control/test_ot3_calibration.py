"""Tests for OT3 calibration."""
import copy
from dataclasses import replace
import pytest
import json
from math import isclose
from typing import Iterator, Tuple
from mock import patch, AsyncMock, Mock, call as mock_call
from opentrons.hardware_control import ThreadManager
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount, OT3Axis
from opentrons.config.types import OT3CalibrationSettings
from opentrons.hardware_control.ot3_calibration import (
    find_edge,
    find_axis_center,
    EarlyCapacitiveSenseTrigger,
    find_deck_height,
    find_slot_center_binary,
    find_slot_center_noncontact,
    calibrate_pipette,
    CalibrationMethod,
    _edges_from_data,
    _take_stride,
    _probe_deck_at,
    _get_calibration_square_position_in_slot,
    InaccurateNonContactSweepError,
    DeckHeightValidRange,
    Z_PREP_OFFSET,
    EDGES,
)
from opentrons.types import Point


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


plus_x_point = (0, 10, 0)
plus_y_point = (10, 0, 0)
minus_x_point = (0, -10, 0)
minus_y_point = (-10, 0, 0)
nominal_centr = (0, 0, 0)

deck_touched = 0.5
deck_missed = -2
step_size = [0.025, 0.1, 0.25, 1.0]


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


@pytest.mark.parametrize("search_axis", [OT3Axis.X, OT3Axis.Y])
@pytest.mark.parametrize("size", step_size)
@pytest.mark.parametrize("found_height", [deck_missed, deck_touched])
@pytest.mark.parametrize("in_search_direction", [True, False])
async def test_take_stride_once(
    ot3_hardware: ThreadManager[OT3API],
    mock_capacitive_probe: AsyncMock,
    mock_probe_deck: AsyncMock,
    override_cal_config: None,
    mock_move_to: AsyncMock,
    search_axis: OT3Axis,
    size: float,
    in_search_direction: bool,
    found_height: float,
):
    await ot3_hardware.home()
    mock_capacitive_probe.side_effect = (found_height,)
    target = Point(0.0, 0.0, 0.0)
    valid_range = DeckHeightValidRange(min=-1.0, max=1.0)

    result = await _take_stride(
        ot3_hardware,
        OT3Mount.LEFT,
        search_axis,
        target,
        size,
        size * 3,
        valid_range,
        in_search_direction,
        False,
    )
    # probe deck only gets called once
    probe_loc = search_axis.set_in_point(target, size)
    mock_probe_deck.assert_called_once_with(
        ot3_hardware,
        OT3Mount.LEFT,
        probe_loc,
        ot3_hardware.config.calibration.edge_sense.pass_settings,
    )

    # deck height (z) should update if we ever find the deck during probing
    if found_height == deck_touched:
        assert result[0] == probe_loc._replace(z=deck_touched)
    else:
        assert result[0] == probe_loc

    # if we're in the search direction, the goal is to find the deck
    if in_search_direction:
        goal_reached = found_height == deck_touched
    else:
        # otherwise, we want to probe until we miss the deck
        goal_reached = found_height == deck_missed

    # switch next direction only if goal is reached
    assert result[1] == -1 if goal_reached else 1
    assert result[2] == goal_reached


@pytest.mark.parametrize("search_axis", [OT3Axis.X, OT3Axis.Y])
@pytest.mark.parametrize("size", step_size)
@pytest.mark.parametrize(
    "in_search_direction,probe_results",
    [
        (
            True,
            (
                deck_missed,
                deck_missed,
                deck_touched,
            ),
        ),
        (False, (deck_touched, deck_touched, deck_missed)),
    ],
)
async def test_take_multiple_strides_success(
    ot3_hardware: ThreadManager[OT3API],
    mock_capacitive_probe: AsyncMock,
    mock_probe_deck: AsyncMock,
    override_cal_config: None,
    mock_move_to: AsyncMock,
    search_axis: OT3Axis,
    size: float,
    in_search_direction: bool,
    probe_results: Tuple[float, float, float],
):
    await ot3_hardware.home()
    mock_capacitive_probe.side_effect = probe_results
    target = Point(0.0, 0.0, 0.0)
    valid_range = DeckHeightValidRange(min=-1.0, max=1.0)

    result = await _take_stride(
        ot3_hardware,
        OT3Mount.LEFT,
        search_axis,
        target,
        size,
        size * 3,
        valid_range,
        in_search_direction,
        True,
    )

    expected_calls = []
    probe_loc = target
    for i, height in enumerate(probe_results):
        probe_loc = search_axis.set_in_point(probe_loc, size * (i + 1))
        expected_calls.append(
            mock_call(
                ot3_hardware,
                OT3Mount.LEFT,
                probe_loc,
                ot3_hardware.config.calibration.edge_sense.pass_settings,
            )
        )
        # every time we touch deck, we update the z
        if height == deck_touched:
            probe_loc = probe_loc._replace(z=height)

    mock_probe_deck.assert_has_calls(expected_calls)
    assert result[0] == probe_loc
    # switch next direction since goal is reached
    assert result[1] == -1
    # goal reached
    assert result[2]


@pytest.mark.parametrize("search_axis", [OT3Axis.X, OT3Axis.Y])
@pytest.mark.parametrize("size", step_size)
@pytest.mark.parametrize(
    "in_search_direction,probe_results",
    [
        (True, (deck_missed, deck_missed, deck_missed)),
        (False, (deck_touched, deck_touched, deck_touched)),
    ],
)
async def test_take_multiple_strides_fail(
    ot3_hardware: ThreadManager[OT3API],
    mock_capacitive_probe: AsyncMock,
    mock_probe_deck: AsyncMock,
    override_cal_config: None,
    mock_move_to: AsyncMock,
    search_axis: OT3Axis,
    size: float,
    in_search_direction: bool,
    probe_results: Tuple[float, float, float],
):
    await ot3_hardware.home()
    mock_capacitive_probe.side_effect = probe_results
    target = Point(0.0, 0.0, 0.0)
    valid_range = DeckHeightValidRange(min=-1.0, max=1.0)

    result = await _take_stride(
        ot3_hardware,
        OT3Mount.LEFT,
        search_axis,
        target,
        size,
        size * 3,
        valid_range,
        in_search_direction,
        True,
    )

    expected_calls = []
    probe_loc = target
    for i, height in enumerate(probe_results):
        probe_loc = search_axis.set_in_point(probe_loc, size * (i + 1))
        expected_calls.append(
            mock_call(
                ot3_hardware,
                OT3Mount.LEFT,
                probe_loc,
                ot3_hardware.config.calibration.edge_sense.pass_settings,
            )
        )
        # every time we touch deck, we update the z
        if height == deck_touched:
            probe_loc = probe_loc._replace(z=height)

    mock_probe_deck.assert_has_calls(expected_calls)
    assert result[0] == probe_loc
    # direction never changes
    assert result[1] == 1
    # goal not reached
    assert not result[2]


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
            Point(0.0, 0.0, 0.0),
            OT3Axis.Y,
            -1,
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
    await find_deck_height(ot3_hardware, mount, target)

    z_prep_loc = target + Z_PREP_OFFSET

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
        "opentrons.hardware_control.ot3_calibration._get_calibration_square_position_in_slot",
        Mock(),
    ) as calibration_target, patch(
        "opentrons.hardware_control.ot3_calibration.find_slot_center_noncontact",
        AsyncMock(spec=find_slot_center_noncontact),
    ) as noncontact, patch(
        "opentrons.hardware_control.ot3_calibration.find_deck_height",
        AsyncMock(spec=find_deck_height),
    ) as find_deck, patch.object(
        ot3_hardware.managed_obj, "reset_instrument_offset", AsyncMock()
    ) as reset_instrument_offset, patch.object(
        ot3_hardware.managed_obj, "save_instrument_offset", AsyncMock()
    ) as save_instrument_offset:
        find_deck.return_value = 10
        calibration_target.return_value = Point(0.0, 0.0, 0.0)
        binary.return_value = Point(1.0, 2.0, 3.0)
        noncontact.return_value = Point(3.0, 4.0, 5.0)
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
    ) as save_instrument_offset:
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
    center = _get_calibration_square_position_in_slot(5)
    with pytest.raises(InaccurateNonContactSweepError):
        await find_axis_center(
            ot3_hardware,
            OT3Mount.RIGHT,
            center + EDGES["left"],
            center + EDGES["right"],
            OT3Axis.X,
        )
