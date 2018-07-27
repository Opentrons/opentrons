# Test loading container onto a module
import pytest
from opentrons import robot, labware, modules
from opentrons.drivers.mag_deck import MagDeck as MagDeckDriver
from opentrons.drivers.temp_deck import TempDeck as TempDeckDriver


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

    monkeypatch.setattr(MagDeckDriver, 'connect', mock_connect)
    modules.load('magdeck', '4')
    assert connected


def test_run_tempdeck_connected(
        non_simulating, virtual_smoothie_env, monkeypatch):
    connected = False

    def mock_connect(self, port):
        nonlocal connected
        connected = True

    monkeypatch.setattr(TempDeckDriver, 'connect', mock_connect)
    modules.load('tempdeck', '5')
    assert connected
