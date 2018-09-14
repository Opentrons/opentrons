import json
import os
import random
import tempfile
from opentrons.server.main import init
from opentrons.system import nmcli

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
