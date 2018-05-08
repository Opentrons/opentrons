# from tests.opentrons.conftest import fuzzy_assert


def create_temp_deck_mocks(mp):
    from opentrons.drivers.smoothie_drivers import serial_communication

    def write_with_log(command, ack, connection, timeout=None):
        # simulating how the firmware will handle commands and respond
        if 'C' in command:
            # setting the temperature

            # find the temperature in the string, then check that it is
            # a valid temperature
            # raise an error if it's a bad value
            if '101' in command:
                return 'ERROR\r\n'

            return 'ok\r\nok\r\n'
        elif 'X' in command:
            # turning it off
            return 'ok\r\nok\r\n'
        return

    mp.setattr(
        serial_communication,
        'write_and_return',
        write_with_log)

    return serial_communication


def test_set_temp_deck_temperature(monkeypatch):
    sc = create_temp_deck_mocks(monkeypatch)

    # tell the temp-deck to be at 50 degrees C
    res = sc.write_and_return('C50', 'ok\r\nok\r\n', None)

    expected = 'ok\r\nok\r\n'
    assert res == expected
    # fuzzy_assert(result=res, expected=expected)


def test_fail_temp_deck_temperature(monkeypatch):
    sc = create_temp_deck_mocks(monkeypatch)

    # tell the temp-deck to be at 50 degrees C
    res = sc.write_and_return('C101', 'ok\r\nok\r\n', None)

    expected = 'ERROR\r\n'
    assert res == expected
    # fuzzy_assert(result=res, expected=expected)


def test_turn_off_temp_deck_temperature(monkeypatch):
    sc = create_temp_deck_mocks(monkeypatch)

    # tell the temp-deck to be at 50 degrees C
    res = sc.write_and_return('X', 'ok\r\nok\r\n', None)

    expected = 'ok\r\nok\r\n'
    print(res)
    assert res == expected
    # fuzzy_assert(result=res, expected=expected)
