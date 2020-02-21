import json
import os
import random
import tempfile
import pytest
from opentrons.system import nmcli
from robot_server.aiohttp.main import init
from robot_server.aiohttp.endpoints import networking

"""
All mocks in this test suite represent actual output from nmcli commands
"""


async def test_networking_status(
        virtual_smoothie_env, loop, aiohttp_client, monkeypatch):
    app = init()
    cli = await loop.create_task(aiohttp_client(app))

    async def mock_call(cmd):
        # Command: `nmcli networking connectivity`
        if 'connectivity' in cmd:
            res = 'full'
        elif 'wlan0' in cmd:
            res = '''GENERAL.HWADDR:B8:27:EB:5F:A6:89
IP4.ADDRESS[1]:--
IP4.GATEWAY:--
GENERAL.TYPE:wifi
GENERAL.STATE:30 (disconnected)'''
        elif 'eth0' in cmd:
            res = '''GENERAL.HWADDR:B8:27:EB:39:C0:9A
IP4.ADDRESS[1]:169.254.229.173/16
GENERAL.TYPE:ethernet
GENERAL.STATE:100 (connected)'''
        else:
            res = 'incorrect nmcli call'

        return res, ''

    monkeypatch.setattr(nmcli, '_call', mock_call)

    expected = json.dumps({
        'status': 'full',
        'interfaces': {
            'wlan0': {
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
            }
        }
    })

    resp = await cli.get('/networking/status')
    text = await resp.text()
    assert resp.status == 200
    assert text == expected

    async def mock_call(cmd):
        if 'connectivity' in cmd:
            return 'full', ''
        else:
            return '', 'this is a dummy error'

    monkeypatch.setattr(nmcli, '_call', mock_call)
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
    with pytest.raises(networking.ConfigureArgsError):
        networking._deduce_security({'psk': 'hi', 'eapConfig': {'hi': 'nope'}})
    assert networking._deduce_security({'psk': 'test-psk'})\
        == nmcli.SECURITY_TYPES.WPA_PSK
    assert networking._deduce_security({'eapConfig': {'hi': 'this is bad'}})\
        == nmcli.SECURITY_TYPES.WPA_EAP
    assert networking._deduce_security({}) == nmcli.SECURITY_TYPES.NONE
    with pytest.raises(networking.ConfigureArgsError):
        networking._deduce_security(
            {'securityType': 'this is invalid you fool'})


def test_check_eap_config(wifi_keys_tempdir):
    wifi_key_id = '88188cafcf'
    os.mkdir(os.path.join(wifi_keys_tempdir, wifi_key_id))
    with open(os.path.join(wifi_keys_tempdir,
                           wifi_key_id,
                           'test.pem'), 'w') as f:
        f.write('what a terrible key')
    # Bad eap types should fail
    with pytest.raises(networking.ConfigureArgsError):
        networking._eap_check_config({'eapType': 'afaosdasd'})
    # Valid (if short) arguments should work
    networking._eap_check_config({'eapType': 'peap/eap-mschapv2',
                                  'identity': 'test@hi.com',
                                  'password': 'passwd'})
    # Extra args should fail
    with pytest.raises(networking.ConfigureArgsError):
        networking._eap_check_config({'eapType': 'tls',
                                      'identity': 'test@example.com',
                                      'privateKey': wifi_key_id,
                                      'clientCert': wifi_key_id,
                                      'phase2CaCertf': 'foo'})
    # Filenames should be rewritten
    rewritten = networking._eap_check_config({'eapType': 'ttls/eap-md5',
                                              'identity': 'hello@example.com',
                                              'password': 'hi',
                                              'caCert': wifi_key_id})
    assert rewritten['caCert'] == os.path.join(wifi_keys_tempdir,
                                               wifi_key_id,
                                               'test.pem')
    # A config should be returned with the same keys
    config = {'eapType': 'ttls/eap-tls',
              'identity': "test@hello.com",
              'phase2ClientCert': wifi_key_id,
              'phase2PrivateKey': wifi_key_id}
    out = networking._eap_check_config(config)
    for key in config.keys():
        assert key in out


def test_eap_check_option():
    # Required arguments that are not specified should raise
    with pytest.raises(networking.ConfigureArgsError):
        networking._eap_check_option_ok({'name': 'test-opt', 'required': True,
                                         'displayName': 'Test Option'},
                                        {'eapType': 'test'})
    # Non-required arguments that are not specified should not raise
    networking._eap_check_option_ok({'name': 'test-1',
                                     'required': False,
                                     'type': 'string',
                                     'displayName': 'Test Option'},
                                    {'eapType': 'test'})

    # Check type mismatch detection pos and neg
    with pytest.raises(networking.ConfigureArgsError):
        networking._eap_check_option_ok({'name': 'identity',
                                         'displayName': 'Username',
                                         'required': True,
                                         'type': 'string'},
                                        {'identity': 2,
                                         'eapType': 'test'})
    networking._eap_check_option_ok({'name': 'identity',
                                     'required': True,
                                     'displayName': 'Username',
                                     'type': 'string'},
                                    {'identity': 'hi',
                                     'eapType': 'test'})
    with pytest.raises(networking.ConfigureArgsError):
        networking._eap_check_option_ok({'name': 'password',
                                         'required': True,
                                         'displayName': 'Password',
                                         'type': 'password'},
                                        {'password': [2, 3],
                                         'eapType': 'test'})
    networking._eap_check_option_ok({'name': 'password',
                                     'required': True,
                                     'displayName': 'password',
                                     'type': 'password'},
                                    {'password': 'secret',
                                     'eapType': 'test'})
    with pytest.raises(networking.ConfigureArgsError):
        networking._eap_check_option_ok({'name': 'phase2CaCert',
                                         'displayName': 'some file who cares',
                                         'required': True,
                                         'type': 'file'},
                                        {'phase2CaCert': 2,
                                         'eapType': 'test'})
    networking._eap_check_option_ok({'name': 'phase2CaCert',
                                     'required': True,
                                     'displayName': 'hello',
                                     'type': 'file'},
                                    {'phase2CaCert': '82141cceaf',
                                     'eapType': 'test'})


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


async def test_key_lifecycle(loop, aiohttp_client, wifi_keys_tempdir):
    with tempfile.TemporaryDirectory() as source_td:
        app = init()
        cli = await loop.create_task(aiohttp_client(app))
        empty_resp = await cli.get('/wifi/keys')
        assert empty_resp.status == 200
        empty_body = await empty_resp.json()
        assert empty_body == {'keys': []}

        results = {}
        # We should be able to add multiple keys
        for fn in ['test1.pem', 'test2.pem', 'test3.pem']:
            path = os.path.join(source_td, fn)
            with open(path, 'w') as f:
                f.write(str(random.getrandbits(2048)))
            upload_resp = await cli.post('/wifi/keys',
                                         data={'key': open(path, 'rb')})
            assert upload_resp.status == 201
            upload_body = await upload_resp.json()
            assert 'uri' in upload_body
            assert 'id' in upload_body
            assert 'name' in upload_body
            assert upload_body['name'] == os.path.basename(fn)
            assert upload_body['uri'] == '/wifi/keys/'\
                + upload_body['id']
            results[fn] = upload_body

        # We should not be able to upload a duplicate
        dup_resp = await cli.post(
            '/wifi/keys',
            data={'key': open(os.path.join(source_td, 'test1.pem'))})
        assert dup_resp.status == 200
        dup_body = await dup_resp.json()
        assert 'message' in dup_body

        # We should be able to see them all
        list_resp = await cli.get('/wifi/keys')
        assert list_resp.status == 200
        list_body = await list_resp.json()
        keys = list_body['keys']
        assert len(keys) == 3
        for elem in keys:
            assert elem['id'] in [r['id'] for r in results.values()]

        for fn, data in results.items():
            del_resp = await cli.delete(data['uri'])
            assert del_resp.status == 200
            del_body = await del_resp.json()
            assert 'message' in del_body
            del_list_resp = await cli.get('/wifi/keys')
            del_list_body = await del_list_resp.json()
            assert data['id'] not in [k['id'] for k in del_list_body['keys']]

        dup_del_resp = await cli.delete(results['test1.pem']['uri'])
        assert dup_del_resp.status == 404


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
