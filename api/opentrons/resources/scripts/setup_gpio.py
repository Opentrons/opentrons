#!/usr/bin/env python
from time import sleep

from opentrons.drivers.rpi_drivers import gpio
from opentrons import robot

# set the direction of each gpio (in or out)
gpio.initialize()

# audio-enable pin can stay HIGH always, unless there is noise coming
# from the amplifier, then we can set to LOW to disable the amplifier
gpio.set_high(gpio.OUTPUT_PINS['AUDIO_ENABLE'])

# smoothieware programming pins, must be in a known state (HIGH)
gpio.set_high(gpio.OUTPUT_PINS['HALT'])
gpio.set_high(gpio.OUTPUT_PINS['ISP'])
gpio.set_low(gpio.OUTPUT_PINS['RESET'])
sleep(0.25)
gpio.set_high(gpio.OUTPUT_PINS['RESET'])
sleep(0.25)

# turn light to blue
robot.turn_on_button_light()
