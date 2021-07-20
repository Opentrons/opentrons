import pytest
from opentrons.hardware_control import modules, ExecutionManager


from opentrons.drivers.rpi_drivers.types import USBPort


@pytest.fixture
def usb_port():
    return USBPort(
        name='', sub_names=[], hub=None,
        port_number=None, device_path='/dev/ot_module_sim_tempdeck0')


async def test_sim_initialization(loop, usb_port):
    temp = await modules.build(port='/dev/ot_module_sim_tempdeck0',
                               usb_port=usb_port,
                               which='tempdeck',
                               simulating=True,
                               interrupt_callback=lambda x: None,
                               loop=loop,
                               execution_manager=ExecutionManager(loop=loop))
    assert isinstance(temp, modules.AbstractModule)


async def test_sim_state(loop, usb_port):
    temp = await modules.TempDeck.build(
        port='/dev/ot_module_sim_tempdeck0',
        usb_port=usb_port,
        simulating=True,
        interrupt_callback=lambda x: None,
        loop=loop,
        execution_manager=ExecutionManager(loop=loop)
    )
    await temp.wait_next_poll()
    assert temp.temperature == 0
    assert temp.target is None
    assert temp.status == 'idle'
    assert temp.live_data['status'] == temp.status
    assert temp.live_data['data']['currentTemp'] == temp.temperature
    assert temp.live_data['data']['targetTemp'] == temp.target
    status = temp.device_info
    assert status['serial'] == 'dummySerialTD'
    # return v1 if sim_model is not passed
    assert status['model'] == 'temp_deck_v1.1'
    assert status['version'] == 'dummyVersionTD'


async def test_sim_update(loop, usb_port):
    temp = await modules.TempDeck.build(
        port='/dev/ot_module_sim_tempdeck0',
        usb_port=usb_port,
        simulating=True,
        interrupt_callback=lambda x: None,
        loop=loop,
        execution_manager=ExecutionManager(loop=loop),
        polling_frequency=0
    )
    await temp.set_temperature(10)
    assert temp.temperature == 10
    assert temp.target == 10
    assert temp.status == 'holding at target'
    await temp.deactivate()
    await temp.wait_next_poll()
    assert temp.temperature == 23
    assert temp.target is None
    assert temp.status == 'idle'


async def test_revision_model_parsing(loop, usb_port):
    mag = await modules.TempDeck.build(
        port='',
        simulating=True,
        usb_port=usb_port,
        interrupt_callback=lambda x: None,
        loop=loop,
        execution_manager=ExecutionManager(loop=loop),
        polling_frequency=0
    )
    mag._device_info['model'] = 'temp_deck_v20'
    assert mag.model() == 'temperatureModuleV2'
    mag._device_info['model'] = 'temp_deck_v4.0'
    assert mag.model() == 'temperatureModuleV1'
    del mag._device_info['model']
    assert mag.model() == 'temperatureModuleV1'
    mag._device_info['model'] = 'temp_deck_v1.1'
    assert mag.model() == 'temperatureModuleV1'
