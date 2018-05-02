import pytest

from tests.opentrons.conftest import fuzzy_assert
from opentrons.driver.module_drivers import temp_deck_driver


def create_temp_deck_mocks():
    from opentrons.drivers.smoothie_drivers import serial_communication

    def write_with_log(command, connection, timeout):
        # simulating how the firmware will handle commands and respond
        if 'C' in command:
            # setting the temperature

            # find the temperature in the string, then check that it is
            # a valid temperature
            # raise an error if it's a bad value
            if bad_data:
                return 'ERROR\r\n'

            return 'ok\r\nok\r\n'
        elif 'X' in command:
            # turning it off
            return 'ok\r\nok\r\n'
        return

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)

    return serial_communication


def test_set_temp_deck_temperature(monkeypatch):
    sc = create_temp_deck_mocks()

    # tell the temp-deck to be at 50 degrees C
    res = sc.write_and_return('C50')

    expected = 'ok\r\nok\r\n'
    fuzzy_assert(result=res, expected=expected)


def test_set_temp_deck_temperature(monkeypatch):
    sc = create_temp_deck_mocks()

    # tell the temp-deck to be at 50 degrees C
    res = sc.write_and_return('C101')

    expected = 'ERROR\r\n'
    fuzzy_assert(result=res, expected=expected)


def test_set_temp_deck_temperature(monkeypatch):
    sc = create_temp_deck_mocks()

    # tell the temp-deck to be at 50 degrees C
    res = sc.write_and_return('X')

    expected = 'ok\r\nok\r\n'
    fuzzy_assert(result=res, expected=expected)
