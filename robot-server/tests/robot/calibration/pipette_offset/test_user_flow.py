import datetime
import os
import pytest
from mock import MagicMock, call, patch
from typing import List, Tuple, Dict, Any
from opentrons import config
from pathlib import Path
from opentrons_shared_data.pipette import (
    mutable_configurations,
    pipette_load_name_conversions as pipette_load_name,
)
from opentrons.calibration_storage import helpers, types as CSTypes, models
from opentrons.types import Mount, Point
from opentrons.hardware_control.instruments.ot2 import pipette
from opentrons.protocol_api import labware

from opentrons_shared_data.labware import load_definition

from robot_server.service.errors import RobotServerError
from robot_server.service.session.models.command_definitions import CalibrationCommand
from robot_server.robot.calibration.pipette_offset.user_flow import (
    PipetteOffsetCalibrationUserFlow,
)
from robot_server.robot.calibration.pipette_offset.constants import (
    PipetteOffsetCalibrationState as POCState,
    PipetteOffsetWithTipLengthCalibrationState as POWTState,
)


stub_jog_data = {"vector": Point(1, 1, 1)}

PIP_CAL = models.v1.InstrumentOffsetModel(
    offset=[0, 0, 0],
    tiprack="some_tiprack",
    uri="custom/some_tiprack/1",
    source=CSTypes.SourceType.user,
    last_modified=datetime.datetime.now(),
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


def build_mock_stored_pipette_offset(kind="normal"):
    if kind == "normal":
        return MagicMock(
            return_value=models.v1.InstrumentOffsetModel(
                offset=[0, 1, 2],
                tiprack="tiprack-id",
                uri="opentrons/opentrons_96_filtertiprack_200ul/1",
                last_modified=datetime.datetime.now(),
                source=CSTypes.SourceType.user,
            )
        )
    elif kind == "empty":
        return MagicMock(return_value=None)
    else:
        assert False, "specify normal or empty to build_mock_stored_pipette_offset"


def build_mock_stored_tip_length(kind="normal"):
    if kind == "normal":
        return MagicMock(return_value=30)
    elif kind == "empty":
        return MagicMock(return_value=None)
    else:
        assert False, "specify normal or empty to build_mock_stored_tip_length"


LW_DEFINITION = load_definition("opentrons_96_filtertiprack_200ul", 1)
LW_DEFINITION["version"] = 2


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
    pip = pipette.Pipette(
        configurations,  # type: ignore[arg-type]
        PIP_CAL,
        "testId",
    )
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

    hardware.move_rel.side_effect = async_mock_move_rel
    hardware.gantry_position.side_effect = gantry_pos_mock
    hardware.move_to.side_effect = async_mock_move_to
    hardware.get_instrument_max_height.return_value = 180
    return hardware


@pytest.fixture
def mock_user_flow(mock_hw):
    mount = next(k for k, v in mock_hw.hardware_instruments.items() if v)
    with patch.object(
        PipetteOffsetCalibrationUserFlow,
        "_get_stored_tip_length_cal",
        new=build_mock_stored_tip_length(),
    ), patch.object(
        PipetteOffsetCalibrationUserFlow,
        "_get_stored_pipette_offset_cal",
        new=build_mock_stored_pipette_offset(),
    ):
        m = PipetteOffsetCalibrationUserFlow(hardware=mock_hw, mount=mount)
        yield m


@pytest.fixture
def mock_user_flow_fused(mock_hw):
    mount = next(k for k, v in mock_hw.hardware_instruments.items() if v)
    with patch.object(
        PipetteOffsetCalibrationUserFlow,
        "_get_stored_tip_length_cal",
        new=build_mock_stored_tip_length(),
    ), patch.object(
        PipetteOffsetCalibrationUserFlow,
        "_get_stored_pipette_offset_cal",
        new=build_mock_stored_pipette_offset(),
    ):
        m = PipetteOffsetCalibrationUserFlow(
            hardware=mock_hw, mount=mount, recalibrate_tip_length=True
        )
        yield m


hw_commands: List[Tuple[str, str, Dict[Any, Any], str]] = [
    (CalibrationCommand.jog, POCState.preparingPipette, stub_jog_data, "move_rel"),
    (CalibrationCommand.pick_up_tip, POCState.preparingPipette, {}, "pick_up_tip"),
    (CalibrationCommand.move_to_deck, POCState.inspectingTip, {}, "move_to"),
    (CalibrationCommand.move_to_point_one, POCState.joggingToDeck, {}, "move_to"),
    (CalibrationCommand.move_to_tip_rack, POCState.labwareLoaded, {}, "move_to"),
    (CalibrationCommand.invalidate_last_action, POCState.preparingPipette, {}, "home"),
    (
        CalibrationCommand.invalidate_last_action,
        POCState.preparingPipette,
        {},
        "move_to",
    ),
    (CalibrationCommand.invalidate_last_action, POCState.joggingToDeck, {}, "move_to"),
    (CalibrationCommand.invalidate_last_action, POCState.joggingToDeck, {}, "home"),
    (CalibrationCommand.invalidate_last_action, POCState.joggingToDeck, {}, "drop_tip"),
    (CalibrationCommand.invalidate_last_action, POCState.savingPointOne, {}, "move_to"),
    (CalibrationCommand.invalidate_last_action, POCState.savingPointOne, {}, "home"),
    (
        CalibrationCommand.invalidate_last_action,
        POCState.savingPointOne,
        {},
        "drop_tip",
    ),
]

hw_commands_fused: List[Tuple[str, str, Dict[Any, Any], str]] = [
    (
        CalibrationCommand.invalidate_last_action,
        POWTState.measuringNozzleOffset,
        {},
        "home",
    ),
    (
        CalibrationCommand.invalidate_last_action,
        POWTState.measuringNozzleOffset,
        {},
        "move_to",
    ),
    (CalibrationCommand.invalidate_last_action, POWTState.preparingPipette, {}, "home"),
    (
        CalibrationCommand.invalidate_last_action,
        POWTState.preparingPipette,
        {},
        "move_to",
    ),
    (
        CalibrationCommand.invalidate_last_action,
        POWTState.measuringTipOffset,
        {},
        "move_to",
    ),
    (
        CalibrationCommand.invalidate_last_action,
        POWTState.measuringTipOffset,
        {},
        "home",
    ),
    (
        CalibrationCommand.invalidate_last_action,
        POWTState.measuringTipOffset,
        {},
        "drop_tip",
    ),
    (CalibrationCommand.invalidate_last_action, POWTState.joggingToDeck, {}, "move_to"),
    (CalibrationCommand.invalidate_last_action, POWTState.joggingToDeck, {}, "home"),
    (
        CalibrationCommand.invalidate_last_action,
        POWTState.joggingToDeck,
        {},
        "drop_tip",
    ),
    (
        CalibrationCommand.invalidate_last_action,
        POWTState.savingPointOne,
        {},
        "move_to",
    ),
    (CalibrationCommand.invalidate_last_action, POWTState.savingPointOne, {}, "home"),
    (
        CalibrationCommand.invalidate_last_action,
        POWTState.savingPointOne,
        {},
        "drop_tip",
    ),
]


@pytest.mark.parametrize(
    "existing_poc,existing_tlc,recalibrate,trd,whichdef,dotip," "hasblock,useblock",
    [
        # If we otherwise have everything we need, follow the argument
        (
            build_mock_stored_pipette_offset(),
            build_mock_stored_tip_length(),
            True,
            None,
            "stored",
            True,
            True,
            True,
        ),
        (
            build_mock_stored_pipette_offset(),
            build_mock_stored_tip_length(),
            True,
            None,
            "stored",
            True,
            False,
            False,
        ),
        (
            build_mock_stored_pipette_offset(),
            build_mock_stored_tip_length(),
            False,
            None,
            "stored",
            False,
            True,
            False,
        ),
        (
            build_mock_stored_pipette_offset("empty"),
            build_mock_stored_tip_length(),
            False,
            LW_DEFINITION,
            "specified",
            False,
            True,
            False,
        ),
        (
            build_mock_stored_pipette_offset("empty"),
            build_mock_stored_tip_length(),
            True,
            LW_DEFINITION,
            "specified",
            True,
            True,
            True,
        ),
        (
            build_mock_stored_pipette_offset("empty"),
            build_mock_stored_tip_length(),
            True,
            LW_DEFINITION,
            "specified",
            True,
            False,
            False,
        ),
        (
            build_mock_stored_pipette_offset("empty"),
            build_mock_stored_tip_length(),
            True,
            None,
            "default",
            True,
            True,
            True,
        ),
        (
            build_mock_stored_pipette_offset("empty"),
            build_mock_stored_tip_length(),
            True,
            None,
            "default",
            True,
            False,
            False,
        ),
        # In all cases where we cannot resolve a TLC for this
        # labware, recalibrate tip length
        (
            build_mock_stored_pipette_offset("empty"),
            build_mock_stored_tip_length("empty"),
            False,
            LW_DEFINITION,
            "specified",
            True,
            True,
            True,
        ),
        (
            build_mock_stored_pipette_offset("empty"),
            build_mock_stored_tip_length("empty"),
            False,
            LW_DEFINITION,
            "specified",
            True,
            False,
            False,
        ),
        (
            build_mock_stored_pipette_offset("empty"),
            build_mock_stored_tip_length("empty"),
            False,
            None,
            "default",
            True,
            True,
            True,
        ),
        (
            build_mock_stored_pipette_offset("empty"),
            build_mock_stored_tip_length("empty"),
            False,
            None,
            "default",
            True,
            False,
            False,
        ),
    ],
)
def test_create_params(
    mock_hw,
    existing_poc,
    existing_tlc,
    recalibrate,
    trd,
    whichdef,
    dotip,
    hasblock,
    useblock,
):
    with patch.object(
        PipetteOffsetCalibrationUserFlow, "_get_stored_tip_length_cal", new=existing_tlc
    ), patch.object(
        PipetteOffsetCalibrationUserFlow,
        "_get_stored_pipette_offset_cal",
        new=existing_poc,
    ):
        m = PipetteOffsetCalibrationUserFlow(
            hardware=mock_hw,
            mount=Mount.RIGHT,
            recalibrate_tip_length=recalibrate,
            tip_rack_def=trd,
            has_calibration_block=hasblock,
        )
        assert m.should_perform_tip_length == dotip
        tiprack = next(lw for lw in m.get_required_labware() if lw.isTiprack)
        if whichdef == "stored":
            assert tiprack.loadName == "opentrons_96_filtertiprack_200ul"
            assert tiprack.version == "1"
        elif whichdef == "default":
            assert tiprack.loadName == "opentrons_96_tiprack_300ul"
        elif whichdef == "specified":
            assert tiprack.loadName == "opentrons_96_filtertiprack_200ul"
            assert tiprack.version == "2"
        else:
            assert False, "you messed up the param spec"
        assert m._has_calibration_block == useblock
        assert (
            any("calibration" in lw.loadName for lw in m.get_required_labware() if lw)
            == useblock
        )


async def test_move_to_tip_rack(mock_user_flow):
    uf = mock_user_flow
    await uf.move_to_tip_rack()
    cur_pt = await uf.get_current_point(None)
    assert cur_pt == uf._deck["8"].wells()[0].top().point + Point(0, 0, 10)


async def test_jog(mock_user_flow):
    uf = mock_user_flow
    await uf.jog(vector=(0, 0, 0.1))
    assert await uf.get_current_point(None) == Point(0, 0, 0.1)
    await uf.jog(vector=(1, 0, 0))
    assert await uf.get_current_point(None) == Point(1, 0, 0.1)


async def test_pick_up_tip(mock_user_flow):
    uf = mock_user_flow
    await uf.pick_up_tip()
    # check that it saves the tip pick up location locally
    assert uf._tip_origin_pt == Point(0, 0, 0)


async def test_return_tip(mock_user_flow):
    uf = mock_user_flow
    uf._tip_origin_pt = Point(1, 1, 1)
    uf._hw_pipette._has_tip = True
    z_offset = (
        uf._hw_pipette.active_tip_settings.default_return_tip_height
        * uf._get_tip_length()
    )
    await uf.return_tip()
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
    mock_user_flow._sm.set_state(current_state)
    # z height reference must be present for moving to point one
    if command == CalibrationCommand.move_to_point_one:
        mock_user_flow._z_height_reference = 0.1
    await mock_user_flow.handle_command(command, data)

    getattr(mock_user_flow._hardware, hw_meth).assert_called()


@pytest.mark.parametrize("command,current_state,data,hw_meth", hw_commands_fused)
async def test_hw_calls_fused(
    command, current_state, data, hw_meth, mock_user_flow_fused
):
    mock_user_flow_fused._sm.set_state(current_state)
    # z height reference must be present for moving to point one
    if command == CalibrationCommand.move_to_point_one:
        mock_user_flow_fused._z_height_reference = 0.1
    await mock_user_flow_fused.handle_command(command, data)

    getattr(mock_user_flow_fused._hardware, hw_meth).assert_called()


def test_load_trash(mock_user_flow):
    assert mock_user_flow._deck["12"].load_name == "opentrons_1_trash_1100ml_fixed"


async def test_load_labware(mock_user_flow, monkeypatch):
    old_tiprack = mock_user_flow._tip_rack
    assert mock_user_flow.should_perform_tip_length is False
    new_def = labware.get_labware_definition(
        load_name="opentrons_96_tiprack_300ul", namespace="opentrons", version=1
    )
    fake_tip_length = MagicMock(return_value=None)
    monkeypatch.setattr(mock_user_flow, "_get_stored_tip_length_cal", fake_tip_length)
    await mock_user_flow.load_labware(new_def)
    assert mock_user_flow._tip_rack.uri == "opentrons/opentrons_96_tiprack_300ul/1"
    assert mock_user_flow._tip_rack != old_tiprack
    # We should explicitly not change whether to perform tip length
    # as that will be decided by the client.
    assert mock_user_flow.should_perform_tip_length is False


@pytest.mark.parametrize(argnames="mount", argvalues=[Mount.RIGHT, Mount.LEFT])
def test_no_pipette(hardware, mount):
    hardware.hardware_instruments = {mount: None}
    with pytest.raises(RobotServerError) as error:
        PipetteOffsetCalibrationUserFlow(hardware=hardware, mount=mount)

    assert error.value.content["errors"][0]["detail"] == (
        f"No pipette present on {mount} mount"
    )


@pytest.fixture
def mock_save_pipette():
    with patch(
        "robot_server.robot.calibration.pipette_offset.user_flow.save_pipette_calibration",
        autospec=True,
    ) as mock_save:
        yield mock_save


@pytest.fixture
def mock_delete_pipette():
    with patch(
        "robot_server.robot.calibration.pipette_offset.user_flow.delete_pipette_offset_file",
        autospec=True,
    ) as mock_delete:
        yield mock_delete


@pytest.fixture
def mock_save_tip_length():
    with patch(
        "robot_server.robot.calibration.util.save_tip_length_calibration",
        autospec=True,
    ) as mock_save:
        yield mock_save


async def test_save_tip_length(
    mock_user_flow_fused, mock_save_tip_length, mock_delete_pipette
):
    uf = mock_user_flow_fused
    uf._sm.set_state(uf._sm.state.measuringTipOffset)
    uf._nozzle_height_at_reference = 10
    uf._hw_pipette.add_tip(50)
    await uf._hardware.move_to(
        mount=uf._mount,
        abs_position=Point(x=10, y=10, z=40),
        critical_point=uf.critical_point_override,
    )
    await uf.save_offset()
    mock_save_tip_length.assert_called_with(
        pipette_id=uf._hw_pipette.pipette_id,
        tip_length_offset=30,
        tip_rack=uf._tip_rack,
    )
    mock_delete_pipette.assert_called_with(uf._hw_pipette.pipette_id, uf.mount)


async def test_save_custom_tiprack_def(
    mock_user_flow_fused, custom_tiprack_def, clear_custom_tiprack_def_dir
):

    uf = mock_user_flow_fused
    uf._load_tip_rack(custom_tiprack_def, uf._get_stored_pipette_offset_cal())
    uf._sm.set_state(uf._sm.state.measuringTipOffset)
    uf._nozzle_height_at_reference = 10
    uf._hw_pipette.add_tip(50)
    await uf._hardware.move_to(
        mount=uf._mount,
        abs_position=Point(x=10, y=10, z=40),
        critical_point=uf.critical_point_override,
    )

    assert not os.path.exists(
        config.get_custom_tiprack_def_path() / "custom/minimal_labware_def/1.json"
    )
    await uf.save_offset()
    assert os.path.exists(
        config.get_custom_tiprack_def_path() / "custom/minimal_labware_def/1.json"
    )


async def test_save_pipette_calibration(mock_user_flow, mock_save_pipette):
    uf = mock_user_flow

    uf._sm.set_state(uf._sm.state.savingPointOne)
    await uf._hardware.move_to(
        mount=uf._mount,
        abs_position=Point(x=10, y=10, z=40),
        critical_point=uf.critical_point_override,
    )

    await uf.save_offset()
    tiprack_hash = helpers.hash_labware_def(uf._tip_rack._core.get_definition())
    offset = uf._cal_ref_point - Point(x=10, y=10, z=40)
    mock_save_pipette.assert_called_with(
        offset=offset,
        mount=uf._mount,
        pip_id=uf._hw_pipette.pipette_id,
        tiprack_hash=tiprack_hash,
        tiprack_uri=uf._tip_rack.uri,
    )
