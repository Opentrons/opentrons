import pytest
import numpy as np

from opentrons.deck_calibration import endpoints
from opentrons.config import robot_configs
from opentrons import types


# Note that several tests in this file have target/expected values that do not
# accurately reflect robot operation, because of differences between return
# values from the driver during simulating vs. non-simulating modes. In
# particular, during simulating mode the driver's `position` method returns
# the xyz position of the tip of the pipette, but during non-simulating mode
# it returns a position that corresponds roughly to the gantry (e.g.: where the
# Smoothie board sees the position of itself--after a fashion). Simulating mode
# should be replaced with something that accurately reflects actual robot
# operation, and then these tests should be revised to match expected reality.

# ------------ Function tests (unit) ----------------------


async def test_add_and_remove_tip(dc_session, instruments):
    hardware = dc_session.adapter
    hardware.reset()
    hardware.cache_instruments({
        types.Mount.LEFT: 'p10_single'})
    pip = hardware.attached_instruments[types.Mount.LEFT]
    dc_session.current_mount = types.Mount.LEFT
    mount = dc_session.current_mount
    dc_session.pipettes = {mount: pip}

    # Check malformed packet
    res0 = await endpoints.attach_tip({})
    assert res0.success is False
    assert dc_session.tip_length is None
    assert hardware.attached_instruments[mount]['has_tip'] is False

    # Check correct attach command
    tip_length = 50
    res1 = await endpoints.attach_tip({'tipLength': tip_length})
    assert res1.success is True
    assert dc_session.tip_length == tip_length
    assert hardware.attached_instruments[mount]['has_tip'] is True

    # Check command with tip already attached
    res2 = await endpoints.attach_tip({'tipLength': tip_length + 5})
    assert res2.success is True
    assert dc_session.tip_length == tip_length + 5
    assert hardware.attached_instruments[mount]['has_tip'] is True

    # Check correct detach command
    res3 = await endpoints.detach_tip({})
    assert res3.success is True
    assert dc_session.tip_length is None
    assert hardware.attached_instruments[mount]['has_tip'] is False

    # Check command with no tip
    res4 = await endpoints.detach_tip({})
    assert res4.success is True
    assert dc_session.tip_length is None
    assert hardware.attached_instruments[mount]['has_tip'] is False


async def test_save_xy(dc_session, instruments):
    hardware = dc_session.adapter
    mount = types.Mount.LEFT
    hardware.reset()
    hardware.cache_instruments({
        mount: 'p10_single'})
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


async def test_save_z(dc_session, monkeypatch, instruments):
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
        mount: 'p10_single'})
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
@pytest.mark.parametrize('left,right,correct', [
        ('p300_multi_v1', 'p10_single_v1', 'p10_single_v1'),
        ('p300_single_v1', 'p10_single_v1', 'p10_single_v1'),
        ('p10_multi_v1', 'p300_multi_v1', 'p300_multi_v1'),
        (None, 'p10_single_v1', 'p10_single_v1'),
        ('p300_multi_v1', None, 'p300_multi_v1'),
        ('p10_single_v1', 'p300_multi_v1', 'p10_single_v1')])
async def test_create_session(hardware, monkeypatch, left, right, correct):
    """
    Tests that the call to initiate a session manager for factory
    calibration returns a good token, along with the correct preferred pipette
    """
    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    # each tuple in this list is (left-mount, right-mount, correct-choice)

    hardware.managed_obj._backend._attached_instruments = {
        types.Mount.LEFT: {'model': left, 'id': None},
        types.Mount.RIGHT: {'model': right, 'id': None}
    }
    await hardware.cache_instruments()
    resp = await endpoints.create_session(False, hardware)
    endpoints.session_wrapper.session = None

    assert resp.token == dummy_token
    assert resp.pipette.get('model') == correct


async def test_create_session_fail(monkeypatch, hardware):
    """
    Tests that the call to initiate a session manager for factory
    calibration fails with forbidden error
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

    with pytest.raises(endpoints.SessionForbidden,
                       match="Error, pipette not recognized"):
        await endpoints.create_session(force=False, hardware=hardware)

    assert endpoints.session_wrapper.session is None


async def test_release(hardware, monkeypatch, dc_session):
    """
    Tests that the call to initiate a session manager for factory
    calibration returns an error if a session is in progress and that calling
    release will enable starting a new session
    """
    with pytest.raises(endpoints.SessionInProgress,
                       match="Error, session in progress"):
        await endpoints.create_session(False, hardware)

    # Release
    release_result = await endpoints.dispatch(dc_session.id, "release", None)
    assert release_result.success is True
    assert endpoints.session_wrapper.session is None

    # Set up pipettes
    await hardware.cache_instruments({
        types.Mount.RIGHT: 'p300_multi'
    })

    # Create a new session
    create_result = await endpoints.create_session(False, hardware)
    assert create_result is not None


async def test_forcing_new_session(hardware, monkeypatch, dc_session):
    """
    Tests that the call to initiate a session manager for factory
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

    with pytest.raises(endpoints.SessionInProgress,
                       match="Error, session in progress"):
        await endpoints.create_session(False, hardware)

    monkeypatch.setattr(endpoints, 'release', mock_release)

    # Force creation of new session
    resp = await endpoints.create_session(True, hardware)

    assert resp.token == dummy_token
    assert resp.pipette == {
            'mount': 'right',
            'model': test_model
    }


async def test_incorrect_token(dc_session):
    """
    Test that putting in an incorrect token for a dispatch call does not work
    after a session was already created with a different token.
    """
    with pytest.raises(endpoints.SessionForbidden,
                       match="Invalid token: FAKE TOKEN"):
        await endpoints.dispatch(token='FAKE TOKEN',
                                 command='init pipette',
                                 command_data={
                                     'mount': 'left',
                                     'model': 'p10_single_v1'
                                 })


async def test_invalid_command(dc_session):
    """
    Test that an unknown command to dispatch will raise an error.
    """
    with pytest.raises(endpoints.SessionForbidden,
                       match="Command \"do something wrong\""):
        await endpoints.dispatch(token=dc_session.id,
                                 command='do something wrong',
                                 command_data={
                                     'mount': 'left',
                                     'model': 'p10_single_v1'
                                 })


# ------------ Router tests (integration) ----------------------
# TODO(mc, 2018-05-02): this does not adequately test z to smoothie axis logic
async def test_set_and_jog_integration(hardware, monkeypatch):
    """
    Test that the jog function works.
    Note that in order for the jog function to work, the following must
    be done:
    1. Create a session manager

    Then jog requests will work as expected.
    """
    test_model = 'p300_multi'
    # Why does this need to be awaited for a synch adapter
    await hardware.cache_instruments(
        {types.Mount.RIGHT: test_model})

    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    token_res = await endpoints.create_session(False, hardware)
    assert token_res.token == dummy_token
    token = token_res.token

    axis = 'z'
    direction = 1
    step = 3
    # left pipette z carriage motor is smoothie axis "Z", right is "A"
    sess = endpoints.session_wrapper.session
    sess.adapter.home()
    prior_x, prior_y, prior_z = endpoints.position(
        sess.current_mount, sess.adapter, sess.cp)

    resp = await endpoints.dispatch(
        token=token,
        command='jog',
        command_data={
            'axis': axis,
            'direction': direction,
            'step': step
        })

    assert resp.success is True
    msg = resp.message
    assert '{}'.format((prior_x, prior_y, prior_z + step)) in msg
    endpoints.session_wrapper.session = None


@pytest.mark.parametrize(argnames="command_data",
                         argvalues=[
                             {},
                             {"point": "Z"},
                             {"point": "att"},
                             {"point": None}
                         ])
async def test_move_no_point(command_data, dc_session):
    resp = await endpoints.dispatch(
        token=dc_session.id,
        command='move',
        command_data=command_data)

    assert resp.success is False
    assert resp.message == '"point" must be one of "1", "2", "3",' \
                           ' "safeZ", "attachTip"'


async def test_move_basic(dc_session):
    dc_session.current_mount = endpoints.Mount.RIGHT
    resp = await endpoints.dispatch(
        token=dc_session.id,
        command='move',
        command_data={
            "point": "attachTip"
        })

    assert resp.success is True
    assert resp.message == "Moved to (200, 90, 130)"


async def test_move_basic_typed(dc_session):
    dc_session.current_mount = endpoints.Mount.RIGHT
    resp = await endpoints.dispatch(
        token=dc_session.id,
        command='move',
        command_data={
            "point": endpoints.DeckCalibrationPoint.attachTip
        })

    assert resp.success is True
    assert resp.message == "Moved to (200, 90, 130)"
