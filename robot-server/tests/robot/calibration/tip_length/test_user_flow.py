import pytest
from unittest.mock import MagicMock
from typing import List, Tuple, Dict, Any
from opentrons.types import Mount, Point
from opentrons.hardware_control import pipette
from robot_server.service.session.models import CalibrationCommand
from robot_server.robot.calibration.tip_length.user_flow import \
    TipCalibrationUserFlow

stub_jog_data = {'vector': Point(1, 1, 1)}

pipette_map = {
    "p10_single_v1.5": "opentrons_96_tiprack_10ul",
    "p50_single_v1.5": "opentrons_96_tiprack_300ul",
    "p300_single_v1.5": "opentrons_96_tiprack_300ul",
    "p1000_single_v1.5": "opentrons_96_tiprack_1000ul",
    "p10_multi_v1.5": "opentrons_96_tiprack_10ul",
    "p50_multi_v1.5": "opentrons_96_tiprack_300ul",
    "p300_multi_v1.5": "opentrons_96_tiprack_300ul",
    "p20_single_v2.1": "opentrons_96_tiprack_20ul",
    "p300_single_v2.1": "opentrons_96_tiprack_300ul",
    "p1000_single_v2.1": "opentrons_96_tiprack_1000ul",
    "p20_multi_v2.1": "opentrons_96_tiprack_20ul",
    "p300_multi_v2.1": "opentrons_96_tiprack_300ul",
}


@pytest.fixture(params=pipette_map.keys())
def mock_hw_pipette_all_combos(request):
    model = request.param
    return pipette.Pipette(model,
                           {
                               'single': [0, 0, 0],
                               'multi': [0, 0, 0]
                           },
                           'testId')


@pytest.fixture(params=[Mount.RIGHT, Mount.LEFT])
def mock_hw_all_combos(hardware, mock_hw_pipette_all_combos, request):
    mount = request.param
    hardware._attached_instruments = {mount: mock_hw_pipette_all_combos}

    async def async_mock(*args, **kwargs):
        pass

    async def gantry_pos_mock(*args, **kwargs):
        return Point(0, 0, 0)

    hardware.move_rel = MagicMock(side_effect=async_mock)
    hardware.pick_up_tip = MagicMock(side_effect=async_mock)
    hardware.drop_tip = MagicMock(side_effect=async_mock)
    hardware.gantry_position = MagicMock(side_effect=gantry_pos_mock)
    hardware.move_to = MagicMock(side_effect=async_mock)
    hardware.get_instrument_max_height.return_value = 180
    return hardware


@pytest.fixture
def mock_hw(hardware):
    pip = pipette.Pipette("p300_single_v2.1",
                          {
                              'single': [0, 0, 0],
                              'multi': [0, 0, 0]
                          },
                          'testId')
    hardware._attached_instruments = {Mount.RIGHT: pip}

    async def async_mock(*args, **kwargs):
        pass

    async def gantry_pos_mock(*args, **kwargs):
        return Point(0, 0, 0)

    hardware.move_rel = MagicMock(side_effect=async_mock)
    hardware.pick_up_tip = MagicMock(side_effect=async_mock)
    hardware.drop_tip = MagicMock(side_effect=async_mock)
    hardware.gantry_position = MagicMock(side_effect=gantry_pos_mock)
    hardware.move_to = MagicMock(side_effect=async_mock)
    hardware.get_instrument_max_height.return_value = 180
    return hardware


@pytest.fixture(params=[True, False])
def mock_user_flow(mock_hw, request):
    has_calibration_block = request.param
    m = TipCalibrationUserFlow(
        hardware=mock_hw,
        mount=next(k for k, v in
                   mock_hw._attached_instruments.items() if v),
        has_calibration_block=has_calibration_block)

    yield m


@pytest.fixture(params=[True, False])
def mock_user_flow_all_combos(mock_hw_all_combos, request):
    has_calibration_block = request.param
    hw = mock_hw_all_combos
    m = TipCalibrationUserFlow(
        hardware=hw,
        mount=next(k for k, v in
                   hw._attached_instruments.items() if v),
        has_calibration_block=has_calibration_block)

    yield m


hw_commands: List[Tuple[str, str, Dict[Any, Any], str]] = [
    (CalibrationCommand.jog, 'measuringNozzleOffset',
     stub_jog_data, 'move_rel'),
    (CalibrationCommand.pick_up_tip, 'preparingPipette', {}, 'pick_up_tip'),
]

# TODO: unit test each command


@pytest.mark.parametrize('command,current_state,data,hw_meth', hw_commands)
async def test_hw_calls(command, current_state, data, hw_meth, mock_user_flow):
    mock_user_flow._current_state = current_state
    await mock_user_flow.handle_command(command, data)

    getattr(mock_user_flow._hardware, hw_meth).assert_called()


def test_load_trash(mock_user_flow):
    assert mock_user_flow._deck['12'].load_name == \
            'opentrons_1_trash_1100ml_fixed'


def test_load_deck(mock_user_flow_all_combos):
    uf = mock_user_flow_all_combos
    pip_model = uf._hw_pipette.model
    tip_rack = pipette_map[pip_model]
    assert uf._deck['8'].load_name == tip_rack


def test_load_cal_block(mock_user_flow_all_combos):
    uf = mock_user_flow_all_combos
    if uf._mount == Mount.RIGHT:
        assert uf._deck['1'].load_name == \
                'opentrons_calibrationblock_short_side_left'
    else:
        assert uf._deck['3'].load_name == \
                'opentrons_calibrationblock_short_side_right'
