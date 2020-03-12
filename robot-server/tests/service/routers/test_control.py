import pytest
from opentrons import types
from opentrons.hardware_control.types import Axis
from opentrons.types import Mount


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
    async def mock_home(*args, **kwargs):
        pass

    async def mock_home_plunger(*args, **kwargs):
        pass

    hardware.home.side_effect = mock_home
    hardware.home_plunger.side_effect = mock_home_plunger
    return hardware


def test_home_pipette(api_client, hardware_home):
    test_data = {
        'target': 'pipette',
        'mount': 'left'
    }

    res = api_client.post('/robot/home', json=test_data)
    assert res.json() == {"message": "Pipette on left homed successfully"}
    assert res.status_code == 200
    hardware_home.home.assert_called_once_with([Axis.by_mount(Mount.LEFT)])
    hardware_home.home_plunger.assert_called_once_with(Mount.LEFT)


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


def test_instrument_reuse(
        async_server, api_client, monkeypatch, instruments):
    hw = async_server['com.opentrons.hardware']

    # With no pipette connected before homing pipettes, we should a) not crash
    # and b) not have any instruments connected afterwards

    test_data = {
        'target': 'pipette',
        'mount': 'left'
    }

    res = api_client.post('/robot/home', json=test_data)
    assert res.status_code == 200

    res = api_client.get('/pipettes')
    data = res.json()
    assert data['left']['model'] is None

    # If we do have a pipette connected, if we home we should still have it
    # connected afterwards
    test_model = 'p300_multi_v1'
    hw._backend._attached_instruments = {
        types.Mount.RIGHT: {'model': test_model, 'id': 'dummy-id'},
        types.Mount.LEFT: {'model': test_model, 'id': 'dummy-id'}
    }

    res = api_client.get('/pipettes',
                         params=[('refresh', 'true')])
    data = res.json()
    assert data['left']['model'] == test_model

    res = api_client.post('/robot/home', json=test_data)
    assert res.status_code == 200

    res = api_client.get('/pipettes')
    data = res.json()

    assert data['left']['model'] == test_model


@pytest.fixture
def hardware_move(hardware):
    async def mock_home(*args, **kwargs):
        pass

    async def mock_home_plunger(*args, **kwargs):
        pass

    hardware.home.side_effect = mock_home
    hardware.home_plunger.side_effect = mock_home_plunger
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
                             {'target': 'pipette',
                              'point': (1, 2, 3),
                              'mount': 'left',
                              # Unknown Model
                              'model': 'p9000+'},
                             {'target': 'mount',
                              # [2] is < 30
                              'point': (1, 2, 3),
                              'mount': 'right'}
                         ])
def test_move_bad_request(test_data, api_client):
    res = api_client.post('/robot/move', json=test_data)
    assert res.status_code == 422


def test_move_mount(api_client):
    resp = api_client.post('/robot/home',
                           json={'target': 'robot'})
    assert resp.status_code == 200
    data = {
        'target': 'mount',
        'point': [100, 200, 50],
        'mount': 'right'
    }
    res = api_client.post('/robot/move', json=data)
    assert res.status_code == 200


def test_move_pipette(api_client):
    resp = api_client.post('/robot/home',
                           json={'target': 'robot'})
    assert resp.status_code == 200
    data = {
        'target': 'pipette',
        'point': [100, 200, 50],
        'mount': 'right',
        'model': 'p300_single_v1'
    }
    res = api_client.post('/robot/move', json=data)
    assert res.status_code == 200


def test_move_and_home_existing_pipette(
        async_server, api_client, instruments):
    hw = async_server['com.opentrons.hardware']
    # await hw.reset()
    resp = api_client.post('/robot/home', json={'target': 'robot'})
    assert resp.status_code == 200
    move_data = {
        'target': 'pipette',
        'point': [100, 200, 50],
        'mount': 'right',
        'model': 'p300_single_v1'
    }
    res = api_client.post('/robot/move', json=move_data)
    assert res.status_code == 200

    move_data = {
        'target': 'pipette',
        'mount': 'right'
    }
    res1 = api_client.post('/robot/home', json=move_data)
    assert res1.status_code == 200


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
