from pathlib import Path
from unittest.mock import patch, PropertyMock

import pytest
import asyncio
from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.modules import MagDeck, Thermocycler, TempDeck
from opentrons.hardware_control.modules import utils, UpdateError, \
    BundledFirmware
from typing import List


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
    MagDeck.current_height = PropertyMock(return_value=321)

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
    TempDeck.temperature = PropertyMock(return_value=123.0)
    TempDeck.target = PropertyMock(return_value=321.0)

    yield t

    # Have to stop the poller
    t._poller.stop()
    t._poller.join()


@pytest.fixture
def thermocycler():
    t = asyncio.get_event_loop().run_until_complete(
        utils.build(
            port='/dev/ot_module_thermocycler1',
            which='thermocycler',
            simulating=True,
            interrupt_callback=lambda x: None,
            execution_manager=ExecutionManager(loop=asyncio.get_event_loop()),
            loop=asyncio.get_event_loop()
        )
    )
    Thermocycler.lid_status = PropertyMock(return_value="open")
    Thermocycler.lid_target = PropertyMock(return_value=1.2)
    Thermocycler.lid_temp = PropertyMock(return_value=22.0)
    Thermocycler.temperature = PropertyMock(return_value=100.0)
    Thermocycler.target = PropertyMock(return_value=200.0)
    Thermocycler.hold_time = PropertyMock(return_value=1)
    Thermocycler.ramp_rate = PropertyMock(return_value=3)
    Thermocycler.current_cycle_index = PropertyMock(return_value=1)
    Thermocycler.total_cycle_count = PropertyMock(return_value=3)
    Thermocycler.current_step_index = PropertyMock(return_value=5)
    Thermocycler.total_step_count = PropertyMock(return_value=2)
    return t


def test_get_modules_magdeck(api_client, hardware, magdeck):
    hardware.attached_modules = [magdeck]

    resp = api_client.get('/modules')
    body = resp.json()
    assert resp.status_code == 200
    assert body == {
        'modules': [
            {
                'displayName': 'magdeck',
                'fwVersion': 'dummyVersionMD',
                'hasAvailableUpdate': False,
                'model': 'mag_deck_v1.1',
                'moduleModel': 'magneticModuleV1',
                'name': 'magdeck',
                'port': '/dev/ot_module_magdeck1',
                'revision': 'mag_deck_v1.1',
                'serial': 'dummySerialMD',
                'status': 'engaged',
                'data': {
                    'engaged': True,
                    'height': 321,
                }
            }
        ]
    }


def test_get_modules_tempdeck(api_client, hardware, tempdeck):
    hardware.attached_modules = [tempdeck]

    for model in ('temp_deck_v1', 'temp_deck_v1.1', 'temp_deck_v2'):
        tempdeck._device_info['model'] = model
        resp = api_client.get('/modules')
        body = resp.json()
        assert resp.status_code == 200
        assert body == {
            'modules': [
                {
                    'displayName': 'tempdeck',
                    'fwVersion': 'dummyVersionTD',
                    'hasAvailableUpdate': False,
                    'model': model,
                    'moduleModel': 'temperatureModuleV1',
                    'name': 'tempdeck',
                    'port': '/dev/ot_module_tempdeck1',
                    'revision': model,
                    'serial': 'dummySerialTD',
                    'status': 'idle',
                    'data': {
                        'currentTemp': 123,
                        'targetTemp':  321,
                    }
                }
            ]
        }


def test_get_modules_thermocycler(api_client, hardware, thermocycler):
    hardware.attached_modules = [thermocycler]

    resp = api_client.get('/modules')
    body = resp.json()
    assert resp.status_code == 200
    assert body == {
        'modules': [{
            'displayName': 'thermocycler',
            'fwVersion': 'dummyVersionTC',
            'hasAvailableUpdate': False,
            'model': 'dummyModelTC',
            'moduleModel': 'thermocyclerModuleV1',
            'name': 'thermocycler',
            'port': '/dev/ot_module_thermocycler1',
            'revision': 'dummyModelTC',
            'serial': 'dummySerialTC',
            'status': 'idle',
            'data': {
                'lid': "open",
                'lidTarget': 1.2,
                'lidTemp': 22,
                'currentTemp': 100,
                'targetTemp': 200,
                'holdTime': 1,
                'rampRate': 3,
                'currentCycleIndex': 1,
                'totalCycleCount': 3,
                'currentStepIndex': 5,
                'totalStepCount': 2,
            }
        }]
    }


def test_get_module_serial_magdeck(api_client, hardware, magdeck):
    hardware.attached_modules = [magdeck]

    resp = api_client.get('/modules/dummySerialMD/data')

    body = resp.json()
    assert resp.status_code == 200
    assert body == {"status": "engaged",
                    "data": {
                        "engaged": True,
                        "height": 321.0
                    }}


def test_get_module_serial_tempdeck(api_client, hardware, tempdeck):
    hardware.attached_modules = [tempdeck]

    resp = api_client.get('/modules/dummySerialTD/data')

    body = resp.json()
    assert resp.status_code == 200
    assert body == {"status": "idle",
                    "data": {
                        "currentTemp": 123.0,
                        "targetTemp": 321.0
                    }}


def test_get_module_serial_thermocycler(api_client, hardware, thermocycler):
    hardware.attached_modules = [thermocycler]

    resp = api_client.get('/modules/dummySerialTC/data')

    body = resp.json()
    assert resp.status_code == 200
    assert body == {"status": "idle",
                    "data": {
                        'lid': "open",
                        'lidTarget': 1.2,
                        'lidTemp': 22,
                        'currentTemp': 100,
                        'targetTemp': 200,
                        'holdTime': 1,
                        'rampRate': 3,
                        'currentCycleIndex': 1,
                        'totalCycleCount': 3,
                        'currentStepIndex': 5,
                        'totalStepCount': 2,
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


def test_execute_module_command_bad_args(api_client, hardware, thermocycler):
    hardware.attached_modules = [thermocycler]

    async def mock_set_temperature(temperature, hold_secs, hold_mins,
                                   ramp_rate, vol):
        while temperature > Thermocycler.target:
            pass
        return

    Thermocycler.set_temperature.side_effect = mock_set_temperature

    resp = api_client.post('modules/dummySerialTC',
                           json={'command_type': 'set_temperature',
                                 'args': ['30']})
    body = resp.json()
    assert resp.status_code == 500
    assert 'message' in body
    assert 'TypeError' in body['message']


def test_execute_module_command_valid_args(api_client, hardware, thermocycler):
    hardware.attached_modules = [thermocycler]

    resp = api_client.post('modules/dummySerialTC',
                           json={'command_type': 'set_temperature',
                                 'args': [30]})
    assert resp.status_code == 200


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
