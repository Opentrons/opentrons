import pytest
from unittest.mock import MagicMock, call
from opentrons.types import Mount, Point
from opentrons.hardware_control import pipette
from robot_server.robot.calibration.deck.user_flow import \
    DeckCalibrationUserFlow


@pytest.fixture
def mock_hw(hardware):
    pip = pipette.Pipette("p300_single_v2.1",
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
    pip = pipette.Pipette("p20_multi_v2.1",
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
            mount=Mount.LEFT,
            abs_position=Point(1, 1, 1 - z_offset),
            critical_point=uf._get_critical_point()
        ),
    ]
    uf._hardware.move_to.assert_has_calls(move_calls)
    uf._hardware.drop_tip.assert_called()
