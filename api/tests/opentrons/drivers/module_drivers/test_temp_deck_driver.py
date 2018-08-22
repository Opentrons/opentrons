# from tests.opentrons.conftest import fuzzy_assert

# Simulating how the firmware will handle commands and respond
# The ACK argument given to 'write_and_return' is what the
# 'serial_communication' module searhces for.
# Once it sees those characters, it then stops reading,
# strips those ACK characters from the response, the return the response
# If you send a commmand to the serial comm module and it never sees the
# expected ACK, then it'll eventually time out and return an error


def test_get_temp_deck_temperature():
    # Get the curent and target temperatures
    # If no target temp has been previously set,
    # then the response will set 'T' to 'none'
    import types
    from opentrons.drivers.temp_deck import TempDeck

    temp_deck = TempDeck()
    temp_deck.simulating = False
    command_log = []
    return_string = 'T:none C:90'

    def _mock_send_command(self, command, timeout=None):
        nonlocal command_log, return_string
        command_log += [command]
        return return_string

    temp_deck._send_command = types.MethodType(_mock_send_command, temp_deck)

    assert temp_deck.temperature == 25  # driver's initialized value
    assert temp_deck.target is None
    temp_deck.update_temperature()
    assert command_log == ['M105']
    assert temp_deck.temperature == 90
    assert temp_deck.target is None

    command_log = []
    return_string = 'T:99 C:90'
    temp_deck.update_temperature()
    assert command_log == ['M105']
    assert temp_deck.temperature == 90
    assert temp_deck.target == 99


def test_fail_get_temp_deck_temperature():
    # Get the curent and target temperatures
    # If no target temp has been previously set,
    # then the response will set 'T' to 'none'
    import types
    from opentrons.drivers.temp_deck import TempDeck

    temp_deck = TempDeck()
    temp_deck.simulating = False
    return_string = 'T:none C:90'

    def _mock_send_command(self, command, timeout=None):
        return return_string

    temp_deck._send_command = types.MethodType(_mock_send_command, temp_deck)

    temp_deck.update_temperature()

    assert temp_deck._temperature == {'current': 90, 'target': None}

    return_string = 'Tx:none C:1'

    def _mock_send_command(self, command, timeout=None):
        return return_string

    temp_deck._send_command = types.MethodType(_mock_send_command, temp_deck)

    temp_deck.update_temperature()
    assert temp_deck._temperature == {'current': 90, 'target': None}


def test_set_temp_deck_temperature(monkeypatch):
    # Set target temperature
    import types
    from opentrons.drivers.temp_deck import TempDeck

    temp_deck = TempDeck()
    temp_deck.simulating = False
    command_log = []

    def _mock_send_command(self, command, timeout=None):
        nonlocal command_log
        command_log += [command]
        return ''

    temp_deck._send_command = types.MethodType(_mock_send_command, temp_deck)

    temp_deck.set_temperature(99)
    assert command_log[-1] == 'M104 S99.0'

    temp_deck.set_temperature(-9)
    assert command_log[-1] == 'M104 S-9.0'


def test_fail_set_temp_deck_temperature(monkeypatch):
    import types
    from opentrons.drivers import serial_communication

    error_msg = 'ERROR: some error here'

    def _raise_error(self, command, ack, serial_connection, timeout=None):
        nonlocal error_msg
        return error_msg

    serial_communication.write_and_return = types.MethodType(
        _raise_error, serial_communication)

    from opentrons.drivers.temp_deck import TempDeck
    temp_deck = TempDeck()
    temp_deck.simulating = False

    res = temp_deck.set_temperature(-9)
    assert res == error_msg

    error_msg = 'Alarm: something alarming happened here'

    def _raise_error(self, command, ack, serial_connection, timeout=None):
        nonlocal error_msg
        return error_msg

    serial_communication.write_and_return = types.MethodType(
        _raise_error, serial_communication)

    res = temp_deck.set_temperature(-9)
    assert res == error_msg


def test_turn_off_temp_deck(monkeypatch):
    import types
    from opentrons.drivers.temp_deck import TempDeck

    temp_deck = TempDeck()
    temp_deck.simulating = False
    command_log = []

    def _mock_send_command(self, command, timeout=None):
        nonlocal command_log
        command_log += [command]
        return ''

    temp_deck._send_command = types.MethodType(_mock_send_command, temp_deck)

    temp_deck.disengage()
    assert command_log == ['M18']


def test_get_device_info(monkeypatch):

    import types
    from opentrons.drivers.temp_deck import TempDeck

    temp_deck = TempDeck()
    temp_deck.simulating = False
    command_log = []

    model = 'temp-v1'
    firmware_version = 'edge-1a2b345'
    serial = 'td20180102A01'

    def _mock_send_command(self, command, timeout=None):
        nonlocal command_log
        command_log += [command]
        return 'model:' + model \
            + ' version:' + firmware_version \
            + ' serial:' + serial

    temp_deck._send_command = types.MethodType(_mock_send_command, temp_deck)

    res = temp_deck.get_device_info()
    assert res == {
        'model': model,
        'version': firmware_version,
        'serial': serial
    }


def test_fail_get_device_info(monkeypatch):

    import types
    from opentrons.drivers.temp_deck import TempDeck

    temp_deck = TempDeck()
    temp_deck.simulating = False
    command_log = []

    model = 'temp-v1'
    firmware_version = 'edge-1a2b345'
    serial = 'td20180102A01'

    def _mock_send_command(self, command, timeout=None):
        nonlocal command_log
        command_log += [command]
        return 'modelXX:' + model \
            + ' version:' + firmware_version \
            + ' serial:' + serial

    temp_deck._send_command = types.MethodType(_mock_send_command, temp_deck)

    res = temp_deck.get_device_info()
    assert 'error' in res


def test_dfu_command(monkeypatch):
    import types
    from opentrons.drivers.temp_deck import TempDeck

    temp_deck = TempDeck()
    temp_deck.simulating = False
    command_log = []

    def _mock_send_command(self, command, timeout=None):
        nonlocal command_log
        command_log += [command]
        return ''

    temp_deck._send_command = types.MethodType(_mock_send_command, temp_deck)

    temp_deck.enter_programming_mode()
    assert command_log == ['dfu']
