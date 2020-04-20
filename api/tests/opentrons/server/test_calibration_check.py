import pytest
from uuid import UUID

from opentrons import types
from opentrons.server.endpoints.calibration.util import CalibrationCheckState


@pytest.fixture
async def test_setup(async_server, async_client):
    hw = async_server['com.opentrons.hardware']._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p10_single_v1', 'id': 'fake10pip'}
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}
    resp = await async_client.post('/calibration/check/session')
    cal_app = async_server['calibration']
    sess = cal_app['com.opentrons.session_manager'].sessions['check']

    return await resp.json(), sess


async def test_load_labware(async_client, async_server, test_setup):
    _, sess = test_setup

    resp = await async_client.post('/calibration/check/session/loadLabware')
    text = await resp.json()

    # # check that URL is for the move endpoint
    # assert text['nextSteps']['links']['moveToTipRack']['url'] ==\
    #     '/calibration/check/session/move'

    # assert text['nextSteps']['links']['moveToTipRack']['params']

    # check that params exist
    assert sess._deck['8']
    assert sess._deck['8'].name == 'opentrons_96_tiprack_10ul'
    assert sess._deck['6']
    assert sess._deck['6'].name == 'opentrons_96_tiprack_300ul'


async def test_move_to_position(async_client, async_server, test_setup):
    _, sess = test_setup
    # load labware on deck to enable move
    resp = await async_client.post('/calibration/check/session/loadLabware')
    status = await resp.json()

    pip_id = list(status['instruments'].keys())[0]

    mount = types.Mount.LEFT
    tiprack_id = status['instruments'][pip_id]['tiprack_id']
    # temporarily convert back to UUID to access well location
    uuid_tiprack = UUID(tiprack_id)
    uuid_pipette = UUID(pip_id)

    well = sess._moves.preparingPipette[uuid_tiprack][uuid_pipette]['well']

    # pos_dict = {'locationId': tiprack_id, 'offset': [0, 1, 0]}
    resp = await async_client.post(
        '/calibration/check/session/preparePipette',
        json={'pipetteId': pip_id})

    assert resp.status == 200

    curr_pos = await sess.hardware.gantry_position(mount)
    assert curr_pos == (well.top()[0] + types.Point(0, 1, 0))


async def test_jog_pipette(async_client, async_server, test_setup):
    status, sess = test_setup

    sess._set_current_state('preparingPipette')

    id = list(status['instruments'].keys())[0]
    mount = types.Mount.LEFT

    old_pos = await sess.hardware.gantry_position(mount)
    resp = await async_client.post(
        '/calibration/check/session/jog',
        json={'pipetteId': id, 'vector': [0, -1, 0]})

    assert resp.status == 200

    new_pos = await sess.hardware.gantry_position(mount)

    assert (new_pos - old_pos) == types.Point(0, -1, 0)


async def test_pickup_tip(async_client, async_server, test_setup):
    status, sess = test_setup
    await async_client.post('/calibration/check/session/loadLabware')

    sess._set_current_state('preparingPipette')

    id = list(status['instruments'].keys())[0]
    resp = await async_client.post(
        '/calibration/check/session/pickUpTip',
        json={'pipetteId': id})

    text = await resp.json()
    assert resp.status == 200
    assert text['instruments'][id]['has_tip'] is True
    assert text['instruments'][id]['tip_length'] > 0.0


async def test_invalidate_tip(async_client, async_server, test_setup):
    status, sess = test_setup
    await async_client.post('/calibration/check/session/loadLabware')

    sess._set_current_state('preparingPipette')
    id = list(status['instruments'].keys())[0]
    resp = await async_client.post(
        '/calibration/check/session/invalidateTip',
        json={'pipetteId': id})
    assert resp.status == 409
    resp = await async_client.post(
        '/calibration/check/session/pickUpTip',
        json={'pipetteId': id})
    text = await resp.json()
    assert text['instruments'][id]['has_tip'] is True

    resp = await async_client.post(
        '/calibration/check/session/invalidateTip',
        json={'pipetteId': id})
    text = await resp.json()
    assert text['instruments'][id]['has_tip'] is False
    assert resp.status == 200


async def test_drop_tip(async_client, async_server, test_setup):
    status, sess = test_setup
    await async_client.post('/calibration/check/session/loadLabware')

    id = list(status['instruments'].keys())[0]
    resp = await async_client.post(
        '/calibration/check/session/preparePipette',
        json={'pipetteId': id})
    assert resp.status == 200
    resp = await async_client.post(
        '/calibration/check/session/pickUpTip',
        json={'pipetteId': id})
    assert resp.status == 200
    resp = await async_client.post(
        '/calibration/check/session/confirmTip',
        json={'pipetteId': id})
    assert resp.status == 200

    text = await resp.json()

    assert text['instruments'][id]['has_tip'] is True

    sess._set_current_state('checkingHeight')
    resp = await async_client.post(
        '/calibration/check/session/confirmStep',
        json={'pipetteId': id})
    assert resp.status == 200
    text = await resp.json()
    assert text['instruments'][id]['has_tip'] is False
