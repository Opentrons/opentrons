import asyncio
from opentrons.hardware_control import modules, ExecutionManager
from opentrons.hardware_control.modules import tempdeck


async def test_sim_initialization(loop):
    temp = await modules.build(port='/dev/ot_module_sim_tempdeck0',
                               which='tempdeck',
                               simulating=True,
                               interrupt_callback=lambda x: None,
                               loop=loop,
                               execution_manager=ExecutionManager(loop=loop))
    assert isinstance(temp, modules.AbstractModule)


async def test_sim_state(loop):
    temp = await modules.build(port='/dev/ot_module_sim_tempdeck0',
                               which='tempdeck',
                               simulating=True,
                               interrupt_callback=lambda x: None,
                               loop=loop,
                               execution_manager=ExecutionManager(loop=loop))
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
    temp = await modules.build(port='/dev/ot_module_sim_tempdeck0',
                               model='tempdeck',
                               simulating=True,
                               interrupt_callback=lambda x: None,
                               loop=loop,
                               execution_manager=ExecutionManager(loop=loop))
    await asyncio.wait_for(temp.set_temperature(10), 0.2)
    assert temp.temperature == 10
    assert temp.target == 10
    assert temp.status == 'holding at target'
    await temp.deactivate()
    assert temp.temperature == 0
    assert temp.target is None
    assert temp.status == 'idle'


async def test_poller(monkeypatch, loop):
    temp = modules.tempdeck.TempDeck(
            port='/dev/ot_module_sim_tempdeck0',
            execution_manager=ExecutionManager(loop=loop),
            simulating=True,
            loop=loop)
    hit = False

    def update_called():
        nonlocal hit
        hit = True

    monkeypatch.setattr(temp._driver, 'update_temperature', update_called)
    await temp._connect()
    assert temp._poller.is_alive()
    await asyncio.sleep(tempdeck.TEMP_POLL_INTERVAL_SECS * 1.1)
    assert hit
