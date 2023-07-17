import os
import pytest
from mock import ANY, patch, call
from typing import List, Tuple, Dict, Any
from opentrons import config
from pathlib import Path
from opentrons_shared_data.pipette import (
    mutable_configurations,
    pipette_load_name_conversions as pipette_load_name,
)
from opentrons.types import Mount, Point
from opentrons.hardware_control.instruments.ot2 import pipette
from opentrons.protocol_api.labware import get_labware_definition
from opentrons.util.helpers import utc_now
from opentrons.calibration_storage import types as cal_types, models

from robot_server.service.errors import RobotServerError
from robot_server.service.session.models.command_definitions import CalibrationCommand
from robot_server.robot.calibration.tip_length.user_flow import TipCalibrationUserFlow

stub_jog_data = {"vector": Point(1, 1, 1)}

PIP_CAL = models.v1.InstrumentOffsetModel(
    offset=[0, 0, 0],
    tiprack="some_tiprack",
    uri="custom/some_tiprack/1",
    source=cal_types.SourceType.user,
    last_modified=utc_now(),
)

fake_path = Path("fake/path")

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
    pipette_model = pipette_load_name.convert_pipette_model(request.param)
    configurations = mutable_configurations.load_with_mutable_configurations(
        pipette_model, fake_path, "testId"
    )
    return pipette.Pipette(configurations, PIP_CAL, "testId")


@pytest.fixture(params=[Mount.RIGHT, Mount.LEFT])
def mock_hw_all_combos(hardware, mock_hw_pipette_all_combos, request):
    mount = request.param
    hardware.hardware_instruments = {mount: mock_hw_pipette_all_combos}
    hardware._current_pos = Point(0, 0, 0)

    async def async_mock_move_to(*args, **kwargs):
        to_pt = kwargs.get("abs_position", Point(0, 0, 0))
        hardware._current_pos = to_pt

    async def gantry_pos_mock(*args, **kwargs):
        return hardware._current_pos

    hardware.gantry_position.side_effect = gantry_pos_mock
    hardware.move_to.side_effect = async_mock_move_to
    hardware.get_instrument_max_height.return_value = 180
    return hardware


@pytest.fixture
def mock_hw(hardware):
    pipette_model = pipette_load_name.convert_pipette_model("p300_single_v2.1")
    configurations = mutable_configurations.load_with_mutable_configurations(
        pipette_model, fake_path, "testId"
    )
    pip = pipette.Pipette(configurations, PIP_CAL, "testId")
    hardware.hardware_instruments = {Mount.RIGHT: pip}
    hardware._current_pos = Point(0, 0, 0)

    async def async_mock_move_rel(*args, **kwargs):
        delta = kwargs.get("delta", Point(0, 0, 0))
        hardware._current_pos += delta

    async def async_mock_move_to(*args, **kwargs):
        to_pt = kwargs.get("abs_position", Point(0, 0, 0))
        hardware._current_pos = to_pt

    async def gantry_pos_mock(*args, **kwargs):
        return hardware._current_pos

    async def async_mock_home_plunger(*args, **kwargs):
        pass

    hardware.move_rel.side_effect = async_mock_move_rel
    hardware.gantry_position.side_effect = gantry_pos_mock
    hardware.move_to.side_effect = async_mock_move_to
    hardware.get_instrument_max_height.return_value = 180
    hardware.home_plunger.side_effect = async_mock_home_plunger
    return hardware


@pytest.fixture(params=[True, False])
def mock_user_flow(mock_hw, request):
    has_calibration_block = request.param
    mount = next(k for k, v in mock_hw.hardware_instruments.items() if v)
    pip_model = mock_hw.hardware_instruments[mount].model
    tip_rack = get_labware_definition(pipette_map[pip_model], "opentrons", "1")
    m = TipCalibrationUserFlow(
        hardware=mock_hw,
        mount=mount,
        has_calibration_block=has_calibration_block,
        tip_rack=tip_rack,
    )

    yield m


@pytest.fixture(params=[True, False])
def mock_user_flow_with_custom_tiprack(mock_hw, custom_tiprack_def, request):
    has_calibration_block = request.param
    mount = next(k for k, v in mock_hw.hardware_instruments.items() if v)
    m = TipCalibrationUserFlow(
        hardware=mock_hw,
        mount=mount,
        has_calibration_block=has_calibration_block,
        tip_rack=custom_tiprack_def,
    )

    yield m


@pytest.fixture(params=[True, False])
def mock_user_flow_with_default_tiprack(mock_hw, request):
    has_calibration_block = request.param
    mount = next(k for k, v in mock_hw.hardware_instruments.items() if v)
    m = TipCalibrationUserFlow(
        hardware=mock_hw,
        mount=mount,
        has_calibration_block=has_calibration_block,
    )

    yield m


@pytest.fixture(params=[True, False])
def mock_user_flow_all_combos(mock_hw_all_combos, request):
    has_calibration_block = request.param
    hw = mock_hw_all_combos
    mount = next(k for k, v in hw.hardware_instruments.items() if v)
    pip_model = hw.hardware_instruments[mount].model
    tip_rack = get_labware_definition(pipette_map[pip_model], "opentrons", "1")
    m = TipCalibrationUserFlow(
        hardware=hw,
        mount=mount,
        has_calibration_block=has_calibration_block,
        tip_rack=tip_rack,
    )

    yield m


hw_commands: List[Tuple[str, str, Dict[Any, Any], str]] = [
    (CalibrationCommand.jog, "measuringNozzleOffset", stub_jog_data, "move_rel"),
    (CalibrationCommand.pick_up_tip, "preparingPipette", {}, "pick_up_tip"),
    (CalibrationCommand.move_to_reference_point, "labwareLoaded", {}, "move_to"),
    (CalibrationCommand.move_to_reference_point, "inspectingTip", {}, "move_to"),
    (CalibrationCommand.move_to_tip_rack, "measuringNozzleOffset", {}, "move_to"),
    (CalibrationCommand.move_to_tip_rack, "measuringTipOffset", {}, "move_to"),
    (CalibrationCommand.invalidate_last_action, "preparingPipette", {}, "home"),
    (CalibrationCommand.invalidate_last_action, "preparingPipette", {}, "move_to"),
    (CalibrationCommand.invalidate_last_action, "measuringTipOffset", {}, "home"),
    (CalibrationCommand.invalidate_last_action, "measuringTipOffset", {}, "drop_tip"),
    (CalibrationCommand.invalidate_last_action, "measuringTipOffset", {}, "move_to"),
    (CalibrationCommand.invalidate_last_action, "measuringNozzleOffset", {}, "home"),
    (CalibrationCommand.invalidate_last_action, "measuringNozzleOffset", {}, "move_to"),
]


async def test_move_to_tip_rack(mock_user_flow):
    uf = mock_user_flow
    await uf.move_to_tip_rack()
    cur_pt = await uf.get_current_point(None)
    assert cur_pt == uf._deck["8"].wells()[0].top().point + Point(0, 0, 10)


async def test_move_to_reference_point(mock_user_flow_all_combos):
    uf = mock_user_flow_all_combos
    await uf.move_to_reference_point()
    buff = Point(0, 0, 5)
    trash_offset = Point(-57.84, -55, 0)  # offset from center of trash
    cur_pt = await uf.get_current_point(None)
    if uf._has_calibration_block:
        if uf._mount == Mount.LEFT:
            assert cur_pt == uf._deck["3"].wells_by_name()["A1"].top().point + buff
        else:
            assert cur_pt == uf._deck["1"].wells_by_name()["A2"].top().point + buff
    else:
        assert (
            cur_pt
            == uf._deck.get_fixed_trash().wells_by_name()["A1"].top().point
            + trash_offset
            + buff
        )


async def test_jog(mock_user_flow):
    uf = mock_user_flow
    await uf.jog(vector=(0, 0, 0.1))
    assert await uf.get_current_point(None) == Point(0, 0, 0.1)
    await uf.jog(vector=(1, 0, 0))
    assert await uf.get_current_point(None) == Point(1, 0, 0.1)


async def test_pick_up_tip(mock_user_flow):
    uf = mock_user_flow
    assert uf._tip_origin_pt is None
    await uf.pick_up_tip()
    # check that it saves the tip pick up location locally
    assert uf._tip_origin_pt == Point(0, 0, 0)


async def test_invalidate_tip(mock_user_flow):
    uf = mock_user_flow
    uf._tip_origin_pt = Point(1, 1, 1)
    uf._hw_pipette._has_tip = True
    z_offset = (
        uf._hw_pipette.active_tip_settings.default_return_tip_height
        * uf._get_default_tip_length()
    )
    await uf.invalidate_tip()
    # should move to return tip
    move_calls = [
        call(
            mount=Mount.RIGHT,
            abs_position=Point(1, 1, 1 - z_offset),
            critical_point=uf.critical_point_override,
        )
    ]
    uf._hardware.move_to.assert_has_calls(move_calls)
    uf._hardware.drop_tip.assert_called()


async def test_exit(mock_user_flow):
    uf = mock_user_flow
    uf._tip_origin_pt = Point(1, 1, 1)
    uf._hw_pipette._has_tip = True
    z_offset = (
        uf._hw_pipette.active_tip_settings.default_return_tip_height
        * uf._get_default_tip_length()
    )
    await uf.invalidate_tip()
    # should move to return tip
    move_calls = [
        call(
            mount=Mount.RIGHT,
            abs_position=Point(1, 1, 1 - z_offset),
            critical_point=uf.critical_point_override,
        )
    ]
    uf._hardware.move_to.assert_has_calls(move_calls)
    uf._hardware.drop_tip.assert_called()


@pytest.mark.parametrize("command,current_state,data,hw_meth", hw_commands)
async def test_hw_calls(command, current_state, data, hw_meth, mock_user_flow):
    mock_user_flow._current_state = current_state
    await mock_user_flow.handle_command(command, data)

    getattr(mock_user_flow._hardware, hw_meth).assert_called()


def test_load_trash(mock_user_flow):
    assert mock_user_flow._deck["12"].load_name == "opentrons_1_trash_1100ml_fixed"


def test_load_deck(mock_user_flow_all_combos):
    uf = mock_user_flow_all_combos
    pip_model = uf._hw_pipette.model
    tip_rack = pipette_map[pip_model]
    assert uf._deck["8"].load_name == tip_rack


def test_load_cal_block(mock_user_flow_all_combos):
    uf = mock_user_flow_all_combos
    if uf._has_calibration_block:
        if uf._mount == Mount.RIGHT:
            assert (
                uf._deck["1"].load_name == "opentrons_calibrationblock_short_side_left"
            )
            assert uf._deck["3"] is None
        else:
            assert (
                uf._deck["3"].load_name == "opentrons_calibrationblock_short_side_right"
            )
            assert uf._deck["1"] is None
    else:
        assert uf._deck["1"] is None
        assert uf._deck["3"] is None


async def test_get_reference_location(mock_user_flow_all_combos):
    uf = mock_user_flow_all_combos
    await uf.move_to_reference_point()
    cur_pt = await uf.get_current_point(None)
    if uf._has_calibration_block:
        if uf._mount == Mount.LEFT:
            exp = uf._deck["3"].wells()[0].top().move(Point(0, 0, 5))
        else:
            exp = uf._deck["1"].wells()[1].top().move(Point(0, 0, 5))
    else:
        exp = uf._deck.get_fixed_trash().wells()[0].top().move(Point(-57.84, -55, 5))
    assert cur_pt == exp.point


async def test_save_offsets(mock_user_flow):
    with patch(
        "robot_server.robot.calibration.util.save_tip_length_calibration"
    ) as create_tip_length_data_patch:
        uf = mock_user_flow
        uf._current_state = "measuringNozzleOffset"
        assert uf._nozzle_height_at_reference is None
        await uf._hardware.move_to(
            mount=uf._mount,
            abs_position=Point(x=10, y=10, z=10),
            critical_point=uf.critical_point_override,
        )
        await uf.save_offset()
        assert uf._nozzle_height_at_reference == 10

        uf._current_state = "measuringTipOffset"
        uf._hw_pipette._has_tip = True
        await uf._hardware.move_to(
            mount=uf._mount,
            abs_position=Point(x=10, y=10, z=40),
            critical_point=uf.critical_point_override,
        )
        await uf.save_offset()
        create_tip_length_data_patch.assert_called_with(
            pipette_id="testId", tip_length_offset=30, tip_rack=ANY
        )


async def test_save_custom_tiprack_def(
    mock_user_flow_with_custom_tiprack, clear_custom_tiprack_def_dir
):
    uf = mock_user_flow_with_custom_tiprack
    uf._current_state = "measuringTipOffset"
    uf._hw_pipette._has_tip = True
    uf._nozzle_height_at_reference = 0

    assert not os.path.exists(
        config.get_custom_tiprack_def_path() / "custom/minimal_labware_def/1.json"
    )

    await uf.save_offset()
    assert os.path.exists(
        config.get_custom_tiprack_def_path() / "custom/minimal_labware_def/1.json"
    )


async def test_default_tiprack_def(mock_user_flow_with_default_tiprack):
    uf = mock_user_flow_with_default_tiprack

    assert uf._tip_rack.load_name == "opentrons_96_tiprack_300ul"


@pytest.mark.parametrize(argnames="mount", argvalues=[Mount.RIGHT, Mount.LEFT])
def test_no_pipette(hardware, mount):
    hardware.hardware_instruments = {mount: None}
    with pytest.raises(RobotServerError) as error:
        TipCalibrationUserFlow(
            hardware=hardware, mount=mount, has_calibration_block=None, tip_rack=None
        )

    assert error.value.content["errors"][0]["detail"] == (
        f"No pipette present on {mount} mount"
    )
