import asyncio
from uuid import UUID

import pytest
from opentrons import types
from opentrons.hardware_control import Pipette

from opentrons.server.endpoints.calibration.session import CheckCalibrationSession


@pytest.fixture
def check_calibration_session(hardware) -> CheckCalibrationSession:
    hw = hardware._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p10_single_v1', 'id': 'fake10pip'}
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}
    asyncio.get_event_loop().run_until_complete(
        CheckCalibrationSession.build(hardware)
    )
    return CheckCalibrationSession(hardware)


def test_initial_state(check_calibration_session):
    assert check_calibration_session.current_state.name == 'sessionStarted'


async def test_state_transitions(check_calibration_session):
    await check_calibration_session.load_labware()
    assert check_calibration_session.current_state.name == 'labwareLoaded'
    pipette_id = UUID(tuple(check_calibration_session.pipette_status.keys())[0])
    await check_calibration_session.prepare_pipette(pipette_id=pipette_id)
    assert check_calibration_session.current_state.name == 'preparingPipette'
