from unittest.mock import patch, call

import pytest
from opentrons import types
from opentrons.hardware_control import API, ThreadManager

from robot_server.robot.calibration.check import session, util
from robot_server.service.errors import RobotServerError


@pytest.fixture
async def check_calibration_session(loop) -> session.CheckCalibrationSession:
    attached_instruments = {
        types.Mount.LEFT: {
            'model': 'p10_single_v1',
            'id': 'fake10pip'
        },
        types.Mount.RIGHT: {
            'model': 'p300_single_v1',
            'id': 'fake300pip'
        }
    }

    simulator = ThreadManager(API.build_hardware_simulator,
                              attached_instruments=attached_instruments)
    return await session.CheckCalibrationSession.build(simulator)


@pytest.fixture
async def check_calibration_session_shared_tips(loop) \
        -> session.CheckCalibrationSession:
    attached_instruments = {
        types.Mount.LEFT: {
            'model': 'p300_multi_v1',
            'id': 'fake300multipip'
        },
        types.Mount.RIGHT: {
            'model': 'p300_single_v1',
            'id': 'fake300pip'
        }
    }

    simulator = ThreadManager(API.build_hardware_simulator,
                              attached_instruments=attached_instruments)
    return await session.CheckCalibrationSession.build(simulator)


@pytest.fixture
async def check_calibration_session_only_right(loop) \
        -> session.CheckCalibrationSession:
    attached_instruments = {
        types.Mount.RIGHT: {
            'model': 'p300_single_v1',
            'id': 'fake300pip'
        }
    }

    simulator = ThreadManager(API.build_hardware_simulator,
                              attached_instruments=attached_instruments)
    return await session.CheckCalibrationSession.build(simulator)


@pytest.fixture
async def check_calibration_session_only_left(loop) \
        -> session.CheckCalibrationSession:
    attached_instruments = {
        types.Mount.LEFT: {
            'model': 'p300_single_v1',
            'id': 'fake300pip'
        }
    }
    simulator = ThreadManager(API.build_hardware_simulator,
                              attached_instruments=attached_instruments)
    return await session.CheckCalibrationSession.build(simulator)


BAD_DIFF_VECTOR = types.Point(30, 30, 30)
OK_DIFF_VECTOR = types.Point(1, 1, 0.3)

# helpers


async def in_labware_loaded(check_calibration_session):
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.load_labware
    )
    return check_calibration_session


async def in_preparing_first_pipette(check_calibration_session):
    check_calibration_session = await in_labware_loaded(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.prepare_pipette,
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.jog,
        types.Point(0, 0, -10)
    )
    return check_calibration_session


async def in_inspecting_first_tip(check_calibration_session):
    check_calibration_session = await in_preparing_first_pipette(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.jog,
        types.Point(0, 0, -0.2)
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.pick_up_tip,
    )
    return check_calibration_session


async def in_jogging_first_pipette_to_height(check_calibration_session):
    check_calibration_session = await in_inspecting_first_tip(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.confirm_tip_attached,
    )
    return check_calibration_session


async def in_comparing_first_pipette_height(check_calibration_session):
    check_calibration_session = await in_jogging_first_pipette_to_height(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.compare_point,
    )
    return check_calibration_session


async def in_jogging_first_pipette_to_point_one(check_calibration_session):
    check_calibration_session = await in_comparing_first_pipette_height(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.go_to_next_check,
    )
    return check_calibration_session


async def in_comparing_first_pipette_point_one(check_calibration_session):
    check_calibration_session = await in_jogging_first_pipette_to_point_one(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.compare_point,
    )
    return check_calibration_session


async def in_jogging_first_pipette_to_point_two(check_calibration_session):
    check_calibration_session = await in_comparing_first_pipette_point_one(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.go_to_next_check,
    )
    return check_calibration_session


async def in_comparing_first_pipette_point_two(check_calibration_session):
    check_calibration_session = await in_jogging_first_pipette_to_point_two(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.compare_point,
    )
    return check_calibration_session


async def in_jogging_first_pipette_to_point_three(check_calibration_session):
    check_calibration_session = await in_comparing_first_pipette_point_two(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.go_to_next_check,
    )
    return check_calibration_session


async def in_comparing_first_pipette_point_three(check_calibration_session):
    check_calibration_session = await in_jogging_first_pipette_to_point_three(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.compare_point,
    )
    return check_calibration_session


async def in_preparing_second_pipette(check_calibration_session):
    check_calibration_session = await in_comparing_first_pipette_point_three(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.go_to_next_check,
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.jog,
        types.Point(0, 0, -10)
    )
    return check_calibration_session


async def in_inspecting_second_tip(check_calibration_session):
    check_calibration_session = await in_preparing_second_pipette(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.jog,
        types.Point(0, 0, -0.3)
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.pick_up_tip,
    )
    return check_calibration_session


async def in_jogging_second_pipette_to_height(check_calibration_session):
    check_calibration_session = await in_inspecting_second_tip(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.confirm_tip_attached,
    )
    return check_calibration_session


async def in_comparing_second_pipette_height(check_calibration_session):
    check_calibration_session = await in_jogging_second_pipette_to_height(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.compare_point,
    )
    return check_calibration_session


async def in_jogging_second_pipette_to_point_one(check_calibration_session):
    check_calibration_session = await in_comparing_second_pipette_height(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.go_to_next_check,
    )
    return check_calibration_session


async def in_comparing_second_pipette_point_one(check_calibration_session):
    check_calibration_session = await in_jogging_second_pipette_to_point_one(
        check_calibration_session
    )
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.compare_point,
    )
    return check_calibration_session

# START misc session attribute tests


def test_session_started(check_calibration_session):
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.sessionStarted


async def test_lights_from_off(check_calibration_session):
    # lights were off before starting session
    assert check_calibration_session._lights_on_before is False
    # lights are on after starting session
    assert check_calibration_session._hardware.get_lights()['rails'] is True
    await check_calibration_session.delete_session()
    # lights should be off after deleting session
    assert check_calibration_session._hardware.get_lights()['rails'] is False


async def test_lights_from_on(check_calibration_session):
    # lights were on before starting session
    check_calibration_session._lights_on_before = True
    # lights were still on after starting session
    assert check_calibration_session._hardware.get_lights()['rails'] is True
    await check_calibration_session.delete_session()
    # lights should still be on after deleting session
    assert check_calibration_session._hardware.get_lights()['rails'] is True


async def test_pick_up_tip_sets_current(check_calibration_session_shared_tips):
    sess = check_calibration_session_shared_tips
    await sess.trigger_transition(
            session.CalibrationCheckTrigger.load_labware)
    path = "opentrons.hardware_control.pipette.Pipette.update_config_item"
    with patch(path) as m:
        await sess._pick_up_tip(types.Mount.LEFT)
        calls = [call('pick_up_current', 0.1), call('pick_up_current', 0.6)]
        assert m.call_args_list == calls


async def test_ensure_safety_removed_for_comparison(
        check_calibration_session, monkeypatch):
    fake_moves_list = []

    async def fake_move(mount, point):
        fake_moves_list.append(point)

    monkeypatch.setattr(check_calibration_session, '_move', fake_move)

    sess = await in_jogging_first_pipette_to_height(check_calibration_session)

    await sess.trigger_transition(
        session.CalibrationCheckTrigger.jog, types.Point(0, 0, -.8))

    await sess.trigger_transition(
        session.CalibrationCheckTrigger.compare_point)

    fake_moves_list.clear()

    await sess.trigger_transition(
        session.CalibrationCheckTrigger.go_to_next_check,
    )

    await sess.trigger_transition(
        session.CalibrationCheckTrigger.compare_point)

    last_point = fake_moves_list[0].point
    # assert that the z value is the same for the last point after
    # removing z buffer and jog move.
    no_jog_and_buffer =\
        last_point + types.Point(0, 0, .8) -\
        types.Point(0, 0, 0.3)
    assert sess._saved_points['joggingFirstPipetteToHeight'].z\
        == no_jog_and_buffer.z


async def test_session_started_to_labware_loaded(check_calibration_session):
    check_calibration_session = await in_labware_loaded(
        check_calibration_session
    )
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.labwareLoaded


async def test_session_started_to_bad_state(check_calibration_session):
    with pytest.raises(util.StateMachineError):
        await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.pick_up_tip
        )


async def test_session_no_pipettes_error():
    simulator = ThreadManager(API.build_hardware_simulator)

    with pytest.raises(RobotServerError) as e:
        await session.CheckCalibrationSession.build(simulator)

    assert e.value.status_code == 403
    assert e.value.error.title == "No Pipette Attached"


async def test_session_started_to_end_state(check_calibration_session):
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.exit
        )
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.sessionExited


async def test_diff_pips_diff_tipracks(check_calibration_session):
    sess = check_calibration_session
    await sess.trigger_transition(
            session.CalibrationCheckTrigger.load_labware)
    assert len(sess._labware_info.keys()) == 2
    for tiprack in sess._labware_info.values():
        assert len(tiprack.forMounts) == 1
    # loads tiprack for right mount in 8
    # and tiprack for left mount in 6
    assert sess._deck['8']
    assert sess._deck['8'].name == 'opentrons_96_tiprack_300ul'
    assert sess._deck['6']
    assert sess._deck['6'].name == 'opentrons_96_tiprack_10ul'


async def test_same_size_pips_share_tiprack(
        check_calibration_session_shared_tips):
    sess = check_calibration_session_shared_tips
    await sess.trigger_transition(
            session.CalibrationCheckTrigger.load_labware)
    assert len(sess._labware_info.keys()) == 1
    assert len(next(iter(sess._labware_info.values())).forMounts) == 2

    # loads tiprack in 8 only
    assert sess._deck['8']
    assert sess._deck['8'].name == 'opentrons_96_tiprack_300ul'
    assert sess._deck['6'] is None

    # z and x values should be the same, but y should be different
    # if accessing different tips (A1, B1) on same tiprack
    assert sess._moves.preparingFirstPipette.position.x == \
        sess._moves.preparingSecondPipette.position.x
    assert sess._moves.preparingFirstPipette.position.z == \
        sess._moves.preparingSecondPipette.position.z
    assert sess._moves.preparingFirstPipette.position.y != \
        sess._moves.preparingSecondPipette.position.y


async def test_jog_pipette(check_calibration_session):
    sess = await in_preparing_first_pipette(check_calibration_session)

    last_pos = await sess.hardware.gantry_position(
            sess._get_pipette_by_rank(session.PipetteRank.first).mount)

    jog_vector_map = {
        'front': types.Point(0, -0.1, 0),
        'back': types.Point(0, 0.1, 0),
        'left': types.Point(-0.1, 0, 0),
        'right': types.Point(0.1, 0, 0),
        'up': types.Point(0, 0, 0.1),
        'down': types.Point(0, 0, -0.1)
    }
    for dir, vector in jog_vector_map.items():
        await sess.trigger_transition(
            session.CalibrationCheckTrigger.jog, vector)
        jog_pos = await sess.hardware.gantry_position(
                sess._get_pipette_by_rank(session.PipetteRank.first).mount)
        assert jog_pos == vector + last_pos
        last_pos = jog_pos


async def test_first_pick_up_tip(check_calibration_session):
    sess = await in_inspecting_first_tip(check_calibration_session)
    first_pip = sess._get_pipette_by_rank(session.PipetteRank.first)
    second_pip = sess._get_pipette_by_rank(session.PipetteRank.second)
    assert sess.pipettes[first_pip.mount]['has_tip'] is True
    assert sess.pipettes[first_pip.mount]['tip_length'] > 0.0
    assert sess.pipettes[second_pip.mount]['has_tip'] is False


async def test_second_pick_up_tip(check_calibration_session):
    sess = await in_inspecting_second_tip(check_calibration_session)
    first_pip = sess._get_pipette_by_rank(session.PipetteRank.first)
    second_pip = sess._get_pipette_by_rank(session.PipetteRank.second)
    assert sess.pipettes[second_pip.mount]['has_tip'] is True
    assert sess.pipettes[second_pip.mount]['tip_length'] > 0.0
    assert sess.pipettes[first_pip.mount]['has_tip'] is False


async def test_invalidate_first_tip(check_calibration_session):
    sess = await in_inspecting_first_tip(check_calibration_session)
    first_pip = sess._get_pipette_by_rank(session.PipetteRank.first)
    assert sess.pipettes[first_pip.mount]['has_tip'] is True
    await sess.trigger_transition(
            session.CalibrationCheckTrigger.invalidate_tip)
    assert sess.current_state.name == \
           session.CalibrationCheckState.preparingFirstPipette
    assert sess.pipettes[first_pip.mount]['has_tip'] is False


async def test_invalidate_second_tip(check_calibration_session):
    sess = await in_inspecting_second_tip(check_calibration_session)
    second_pip = sess._get_pipette_by_rank(session.PipetteRank.second)
    assert sess.pipettes[second_pip.mount]['has_tip'] is True
    await sess.trigger_transition(
            session.CalibrationCheckTrigger.invalidate_tip)
    assert sess.current_state.name == \
           session.CalibrationCheckState.preparingSecondPipette
    assert sess.pipettes[second_pip.mount]['has_tip'] is False


async def test_complete_check_one_pip(check_calibration_session_only_right):
    sess = await in_comparing_first_pipette_point_three(
            check_calibration_session_only_right)
    first_pip = sess._get_pipette_by_rank(session.PipetteRank.first)
    assert sess.pipettes[first_pip.mount]['has_tip'] is True
    await sess.trigger_transition(
            session.CalibrationCheckTrigger.go_to_next_check)
    assert sess.current_state.name == \
           session.CalibrationCheckState.checkComplete


async def test_complete_check_both_pips(check_calibration_session):
    sess = await in_comparing_second_pipette_point_one(
            check_calibration_session)
    second_pip = sess._get_pipette_by_rank(session.PipetteRank.second)
    assert sess.pipettes[second_pip.mount]['has_tip'] is True
    await sess.trigger_transition(
            session.CalibrationCheckTrigger.go_to_next_check)
    assert sess.current_state.name == \
           session.CalibrationCheckState.checkComplete


# START flow testing both mounts


async def test_load_labware_to_preparing_first_pipette(
        check_calibration_session):
    sess = await in_preparing_first_pipette(check_calibration_session)
    tip_pt = sess._moves.preparingFirstPipette.position
    curr_pos = await sess.hardware.gantry_position(
            sess._get_pipette_by_rank(session.PipetteRank.first).mount)
    assert curr_pos == tip_pt - types.Point(0, 0, 10)

    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.preparingFirstPipette
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.preparingFirstPipette


async def test_preparing_first_pipette_to_bad_calibration(
        check_calibration_session):
    check_calibration_session = await in_preparing_first_pipette(
            check_calibration_session)
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, BAD_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.preparingFirstPipette
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.pick_up_tip)
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.confirm_tip_attached)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.badCalibrationData


async def test_preparing_first_pipette_to_inspecting(
        check_calibration_session):
    await in_inspecting_first_tip(check_calibration_session)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.inspectingFirstTip


async def test_inspecting_first_pipette_to_jogging_height(
        check_calibration_session):
    sess = await in_jogging_first_pipette_to_height(check_calibration_session)
    tip_pt = sess._moves.joggingFirstPipetteToHeight.position
    curr_pos = await sess.hardware.gantry_position(
            sess._get_pipette_by_rank(session.PipetteRank.first).mount)
    assert curr_pos == tip_pt
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToHeight
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToHeight


async def test_jogging_first_pipette_height_to_comparing(
        check_calibration_session):
    await in_comparing_first_pipette_height(check_calibration_session)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipetteHeight


async def test_comparing_first_pipette_height_to_jogging_point_one(
        check_calibration_session):
    sess = await in_jogging_first_pipette_to_point_one(
            check_calibration_session)
    tip_pt = sess._moves.joggingFirstPipetteToPointOne.position
    curr_pos = await sess.hardware.gantry_position(
            sess._get_pipette_by_rank(session.PipetteRank.first).mount)
    assert curr_pos == tip_pt + types.Point(0, 0, 5.3)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointOne
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointOne


async def test_jogging_first_pipette_point_one_to_comparing(
        check_calibration_session):
    await in_comparing_first_pipette_point_one(check_calibration_session)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipettePointOne


async def test_comparing_first_pipette_point_one_to_jogging_point_two(
        check_calibration_session):
    sess = await in_jogging_first_pipette_to_point_two(
            check_calibration_session)
    tip_pt = sess._moves.joggingFirstPipetteToPointTwo.position
    curr_pos = await sess.hardware.gantry_position(
            sess._get_pipette_by_rank(session.PipetteRank.first).mount)
    assert curr_pos == tip_pt + types.Point(0, 0, 5.3)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointTwo
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointTwo


async def test_jogging_first_pipette_point_two_to_comparing(
        check_calibration_session):
    await in_comparing_first_pipette_point_two(check_calibration_session)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipettePointTwo


async def test_comparing_first_pipette_point_two_to_jogging_point_three(
        check_calibration_session):
    sess = await in_jogging_first_pipette_to_point_three(
            check_calibration_session)
    tip_pt = sess._moves.joggingFirstPipetteToPointThree.position
    curr_pos = await sess.hardware.gantry_position(
            sess._get_pipette_by_rank(session.PipetteRank.first).mount)
    assert curr_pos == tip_pt + types.Point(0, 0, 5.3)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointThree
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointThree


async def test_jogging_first_pipette_point_three_to_comparing(
        check_calibration_session):
    await in_comparing_first_pipette_point_three(check_calibration_session)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipettePointThree


async def test_load_labware_to_preparing_second_pipette(
        check_calibration_session):
    sess = await in_preparing_second_pipette(check_calibration_session)
    tip_pt = sess._moves.preparingSecondPipette.position
    curr_pos = await sess.hardware.gantry_position(
        sess._get_pipette_by_rank(session.PipetteRank.second).mount)
    assert curr_pos == tip_pt - types.Point(0, 0, 10)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.preparingSecondPipette
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.preparingSecondPipette


async def test_preparing_second_pipette_to_inspecting(
        check_calibration_session):
    await in_inspecting_second_tip(check_calibration_session)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.inspectingSecondTip


async def test_inspecting_second_pipette_to_jogging_height(
        check_calibration_session):
    sess = await in_jogging_second_pipette_to_height(
            check_calibration_session)
    tip_pt = sess._moves.joggingSecondPipetteToHeight.position
    curr_pos = await sess.hardware.gantry_position(
        sess._get_pipette_by_rank(session.PipetteRank.second).mount)
    assert curr_pos == tip_pt
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingSecondPipetteToHeight
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingSecondPipetteToHeight


async def test_jogging_second_pipette_height_to_comparing(
        check_calibration_session):
    await in_comparing_second_pipette_height(check_calibration_session)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.comparingSecondPipetteHeight


async def test_comparing_second_pipette_height_to_jogging_point_one(
        check_calibration_session):
    sess = await in_jogging_second_pipette_to_point_one(
            check_calibration_session)
    tip_pt = sess._moves.joggingSecondPipetteToPointOne.position
    curr_pos = await sess.hardware.gantry_position(
        sess._get_pipette_by_rank(session.PipetteRank.second).mount)
    rounded_pos = types.Point(
        round(curr_pos[0], 2),
        round(curr_pos[1], 2),
        round(curr_pos[2], 2))
    assert rounded_pos == tip_pt + types.Point(0, 0, 5.3)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingSecondPipetteToPointOne
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.joggingSecondPipetteToPointOne


async def test_jogging_second_pipette_point_one_to_comparing(
        check_calibration_session):
    await in_comparing_second_pipette_point_one(check_calibration_session)
    assert check_calibration_session.current_state.name == \
           session.CalibrationCheckState.comparingSecondPipettePointOne


# END flow testing both mounts

# START flow testing right only


async def test_right_load_labware_to_preparing_first_pipette(
        check_calibration_session_only_right):
    await in_preparing_first_pipette(
            check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
           session.CalibrationCheckState.preparingFirstPipette


async def test_right_preparing_first_pipette_to_inspecting(
        check_calibration_session_only_right):
    await in_inspecting_first_tip(
            check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
           session.CalibrationCheckState.inspectingFirstTip


async def test_right_inspecting_first_pipette_to_jogging_height(
        check_calibration_session_only_right):
    await in_jogging_first_pipette_to_height(
            check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToHeight


async def test_right_jogging_first_pipette_height_to_comparing(
        check_calibration_session_only_right):
    await in_comparing_first_pipette_height(
            check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipetteHeight


async def test_right_comparing_first_pipette_height_to_jogging_point_one(
        check_calibration_session_only_right):
    await in_jogging_first_pipette_to_point_one(
            check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointOne


async def test_right_jogging_first_pipette_point_one_to_comparing(
        check_calibration_session_only_right):
    await in_comparing_first_pipette_point_one(
            check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipettePointOne


async def test_right_comparing_first_pipette_point_one_to_jogging_point_two(
        check_calibration_session_only_right):
    await in_jogging_first_pipette_to_point_two(
            check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointTwo


async def test_right_jogging_first_pipette_point_two_to_comparing(
        check_calibration_session_only_right):
    await in_comparing_first_pipette_point_two(
            check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipettePointTwo


async def test_right_comparing_first_pipette_point_two_to_jogging_point_three(
        check_calibration_session_only_right):
    await in_jogging_first_pipette_to_point_three(
            check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointThree


async def test_right_jogging_first_pipette_point_three_to_comparing(
        check_calibration_session_only_right):
    await in_comparing_first_pipette_point_three(
            check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipettePointThree


async def test_right_jogging_first_pipette_point_three_to_complete(
        check_calibration_session_only_right):
    await in_comparing_first_pipette_point_three(
            check_calibration_session_only_right)
    await check_calibration_session_only_right.trigger_transition(
            session.CalibrationCheckTrigger.go_to_next_check)
    assert check_calibration_session_only_right.current_state.name == \
           session.CalibrationCheckState.checkComplete


# END flow testing right only

# START flow testing left only


async def test_left_load_labware_to_preparing_first_pipette(
        check_calibration_session_only_left):
    await in_preparing_first_pipette(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
           session.CalibrationCheckState.preparingFirstPipette


async def test_left_preparing_first_pipette_to_inspecting(
        check_calibration_session_only_left):
    await in_inspecting_first_tip(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
           session.CalibrationCheckState.inspectingFirstTip


async def test_left_inspecting_first_pipette_to_jogging_height(
        check_calibration_session_only_left):
    await in_jogging_first_pipette_to_height(
            check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToHeight


async def test_left_jogging_first_pipette_height_to_comparing(
        check_calibration_session_only_left):
    await in_comparing_first_pipette_height(
            check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipetteHeight


async def test_left_comparing_first_pipette_height_to_jogging_point_one(
        check_calibration_session_only_left):
    await in_jogging_first_pipette_to_point_one(
            check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointOne


async def test_left_jogging_first_pipette_point_one_to_comparing(
        check_calibration_session_only_left):
    await in_comparing_first_pipette_point_one(
            check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipettePointOne


async def test_left_comparing_first_pipette_point_one_to_jogging_point_two(
        check_calibration_session_only_left):
    await in_jogging_first_pipette_to_point_two(
            check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointTwo


async def test_left_jogging_first_pipette_point_two_to_comparing(
        check_calibration_session_only_left):
    await in_comparing_first_pipette_point_two(
            check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipettePointTwo


async def test_left_comparing_first_pipette_point_two_to_jogging_point_three(
        check_calibration_session_only_left):
    await in_jogging_first_pipette_to_point_three(
            check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
           session.CalibrationCheckState.joggingFirstPipetteToPointThree


async def test_left_jogging_first_pipette_point_three_to_comparing(
        check_calibration_session_only_left):
    await in_comparing_first_pipette_point_three(
            check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
           session.CalibrationCheckState.comparingFirstPipettePointThree


async def test_left_jogging_first_pipette_point_three_to_complete(
        check_calibration_session_only_left):
    await in_comparing_first_pipette_point_three(
            check_calibration_session_only_left)
    await check_calibration_session_only_left.trigger_transition(
            session.CalibrationCheckTrigger.go_to_next_check)
    assert check_calibration_session_only_left.current_state.name == \
           session.CalibrationCheckState.checkComplete


# END flow testing left only
