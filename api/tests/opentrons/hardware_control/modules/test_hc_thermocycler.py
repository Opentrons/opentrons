import asyncio
from opentrons.hardware_control import modules


async def test_sim_initialization():
    therm = await modules.build('', 'thermocycler', True, lambda x: None)

    assert isinstance(therm, modules.AbstractModule)


async def test_lid():
    therm = await modules.build('', 'thermocycler', True, lambda x: None)

    assert therm.lid_status == 'open'

    await therm.open()
    assert therm.lid_status == 'open'

    await therm.close()
    assert therm.lid_status == 'closed'

    await therm.close()
    assert therm.lid_status == 'closed'

    await therm.open()
    assert therm.lid_status == 'open'


async def test_sim_state():
    therm = await modules.build('', 'thermocycler', True, lambda x: None)

    assert therm.temperature is None
    assert therm.target is None
    assert therm.status == 'idle'
    assert therm.live_data['status'] == therm.status
    assert therm.live_data['data']['currentTemp'] == therm.temperature
    assert therm.live_data['data']['targetTemp'] == therm.target
    status = therm.device_info
    assert status['serial'] == 'dummySerial'
    assert status['model'] == 'dummyModel'
    assert status['version'] == 'dummyVersion'


async def test_sim_update():
    therm = await modules.build('', 'thermocycler', True, lambda x: None)

    await therm.set_temperature(10, None, 4.0)
    assert therm.temperature == 10
    assert therm.target == 10
    assert therm.status == 'holding at target'
    await asyncio.wait_for(therm.wait_for_temp(), timeout=0.2)
    therm.deactivate()
    assert therm.temperature is None
    assert therm.target is None
    assert therm.status == 'idle'
