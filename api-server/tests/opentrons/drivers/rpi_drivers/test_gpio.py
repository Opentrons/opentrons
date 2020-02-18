from opentrons.drivers.rpi_drivers import gpio


def test_init_sequence(monkeypatch):
    init_log = []

    def capture_write(value, path):
        init_log.append((value, path))

    monkeypatch.setattr(gpio, '_write_value', capture_write)

    gpio.initialize()

    expected_log = [
        # Enable output pins
        (gpio.OUTPUT_PINS['FRAME_LEDS'], "{}/export".format(gpio._path_prefix)),                            # NOQA
        (gpio.OUT, "{0}/gpio{1}/direction".format(gpio._path_prefix, gpio.OUTPUT_PINS['FRAME_LEDS'])),      # NOQA
        (gpio.OUTPUT_PINS['BLUE_BUTTON'], "{}/export".format(gpio._path_prefix)),                           # NOQA
        (gpio.OUT, "{0}/gpio{1}/direction".format(gpio._path_prefix, gpio.OUTPUT_PINS['BLUE_BUTTON'])),     # NOQA
        (gpio.OUTPUT_PINS['HALT'], "{}/export".format(gpio._path_prefix)),                                  # NOQA
        (gpio.OUT, "{0}/gpio{1}/direction".format(gpio._path_prefix, gpio.OUTPUT_PINS['HALT'])),            # NOQA
        (gpio.OUTPUT_PINS['GREEN_BUTTON'], "{}/export".format(gpio._path_prefix)),                          # NOQA
        (gpio.OUT, "{0}/gpio{1}/direction".format(gpio._path_prefix, gpio.OUTPUT_PINS['GREEN_BUTTON'])),    # NOQA
        (gpio.OUTPUT_PINS['AUDIO_ENABLE'], "{}/export".format(gpio._path_prefix)),                          # NOQA
        (gpio.OUT, "{0}/gpio{1}/direction".format(gpio._path_prefix, gpio.OUTPUT_PINS['AUDIO_ENABLE'])),    # NOQA
        (gpio.OUTPUT_PINS['ISP'], "{}/export".format(gpio._path_prefix)),                                   # NOQA
        (gpio.OUT, "{0}/gpio{1}/direction".format(gpio._path_prefix, gpio.OUTPUT_PINS['ISP'])),             # NOQA
        (gpio.OUTPUT_PINS['RESET'], "{}/export".format(gpio._path_prefix)),                                 # NOQA
        (gpio.OUT, "{0}/gpio{1}/direction".format(gpio._path_prefix, gpio.OUTPUT_PINS['RESET'])),           # NOQA
        (gpio.OUTPUT_PINS['RED_BUTTON'], "{}/export".format(gpio._path_prefix)),                            # NOQA
        (gpio.OUT, "{0}/gpio{1}/direction".format(gpio._path_prefix, gpio.OUTPUT_PINS['RED_BUTTON'])),      # NOQA
        # Enable input pins
        (gpio.INPUT_PINS['BUTTON_INPUT'], "{}/export".format(gpio._path_prefix)),                           # NOQA
        (gpio.IN, "{0}/gpio{1}/direction".format(gpio._path_prefix, gpio.INPUT_PINS['BUTTON_INPUT'])),      # NOQA
        (gpio.INPUT_PINS['WINDOW_INPUT'], "{}/export".format(gpio._path_prefix)),                           # NOQA
        (gpio.IN, "{0}/gpio{1}/direction".format(gpio._path_prefix, gpio.INPUT_PINS['WINDOW_INPUT']))       # NOQA
    ]

    assert init_log == expected_log


def test_commands(monkeypatch):
    command_log = []

    def capture_write(value, path):
        command_log.append((value, path))

    monkeypatch.setattr(gpio, '_write_value', capture_write)

    gpio.set_high(gpio.OUTPUT_PINS['HALT'])
    gpio.set_low(gpio.OUTPUT_PINS['RED_BUTTON'])

    expected_log = [
        # Set command sequence
        (gpio.HIGH, "{0}/gpio{1}/value".format(gpio._path_prefix, gpio.OUTPUT_PINS['HALT'])),               # NOQA
        (gpio.LOW, "{0}/gpio{1}/value".format(gpio._path_prefix, gpio.OUTPUT_PINS['RED_BUTTON']))           # NOQA
    ]

    assert command_log == expected_log
