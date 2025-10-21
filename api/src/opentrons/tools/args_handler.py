import argparse
from typing import Optional, Tuple, cast

from opentrons.hardware_control import API, Controller
from opentrons.hardware_control.types import HardwareFeatureFlags
from opentrons.drivers.smoothie_drivers import SmoothieDriver


def root_argparser(description: Optional[str] = None) -> argparse.ArgumentParser:
    parse = argparse.ArgumentParser(description=description)
    parse.add_argument(
        "-p", "--port", help="serial port of the smoothie", default="", type=str
    )
    return parse


async def build_driver(port: Optional[str] = None) -> Tuple[API, SmoothieDriver]:
    hardware = await API.build_hardware_controller(
        port=port, feature_flags=HardwareFeatureFlags.build_from_ff()
    )
    backend: Controller = cast(Controller, hardware._backend)
    return hardware, backend._smoothie_driver
