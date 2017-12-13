from os import system
"""
Raspberry Pi GPIO control module

Read/Write from RPi GPIO pins is performed by exporting a pin by number,
writing the direction for the pin, and then writing a high or low signal
to the pin value.

To export a pin, find the desired pin in OUTPUT_PINS or INPUT_PINS, and write
the corresponding number to `/sys/class/gpio/export`.

After export, set pin direction by writing either "in" or "out" to
`/sys/class/gpio/gpio<pin_number>/direction`.

After direction is set, set a pin high by writing a "1" or set the pin low by
writing "0" (zero) to `/sys/class/gpio/gpio<pin_number>/value`.

This library abstracts those operations by providing an `initialize` function
to set up all pins correctly, and then providing `set_low` and `set_high`
functions that accept a pin number. The OUTPUT_PINS and INPUT_PINS dicts
provide pin-mappings so calling code does not need to use raw integers.
"""


IN = "in"
OUT = "out"

LOW = "0"
HIGH = "1"

OUTPUT_PINS = {
    'HALT': 18,
    # 'RESET': 24,  # Not currently used--slower restart and noisy serial resp
    'FRAME_LEDS': 6,
    'BLUE_BUTTON': 13,
    'GREEN_BUTTON': 19,
    'RED_BUTTON': 26
}

INPUT_PINS = {
    'BUTTON_INPUT': 5
}

_path_prefix = "/sys/class/gpio"


def _enable_pin(pin, direction):
    _write_value(pin, "{}/export".format(_path_prefix))
    _write_value(direction, "{0}/gpio{1}/direction".format(_path_prefix, pin))


def _write_value(value, path):
    system('echo "{0}" > {1}'.format(value, path))


def set_high(pin):
    _write_value(HIGH, "{0}/gpio{1}/value".format(_path_prefix, pin))


def set_low(pin):
    _write_value(LOW, "{0}/gpio{1}/value".format(_path_prefix, pin))


def initialize():
    """
    All named pins in OUTPUT_PINS and INPUT_PINS are exported, and set the
    HALT pin high (normal running state), since the default value after export
    is low.
    """
    for pin in sorted(OUTPUT_PINS.values()):
        _enable_pin(pin, OUT)

    set_high(OUTPUT_PINS['HALT'])

    for pin in sorted(INPUT_PINS.values()):
        _enable_pin(pin, IN)
