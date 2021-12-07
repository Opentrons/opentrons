"""ArgumentParser setup for a can device."""
from argparse import ArgumentParser, Namespace

from opentrons_hardware.drivers.can_bus import CanDriver
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.can_bus.socket_driver import SocketDriver


def add_can_args(parser: ArgumentParser) -> ArgumentParser:
    """Add CAN interface arguments to ArgumentParser.

    Args:
        parser: ArgumentParser

    Returns: ArgumentParser with added arguments for CAN interface.
    """
    parser.add_argument(
        "--interface",
        type=str,
        required=True,
        help="the interface to use (ie: opentrons, virtual, pcan, socketcan)",
    )
    parser.add_argument(
        "--bitrate", type=int, default=250000, required=False, help="the bitrate"
    )
    parser.add_argument(
        "--channel", type=str, default=None, required=False, help="optional channel"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=9898,
        required=False,
        help="port to use for opentrons interface",
    )
    return parser


async def build_driver(args: Namespace) -> AbstractCanDriver:
    """Create the driver.

    Args:
        args: arguments created by using `add_can_args`

    Returns:
        A driver.
    """
    if args.interface == "opentrons":
        return await SocketDriver.build(port=args.port)
    else:
        return await CanDriver.build(
            interface=args.interface, bitrate=args.bitrate, channel=args.channel
        )
