import numpy as np

from opentrons import types

from opentrons import deck_calibration as dc
from opentrons.deck_calibration import endpoints
from opentrons.hardware_control.types import CriticalPoint

# Note that several values in this file have target/expected values that do not
# accurately reflect robot operation, because of differences between return
# values from the driver during simulating vs. non-simulating modes. In
# particular, during simulating mode the driver's `position` method returns
# the xyz position of the tip of the pipette, but during non-simulating mode
# it returns a position that correponds roughly to the gantry (e.g.: where the
# Smoothie board sees the position of itself--after a fashion). Simulating mode
# should be replaced with something that accurately reflects actual robot
# operation, and then these tests should be revised to match expected reality.


async def test_transform_from_moves_v2(
        hardware, monkeypatch):
    test_mount, test_model = (types.Mount.LEFT, 'p300_multi')

    await hardware.reset()
    await hardware.cache_instruments({
        test_mount: test_model})
    await hardware.home()
    resp = await dc.endpoints.create_session(False, hardware=hardware)
    token = resp.token
    assert resp.pipette.get('mount') == 'left'
    assert resp.pipette.get('model') == test_model + '_v1'

    await dc.endpoints.attach_tip({'tipLength': 51.7})

    await dc.endpoints.move({'point': 'safeZ'})

    await dc.endpoints.run_jog({
        'token': token,
        'command': 'jog',
        'axis': 'z',
        'direction': -1,
        'step': 4.5})

    await dc.endpoints.save_z({})

    await dc.endpoints.move({'point': '1'})

    expected1 = endpoints.safe_points().get('1')
    coordinates = await hardware.gantry_position(
        test_mount, critical_point=CriticalPoint.FRONT_NOZZLE)
    position = (
        coordinates.x,
        coordinates.y,
        coordinates.z)
    assert np.isclose(position, expected1).all()

    # Jog to calculated position for transform
    x_delta1 = 13.16824337 - dc.endpoints.safe_points()['1'][0]
    y_delta1 = 8.30855312 - dc.endpoints.safe_points()['1'][1]
    await dc.endpoints.run_jog({
        'axis': 'x',
        'direction': 1,
        'step': x_delta1})

    await dc.endpoints.run_jog({
        'axis': 'y',
        'direction': 1,
        'step': y_delta1
    })

    await dc.endpoints.save_xy({'point': '1'})

    await dc.endpoints.move({'point': '2'})

    expected2 = endpoints.safe_points().get('2')
    coordinates = await hardware.gantry_position(
        test_mount, critical_point=CriticalPoint.FRONT_NOZZLE)
    position = (
        coordinates.x,
        coordinates.y,
        coordinates.z)

    assert np.isclose(position, expected2).all()

    # Jog to calculated position for transform
    x_delta2 = 380.50507635 - dc.endpoints.safe_points()['2'][0]
    y_delta2 = -23.82925545 - dc.endpoints.safe_points()['2'][1]

    await dc.endpoints.run_jog({
        'axis': 'x',
        'direction': 1,
        'step': x_delta2})

    await dc.endpoints.run_jog({
        'axis': 'y',
        'direction': 1,
        'step': y_delta2})

    await dc.endpoints.save_xy({'point': '2'})

    await dc.endpoints.move({'point': '3'})

    expected3 = endpoints.safe_points().get('3')
    coordinates = await hardware.gantry_position(
        test_mount, critical_point=CriticalPoint.FRONT_NOZZLE)
    position = (
        coordinates.x,
        coordinates.y,
        coordinates.z)
    assert np.isclose(position, expected3).all()

    # Jog to calculated position for transform
    x_delta3 = 34.87002331 - dc.endpoints.safe_points()['3'][0]
    y_delta3 = 256.36103295 - dc.endpoints.safe_points()['3'][1]

    await dc.endpoints.run_jog({
        'axis': 'x',
        'direction': 1,
        'step': x_delta3})

    await dc.endpoints.run_jog({
        'axis': 'y',
        'direction': 1,
        'step': y_delta3})

    await dc.endpoints.save_xy({'point': '3'})

    await dc.endpoints.save_transform({})

    await dc.endpoints.release({})

    # This transform represents a 5 degree rotation, with a shift in x, y, & z.
    # Values for the points and expected transform come from a hand-crafted
    # transformation matrix and the points that would generate that matrix.
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

    conf = hardware.config
    actual_transform = conf.gantry_calibration
    assert np.allclose(actual_transform, expected_transform)
