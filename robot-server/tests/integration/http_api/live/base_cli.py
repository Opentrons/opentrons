import argparse


class Formatter(argparse.RawTextHelpFormatter, argparse.RawDescriptionHelpFormatter):
    pass


class BaseCli:
    def __init__(self) -> None:
        self.parser: argparse.ArgumentParser = argparse.ArgumentParser(
            formatter_class=Formatter,
        )
        self.parser.add_argument(
            "--robot_ip", type=str, help="Your robot ip address like: 192.168.50.89"
        )
