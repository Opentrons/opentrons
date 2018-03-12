from opentrons import robot


d = robot._driver
button_state = d.read_button()

button_color_index = 0
button_color_methods = [
    d.turn_on_red_button_light,
    d.turn_on_green_button_light,
    d.turn_on_blue_button_light
]

while True:
    new_state = int(d.read_button())
    if new_state != button_state:
        button_color_index = (button_color_index + 1)
        func = button_color_methods[button_color_index]
        func()
    button_state = int(new_state)
