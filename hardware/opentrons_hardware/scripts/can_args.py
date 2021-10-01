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
    return parser
