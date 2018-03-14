import atexit

from opentrons import robot


def get_state_of_inputs():
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


def set_lights(state):
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


def test_smoothie_gpio():
    print('Testing Smoothieware pins')
    print('')
    from time import sleep
    from opentrons.drivers.rpi_drivers import gpio
    from opentrons.drivers.smoothie_drivers import serial_communication

    print('\tTesting connection...')
    robot.connect()
    d = robot._driver
    # make sure the driver is currently working as expected
    r = serial_communication.write_and_return(
        'version\r\n', d._connection, timeout=1)
    assert 'version' in r
    print('\tPassed')

    print('\tTesting HALT pin...')
    # drop the HALT line LOW, and make sure there is an error state
    gpio.set_low(gpio.OUTPUT_PINS['HALT'])
    sleep(0.25)
    gpio.set_high(gpio.OUTPUT_PINS['HALT'])
    sleep(0.25)

    d._connection.readline()
    r = d._connection.readline().decode()
    assert 'ALARM' in r
    serial_communication.write_and_return('M999', d._connection, timeout=1)
    print('\tPassed')

    print('\tTesting ISP pin...')
    # drop the ISP line to LOW, and make sure it is dead
    gpio.set_low(gpio.OUTPUT_PINS['ISP'])
    sleep(0.25)
    gpio.set_high(gpio.OUTPUT_PINS['ISP'])
    sleep(0.25)

    r = serial_communication.write_and_return('M999', d._connection, timeout=1)
    assert not r
    print('\tPassed')

    print('\tTesting RESET pin...')
    # toggle the RESET line to LOW, and make sure it is NOT dead
    d._smoothie_reset()
    r = serial_communication.write_and_return('M119', d._connection, timeout=1)
    assert 'X_max' in r
    print('\tPassed')


def test_switches_and_lights():
    print('\n')
    print('Button, Switches, and LEDs Test')
    print('')
    print('Press button\t\t--> Button turns BLUE')
    print('Press tip-probe\t\t--> Button turns GREEN')
    print('Press endstop\t\t--> Button turns RED')
    print('Press window switches\t--> LED Strips turn ON')
    print('')
    print('Press CTRL-C at any time to quit')
    print('')
    # enter button-read loop
    robot.connect()
    while True:
        state = get_state_of_inputs()
        set_lights(state)


def reset_lights():
    robot._driver.turn_off_rail_lights()
    robot._driver._set_button_light(blue=True)


if __name__ == "__main__":
    print('\n')
    print('GPIO TEST')
    print('\n')

    # reset the lights at the end
    atexit.register(reset_lights)

    test_smoothie_gpio()
    test_switches_and_lights()
