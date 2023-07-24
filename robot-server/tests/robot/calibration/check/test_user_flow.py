from typing import List, Tuple
from mock import call, MagicMock, patch

import pytest
import datetime
from pathlib import Path
from opentrons.hardware_control.instruments.ot2 import pipette
from opentrons.types import Mount, Point
from opentrons import calibration_storage
from opentrons.config import robot_configs
from opentrons_shared_data.pipette import (
    mutable_configurations,
    pipette_load_name_conversions as pipette_load_name,
)

from robot_server.robot.calibration.check import user_flow as check_flow
from robot_server.robot.calibration.check.user_flow import CheckCalibrationUserFlow
from robot_server.robot.calibration.check.constants import CalibrationCheckState
from robot_server.robot.calibration.check.models import (
    ComparisonStatus,
    PipetteOffsetComparisonMap,
    DeckComparisonMap,
    TipComparisonMap,
)
from robot_server.service.errors import RobotServerError
from robot_server.robot.calibration.constants import (
    POINT_ONE_ID,
    POINT_TWO_ID,
    POINT_THREE_ID,
)


PIP_OFFSET = calibration_storage.models.v1.InstrumentOffsetModel(
    offset=robot_configs.defaults_ot2.DEFAULT_PIPETTE_OFFSET,
    tiprack="some_tiprack",
    uri="custom/some_tiprack/1",
    source=calibration_storage.types.SourceType.user,
    last_modified=datetime.datetime.now(),
)

fake_path = Path("fake/path")


@pytest.fixture
def mock_hw(hardware):
    pipette_model = pipette_load_name.convert_pipette_model("p300_single_v2.1")
    configurations = mutable_configurations.load_with_mutable_configurations(
        pipette_model, fake_path, "testiId"
    )
    pip = pipette.Pipette(configurations, PIP_OFFSET, "testId")
    hardware.hardware_instruments = {Mount.RIGHT: pip, Mount.LEFT: pip}
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


pipette_combos: List[Tuple[List[str], Mount]] = [
    (["p20_multi_v2.1", "p20_multi_v2.1"], Mount.RIGHT),
    (["p20_single_v2.1", "p20_multi_v2.1"], Mount.LEFT),
    (["p20_multi_v2.1", "p300_single_v2.1"], Mount.RIGHT),
    (["p300_multi_v2.1", "p1000_single_v2.1"], Mount.RIGHT),
    (["p1000_single_v2.1", ""], Mount.LEFT),
    (["", "p300_multi_v2.1"], Mount.RIGHT),
]


@pytest.mark.parametrize("pipettes,target_mount", pipette_combos)
def test_user_flow_select_pipette(pipettes, target_mount, hardware):
    pip, pip2 = None, None
    if pipettes[0]:
        pip1_model = pipette_load_name.convert_pipette_model(pipettes[0])
        pip1_configurations = mutable_configurations.load_with_mutable_configurations(
            pip1_model, fake_path, "testId"
        )
        pip = pipette.Pipette(pip1_configurations, PIP_OFFSET, "testId")
    if pipettes[1]:
        pip2_model = pipette_load_name.convert_pipette_model(pipettes[1])
        pip2_configurations = mutable_configurations.load_with_mutable_configurations(
            pip2_model, fake_path, "testId"
        )
        pip2 = pipette.Pipette(pip2_configurations, PIP_OFFSET, "testId2")
    hardware.hardware_instruments = {Mount.LEFT: pip, Mount.RIGHT: pip2}
    # load a labware with calibrations
    with patch.object(
        check_flow,
        "get_robot_deck_attitude",
        new=build_mock_deck_calibration(),
    ), patch.object(
        check_flow,
        "load_tip_length_calibration",
        new=build_mock_stored_tip_length(),
    ), patch.object(
        check_flow,
        "get_pipette_offset",
        new=build_mock_stored_pipette_offset(),
    ):
        uf = CheckCalibrationUserFlow(hardware=hardware)
        assert uf.hw_pipette == hardware.hardware_instruments[target_mount]


@pytest.mark.parametrize("pipettes,target_mount", pipette_combos)
async def test_switching_to_second_pipette(pipettes, target_mount, hardware):
    pip, pip2 = None, None
    if pipettes[0]:
        pip1_model = pipette_load_name.convert_pipette_model(pipettes[0])
        pip1_configurations = mutable_configurations.load_with_mutable_configurations(
            pip1_model, fake_path, "testId"
        )
        pip = pipette.Pipette(pip1_configurations, PIP_OFFSET, "testId")
    if pipettes[1]:
        pip2_model = pipette_load_name.convert_pipette_model(pipettes[1])
        pip2_configurations = mutable_configurations.load_with_mutable_configurations(
            pip2_model, fake_path, "testId"
        )
        pip2 = pipette.Pipette(pip2_configurations, PIP_OFFSET, "testId2")
    hardware.hardware_instruments = {Mount.LEFT: pip, Mount.RIGHT: pip2}
    # load a labware with calibrations
    with patch.object(
        check_flow,
        "get_robot_deck_attitude",
        new=build_mock_deck_calibration(),
    ), patch.object(
        check_flow,
        "load_tip_length_calibration",
        new=build_mock_stored_tip_length(),
    ), patch.object(
        check_flow,
        "get_pipette_offset",
        new=build_mock_stored_pipette_offset(),
    ):
        uf = CheckCalibrationUserFlow(hardware=hardware)
        if pip and pip2:
            assert uf.mount == target_mount
            await uf.change_active_pipette()
            assert uf.mount != target_mount
        else:
            with pytest.raises(RobotServerError):
                await uf.change_active_pipette()


def build_mock_stored_pipette_offset(kind="normal"):
    if kind == "normal":
        return MagicMock(
            return_value=calibration_storage.models.v1.InstrumentOffsetModel(
                offset=[0, 1, 2],
                tiprack="tiprack-id",
                uri="opentrons/opentrons_96_filtertiprack_200ul/1",
                source=calibration_storage.types.SourceType.user,
                last_modified=datetime.datetime.now(),
            )
        )
    elif kind == "custom_tiprack":
        return MagicMock(
            return_value=calibration_storage.models.v1.InstrumentOffsetModel(
                offset=[0, 1, 2],
                tiprack="tiprack-id",
                uri="custom/minimal_labware_def/1",
                source=calibration_storage.types.SourceType.user,
                last_modified=datetime.datetime.now(),
            )
        )
    else:
        return MagicMock(return_value=None)


def build_mock_stored_tip_length(kind="normal"):
    if kind == "normal":
        tip_length = calibration_storage.models.v1.TipLengthCalibration(
            tipLength=30,
            pipette="fake id",
            tiprack="fake_hash",
            lastModified=datetime.datetime.now(),
            source=calibration_storage.types.SourceType.user,
            uri="path/to_my_labware/1",
        )
        return MagicMock(return_value=tip_length)
    elif kind == "custom_tiprack":
        tip_length = calibration_storage.models.v1.TipLengthCalibration(
            tipLength=30,
            pipette="fake id",
            tiprack="fake_hash",
            lastModified=datetime.datetime.now(),
            source=calibration_storage.types.SourceType.user,
            uri="custom/minimal_labware_def/1",
        )
        return MagicMock(return_value=tip_length)
    else:
        return MagicMock(return_value=None)


def build_mock_deck_calibration(kind="normal"):
    if kind == "normal":
        attitude = [[1.0008, 0.0052, 0.0], [-0.1, 0.9, 0.0], [0.0, 0.0, 1.0]]
        return MagicMock(
            return_value=calibration_storage.models.v1.DeckCalibrationModel(
                attitude=attitude,
                source=calibration_storage.types.SourceType.user,
                last_modified=datetime.datetime.now(),
            )
        )
    elif kind == "identity":
        return MagicMock(
            return_value=calibration_storage.models.v1.DeckCalibrationModel(
                attitude=robot_configs.defaults_ot2.DEFAULT_DECK_CALIBRATION_V2,
                source=calibration_storage.types.SourceType.user,
                last_modified=None,
            )
        )
    else:
        return MagicMock(return_value=None)


def test_load_labware(mock_hw):
    # load a labware with calibrations
    with patch.object(
        check_flow,
        "get_robot_deck_attitude",
        new=build_mock_deck_calibration(),
    ), patch.object(
        check_flow,
        "load_tip_length_calibration",
        new=build_mock_stored_tip_length(),
    ), patch.object(
        check_flow,
        "get_pipette_offset",
        new=build_mock_stored_pipette_offset(),
    ):
        uf = CheckCalibrationUserFlow(hardware=mock_hw, has_calibration_block=True)
        assert (
            uf.active_tiprack._core.get_display_name()
            == "Opentrons 96 Filter Tip Rack 200 µL on 8"
        )
        assert len(uf.get_required_labware()) == 2


def test_load_custom_tiprack(mock_hw, custom_tiprack_def, clear_custom_tiprack_def_dir):
    # save custom tiprack definition to custom tiprack directory
    calibration_storage._save_custom_tiprack_definition(
        "custom/minimal_labware_def/1", custom_tiprack_def
    )
    # load a labware with calibrations
    with patch.object(
        check_flow,
        "get_robot_deck_attitude",
        new=build_mock_deck_calibration(),
    ), patch.object(
        check_flow,
        "load_tip_length_calibration",
        new=build_mock_stored_tip_length("custom_tiprack"),
    ), patch.object(
        check_flow,
        "get_pipette_offset",
        new=build_mock_stored_pipette_offset("custom_tiprack"),
    ):
        uf = CheckCalibrationUserFlow(hardware=mock_hw, has_calibration_block=True)
        assert uf.active_tiprack._core.get_display_name() == "minimal labware on 8"
        assert len(uf.get_required_labware()) == 2


def test_bad_calibration(mock_hw):
    with pytest.raises(RobotServerError):
        CheckCalibrationUserFlow(hardware=mock_hw)

    with pytest.raises(RobotServerError):
        with patch.object(
            check_flow,
            "get_robot_deck_attitude",
            new=build_mock_deck_calibration("identity"),
        ), patch.object(
            check_flow,
            "load_tip_length_calibration",
            new=build_mock_stored_tip_length(),
        ), patch.object(
            check_flow,
            "get_pipette_offset",
            new=build_mock_stored_pipette_offset(),
        ):
            CheckCalibrationUserFlow(hardware=mock_hw)


@pytest.fixture
def mock_user_flow(mock_hw):
    with patch.object(
        check_flow,
        "get_robot_deck_attitude",
        new=build_mock_deck_calibration(),
    ), patch.object(
        check_flow,
        "load_tip_length_calibration",
        new=build_mock_stored_tip_length(),
    ), patch.object(
        check_flow,
        "get_pipette_offset",
        new=build_mock_stored_pipette_offset(),
    ):
        m = CheckCalibrationUserFlow(hardware=mock_hw)
        initial_pt = Point(1, 1, 5)
        final_pt = Point(1, 1, 5)
        m._get_reference_points_by_state = MagicMock(
            return_value=(initial_pt, final_pt)
        )
        yield m


@pytest.fixture
def mock_user_flow_bad_vectors(mock_hw):
    with patch.object(
        check_flow,
        "get_robot_deck_attitude",
        new=build_mock_deck_calibration(),
    ), patch.object(
        check_flow,
        "load_tip_length_calibration",
        new=build_mock_stored_tip_length(),
    ), patch.object(
        check_flow,
        "get_pipette_offset",
        new=build_mock_stored_pipette_offset(),
    ):
        m = CheckCalibrationUserFlow(hardware=mock_hw)
        initial_pt = Point(1, 6, 5)
        final_pt = Point(1, 1, 0)
        m._get_reference_points_by_state = MagicMock(
            return_value=(initial_pt, final_pt)
        )
        yield m


async def test_move_to_tip_rack(mock_user_flow):
    uf = mock_user_flow
    await uf.move_to_tip_rack()
    cur_pt = await uf.get_current_point(None)
    assert cur_pt == uf.active_tiprack.wells()[0].top().point + Point(0, 0, 10)


async def test_pick_up_tip(mock_user_flow):
    uf = mock_user_flow
    assert uf._tip_origin_pt is None
    await uf.move_to_tip_rack()
    cur_pt = await uf.get_current_point(None)
    await uf.jog(vector=(0, 0, 1))
    await uf.pick_up_tip()
    assert uf._tip_origin_pt == cur_pt + Point(0, 0, 1)


async def test_return_tip(mock_user_flow):
    uf = mock_user_flow
    uf._tip_origin_pt = Point(1, 1, 1)
    uf.hw_pipette._has_tip = True
    z_offset = (
        uf.hw_pipette.active_tip_settings.default_return_tip_height
        * uf._get_tip_length()
    )
    await uf.return_tip()
    # should move to return tip
    move_calls = [
        call(
            mount=Mount.RIGHT,
            abs_position=Point(1, 1, 1 - z_offset),
            critical_point=uf.critical_point_override,
        ),
    ]
    uf._hardware.move_to.assert_has_calls(move_calls)
    uf._hardware.drop_tip.assert_called()


async def test_jog(mock_user_flow):
    uf = mock_user_flow
    await uf.jog(vector=(0, 0, 0.1))
    assert await uf.get_current_point(None) == Point(0, 0, 0.1)
    await uf.jog(vector=(1, 0, 0))
    assert await uf.get_current_point(None) == Point(1, 0, 0.1)


@pytest.mark.parametrize(
    "state,point_id",
    [
        (CalibrationCheckState.comparingHeight, POINT_ONE_ID),
        (CalibrationCheckState.comparingPointOne, POINT_TWO_ID),
        (CalibrationCheckState.comparingPointTwo, POINT_THREE_ID),
    ],
)
async def test_get_move_to_cal_point_location(mock_user_flow, state, point_id):
    uf = mock_user_flow
    uf._z_height_reference = 30

    pt_list = uf._deck.get_calibration_position(point_id).position
    exp = Point(pt_list[0], pt_list[1], 30)

    uf._current_state = state
    assert uf._get_move_to_point_loc_by_state().point == exp


async def test_compare_z_height(mock_user_flow):
    uf = mock_user_flow
    uf._current_state = CalibrationCheckState.comparingTip
    await uf._hardware.move_to(
        mount=uf.mount,
        abs_position=Point(x=10, y=10, z=10),
        critical_point=uf.hw_pipette.critical_point,
    )
    await uf.update_comparison_map()
    # The initial and final mocked points have a 5 mm
    # difference and so it should exceed the threshold
    expected_status = ComparisonStatus(
        differenceVector=(0.0, 0.0, 0.0),
        thresholdVector=(0.0, 0.0, 1.0),
        exceedsThreshold=False,
    )
    expected_tip_length = TipComparisonMap(
        status="IN_THRESHOLD", comparingTip=expected_status
    )
    assert uf.comparison_map.first.tipLength == expected_tip_length
    assert uf.comparison_map.second.tipLength is None


async def test_compare_points(mock_user_flow):
    uf = mock_user_flow
    uf._current_state = CalibrationCheckState.comparingHeight
    await uf.update_comparison_map()

    uf._current_state = CalibrationCheckState.comparingPointOne

    expected_status = ComparisonStatus(
        differenceVector=(0.0, 0.0, 0.0),
        thresholdVector=(1.8, 1.8, 0.0),
        exceedsThreshold=False,
    )
    height_status = ComparisonStatus(
        differenceVector=(0.0, 0.0, 0.0),
        thresholdVector=(0.0, 0.0, 0.8),
        exceedsThreshold=False,
    )
    all_status = "IN_THRESHOLD"
    expected_pip = PipetteOffsetComparisonMap(
        status=all_status,
        comparingHeight=height_status,
        comparingPointOne=expected_status,
    )
    expected_deck = DeckComparisonMap(
        status=all_status, comparingPointOne=expected_status
    )
    await uf._hardware.move_to(
        mount=uf.mount,
        abs_position=Point(x=10, y=10, z=10),
        critical_point=uf.hw_pipette.critical_point,
    )
    await uf.update_comparison_map()

    assert uf.comparison_map.first.pipetteOffset == expected_pip
    assert uf.comparison_map.first.deck is None
    assert uf.comparison_map.second.pipetteOffset is None
    assert uf.comparison_map.second.deck is None

    uf._current_state = CalibrationCheckState.comparingPointTwo
    await uf._hardware.move_to(
        mount=uf.mount,
        abs_position=Point(x=10, y=10, z=10),
        critical_point=uf.hw_pipette.critical_point,
    )
    await uf.update_comparison_map()
    expected_deck.comparingPointTwo = expected_status
    assert uf.comparison_map.first.pipetteOffset == expected_pip
    assert uf.comparison_map.first.deck is None
    assert uf.comparison_map.second.pipetteOffset is None
    assert uf.comparison_map.second.deck is None

    uf._current_state = CalibrationCheckState.comparingPointThree
    await uf._hardware.move_to(
        mount=uf.mount,
        abs_position=Point(x=10, y=10, z=10),
        critical_point=uf.hw_pipette.critical_point,
    )
    await uf.update_comparison_map()
    expected_deck.comparingPointThree = expected_status
    assert uf.comparison_map.first.pipetteOffset == expected_pip
    assert uf.comparison_map.first.deck is None
    assert uf.comparison_map.second.pipetteOffset is None
    assert uf.comparison_map.second.deck is None

    await uf.change_active_pipette()

    uf._current_state = CalibrationCheckState.comparingHeight
    await uf.update_comparison_map()

    uf._current_state = CalibrationCheckState.comparingPointOne
    await uf.update_comparison_map()

    new_pip = PipetteOffsetComparisonMap(
        status=all_status,
        comparingHeight=height_status,
        comparingPointOne=expected_status,
    )
    new_deck = DeckComparisonMap(status=all_status, comparingPointOne=expected_status)

    assert uf.comparison_map.first.pipetteOffset == expected_pip
    assert uf.comparison_map.first.deck is None
    assert uf.comparison_map.second.pipetteOffset == new_pip
    assert uf.comparison_map.second.deck == new_deck


async def test_mark_bad_calibration(mock_user_flow_bad_vectors):
    uf = mock_user_flow_bad_vectors
    cal_store = "opentrons.calibration_storage"
    user_flow_path = "robot_server.robot.calibration.check.user_flow"

    with patch(f"{cal_store}.mark_bad_calibration.mark_bad") as m, patch(
        f"{user_flow_path}.create_tip_length_data"
    ), patch(f"{user_flow_path}.save_tip_length_calibration"), patch(
        f"{user_flow_path}.save_pipette_calibration"
    ), patch(
        f"{user_flow_path}.save_robot_deck_attitude"
    ):
        uf._current_state = CalibrationCheckState.comparingTip
        await uf.update_comparison_map()
        expected_tip_length_call = [
            uf._tip_lengths[uf.mount],
            calibration_storage.types.SourceType.calibration_check,
        ]
        m.assert_called_once_with(*expected_tip_length_call)
        m.reset_mock()

        uf._current_state = CalibrationCheckState.comparingHeight

        await uf.update_comparison_map()
        expected_pip_offset_call = (
            uf._pipette_calibrations[uf.mount],
            calibration_storage.types.SourceType.calibration_check,
        )
        m.assert_called_once_with(*expected_pip_offset_call)
        m.reset_mock()

        await uf.change_active_pipette()

        uf._current_state = CalibrationCheckState.comparingHeight
        await uf.update_comparison_map()

        uf._current_state = CalibrationCheckState.comparingPointOne
        await uf.update_comparison_map()
        m.reset_mock()

        uf._current_state = CalibrationCheckState.comparingPointTwo
        await uf.update_comparison_map()

        expected_deck_cal_call = [
            uf._deck_calibration,
            calibration_storage.types.SourceType.calibration_check,
        ]

        m.assert_called_once_with(*expected_deck_cal_call)
