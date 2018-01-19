from opentrons.drivers.rpi_drivers import gpio
from opentrons import robot

gpio.initialize()
robot.turn_on_button_light()
