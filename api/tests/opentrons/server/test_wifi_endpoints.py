import json
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

    async def mock_configure(ssid, security_type=None, psk=None):
        # Command: nmcli device wifi connect "{ssid}" password "{psk}"
        return True, msg

    monkeypatch.setattr(nmcli, 'configure', mock_configure)

    expected = {'ssid': 'Opentrons', 'message': msg}

    resp = await cli.post(
        '/wifi/configure', json={'ssid': 'Opentrons', 'psk': 'scrt sqrl'})
    body = await resp.json()
    assert resp.status == 201
    assert body == expected
