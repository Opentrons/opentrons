import pytest
from opentrons import types

from opentrons.server.endpoints.calibration.util import CalibrationCheckState


@pytest.fixture
async def test_setup(async_server, async_client):
    hw = async_server['com.opentrons.hardware']._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p10_single_v1', 'id': 'fake10pip'}
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}
    await async_client.post('/calibration/check/session')


async def test_load_labware(async_client, async_server, test_setup):
    sess = async_server['com.opentrons.session_manager'].sessions['check']
    sess.state_machine.update_state(CalibrationCheckState.loadLabware)
    resp = await async_client.post('/calibration/check/session/loadLabware')
    text = await resp.json()
    print(text)


async def test_move_to_position(async_client, async_server, test_setup):
    sess = async_server['com.opentrons.session_manager'].sessions['check']
    sess.state_machine.update_state(CalibrationCheckState.move)
    resp = await async_client.post('/calibration/check/session/move')
    return None


async def test_jog_pipette(async_client, async_server, test_setup):
    sess = async_server['com.opentrons.session_manager'].sessions['check']
    sess.state_machine.update_state(CalibrationCheckState.jog)
    resp = await async_client.post('/calibration/check/session/jog')
    return None


async def test_pickup_tip(async_client, async_server, test_setup):
    sess = async_server['com.opentrons.session_manager'].sessions['check']
    sess.state_machine.update_state(CalibrationCheckState.pickUpTip)
    resp = await async_client.post('/calibration/check/session/pickUpTip')
    return None


async def invalidateTip(async_client, async_server, test_setup):
    sess = async_server['com.opentrons.session_manager'].sessions['check']
    sess.state_machine.update_state(CalibrationCheckState.pickUpTip)
    resp = await async_client.post('/calibration/check/session/invalidateTip')


async def test_drop_tip(async_client, async_server, test_setup):
    sess = async_server['com.opentrons.session_manager'].sessions['check']
    sess.state_machine.update_state(CalibrationCheckState.pickUpTip)
    resp = await async_client.post('/calibration/check/session/dropTip')
    return None
