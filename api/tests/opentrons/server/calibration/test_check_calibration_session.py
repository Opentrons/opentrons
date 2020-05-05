import asyncio
from uuid import UUID

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
def check_calibration_session_only_right(hardware) -> session.CheckCalibrationSession:
    hw = hardware._backend
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}
    asyncio.get_event_loop().run_until_complete(
        session.CheckCalibrationSession.build(hardware)
    )
    return session.CheckCalibrationSession(hardware)

@pytest.fixture
def check_calibration_session_only_left(hardware) -> session.CheckCalibrationSession:
    hw = hardware._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}
    asyncio.get_event_loop().run_until_complete(
        session.CheckCalibrationSession.build(hardware)
    )
    return session.CheckCalibrationSession(hardware)

BAD_DIFF_VECTOR = types.Point(30,30,30)
OK_DIFF_VECTOR = types.Point(30,30,30)

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

# tests

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


async def test_session_started_to_end_state(check_calibration_session):
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.exit
        )
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.sessionExited

# START testing both mounts

async def test_load_labware_to_preparing_first_pipette(check_calibration_session):
    await in_preparing_first_pipette(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.preparingFirstPipette
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.preparingFirstPipette


async def test_preparing_first_pipette_to_bad_calibration(check_calibration_session):
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


async def test_preparing_first_pipette_to_inspecting(check_calibration_session):
    await in_inspecting_first_tip(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.inspectingFirstTip


async def test_inspecting_first_pipette_to_jogging_height(check_calibration_session):
    await in_jogging_first_pipette_to_height(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToHeight
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToHeight


async def test_jogging_first_pipette_height_to_comparing(check_calibration_session):
    await in_comparing_first_pipette_height(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipetteHeight


async def test_comparing_first_pipette_height_to_jogging_point_one(check_calibration_session):
    await in_jogging_first_pipette_to_point_one(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointOne
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointOne


async def test_jogging_first_pipette_point_one_to_comparing(check_calibration_session):
    await in_comparing_first_pipette_point_one(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipettePointOne


async def test_comparing_first_pipette_point_one_to_jogging_point_two(check_calibration_session):
    await in_jogging_first_pipette_to_point_two(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointTwo
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointTwo


async def test_jogging_first_pipette_point_two_to_comparing(check_calibration_session):
    await in_comparing_first_pipette_point_two(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipettePointTwo


async def test_comparing_first_pipette_point_two_to_jogging_point_three(check_calibration_session):
    await in_jogging_first_pipette_to_point_three(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointThree
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointThree


async def test_jogging_first_pipette_point_three_to_comparing(check_calibration_session):
    await in_comparing_first_pipette_point_three(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipettePointThree


async def test_load_labware_to_preparing_second_pipette(check_calibration_session):
    await in_preparing_second_pipette(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.preparingSecondPipette
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.preparingSecondPipette


async def test_preparing_second_pipette_to_inspecting(check_calibration_session):
    await in_inspecting_second_tip(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.inspectingSecondTip


async def test_inspecting_second_pipette_to_jogging_height(check_calibration_session):
    await in_jogging_second_pipette_to_height(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingSecondPipetteToHeight
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingSecondPipetteToHeight


async def test_jogging_second_pipette_height_to_comparing(check_calibration_session):
    await in_comparing_second_pipette_height(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.comparingSecondPipetteHeight


async def test_comparing_second_pipette_height_to_jogging_point_one(check_calibration_session):
    await in_jogging_second_pipette_to_point_one(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingSecondPipetteToPointOne
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.jog, OK_DIFF_VECTOR)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.joggingSecondPipetteToPointOne


async def test_jogging_second_pipette_point_one_to_comparing(check_calibration_session):
    await in_comparing_second_pipette_point_one(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.comparingSecondPipettePointOne


# END testing both mounts

# START testing right only

async def test_load_labware_to_preparing_first_pipette(check_calibration_session_only_right):
    await in_preparing_first_pipette(check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
        session.CalibrationCheckState.preparingFirstPipette


async def test_preparing_first_pipette_to_inspecting(check_calibration_session_only_right):
    await in_inspecting_first_tip(check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
        session.CalibrationCheckState.inspectingFirstTip


async def test_inspecting_first_pipette_to_jogging_height(check_calibration_session_only_right):
    await in_jogging_first_pipette_to_height(check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToHeight


async def test_jogging_first_pipette_height_to_comparing(check_calibration_session_only_right):
    await in_comparing_first_pipette_height(check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipetteHeight


async def test_comparing_first_pipette_height_to_jogging_point_one(check_calibration_session_only_right):
    await in_jogging_first_pipette_to_point_one(check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointOne


async def test_jogging_first_pipette_point_one_to_comparing(check_calibration_session_only_right):
    await in_comparing_first_pipette_point_one(check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipettePointOne


async def test_comparing_first_pipette_point_one_to_jogging_point_two(check_calibration_session_only_right):
    await in_jogging_first_pipette_to_point_two(check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointTwo


async def test_jogging_first_pipette_point_two_to_comparing(check_calibration_session_only_right):
    await in_comparing_first_pipette_point_two(check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipettePointTwo


async def test_comparing_first_pipette_point_two_to_jogging_point_three(check_calibration_session_only_right):
    await in_jogging_first_pipette_to_point_three(check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointThree


async def test_jogging_first_pipette_point_three_to_comparing(check_calibration_session_only_right):
    await in_comparing_first_pipette_point_three(check_calibration_session_only_right)
    assert check_calibration_session_only_right.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipettePointThree

async def test_jogging_first_pipette_point_three_to_complete(check_calibration_session_only_right):
    await in_comparing_first_pipette_point_three(check_calibration_session_only_right)
    await check_calibration_session_only_right.trigger_transition(
            session.CalibrationCheckTrigger.go_to_next_check)
    assert check_calibration_session_only_right.current_state.name == \
        session.CalibrationCheckState.checkComplete

# END testing right only


# START testing right only

async def test_load_labware_to_preparing_first_pipette(check_calibration_session_only_left):
    await in_preparing_first_pipette(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
        session.CalibrationCheckState.preparingFirstPipette


async def test_preparing_first_pipette_to_inspecting(check_calibration_session_only_left):
    await in_inspecting_first_tip(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
        session.CalibrationCheckState.inspectingFirstTip


async def test_inspecting_first_pipette_to_jogging_height(check_calibration_session_only_left):
    await in_jogging_first_pipette_to_height(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToHeight


async def test_jogging_first_pipette_height_to_comparing(check_calibration_session_only_left):
    await in_comparing_first_pipette_height(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipetteHeight


async def test_comparing_first_pipette_height_to_jogging_point_one(check_calibration_session_only_left):
    await in_jogging_first_pipette_to_point_one(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointOne


async def test_jogging_first_pipette_point_one_to_comparing(check_calibration_session_only_left):
    await in_comparing_first_pipette_point_one(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipettePointOne


async def test_comparing_first_pipette_point_one_to_jogging_point_two(check_calibration_session_only_left):
    await in_jogging_first_pipette_to_point_two(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointTwo


async def test_jogging_first_pipette_point_two_to_comparing(check_calibration_session_only_left):
    await in_comparing_first_pipette_point_two(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipettePointTwo


async def test_comparing_first_pipette_point_two_to_jogging_point_three(check_calibration_session_only_left):
    await in_jogging_first_pipette_to_point_three(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
        session.CalibrationCheckState.joggingFirstPipetteToPointThree


async def test_jogging_first_pipette_point_three_to_comparing(check_calibration_session_only_left):
    await in_comparing_first_pipette_point_three(check_calibration_session_only_left)
    assert check_calibration_session_only_left.current_state.name == \
        session.CalibrationCheckState.comparingFirstPipettePointThree

async def test_jogging_first_pipette_point_three_to_complete(check_calibration_session_only_left):
    await in_comparing_first_pipette_point_three(check_calibration_session_only_left)
    await check_calibration_session_only_left.trigger_transition(
            session.CalibrationCheckTrigger.go_to_next_check)
    assert check_calibration_session_only_left.current_state.name == \
        session.CalibrationCheckState.checkComplete

# END testing right only