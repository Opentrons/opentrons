import asyncio
from opentrons.hardware_control import modules
from opentrons.hardware_control.modules import tempdeck


async def test_sim_initialization(loop):
    temp = await modules.build('', 'tempdeck', True,
                               lambda x: None, loop=loop)
    assert isinstance(temp, modules.AbstractModule)


async def test_sim_state(loop):
    temp = await modules.build('', 'tempdeck', True,
                               lambda x: None, loop=loop)
    assert temp.temperature == 0
    assert temp.target is None
    assert temp.status == 'idle'
    assert temp.live_data['status'] == temp.status
    assert temp.live_data['data']['currentTemp'] == temp.temperature
    assert temp.live_data['data']['targetTemp'] == temp.target
    status = temp.device_info
    assert status['serial'] == 'dummySerialTD'
    assert status['model'] == 'dummyModelTD'
    assert status['version'] == 'dummyVersionTD'


async def test_sim_update(loop):
    temp = await modules.build('', 'tempdeck', True,
                               lambda x: None, loop=loop)
    await asyncio.wait_for(temp.set_temperature(10), 0.2)
    assert temp.temperature == 10
    assert temp.target == 10
    assert temp.status == 'holding at target'
    temp.deactivate()
    assert temp.temperature == 0
    assert temp.target is None
    assert temp.status == 'idle'


async def test_poller(monkeypatch):
    temp = modules.tempdeck.TempDeck('', True)
    hit = False

    def update_called():
        nonlocal hit
        hit = True

    monkeypatch.setattr(temp._driver, 'update_temperature', update_called)
    await temp._connect()
    assert temp._poller.is_alive()
    await asyncio.sleep(tempdeck.TEMP_POLL_INTERVAL_SECS * 1.1)
    assert hit
