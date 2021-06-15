import argparse
from typing import Tuple

from opentrons.hardware_control import API
from opentrons.drivers.smoothie_drivers import SmoothieDriver


def root_argparser(description: str = None):
    parse = argparse.ArgumentParser(description=description)
    parse.add_argument('-p', '--port',
                       help='serial port of the smoothie',
                       default='', type=str)
    return parse


async def build_driver(
        port: str = None)\
        -> Tuple[API, SmoothieDriver]:
    hardware = await API.build_hardware_controller(port=port)
    driver = hardware._backend._smoothie_driver
    return hardware, driver
