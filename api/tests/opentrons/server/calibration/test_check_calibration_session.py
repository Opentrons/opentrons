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


async def in_labware_loaded(check_calibration_session):
    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.load_labware
    )
    return check_calibration_session


async def in_preparing_pipette(check_calibration_session):
    check_calibration_session = await in_labware_loaded(
        check_calibration_session
    )
    pipette_id = tuple(check_calibration_session.pipette_status().keys())[0]

    await check_calibration_session.trigger_transition(
        session.CalibrationCheckTrigger.prepare_pipette,
        pipette_id=pipette_id
    )
    return check_calibration_session


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
            session.CalibrationCheckTrigger.confirm_step
        )


async def test_session_started_to_end_state(check_calibration_session):
    await check_calibration_session.trigger_transition(
            session.CalibrationCheckTrigger.exit
        )
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.sessionExited


async def test_load_labware_to_preparing_pipette(check_calibration_session):
    await in_preparing_pipette(check_calibration_session)
    assert check_calibration_session.current_state.name == \
        session.CalibrationCheckState.preparingPipette
