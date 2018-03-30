import json
from opentrons import robot, instruments
from opentrons import deck_calibration as dc
from opentrons.deck_calibration import endpoints
from opentrons.instruments import pipette_config


# ------------ Function tests (unit) ----------------------
async def test_init_pipette(dc_session):
    robot.reset()
    data = {
        'mount': 'left',
        'model': 'p10_single'}
    await endpoints.init_pipette(data)
    actual = dc_session.pipettes.get('left').name
    expected = pipette_config.p10_single.name
    assert actual == expected


async def test_save_z(dc_session):
    robot.reset()
    mount = 'left'
    pip = instruments.P10_Single(mount=mount)
    dc_session.pipettes = {mount: pip}
    dc_session.current_mount = 'Z'

    robot.home()

    tip_length = 25
    dc_session.pipettes.get(mount)._add_tip(tip_length)

    data = {
        'tip-length': tip_length
    }

    z_target = 80.0
    dc_session.pipettes.get(mount).move_to((robot.deck, (0, 0, z_target)))

    await endpoints.save_z(data)

    new_z = dc.get_z(robot)
    pipette_z_offset = pipette_config.p10_single.model_offset[-1]
    expected_z = z_target - pipette_z_offset
    assert new_z == expected_z


# ------------ Session and token tests ----------------------
async def test_create_session(async_client, monkeypatch):
    """
    Tests that the GET request to initiate a session manager for factory
    calibration returns a good token.
    """
    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    expected = {'token': dummy_token}
    resp = await async_client.post('/calibration/deck/start')
    text = await resp.text()
    assert json.loads(text) == expected
    assert resp.status == 201


async def test_release(async_client):
    """
    Tests that the GET request to initiate a session manager for factory
    calibration returns an error if a session is in progress, and can be
    overridden.
    """
    resp = await async_client.post('/calibration/deck/start')
    assert resp.status == 201
    body = await resp.json()
    token = body.get('token')

    resp1 = await async_client.post('/calibration/deck/start')
    assert resp1.status == 409

    # Release
    resp2 = await async_client.post(
        '/calibration/deck',
        data={
            'token': token,
            'command': 'release'
        })
    assert resp2.status == 200
    assert endpoints.session is None

    resp3 = await async_client.post('/calibration/deck/start')
    assert resp3.status == 201


async def test_forcing_new_session(async_client, monkeypatch):
    """
    Tests that the GET request to initiate a session manager for factory
    calibration returns an error if a session is in progress, and can be
    overridden.
    """
    dummy_token = 'Test Token'

    def uuid_mock():
        nonlocal dummy_token
        dummy_token = dummy_token + '+'
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    resp = await async_client.post('/calibration/deck/start')
    text = await resp.json()
    assert resp.status == 201
    expected = {'token': dummy_token}
    assert text == expected

    resp1 = await async_client.post('/calibration/deck/start')
    assert resp1.status == 409

    resp2 = await async_client.post(
        '/calibration/deck/start', json={'force': 'true'})
    text2 = await resp2.json()
    assert resp2.status == 201
    expected2 = {'token': dummy_token}
    assert text2 == expected2


async def test_incorrect_token(async_client, monkeypatch):
    """
    Test that putting in an incorrect token for a POST request does not work
    after a session was already created with a different token.
    """
    robot.reset()
    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    await async_client.post('/calibration/deck/start')

    resp = await async_client.post(
        '/calibration/deck',
        data={
            'token': 'FAKE TOKEN',
            'command': 'init pipette',
            'mount': 'left',
            'model': 'p10_single'
        })

    assert resp.status == 403


# ------------ Router tests (integration) ----------------------
async def test_init_pipette_integration(async_client, monkeypatch):
    """
    Test that initializing a pipette works as expected with a correctly formed
    packet/ POST request.

    """
    robot.reset()
    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    token_res = await async_client.post('/calibration/deck/start')
    token_text = await token_res.json()
    token = token_text['token']

    resp = await async_client.post(
        '/calibration/deck',
        data={
            'token': token,
            'command': 'init pipette',
            'mount': 'left',
            'model': 'p10_single'
        })

    body = await resp.json()

    assert body['pipettes']['left'] == 'p10_single'
    assert endpoints.session.pipettes.get('right') is None


async def test_set_and_jog_integration(async_client, monkeypatch):
    """
    Test that the select model function and jog function works.
    Note that in order for the jog function to work, the following must
    be done:
    1. Create a session manager
    2. Initialize a pipette
    3. Select the current pipette
    Then jog requests will work as expected.
    """
    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    token_res = await async_client.post('/calibration/deck/start')
    token_text = await token_res.json()
    token = token_text['token']

    await async_client.post(
        '/calibration/deck',
        data={
            'token': token,
            'command': 'init pipette',
            'mount': 'left',
            'model': 'p10_single'
        })

    await async_client.post(
        '/calibration/deck',
        data={
            'token': token,
            'command': 'select pipette',
            'mount': 'left'
        })

    axis = 'Z'
    direction = '1'
    step = '3'

    robot.reset()
    prior_x, prior_y, prior_z = dc.position('Z')
    resp = await async_client.post(
        '/calibration/deck',
        data={
            'token': token,
            'command': 'jog',
            'mount': 'left',
            'axis': axis,
            'direction': direction,
            'step': step
        })

    body = await resp.json()

    assert body.get('message') == [prior_x, prior_y, prior_z + float(step)]
