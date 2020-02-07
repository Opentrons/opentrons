# from tests.opentrons.conftest import fuzzy_assert

# Simulating how the firmware will handle commands and respond
# The ACK argument given to 'write_and_return' is what the
# 'serial_communication' module searhces for.
# Once it sees those characters, it then stops reading,
# strips those ACK characters from the response, the return the response
# If you send a commmand to the serial comm module and it never sees the
# expected ACK, then it'll eventually time out and return an error
import pytest
import time
import asyncio
from threading import Lock
from opentrons.drivers import serial_communication
from opentrons.drivers.temp_deck import TempDeck
from opentrons.drivers import utils


@pytest.fixture
def temp_deck():
    temp_deck = TempDeck()
    temp_deck.simulating = False
    temp_deck._lock = Lock()
    yield temp_deck
    temp_deck._lock = None


def test_get_temp_deck_temperature(monkeypatch, temp_deck):
    # Get the curent and target temperatures
    # If no target temp has been previously set,
    # then the response will set 'T' to 'none'
    command_log = []
    return_string = 'T:none C:90'

    def _mock_send_command(command, timeout=None, tag=None):
        nonlocal command_log, return_string
        command_log += [command]
        return return_string

    monkeypatch.setattr(temp_deck, '_send_command', _mock_send_command)

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


def test_fail_get_temp_deck_temperature(monkeypatch, temp_deck):
    # Get the curent and target temperatures
    # If get fails, temp_deck temperature is not updated

    done = False

    def _mock_send_command1(command, timeout=None, tag=None):
        nonlocal done
        done = True
        return 'T:none C:90'

    monkeypatch.setattr(temp_deck, '_send_command', _mock_send_command1)

    temp_deck.update_temperature()
    time.sleep(0.25)
    while not done:
        time.sleep(0.25)

    assert temp_deck._temperature == {'current': 90, 'target': None}

    def _mock_send_command2(command, timeout=None, tag=None):
        nonlocal done
        done = True
        return 'Tx:none C:1'    # Failure premise

    monkeypatch.setattr(temp_deck, '_send_command', _mock_send_command2)
    done = False
    temp_deck.update_temperature()
    time.sleep(0.25)
    while not done:
        time.sleep(0.25)
    assert temp_deck._temperature == {'current': 90, 'target': None}


async def test_set_temp_deck_temperature(monkeypatch, temp_deck):
    # Set target temperature
    command_log = []

    def _mock_send_command(command, timeout=None, tag=None):
        nonlocal command_log
        command_log += [command]
        return ''

    monkeypatch.setattr(temp_deck, '_send_command',
                        _mock_send_command)

    monkeypatch.setattr(temp_deck, '_get_status', lambda: 'holding at target')

    try:
        await asyncio.wait_for(temp_deck.set_temperature(99), timeout=0.2)
    except asyncio.TimeoutError:
        pass
    assert command_log[-1] == 'M104 S99.0'

    try:
        await asyncio.wait_for(temp_deck.set_temperature(-9), timeout=0.2)
    except asyncio.TimeoutError:
        pass
    assert command_log[-1] == 'M104 S-9.0'


async def test_fail_set_temp_deck_temperature(monkeypatch, temp_deck):

    error_msg = 'ERROR: some error here'

    def _raise_error(
            self, command, ack, serial_connection, timeout=None, tag=None):
        nonlocal error_msg
        return error_msg

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        _raise_error)

    try:
        res = await asyncio.wait_for(temp_deck.set_temperature(-9),
                                     timeout=0.2)
    except asyncio.TimeoutError:
        pass
    assert res == error_msg

    error_msg = 'Alarm: something alarming happened here'

    def _raise_error(
            self, command, ack, serial_connection, timeout=None, tag=None):
        nonlocal error_msg
        return error_msg

    monkeypatch.setattr(
        serial_communication, 'write_and_return', _raise_error)

    try:
        res = await asyncio.wait_for(temp_deck.set_temperature(-9),
                                     timeout=0.2)
    except asyncio.TimeoutError:
        pass
    assert res == error_msg


def test_turn_off_temp_deck(monkeypatch, temp_deck):

    command_log = []

    def _mock_send_command(command, timeout=None, tag=None):
        nonlocal command_log
        command_log += [command]
        return ''

    monkeypatch.setattr(temp_deck, '_send_command', _mock_send_command)

    temp_deck.deactivate()
    assert command_log == ['M18']


def test_get_device_info(monkeypatch, temp_deck):

    command_log = []

    model = 'temp-v1'
    firmware_version = 'edge-1a2b345'
    serial = 'td20180102A01'

    def _mock_send_command(command, timeout=None, tag=None):
        nonlocal command_log
        command_log += [command]
        return 'model:' + model \
            + ' version:' + firmware_version \
            + ' serial:' + serial

    monkeypatch.setattr(temp_deck, '_send_command', _mock_send_command)

    res = temp_deck.get_device_info()
    assert res == {
        'model': model,
        'version': firmware_version,
        'serial': serial
    }


def test_fail_get_device_info(monkeypatch, temp_deck):

    command_log = []

    model = 'temp-v1'
    firmware_version = 'edge-1a2b345'
    serial = 'td20180102A01'

    def _mock_send_command(command, timeout=None, tag=None):
        nonlocal command_log
        command_log += [command]
        return 'modelXX:' + model \
            + ' version:' + firmware_version \
            + ' serial:' + serial

    monkeypatch.setattr(temp_deck, '_send_command', _mock_send_command)

    with pytest.raises(utils.ParseError):
        temp_deck.get_device_info()


def test_dfu_command(monkeypatch, temp_deck):

    command_log = []

    def _mock_send_command(command, timeout=None, tag=None):
        nonlocal command_log
        command_log += [command]
        return ''

    monkeypatch.setattr(temp_deck, '_send_command', _mock_send_command)

    temp_deck.enter_programming_mode()
    assert command_log == ['dfu']
