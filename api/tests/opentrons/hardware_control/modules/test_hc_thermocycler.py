import asyncio
from opentrons.hardware_control import modules


def test_sim_initialization():
    temp = modules.build('', 'thermocycler', True)
    assert isinstance(temp, modules.AbstractModule)


def test_sim_state():
    temp = modules.build('', 'thermocycler', True)
    assert temp.temperature is None
    assert temp.target is None
    assert temp.status == 'idle'
    assert temp.live_data['status'] == temp.status
    assert temp.live_data['data']['currentTemp'] == temp.temperature
    assert temp.live_data['data']['targetTemp'] == temp.target
    status = temp.device_info
    assert status['serial'] == 'dummySerial'
    assert status['model'] == 'dummyModel'
    assert status['version'] == 'dummyVersion'


async def test_sim_update():
    temp = modules.build('', 'thermocycler', True)
    temp.set_temperature(10, None, 4.0)
    assert temp.temperature == 10
    assert temp.target == 10
    assert temp.status == 'holding at target'
    await asyncio.wait_for(temp.wait_for_temp(), timeout=0.2)
    temp.deactivate()
    assert temp.temperature is None
    assert temp.target is None
    assert temp.status == 'idle'
