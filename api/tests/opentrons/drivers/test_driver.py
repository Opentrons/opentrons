from threading import Thread
import pytest

from tests.opentrons.conftest import fuzzy_assert


def position(x, y, z, a, b, c):
    return {axis: value for axis, value in zip('XYZABC', [x, y, z, a, b, c])}


def test_parse_axis_values(smoothie):
    from opentrons.drivers.smoothie_drivers import driver_3_0 as drv
    good_data = 'ok M114.2 X:10 Y:20: Z:30 A:40 B:50 C:60'
    bad_data = 'ok M114.2 X:10 Y:20: Z:30A:40 B:50 C:60'
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


def test_plunger_commands(smoothie, monkeypatch):
    from opentrons.drivers.smoothie_drivers import serial_communication
    from opentrons.drivers.smoothie_drivers import driver_3_0
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
    expected = [
        ['M907 B0.5 C0.5 M400'],               # Set plunger current high
        ['G4P0.05 M400'],                      # Dwell
        ['G28.2[ABCZ]+ M400'],                 # Home
        ['M907 B0.1 C0.1 M400'],               # Set plunger current low
        ['G4P0.05 M400'],                      # Dwell
        ['M907 Y0.8 M400'],                    # set Y motor to low current
        ['G4P0.05 M400'],                      # delay for current
        ['G0F3000 M400'],                      # set Y motor to low speed
        ['G0Y-20 M400'],                       # move Y motor away from switch
        ['M907 A1.0 B0.1 C0.1 X1.5 Y1.75 Z1.0 M400'],  # set current back
        ['G4P0.05 M400'],                      # delay for current
        ['G0F24000 M400'],                      # set back to default speed
        ['G28.2X M400'],                       # home X
        ['G28.2Y M400'],                        # home Y
        ['M203.1 Y8 M400'],                     # lower speed on Y for retract
        ['G91 G0Y-3 G90'],                          # retract Y
        ['G28.2Y M400'],                        # home Y
        ['G91 G0Y-3 G90'],                          # retract Y
        ['M203.1 A100 B70 C70 X600 Y400 Z100 M400'],  # return to norm current
        ['M114.2 M400']                       # Get position
    ]
    # from pprint import pprint
    # pprint(command_log)
    fuzzy_assert(result=command_log, expected=expected)
    command_log = []

    smoothie.move({'X': 0, 'Y': 1.123456, 'Z': 2, 'A': 3})
    expected = [
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
        ['G0B2.3 G0B2 M400'],
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
    from opentrons.drivers.smoothie_drivers.driver_3_0 import HOMED_POSITION

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


def test_set_current(model):
    from opentrons.robot.robot_configs import DEFAULT_CURRENT
    import types
    driver = model.robot._driver

    set_current = driver.set_current

    current_log = []

    def set_current_mock(self, target):
        nonlocal current_log
        current_log.append(target)
        set_current(target)

    driver.set_current = types.MethodType(set_current_mock, driver)

    rack = model.robot.add_container('tiprack-200ul', '10')
    pipette = model.instrument._instrument
    pipette.pick_up_tip(rack[0], presses=1)

    # Instrument in `model` is configured to right mount, which is the A axis
    # on the Smoothie (see `Robot._actuators`)
    expected = [{'A': 0.1}, DEFAULT_CURRENT]
    from pprint import pprint
    pprint(current_log)
    assert current_log == expected


def test_fast_home(model):
    from opentrons.drivers.smoothie_drivers.driver_3_0 import HOMED_POSITION, \
        Y_SWITCH_BACK_OFF_MM
    import types
    driver = model.robot._driver

    move = driver.move
    coords = []

    def move_mock(self, target):
        nonlocal coords
        coords.append(target)
        move(target)

    target_y = driver.position['Y'] - Y_SWITCH_BACK_OFF_MM

    driver.move = types.MethodType(move_mock, driver)

    assert coords == []
    driver.fast_home(axis='X', safety_margin=12)
    assert coords == [{'X': HOMED_POSITION['X'] - 12}, {'Y': target_y}]
    assert driver.position['X'] == HOMED_POSITION['X']


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
    command_log = []

    def write_with_log(command, connection, timeout):
        if 'G0F' in command:
            command_log.append(command)
        return serial_communication.DRIVER_ACK.decode()

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
    command_log = []

    def write_with_log(command, connection, timeout):
        if 'M203.1' in command or 'G0F' in command:
            command_log.append(command)
        return serial_communication.DRIVER_ACK.decode()

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
