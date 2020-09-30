from copy import deepcopy
from threading import Thread
from unittest.mock import Mock
import pytest
from time import sleep

from numpy import isclose

from opentrons.trackers import pose_tracker
from tests.opentrons.conftest import fuzzy_assert
from opentrons.config.robot_configs import (
    DEFAULT_GANTRY_STEPS_PER_MM, DEFAULT_PIPETTE_CONFIGS)
from opentrons.drivers import serial_communication, utils, types
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


def test_remove_serial_echo(smoothie, monkeypatch):
    smoothie.simulating = False

    def return_echo_response(command, ack, connection, timeout, tag=None):
        if 'some-data' in command:
            return command + 'TESTS-RULE'
        return command

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        return_echo_response)

    cmd = 'G28.2B'
    res = smoothie._send_command(
        cmd, driver_3_0.SMOOTHIE_ACK)
    assert res == ''
    res = smoothie._send_command(
        '\r\n' + cmd + '\r\n\r\n',
        driver_3_0.SMOOTHIE_ACK)
    assert res == ''
    res = smoothie._send_command(
        '\r\n' + cmd + '\r\n\r\nsome-data\r\nok\r\n',
        driver_3_0.SMOOTHIE_ACK)
    assert res == 'TESTS-RULE'

    def return_echo_response(command, ack, connection, timeout, tag=None):
        if 'some-data' in command:
            return command.strip() + '\r\nT\r\nESTS-RULE'
        return command

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        return_echo_response)

    res = smoothie._send_command(
        '\r\n' + cmd + '\r\n\r\nsome-data\r\nok\r\n',
        driver_3_0.SMOOTHIE_ACK)
    assert res == 'TESTS-RULE'


def test_parse_position_response(smoothie):
    good_data = 'ok M114.2 X:10 Y:20: Z:30 A:40 B:50 C:60'
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
        ['M907 A0.1 B0.05 C0.05 X1.25 Y0.3 Z0.1 G4P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X1.25 Y1.25 Z0.1 G4P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y1.25 Z0.1 G4P0.005'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005'],
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
        ['M18X'],
        ['M400'],
        ['M18[XYZ]+'],
        ['M400'],
        ['M18[ABC]+'],
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
        ['M907 A0.8 B0.05 C0.05 X0.3 Y0.3 Z0.8 G4P0.005 G28.2.+[ABCZ].+'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005'],
        ['M400'],
        ['M203.1 Y50'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.8 Z0.1 G4P0.005 G91 G0Y-28 G0Y10 G90'],
        ['M400'],
        ['M203.1 X80'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X1.25 Y0.3 Z0.1 G4P0.005 G28.2X'],
        ['M400'],
        ['M203.1 A125 B40 C40 X600 Y400 Z125'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005'],
        ['M400'],
        ['M203.1 Y80'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y1.25 Z0.1 G4P0.005 G28.2Y'],
        ['M400'],
        ['M203.1 Y8'],
        ['M400'],
        ['G91 G0Y-3 G90'],
        ['M400'],
        ['G28.2Y'],
        ['M400'],
        ['G91 G0Y-3 G90'],
        ['M400'],
        ['M203.1 A125 B40 C40 X600 Y400 Z125'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005'],
        ['M400'],
        ['M114.2'],
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)
    command_log = []

    smoothie.move({'X': 0, 'Y': 1.123456, 'Z': 2, 'A': 3})
    expected = [
        ['M907 A0.8 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4P0.005 G0.+'],
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)
    command_log = []

    smoothie.move({'B': 2})
    expected = [
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 G0B2'],
        ['M400'],
        ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005'],
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
        ['M907 A0.8 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4P0.005 G0.+[BC].+'], # noqa(E501)
        ['M400'],
        # Set plunger current low
        ['M907 A0.8 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4P0.005'],
        ['M400'],
    ]
    fuzzy_assert(result=command_log, expected=expected)


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
        ['M907 A2 B2 C2 X2 Y2 Z2 G4P0.005 G0A0B0C0X0Y0Z0'],
        ['M400'],
        ['M907 A2 B0 C0 X2 Y2 Z2 G4P0.005'],  # disable BC axes
        ['M400'],
        # move BC
        ['M907 A0 B2 C2 X0 Y0 Z0 G4P0.005 G0B1.3C1.3 G0B1C1'],
        ['M400'],
        ['M907 A0 B0 C0 X0 Y0 Z0 G4P0.005'],  # disable BC axes
        ['M400'],
        ['M907 A0 B0.42 C0.42 X0 Y0 Z0 G4P0.005 G28.2BC'],  # home BC
        ['M400'],
        ['M907 A0 B0 C0 X0 Y0 Z0 G4P0.005'],  # dwell all axes after home
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


@pytest.mark.api1_only
def test_set_pick_up_current(model, monkeypatch):
    driver = model.robot._driver

    set_current = driver._save_current
    current_log = []

    def set_current_mock(target, axes_active=True):
        nonlocal current_log
        current_log.append(target)
        set_current(target, axes_active)

    monkeypatch.setattr(driver, '_save_current', set_current_mock)
    driver.update_homed_flags({ax: True for ax in 'XYZABC'})

    rack = model.robot.add_container('tiprack-200ul', '10')
    pipette = model.instrument._instrument
    pipette.set_pick_up_current(0.42)
    pipette.pick_up_tip(rack[0], presses=1)

    # Instrument in `model` is configured to right mount, which is the A axis
    # on the Smoothie (see `Robot._actuators`)
    expected = [
        {'C': 0.5},
        {'C': 0.05},
        {'A': 0.8},
        {'A': 0.1},
        {'X': 1.25, 'Y': 1.25},
        {'X': 0.3, 'Y': 0.3},
        {'A': 0.8},
        {'A': 0.42},
        {'A': 0.8},
        {'A': 0.1}
    ]
    assert current_log == expected


@pytest.mark.xfail
@pytest.mark.api1_only
def test_drop_tip_current(model, monkeypatch):
    # TODO: All of these API 1 tests either need to be removed or moved to
    # a different test file. The ones using the model fixture rely on
    # some ugly things created in RPC. Ideally, all of these tests should
    # be testing methods in the smoothie directly.
    driver = model.driver

    old_save_current = driver._save_current
    current_log = []

    def mock_save_current(settings, axes_active=True):
        nonlocal current_log
        if 'C' in settings:
            current_log.append(settings)
        old_save_current(settings, axes_active)

    monkeypatch.setattr(driver, '_save_current', mock_save_current)

    rack = model.robot.add_container('tiprack-200ul', '10')
    pipette = model.instrument._instrument
    pipette._plunger_current = 0.123
    pipette._drop_tip_current = 0.456
    pipette.drop_tip(rack[0])

    # Instrument in `model` is configured to right mount, which is the A axis
    # on the Smoothie (see `Robot._actuators`)
    expected = [
        {'C': 0.123},   # move to 'bottom' position
        {'C': 0.05},    # dwell
        {'C': 0.456},   # move to 'drop_tip' position
        {'C': 0.05},    # dwell
        {'C': 0.123},   # fast-home move upwards
        {'C': 0.05},    # dwell
        {'C': 0.123},   # fast-home home command
        {'C': 0.05},    # dwell
        {'C': 0.123},   # move back to 'bottom' position
        {'C': 0.05}     # dwell
    ]
    assert current_log == expected


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
        if driver_3_0.GCODES['READ_INSTRUMENT_ID'] in command:
            return mount + ': ' + written_id
        elif driver_3_0.GCODES['READ_INSTRUMENT_MODEL'] in command:
            return mount + ': ' + written_model
        if driver_3_0.GCODES['WRITE_INSTRUMENT_ID'] in command:
            written_id = command[command.index(mount) + 1:]
        elif driver_3_0.GCODES['WRITE_INSTRUMENT_MODEL'] in command:
            written_model = command[command.index(mount) + 1:]

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
        if driver_3_0.GCODES['MOVE'] in command:
            return "ALARM: Hard limit +C"
        elif driver_3_0.GCODES['CURRENT_POSITION'] in command:
            return 'ok M114.2 X:10 Y:20: Z:30 A:40 B:50 C:60'
        else:
            return "ok"

    monkeypatch.setattr(serial_communication, 'write_and_return', write_mock)

    driver.simulating = False
    # This will cause a limit-switch error and not back off
    with pytest.raises(driver_3_0.SmoothieError):
        driver.move({'C': 100})

    assert [c.strip() for c in cmd_list] == [
        # attempt to move and fail
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 G0C100.3 G0C100',  # noqa(E501)
        # recover from failure
        'M999',
        'M400',
        # set current for homing the failed axis (C)
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 G28.2C',
        'M400',
        # set current back to idling after home
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005',
        'M400',
        # update position
        'M114.2',
        'M400',
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005',
        'M400',
    ]


@pytest.mark.api1_only
def test_pause_resume(model):
    """
    This test has to use an ugly work-around with the `simulating` member of
    the driver. When issuing movement commands in test, `simulating` should be
    True, but when testing whether `pause` actually pauses and `resume`
    resumes, `simulating` must be False.
    """

    pipette = model.instrument._instrument
    robot = model.robot

    robot.home()
    homed_coords = pose_tracker.absolute(robot.poses, pipette)

    robot._driver.simulating = False
    robot.pause()
    robot._driver.simulating = True

    def _move_head():
        robot.poses = pipette._move(robot.poses, x=100, y=0, z=0)

    thread = Thread(target=_move_head)
    thread.start()
    sleep(0.5)

    # Check against home coordinates before calling resume to ensure that robot
    # doesn't move while paused
    coords = pose_tracker.absolute(robot.poses, pipette)
    assert isclose(coords, homed_coords).all()

    robot._driver.simulating = False
    robot.resume()
    robot._driver.simulating = True
    thread.join()

    coords = pose_tracker.absolute(robot.poses, pipette)
    expected_coords = (100, 0, 0)
    assert isclose(coords, expected_coords).all()


def test_speed_change(robot, instruments, monkeypatch):
    ulmm = {
        "aspirate": [[100, 0, 0.5]],
        "dispense": [[100, 0, 0.5]]
    }
    pipette = instruments.Pipette(mount='right', ul_per_mm=ulmm)
    robot._driver.simulating = False

    command_log = []

    def write_with_log(command, ack, connection, timeout, tag=None):
        if 'G0F' in command:
            command_log.append(command.strip())
        elif 'M114' in command:
            return 'ok MCS: X:0.00 Y:0.00 Z:0.00 A:0.00 B:0.00 C:0.00'
        return driver_3_0.SMOOTHIE_ACK

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)

    pipette.tip_attached = True
    pipette.max_volume = 100
    pipette._working_volume = 100
    pipette.set_speed(aspirate=20, dispense=40)
    pipette.aspirate(10)
    pipette.dispense(10)
    expected = [
        ['G0F1200'],  # pipette's default aspirate speed in mm/min
        ['G0F24000'],
        ['G0F2400'],  # pipette's default dispense speed in mm/min
        ['G0F24000'],
    ]
    fuzzy_assert(result=command_log, expected=expected)


def test_max_speed_change(robot, smoothie, monkeypatch):
    smoothie.simulating = False
    robot._driver = smoothie

    from opentrons.drivers import serial_communication
    from opentrons.drivers.smoothie_drivers import driver_3_0
    command_log = []

    def write_with_log(command, ack, connection, timeout, tag=None):
        if 'M203.1' in command or 'G0F' in command:
            command_log.append(command.strip())
        return driver_3_0.SMOOTHIE_ACK

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)

    robot.head_speed(555)
    robot.head_speed(x=1, y=2, z=3, a=4, b=5, c=6)
    robot.head_speed(123, x=7)
    robot._driver.push_speed()
    robot._driver.set_speed(321)
    robot._driver.pop_speed()
    expected = [
        ['G0F{}'.format(555 * 60)],
        ['M203.1 A4 B5 C6 X1 Y2 Z3'],
        ['M203.1 X7'],
        ['G0F{}'.format(123 * 60)],
        ['G0F{}'.format(321 * 60)],
        ['G0F{}'.format(123 * 60)],
    ]
    fuzzy_assert(result=command_log, expected=expected)


@pytest.mark.api1_only
def test_pause_in_protocol(model):
    model.robot._driver.simulating = True

    model.robot.pause()

    assert model.robot._driver.run_flag.is_set()


def test_send_command_with_retry(robot, smoothie, monkeypatch):
    smoothie.simulating = False
    robot._driver = smoothie

    count = 0

    def _no_response(command, ack, connection, timeout, tag=None):
        nonlocal count
        count += 1
        if count < 3:
            raise serial_communication.SerialNoResponse('No response')
        else:
            return 'ok'

    monkeypatch.setattr(serial_communication, 'write_and_return', _no_response)

    # force `write_and_return` to raise exception just once
    count = 0
    res = robot._driver._send_command('test')
    assert res == 'ok'

    # force `write_and_return` to raise exception twice
    count = -1
    with pytest.raises(serial_communication.SerialNoResponse):
        robot._driver._send_command('test')


def test_unstick_axes(robot, smoothie):
    import types

    smoothie.simulating = False
    robot._driver = smoothie

    def update_position_mock(self, default=None):
        if default is None:
            default = self._position

        updated_position = self._position.copy()
        updated_position.update(**default)

    robot._driver.update_position = types.MethodType(
        update_position_mock, robot._driver)

    current_log = []

    def send_command_mock(self, command, timeout=12000.0, ack_timeout=5.0):
        nonlocal current_log
        current_log.append(command)
        if 'M119' in command:
            smoothie_switch_res = 'X_max:0 Y_max:0 Z_max:0 A_max:0 B_max:0 C_max:0'  # NOQA
            smoothie_switch_res += ' _pins '
            smoothie_switch_res += '(XL)2.01:0 (YL)2.01:0 (ZL)2.01:0 '
            smoothie_switch_res += '(AL)2.01:0 (BL)2.01:0 (CL)2.01:0 Probe: 0\r\n'   # NOQA
            return smoothie_switch_res

    robot._driver._send_command = types.MethodType(
        send_command_mock, robot._driver)

    robot._driver.unstick_axes('BC')

    expected = [
        'M203.1 B1 C1',  # slow them down
        'M119',  # get the switch status
        # move
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 G0B-1C-1',
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005',  # set plunger current
        'M203.1 A125 B40 C40 X600 Y400 Z125'  # return to normal speed
    ]

    assert current_log == expected

    current_log = []
    robot._driver.unstick_axes('XYZA')

    expected = [
        'M203.1 A1 X1 Y1 Z1',  # slow them down
        'M119',  # get the switch status
        'M907 A0.8 B0.05 C0.05 X1.25 Y1.25 Z0.8 G4P0.005 G0A-1X-1Y-1Z-1',  # noqa(E501)
        'M203.1 A125 B40 C40 X600 Y400 Z125'  # return to normal speed
    ]

    assert current_log == expected

    def send_command_mock(self, command, timeout=12000.0, ack_timeout=5.0):
        nonlocal current_log
        current_log.append(command)
        if 'M119' in command:
            smoothie_switch_res = 'X_max:0 Y_max:0 Z_max:0 A_max:0 B_max:0 C_max:1'  # NOQA
            smoothie_switch_res += ' _pins '
            smoothie_switch_res += '(XL)2.01:0 (YL)2.01:0 (ZL)2.01:0 '
            smoothie_switch_res += '(AL)2.01:0 (BL)2.01:0 (CL)2.01:0 Probe: 0\r\n'   # NOQA
            return smoothie_switch_res

    robot._driver._send_command = types.MethodType(
        send_command_mock, robot._driver)

    current_log = []
    robot._driver.unstick_axes('BC')

    expected = [
        'M203.1 B1 C1',  # set max-speeds
        'M119',  # get switch status
        # MOVE B
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 G0B-2',
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005',  # low current B
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 G28.2C',  # HOME C
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005',  # low current C
        'M203.1 A125 B40 C40 X600 Y400 Z125'  # reset max-speeds
    ]
    assert current_log == expected

    def send_command_mock(self, command, timeout=12000.0, ack_timeout=5.0):
        nonlocal current_log
        current_log.append(command)
        if 'M119' in command:
            smoothie_switch_res = 'X_max:0 Y_max:0 Z_max:0 A_max:0 B_max:1 C_max:1'  # NOQA
            smoothie_switch_res += ' _pins '
            smoothie_switch_res += '(XL)2.01:0 (YL)2.01:0 (ZL)2.01:0 '
            smoothie_switch_res += '(AL)2.01:0 (BL)2.01:0 (CL)2.01:0 Probe: 0\r\n'   # NOQA
            return smoothie_switch_res

    robot._driver._send_command = types.MethodType(
        send_command_mock, robot._driver)

    current_log = []
    robot._driver.unstick_axes('BC')

    expected = [
        'M203.1 B1 C1',  # set max-speeds
        'M119',  # get switch status
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 G28.2BC',  # HOME BC
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005',  # low current BC
        'M203.1 A125 B40 C40 X600 Y400 Z125'  # reset max-speeds
    ]
    assert current_log == expected


def test_alarm_unhandled(smoothie, robot, monkeypatch):
    smoothie.simulating = False
    robot._driver = smoothie
    killmsg = 'ALARM: Kill button pressed - reset or M999 to continue\r\n'

    def fake_write_and_return(cmdstr, ack, conn, timeout=None, tag=None):

        return cmdstr + killmsg

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        fake_write_and_return)
    assert serial_communication.write_and_return is fake_write_and_return
    robot._driver.move({'X': 0})

    robot._driver._is_hard_halting.set()

    with pytest.raises(driver_3_0.SmoothieAlarm):
        robot._driver.move({'X': 25})

    assert not robot._driver._is_hard_halting.is_set()


def test_move_splitting(smoothie, robot, monkeypatch):
    smoothie.simulating = False
    command_log = []

    time_mock = Mock()
    monkeypatch.setattr(utils.time, 'monotonic', time_mock)
    time_mock.return_value = 0

    def send_command_logger(command, timeout=12000.0, ack_timeout=5.0):
        nonlocal command_log
        command_log.append(command)

    monkeypatch.setattr(smoothie, '_send_command', send_command_logger)
    smoothie.update_steps_per_mm({'B': 3200, 'C': 3200})
    command_log.clear()

    time_mock.return_value = 10
    smoothie.move({'X': 100})
    # no backlash, no move splitting, nice and easy
    assert command_log\
        == ['M907 A0.1 B0.05 C0.05 X1.25 Y0.3 Z0.1 G4P0.005 G0X100']

    command_log.clear()

    # move splitting but for a different axis - ignored
    smoothie.configure_splits_for({'B': types.MoveSplit(
        split_distance=50, split_current=1.5, split_speed=0.5, after_time=0,
        fullstep=True)})
    time_mock.return_value = 20
    smoothie.move({'C': 10})
    assert command_log\
        == ['M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 G0C10.3 G0C10',
            'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005']

    command_log.clear()

    # move splits that are longer than the move get eaten both in -
    time_mock.return_value = 40
    smoothie.configure_splits_for(
        {'B': types.MoveSplit(
            split_distance=30, split_current=1.5,
            split_speed=0.5, after_time=0, fullstep=False)})
    smoothie._position['B'] = 100
    smoothie.move({'B': 75})
    assert command_log\
        == ['G0F30 M907 A0.1 B1.5 C0.05 X0.3 Y0.3 Z0.1 G4P0.005',
            'G0B75',
            'G0F24000 M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 G0B75',
            'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005']

    command_log.clear()
    # and in +
    time_mock.return_value = 50
    smoothie.move({'B': 100})
    assert command_log\
        == ['G0F30 M907 A0.1 B1.5 C0.05 X0.3 Y0.3 Z0.1 G4P0.005',
            'G0B100.3',
            'G0F24000 M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 '
            'G0B100.3 G0B100',
            'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005']

    # if backlash is involved, it's added on top
    # prep by moving to 0
    time_mock.return_value = 60
    smoothie.move({'C': 0})
    smoothie.configure_splits_for({'C': types.MoveSplit(
        split_distance=1, split_current=2.0, split_speed=1, after_time=0,
        fullstep=True)})
    command_log.clear()
    smoothie.move({'C': 20})
    assert command_log\
        == ['M55 M92 C100.0 G4P0.01 '
            'G0F60 M907 A0.1 B0.05 C2.0 X0.3 Y0.3 Z0.1 G4P0.005',
            'G0C1',
            'M54 M92 C3200 G4P0.01',
            'G0F24000 M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 '
            'G0C20.3 G0C20',
            'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005']  # noqa(E501)

    # if backlash is involved, the backlash target should be the limit
    # for the split move
    smoothie.move({'C': 15})
    smoothie.configure_splits_for({'C': types.MoveSplit(
        split_distance=10, split_current=2.0, split_speed=1, after_time=0,
        fullstep=True)})
    command_log.clear()
    time_mock.return_value = 70
    smoothie.move({'C': 20})
    # note that the backlash/target move has a 0.05A current on C even though
    # it is active because that is the robot config default active plunger
    # current. when the driver is used with the rest of the robot or hardware
    # control stack it uses the higher currents
    assert command_log\
        == ['M55 M92 C100.0 G4P0.01 '
            'G0F60 M907 A0.1 B0.05 C2.0 X0.3 Y0.3 Z0.1 G4P0.005',
            'G0C20.3',
            'M54 M92 C3200 G4P0.01',
            'G0F24000 M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 '
            'G0C20.3 G0C20',
            'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005']  # noqa(E501)
    smoothie.configure_splits_for(
        {'B': types.MoveSplit(
            split_distance=50, split_current=1.5,
            split_speed=0.5, after_time=10,
            fullstep=True)})
    # timing: if the axis has moved recently (since we're changing the
    # time mock) it shouldn't split. first move to reset the last moved at
    smoothie.move({'B': 0})
    command_log.clear()
    # this move therefore should not split
    smoothie.move({'B': 100})
    assert command_log[0:1] == [
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 G0B100.3 G0B100']
    command_log.clear()
    # nor should this move
    time_mock.return_value = 79
    smoothie.move({'B': 1})
    assert command_log[0:1] == [
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 G0B1']
    command_log.clear()
    # now that we advance time, we split
    time_mock.return_value = 89.01
    command_log.clear()
    smoothie.move({'B': 100})
    assert command_log == [
        'M53 M92 B100.0 G4P0.01 G0F30 '
        'M907 A0.1 B1.5 C0.05 X0.3 Y0.3 Z0.1 G4P0.005',
        'G0B51',
        'M52 M92 B3200 G4P0.01',
        'G0F24000 M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005 '
        'G0B100.3 G0B100',
        'M907 A0.1 B0.05 C0.05 X0.3 Y0.3 Z0.1 G4P0.005']


def test_per_move_speed(smoothie, robot, monkeypatch):
    smoothie.simulating = False
    command_log = []

    def send_command_logger(command, timeout=12000.0, ack_timeout=5.0):
        nonlocal command_log
        command_log.append(command)

    monkeypatch.setattr(smoothie, '_send_command', send_command_logger)

    # no speed argument: use combined speed
    smoothie.move({'X': 100})

    assert command_log[0]\
        == 'M907 A0.1 B0.05 C0.05 X1.25 Y0.3 Z0.1 G4P0.005 G0X100'

    command_log.clear()

    # specify speed: both set and reset
    smoothie.move({'Y': 100}, speed=100)
    assert command_log[0]\
        == 'G0F6000 M907 A0.1 B0.05 C0.05 X0.3 Y1.25 Z0.1 G4P0.005 G0Y100 G0F24000'  # noqa(E501)
