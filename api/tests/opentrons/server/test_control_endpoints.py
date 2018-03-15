import json
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
