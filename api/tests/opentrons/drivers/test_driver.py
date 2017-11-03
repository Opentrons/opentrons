import pytest
from tests.opentrons.conftest import fuzzy_assert


@pytest.fixture
def smoothie(monkeypatch):
    from opentrons.drivers.smoothie_drivers.v3_0_0.driver_3_0 import \
         SmoothieDriver_3_0_0 as SmoothieDriver

    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'true')
    driver = SmoothieDriver()
    driver.connect()
    yield driver
    driver.disconnect()
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'false')


def position(x, y, z, a, b, c):
    return {axis: value for axis, value in zip('XYZABC', [x, y, z, a, b, c])}


def test_plunger_commands(smoothie, monkeypatch):
    from opentrons.drivers.smoothie_drivers.v3_0_0 import serial_communication
    from opentrons.drivers.smoothie_drivers.v3_0_0 import driver_3_0
    command_log = []
    smoothie.simulating = False

    def write_with_log(command, connection, timeout):
        command_log.append(command)
        return serial_communication.DRIVER_ACK.decode()

    def _parse_axis_values(arg):
        return smoothie.position

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)
    monkeypatch.setattr(driver_3_0, '_parse_axis_values', _parse_axis_values)

    smoothie.home()
    smoothie.move({'X': 0, 'Y': 1, 'Z': 2, 'A': 3})
    smoothie.move({'X': 0, 'Y': 1, 'Z': 2, 'A': 3, 'B': 4, 'C': 5})

    fuzzy_assert(
        result=command_log,
        expected=[
            ['M907 B0.5 C0.5 M400'],              # Set plunger current high
            ['G4P0.05 M400'],                     # Dwell
            ['G28.2[ABCZ]+ G28.2X G28.2Y M400'],  # Home
            ['M907 B0.1 C0.1 M400'],              # Set plunger current low
            ['G4P0.05 M400'],                       # Dwell
            ['M114.2 M400'],                      # Get position
            ['M114.2 M400'],                      # Get position
            ['G0.+ M400'],                        # Move (non-plunger)
            ['M907 B0.5 C0.5 M400'],              # Set plunger current high
            ['G4P0.05 M400'],                       # Dwell
            ['G0.+[BC].+ M400'],                  # Move (including BC)
            ['M907 B0.1 C0.1 M400'],              # Set plunger current low
            ['G4P0.05 M400']                      # Dwell
        ]
    )


def test_functional(smoothie):
    from opentrons.drivers.smoothie_drivers.v3_0_0.driver_3_0 import HOMED_POSITION  # NOQA

    assert smoothie.position == position(0, 0, 0, 0, 0, 0)

    smoothie.move({'X': 0, 'Y': 1, 'Z': 2, 'A': 3, 'B': 4, 'C': 5})
    assert smoothie.position == position(0, 1, 2, 3, 4, 5)

    smoothie.move({'X': 1, 'Z': 3, 'C': 6})
    assert smoothie.position == position(1, 1, 3, 3, 4, 6)

    smoothie.home(axis='abc', disabled='')
    assert smoothie.position == position(
        1, 1, 3,
        HOMED_POSITION['A'],
        HOMED_POSITION['B'],
        HOMED_POSITION['C'])

    smoothie.home(disabled='')
    assert smoothie.position == HOMED_POSITION
