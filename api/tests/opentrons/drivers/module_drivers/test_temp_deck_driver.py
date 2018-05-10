# from tests.opentrons.conftest import fuzzy_assert

# Simulating how the firmware will handle commands and respond
# The ACK argument given to 'write_and_return' is what the
# 'serial_communication' module searhces for.
# Once it sees those characters, it then stops reading,
# strips those ACK characters from the response, the return the response
# If you send a commmand to the serial comm module and it never sees the
# expected ACK, then it'll eventually time out and return an error


def test_get_temp_deck_temperature(monkeypatch):
    # Get the curent and target temperatures
    # If no target temp has been previously set,
    # then the response will set 'T' to 'none'
    from opentrons.drivers.smoothie_drivers import serial_communication

    def write_with_log(command, ack, connection, timeout=None):
        current_temp = 24
        target_temp = 'none'

        if command == 'M105':
            return 'T:' + str(target_temp) \
                + ' C:' + str(current_temp) \
                + '\r\nok\r\nok\r\n'

    monkeypatch.setattr(
        serial_communication,
        'write_and_return',
        write_with_log)

    res = serial_communication.write_and_return('M105', 'ok\r\nok\r\n', None)

    expected = 'T:none C:24\r\nok\r\nok\r\n'
    assert res == expected
    # fuzzy_assert(result=res, expected=expected)


def test_set_temp_deck_temperature(monkeypatch):
    # Set target temperature
    from opentrons.drivers.smoothie_drivers import serial_communication

    def write_with_log(command, ack, connection, timeout=None):
        if 'M104' in command:
            return 'ok\r\nok\r\n'

    monkeypatch.setattr(
        serial_communication,
        'write_and_return',
        write_with_log)

    res = serial_communication.write_and_return(
        'M104 S55', 'ok\r\nok\r\n', None)

    expected = 'ok\r\nok\r\n'
    assert res == expected
    # fuzzy_assert(result=res, expected=expected)


def test_fail_set_temp_deck_temperature(monkeypatch):
    from opentrons.drivers.smoothie_drivers import serial_communication

    current_temp_deck_status = 'ERROR'

    def write_with_log(command, ack, connection, timeout=None):

        if 'M104' in command and current_temp_deck_status == 'ERROR':
            return 'ERROR\r\nok\r\nok\r\n'

    monkeypatch.setattr(
        serial_communication,
        'write_and_return',
        write_with_log)

    res = serial_communication.write_and_return(
        'M104 S55', 'ok\r\nok\r\n', None)

    expected = 'ERROR\r\nok\r\nok\r\n'
    assert res == expected
    # fuzzy_assert(result=res, expected=expected)


def test_turn_off_temp_deck(monkeypatch):
    from opentrons.drivers.smoothie_drivers import serial_communication

    def write_with_log(command, ack, connection, timeout=None):
        if command == 'M18':
            return 'ok\r\nok\r\n'

    monkeypatch.setattr(
        serial_communication,
        'write_and_return',
        write_with_log)

    res = serial_communication.write_and_return('M18', 'ok\r\nok\r\n', None)

    expected = 'ok\r\nok\r\n'
    assert res == expected
    # fuzzy_assert(result=res, expected=expected)


def test_get_device_info(monkeypatch):
    # Get the device's Model, firmware version and Serial number
    from opentrons.drivers.smoothie_drivers import serial_communication

    model = 'temp-v1'
    firmware_version = 'edge-1a2b345'
    serial = 'td20180102A01'

    def write_with_log(command, ack, connection, timeout=None):
        if command == 'M115':
            return 'model:' + model \
                + ' version:' + firmware_version \
                + ' serial:' + serial \
                + '\r\nok\r\nok\r\n'

    monkeypatch.setattr(
        serial_communication,
        'write_and_return',
        write_with_log)
    res = serial_communication.write_and_return('M115', 'ok\r\nok\r\n', None)

    expected = ('model:temp-v1 '
                'version:edge-1a2b345 '
                'serial:td20180102A01'
                '\r\nok\r\nok\r\n')
    assert res == expected


def test_dfu_command(monkeypatch):
    from opentrons.drivers.smoothie_drivers import serial_communication

    def write_with_log(command, ack, connection, timeout=None):
        if command == 'dfu':
            return 'Entering Bootloader\r\nok\r\nok\r\n'

    monkeypatch.setattr(
        serial_communication,
        'write_and_return',
        write_with_log)

    res = serial_communication.write_and_return('dfu', 'ok\r\nok\r\n', None)

    expected = 'Entering Bootloader\r\nok\r\nok\r\n'
    assert res == expected
    # fuzzy_assert(result=res, expected=expected)
