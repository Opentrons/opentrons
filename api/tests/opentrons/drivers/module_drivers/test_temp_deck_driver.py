import pytest

from tests.opentrons.conftest import fuzzy_assert


def test_set_temp_deck_temperature(monkeypatch):
    from opentrons.drivers.smoothie_drivers import serial_communication
    command_log = []

    def write_with_log(command, connection, timeout):
        return 'I am hot: 50'

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)

    # tell the temp-deck to be at 50 degrees C
    res = serial_communication.write_and_return('Be Hot! 50')

    expected = ['I am hot: 50']
    fuzzy_assert(result=command_log, expected=expected)
