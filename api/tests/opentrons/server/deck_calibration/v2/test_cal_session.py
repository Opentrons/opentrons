import pytest


@pytest.mark.api2_only
async def test_session_start(async_client):
    resp = await async_client.post('/calibration/v2/')
    assert resp.status == 201
    resp_body = await resp.json()
    assert 'status' in resp_body


@pytest.mark.api2_only
async def test_one_session_only(async_client):
    resp = await async_client.post('/calibration/v2/')
    assert resp.status == 201

    resp = await async_client.post('/calibration/v2/')
    assert resp.status == 409
    body = await resp.json()
    assert body['error'] == 'in-progress'
    assert 'message' in body


@pytest.mark.api2_only
async def test_force_new_session(async_client):
    resp = await async_client.post('/calibration/v2/')
    assert resp.status == 201

    resp = await async_client.post('/calibration/v2/',
                                   params={'force': 'true'})
    assert resp.status == 201


@pytest.mark.api2_only
async def test_requires_session(async_client):
    resp = await async_client.get('/calibration/v2/')
    assert resp.status == 409

    resp = await async_client.post('/calibration/v2/')
    assert resp.status == 201

    resp = await async_client.get('/calibration/v2/')
    assert resp.status == 200

    resp = await async_client.delete('/calibration/v2/')
    assert resp.status == 202

    resp = await async_client.get('/calibration/v2/')
    assert resp.status == 409


@pytest.mark.api2_only
async def test_tiprack_management(async_client, deck_cal_session):
    resp = await async_client.get('/calibration/v2/deck')
    assert resp.status == 200
    body = await resp.json()
    slots = set([f'{i}' for i in range(1, 13)])
    for slot, contents in body.items():
        slots.remove(slot)
        assert not contents
    assert not slots
