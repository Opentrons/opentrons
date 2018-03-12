import atexit

from opentrons import robot


def get_state_of_inputs():
    smoothie_switches = robot._driver.switch_state
    probe = smoothie_switches['Probe']
    endstops = {
        ax: val
        for ax, val in smoothie_switches.items()
        if ax != 'Probe'
    }
    return {
        'button': robot._driver.read_button(),
        'windows': robot._driver.read_window_switches(),
        'probe': probe,
        'endstops': endstops
    }


def set_lights(state):
    if state['windows']:
        robot._driver.turn_on_rail_lights()
    else:
        robot._driver.turn_off_rail_lights()
    red, green, blue = (False, False, False)
    if any(state['endstops'].values()):
        red = True
    if state['probe']:
        green = True
    if state['button']:
        blue = True
    robot._driver._set_button_light(red=red, green=green, blue=blue)


def reset_lights():
    robot._driver.turn_off_rail_lights()
    robot._driver._set_button_light(blue=True)


if __name__ == "__main__":
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

    # reset the lights at the end
    atexit.register(reset_lights)

    robot.connect()

    # enter button-read loop
    while True:
        state = get_state_of_inputs()
        set_lights(state)
