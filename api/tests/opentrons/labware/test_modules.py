# Test loading container onto a module
# TODO: Change to 'magdeck' to 'Magnetic Module' or similar and 'tempdeck' to
# TODO: 'Temperature Module' or similar

import pytest
import asyncio
from threading import Lock
from opentrons.drivers.mag_deck import MagDeck as MagDeckDriver
from opentrons.drivers.temp_deck import TempDeck as TempDeckDriver
from opentrons.drivers import serial_communication
from opentrons.hardware_control import modules as hw_modules


@pytest.fixture
def non_simulating(robot):
    robot._driver.simulating = False
    yield
    robot._driver.simulating = True


@pytest.mark.api1_only
def test_load_container_onto_magdeck(modules, robot, labware):
    module_name = 'magdeck'
    slot = '1'

    md = modules.load(module_name, slot)
    assert md.labware.parent == robot._deck[slot]

    test_container = labware.load('96-flat', slot, share=True)
    assert test_container.parent == md.labware


@pytest.mark.api1_only
def test_load_container_onto_tempdeck(modules, robot, labware):
    module_name = 'tempdeck'
    slot = '2'

    md = modules.load(module_name, slot)
    assert md.labware.parent == robot._deck[slot]

    test_container = labware.load('96-flat', slot, share=True)
    assert test_container.parent == md.labware


@pytest.mark.api1_only
def test_simulating(virtual_smoothie_env, monkeypatch, modules):
    connected = False

    def mock_connect(self, port):
        nonlocal connected
        connected = True

    monkeypatch.setattr(MagDeckDriver, 'connect', mock_connect)
    modules.load('magdeck', '3')
    assert not connected


@pytest.mark.api1_only
def test_run_magdeck_connected(
        non_simulating, virtual_smoothie_env, monkeypatch, modules, robot):
    connected = False

    def mock_connect(self, port):
        nonlocal connected
        connected = True

    def mock_write(command, ack, serial_connection):
        return 'ok\n\rok\n\r'

    def mock_get_info(self):
        return {'serial': 'abc123', 'model': '8675309', 'version': '9001'}

    monkeypatch.setattr(MagDeckDriver, 'connect', mock_connect)
    monkeypatch.setattr(MagDeckDriver, 'get_device_info', mock_get_info)
    monkeypatch.setattr(serial_communication, 'write_and_return', mock_write)
    magdeck = modules.MagDeck(port='/dev/ot_module_magdeck1')
    magdeck.connect()
    robot._attached_modules = {'/dev/ot_module_magdeck0magdeck': magdeck}
    modules.load('magdeck', '4')
    assert connected


@pytest.mark.api1_only
def test_run_tempdeck_connected(
        non_simulating, virtual_smoothie_env, monkeypatch, modules, robot):
    connected = False

    def mock_connect(self, port):
        nonlocal connected
        connected = True
        self._lock = Lock()

    def mock_write(command, ack, serial_connection):
        return 'ok\n\rok\n\r'

    def mock_get_info(self):
        return {'serial': 'abc123', 'model': '8675309', 'version': '9001'}

    monkeypatch.setattr(TempDeckDriver, 'connect', mock_connect)
    monkeypatch.setattr(TempDeckDriver, 'get_device_info', mock_get_info)
    monkeypatch.setattr(serial_communication, 'write_and_return', mock_write)
    tempdeck = modules.TempDeck(port='/dev/ot_module_tempdeck1')
    tempdeck.connect()
    robot._attached_modules = {'/dev/ot_module_tempdeck0tempdeck': tempdeck}
    modules.load('tempdeck', '5')
    assert connected
    tempdeck.disconnect()  # Necessary to kill the thread started by connect()


@pytest.mark.api1_only
def test_load_correct_engage_height(robot, modules, labware, monkeypatch):
    robot.reset()
    md = modules.load('magdeck', '1')
    test_container = labware.load('biorad_96_wellplate_200ul_pcr',
                                  '1', share=True)
    assert test_container.magdeck_engage_height() == 18
    assert md.labware.get_children_list()[1].magdeck_engage_height() == \
        test_container.magdeck_engage_height()


@pytest.mark.api1_only
def test_use_correct_engage_height(robot, modules, labware):
    robot.reset()
    md = modules.load('magdeck', '1')
    test_container = labware.load('biorad_96_wellplate_200ul_pcr',
                                  '1', share=True)
    md.engage()
    assert md._height_shadow == test_container.magdeck_engage_height()

    md.engage(height=test_container.magdeck_engage_height())
    assert md._height_shadow == test_container.magdeck_engage_height()

    md.engage(offset=-test_container.magdeck_engage_height())
    assert md._height_shadow == 0

    md.engage(height_from_base=10)
    assert md._height_shadow == 15


@pytest.fixture
async def old_bootloader_module():
    module = await hw_modules.build(
        port='/dev/ot_module_tempdeck0',
        which='tempdeck',
        simulating=True,
        interrupt_callback=lambda x: None)
    module._device_info = {'model': 'temp_deck_v1'}
    module._driver = TempDeckDriver()
    return module


@pytest.fixture
async def new_bootloader_module():
    module = await hw_modules.build(
        port='/dev/ot_module_tempdeck0',
        which='tempdeck',
        simulating=True,
        interrupt_callback=lambda x: None)
    module._device_info = {'model': 'temp_deck_v1.1'}
    module._driver = TempDeckDriver()
    return module


@pytest.mark.api2_only
async def test_enter_bootloader(
        new_bootloader_module, virtual_smoothie_env, monkeypatch):

    async def mock_discover_ports_before_dfu_mode():
        return '/dev/ot_module_tempdeck0',

    def mock_enter_programming_mode(self):
        return 'ok\n\rok\n\r'

    async def mock_port_poll(_has_old_bootloader, ports_before_dfu_mode):
        return '/dev/ot_module_avrdude_bootloader'

    monkeypatch.setattr(
        TempDeckDriver, 'enter_programming_mode', mock_enter_programming_mode)
    monkeypatch.setattr(
        hw_modules.update,
        '_discover_ports',
        mock_discover_ports_before_dfu_mode)
    monkeypatch.setattr(hw_modules.update, '_port_poll', mock_port_poll)

    bootloader_port = await hw_modules.update.enter_bootloader(
        new_bootloader_module._driver,
        new_bootloader_module.name())

    assert bootloader_port == '/dev/ot_module_avrdude_bootloader'


@pytest.mark.api2_only
def test_old_bootloader_check(
        old_bootloader_module, new_bootloader_module, virtual_smoothie_env,
):
    assert hw_modules.update._has_old_bootloader(
        old_bootloader_module._device_info['model'])
    assert not hw_modules.update._has_old_bootloader(
        new_bootloader_module._device_info['model'])


@pytest.mark.api2_only
async def test_port_poll(virtual_smoothie_env, monkeypatch):
    has_old_bootloader = False
    timeout = 0.1
    monkeypatch.setattr(hw_modules.update, 'PORT_SEARCH_TIMEOUT', timeout)

    # Case 1: Bootloader port is successfully opened on the module
    async def mock_discover_ports1():
        return ['/dev/ot_module_magdeck0',
                '/dev/ot_module_avrdude_bootloader1']
    monkeypatch.setattr(hw_modules.update,
                        '_discover_ports', mock_discover_ports1)

    port_found = await asyncio.wait_for(
        hw_modules.update._port_poll(has_old_bootloader, None),
        hw_modules.update.PORT_SEARCH_TIMEOUT)
    assert port_found == '/dev/ot_module_avrdude_bootloader1'

    # Case 2: Switching to bootloader mode failed
    async def mock_discover_ports2():
        return ['/dev/ot_module_magdeck0', '/dev/ot_module_tempdeck1']
    monkeypatch.setattr(hw_modules.update,
                        '_discover_ports', mock_discover_ports2)

    with pytest.raises(asyncio.TimeoutError):
        port_found = await asyncio.wait_for(
            hw_modules.update._port_poll(has_old_bootloader, None),
            hw_modules.update.PORT_SEARCH_TIMEOUT)
        assert not port_found


@pytest.mark.api2_only
async def test_old_bootloader_port_poll(
        virtual_smoothie_env, monkeypatch):

    ports_before_switch = [
        '/dev/ot_module_magdeck0', '/dev/ot_module_tempdeck1']
    has_old_bootloader = True
    timeout = 0.1
    monkeypatch.setattr(hw_modules.update, 'PORT_SEARCH_TIMEOUT', timeout)

    # Case 1: Bootloader is opened on same port
    async def mock_discover_ports():
        return ['/dev/ot_module_magdeck0', '/dev/ot_module_tempdeck1']
    monkeypatch.setattr(hw_modules.update,
                        '_discover_ports', mock_discover_ports)

    with pytest.raises(asyncio.TimeoutError):
        port_found = await asyncio.wait_for(
            hw_modules.update._port_poll(
                has_old_bootloader, ports_before_switch),
            hw_modules.update.PORT_SEARCH_TIMEOUT)
        assert not port_found

    # Case 2: Bootloader is opened on a different port
    async def mock_discover_ports():
        return ['/dev/ot_module_magdeck2', '/dev/ot_module_tempdeck1']
    monkeypatch.setattr(hw_modules.update,
                        '_discover_ports', mock_discover_ports)

    port_found = await asyncio.wait_for(
        hw_modules.update._port_poll(has_old_bootloader, ports_before_switch),
        hw_modules.update.PORT_SEARCH_TIMEOUT)
    assert port_found == '/dev/ot_module_magdeck2'
