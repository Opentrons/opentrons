"""ArgumentParser setup for a can device."""
from argparse import ArgumentParser, Namespace

from opentrons_hardware.drivers.can_bus import DriverSettings
from opentrons_hardware.drivers.can_bus import settings


def add_can_args(parser: ArgumentParser) -> ArgumentParser:
    """Add CAN interface arguments to ArgumentParser.

    Args:
        parser: ArgumentParser

    Returns: ArgumentParser with added arguments for CAN interface.
    """
    parser.add_argument(
        "--interface",
        type=str,
        required=False,
        default=settings.DEFAULT_INTERFACE,
        help=f"the interface to use (ie: {settings.OPENTRONS_INTERFACE}, "
        f"virtual, pcan, socketcan)",
    )
    parser.add_argument(
        "--bitrate",
        type=int,
        default=settings.DEFAULT_BITRATE,
        required=False,
        help="the bitrate",
    )
    parser.add_argument(
        "--channel",
        type=str,
        default=settings.DEFAULT_CHANNEL,
        required=False,
        help="optional channel",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=settings.DEFAULT_PORT,
        required=False,
        help=f"port to use for {settings.OPENTRONS_INTERFACE} interface",
    )
    parser.add_argument(
        "--host",
        type=str,
        default=settings.DEFAULT_HOST,
        required=False,
        help=f"host to connect to for {settings.OPENTRONS_INTERFACE} interface",
    )
    parser.add_argument(
        "--fcan_clk",
        type=int,
        default=settings.DEFAULT_FDCAN_CLK,
        required=False,
        help="Clock (MHz) for can analyzer, only for pcan interface",
    )
    parser.add_argument(
        "--sample_rate",
        type=float,
        default=settings.DEFAULT_SAMPLE_RATE,
        required=False,
        help="Sample rate for can analyzer, only for pcan interface",
    )
    parser.add_argument(
        "--jump_width",
        type=int,
        default=settings.DEFAULT_JUMP_WIDTH_SEG,
        required=False,
        help="Jump width seg for can analyzer, only for pcan interface",
    )
    return parser


def build_settings(args: Namespace) -> DriverSettings:
    """Create driver settings from args."""
    return DriverSettings(
        interface=args.interface,
        port=args.port,
        host=args.host,
        bit_rate=args.bitrate,
        channel=args.channel,
    )
