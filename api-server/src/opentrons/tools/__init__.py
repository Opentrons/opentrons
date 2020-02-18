import opentrons
import optparse
import sys


def connect_to_port(hardware):

    if options.port:
        hardware.connect(options.port)
    else:
        hardware.connect()


driver = opentrons.drivers.smoothie_drivers.SimulatingDriver()

try:
    api = opentrons.hardware_control.API
    adapter = opentrons.hardware_control.adapters
    parser = optparse.OptionParser(usage='usage: %prog [options] ')
    parser.add_option(
        "-p", "--p", dest="port", default='',
        type='str', help='serial port of the smoothie'
    )

    options, _ = parser.parse_args(args=sys.argv, values=None)
    if options.port:
        port = options.port
    else:
        port = None
    hardware = adapter.SynchronousAdapter.build(
        api.build_hardware_controller, port=port)
    driver = hardware._backend._smoothie_driver
except AttributeError:
    hardware = None  # type: ignore
    driver = None  # type: ignore
