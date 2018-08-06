# Test loading container onto a module
import pytest
import asyncio
from opentrons import robot, labware, modules
from opentrons.drivers.mag_deck import MagDeck as MagDeckDriver
from opentrons.drivers.temp_deck import TempDeck as TempDeckDriver
from opentrons.drivers import serial_communication


@pytest.fixture
def non_simulating():
    robot._driver.simulating = False
    yield
    robot._driver.simulating = True


def test_load_container_onto_magdeck():
    module_name = 'magdeck'
    slot = '1'

    md = modules.load(module_name, slot)
    assert md.labware.parent == robot._deck[slot]

    test_container = labware.load('96-flat', slot, share=True)
    assert test_container.parent == md.labware


def test_load_container_onto_tempdeck():
    module_name = 'tempdeck'
    slot = '2'

    md = modules.load(module_name, slot)
    assert md.labware.parent == robot._deck[slot]

    test_container = labware.load('96-flat', slot, share=True)
    assert test_container.parent == md.labware


def test_simulating(virtual_smoothie_env, monkeypatch):
    connected = False

    def mock_connect(self, port):
        nonlocal connected
        connected = True

    monkeypatch.setattr(MagDeckDriver, 'connect', mock_connect)
    modules.load('magdeck', '3')
    assert not connected


def test_run_magdeck_connected(
        non_simulating, virtual_smoothie_env, monkeypatch):
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
    magdeck = modules.MagDeck(port='/dev/modules/tty1_magdeck')
    magdeck.connect()
    robot.modules = [magdeck]
    modules.load('magdeck', '4')
    assert connected


def test_run_tempdeck_connected(
        non_simulating, virtual_smoothie_env, monkeypatch):
    connected = False

    def mock_connect(self, port):
        nonlocal connected
        connected = True

    def mock_write(command, ack, serial_connection):
        return 'ok\n\rok\n\r'

    def mock_get_info(self):
        return {'serial': 'abc123', 'model': '8675309', 'version': '9001'}

    monkeypatch.setattr(TempDeckDriver, 'connect', mock_connect)
    monkeypatch.setattr(TempDeckDriver, 'get_device_info', mock_get_info)
    monkeypatch.setattr(serial_communication, 'write_and_return', mock_write)
    tempdeck = modules.TempDeck(port='/dev/modules/tty1_tempdeck')
    tempdeck.connect()
    robot.modules = [tempdeck]
    modules.load('tempdeck', '5')
    assert connected
    tempdeck.disconnect()  # Necessary to kill the thread started by connect()


@pytest.fixture
def old_bootloader_module():
    module = modules.TempDeck(port='/dev/modules/tty0_tempdeck')
    module._device_info = {'model': 'temp_deck_v1'}
    module._driver = TempDeckDriver()
    return module


@pytest.fixture
def new_bootloader_module():
    module = modules.TempDeck(port='/dev/modules/tty0_tempdeck')
    module._device_info = {'model': 'temp_deck_v1.1'}
    module._driver = TempDeckDriver()
    return module


async def test_enter_bootloader(
        new_bootloader_module, virtual_smoothie_env, monkeypatch):

    async def mock_discover_ports_before_dfu_mode():
        return 'tty0_tempdeck'

    def mock_enter_programming_mode(self):
        return 'ok\n\rok\n\r'

    async def mock_port_poll(_has_old_bootloader, ports_before_dfu_mode):
        return '/dev/modules/tty0_bootloader'

    monkeypatch.setattr(
        TempDeckDriver, 'enter_programming_mode', mock_enter_programming_mode)
    monkeypatch.setattr(
        modules, '_discover_ports', mock_discover_ports_before_dfu_mode)
    monkeypatch.setattr(modules, '_port_poll', mock_port_poll)

    bootloader_port = await modules.enter_bootloader(new_bootloader_module)
    assert bootloader_port == '/dev/modules/tty0_bootloader'


def test_old_bootloader_check(
        old_bootloader_module, new_bootloader_module, virtual_smoothie_env):
    assert modules._has_old_bootloader(old_bootloader_module)
    assert not modules._has_old_bootloader(new_bootloader_module)


async def test_port_poll(virtual_smoothie_env, monkeypatch):
    has_old_bootloader = False
    timeout = 0.1
    monkeypatch.setattr(modules, 'PORT_SEARCH_TIMEOUT', timeout)

    # Case 1: Bootloader port is successfully opened on the module
    async def mock_discover_ports1():
        return ['tty0_magdeck', 'tty1_bootloader']
    monkeypatch.setattr(modules, '_discover_ports', mock_discover_ports1)

    port_found = await asyncio.wait_for(
        modules._port_poll(has_old_bootloader, None),
        modules.PORT_SEARCH_TIMEOUT)
    assert port_found == '/dev/modules/tty1_bootloader'

    # Case 2: Switching to bootloader mode failed
    async def mock_discover_ports2():
        return ['tty0_magdeck', 'tty1_tempdeck']
    monkeypatch.setattr(modules, '_discover_ports', mock_discover_ports2)

    with pytest.raises(asyncio.TimeoutError):
        port_found = await asyncio.wait_for(
            modules._port_poll(has_old_bootloader, None),
            modules.PORT_SEARCH_TIMEOUT)
        assert not port_found


async def test_old_bootloader_port_poll(virtual_smoothie_env, monkeypatch):
    ports_before_switch = ['tty0_magdeck', 'tty1_tempdeck']
    has_old_bootloader = True
    timeout = 0.1
    monkeypatch.setattr(modules, 'PORT_SEARCH_TIMEOUT', timeout)

    # Case 1: Bootloader is opened on same port
    async def mock_discover_ports():
        return ['tty0_magdeck', 'tty1_tempdeck']
    monkeypatch.setattr(modules, '_discover_ports', mock_discover_ports)

    with pytest.raises(asyncio.TimeoutError):
        port_found = await asyncio.wait_for(
            modules._port_poll(has_old_bootloader, ports_before_switch),
            modules.PORT_SEARCH_TIMEOUT)
        assert not port_found

    # Case 2: Bootloader is opened on a different port
    async def mock_discover_ports():
        return ['tty2_magdeck', 'tty1_tempdeck']
    monkeypatch.setattr(modules, '_discover_ports', mock_discover_ports)

    port_found = await asyncio.wait_for(
        modules._port_poll(has_old_bootloader, ports_before_switch),
        modules.PORT_SEARCH_TIMEOUT)
    assert port_found == '/dev/modules/tty2_magdeck'
