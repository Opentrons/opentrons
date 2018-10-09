import asyncio
from opentrons.hardware_control import modules
from opentrons.hardware_control.modules import tempdeck


def test_sim_initialization():
    temp = modules.build('', 'tempdeck', True)
    assert isinstance(temp, modules.AbstractModule)


def test_sim_state():
    temp = modules.build('', 'tempdeck', True)
    assert temp.temperature == 0
    assert temp.target == 0
    assert temp.status == 'idle'
    assert temp.live_data['status'] == temp.status
    assert temp.live_data['data']['currentTemp'] == temp.temperature
    assert temp.live_data['data']['targetTemp'] == temp.target
    status = temp.device_info
    assert status['serial'] == 'dummySerial'
    assert status['model'] == 'dummyModel'
    assert status['version'] == 'dummyVersion'


async def test_sim_update():
    temp = modules.build('', 'tempdeck', True)
    temp.set_temperature(10)
    assert temp.temperature == 10
    assert temp.target == 10
    assert temp.status == 'holding at target'
    await asyncio.wait_for(temp.wait_for_temp(), timeout=0.2)
    temp.disengage()
    assert temp.temperature == 0
    assert temp.target == 0
    assert temp.status == 'idle'


async def test_poller(monkeypatch):
    temp = modules.tempdeck.TempDeck('', True)
    hit = False

    def update_called():
        nonlocal hit
        hit = True

    monkeypatch.setattr(temp._driver, 'update_temperature', update_called)
    temp._connect()
    assert temp._poller.is_alive()
    await asyncio.sleep(tempdeck.TEMP_POLL_INTERVAL_SECS * 1.1)
    assert hit
