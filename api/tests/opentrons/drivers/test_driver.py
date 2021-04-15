from copy import deepcopy
from unittest.mock import Mock
import pytest
from opentrons.drivers.types import MoveSplit

from tests.opentrons.conftest import fuzzy_assert
from opentrons.config.robot_configs import (
    DEFAULT_GANTRY_STEPS_PER_MM, DEFAULT_PIPETTE_CONFIGS)
from opentrons.drivers import serial_communication
from opentrons.drivers.smoothie_drivers import driver_3_0


def position(x, y, z, a, b, c):
    return {axis: value for axis, value in zip('XYZABC', [x, y, z, a, b, c])}


def test_update_position(smoothie, monkeypatch):
    driver = smoothie

    def _new_send_message(self, command, timeout=None):
        return 'ok MCS: X:0.0000 Y:0.0000 Z:0.0000 A:0.0000 B:0.0000 C:0.0000'

    monkeypatch.setattr(driver, '_send_command', _new_send_message)

    driver.update_position()
    expected = {
        'X': 0,
        'Y': 0,
        'Z': 0,
        'A': 0,
        'B': 0,
        'C': 0
    }
    assert driver.position == expected

    count = 0

    def _new_send_message2(self, command, timeout=None):
        nonlocal count
        # first attempt to read, we get bad data
        msg = 'ok MCS: X:0.0000 Y:MISTAKE Z:0.0000 A:0.0000 B:0.0000 C:0.0000'
        if count > 0:
            # any following attempts to read, we get good data
            msg = msg.replace('Y:MISTAKE', 'Y:0.0000')
        count += 1
        return msg

    monkeypatch.setattr(driver, '_send_command', _new_send_message2)

    driver.update_position()
    expected = {
        'X': 0,
        'Y': 0,
        'Z': 0,
        'A': 0,
        'B': 0,
        'C': 0
    }
    assert driver.position == expected


@pytest.mark.parametrize(
    argnames=["cmd", "resp", "expected"],
    argvalues=[
        # Remove command from response
        ["G28.2B", "G28.2B", ""],
        ["G28.2B G1", "G28.2B G1", ""],
        ["G28.2B G1", "G1G28.2BG1", ""],
        # Remove command and whitespace from response
        ["\r\nG52\r\n\r\n", "\r\nG52\r\n\r\n", ""],
        ["\r\nG52\r\n\r\nsome-data\r\nok\r\n",
         "\r\nG52\r\n\r\nsome-data\r\nok\r\nTESTS-RULE",
         "TESTS-RULE"
         ],
        ["\r\nG52\r\n\r\nsome-data\r\nok\r\n",
         "G52\r\n\r\nsome-data\r\nokT\r\nESTS-RULE",
         "TESTS-RULE"],
        # L is not a command echo but a token
        ["M371 L \r\n\r\n",
         "L:703130",
         "L:703130"],
        # R is not a command echo but a token
        ["M3 R \r\n\r\n",
         "M3R:703130",
         "R:703130"],
        ["M369 L \r\n\r\n",
         "M369 L \r\n\r\nL:5032304D56323032303230303432323036000000000000000000000000000000",  # noqa: E501
         "L:5032304D56323032303230303432323036000000000000000000000000000000"]
    ]
)
def test_remove_serial_echo(
        smoothie: driver_3_0.SmoothieDriver_3_0_0,
        cmd: str, resp: str, expected: str):
    """It should remove unwanted characters only."""
    res = smoothie._remove_unwanted_characters(
        cmd, resp)
    assert res == expected


def test_parse_position_response(smoothie):
    good_data = 'ok M114.2 X:10 Y:20 Z:30 A:40 B:50 C:60'
    bad_data = 'ok M114.2 X:10 Y:20: Z:30A:40 B:50 C:60'
    res = driver_3_0._parse_position_response(good_data)
    expected = {
        'X': 10,
        'Y': 20,
        'Z': 30,
        'A': 40,
        'B': 50,
        'C': 60,
    }
    assert res == expected
    with pytest.raises(driver_3_0.ParseError):
        driver_3_0._parse_position_response(bad_data)


def test_dwell_and_activate_axes(smoothie, monkeypatch):
    command_log = []
    smoothie._setup()
    smoothie.simulating = False

    def write_with_log(command, ack, connection, timeout, tag=None):
        command_log.append(command.strip())
        return driver_3_0.SMOOTHIE_ACK

    def _parse_position_response(arg):
        return smoothie.position

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)
    monkeypatch.setattr(
        driver_3_0, '_parse_position_response', _parse_position_response)

    smoothie.activate_axes('X')
    smoothie._set_saved_current()
    smoothie.dwell_axes('X')
    smoothie._set_saved_current()
    smoothie.activate_axes('XYBC')
    smoothie._set_saved_current()
    smoothie.dwell_axes('XC')
    smoothie._set_saved_current()
    smoothie.dwell_axes('BCY')
    smoothie._set_saved_current()
    expected = [
        ['M907 A0.1 B0.05 C0.05 X1.25 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X1.25 Y1.25 Z0.1 G4 P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y1.25 Z0.1 G4 P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
    ]

    fuzzy_assert(result=command_log, expected=expected)


def test_disable_motor(smoothie, monkeypatch):
    command_log = []
    smoothie.simulating = False

    def write_with_log(command, ack, connection, timeout, tag=None):
        command_log.append(command.strip())
        return driver_3_0.SMOOTHIE_ACK

    def _parse_position_response(arg):
        return smoothie.position

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)
    monkeypatch.setattr(
        driver_3_0, '_parse_position_response', _parse_position_response)

    smoothie.disengage_axis('X')
    smoothie.disengage_axis('XYZ')
    smoothie.disengage_axis('ABCD')
    expected = [
        ['M18 X'],
        ['M400'],
        ['M18 [XYZ]+'],
        ['M400'],
        ['M18 [ABC]+'],
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)


def test_plunger_commands(smoothie, monkeypatch):
    command_log = []
    smoothie._setup()
    smoothie.home()
    smoothie.simulating = False

    def write_with_log(command, ack, connection, timeout, tag=None):
        command_log.append(command.strip())
        return driver_3_0.SMOOTHIE_ACK

    def _parse_position_response(arg):
        return smoothie.position

    monkeypatch.setattr(
        serial_communication, 'write_and_return', write_with_log)
    monkeypatch.setattr(
        driver_3_0, '_parse_position_response', _parse_position_response)

    smoothie.home()
    expected = [
        ['M907 A0.8 B0.05 C0.05 X0.3 Y0.3 Z0.8 G4 P0.005 G28.2.+[ABCZ].+'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['M203.1 Y50'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.8 Z0.1 G4 P0.005 G91 G0 Y-28 G0 Y10 G90'],
        ['M400'],
        ['M203.1 X80'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X1.25 Y0.3 Z0.1 G4 P0.005 G28.2 X'],
        ['M400'],
        ['M203.1 A125 B40 C40 X600 Y400 Z125'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['M203.1 Y80'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y1.25 Z0.1 G4 P0.005 G28.2 Y'],
        ['M400'],
        ['M203.1 Y8'],
        ['M400'],
        ['G91 G0 Y-3 G90'],
        ['M400'],
        ['G28.2 Y'],
        ['M400'],
        ['G91 G0 Y-3 G90'],
        ['M400'],
        ['M203.1 A125 B40 C40 X600 Y400 Z125'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['M114.2'],
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)
    command_log = []

    smoothie.move({'X': 0, 'Y': 1.123456, 'Z': 2, 'A': 3})
    expected = [
        ['M907 A0.8 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4 P0.005 G0.+'],
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)
    command_log = []

    smoothie.move({'B': 2})
    expected = [
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005 G0 B2'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)
    command_log = []

    smoothie.move({
        'X': 10.987654321,
        'Y': 2.12345678,
        'Z': 2.5,
        'A': 3.5,
        'B': 4.25,
        'C': 5.55})
    expected = [
        # Set active axes high
        ['M907 A0.8 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4 P0.005 G0.+[BC].+'],
        ['M400'],
        # Set plunger current low
        ['M907 A0.8 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4 P0.005'],
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)


def test_move_with_split(smoothie, monkeypatch):
    command_log = []
    smoothie._setup()
    smoothie.home()
    smoothie.simulating = False

    smoothie.configure_splits_for(
        {
            "B": MoveSplit(
                split_distance=1,
                split_current=1.75,
                split_speed=1,
                after_time=1800,
                fullstep=True),
            "C": MoveSplit(
                split_distance=1,
                split_current=1.75,
                split_speed=1,
                after_time=1800,
                fullstep=True)
        }
    )
    smoothie._steps_per_mm = {"B": 1.0, "C": 1.0}

    def write_with_log(command, ack, connection, timeout, tag=None):
        command_log.append(command.strip())
        return driver_3_0.SMOOTHIE_ACK

    def _parse_position_response(arg):
        return smoothie.position

    monkeypatch.setattr(
        serial_communication, 'write_and_return', write_with_log)
    monkeypatch.setattr(
        driver_3_0, '_parse_position_response', _parse_position_response)

    smoothie.move({'X': 0, 'Y': 1.123456, 'Z': 2, 'C': 3})
    expected = [
        ['M55 M92 C0.03125 G4 P0.01 G0 F60 M907 A0.1 B0.05 C1.75 X1.25 Y1.25 '
         'Z0.8 G4 P0.005'],
        ['M400'],
        ['G0 C18.0'],
        ['M400'],
        ['M54 M92 C1.0 G4 P0.01'],
        ['M400'],
        ['G0 F24000 M907 A0.1 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4 P0.005 G0.+'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4 P0.005'],
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)
    command_log = []

    smoothie.move({'B': 2})

    expected = [
        ['M53 M92 B0.03125 G4 P0.01 G0 F60 M907 A0.1 B1.75 C0.05 '
         'X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
        ['G0 B18.0'],
        ['M400'],
        ['M52 M92 B1.0 G4 P0.01'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005 G0 B2'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005'],
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)
    command_log = []


def test_set_active_current(smoothie, monkeypatch):
    command_log = []
    smoothie._setup()
    smoothie.home()
    smoothie.simulating = False

    def write_with_log(command, ack, connection, timeout, tag=None):
        command_log.append(command.strip())
        return driver_3_0.SMOOTHIE_ACK

    def _parse_position_response(arg):
        return smoothie.position

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)
    monkeypatch.setattr(
        driver_3_0, '_parse_position_response', _parse_position_response)

    smoothie.set_active_current(
        {'X': 2, 'Y': 2, 'Z': 2, 'A': 2, 'B': 2, 'C': 2})
    smoothie.set_dwelling_current(
        {'X': 0, 'Y': 0, 'Z': 0, 'A': 0, 'B': 0, 'C': 0})

    smoothie.move({'X': 0, 'Y': 0, 'Z': 0, 'A': 0, 'B': 0, 'C': 0})
    smoothie.move({'B': 1, 'C': 1})
    smoothie.set_active_current({'B': 0.42, 'C': 0.42})
    smoothie.home('BC')
    expected = [
        # move all
        ['M907 A2 B2 C2 X2 Y2 Z2 G4 P0.005 G0 A0 B0 C0 X0 Y0 Z0'],
        ['M400'],
        ['M907 A2 B0 C0 X2 Y2 Z2 G4 P0.005'],  # disable BC axes
        ['M400'],
        # move BC
        ['M907 A0 B2 C2 X0 Y0 Z0 G4 P0.005 G0 B1.3 C1.3 G0 B1 C1'],
        ['M400'],
        ['M907 A0 B0 C0 X0 Y0 Z0 G4 P0.005'],  # disable BC axes
        ['M400'],
        ['M907 A0 B0.42 C0.42 X0 Y0 Z0 G4 P0.005 G28.2 BC'],  # home BC
        ['M400'],
        ['M907 A0 B0 C0 X0 Y0 Z0 G4 P0.005'],  # dwell all axes after home
        ['M400'],
        ['M114.2'],  # update the position
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)


def test_steps_per_mm(smoothie, monkeypatch):
    # Check that steps_per_mm dict gets loaded with defaults on start
    assert smoothie.steps_per_mm == {}
    smoothie._setup()
    expected = {
        **DEFAULT_GANTRY_STEPS_PER_MM,
        'B': DEFAULT_PIPETTE_CONFIGS['stepsPerMM'],
        'C': DEFAULT_PIPETTE_CONFIGS['stepsPerMM'],
    }
    assert smoothie.steps_per_mm == expected
    smoothie.update_steps_per_mm({'Z': 450})
    expected['Z'] = 450
    assert smoothie.steps_per_mm == expected


def test_pipette_configs(smoothie, monkeypatch):
    axis_value = 'home updated 175'
    smoothie._send_command = Mock(return_value=axis_value)

    res = smoothie.update_pipette_config('Z', {'home': 175})
    expected_return = {'Z': {'home': 175}}
    assert res == expected_return


def test_set_acceleration(smoothie, monkeypatch):
    command_log = []
    smoothie._setup()
    smoothie.home()
    smoothie.simulating = False

    def write_with_log(command, ack, connection, timeout, tag=None):
        command_log.append(command.strip())
        return driver_3_0.SMOOTHIE_ACK

    def _parse_position_response(arg):
        return smoothie.position

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)
    monkeypatch.setattr(
        driver_3_0, '_parse_position_response', _parse_position_response)

    smoothie.set_acceleration(
        {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6})
    smoothie.push_acceleration()
    smoothie.pop_acceleration()
    smoothie.set_acceleration(
        {'X': 10, 'Y': 20, 'Z': 30, 'A': 40, 'B': 50, 'C': 60})
    smoothie.pop_acceleration()

    expected = [
        ['M204 S10000 A4 B5 C6 X1 Y2 Z3'],
        ['M400'],
        ['M204 S10000 A4 B5 C6 X1 Y2 Z3'],
        ['M400'],
        ['M204 S10000 A40 B50 C60 X10 Y20 Z30'],
        ['M400'],
        ['M204 S10000 A4 B5 C6 X1 Y2 Z3'],
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)


def test_active_dwelling_current_push_pop(smoothie):
    assert smoothie._active_current_settings != \
        smoothie._dwelling_current_settings

    old_active_currents = deepcopy(smoothie._active_current_settings)
    old_dwelling_currents = deepcopy(smoothie._dwelling_current_settings)

    smoothie.push_active_current()
    smoothie.set_active_current({'X': 2.0, 'Y': 2.0, 'Z': 2.0, 'A': 2.0})
    smoothie.pop_active_current()

    assert smoothie._active_current_settings == old_active_currents
    assert smoothie._dwelling_current_settings == old_dwelling_currents


def test_functional(smoothie):
    assert smoothie.position == position(0, 0, 0, 0, 0, 0)

    smoothie.move({'X': 0, 'Y': 1, 'Z': 2, 'A': 3, 'B': 4, 'C': 5})
    assert smoothie.position == position(0, 1, 2, 3, 4, 5)

    smoothie.move({'X': 1, 'Z': 3, 'C': 6})
    assert smoothie.position == position(1, 1, 3, 3, 4, 6)

    smoothie.home(axis='abc', disabled='')
    assert smoothie.position == position(
        1, 1, 3,
        smoothie.homed_position['A'],
        smoothie.homed_position['B'],
        smoothie.homed_position['C'])

    smoothie.home(disabled='')
    assert smoothie.position == smoothie.homed_position


def test_parse_pipette_data():
    msg = 'TestsRule!!'
    mount = 'L'
    good_data = mount + ': ' \
        + driver_3_0._byte_array_to_hex_string(msg.encode())
    parsed = driver_3_0._parse_instrument_data(good_data).get(mount)
    assert parsed.decode() == msg


def test_read_and_write_pipettes(smoothie, monkeypatch):
    driver = smoothie

    written_id = ''
    written_model = ''
    mount = 'L'

    def _new_send_message(
            command, timeout=None, suppress_error_msg=True):
        nonlocal written_id, written_model, mount
        if driver_3_0.GCODE.READ_INSTRUMENT_ID in command:
            return mount + ': ' + written_id
        elif driver_3_0.GCODE.READ_INSTRUMENT_MODEL in command:
            return mount + ': ' + written_model
        if driver_3_0.GCODE.WRITE_INSTRUMENT_ID in command:
            cmdstr = str(command)
            written_id = cmdstr[cmdstr.index(mount) + 1:]
        elif driver_3_0.GCODE.WRITE_INSTRUMENT_MODEL in command:
            cmdstr = str(command)
            written_model = cmdstr[cmdstr.index(mount) + 1:]

    monkeypatch.setattr(driver, '_send_command', _new_send_message)

    test_id = 'TestsRock!!'
    test_model = 'TestPipette'
    driver.write_pipette_id('left', test_id)
    driver.simulating = False
    read_id = driver.read_pipette_id('left')
    driver.simulating = True
    assert read_id == test_id

    driver.write_pipette_model('left', test_model)
    driver.simulating = False
    read_model = driver.read_pipette_model('left')
    driver.simulating = True
    assert read_model == test_model + '_v1'


def test_read_pipette_v13(smoothie, monkeypatch):
    driver = smoothie
    driver.simulating = False

    def _new_send_message(
            command, timeout=None, suppress_error_msg=True):
        return 'L:' + driver_3_0._byte_array_to_hex_string(b'p300_single_v13')

    monkeypatch.setattr(driver, '_send_command', _new_send_message)

    res = driver.read_pipette_model('left')
    assert res == 'p300_single_v1.3'


def test_fast_home(smoothie, monkeypatch):
    driver = smoothie

    move = driver.move
    coords = []

    def move_mock(target):
        nonlocal coords
        coords.append(target)
        move(target)

    monkeypatch.setattr(driver, 'move', move_mock)

    assert coords == []
    driver.fast_home(axis='X', safety_margin=12)
    assert coords == [{'X': driver.homed_position['X'] - 12}]
    assert driver.position['X'] == driver.homed_position['X']


def test_homing_flags(smoothie, monkeypatch):
    driver = smoothie

    def is_connected_mock():
        return True

    monkeypatch.setattr(driver, 'is_connected', is_connected_mock)
    driver.simulating = False

    def send_mock(target):
        smoothie_homing_res = 'X:0 Y:1 Z:0 A:1 B:0 C:1\r\n'
        return smoothie_homing_res

    monkeypatch.setattr(driver, '_send_command', send_mock)

    expected = {
        'X': False,
        'Y': True,
        'Z': False,
        'A': True,
        'B': False,
        'C': True
    }
    driver.update_homed_flags()
    flags = driver.homed_flags
    assert flags == expected


def test_switch_state(smoothie, monkeypatch):
    driver = smoothie

    def send_mock(target):
        smoothie_switch_res = 'X_max:0 Y_max:0 Z_max:0 A_max:0 B_max:0 C_max:0'
        smoothie_switch_res += ' _pins '
        smoothie_switch_res += '(XL)2.01:0 (YL)2.01:0 (ZL)2.01:0 '
        smoothie_switch_res += '(AL)2.01:0 (BL)2.01:0 (CL)2.01:0 Probe: 0\r\n'
        return smoothie_switch_res

    monkeypatch.setattr(driver, '_send_command', send_mock)

    expected = {
        'X': False,
        'Y': False,
        'Z': False,
        'A': False,
        'B': False,
        'C': False,
        'Probe': False
    }
    assert driver.switch_state == expected

    def send_mock(target):
        smoothie_switch_res = 'X_max:0 Y_max:0 Z_max:0 A_max:1 B_max:0 C_max:0'
        smoothie_switch_res += ' _pins '
        smoothie_switch_res += '(XL)2.01:0 (YL)2.01:0 (ZL)2.01:0 '
        smoothie_switch_res += '(AL)2.01:0 (BL)2.01:0 (CL)2.01:0 Probe: 1\r\n'
        return smoothie_switch_res

    monkeypatch.setattr(driver, '_send_command', send_mock)

    expected = {
        'X': False,
        'Y': False,
        'Z': False,
        'A': True,
        'B': False,
        'C': False,
        'Probe': True
    }
    assert driver.switch_state == expected


def test_clear_limit_switch(smoothie, monkeypatch):
    """
    This functions as a contract test around recovery from a limit-switch hit.
    Note that this *does not* itself guarantee correct physical behavior--this
    interaction has been designed and tested on the robot manually and then
    encoded in this test. If requirements change around physical behavior, then
    this test will need to be revised.
    """
    driver = smoothie
    driver.home('xyza')
    cmd_list = []

    def write_mock(command, ack, serial_connection, timeout, tag=None):
        nonlocal cmd_list
        cmd_list.append(command)
        if driver_3_0.GCODE.MOVE in command:
            return "ALARM: Hard limit +C"
        elif driver_3_0.GCODE.CURRENT_POSITION in command:
            return 'ok M114.2 X:10 Y:20 Z:30 A:40 B:50 C:60'
        else:
            return "ok"

    monkeypatch.setattr(serial_communication, 'write_and_return', write_mock)

    driver.simulating = False
    # This will cause a limit-switch error and not back off
    with pytest.raises(driver_3_0.SmoothieError):
        driver.move({'C': 100})

    assert [c.strip() for c in cmd_list] == [
        # attempt to move and fail
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005 G0 C100.3 G0 C100',
        # recover from failure
        'M999',
        'M400',
        # set current for homing the failed axis (C)
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005 G28.2 C',
        'M400',
        # set current back to idling after home
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005',
        'M400',
        # update position
        'M114.2',
        'M400',
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4 P0.005',
        'M400',
    ]


def test_update_pipette_config(smoothie, monkeypatch):
    driver = smoothie
    cmd_list = []

    def _send_command_mock(command):
        nonlocal cmd_list
        cmd_list.append(command)
        return "ok"

    monkeypatch.setattr(driver, '_send_command', _send_command_mock)

    driver.simulating = False

    driver.update_pipette_config("X", {
        'retract': 2,
        'debounce': 3,
        'max_travel': 4,
        'home': 5
    })

    assert [c.build().strip() for c in cmd_list] == [
        "M365.3 X2",
        "M365.2 O3",
        "M365.1 X4",
        "M365.0 X5"
    ]


def test_do_relative_splits_during_home_for(smoothie, monkeypatch):
    """Test command structure when a split configuration is present."""
    driver = smoothie
    cmd_list = []

    def _send_command_mock(
            command, *args, **kwargs):
        nonlocal cmd_list
        cmd_list.append(command.build())
        return "ok"

    monkeypatch.setattr(driver, '_send_command', _send_command_mock)

    driver.simulating = False

    driver.configure_splits_for(
        {
            "B": MoveSplit(
                split_distance=1,
                split_current=1.75,
                split_speed=1,
                after_time=1800,
                fullstep=True)
        }
    )
    driver._steps_per_mm = {"B": 1.0, "C": 1.0}

    driver._do_relative_splits_during_home_for("BC")

    assert cmd_list == [
        'M53 M55 M92 B0.03125 C0.03125 G4 P0.01 M907 B1.75 G4 P0.005 G0 F60 '
        'G91 \r\n\r\n',
        'G0 B-1 \r\n\r\n',
        'G90 M52 M54 M92 B1.0 C1.0 G4 P0.01 G0 F24000 \r\n\r\n'
    ]
