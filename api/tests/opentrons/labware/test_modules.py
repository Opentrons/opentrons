# Test loading container onto a module
# TODO: Change to 'magdeck' to 'Magnetic Module' or similar and 'tempdeck' to
# TODO: 'Temperature Module' or similar

import pytest
from threading import Lock
from opentrons.drivers.mag_deck import MagDeck as MagDeckDriver
from opentrons.drivers.temp_deck import TempDeck as TempDeckDriver
from opentrons.drivers import serial_communication


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
def test_load_correct_engage_height(robot, modules, labware):
    robot.reset()
    md = modules.load('magdeck', '1')
    test_container = labware.load('biorad_96_wellplate_200ul_pcr',
                                  '1', share=True)
    assert test_container.magdeck_engage_height() == 18
    assert md.labware.get_children_list()[1].magdeck_engage_height() == \
        test_container.magdeck_engage_height()
