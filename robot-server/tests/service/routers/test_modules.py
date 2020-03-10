from pathlib import Path
from unittest.mock import patch

import pytest
import asyncio
from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.modules import utils, UpdateError, \
    BundledFirmware


@pytest.fixture
def magdeck():
    m = asyncio.get_event_loop().run_until_complete(
        utils.build(
            port='/dev/ot_module_magdeck1',
            which='magdeck',
            simulating=True,
            interrupt_callback=lambda x: None,
            execution_manager=ExecutionManager(loop=asyncio.get_event_loop()),
            loop=asyncio.get_event_loop()
        )
    )
    yield m


@pytest.fixture
def tempdeck():
    t = asyncio.get_event_loop().run_until_complete(
        utils.build(
            port='/dev/ot_module_tempdeck1',
            which='tempdeck',
            simulating=True,
            interrupt_callback=lambda x: None,
            execution_manager=ExecutionManager(loop=asyncio.get_event_loop()),
            loop=asyncio.get_event_loop()
        )
    )
    yield t

    # Have to stop the poller
    t._poller.join()


def test_get_modules(api_client, hardware, magdeck, tempdeck):
    hardware.attached_modules = [magdeck]

    keys = sorted(['name', 'port', 'serial', 'model', 'fwVersion',
                   'status', 'data', 'hasAvailableUpdate', 'revision',
                   'moduleModel', 'displayName'])

    resp = api_client.get('/modules')
    body = resp.json()
    assert resp.status_code == 200
    assert 'modules' in body
    assert len(body['modules']) == 1
    assert sorted(body['modules'][0].keys()) == keys
    assert 'engaged' in body['modules'][0]['data']

    hardware.attacked_modules = [tempdeck]

    for model in ('temp_deck_v1', 'temp_deck_v1.1', 'temp_deck_v2'):
        tempdeck._device_info['model'] = model
        resp = api_client.get('/modules')
        body = resp.json()
        assert resp.status_code == 200
        assert len(body['modules']) == 1
        assert not body['modules'][0]['hasAvailableUpdate']


def test_get_module_serial(api_client, hardware, magdeck, monkeypatch):
    hardware.attached_modules = [magdeck]

    resp = api_client.get('/modules/dummySerialMD/data')

    body = resp.json()
    assert resp.status_code == 200
    assert body == {"status": "disengaged",
                    "data": {
                        "engaged": False,
                        "height": 0
                    }}


def test_get_module_serial_no_match(api_client, hardware, magdeck):
    hardware.attached_modules = [magdeck]

    resp = api_client.get('/modules/onions/data')

    body = resp.json()
    assert resp.status_code == 404
    assert 'message' in body
    assert body['message'] == 'Module not found'


def test_get_module_serial_no_modules(api_client, hardware):
    hardware.attached_modules = []

    resp = api_client.get('/modules/dummySerialMD/data')

    body = resp.json()
    assert resp.status_code == 404
    assert 'message' in body
    assert body['message'] == 'Module not found'


def test_execute_module_command(api_client, hardware, magdeck):
    hardware.attached_modules = [magdeck]

    resp = api_client.post('/modules/dummySerialMD',
                           json={'command_type': 'deactivate'})
    body = resp.json()
    assert resp.status_code == 200
    assert 'message' in body
    assert body['message'] == 'Success'


def test_execute_module_command_no_modules(api_client, hardware):
    hardware.attached_modules = []

    resp = api_client.post('/modules/dummySerialMD',
                           json={'command_type': 'deactivate'})
    body = resp.json()
    assert resp.status_code == 404
    assert 'message' in body
    assert body['message'] == 'No connected modules'


def test_execute_module_command_bad_serial(api_client, hardware, magdeck):
    hardware.attached_modules = [magdeck]

    resp = api_client.post('/modules/tooDummySerialMD',
                           json={'command_type': 'deactivate'})
    body = resp.json()
    assert resp.status_code == 404
    assert 'message' in body
    assert body['message'] == 'Specified module not found'


def test_execute_module_command_bad_command(api_client, hardware, magdeck):
    hardware.attached_modules = [magdeck]

    command_type = "something that doesn't exist"

    resp = api_client.post('/modules/dummySerialMD',
                           json={'command_type': command_type})
    body = resp.json()
    assert resp.status_code == 400
    assert 'message' in body
    assert body['message'] == f'Module does not have command: {command_type}'


def test_post_serial_update_no_bundled_fw(api_client, hardware, magdeck):
    magdeck._bundled_fw = None

    hardware.attached_modules = [magdeck]
    resp = api_client.post('/modules/dummySerialMD/update')

    body = resp.json()
    assert resp.status_code == 500
    assert body == {
        'message': 'Bundled fw file not found for module of type: magdeck'
    }


def test_post_serial_update_no_modules(api_client, hardware):
    resp = api_client.post('/modules/dummySerialMD/update')

    body = resp.json()
    assert resp.status_code == 404
    assert body == {
        'message': 'Module dummySerialMD not found'
    }


def test_post_serial_update_no_match(api_client, hardware, tempdeck):
    hardware.attached_modules = [tempdeck]

    resp = api_client.post('/modules/superDummySerialMD/update')

    body = resp.json()
    assert resp.status_code == 404
    assert body == {
        'message': 'Module superDummySerialMD not found'
    }


def test_post_serial_update_error(api_client, hardware, magdeck):
    async def thrower(*args, **kwargs):
        raise UpdateError("not possible")

    magdeck._bundled_fw = BundledFirmware("1234", Path("c:/aaa"))

    hardware.attached_modules = [magdeck]

    with patch("opentrons.hardware_control.modules.update_firmware") as p:
        p.side_effect = thrower
        resp = api_client.post('/modules/dummySerialMD/update')

        body = resp.json()
        assert resp.status_code == 500
        assert body == {
            'message': 'Update error: not possible'
        }


def test_post_serial_timeout_error(api_client, hardware, magdeck):
    async def thrower(*args, **kwargs):
        raise asyncio.TimeoutError()

    magdeck._bundled_fw = BundledFirmware("1234", Path("c:/aaa"))

    hardware.attached_modules = [magdeck]

    with patch("opentrons.hardware_control.modules.update_firmware") as p:
        p.side_effect = thrower
        resp = api_client.post('/modules/dummySerialMD/update')

        body = resp.json()
        assert resp.status_code == 500
        assert body == {
            'message': 'Module not responding'
        }


def test_post_serial_update(api_client, hardware, tempdeck):
    async def update(*args, **kwargs):
        pass

    hardware.attached_modules = [tempdeck]

    tempdeck._bundled_fw = BundledFirmware("1234", Path("c:/aaa"))

    with patch("opentrons.hardware_control.modules.update_firmware") as p:
        p.side_effect = update

        resp = api_client.post('/modules/dummySerialTD/update')

        p.assert_called_once_with(tempdeck,
                                  tempdeck._bundled_fw.path,
                                  asyncio.get_event_loop())

        body = resp.json()
        assert resp.status_code == 200
        assert body == {
            'message': 'Successfully updated module dummySerialTD'
        }
