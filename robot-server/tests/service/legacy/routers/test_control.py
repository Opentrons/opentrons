from asyncio import Event
from unittest.mock import call, MagicMock

import pytest
from opentrons.hardware_control.types import Axis, CriticalPoint
from opentrons.types import Mount, Point

from robot_server.service.legacy.routers import control


def test_robot_info(api_client):
    res = api_client.get('/robot/positions')
    assert res.status_code == 200

    body = res.json()
    assert body['positions']['change_pipette']['target'] == 'mount'
    assert len(body['positions']['change_pipette']['left']) == 3
    assert len(body['positions']['change_pipette']['right']) == 3
    assert body['positions']['attach_tip']['target'] == 'pipette'
    assert len(body['positions']['attach_tip']['point']) == 3


@pytest.fixture
def hardware_home(hardware):
    """Fixture for home handlers"""
    async def mock_func(*args, **kwargs):
        pass

    hardware.home.side_effect = mock_func
    hardware.home_plunger.side_effect = mock_func
    return hardware


@pytest.mark.parametrize(argnames="mount_name,mount",
                         argvalues=[
                             ["left", Mount.LEFT],
                             ["right", Mount.RIGHT]
                         ])
def test_home_pipette(api_client, hardware_home, mount_name, mount):
    test_data = {
        'target': 'pipette',
        'mount': mount_name
    }

    res = api_client.post('/robot/home', json=test_data)
    assert res.json() == {"message": f"Pipette on {mount_name}"
                                     f" homed successfully"}
    assert res.status_code == 200
    hardware_home.home.assert_called_once_with([Axis.by_mount(mount)])
    hardware_home.home_plunger.assert_called_once_with(mount)


def test_home_robot(api_client, hardware_home):
    test_data = {
        'target': 'robot',
    }

    res = api_client.post('/robot/home', json=test_data)
    assert res.json() == {"message": "Homing robot."}
    assert res.status_code == 200
    hardware_home.home.assert_called_once()


@pytest.mark.parametrize(argnames="test_data",
                         argvalues=[
                             {},
                             {'target': 'pipette', 'mount': 'fake_mount'},
                             {'mount': 'left'},
                             {'target': 'pipette'},
                         ])
def test_home_pipette_bad_request(test_data, api_client):
    res = api_client.post('/robot/home', json=test_data)
    assert res.status_code == 422


@pytest.fixture
def hardware_move(hardware):
    """Fixture for move handler tests"""
    async def mock_func(*args, **kwargs):
        pass

    hardware.cache_instruments.side_effect = mock_func
    hardware.home_z.side_effect = mock_func

    state = {
        'cur_pos': Point(0, 0, 0)
    }

    async def mock_gantry_position(mount,
                                   critical_point=None,
                                   refresh=False):
        return state['cur_pos']

    async def mock_move_to(mount, abs_position, speed=None,
                           critical_point=None, max_speeds=None):
        state['cur_pos'] = abs_position

    hardware.gantry_position.side_effect = mock_gantry_position
    hardware.move_to.side_effect = mock_move_to

    return hardware


@pytest.mark.parametrize(argnames="test_data",
                         argvalues=[
                             {},
                             {'target': 'other'},
                             {'target': 'mount',
                              # Too many points
                              'point': (1, 2, 3, 4)},
                             {'target': 'mount',
                              'point': (1, 2, 33),
                              # Bad mount
                              'mount': 'middle'},
                             {'target': 'mount',
                              # [2] is < 30
                              'point': (1, 2, 3),
                              'mount': 'right'}
                         ])
def test_move_bad_request(test_data, api_client):
    res = api_client.post('/robot/move', json=test_data)
    assert res.status_code == 422


def test_move_mount(api_client, hardware_move):
    data = {
        'target': 'mount',
        'point': [100, 200, 50],
        'mount': 'right'
    }
    res = api_client.post('/robot/move', json=data)
    assert res.status_code == 200
    assert res.json() == {
        "message": "Move complete. New position: (100.0, 200.0, 50.0)"}

    hardware_move.cache_instruments.assert_called_once()

    hardware_move.gantry_position.assert_has_calls([
        call(Mount.RIGHT, critical_point=CriticalPoint.MOUNT),
        call(Mount.RIGHT),
    ])
    hardware_move.move_to.assert_has_calls([
        call(Mount.RIGHT,
             Point(100.0, 200.0, 0.0),
             critical_point=CriticalPoint.MOUNT),
        call(Mount.RIGHT,
             Point(100.0, 200.0, 50.0),
             critical_point=CriticalPoint.MOUNT),
    ])


def test_move_pipette(api_client, hardware_move):
    data = {
        'target': 'pipette',
        'point': [50, 100, 25],
        'mount': 'left',
        'model': 'p300_single_v1'
    }
    res = api_client.post('/robot/move', json=data)
    assert res.status_code == 200
    assert res.json() == {
        "message": "Move complete. New position: (50.0, 100.0, 25.0)"}

    hardware_move.cache_instruments.assert_called_once()

    hardware_move.gantry_position.assert_has_calls([
        call(Mount.LEFT, critical_point=None),
        call(Mount.LEFT),
    ])
    hardware_move.move_to.assert_has_calls([
        call(Mount.LEFT,
             Point(50.0, 100.0, 0.0),
             critical_point=None),
        call(Mount.LEFT,
             Point(50.0, 100.0, 25.0),
             critical_point=None),
    ])


@pytest.fixture
def hardware_rail_lights(hardware):
    async def mock_set_lights(*args, **kwargs):
        pass

    hardware.set_lights.side_effect = mock_set_lights
    return hardware


@pytest.mark.parametrize(
    argnames="on_value",
    argvalues=[
        True,
        False
    ]
)
def test_rail_lights_get(on_value, api_client, hardware_rail_lights):
    hardware_rail_lights.get_lights.return_value = {'rails': on_value}
    resp = api_client.get('/robot/lights')
    assert resp.status_code == 200
    data = resp.json()
    assert data == {'on': on_value}


@pytest.mark.parametrize(
    argnames="request_body",
    argvalues=[
        {},
        {'on': 'not on'},
    ]
)
def test_robot_lights_set_bad(request_body, api_client, hardware_rail_lights):
    resp = api_client.post('/robot/lights',
                           json=request_body)
    assert resp.status_code == 422
    hardware_rail_lights.set_lights.assert_not_called()


@pytest.mark.parametrize(
    argnames="on_value",
    argvalues=[
        True,
        False
    ]
)
def test_robot_lights_set(on_value, api_client, hardware_rail_lights):
    async def mock_set_lights(*args, **kwargs):
        pass

    resp = api_client.post('/robot/lights',
                           json={'on': on_value})
    assert resp.status_code == 200
    data = resp.json()
    assert data == {'on': on_value}
    hardware_rail_lights.set_lights.assert_called_once_with(rails=on_value)


def test_identify(api_client, hardware):
    async def mock_identify(duration_s):
        pass

    hardware.identify.side_effect = mock_identify
    res = api_client.post("/identify?seconds=100")
    assert res.status_code == 200
    assert res.json() == {"message": "identifying"}

    hardware.identify.assert_called_once_with(100)


@pytest.mark.parametrize(argnames="blocking_call,blocking_call_data",
                         argvalues=[
                             # The blocking call is a home
                             [control.post_home_robot,
                              control.control.RobotHomeTarget(
                                  target=control.control.HomeTarget.robot
                              )
                              ],
                             # The blocking call is a move
                             [control.post_move_robot,
                              None
                              ]
                         ])
async def test_concurrent_motion_fails(hardware,
                                       loop,
                                       blocking_call,
                                       blocking_call_data):
    """A test that while a HOME or MOVE is happening, other HOME and MOVE
     requests will fail."""

    event = Event()

    # A wait that will happen within motion lock
    async def wait_on_event(*args, **kwargs):
        await event.wait()

    # Mock HOME to wait on event
    hardware.home.side_effect = wait_on_event

    # Mock _do_move to wait on event
    control._do_move = MagicMock(side_effect=wait_on_event)

    lock = control.ThreadedAsyncLock()

    # Call will pause on event.
    blocking = loop.create_task(blocking_call(
        blocking_call_data,
        hardware=hardware,
        motion_lock=lock
    ))

    # Wrap a failing coroutine
    async def failure(func):
        with pytest.raises(control.V1HandlerError) as exc_info:
            await func
        assert exc_info.value.status_code == 403
        assert exc_info.value.message.find('Robot is currently moving') == 0

    forbidden_home = loop.create_task(
        failure(
            control.post_home_robot(
                robot_home_target=control.control.RobotHomeTarget(
                    target=control.control.HomeTarget.robot
                ),
                hardware=hardware,
                motion_lock=lock
            )
        )
    )
    forbidden_move = loop.create_task(
        failure(
            control.post_move_robot(
                robot_move_target=None,
                hardware=hardware,
                motion_lock=lock
            )
        )
    )
    await forbidden_home
    await forbidden_move
    event.set()
    await blocking
