import json
from copy import deepcopy
from opentrons import robot
from opentrons.server.main import init
from opentrons.drivers.smoothie_drivers import driver_3_0


async def test_get_pipettes_uncommissioned(
        virtual_smoothie_env, loop, test_client, monkeypatch):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    def mock_parse_fail(smoothie_response):
        return ''

    monkeypatch.setattr(driver_3_0, '_parse_instrument_data', mock_parse_fail)

    expected = '{"left": null, "right": null}'
    resp = await cli.get('/pipettes')
    text = await resp.text()
    assert resp.status == 200
    assert text == expected


async def test_get_pipettes(
        virtual_smoothie_env, loop, test_client, monkeypatch):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    dummy_by_mount = {
        'left': {
            'model': 'p10_multi'
        },
        'right': {
            'model': 'p300_single'
        }
    }

    def mock_parse_p300(self, gcode, mount):
        return dummy_by_mount[mount]['model']

    monkeypatch.setattr(
        driver_3_0.SmoothieDriver_3_0_0, '_read_from_pipette', mock_parse_p300)

    expected = json.dumps(dummy_by_mount)
    resp = await cli.get('/pipettes')
    text = await resp.text()
    assert resp.status == 200
    assert text == expected


async def test_disengage_axes(
        virtual_smoothie_env, loop, test_client, monkeypatch):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    def mock_send(self, command, timeout=None):
        pass

    monkeypatch.setattr(
        driver_3_0.SmoothieDriver_3_0_0, '_send_command', mock_send)

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
