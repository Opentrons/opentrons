import json
import os
import random
import tempfile
from unittest.mock import patch

import pytest
from opentrons.system import nmcli, wifi
from opentrons.server import init
from opentrons.server.endpoints import networking

"""
All mocks in this test suite represent actual output from nmcli commands
"""


async def test_networking_status(
        virtual_smoothie_env, loop, aiohttp_client, monkeypatch):
    app = init()
    cli = await loop.create_task(aiohttp_client(app))

    async def mock_is_connected():
        return 'full'

    connection_statuses = {'wlan0': {
        # test "--" gets mapped to None
        'ipAddress': None,
        'macAddress': 'B8:27:EB:5F:A6:89',
        # test "--" gets mapped to None
        'gatewayAddress': None,
        'state': 'disconnected',
        'type': 'wifi'
    },
    'eth0': {
        'ipAddress': '169.254.229.173/16',
        'macAddress': 'B8:27:EB:39:C0:9A',
        # test missing output gets mapped to None
        'gatewayAddress': None,
        'state': 'connected',
        'type': 'ethernet'
    }}

    async def mock_iface_info(k: nmcli.NETWORK_IFACES):
        return connection_statuses[k.value]

    monkeypatch.setattr(nmcli, 'is_connected', mock_is_connected)
    monkeypatch.setattr(nmcli, 'iface_info', mock_iface_info)

    expected = {
        'status': 'full',
        'interfaces': connection_statuses
    }

    resp = await cli.get('/networking/status')
    body_json = await resp.json()
    assert resp.status == 200
    assert body_json == expected

    async def mock_is_connected():
        raise FileNotFoundError("No")

    monkeypatch.setattr(nmcli, 'is_connected', mock_is_connected)
    resp = await cli.get('/networking/status')
    assert resp.status == 500


async def test_wifi_list(
        virtual_smoothie_env, loop, aiohttp_client, monkeypatch):
    app = init()
    cli = await loop.create_task(aiohttp_client(app))

    expected_res = [
        {'ssid': 'Opentrons', 'signal': 81, 'active': True},
        {'ssid': 'Big Duck', 'signal': 47, 'active': False},
        {'ssid': 'HP-Print-1-LaserJet Pro', 'signal': 35, 'active': False},
        {'ssid': 'Guest Wireless', 'signal': 24, 'active': False}
    ]

    async def mock_available():
        return expected_res

    monkeypatch.setattr(nmcli, 'available_ssids', mock_available)

    expected = json.dumps({
        'list': expected_res
    })

    resp = await cli.get('/wifi/list')
    text = await resp.text()
    assert resp.status == 200
    assert text == expected


async def test_wifi_configure(
        virtual_smoothie_env, loop, aiohttp_client, monkeypatch):
    app = init()
    cli = await loop.create_task(aiohttp_client(app))

    msg = "Device 'wlan0' successfully activated with '076aa998-0275-4aa0-bf85-e9629021e267'."  # noqa

    async def mock_configure(ssid, securityType=None, psk=None, hidden=False):
        # Command: nmcli device wifi connect "{ssid}" password "{psk}"
        return True, msg

    monkeypatch.setattr(nmcli, 'configure', mock_configure)

    expected = {'ssid': 'Opentrons', 'message': msg}

    resp = await cli.post(
        '/wifi/configure', json={'ssid': 'Opentrons', 'psk': 'scrt sqrl'})
    body = await resp.json()
    assert resp.status == 201
    assert body == expected

    resp = await cli.post(
        '/wifi/configure', json={'ssid': 'asasd', 'foo': 'bar'})
    assert resp.status == 400
    body = await resp.json()
    assert 'message' in body


async def test_wifi_disconnect(loop, aiohttp_client, monkeypatch):
    app = init()
    cli = await loop.create_task(aiohttp_client(app))

    msg1 = 'Connection \'ot_wifi\' successfully deactivated. ' \
           'Connection \'ot_wifi\' (fa7ed807-23ef-41f0-ab3e-34' \
           '99cc5a960e) successfully deleted'

    async def mock_disconnect(ssid):
        # Command: nmcli connection down ssid
        return True, msg1

    monkeypatch.setattr(nmcli, 'wifi_disconnect', mock_disconnect)

    expected = {'message': 'SSID must be specified as a string'}
    resp = await cli.post('/wifi/disconnect', json={})
    body = await resp.json()
    assert resp.status == 400
    assert body == expected

    resp = await cli.post('wifi/disconnect', json={'ssid': 'ot_wifi'})
    body = await resp.json()
    assert resp.status == 200
    assert 'message' in body

    msg2 = 'Connection \'ot_wifi\' successfully deactivated. \n' \
           'Error: Could not remove ssid. No connection for ssid ot_wif123'

    async def mock_bad_disconnect(ssid):
        # Command: nmcli connection down ssid
        return True, msg2

    monkeypatch.setattr(nmcli, 'wifi_disconnect', mock_bad_disconnect)

    resp = await cli.post('wifi/disconnect', json={'ssid': 'ot_wifi'})
    body = await resp.json()
    assert resp.status == 207
    assert 'message' in body


def test_deduce_security():
    with pytest.raises(wifi.ConfigureArgsError):
        networking._deduce_security({'psk': 'hi', 'eapConfig': {'hi': 'nope'}})
    assert networking._deduce_security({'psk': 'test-psk'})\
        == nmcli.SECURITY_TYPES.WPA_PSK
    assert networking._deduce_security({'eapConfig': {'hi': 'this is bad'}})\
        == nmcli.SECURITY_TYPES.WPA_EAP
    assert networking._deduce_security({}) == nmcli.SECURITY_TYPES.NONE
    with pytest.raises(wifi.ConfigureArgsError):
        networking._deduce_security(
            {'securityType': 'this is invalid you fool'})


async def test_list_keys(loop, aiohttp_client, wifi_keys_tempdir):
    dummy_names = ['ad12d1df199bc912', 'cbdda8124128cf', '812410990c5412']
    app = init()
    cli = await loop.create_task(aiohttp_client(app))
    empty_resp = await cli.get('/wifi/keys')
    assert empty_resp.status == 200
    empty_body = await empty_resp.json()
    assert empty_body == {'keys': []}

    for dn in dummy_names:
        os.mkdir(os.path.join(wifi_keys_tempdir, dn))
        open(os.path.join(wifi_keys_tempdir, dn, 'test.pem'), 'w').write('hi')

    resp = await cli.get('/wifi/keys')
    assert resp.status == 200
    body = await resp.json()
    keys = body['keys']
    assert len(keys) == 3
    for dn in dummy_names:
        for keyfile in keys:
            if keyfile['id'] == dn:
                assert keyfile['name'] == 'test.pem'
                assert keyfile['uri'] == '/wifi/keys/{}'.format(dn)
                break
        else:
            raise KeyError(dn)


async def test_add_key_call(loop, aiohttp_client, wifi_keys_tempdir):
    """Test that uploaded file is processed properly"""
    with tempfile.TemporaryDirectory() as source_td:
        app = init()
        cli = await loop.create_task(aiohttp_client(app))

        # We should be able to add multiple keys
        for fn in ['test1.pem', 'test2.pem', 'test3.pem']:
            path = os.path.join(source_td, fn)
            with open(path, 'w') as f:
                f.write(str(random.getrandbits(20)))

            with patch("opentrons.system.wifi.add_key") as p:
                await cli.post('/wifi/keys', data={'key': open(path, 'rb')})

                with open(path, 'rb') as f:
                    p.assert_called_once_with(fn, f.read())


async def test_add_key_no_key(loop, aiohttp_client):
    """Test response when no key supplied"""
    app = init()
    cli = await loop.create_task(aiohttp_client(app))

    with patch("opentrons.system.wifi.add_key") as p:
        r = await cli.post('/wifi/keys', data={})

        p.assert_not_called()
        assert r.status == 400


@pytest.mark.parametrize("add_key_return,expected_status,expected_body", [
    (wifi.AddKeyResult(created=True,
                       key=wifi.Key(file="a", directory="b")),
     201,
     {'name': 'a', 'uri': '/wifi/keys/b', 'id': 'b'}
     ),
    (wifi.AddKeyResult(created=False,
                       key=wifi.Key(file="x", directory="g")),
     200,
     {'name': 'x', 'uri': '/wifi/keys/g', 'id': 'g',
      'message': 'Key file already present'}
     )
])
async def test_add_key_response(add_key_return, expected_status, expected_body,
                                loop, aiohttp_client, wifi_keys_tempdir):
    with tempfile.TemporaryDirectory() as source_td:
        app = init()
        cli = await loop.create_task(aiohttp_client(app))

        path = os.path.join(source_td, "t.pem")
        with open(path, 'w') as f:
            f.write(str(random.getrandbits(20)))

        with patch("opentrons.system.wifi.add_key") as p:
            p.return_value = add_key_return
            r = await cli.post('/wifi/keys', data={'key': open(path, 'rb')})
            assert r.status == expected_status
            assert await r.json() == expected_body


@pytest.mark.parametrize("arg,remove_key_return,expected_status,expected_body", [
    ("12345",
     None,
     404,
     {'message': "No such key file 12345"}
     ),
    ("54321",
     "myfile.pem",
     200,
     {'message': 'Key file myfile.pem deleted'}
     )
])
async def test_remove_key(arg, remove_key_return,
                          expected_status, expected_body,
                          loop, aiohttp_client):
    app = init()
    cli = await loop.create_task(aiohttp_client(app))

    with patch("opentrons.system.wifi.remove_key") as p:
        p.return_value = remove_key_return
        r = await cli.delete("/wifi/keys/" + arg)
        p.assert_called_once_with(arg)
        assert r.status == expected_status
        assert await r.json() == expected_body


async def test_eap_config_options(virtual_smoothie_env, loop, aiohttp_client):
    app = init()
    cli = await loop.create_task(aiohttp_client(app))
    resp = await cli.get('/wifi/eap-options')

    assert resp.status == 200

    body = await resp.json()
    # Check that the body is shaped correctly but ignore the actual content
    assert 'options' in body
    option_keys = ('name', 'displayName', 'required', 'type')
    option_types = ('string', 'password', 'file')

    def check_option(opt_dict):
        for key in option_keys:
            assert key in opt_dict
        assert opt_dict['type'] in option_types

    for opt in body['options']:
        assert 'name' in opt
        assert 'displayName' in opt
        assert 'options' in opt
        for method_opt in opt['options']:
            check_option(method_opt)
