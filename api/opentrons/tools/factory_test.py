import atexit
import os
import socket
import subprocess

from opentrons import robot
from opentrons.util import environment


RESULT_SPACE = '\t- {}'
FAIL = 'FAIL\t*** !!! ***'
PASS = 'PASS'

USB_MOUNT_FILEPATH = '/mnt/usbdrive'
DATA_FOLDER = environment.get_path('APP_DATA_DIR')
VIDEO_FILEPATH = os.path.join(DATA_FOLDER, './cam_test.mp4')
AUDIO_FILE_PATH = '/etc/audio/speaker-test.mp3'


def _find_storage_device():
    if os.path.exists(USB_MOUNT_FILEPATH) is False:
        run_quiet_process('mkdir {}'.format(USB_MOUNT_FILEPATH))
    if os.path.ismount(USB_MOUNT_FILEPATH) is False:
        sdn1_devices = [
            '/dev/sd{}1'.format(l)
            for l in 'abcdefgh'
            if os.path.exists('/dev/sd{}1'.format(l))
        ]
        if len(sdn1_devices) == 0:
            print(RESULT_SPACE.format(FAIL))
            return
        try:
            run_quiet_process(
                'mount {0} {1}'.format(sdn1_devices[0], USB_MOUNT_FILEPATH))
        except Exception:
            print(RESULT_SPACE.format(FAIL))
            return
    return True


def _this_wifi_ip_address():
    gw = os.popen("ip -4 route show default").read().split()
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect((gw[2], 0))
    return s.getsockname()[0]


def _erase_data(filepath):
    if os.path.exists(filepath):
        os.remove(filepath)


def _reset_lights():
    robot._driver.turn_off_rail_lights()
    robot._driver._set_button_light(blue=True)


def _get_state_of_inputs():
    smoothie_switches = robot._driver.switch_state
    probe = smoothie_switches['Probe']
    endstops = {
        ax: val
        for ax, val in smoothie_switches.items()
        if ax in 'XYZA'  # only test gantry axes
    }
    return {
        'button': robot._driver.read_button(),
        'windows': robot._driver.read_window_switches(),
        'probe': probe,
        'endstops': endstops
    }


def _set_lights(state):
    if state['windows']:
        robot._driver.turn_off_rail_lights()
    else:
        robot._driver.turn_on_rail_lights()
    red, green, blue = (False, False, False)
    if any(state['endstops'].values()):
        red = True
    if state['probe']:
        green = True
    if state['button']:
        blue = True
    robot._driver._set_button_light(red=red, green=green, blue=blue)


def run_quiet_process(command):
    subprocess.check_output('{} &> /dev/null'.format(command), shell=True)


def test_smoothie_gpio():
    from time import sleep
    from opentrons.drivers.rpi_drivers import gpio
    from opentrons.drivers.smoothie_drivers import serial_communication

    print('CONNECT')
    robot.connect()
    d = robot._driver
    # make sure the driver is currently working as expected
    version_response = serial_communication.write_and_return(
        'version\r\n', d._connection, timeout=1)
    if 'version' in version_response:
        print(RESULT_SPACE.format(PASS))
    else:
        print(RESULT_SPACE.format(FAIL))

    print('DATA LOSS')
    for i in range(10):
        serial_communication.write_and_return(
            'version\r\n',
            d._connection,
            timeout=1)
    data = [
        serial_communication.write_and_return('version\r\n', d._connection, timeout=1)  #NOQA
        for i in range(100)
    ]
    if len(set(data)) == 1:
        print(RESULT_SPACE.format(PASS))
    else:
        print(RESULT_SPACE.format(FAIL))

    print('HALT')
    d._connection.reset_input_buffer()
    # drop the HALT line LOW, and make sure there is an error state
    gpio.set_low(gpio.OUTPUT_PINS['HALT'])
    sleep(0.25)
    gpio.set_high(gpio.OUTPUT_PINS['HALT'])
    sleep(0.25)

    old_timeout = int(d._connection.timeout)
    d._connection.timeout = 1  # 1 second
    cycles = 5
    for i in range(cycles):
        r = d._connection.readline().decode()
        if 'ALARM' in r:
            print(RESULT_SPACE.format(PASS))
            serial_communication.write_and_return(
                'M999', d._connection, timeout=1)
            break
        elif i >= cycles - 1:
            print(RESULT_SPACE.format(FAIL))

    d._reset_from_error()
    d._connection.timeout = old_timeout

    print('ISP')
    # drop the ISP line to LOW, and make sure it is dead
    gpio.set_low(gpio.OUTPUT_PINS['ISP'])
    sleep(0.25)
    gpio.set_high(gpio.OUTPUT_PINS['ISP'])
    sleep(0.25)

    r = serial_communication.write_and_return('M999', d._connection, timeout=1)
    if len(r):
        print(RESULT_SPACE.format(FAIL))
    else:
        print(RESULT_SPACE.format(PASS))

    print('RESET')
    # toggle the RESET line to LOW, and make sure it is NOT dead
    d._smoothie_reset()
    r = serial_communication.write_and_return('M119', d._connection, timeout=1)
    if 'X_max' in r:
        print(RESULT_SPACE.format(PASS))
    else:
        print(RESULT_SPACE.format(FAIL))


def test_switches_and_lights():
    print('\n')
    print('* BUTTON\t--> BLUE')
    print('* PROBE\t\t--> GREEN')
    print('* ENDSTOP\t--> RED')
    print('* WINDOW\t--> LIGHTS')
    print('')
    print('Next\t--> CTRL-C')
    print('')
    # enter button-read loop
    robot.connect()
    try:
        while True:
            state = _get_state_of_inputs()
            _set_lights(state)
    except KeyboardInterrupt:
        print()
        pass


def test_speaker():
    print('Speaker')
    print('Next\t--> CTRL-C')
    try:
        run_quiet_process('mpg123 {}'.format(AUDIO_FILE_PATH))
    except KeyboardInterrupt:
        pass
        print()


def record_camera(filepath):
    print('USB Camera')
    # record 1 second of video from the USB camera
    c = 'ffmpeg -video_size 320x240 -i /dev/video0 -t 00:00:01 {} -loglevel quiet'  # NOQA
    try:
        run_quiet_process(c.format(filepath))
        print(RESULT_SPACE.format(PASS))
    except Exception:
        print(RESULT_SPACE.format(FAIL))


def copy_to_usb_drive_and_back(filepath):
    # create the mount directory
    print('USB Flash-Drive')

    if _find_storage_device():
        # move the file to and from it
        name = filepath.split('/')[-1]
        try:
            run_quiet_process(
                'mv {0} /mnt/usbdrive/{1}'.format(filepath, name))
        except Exception:
            print(RESULT_SPACE.format(FAIL))
            return
        if os.path.exists('/mnt/usbdrive/{}'.format(name)):
            try:
                run_quiet_process(
                    'mv /mnt/usbdrive/{0} {1}'.format(name, filepath))
            except Exception:
                print(RESULT_SPACE.format(FAIL))
                return
            if os.path.exists(filepath):
                print(RESULT_SPACE.format(PASS))
            else:
                print(RESULT_SPACE.format(FAIL))
        else:
            print(RESULT_SPACE.format(FAIL))


def start_server(folder, filepath):
    print('\nOPEN\t--> {0}:8000/{1}\n'.format(
        _this_wifi_ip_address(),
        filepath.split('/')[-1]
        ))
    print('\nQuit\t--> CTRL-C\n\n\n')
    try:
        run_quiet_process('cd {} && python -m http.server'.format(folder))
    except KeyboardInterrupt:
        print()
        pass


if __name__ == "__main__":
    atexit.register(_reset_lights)
    atexit.register(_erase_data, VIDEO_FILEPATH)
    _reset_lights()
    _erase_data(VIDEO_FILEPATH)
    test_smoothie_gpio()
    test_switches_and_lights()
    test_speaker()
    record_camera(VIDEO_FILEPATH)
    copy_to_usb_drive_and_back(VIDEO_FILEPATH)
    start_server(DATA_FOLDER, VIDEO_FILEPATH)
    exit()
