import json
from opentrons import robot, instruments
from opentrons import deck_calibration as dc
from opentrons.deck_calibration import endpoints
from opentrons.instruments import pipette_config
from opentrons.robot import robot_configs


# ------------ Function tests (unit) ----------------------
async def test_add_and_remove_tip(dc_session):
    robot.reset()
    mount = 'left'
    pip = instruments.P10_Single(mount=mount)
    dc_session.pipettes = {mount: pip}
    dc_session.current_mount = 'Z'

    # Check malformed packet
    res0 = await endpoints.attach_tip({})
    assert res0.status == 400
    assert dc_session.tip_length is None
    assert not pip.tip_attached

    # Check correct attach command
    tip_length = 50
    res1 = await endpoints.attach_tip({'tip-length': tip_length})
    assert res1.status == 200
    assert dc_session.tip_length == tip_length
    assert pip.tip_attached

    # Check command in wrong state (tip already attached)
    res2 = await endpoints.attach_tip({'tip-length': tip_length + 5})
    assert res2.status == 400
    assert dc_session.tip_length == tip_length
    assert pip.tip_attached

    # Check correct detach command
    res3 = await endpoints.detach_tip({})
    assert res3.status == 200
    assert dc_session.tip_length is None
    assert not pip.tip_attached

    # Check command in wrong state (no tip)
    res4 = await endpoints.detach_tip({})
    assert res4.status == 400


async def test_save_xy(dc_session):
    robot.reset()
    mount = 'left'
    pip = instruments.P10_Single(mount=mount)
    dc_session.pipettes = {mount: pip}
    dc_session.current_mount = 'Z'
    dc_session.tip_length = 25
    dc_session.pipettes.get(mount)._add_tip(dc_session.tip_length)

    robot.home()
    x = 100
    y = 101
    dc_session.pipettes.get(mount).move_to((robot.deck, (x, y, 102)))

    point = '1'
    data = {
        'point': point
    }
    await endpoints.save_xy(data)

    actual = dc_session.points[point]
    expected = (robot._driver.position['X'], robot._driver.position['Y'])
    assert actual == expected


async def test_save_z(dc_session):
    robot.reset()
    mount = 'left'
    pip = instruments.P10_Single(mount=mount)
    dc_session.pipettes = {mount: pip}
    dc_session.current_mount = 'Z'
    dc_session.tip_length = 25
    dc_session.pipettes.get(mount)._add_tip(dc_session.tip_length)

    robot.home()

    z_target = 80.0
    dc_session.pipettes.get(mount).move_to((robot.deck, (0, 0, z_target)))

    await endpoints.save_z({})

    new_z = dc_session.z_value
    pipette_z_offset = pipette_config.configs['p10_single_v1'].model_offset[-1]
    expected_z = z_target - pipette_z_offset
    assert new_z == expected_z


async def test_save_calibration_file(dc_session, monkeypatch):
    robot.reset()
    expected_pos = endpoints.expected_points()
    dc_session.points = {
        k: (v[0], v[1] + 0.3)
        for k, v in expected_pos.items()}
    dc_session.z_value = 0.2

    persisted_data = []

    def dummy_save(config, filename=None, tag=None):
        nonlocal persisted_data
        persisted_data.append((config, filename, tag))

    monkeypatch.setattr(robot_configs, 'save', dummy_save)

    endpoints.save_transform({})

    expected = robot.config.gantry_calibration
    assert len(persisted_data) == 2
    assert persisted_data[0][0].gantry_calibration == expected
    assert persisted_data[1][0].gantry_calibration == expected
    assert persisted_data[1][-1] is not None


# ------------ Session and token tests ----------------------
# TODO(mc, 2018-05-02): this does not adequetly pipette selection logic
async def test_create_session(async_client, monkeypatch):
    """
    Tests that the POST request to initiate a session manager for factory
    calibration returns a good token.
    """
    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    expected = {
        'token': dummy_token,
        'pipette': {'mount': 'left', 'model': 'p10_single_v1'}}
    resp = await async_client.post('/calibration/deck/start')
    text = await resp.text()

    assert json.loads(text) == expected
    assert resp.status == 201


async def test_create_session_fail(async_client, monkeypatch):
    """
    Tests that the GET request to initiate a session manager for factory
    calibration returns a good token.
    """
    from opentrons.robot.robot import Robot
    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    def dummy_get_pipettes(self):
        return {
            'left': {
                'mount_axis': 'z',
                'plunger_axis': 'b',
                'model': None
            },
            'right': {
                'mount_axis': 'a',
                'plunger_axis': 'c',
                'model': None
            }
        }

    monkeypatch.setattr(Robot, 'get_attached_pipettes', dummy_get_pipettes)

    resp = await async_client.post('/calibration/deck/start')
    text = await resp.text()
    print(text)
    assert json.loads(text) == {'message': 'Error, pipette not recognized'}
    assert resp.status == 403
    assert endpoints.session is None


async def test_release(async_client):
    """
    Tests that the GET request to initiate a session manager for factory
    calibration returns an error if a session is in progress, and can be
    overridden.
    """
    robot.reset()

    resp = await async_client.post('/calibration/deck/start')
    assert resp.status == 201
    body = await resp.json()
    token = body.get('token')

    resp1 = await async_client.post('/calibration/deck/start')
    assert resp1.status == 409

    # Release
    resp2 = await async_client.post(
        '/calibration/deck',
        json={
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
    robot.reset()
    dummy_token = 'Test Token'

    def uuid_mock():
        nonlocal dummy_token
        dummy_token = dummy_token + '+'
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    resp = await async_client.post('/calibration/deck/start')
    text = await resp.json()

    assert resp.status == 201
    expected = {'token': dummy_token,
                'pipette': {'mount': 'left', 'model': 'p10_single_v1'}}
    assert text == expected

    resp1 = await async_client.post('/calibration/deck/start')
    assert resp1.status == 409

    resp2 = await async_client.post(
        '/calibration/deck/start', json={'force': 'true'})
    text2 = await resp2.json()
    assert resp2.status == 201
    expected2 = {'token': dummy_token,
                 'pipette': {'mount': 'left', 'model': 'p10_single_v1'}}
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
        json={
            'token': 'FAKE TOKEN',
            'command': 'init pipette',
            'mount': 'left',
            'model': 'p10_single_v1'
        })

    assert resp.status == 403


# ------------ Router tests (integration) ----------------------
# TODO(mc, 2018-05-02): this does not adequetly test z to smoothie axis logic
async def test_set_and_jog_integration(async_client, monkeypatch):
    """
    Test that the jog function works.
    Note that in order for the jog function to work, the following must
    be done:
    1. Create a session manager

    Then jog requests will work as expected.
    """
    robot.reset()
    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    token_res = await async_client.post('/calibration/deck/start')
    token_text = await token_res.json()
    token = token_text['token']

    axis = 'z'
    direction = 1
    step = 3
    # left pipette z carriage motor is smoothie axis "Z"
    smoothie_axis = 'Z'

    robot.reset()
    prior_x, prior_y, prior_z = dc.position(smoothie_axis)
    resp = await async_client.post(
        '/calibration/deck',
        json={
            'token': token,
            'command': 'jog',
            'axis': axis,
            'direction': direction,
            'step': step
        })

    body = await resp.json()
    msg = body.get('message')

    assert '{}'.format((prior_x, prior_y, prior_z + float(step))) in msg
