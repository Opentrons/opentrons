from threading import Thread
import pytest

from tests.opentrons.conftest import fuzzy_assert


def position(x, y, z, a, b, c):
    return {axis: value for axis, value in zip('XYZABC', [x, y, z, a, b, c])}


def test_update_position(model):
    import types
    driver = model.robot._driver
    driver.simulating = False
    _old_send_command = driver._send_command

    def _new_send_message(self, command, timeout=None):
        return 'ok MCS: X:0.0000 Y:0.0000 Z:0.0000 A:0.0000 B:0.0000 C:0.0000'

    driver._send_command = types.MethodType(_new_send_message, driver)

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

    def _new_send_message(self, command, timeout=None):
        nonlocal count
        # first attempt to read, we get bad data
        msg = 'ok MCS: X:0.0000 Y:MISTAKE Z:0.0000 A:0.0000 B:0.0000 C:0.0000'
        if count > 0:
            # any following attempts to read, we get good data
            msg = msg.replace('Y:MISTAKE', 'Y:0.0000')
        count += 1
        return msg

    driver._send_command = types.MethodType(_new_send_message, driver)

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

    driver._send_command = types.MethodType(_old_send_command, driver)


def test_remove_serial_echo(smoothie, monkeypatch):
    from opentrons.drivers.smoothie_drivers.serial_communication import \
        _parse_smoothie_response
    smoothie_response = b'ok\r\nok\r\n'
    command = b'G28.2B'
    ack = b'ok\r\nok\r\n'
    res = _parse_smoothie_response(smoothie_response, command, ack)
    assert res == b''
    res = _parse_smoothie_response(command + smoothie_response, command, ack)
    assert res == b''
    res = _parse_smoothie_response(
        b'\r\n' + command + b'\r\n\r\n' + smoothie_response, command, ack)
    assert res == b''
    res = _parse_smoothie_response(
        b'\r\n' + command + b'\r\n\r\nsome-data\r\nok\r\n' + smoothie_response,
        command,
        ack)
    assert res == b'some-data'


def test_parse_axis_values(smoothie):
    from opentrons.drivers.smoothie_drivers import driver_3_0 as drv
    good_data = 'ok MCS: X:10 Y:20: Z:30 A:40 B:50 C:60'
    bad_data = 'ok MCS: X:10 Y:20: Z:30A:40 B:50 C:60'
    res = drv._parse_axis_values(good_data)
    expected = {
        'X': 10,
        'Y': 20,
        'Z': 30,
        'A': 40,
        'B': 50,
        'C': 60,
    }
    assert res == expected
    with pytest.raises(drv.ParseError):
        drv._parse_axis_values(bad_data)


def test_dwell_and_activate_axes(smoothie, monkeypatch):
    from opentrons.drivers.smoothie_drivers import serial_communication
    from opentrons.drivers.smoothie_drivers import driver_3_0
    command_log = []
    smoothie._setup()
    smoothie.simulating = False

    def write_with_log(command, ack, connection, timeout):
        command_log.append(command.strip())
        return driver_3_0.SMOOTHIE_ACK

    def _parse_axis_values(arg):
        return smoothie.position

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)
    monkeypatch.setattr(driver_3_0, '_parse_axis_values', _parse_axis_values)

    smoothie.activate_axes('X')
    smoothie.dwell_axes('X')
    smoothie.activate_axes('XYBC')
    smoothie.dwell_axes('XC')
    smoothie.dwell_axes('BCY')
    expected = [
        ['M907 X1.5 M400'], ['G4P0.05 M400'],
        ['M907 X0.3 M400'], ['G4P0.05 M400'],
        ['M907 B0.5 C0.5 X1.5 Y1.75'], ['G4P0.05 M400'],
        ['M907 C0.1 X0.3 M400'], ['G4P0.05 M400'],
        ['M907 B0.1 Y0.3 M400'], ['G4P0.05 M400'],
    ]
    # from pprint import pprint
    # for i in range(len(expected)):
    #     pprint(expected[i][0] == command_log[i], expected[i], command_log[i])
    fuzzy_assert(result=command_log, expected=expected)


def test_disable_motor(smoothie, monkeypatch):
    from opentrons.drivers.smoothie_drivers import serial_communication
    from opentrons.drivers.smoothie_drivers import driver_3_0
    command_log = []
    smoothie.simulating = False

    def write_with_log(command, ack, connection, timeout):
        command_log.append(command.strip())
        return driver_3_0.SMOOTHIE_ACK

    def _parse_axis_values(arg):
        return smoothie.position

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)
    monkeypatch.setattr(driver_3_0, '_parse_axis_values', _parse_axis_values)

    smoothie.disengage_axis('X')
    smoothie.disengage_axis('XYZ')
    smoothie.disengage_axis('ABCD')
    expected = [
        ['M18X M400'],
        ['M18[XYZ]+ M400'],
        ['M18[ABC]+ M400']
    ]
    # from pprint import pprint
    # pprint(command_log)
    fuzzy_assert(result=command_log, expected=expected)


def test_plunger_commands(smoothie, monkeypatch):
    from opentrons.drivers.smoothie_drivers import serial_communication
    from opentrons.drivers.smoothie_drivers import driver_3_0
    command_log = []
    smoothie._setup()
    smoothie.home()
    smoothie.simulating = False

    def write_with_log(command, ack, connection, timeout):
        command_log.append(command.strip())
        return driver_3_0.SMOOTHIE_ACK

    def _parse_axis_values(arg):
        return smoothie.position

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)
    monkeypatch.setattr(driver_3_0, '_parse_axis_values', _parse_axis_values)

    smoothie.home()
    expected = [
        ['M907 A1.0 B0.5 C0.5 Z1.0 M400'],     # Set axes motors high
        ['G4P0.05 M400'],                      # Dwell
        ['G28.2[ABCZ]+ M400'],                 # Home
        ['M907 A0.1 B0.1 C0.1 Z0.1 M400'],     # Set axes motors low
        ['G4P0.05 M400'],                      # Dwell

        ['M907 Y0.8 M400'],                    # set Y motor to low current
        ['G4P0.05 M400'],                      # delay for current
        ['G0F3000 M400'],                      # set Y motor to low speed
        ['G91 G0Y-20 G90 M400'],               # move Y motor away from switch
        ['M907 Y0.3 M400'],  # set current back
        ['G4P0.05 M400'],                      # delay for current
        ['G0F24000 M400'],                      # set back to default speed
        ['M907 Y0.3 M400'],                    # activate X motor for HOME
        ['G4P0.05 M400'],
        ['M907 X1.5 M400'],                    # activate X motor for HOME
        ['G4P0.05 M400'],
        ['G28.2X M400'],                       # home X
        ['M907 X0.3 M400'],                    # end of HOME dwells X axis
        ['G4P0.05 M400'],

        ['M907 Y1.75 M400'],
        ['G4P0.05 M400'],
        ['G28.2Y M400'],                        # home Y
        ['M203.1 Y8 M400'],                     # lower speed on Y for retract
        ['G91 G0Y-3 G90 M400'],                      # retract Y
        ['G28.2Y M400'],                        # home Y
        ['G91 G0Y-3 G90 M400'],                      # retract Y
        ['M203.1 A125 B50 C50 X600 Y400 Z125 M400'],  # return to norm speed
        ['M907 Y0.3 M400'],                    # end of HOME dwells X axis
        ['G4P0.05 M400'],
        ['M114.2 M400']                       # Get position
    ]
    # for i in range(len(expected)):
    #     print(expected[i][0] == command_log[i], expected[i], command_log[i])
    fuzzy_assert(result=command_log, expected=expected)
    command_log = []

    smoothie.move({'X': 0, 'Y': 1.123456, 'Z': 2, 'A': 3})
    expected = [
        ['M907 A1.0 X1.5 Y1.75 Z1.0 M400'],
        ['G4P0.05 M400'],
        ['G0.+ M400']                         # Move (non-plunger)
    ]
    # from pprint import pprint
    # pprint(command_log)
    fuzzy_assert(result=command_log, expected=expected)
    command_log = []

    smoothie.move({'B': 2})
    expected = [
        ['M907 B0.5 M400'],
        ['G4P0.05 M400'],
        ['G0B2 M400'],
        ['M907 B0.1 M400'],
        ['G4P0.05 M400']
    ]
    # from pprint import pprint
    # pprint(command_log)
    fuzzy_assert(result=command_log, expected=expected)
    command_log = []

    smoothie.move({
        'X': 10.987654321,
        'Y': 1.12345678,
        'Z': 2,
        'A': 3,
        'B': 4,
        'C': 5})
    expected = [
        ['M907 B0.5 C0.5 M400'],               # Set plunger current high
        ['G4P0.05 M400'],                      # Dwell
        ['G0.+[BC].+ M400'],                   # Move (including BC)
        ['M907 B0.1 C0.1 M400'],               # Set plunger current low
        ['G4P0.05 M400']                       # Dwell
    ]
    # from pprint import pprint
    # pprint(command_log)
    fuzzy_assert(result=command_log, expected=expected)


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


def test_set_current(model):
    import types
    driver = model.robot._driver

    set_current = driver.set_current

    current_log = []

    def set_current_mock(self, target, axes_active=True):
        nonlocal current_log
        current_log.append(target)
        set_current(target, axes_active)

    driver.set_current = types.MethodType(set_current_mock, driver)

    rack = model.robot.add_container('tiprack-200ul', '10')
    pipette = model.instrument._instrument
    pipette.pick_up_tip(rack[0], presses=1)

    # Instrument in `model` is configured to right mount, which is the A axis
    # on the Smoothie (see `Robot._actuators`)
    expected = [
        {'C': 0.5},
        {'C': 0.1},
        {'A': 1.0},
        {'X': 1.5, 'Y': 1.75},
        {'A': 0.1},
        {'A': 1.0},
        {'A': 0.1}
    ]
    # from pprint import pprint
    # pprint(current_log)
    assert current_log == expected


def test_parse_pipette_data():
    from opentrons.drivers.smoothie_drivers.driver_3_0 import \
        _parse_instrument_data, _byte_array_to_hex_string
    msg = 'TestsRule!!'
    mount = 'L'
    good_data = mount + ': ' + _byte_array_to_hex_string(msg.encode())
    parsed = _parse_instrument_data(good_data).get(mount)
    assert parsed.decode() == msg


def test_read_and_write_pipettes(model):
    import types
    from opentrons.drivers.smoothie_drivers.driver_3_0 import GCODES

    driver = model.robot._driver
    _old_send_command = driver._send_command

    written_id = ''
    written_model = ''
    mount = 'L'

    def _new_send_message(self, command, timeout=None):
        nonlocal written_id, written_model, mount
        if GCODES['READ_INSTRUMENT_ID'] in command:
            return mount + ': ' + written_id
        elif GCODES['READ_INSTRUMENT_MODEL'] in command:
            return mount + ': ' + written_model
        if GCODES['WRITE_INSTRUMENT_ID'] in command:
            written_id = command[command.index(mount) + 1:]
        elif GCODES['WRITE_INSTRUMENT_MODEL'] in command:
            written_model = command[command.index(mount) + 1:]

    driver._send_command = types.MethodType(_new_send_message, driver)

    test_id = 'TestsRock!!'
    test_model = 'TestPipette'
    driver.write_pipette_id('left', test_id)
    driver.simulating = False
    read_id = driver.read_pipette_id('left')
    driver.simulating = True
    assert read_id == {'pipette_id': test_id}

    driver.write_pipette_model('left', test_model)
    driver.simulating = False
    read_model = driver.read_pipette_model('left')
    driver.simulating = True
    assert read_model == {'model': test_model + '_v1'}

    driver._send_command = types.MethodType(_old_send_command, driver)


def test_fast_home(model):
    import types
    driver = model.robot._driver

    move = driver.move
    coords = []

    def move_mock(self, target):
        nonlocal coords
        coords.append(target)
        move(target)

    driver.move = types.MethodType(move_mock, driver)

    assert coords == []
    driver.fast_home(axis='X', safety_margin=12)
    assert coords == [{'X': driver.homed_position['X'] - 12}]
    assert driver.position['X'] == driver.homed_position['X']


def test_switch_state(model):
    import types
    driver = model.robot._driver

    def send_mock(self, target):
        smoothie_switch_res = 'X_max:0 Y_max:0 Z_max:0 A_max:0 B_max:0 C_max:0'
        smoothie_switch_res += ' _pins '
        smoothie_switch_res += '(XL)2.01:0 (YL)2.01:0 (ZL)2.01:0 '
        smoothie_switch_res += '(AL)2.01:0 (BL)2.01:0 (CL)2.01:0 Probe: 0\r\n'
        return smoothie_switch_res

    driver._send_command = types.MethodType(send_mock, driver)

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

    def send_mock(self, target):
        smoothie_switch_res = 'X_max:0 Y_max:0 Z_max:0 A_max:1 B_max:0 C_max:0'
        smoothie_switch_res += ' _pins '
        smoothie_switch_res += '(XL)2.01:0 (YL)2.01:0 (ZL)2.01:0 '
        smoothie_switch_res += '(AL)2.01:0 (BL)2.01:0 (CL)2.01:0 Probe: 1\r\n'
        return smoothie_switch_res

    driver._send_command = types.MethodType(send_mock, driver)

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


def test_clear_limit_switch(virtual_smoothie_env, model, monkeypatch):
    """
    This functions as a contract test around recovery from a limit-switch hit.
    Note that this *does not* itself guarantee correct physical behavior--this
    interaction has been designed and tested on the robot manually and then
    encoded in this test. If requirements change around physical behavior, then
    this test will need to be revised.
    """
    from opentrons.drivers.smoothie_drivers.driver_3_0 import (
        serial_communication, GCODES, SmoothieError)

    driver = model.robot._driver
    model.robot.home()
    cmd_list = []

    def write_mock(command, ack, serial_connection, timeout):
        nonlocal cmd_list
        cmd_list.append(command)
        if GCODES['MOVE'] in command:
            return "ALARM: Hard limit +C"
        elif GCODES['CURRENT_POSITION'] in command:
            return 'ok MCS: X:10 Y:20: Z:30 A:40 B:50 C:60'
        else:
            return "ok"

    monkeypatch.setattr(serial_communication, 'write_and_return', write_mock)

    driver.simulating = False
    # This will cause a limit-switch error and not back off
    with pytest.raises(SmoothieError):
        driver.move({'C': 100})

    assert [c.split(' ')[0] for c in cmd_list] == [
        'M907',        # set current up
        'G4P0.05',     # dwell
        'G0C100.3',    # move C (with backlash compensation)
        'M999',        # reset from error
        'G28.2C',      # home
        'M907',        # set current
        'G4P0.05',     # dwell
        'M114.2'       # get current position
    ]


def test_pause_resume(model):
    """
    This test has to use an ugly work-around with the `simulating` member of
    the driver. When issuing movement commands in test, `simulating` should be
    True, but when testing whether `pause` actually pauses and `resume`
    resumes, `simulating` must be False.
    """
    from numpy import isclose
    from opentrons.trackers import pose_tracker
    from time import sleep

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


def test_speed_change(model, monkeypatch):

    pipette = model.instrument._instrument
    robot = model.robot
    robot._driver.simulating = False

    from opentrons.drivers.smoothie_drivers import serial_communication
    from opentrons.drivers.smoothie_drivers import driver_3_0
    command_log = []

    def write_with_log(command, ack, connection, timeout):
        if 'G0F' in command:
            command_log.append(command.strip())
        return driver_3_0.SMOOTHIE_ACK

    monkeypatch.setattr(serial_communication, 'write_and_return',
                        write_with_log)

    pipette.tip_attached = True
    pipette.set_speed(aspirate=20, dispense=40)
    pipette.aspirate().dispense()
    expected = [
        ['G0F1200 M400'],  # pipette's default aspirate speed in mm/min
        ['G0F24000 M400'],
        ['G0F2400 M400'],  # pipette's default dispense speed in mm/min
        ['G0F24000 M400']
    ]
    # from pprint import pprint
    # pprint(command_log)
    fuzzy_assert(result=command_log, expected=expected)


def test_max_speed_change(model, monkeypatch):

    robot = model.robot
    robot._driver.simulating = False

    from opentrons.drivers.smoothie_drivers import serial_communication
    from opentrons.drivers.smoothie_drivers import driver_3_0
    command_log = []

    def write_with_log(command, ack, connection, timeout):
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
        ['G0F{} M400'.format(555 * 60)],
        ['M203.1 A4 B5 C6 X1 Y2 Z3 M400'],
        ['M203.1 X7 M400'],
        ['G0F{} M400'.format(123 * 60)],
        ['G0F{} M400'.format(321 * 60)],
        ['G0F{} M400'.format(123 * 60)]
    ]
    # from pprint import pprint
    # pprint(command_log)
    fuzzy_assert(result=command_log, expected=expected)


def test_pause_in_protocol(model):
    model.robot._driver.simulating = True

    model.robot.pause()

    assert model.robot._driver.run_flag.is_set()
