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
    # there should only be one tiprack uuid here
    assert len(sess._moves.preparingPipette.keys()) == 1

    tip_id = list(sess._moves.preparingPipette.keys())[0]

    single_id = pip_info['p300_single_v1']
    multi_id = pip_info['p300_multi_v1']

    loc_dict = sess._moves.preparingPipette[tip_id][UUID(single_id)]
    loc_dict.well.display_name.split()[0] == 'B1'

    loc_dict2 = sess._moves.preparingPipette[tip_id][UUID(multi_id)]
    loc_dict2.well.display_name.split()[0] == 'A1'


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

    well = sess._moves.preparingPipette[uuid_tiprack][uuid_pipette].well

    resp = await async_client.post(
        '/calibration/check/session/preparePipette',
        json={'pipetteId': pip_id})

    assert resp.status == 200

    curr_pos = await sess.hardware.gantry_position(mount)
    assert curr_pos == (well.top()[0] + types.Point(0, 0, 10))


async def test_jog_pipette(async_client, async_server, test_setup):
    status, sess = test_setup

    sess._set_current_state('preparingPipette')

    pipette_id = list(status['instruments'].keys())[0]
    mount = types.Mount.LEFT

    old_pos = await sess.hardware.gantry_position(mount)
    resp = await async_client.post(
        '/calibration/check/session/jog',
        json={'pipetteId': pipette_id, 'vector': [0, -1, 0]})

    assert resp.status == 200

    new_pos = await sess.hardware.gantry_position(mount)

    assert (new_pos - old_pos) == types.Point(0, -1, 0)


async def test_pickup_tip(async_client, async_server, test_setup):
    status, sess = test_setup
    await async_client.post('/calibration/check/session/loadLabware')

    sess._set_current_state('preparingPipette')

    pipette_id = list(status['instruments'].keys())[0]
    resp = await async_client.post(
        '/calibration/check/session/pickUpTip',
        json={'pipetteId': pipette_id})

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
