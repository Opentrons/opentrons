"""ArgumentParser setup for a can device."""
from argparse import ArgumentParser


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
        help="the interface to use (ie: virtual, pcan, socketcan)",
    )
    parser.add_argument(
        "--bitrate", type=int, default=250000, required=False, help="the bitrate"
    )
    parser.add_argument(
        "--channel", type=str, default=None, required=False, help="optional channel"
    )
    parser.add_argument(
        "--not-fd",
        default=False,
        required=False,
        help="don't use can fd",
        action="store_true",
    )
    return parser
