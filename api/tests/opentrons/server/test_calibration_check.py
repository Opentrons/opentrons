import pytest
from uuid import UUID

from opentrons import types


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
    assert resp.status == 200
    # text = await resp.json()

    # # check that URL is for the move endpoint
    # assert text['nextSteps']['links']['moveToTipRack']['url'] ==\
    #     '/calibration/check/session/move'

    # assert text['nextSteps']['links']['moveToTipRack']['params']

    # check that params exist
    assert sess._deck['8']
    assert sess._deck['8'].name == 'opentrons_96_tiprack_10ul'
    assert sess._deck['6']
    assert sess._deck['6'].name == 'opentrons_96_tiprack_300ul'


async def test_load_same_tiprack(async_client, async_server):
    hw = async_server['com.opentrons.hardware']._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p300_multi_v1', 'id': 'fake10pip'}
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}
    resp = await async_client.post('/calibration/check/session')
    cal_app = async_server['calibration']
    sess = cal_app['com.opentrons.session_manager'].sessions['check']

    resp = await async_client.post('/calibration/check/session/loadLabware')
    status = await resp.json()

    pip_info = {}
    for pip, data in status['instruments'].items():
        pip_info[data['model']] = pip

    assert sess._deck['8']
    assert not sess._deck['6']

    assert sess._deck['8'].name == 'opentrons_96_tiprack_300ul'

    # z and x values should be the same, but y should be different
    # if accessing different tips (A1, B1) on same tiprack
    assert sess._moves.preparingFirstPipette.position.x == \
            sess._moves.preparingSecondPipette.position.x
    assert sess._moves.preparingFirstPipette.position.z == \
            sess._moves.preparingSecondPipette.position.z
    assert sess._moves.preparingFirstPipette.position.y != \
            sess._moves.preparingSecondPipette.position.y


async def test_move_to_position(async_client, async_server, test_setup):
    _, sess = test_setup
    # load labware on deck to enable move
    resp = await async_client.post('/calibration/check/session/loadLabware')
    status = await resp.json()

    pip_id = list(status['instruments'].keys())[0]

    mount =  sess._first_mount
    tip_pt = sess._moves.preparingFirstPipette.position

    resp = await async_client.post(
        '/calibration/check/session/preparePipette',
        json={'pipetteId': pip_id})

    assert resp.status == 200

    curr_pos = await sess.hardware.gantry_position(mount)
    assert curr_pos == tip_pt


async def test_jog_pipette(async_client, async_server, test_setup):
    status, sess = test_setup

    sess._set_current_state('preparingFirstPipette')

    mount = sess._first_mount

    old_pos = await sess.hardware.gantry_position(mount)
    resp = await async_client.post(
        '/calibration/check/session/jog',
        json={'vector': [0, -1, 0]})

    assert resp.status == 200

    new_pos = await sess.hardware.gantry_position(mount)

    assert (new_pos - old_pos) == types.Point(0, -1, 0)


async def test_pickup_tip(async_client, async_server, test_setup):
    status, sess = test_setup
    await async_client.post('/calibration/check/session/loadLabware')
    await async_client.post('/calibration/check/session/preparePipette')

    pipette_id = list(status['instruments'].keys())[0]
    resp = await async_client.post('/calibration/check/session/pickUpTip')

    text = await resp.json()
    assert resp.status == 200
    assert text['instruments'][pipette_id]['has_tip'] is True
    assert text['instruments'][pipette_id]['tip_length'] > 0.0


async def test_invalidate_tip(async_client, async_server, test_setup):
    status, sess = test_setup
    await async_client.post('/calibration/check/session/loadLabware')

    sess._set_current_state('preparingPipette')
    pipette_id = list(status['instruments'].keys())[0]
    resp = await async_client.post(
        '/calibration/check/session/invalidateTip',
        json={'pipetteId': pipette_id})
    assert resp.status == 409
    resp = await async_client.post(
        '/calibration/check/session/pickUpTip',
        json={'pipetteId': pipette_id})
    text = await resp.json()
    assert text['instruments'][pipette_id]['has_tip'] is True

    resp = await async_client.post(
        '/calibration/check/session/invalidateTip',
        json={'pipetteId': pipette_id})
    text = await resp.json()
    assert text['instruments'][pipette_id]['has_tip'] is False
    assert resp.status == 200


async def test_drop_tip(async_client, async_server, test_setup):
    status, sess = test_setup
    await async_client.post('/calibration/check/session/loadLabware')

    pipette_id = list(status['instruments'].keys())[0]
    resp = await async_client.post(
        '/calibration/check/session/preparePipette',
        json={'pipetteId': pipette_id})
    assert resp.status == 200
    resp = await async_client.post(
        '/calibration/check/session/pickUpTip',
        json={'pipetteId': pipette_id})
    assert resp.status == 200
    resp = await async_client.post(
        '/calibration/check/session/confirmTip',
        json={'pipetteId': pipette_id})
    assert resp.status == 200

    text = await resp.json()

    assert text['instruments'][pipette_id]['has_tip'] is True

    sess._set_current_state('checkingHeight')
    resp = await async_client.post(
        '/calibration/check/session/confirmStep',
        json={'pipetteId': pipette_id})
    assert resp.status == 200
    text = await resp.json()
    assert text['instruments'][pipette_id]['has_tip'] is False
