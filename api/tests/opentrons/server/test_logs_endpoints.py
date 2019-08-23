import json
from opentrons import config
from opentrons.server import init


async def test_log_endpoints(
        virtual_smoothie_env, loop, aiohttp_client):
    app = init()
    cli = await loop.create_task(aiohttp_client(app))

    # # Test that values are set correctly
    serial_name = "serial.log"
    serial_file = config.CONFIG['log_dir']/serial_name
    data1 = {'serial': 'No, CEREAL!'}
    with open(serial_file, 'w') as data_file:
        json.dump(data1, data_file)

    s1 = await cli.get('/logs/serial.log')
    s1body = await s1.text()
    assert json.loads(s1body) == data1

    api_name = "api.log"
    api_file = config.CONFIG['log_dir']/api_name
    data2 = {'api': 'application program interface'}
    with open(api_file, 'w') as data_file:
        json.dump(data2, data_file)

    a1 = await cli.get('/logs/api.log')
    a1body = await a1.text()
    assert json.loads(a1body) == data2
