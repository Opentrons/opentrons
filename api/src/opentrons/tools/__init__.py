import opentrons
import optparse
import sys


def connect_to_port(hardware):
    parser = optparse.OptionParser(usage='usage: %prog [options] ')
    parser.add_option(
        "-p", "--p", dest="port", default='',
        type='str', help='serial port of the smoothie'
    )

    options, _ = parser.parse_args(args=sys.argv, values=None)
    if options.port:
        hardware.connect(options.port)
    else:
        hardware.connect()


driver = opentrons.drivers.smoothie_drivers.SimulatingDriver()

try:
    if opentrons.config.feature_flags.use_protocol_api_v2():
        api = opentrons.hardware_control.API
        adapter = opentrons.hardware_control.adapters
        hardware = adapter.SynchronousAdapter.build(
            api.build_hardware_controller)
        driver = hardware._backend._smoothie_driver
    else:
        hardware = opentrons.robot
        connect_to_port(hardware)
        driver = hardware._driver
except AttributeError:
    hardware = None
