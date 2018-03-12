import atexit

from opentrons import robot


d = robot._driver


def get_state_of_inputs():
    smoothie_switches = d.switch_state
    probe = smoothie_switches['Probe']
    endstops = {ax: val for ax, val in smoothie_switches if ax != 'Probe'}
    return {
        'button': d.read_button(),
        'windows': d.read_window_switches(),
        'probe': probe,
        'endstops': endstops
    }


def set_lights(state):

    if state['windows']:
        d.turn_on_rail_lights()
    else:
        d.turn_off_rail_lights()

    red, green, blue = (False, False, False)

    if not all(state['endstops'].values()):
        red = True
    if state['probe']:
        green = True
    if state['button']:
        blue = True

    d._set_button_light(red=red, green=green, blue=blue)


def reset_lights():
    d.turn_off_rail_lights()
    d._set_button_light(blue=True)


if __name__ == "__main__":
    print('\n')
    print('Button and LED Test')
    print('')
    print('Press button to set it\'s color, and turn on/off the rail lights')
    print('')
    print('Press CTRL-C at any time to quit')

    # reset the lights at the end
    atexit.register(reset_lights)

    robot.connect()

    # enter button-read loop
    while True:
        state = get_state_of_inputs()
        set_lights(state)
