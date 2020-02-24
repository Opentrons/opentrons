import json

import numpy as np

from robot_server.aiohttp.endpoints import deck_calibration as endpoints
from opentrons.config import robot_configs
from opentrons import types


# Note that several tests in this file have target/expected values that do not
# accurately reflect robot operation, because of differences between return
# values from the driver during simulating vs. non-simulating modes. In
# particular, during simulating mode the driver's `position` method returns
# the xyz position of the tip of the pipette, but during non-simulating mode
# it returns a position that correponds roughly to the gantry (e.g.: where the
# Smoothie board sees the position of itself--after a fashion). Simulating mode
# should be replaced with something that accurately reflects actual robot
# operation, and then these tests should be revised to match expected reality.

# ------------ Function tests (unit) ----------------------
async def test_add_and_remove_tip(async_server, dc_session, instruments):
    hardware = dc_session.adapter
    mount = 'left'
    hardware.reset()
    hardware.cache_instruments({
        types.Mount.LEFT: 'p10_single_v1',
        types.Mount.RIGHT: None})
    pip = hardware.attached_instruments[types.Mount.LEFT]
    dc_session.current_mount = types.Mount.LEFT
    mount = dc_session.current_mount
    dc_session.pipettes = {mount: pip}

    # Check malformed packet
    res0 = await endpoints.attach_tip({})
    assert res0.status == 400
    assert dc_session.tip_length is None
    assert hardware.attached_instruments[mount]['has_tip'] is False

    # Check correct attach command
    tip_length = 50
    res1 = await endpoints.attach_tip({'tipLength': tip_length})
    assert res1.status == 200
    assert dc_session.tip_length == tip_length
    assert hardware.attached_instruments[mount]['has_tip'] is True

    # Check command with tip already attached
    res2 = await endpoints.attach_tip({'tipLength': tip_length + 5})
    assert res2.status == 200
    assert dc_session.tip_length == tip_length + 5
    assert hardware.attached_instruments[mount]['has_tip'] is True

    # Check correct detach command
    res3 = await endpoints.detach_tip({})
    assert res3.status == 200
    assert dc_session.tip_length is None
    assert hardware.attached_instruments[mount]['has_tip'] is False

    # Check command with no tip
    res4 = await endpoints.detach_tip({})
    assert res4.status == 200
    assert dc_session.tip_length is None
    assert hardware.attached_instruments[mount]['has_tip'] is False


async def test_save_xy(async_server, dc_session, instruments):
    hardware = dc_session.adapter
    mount = types.Mount.LEFT
    hardware.reset()
    hardware.cache_instruments({
        mount: 'p10_single_v1',
        types.Mount.RIGHT: None})
    pip = hardware.attached_instruments[mount]
    dc_session.pipettes = {mount: pip}
    dc_session.current_mount = mount
    dc_session.tip_length = 25
    dc_session.pipettes.get(mount)['has_tip'] = True
    dc_session.pipettes.get(mount)['tip_length'] = dc_session.tip_length
    hardware.add_tip(types.Mount.LEFT, dc_session.tip_length)
    hardware.home()
    x = 100
    y = 101
    hardware.move_to(types.Mount.LEFT, types.Point(x=x, y=y))

    point = '1'
    data = {
        'point': point
    }
    await endpoints.save_xy(data)

    actual = dc_session.points[point]
    coordinates = hardware.gantry_position(types.Mount.LEFT)
    expected = (
        coordinates.x,
        coordinates.y)

    assert actual == expected


async def test_save_z(async_server, dc_session, monkeypatch, instruments):
    dc_session.adapter.reset()
    hardware = dc_session.adapter
    model = 'p10_single_v1'
    # Z values were bleeding in from other tests, mock robot configs
    # to encapsulate this test
    fake_config = robot_configs.load()
    monkeypatch.setattr(hardware, 'config', fake_config)

    mount = types.Mount.LEFT
    hardware.reset()
    hardware.cache_instruments({
        mount: 'p10_single_v1',
        types.Mount.RIGHT: None})
    pip = hardware.attached_instruments[mount]
    dc_session.pipettes = {mount: pip}
    dc_session.current_mount = mount
    dc_session.current_model = model
    dc_session.tip_length = 25
    dc_session.pipettes.get(mount)['has_tip'] = True
    dc_session.pipettes.get(mount)['tip_length'] = dc_session.tip_length

    z_target = 80.0
    hardware.home()
    # Unsure whether to use move_to or move_rel
    hardware.move_to(
        types.Mount.LEFT, types.Point(x=0, y=0, z=z_target))

    await endpoints.save_z({})

    new_z = dc_session.z_value
    expected_z = z_target
    assert new_z == expected_z


async def test_save_calibration_file(dc_session, monkeypatch):
    hardware = dc_session.adapter
    hardware.reset()
    expected_pos = endpoints.expected_points()
    dc_session.points = {
        k: (v[0], v[1] + 0.3)
        for k, v in expected_pos.items()}
    dc_session.z_value = 0.2

    persisted_data = []

    def dummy_save(config, filename=None, tag=None):
        nonlocal persisted_data
        persisted_data.append((config, filename, tag))

    monkeypatch.setattr(robot_configs, 'save_deck_calibration', dummy_save)

    await endpoints.save_transform({})

    in_memory = hardware.config.gantry_calibration
    assert len(persisted_data) == 1  # back up now happens at beginning of sess
    assert persisted_data[0][0].gantry_calibration == in_memory

    expected = [[1.0, 0.0, 0.0, 0.0],
                [0.0, 1.0, 0.0, 0.3],
                [0.0, 0.0, 1.0, 0.2],
                [0.0, 0.0, 0.0, 1.0]]
    assert np.allclose(in_memory, expected)


async def test_transform_calculation(dc_session, monkeypatch):
    # This transform represents a 5 degree rotation, with a shift in x, y, & z.
    # Values for the points and expected transform come from a hand-crafted
    # transformation matrix and the points that would generate that matrix.
    hardware = dc_session.adapter

    cos_5deg_p = 0.9962
    sin_5deg_p = 0.0872
    sin_5deg_n = -sin_5deg_p
    const_zero = 0.0
    const_one_ = 1.0
    delta_x___ = 0.3
    delta_y___ = 0.4
    delta_z___ = 0.5
    expected_transform = [
        [cos_5deg_p, sin_5deg_p, const_zero, delta_x___],
        [sin_5deg_n, cos_5deg_p, const_zero, delta_y___],
        [const_zero, const_zero, const_one_, delta_z___],
        [const_zero, const_zero, const_zero, const_one_]]

    dc_session.z_value = 0.5
    dc_session.points = {
        '1': [13.16824337, 8.30855312],
        '2': [380.50507635, -23.82925545],
        '3': [34.87002331, 256.36103295]
    }

    await endpoints.save_transform({})

    assert np.allclose(hardware.config.gantry_calibration, expected_transform)


# ------------ Session and token tests ----------------------
async def test_create_session(async_client, async_server, monkeypatch):
    """
    Tests that the POST request to initiate a session manager for factory
    calibration returns a good token, along with the correct preferred pipette
    """
    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    # each tuple in this list is (left-mount, right-mount, correct-choice)
    pipette_combinations = [
        ('p300_multi_v1', 'p10_single_v1', 'p10_single_v1'),
        ('p300_single_v1', 'p10_single_v1', 'p10_single_v1'),
        ('p10_multi_v1', 'p300_multi_v1', 'p300_multi_v1'),
        (None, 'p10_single_v1', 'p10_single_v1'),
        ('p300_multi_v1', None, 'p300_multi_v1'),
        ('p10_single_v1', 'p300_multi_v1', 'p10_single_v1')]
    hardware = async_server['com.opentrons.hardware']
    for left_model, right_model, preferred in pipette_combinations:
        def dummy_read_model(mount):
            if mount == 'left':
                res = left_model
            else:
                res = right_model
            return res
        await hardware.cache_instruments(
            {types.Mount.LEFT: left_model, types.Mount.RIGHT: right_model})
        resp = await async_client.post('/calibration/deck/start')
        start_result = await resp.json()
        endpoints.session = None

        assert start_result.get('token') == dummy_token
        assert start_result.get('pipette', {}).get('model') == preferred
        assert resp.status == 201


async def test_create_session_fail(async_client, monkeypatch):
    """
    Tests that the GET request to initiate a session manager for factory
    calibration returns a good token.
    """
    from opentrons.legacy_api.robot import Robot
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
    assert json.loads(text) == {'message': 'Error, pipette not recognized'}
    assert resp.status == 403
    assert endpoints.session is None


async def test_release(async_client, async_server, monkeypatch, dc_session):
    """
    Tests that the GET request to initiate a session manager for factory
    calibration returns an error if a session is in progress, and can be
    overridden.
    """
    resp1 = await async_client.post('/calibration/deck/start')
    assert resp1.status == 409

    # Release
    resp2 = await async_client.post(
        '/calibration/deck',
        json={
            'token': dc_session.id,
            'command': 'release'
        })
    assert resp2.status == 200
    assert endpoints.session is None
    await async_server['com.opentrons.hardware'].cache_instruments({
        types.Mount.LEFT:  None,
        types.Mount.RIGHT: 'p300_multi_v1'
    })
    resp3 = await async_client.post('/calibration/deck/start')
    assert resp3.status == 201


async def test_forcing_new_session(
        async_server, async_client, monkeypatch, dc_session):
    """
    Tests that the GET request to initiate a session manager for factory
    calibration returns an error if a session is in progress, and can be
    overridden.
    """
    test_model = 'p300_multi_v1'
    dummy_token = 'fake token'

    def uuid_mock():
        return dummy_token

    async def mock_release(data):
        return data

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    resp1 = await async_client.post('/calibration/deck/start')
    assert resp1.status == 409

    monkeypatch.setattr(endpoints, 'release', mock_release)

    resp2 = await async_client.post(
        '/calibration/deck/start', json={'force': 'true'})
    text2 = await resp2.json()
    assert resp2.status == 201
    expected2 = {
        'token': dummy_token,
        'pipette': {
            'mount': 'right',
            'model': test_model
        }
    }
    assert text2 == expected2


async def test_incorrect_token(async_client, dc_session):
    """
    Test that putting in an incorrect token for a POST request does not work
    after a session was already created with a different token.
    """
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
# TODO(mc, 2018-05-02): this does not adequately test z to smoothie axis logic
async def test_set_and_jog_integration(
        async_client, async_server, monkeypatch):
    """
    Test that the jog function works.
    Note that in order for the jog function to work, the following must
    be done:
    1. Create a session manager

    Then jog requests will work as expected.
    """
    test_model = 'p300_multi_v1'
    hardware = async_server['com.opentrons.hardware']
    # Why does this need to be awaited for a synch adapter
    await hardware.cache_instruments(
        {types.Mount.LEFT: None, types.Mount.RIGHT: test_model})

    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    token_res = await async_client.post('/calibration/deck/start')
    assert token_res.status == 201, token_res
    token_text = await token_res.json()
    token = token_text['token']

    axis = 'z'
    direction = 1
    step = 3
    # left pipette z carriage motor is smoothie axis "Z", right is "A"
    sess = endpoints.session
    sess.adapter.home()
    prior_x, prior_y, prior_z = endpoints.position(
        sess.current_mount, sess.adapter, sess.cp)

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

    assert '{}'.format((prior_x, prior_y, prior_z + step)) in msg
