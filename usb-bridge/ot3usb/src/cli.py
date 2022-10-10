"""CLI configuration options for the OT3 USB bridge."""

import argparse


def build_root_parser() -> argparse.ArgumentParser:
    """Construct a root parser."""
    parser = argparse.ArgumentParser(description="Opentrons OT3 USB bridge")
    parser.add_argument(
        "--log-level",
        dest="log_level",
        choices=["debug", "info", "warning", "error"],
        help="Log level",
        default="info",
    )
    return parser
