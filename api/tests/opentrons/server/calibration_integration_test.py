import numpy as np
from opentrons import robot
from opentrons import deck_calibration as dc
from opentrons.deck_calibration import endpoints
from opentrons.drivers.smoothie_drivers.driver_3_0 import SmoothieDriver_3_0_0
from opentrons.trackers.pose_tracker import absolute
from opentrons.instruments.pipette_config import Y_OFFSET_MULTI


# Note that several values in this file have target/expected values that do not
# accurately reflect robot operation, because of differences between return
# values from the driver during simulating vs. non-simulating modes. In
# particular, during simulating mode the driver's `position` method returns
# the xyz position of the tip of the pipette, but during non-simulating mode
# it returns a position that correponds roughly to the gantry (e.g.: where the
# Smoothie board sees the position of itself--after a fashion). Simulating mode
# should be replaced with something that accurately reflects actual robot
# operation, and then these tests should be revised to match expected reality.

async def test_transform_from_moves(async_client, monkeypatch):
    test_mount, test_model = ('left', 'p300_multi_v1')
    # test_mount, test_model = ('right', 'p300_single_v1')

    def dummy_read_model(self, mount):
        if mount == test_mount:
            return test_model
        else:
            return None

    monkeypatch.setattr(
        SmoothieDriver_3_0_0, 'read_pipette_model', dummy_read_model)

    robot.reset()
    robot.cache_instrument_models()
    robot.home()

    # This is difficult to test without the `async_client` because it has to
    # take an `aiohttp.web.Request` object as a parameter instead of a dict
    resp = await async_client.post('/calibration/deck/start')
    start_res = await resp.json()
    token = start_res.get('token')

    assert start_res.get('pipette', {}).get('mount') == test_mount
    assert start_res.get('pipette', {}).get('model') == test_model

    res = await async_client.post('/calibration/deck', json={
        'token': token, 'command': 'attach tip', 'tipLength': 51.7})
    assert res.status == 200

    res = await async_client.post('/calibration/deck', json={
        'token': token, 'command': 'move', 'point': 'safeZ'})
    assert res.status == 200
    jogres = await async_client.post('/calibration/deck', json={
        'token': token,
        'command': 'jog',
        'axis': 'z',
        'direction': -1,
        'step': 4.5})
    assert jogres.status == 200
    res = await async_client.post('/calibration/deck', json={
        'token': token, 'command': 'save z'})
    assert res.status == 200

    pipette = endpoints.session.pipettes[test_mount]

    res = await async_client.post('/calibration/deck', json={
        'token': token, 'command': 'move', 'point': '1'})
    assert res.status == 200
    pt1 = endpoints.safe_points().get('1')
    if 'multi' in test_model:
        expected1 = (
            pt1[0],
            pt1[1] + 2 * Y_OFFSET_MULTI,
            pt1[2])
    else:
        expected1 = pt1
    assert np.isclose(absolute(robot.poses, pipette), expected1).all()

    # Jog to calculated position for transform
    x_delta1 = 13.16824337 - dc.endpoints.safe_points()['1'][0]
    y_delta1 = 8.30855312 - dc.endpoints.safe_points()['1'][1]
    jogres = await async_client.post('/calibration/deck', json={
        'token': token,
        'command': 'jog',
        'axis': 'x',
        'direction': 1,
        'step': x_delta1})
    assert jogres.status == 200
    jogres = await async_client.post('/calibration/deck', json={
        'token': token,
        'command': 'jog',
        'axis': 'y',
        'direction': 1,
        'step': y_delta1})
    assert jogres.status == 200

    res = await async_client.post('/calibration/deck', json={
        'token': token, 'command': 'save xy', 'point': '1'})
    assert res.status == 200

    res = await async_client.post('/calibration/deck', json={
        'token': token, 'command': 'move', 'point': '2'})
    assert res.status == 200
    pt2 = endpoints.safe_points().get('2')
    if 'multi' in test_model:
        expected2 = (
            pt2[0],
            pt2[1] + 2 * Y_OFFSET_MULTI,
            pt2[2])
    else:
        expected2 = pt2
    assert np.isclose(absolute(robot.poses, pipette), expected2).all()

    # Jog to calculated position for transform
    x_delta2 = 380.50507635 - dc.endpoints.safe_points()['2'][0]
    y_delta2 = -23.82925545 - dc.endpoints.safe_points()['2'][1]
    jogres = await async_client.post('/calibration/deck', json={
        'token': token,
        'command': 'jog',
        'axis': 'x',
        'direction': 1,
        'step': x_delta2})
    assert jogres.status == 200
    jogres = await async_client.post('/calibration/deck', json={
        'token': token,
        'command': 'jog',
        'axis': 'y',
        'direction': 1,
        'step': y_delta2})
    assert jogres.status == 200

    res = await async_client.post('/calibration/deck', json={
        'token': token, 'command': 'save xy', 'point': '2'})
    assert res.status == 200

    res = await async_client.post('/calibration/deck', json={
        'token': token, 'command': 'move', 'point': '3'})
    assert res.status == 200
    pt3 = endpoints.safe_points().get('3')
    if 'multi' in test_model:
        expected3 = (
            pt3[0],
            pt3[1] + 2 * Y_OFFSET_MULTI,
            pt3[2])
    else:
        expected3 = pt3
    assert np.isclose(absolute(robot.poses, pipette), expected3).all()

    # Jog to calculated position for transform
    x_delta3 = 34.87002331 - dc.endpoints.safe_points()['3'][0]
    y_delta3 = 256.36103295 - dc.endpoints.safe_points()['3'][1]
    jogres = await async_client.post('/calibration/deck', json={
        'token': token,
        'command': 'jog',
        'axis': 'x',
        'direction': 1,
        'step': x_delta3})
    assert jogres.status == 200
    jogres = await async_client.post('/calibration/deck', json={
        'token': token,
        'command': 'jog',
        'axis': 'y',
        'direction': 1,
        'step': y_delta3})
    assert jogres.status == 200

    res = await async_client.post('/calibration/deck', json={
        'token': token, 'command': 'save xy', 'point': '3'})
    assert res.status == 200

    res = await async_client.post('/calibration/deck', json={
        'token': token, 'command': 'save transform'})
    assert res.status == 200
    res = await async_client.post('/calibration/deck', json={
        'token': token, 'command': 'release'})
    assert res.status == 200

    # This transform represents a 5 degree rotation, with a shift in x, y, & z.
    # Values for the points and expected transform come from a hand-crafted
    # transformation matrix and the points that would generate that matrix.
    cos_5deg_p = 0.99619469809
    sin_5deg_p = 0.08715574274
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

    actual_transform = robot.config.gantry_calibration
    from pprint import pprint
    print()
    print("Expected transform [type: {}]:".format(type(expected_transform)))
    pprint(expected_transform)

    print()
    print("Actual transform [type: {}]:".format(type(actual_transform)))
    pprint(actual_transform)
    assert np.allclose(actual_transform, expected_transform)
