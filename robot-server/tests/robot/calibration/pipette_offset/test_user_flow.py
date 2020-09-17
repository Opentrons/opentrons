import pytest
from unittest.mock import MagicMock, call
from typing import List, Tuple, Dict, Any
from opentrons.calibration_storage import modify, helpers
from opentrons.types import Mount, Point
from opentrons.hardware_control import pipette
from opentrons.config.pipette_config import load

from robot_server.service.errors import RobotServerError
from robot_server.service.session.session_models.command import CalibrationCommand
from robot_server.robot.calibration.pipette_offset.user_flow import \
    PipetteOffsetCalibrationUserFlow

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
    return pipette.Pipette(load(model, 'testId'),
                           {
                               'single': [0, 0, 0],
                               'multi': [0, 0, 0]
                           },
                           'testId')


@pytest.fixture(params=[Mount.RIGHT, Mount.LEFT])
def mock_hw_all_combos(hardware, mock_hw_pipette_all_combos, request):
    mount = request.param
    hardware._attached_instruments = {mount: mock_hw_pipette_all_combos}
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

    hardware.move_rel = MagicMock(side_effect=async_mock)
    hardware.pick_up_tip = MagicMock(side_effect=async_mock)
    hardware.drop_tip = MagicMock(side_effect=async_mock)
    hardware.gantry_position = MagicMock(side_effect=gantry_pos_mock)
    hardware.move_to = MagicMock(side_effect=async_mock_move_to)
    hardware.get_instrument_max_height.return_value = 180
    return hardware


@pytest.fixture
def mock_hw(hardware):
    pip = pipette.Pipette(load("p300_single_v2.1", 'testId'),
                          {
                              'single': [0, 0, 0],
                              'multi': [0, 0, 0]
                          },
                          'testId')
    hardware._attached_instruments = {Mount.RIGHT: pip}
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
    mount = next(k for k, v in
                 mock_hw._attached_instruments.items() if v)
    m = PipetteOffsetCalibrationUserFlow(hardware=mock_hw, mount=mount)

    yield m


hw_commands: List[Tuple[str, str, Dict[Any, Any], str]] = [
    (CalibrationCommand.jog, 'preparingPipette', stub_jog_data, 'move_rel'),
    (CalibrationCommand.pick_up_tip, 'preparingPipette', {}, 'pick_up_tip'),
    (CalibrationCommand.move_to_deck, 'inspectingTip', {}, 'move_to'),
    (CalibrationCommand.move_to_point_one, 'joggingToDeck', {}, 'move_to'),
    (CalibrationCommand.move_to_tip_rack, 'labwareLoaded', {}, 'move_to'),
]


async def test_move_to_tip_rack(mock_user_flow):
    uf = mock_user_flow
    await uf.move_to_tip_rack()
    cur_pt = await uf._get_current_point(None)
    assert cur_pt == uf._deck['8'].wells()[0].top().point + Point(0, 0, 10)


async def test_jog(mock_user_flow):
    uf = mock_user_flow
    await uf.jog(vector=(0, 0, 0.1))
    assert await uf._get_current_point(None) == Point(0, 0, 0.1)
    await uf.jog(vector=(1, 0, 0))
    assert await uf._get_current_point(None) == Point(1, 0, 0.1)


async def test_pick_up_tip(mock_user_flow):
    uf = mock_user_flow
    assert uf._tip_origin_pt is None
    await uf.pick_up_tip()
    # check that it saves the tip pick up location locally
    assert uf._tip_origin_pt == Point(0, 0, 0)


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


@pytest.mark.parametrize('command,current_state,data,hw_meth', hw_commands)
async def test_hw_calls(command, current_state, data, hw_meth, mock_user_flow):
    mock_user_flow._current_state = current_state
    # z height reference must be present for moving to point one
    if command == CalibrationCommand.move_to_point_one:
        mock_user_flow._z_height_reference = 0.1
    await mock_user_flow.handle_command(command, data)

    getattr(mock_user_flow._hardware, hw_meth).assert_called()


def test_load_trash(mock_user_flow):
    assert mock_user_flow._deck['12'].load_name == \
        'opentrons_1_trash_1100ml_fixed'


def test_load_deck(mock_user_flow):
    uf = mock_user_flow
    pip_model = uf._hw_pipette.model
    tip_rack = pipette_map[pip_model]
    assert uf._deck['8'].load_name == tip_rack


@pytest.mark.parametrize(argnames="mount",
                         argvalues=[Mount.RIGHT, Mount.LEFT])
def test_no_pipette(hardware, mount):
    hardware._attached_instruments = {mount: None}
    with pytest.raises(RobotServerError) as error:
        PipetteOffsetCalibrationUserFlow(hardware=hardware,
                                         mount=mount)

    assert error.value.error.detail == f"No pipette present on {mount} mount"


async def test_save_pipette_calibration(mock_user_flow):
    uf = mock_user_flow

    def mock_save_pipette_offset(*args, **kwargs):
        pass

    modify.save_pipette_calibration = \
        MagicMock(side_effect=mock_save_pipette_offset)

    uf._current_state = 'savingPointOne'
    await uf._hardware.move_to(
            mount=uf._mount,
            abs_position=Point(x=10, y=10, z=40),
            critical_point=uf._get_critical_point_override()
        )

    await uf.save_offset()
    tiprack_hash = helpers.hash_labware_def(uf._tip_rack._definition)

    modify.save_pipette_calibration.assert_called_with(
        offset=Point(x=10, y=10, z=40),
        mount=uf._mount,
        pip_id=uf._hw_pipette.pipette_id,
        tiprack_hash=tiprack_hash,
        tiprack_uri=uf._tip_rack.uri
    )
