import os
import json
import tempfile
import asyncio
import pytest
from aiohttp import web
# from opentrons import *
from opentrons.server import init
from opentrons.server.endpoints import update
from opentrons.server.endpoints import serverlib_fallback
from opentrons.hardware_control import modules as hw_modules, simulator


async def test_restart(
        virtual_smoothie_env, monkeypatch, async_server, aiohttp_client):
    test_data = {"test": "pass"}
    loop = asyncio.get_event_loop()

    async def mock_restart(request):
        return web.json_response(test_data)

    monkeypatch.setattr(serverlib_fallback, 'restart', mock_restart)
    hw = async_server['com.opentrons.hardware']
    app = init(hw)
    cli = await loop.create_task(aiohttp_client(app))

    expected = json.dumps(test_data)
    resp = await cli.post('/server/restart')
    text = await resp.text()
    assert resp.status == 200
    assert text == expected


@pytest.mark.api1_only
async def test_update(
        virtual_smoothie_env, monkeypatch, async_client, async_server):
    hw = async_server['com.opentrons.hardware']
    msg = "success"
    whl_name = "testy.whl"
    serverlib_name = "testylib.whl"
    fw_name = "testy.fw"
    tmpdir = tempfile.mkdtemp("files")
    for filename in [whl_name, serverlib_name, fw_name]:
        with open(os.path.join(tmpdir, filename), 'w') as fd:
            fd.write("test")

    async def mock_install(filename, loop=None, modeset=True):
        return msg
    monkeypatch.setattr(serverlib_fallback, '_install', mock_install)
    monkeypatch.setattr(hw, 'update_firmware', mock_install)

    cli = async_client

    data = {
        'whl': open(os.path.join(tmpdir, whl_name)),
        'serverlib': open(os.path.join(tmpdir, serverlib_name)),
        'fw': open(os.path.join(tmpdir, fw_name))
    }

    # Note: hits API server update endpoint--this test covers backward
    # compatibility until the update server is universally available
    resp = await cli.post(
        '/server/update',
        data=data)

    expected = json.dumps({
        'message': [msg, msg, msg],
        'filename': [whl_name, serverlib_name, fw_name]
    })
    text = await resp.text()
    assert resp.status == 200
    assert text == expected


async def test_ignore_updates(
        virtual_smoothie_env, loop, async_client):
    tmpdir = tempfile.mkdtemp("files")
    ignore_name = "testy_ignore.json"
    serverlib_fallback.filepath = os.path.join(tmpdir, ignore_name)

    cli = async_client
    # Test no ignore file found
    r0 = await cli.get('/update/ignore')
    r0body = await r0.text()
    assert json.loads(r0body) == {'version': None}

    # Test that values are set correctly

    ignore = {'version': '3.1.3'}
    r1 = await cli.post('/update/ignore', json=ignore)
    assert r1.status == 200

    # Test that you cannot pass an empty version
    ignore2 = {'version': ''}
    r2 = await cli.post('/update/ignore', json=ignore2)
    assert r2.status == 400

    # Test that version in the temporary directory is still '3.1.3'
    r3 = await cli.get('/update/ignore')
    r3body = await r3.text()
    assert json.loads(r3body) == {'version': '3.1.3'}


@pytest.mark.api2_only
async def test_update_module_firmware(
        virtual_smoothie_env,
        loop,
        aiohttp_client,
        monkeypatch,
        async_client,
        async_server):

    client = async_client
    serial_num = 'dummySerialTC'
    fw_filename = 'dummyFirmware.hex'
    tmpdir = tempfile.mkdtemp("files")

    with open(os.path.join(tmpdir, fw_filename), 'wb') as fd:
        fd.write(bytes(0x1234))

    def mock_get_attached_modules(module):
        return [('mod1', 'thermocycler')]

    async def mock_enter_bootloader(driver, module):
        return '/dev/ot_module_avrdude_bootloader0'

    monkeypatch.setattr(hw_modules.update, 'enter_bootloader',
                        mock_enter_bootloader)
    monkeypatch.setattr(simulator.Simulator, 'get_attached_modules',
                        mock_get_attached_modules)

    # ========= Happy path ==========
    res_msg = {'message': f'Successully updated module {serial_num}',
               'filename': fw_filename}

    async def mock_successful_upload_to_module(
            port, firmware_file_path, upload_function, loop):
        return True, res_msg['message']

    expected_res = res_msg

    monkeypatch.setattr(hw_modules.update,
                        'upload_firmware', mock_successful_upload_to_module)
    resp = await client.post(
        '/modules/{}/update'.format(serial_num),
        data={'module_firmware': open(os.path.join(tmpdir, fw_filename))})

    assert resp.status == 200
    res = await resp.json()
    assert res == expected_res


@pytest.mark.api2_only
async def test_fail_update_module_firmware(
        virtual_smoothie_env,
        loop,
        aiohttp_client,
        monkeypatch,
        async_client,
        async_server):

    client = async_client
    serial_num = 'dummySerialTC'
    fw_filename = 'dummyFirmware.hex'
    tmpdir = tempfile.mkdtemp("files")

    with open(os.path.join(tmpdir, fw_filename), 'wb') as fd:
        fd.write(bytes(0x1234))

    async def mock_enter_bootloader(driver, module):
        return '/dev/ot_module_avrdude_bootloader0'

    def mock_get_attached_modules(module):
        return [('mod1', 'thermocycler')]

    monkeypatch.setattr(simulator.Simulator, 'get_attached_modules',
                        mock_get_attached_modules)
    monkeypatch.setattr(hw_modules.update, 'enter_bootloader',
                        mock_enter_bootloader)

    # ========= Case 1: Port not accessible =========
    bootloader_error = 'BOSSA FAILED'
    res_msg1 = {'message': f'Bootloader error: {bootloader_error}',
                'filename': fw_filename}

    async def mock_failed_upload_to_module1(
            port, firmware_file_path, upload_function, loop):
        return ('mod1', (False, bootloader_error))

    expected_res1 = res_msg1

    monkeypatch.setattr(hw_modules.update,
                        'upload_firmware', mock_failed_upload_to_module1)

    resp1 = await client.post(
        '/modules/{}/update'.format(serial_num),
        data={'module_firmware': open(os.path.join(tmpdir, fw_filename))})

    assert resp1.status == 400
    j1 = await resp1.json()
    assert j1 == expected_res1

    # ========= Case 2: Bootloader not responding =========
    expected_res2 = {'message': 'Bootloader not responding',
                     'filename': fw_filename}

    async def mock_failed_upload_to_module2(
            port, firmware_file_path, upload_function, loop):
        await asyncio.sleep(2)

    monkeypatch.setattr(hw_modules.update,
                        'upload_firmware', mock_failed_upload_to_module2)
    update.UPDATE_TIMEOUT = 0.1

    resp2 = await client.post(
        '/modules/{}/update'.format(serial_num),
        data={'module_firmware': open(os.path.join(tmpdir, fw_filename))})

    assert resp2.status == 500
    j2 = await resp2.json()
    assert j2 == expected_res2

    # ========= Case 3: No module/ incorrect serial =========
    wrong_serial = 'abcdef'
    expected_res3 = {'message': 'Module {} not found'.format(wrong_serial),
                     'filename': fw_filename}

    resp3 = await client.post(
        '/modules/{}/update'.format(wrong_serial),
        data={'module_firmware': open(os.path.join(tmpdir, fw_filename))})

    assert resp3.status == 404
    j3 = await resp3.json()
    assert j3 == expected_res3
