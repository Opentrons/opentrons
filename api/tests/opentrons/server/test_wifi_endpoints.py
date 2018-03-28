import json
from opentrons.server.main import init
from opentrons.server.endpoints import wifi

"""
All mocks in this test suite represent actual output from nmcli commands
"""


async def test_wifi_status(
        virtual_smoothie_env, loop, test_client, monkeypatch):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    def mock_subprocess(cmd):
        # Command: `nmcli networking connectivity`
        res = "full"
        return res, ''

    monkeypatch.setattr(wifi, '_subprocess', mock_subprocess)

    expected = json.dumps({'status': 'full'})
    resp = await cli.get('/wifi/status')
    text = await resp.text()
    assert resp.status == 200
    assert text == expected


async def test_wifi_list(virtual_smoothie_env, loop, test_client, monkeypatch):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    def mock_subprocess(cmd):
        # Command: `nmcli --terse --fields ssid,signal,active device wifi list`
        res = """Opentrons:81:yes
Big Duck:47:no
HP-Print-1-LaserJet Pro:35:no
Guest Wireless:24:no
"""
        return res, ''

    monkeypatch.setattr(wifi, '_subprocess', mock_subprocess)

    expected = json.dumps({
        'list': [
            {'ssid': 'Opentrons', 'signal': 81, 'active': True},
            {'ssid': 'Big Duck', 'signal': 47, 'active': False},
            {'ssid': 'HP-Print-1-LaserJet Pro', 'signal': 35, 'active': False},
            {'ssid': 'Guest Wireless', 'signal': 24, 'active': False}
        ]
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

    def mock_subprocess(cmd):
        # Command: nmcli device wifi connect "{ssid}" password "{psk}"
        return msg, ''

    monkeypatch.setattr(wifi, '_subprocess', mock_subprocess)

    expected = {'ssid': 'Opentrons', 'message': msg}

    resp = await cli.post(
        '/wifi/configure', json={'ssid': 'Opentrons', 'psk': 'scrt sqrl'})
    body = await resp.json()
    assert resp.status == 201
    assert body == expected
