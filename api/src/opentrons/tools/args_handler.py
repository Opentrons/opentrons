import argparse
from typing import Tuple

from opentrons.hardware_control import ThreadManager, API, adapters
from opentrons.drivers.smoothie_drivers.driver_3_0 import SmoothieDriver_3_0_0


def root_argparser(description: str = None):
    parse = argparse.ArgumentParser(description=description)
    parse.add_argument('-p', '--port',
                       help='serial port of the smoothie',
                       default='', type=str)
    return parse


def build_driver(
        port: str = None)\
        -> Tuple[adapters.SynchronousAdapter, SmoothieDriver_3_0_0]:
    hardware = ThreadManager(API.build_hardware_controller, None, port).sync
    driver = hardware._backend._smoothie_driver
    return hardware, driver
