import json
import os
import random
import tempfile
import pytest
from opentrons.server.main import init
from opentrons.system import nmcli
from opentrons.server.endpoints import wifi

"""
All mocks in this test suite represent actual output from nmcli commands
"""


async def test_wifi_status(
        virtual_smoothie_env, loop, test_client, monkeypatch):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    async def mock_call(cmd):
        # Command: `nmcli networking connectivity`
        if 'connectivity' in cmd:
            return 'full', ''
        else:
            res = '''B8:27:EB:5F:A6:89
192.168.1.137/24
192.168.1.1
100 (connected)'''
            return res, ''

    monkeypatch.setattr(nmcli, '_call', mock_call)

    expected = json.dumps({'status': 'full',
                           'ipAddress': '192.168.1.137/24',
                           'macAddress': 'B8:27:EB:5F:A6:89',
                           'gatewayAddress': '192.168.1.1'})
    resp = await cli.get('/wifi/status')
    text = await resp.text()
    assert resp.status == 200
    assert text == expected

    async def mock_call(cmd):
        if 'connectivity' in cmd:
            return 'full', ''
        else:
            return '', 'this is a dummy error'

    monkeypatch.setattr(nmcli, '_call', mock_call)
    resp = await cli.get('/wifi/status')
    assert resp.status == 500


async def test_wifi_list(virtual_smoothie_env, loop, test_client, monkeypatch):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

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
        virtual_smoothie_env, loop, test_client, monkeypatch):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    msg = "Device 'wlan0' successfully activated with '076aa998-0275-4aa0-bf85-e9629021e267'."  # noqa

    async def mock_configure(ssid, security_type=None, psk=None, hidden=False):
        # Command: nmcli device wifi connect "{ssid}" password "{psk}"
        return True, msg

    monkeypatch.setattr(nmcli, 'configure', mock_configure)

    expected = {'ssid': 'Opentrons', 'message': msg}

    resp = await cli.post(
        '/wifi/configure', json={'ssid': 'Opentrons', 'psk': 'scrt sqrl'})
    body = await resp.json()
    assert resp.status == 201
    assert body == expected


def test_deduce_security():
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._deduce_security({'psk': 'hi', 'eap_config': {'hi': 'nope'}})
    assert wifi._deduce_security({'psk': 'test-psk'})\
        == nmcli.SECURITY_TYPES.WPA_PSK
    assert wifi._deduce_security({'eap_config': {'hi': 'this is bad'}})\
        == nmcli.SECURITY_TYPES.WPA_EAP
    assert wifi._deduce_security({}) == nmcli.SECURITY_TYPES.NONE
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._deduce_security({'security_type': 'this is invalid you fool'})


def test_check_eap_config(wifi_keys_tempdir):
    wifi_key_id = '88188cafcf'
    os.mkdir(os.path.join(wifi_keys_tempdir, wifi_key_id))
    with open(os.path.join(wifi_keys_tempdir,
                           wifi_key_id,
                           'test.pem'), 'w') as f:
        f.write('what a terrible key')
    # Bad eap types should fail
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_config({'eapType': 'afaosdasd'})
    # Valid (if short) arguments should work
    wifi._eap_check_config({'eapType': 'peap/eap-mschapv2',
                            'identity': 'test@hi.com',
                            'password': 'passwd'})
    # Extra args should fail
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_config({'eapType': 'tls',
                                'identity': 'test@example.com',
                                'privateKey': wifi_key_id,
                                'clientCert': wifi_key_id,
                                'phase2CaCertf': 'foo'})
    # Filenames should be rewritten
    rewritten = wifi._eap_check_config({'eapType': 'ttls/eap-md5',
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
    out = wifi._eap_check_config(config)
    for key in config.keys():
        assert key in out


def test_eap_check_option():
    # Required arguments that are not specified should raise
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_option_ok({'name': 'test-opt', 'required': True,
                                   'friendlyName': 'Test Option'},
                                  {'eapType': 'test'})
    # Non-required arguments that are not specified should not raise
    wifi._eap_check_option_ok({'name': 'test-1',
                               'required': False,
                               'type': 'str',
                               'friendlyName': 'Test Option'},
                              {'eapType': 'test'})

    # Check type mismatch detection pos and neg
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_option_ok({'name': 'identity',
                                   'friendlyName': 'Username',
                                   'required': True,
                                   'type': 'str'},
                                  {'identity': 2,
                                  'eapType': 'test'})
    wifi._eap_check_option_ok({'name': 'identity',
                               'required': True,
                               'friendlyName': 'Username',
                               'type': 'str'},
                              {'identity': 'hi',
                              'eapType': 'test'})
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_option_ok({'name': 'password',
                                   'required': True,
                                   'friendlyName': 'Password',
                                   'type': 'password'},
                                  {'password': [2, 3],
                                  'eapType': 'test'})
    wifi._eap_check_option_ok({'name': 'password',
                               'required': True,
                               'friendlyName': 'password',
                               'type': 'password'},
                              {'password': 'secret',
                              'eapType': 'test'})
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_option_ok({'name': 'phase2CaCert',
                                   'friendlyName': 'some file who cares',
                                   'required': True,
                                   'type': 'file'},
                                  {'phase2CaCert': 2,
                                  'eapType': 'test'})
    wifi._eap_check_option_ok({'name': 'phase2CaCert',
                               'required': True,
                               'friendlyName': 'hello',
                               'type': 'file'},
                              {'phase2CaCert': '82141cceaf',
                              'eapType': 'test'})
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_option_ok({'name': 'some_flag',
                                   'required': True,
                                   'friendlyName': 'creative error',
                                   'type': 'bool'},
                                  {'some_flag': 'hi',
                                  'eapType': 'test'})
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_option_ok({'name': 'some_choice',
                                   'required': True,
                                   'type': 'choice',
                                   'friendlyName': 'Choice',
                                   'choices': ['a', 'b', 'c']},
                                  {'some_choice': 5,
                                  'eapType': 'test'})
    wifi._eap_check_option_ok({'name': 'some_choice',
                               'required': True,
                               'type': 'choice',
                               'friendlyName': 'hi',
                               'choices': ['a', 'b', 'c']},
                              {'some_choice': 'a',
                              'eapType': 'test'})


async def test_list_keys(loop, test_client, wifi_keys_tempdir):
    dummy_names = ['ad12d1df199bc912', 'cbdda8124128cf', '812410990c5412']
    app = init(loop)
    cli = await loop.create_task(test_client(app))
    empty_resp = await cli.get('/wifi/keys')
    assert empty_resp.status == 200
    empty_body = await empty_resp.json()
    assert empty_body == []

    for dn in dummy_names:
        os.mkdir(os.path.join(wifi_keys_tempdir, dn))
        open(os.path.join(wifi_keys_tempdir, dn, 'test.pem'), 'w').write('hi')

    resp = await cli.get('/wifi/keys')
    assert resp.status == 200
    body = await resp.json()
    assert len(body) == 3
    for dn in dummy_names:
        for keyfile in body:
            if keyfile['id'] == dn:
                assert keyfile['name'] == 'test.pem'
                assert keyfile['uri'] == '/wifi/keys/{}'.format(dn)
                break
        else:
            raise KeyError(dn)


async def test_key_lifecycle(loop, test_client, wifi_keys_tempdir):
    with tempfile.TemporaryDirectory() as source_td:
        app = init(loop)
        cli = await loop.create_task(test_client(app))
        empty_resp = await cli.get('/wifi/keys')
        assert empty_resp.status == 200
        empty_body = await empty_resp.json()
        assert empty_body == []

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
        assert len(list_body) == 3
        for elem in list_body:
            assert elem['id'] in [r['id'] for r in results.values()]

        for fn, data in results.items():
            del_resp = await cli.delete(data['uri'])
            assert del_resp.status == 200
            del_body = await del_resp.json()
            assert 'message' in del_body
            del_list_resp = await cli.get('/wifi/keys')
            del_list_body = await del_list_resp.json()
            assert data['id'] not in [k['id'] for k in del_list_body]

        dup_del_resp = await cli.delete(results['test1.pem']['uri'])
        assert dup_del_resp.status == 404


async def test_eap_config_options(virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))
    resp = await cli.get('/wifi/eapoptions')

    assert resp.status == 200

    body = await resp.json()
    # Check that the body is shaped correctly but ignore the actual content
    assert 'options' in body
    assert 'methods' in body
    option_keys = ('name', 'friendlyName', 'required', 'type')
    option_types = ('str', 'password', 'choice', 'file', 'bool')

    def check_option(opt_dict):
        for key in option_keys:
            assert key in opt_dict
        assert opt_dict['type'] in option_types
        if opt_dict['type'] == 'choice':
            assert 'choices' in opt_dict
            assert isinstance(opt_dict['choices'], list)

    for opt in body['options']:
        check_option(opt)

    for method in body['methods']:
        assert 'name' in method
        assert 'options' in method
        for opt in method['options']:
            check_option(opt)
