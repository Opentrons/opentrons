import pytest
from uuid import UUID

from opentrons import types




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
