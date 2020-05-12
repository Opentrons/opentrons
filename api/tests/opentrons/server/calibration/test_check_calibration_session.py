import asyncio

import pytest
from opentrons import types

from opentrons.server.endpoints.calibration import session
from opentrons.server.endpoints.calibration import util


@pytest.fixture
def check_calibration_session(hardware) -> session.CheckCalibrationSession:
    hw = hardware._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p10_single_v1', 'id': 'fake10pip'}
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}
    asyncio.get_event_loop().run_until_complete(
        session.CheckCalibrationSession.build(hardware)
    )
    return session.CheckCalibrationSession(hardware)


@pytest.fixture
def check_calibration_session_shared_tips(hardware) \
        -> session.CheckCalibrationSession:
    hw = hardware._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p300_multi_v1', 'id': 'fake300multipip'}
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}
    asyncio.get_event_loop().run_until_complete(
        session.CheckCalibrationSession.build(hardware)
    )
    return session.CheckCalibrationSession(hardware)


@pytest.fixture
def check_calibration_session_only_right(hardware) \
        -> session.CheckCalibrationSession:
    hw = hardware._backend
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}
    asyncio.get_event_loop().run_until_complete(
        session.CheckCalibrationSession.build(hardware)
    )
    return session.CheckCalibrationSession(hardware)


@pytest.fixture
def check_calibration_session_only_left(hardware) \
        -> session.CheckCalibrationSession:
    hw = hardware._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}
    asyncio.get_event_loop().run_until_complete(
        session.CheckCalibrationSession.build(hardware)
    )
    return session.CheckCalibrationSession(hardware)


BAD_DIFF_VECTOR = types.Point(30, 30, 30)
OK_DIFF_VECTOR = types.Point(30, 30, 30)

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
    return check_calibration_session


async def in_inspecting_first_tip(check_calibration_session):
    check_calibration_session = await in_preparing_first_pipette(
        check_calibration_session
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
    return check_calibration_session


async def in_inspecting_second_tip(check_calibration_session):
    check_calibration_session = await in_preparing_second_pipette(
        check_calibration_session
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


async def test_session_no_pipettes_error(hardware):
    with pytest.raises(session.NoPipetteException):
        await session.CheckCalibrationSession.build(hardware)


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
        assert len(tiprack.forPipettes) == 1
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
    assert len(next(iter(sess._labware_info.values())).forPipettes) == 2

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

    last_pos = await sess.hardware.gantry_position(sess._first_mount)

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
        jog_pos = await sess.hardware.gantry_position(sess._first_mount)
        assert jog_pos == vector + last_pos
        last_pos = jog_pos


async def test_first_pick_up_tip(check_calibration_session):
    sess = await in_inspecting_first_tip(check_calibration_session)
    first_pip = sess.get_pipette(sess._first_mount)
    second_pip = sess.get_pipette(sess._second_mount)
    assert first_pip['has_tip'] is True
    assert first_pip['tip_length'] > 0.0
    assert second_pip['has_tip'] is False


async def test_second_pick_up_tip(check_calibration_session):
    sess = await in_inspecting_second_tip(check_calibration_session)
    first_pip = sess.get_pipette(sess._first_mount)
    second_pip = sess.get_pipette(sess._second_mount)
    assert second_pip['has_tip'] is True
    assert second_pip['tip_length'] > 0.0
    assert first_pip['has_tip'] is False


async def test_invalidate_first_tip(check_calibration_session):
    sess = await in_inspecting_first_tip(check_calibration_session)
    first_pip = sess.get_pipette(sess._first_mount)
    assert first_pip['has_tip'] is True
    await sess.trigger_transition(
            session.CalibrationCheckTrigger.invalidate_tip)
    assert sess.current_state.name == \
        session.CalibrationCheckState.preparingFirstPipette
    assert sess.get_pipette(sess._first_mount)['has_tip'] is False


async def test_invalidate_second_tip(check_calibration_session):
    sess = await in_inspecting_second_tip(check_calibration_session)
    second_pip = sess.get_pipette(sess._second_mount)
    assert second_pip['has_tip'] is True
    await sess.trigger_transition(
            session.CalibrationCheckTrigger.invalidate_tip)
    assert sess.current_state.name == \
        session.CalibrationCheckState.preparingSecondPipette
    assert sess.get_pipette(sess._second_mount)['has_tip'] is False


async def test_complete_check_one_pip(check_calibration_session_only_right):
    sess = await in_comparing_first_pipette_point_three(
            check_calibration_session_only_right)
    first_pip = sess.get_pipette(sess._first_mount)
    assert first_pip['has_tip'] is True
    await sess.trigger_transition(
            session.CalibrationCheckTrigger.go_to_next_check)
    assert sess.current_state.name == \
        session.CalibrationCheckState.checkComplete
    assert sess.get_pipette(sess._first_mount)['has_tip'] is False


async def test_complete_check_both_pips(check_calibration_session):
    sess = await in_comparing_second_pipette_point_one(
            check_calibration_session)
    second_pip = sess.get_pipette(sess._second_mount)
    assert second_pip['has_tip'] is True
    await sess.trigger_transition(
            session.CalibrationCheckTrigger.go_to_next_check)
    assert sess.current_state.name == \
        session.CalibrationCheckState.checkComplete
    assert sess.get_pipette(sess._first_mount)['has_tip'] is False
    assert sess.get_pipette(sess._second_mount)['has_tip'] is False


# START flow testing both mounts


async def test_load_labware_to_preparing_first_pipette(
        check_calibration_session):
    sess = await in_preparing_first_pipette(check_calibration_session)
    tip_pt = sess._moves.preparingFirstPipette.position
    curr_pos = await sess.hardware.gantry_position(sess._first_mount)
    assert curr_pos == tip_pt

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
    curr_pos = await sess.hardware.gantry_position(sess._first_mount)
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
    curr_pos = await sess.hardware.gantry_position(sess._first_mount)
    assert curr_pos == tip_pt
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
    curr_pos = await sess.hardware.gantry_position(sess._first_mount)
    assert curr_pos == tip_pt
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
    curr_pos = await sess.hardware.gantry_position(sess._first_mount)
    assert curr_pos == tip_pt
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
    curr_pos = await sess.hardware.gantry_position(sess._second_mount)
    assert curr_pos == tip_pt
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
    curr_pos = await sess.hardware.gantry_position(sess._second_mount)
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
    curr_pos = await sess.hardware.gantry_position(sess._second_mount)
    assert curr_pos == tip_pt
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
