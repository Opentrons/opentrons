import argparse


class Formatter(argparse.RawTextHelpFormatter, argparse.RawDescriptionHelpFormatter):
    pass


class BaseCli:
    """A base cli for inheriting global flags."""

    def __init__(self) -> None:
        self.parser: argparse.ArgumentParser = argparse.ArgumentParser(
            formatter_class=Formatter,
        )
        self.parser.add_argument(
            "--robot_ip", type=str, help="Your robot ip address like: 192.168.50.89"
        )

        self.parser.add_argument(
            "--robot_port",
            type=str,
            help="Your robot port like: 31950",
            nargs="?",
            default="31950",
        )
