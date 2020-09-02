import pytest
from unittest.mock import MagicMock, call
from typing import List, Tuple
from opentrons.types import Mount, Point
from opentrons.hardware_control import pipette
from opentrons.config.pipette_config import load
from robot_server.robot.calibration.deck.user_flow import \
    DeckCalibrationUserFlow, tuplefy_cal_point_dicts
from robot_server.robot.calibration.deck.constants import \
    POINT_ONE_ID, POINT_TWO_ID, POINT_THREE_ID, DeckCalibrationState


@pytest.fixture
def mock_hw(hardware):
    pip = pipette.Pipette(load("p300_single_v2.1", 'testiId'),
                          {
                              'single': [0, 0, 0],
                              'multi': [0, 0, 0]
                          },
                          'testId')
    hardware._attached_instruments = {Mount.RIGHT: pip, Mount.LEFT: pip}
    hardware._current_pos = Point(0, 0, 0)

    async def async_mock(*args, **kwargs):
        pass

    async def async_mock_move_rel(*args, **kwargs):
        delta = kwargs.get('delta', Point(0, 0, 0))
        hardware._current_pos += delta

    async def async_mock_move_to(*args, **kwargs):
        to_pt = kwargs.get('abs_position', Point(0, 0, 0))
        hardware._current_pos = to_pt

    async def gantry_pos_mock(*args, **kwargs):
        return hardware._current_pos

    hardware.move_rel = MagicMock(side_effect=async_mock_move_rel)
    hardware.pick_up_tip = MagicMock(side_effect=async_mock)
    hardware.drop_tip = MagicMock(side_effect=async_mock)
    hardware.gantry_position = MagicMock(side_effect=gantry_pos_mock)
    hardware.move_to = MagicMock(side_effect=async_mock_move_to)
    hardware.get_instrument_max_height.return_value = 180
    return hardware


pipette_combos: List[Tuple[List[str], Mount]] = [
    (['p20_multi_v2.1', 'p20_multi_v2.1'], Mount.RIGHT),
    (['p20_single_v2.1', 'p20_multi_v2.1'], Mount.LEFT),
    (['p20_multi_v2.1', 'p300_single_v2.1'], Mount.LEFT),
    (['p300_multi_v2.1', 'p1000_single_v2.1'], Mount.LEFT),
    (['p1000_single_v2.1', ''], Mount.LEFT),
    (['', 'p300_multi_v2.1'], Mount.RIGHT)
]


@pytest.mark.parametrize('pipettes,target_mount', pipette_combos)
def test_user_flow_select_pipette(pipettes, target_mount, hardware):
    pip, pip2 = None, None
    if pipettes[0]:
        pip = pipette.Pipette(load(pipettes[0], 'testId'),
                              {'single': [0, 0, 0], 'multi': [0, 0, 0]},
                              'testId')
    if pipettes[1]:
        pip2 = pipette.Pipette(load(pipettes[1], 'testId'),
                               {'single': [0, 0, 0], 'multi': [0, 0, 0]},
                               'testId2')
    hardware._attached_instruments = {Mount.LEFT: pip, Mount.RIGHT: pip2}

    uf = DeckCalibrationUserFlow(hardware=hardware)
    assert uf._hw_pipette == \
        hardware._attached_instruments[target_mount]


@pytest.fixture
def mock_user_flow(mock_hw):
    m = DeckCalibrationUserFlow(hardware=mock_hw)
    yield m


async def test_move_to_tip_rack(mock_user_flow):
    uf = mock_user_flow
    await uf.move_to_tip_rack()
    cur_pt = await uf._get_current_point()
    assert cur_pt == uf._tip_rack.wells()[0].top().point + Point(0, 0, 10)


async def test_pick_up_tip(mock_user_flow):
    uf = mock_user_flow
    assert uf._tip_origin_pt is None
    await uf.move_to_tip_rack()
    cur_pt = await uf._get_current_point()
    await uf.pick_up_tip()
    assert uf._tip_origin_pt == cur_pt


async def test_save_default_pick_up_current(mock_hw):
    # make sure pick up current for multi-channels is
    # modified during tip pick up
    pip = pipette.Pipette(load("p20_multi_v2.1", 'testId'),
                          {'single': [0, 0, 0], 'multi': [0, 0, 0]},
                          'testid')
    mock_hw._attached_instruments[Mount.LEFT] = pip
    uf = DeckCalibrationUserFlow(hardware=mock_hw)

    def mock_update_config_item(*args, **kwargs):
        pass

    uf._hw_pipette.update_config_item = MagicMock(
        side_effect=mock_update_config_item)
    default_current = pip.config.pick_up_current
    update_config_calls = [
        call('pick_up_current', 0.1),
        call('pick_up_current', default_current)]
    await uf.pick_up_tip()
    uf._hw_pipette.update_config_item.assert_has_calls(update_config_calls)


async def test_return_tip(mock_user_flow):
    uf = mock_user_flow
    uf._tip_origin_pt = Point(1, 1, 1)
    uf._hw_pipette._has_tip = True
    z_offset = uf._hw_pipette.config.return_tip_height * \
        uf._get_tip_length()
    await uf._return_tip()
    # should move to return tip
    move_calls = [
        call(
            mount=Mount.RIGHT,
            abs_position=Point(1, 1, 1 - z_offset),
            critical_point=uf._get_critical_point_override()
        ),
    ]
    uf._hardware.move_to.assert_has_calls(move_calls)
    uf._hardware.drop_tip.assert_called()


async def test_jog(mock_user_flow):
    uf = mock_user_flow
    await uf.jog(vector=(0, 0, 0.1))
    assert await uf._get_current_point() == Point(0, 0, 0.1)
    await uf.jog(vector=(1, 0, 0))
    assert await uf._get_current_point() == Point(1, 0, 0.1)


@pytest.mark.parametrize(
    "state,point_id", [
        (DeckCalibrationState.joggingToDeck, POINT_ONE_ID),
        (DeckCalibrationState.savingPointOne, POINT_TWO_ID),
        (DeckCalibrationState.savingPointTwo, POINT_THREE_ID)])
async def test_get_move_to_cal_point_location(mock_user_flow,
                                              state, point_id):
    uf = mock_user_flow
    uf._z_height_reference = 30

    pt_list = uf._deck.get_calibration_position(point_id).position
    exp = Point(pt_list[0], pt_list[1], 30)

    uf._current_state = state
    assert uf._get_move_to_point_loc_by_state().point == exp


async def test_save_z_height(mock_user_flow):
    uf = mock_user_flow
    uf._current_state = DeckCalibrationState.joggingToDeck
    assert uf._z_height_reference is None

    await uf._hardware.move_to(
            mount=uf._mount,
            abs_position=Point(x=10, y=10, z=10),
            critical_point=uf._hw_pipette.critical_point
        )
    await uf.save_offset()
    assert uf._z_height_reference == 10


@pytest.mark.parametrize(
    "state,point_id", [
        (DeckCalibrationState.savingPointOne, POINT_ONE_ID),
        (DeckCalibrationState.savingPointTwo, POINT_TWO_ID),
        (DeckCalibrationState.savingPointThree, POINT_THREE_ID)])
async def test_save_cal_point_offsets(mock_user_flow, state, point_id):
    uf = mock_user_flow

    def mock_save_attitude_matrix(*args, **kwargs):
        pass

    uf._save_attitude_matrix = mock_save_attitude_matrix
    uf._current_state = state
    await uf._hardware.move_to(
            mount=uf._mount,
            abs_position=Point(x=10, y=10, z=10),
            critical_point=uf._hw_pipette.critical_point
        )

    assert state not in uf._saved_points
    await uf.save_offset()
    assert uf._saved_points[point_id] == Point(10, 10, 10)


def test_tuplefy_cal_point_dicts():
    saved_points = {
        '1BLC': Point(1, 1, 3),
        '3BRC': Point(2, 2, 2),
        '7TLC': Point(1, 2, 1)}

    a = tuplefy_cal_point_dicts(saved_points)
    assert a == ((1, 1, 3), (2, 2, 2), (1, 2, 1))
