import json
from copy import deepcopy
from opentrons import robot
from opentrons.server.main import init
from opentrons.drivers.smoothie_drivers.driver_3_0 import SmoothieDriver_3_0_0
from opentrons.instruments.pipette_config import configs


async def test_get_pipettes_uncommissioned(
        virtual_smoothie_env, loop, test_client, monkeypatch):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    def mock_parse_fail(self, gcode, mount):
        pass

    monkeypatch.setattr(
        SmoothieDriver_3_0_0, '_read_from_pipette', mock_parse_fail)

    expected = {
        "left": {
            "mount_axis": "z",
            "plunger_axis": "b",
            "model": None
        },
        "right": {
            "mount_axis": "a",
            "plunger_axis": "c",
            "model": None
        }
    }

    robot._driver.simulating = False
    resp = await cli.get('/pipettes')
    robot._driver.simulating = True
    text = await resp.text()
    assert resp.status == 200
    assert json.loads(text) == expected


async def test_get_pipettes(
        virtual_smoothie_env, loop, test_client, monkeypatch):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    model = list(configs.values())[0]
    expected = {
        'left': {
            'model': model.name,
            'tip_length': model.tip_length,
            'mount_axis': 'z',
            'plunger_axis': 'b'
        },
        'right': {
            'model': model.name,
            'tip_length': model.tip_length,
            'mount_axis': 'a',
            'plunger_axis': 'c'
        }
    }

    resp = await cli.get('/pipettes')
    text = await resp.text()
    assert resp.status == 200
    assert json.loads(text) == expected


async def test_disengage_axes(
        virtual_smoothie_env, loop, test_client, monkeypatch):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    def mock_send(self, command, timeout=None):
        pass

    monkeypatch.setattr(
        SmoothieDriver_3_0_0, '_send_command', mock_send)

    alltrue = {
        "x": {"enabled": True},
        "y": {"enabled": True},
        "z": {"enabled": True},
        "a": {"enabled": True},
        "b": {"enabled": True},
        "c": {"enabled": True}}
    res0 = await cli.get('/motors/engaged')
    result0 = await res0.text()
    assert res0.status == 200
    assert json.loads(result0) == alltrue

    postres = await cli.post('/motors/disengage', json={'axes': ['X', 'B']})
    assert postres.status == 200

    xbfalse = deepcopy(alltrue)
    xbfalse["x"]["enabled"] = False
    xbfalse["b"]["enabled"] = False
    res1 = await cli.get('/motors/engaged')
    result1 = await res1.text()
    assert res1.status == 200
    assert json.loads(result1) == xbfalse

    robot.home()
    res2 = await cli.get('/motors/engaged')
    result2 = await res2.text()
    assert res2.status == 200
    assert json.loads(result2) == alltrue


async def test_robot_info(virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    res = await cli.get('/robot/positions')
    assert res.status == 200

    text = await res.text()
    body = json.loads(text)
    assert body['positions']['change_pipette']['target'] == 'mount'
    assert len(body['positions']['change_pipette']['left']) == 3
    assert len(body['positions']['change_pipette']['right']) == 3
    assert body['positions']['attach_tip']['target'] == 'pipette'
    assert len(body['positions']['attach_tip']['point']) == 3


async def test_home_pipette(virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    test_data = {
        'target': 'pipette',
        'mount': 'left'}

    res = await cli.post('/robot/home', json=test_data)
    assert res.status == 200

    res2 = await cli.post('/robot/home', json=test_data)
    assert res2.status == 200


async def test_home_robot(virtual_smoothie_env, loop, test_client):

    app = init(loop)
    cli = await loop.create_task(test_client(app))

    test_data = {
        'target': 'robot'}

    res = await cli.post('/robot/home', json=test_data)

    assert res.status == 200


async def test_home_pipette_bad_request(
        virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    test_data = {}
    res = await cli.post('/robot/home', json=test_data)

    assert res.status == 400

    test_data_2 = {
        'target': 'pipette',
        'mount': 'fake_mount'}

    res2 = await cli.post('/robot/home', json=test_data_2)

    assert res2.status == 400

    test_data_3 = {
        'mount': 'left'}

    res3 = await cli.post('/robot/home', json=test_data_3)

    assert res3.status == 400

    test_data_4 = {
        'target': 'pipette'}

    res4 = await cli.post('/robot/home', json=test_data_4)

    assert res4.status == 400


async def test_move_bad_request(virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    data0 = {
        'target': 'other'
    }
    res = await cli.post('/robot/move', json=data0)
    assert res.status == 400

    data1 = {
        'target': 'mount',
        'point': (1, 2, 3, 4)
    }
    res = await cli.post('/robot/move', json=data1)
    assert res.status == 400

    data2 = {
        'target': 'mount',
        'point': (1, 2, 3),
        'mount': 'middle'
    }
    res = await cli.post('/robot/move', json=data2)
    assert res.status == 400

    data3 = {
        'target': 'pipette',
        'point': (1, 2, 3),
        'mount': 'left',
        'model': 'p9000+'
    }
    res = await cli.post('/robot/move', json=data3)
    assert res.status == 400


async def test_move_mount(virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))
    robot.home()
    # from opentrons.trackers import pose_tracker
    # print("Before: {}".format(tuple(
    #             pose_tracker.absolute(
    #                 robot.poses, robot._actuators['right']['carriage']))))
    data = {
        'target': 'mount',
        'point': [100, 200, 50],
        'mount': 'right'
    }
    res = await cli.post('/robot/move', json=data)
    assert res.status == 200
    # text = await res.text()
    # print("After: {}".format(tuple(
    #             pose_tracker.absolute(
    #                 robot.poses, robot._actuators['right']['carriage']))))
    # print("=-> Result: {}".format(text))


async def test_move_pipette(virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))
    robot.home()
    # from opentrons.trackers import pose_tracker
    # print("Before: {}".format(tuple(
    #             pose_tracker.absolute(
    #                 robot.poses, robot._actuators['right']['carriage']))))
    data = {
        'target': 'pipette',
        'point': [100, 200, 50],
        'mount': 'right',
        'model': 'p300_single'
    }
    res = await cli.post('/robot/move', json=data)
    assert res.status == 200
    # text = await res.text()
    # print("Final: {}".format(tuple(
    #             pose_tracker.absolute(
    #                 robot.poses, robot._actuators['right']['carriage']))))
    # print("=-> Result: {}".format(text))
