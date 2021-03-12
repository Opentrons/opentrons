import pytest
import asyncio
from unittest import mock
from opentrons.hardware_control import modules, ExecutionManager

from opentrons.drivers.rpi_drivers.types import USBPort


@pytest.fixture
def usb_port():
    return USBPort(
        name='', sub_names=[], hub=None,
        port_number=None, device_path='/dev/ot_module_sim_thermocycler0')


async def test_sim_initialization(loop, usb_port):
    therm = await modules.build(port='/dev/ot_module_sim_thermocycler0',
                                usb_port=usb_port,
                                which='thermocycler',
                                simulating=True,
                                interrupt_callback=lambda x: None,
                                loop=loop,
                                execution_manager=ExecutionManager(loop=loop))

    assert isinstance(therm, modules.AbstractModule)


async def test_lid(loop):
    therm = await modules.build(port='/dev/ot_module_sim_thermocycler0',
                                usb_port=usb_port,
                                which='thermocycler',
                                simulating=True,
                                interrupt_callback=lambda x: None,
                                loop=loop,
                                execution_manager=ExecutionManager(loop=loop))

    assert therm.lid_status == 'open'

    await therm.open()
    assert therm.lid_status == 'open'

    await therm.close()
    assert therm.lid_status == 'closed'

    await therm.close()
    assert therm.lid_status == 'closed'

    await therm.open()
    assert therm.lid_status == 'open'


async def test_sim_state(loop, usb_port):
    therm = await modules.build(port='/dev/ot_module_sim_thermocycler0',
                                usb_port=usb_port,
                                which='thermocycler',
                                simulating=True,
                                interrupt_callback=lambda x: None,
                                loop=loop,
                                execution_manager=ExecutionManager(loop=loop))

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


async def test_sim_update(loop, usb_port):
    therm = await modules.build(port='/dev/ot_module_sim_thermocycler0',
                                usb_port=usb_port,
                                which='thermocycler',
                                simulating=True,
                                interrupt_callback=lambda x: None,
                                loop=loop,
                                execution_manager=ExecutionManager(loop=loop))

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


async def test_set_temperature(monkeypatch, loop, usb_port):
    hw_tc = await modules.build(port='/dev/ot_module_sim_thermocycler0',
                                usb_port=usb_port,
                                which='thermocycler',
                                simulating=True,
                                interrupt_callback=lambda x: None,
                                loop=loop,
                                execution_manager=ExecutionManager(loop=loop))

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

    # Test hold_time < HOLD_TIME_FUZZY_SECONDS. Here we know
    # that asyncio.sleep will be called with the direct hold
    # time rather than increments of 0.1
    sleep_mock = mock.Mock()
    async_sleep_mock = mock.Mock(side_effect=asyncio.coroutine(sleep_mock))
    monkeypatch.setattr(asyncio, 'sleep', async_sleep_mock)
    await hw_tc.set_temperature(40, hold_time_seconds=2)
    async_sleep_mock.assert_called_once_with(2)
    set_temp_driver_mock.assert_called_once_with(temp=40,
                                                 hold_time=2,
                                                 volume=None,
                                                 ramp_rate=None)
    set_temp_driver_mock.reset_mock()
