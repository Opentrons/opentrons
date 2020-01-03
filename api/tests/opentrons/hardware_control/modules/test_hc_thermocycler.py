import asyncio
from unittest import mock
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
    assert status['serial'] == 'dummySerialTC'
    assert status['model'] == 'dummyModelTC'
    assert status['version'] == 'dummyVersionTC'


async def test_sim_update():
    therm = await modules.build('', 'thermocycler', True, lambda x: None)

    await therm.set_temperature(temperature=10,
                                hold_time_seconds=None,
                                hold_time_minutes=4.0,
                                volume=50)
    assert therm.temperature == 10
    assert therm.target == 10
    assert therm.status == 'holding at target'
    await asyncio.wait_for(therm.wait_for_temp(), timeout=0.2)
    await therm.deactivate_block()
    assert therm.temperature is None
    assert therm.target is None
    assert therm.status == 'idle'

    await therm.set_lid_temperature(temperature=80)
    assert therm.lid_temp == 80
    assert therm.lid_target == 80
    await asyncio.wait_for(therm.wait_for_lid_temp(), timeout=0.2)
    await therm.deactivate_lid()
    assert therm.lid_temp is None
    assert therm.lid_target is None

    await therm.set_temperature(temperature=10, volume=60, hold_time_seconds=2)
    await therm.set_lid_temperature(temperature=70)
    await asyncio.wait_for(therm.wait_for_temp(), timeout=0.2)
    await asyncio.wait_for(therm.wait_for_lid_temp(), timeout=0.2)
    assert therm.temperature == 10
    assert therm.target == 10
    assert therm.lid_temp == 70
    assert therm.lid_target == 70
    await therm.deactivate()
    assert therm.temperature is None
    assert therm.target is None
    assert therm.status == 'idle'
    assert therm.lid_temp is None
    assert therm.lid_target is None


async def test_set_temperature(monkeypatch):
    hw_tc = await modules.build('', 'thermocycler', True, lambda x: None)

    def async_return(result):
        f = asyncio.Future()
        f.set_result(result)
        return f
    set_temp_driver_mock = mock.Mock(return_value=async_return(''))
    monkeypatch.setattr(
        hw_tc._driver, 'set_temperature', set_temp_driver_mock)

    # Test volume param
    await hw_tc.set_temperature(30, hold_time_seconds=20,
                                hold_time_minutes=1, volume=35)
    set_temp_driver_mock.assert_called_once_with(temp=30,
                                                 hold_time=80,
                                                 volume=35,
                                                 ramp_rate=None)
    set_temp_driver_mock.reset_mock()

    # Test just seconds hold

    await hw_tc.set_temperature(20, hold_time_seconds=30)
    set_temp_driver_mock.assert_called_once_with(temp=20,
                                                 hold_time=30,
                                                 volume=None,
                                                 ramp_rate=None)
    set_temp_driver_mock.reset_mock()

    # Test just minutes hold

    await hw_tc.set_temperature(40, hold_time_minutes=5.5)
    set_temp_driver_mock.assert_called_once_with(temp=40,
                                                 hold_time=330,
                                                 volume=None,
                                                 ramp_rate=None)
    set_temp_driver_mock.reset_mock()
