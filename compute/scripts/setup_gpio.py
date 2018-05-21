from time import sleep

from opentrons.drivers.rpi_drivers import gpio
from opentrons import robot

# set the direction of each gpio (in or out)
gpio.initialize()

# audio-enable pin can stay HIGH always, unless there is noise coming
# from the amplifier, then we can set to LOW to disable the amplifier
gpio.set_high(gpio.OUTPUT_PINS['AUDIO_ENABLE'])

# smoothieware programming pins, put in a HIGH state to not interrupt operation
gpio.set_high(gpio.OUTPUT_PINS['HALT'])
gpio.set_high(gpio.OUTPUT_PINS['ISP'])
gpio.set_high(gpio.OUTPUT_PINS['RESET'])

# start everything off with the LED showing an WAITING status as we boot up
gpio.set_light_indicator_status('waiting')
