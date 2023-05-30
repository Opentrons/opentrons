"""Common CLI configuration elements and defaults.

Extra args can be used by continuing to customize the parser.
"""

import argparse


def build_root_parser() -> argparse.ArgumentParser:
    """Constructs the basic CLI parser for the application."""
    parser = argparse.ArgumentParser(description="Opentrons system server")
    parser.add_argument(
        "-p",
        "--port",
        dest="port",
        type=int,
        default=32950,
        help="Port to listen on. Passed to uvicorn.",
    )
    parser.add_argument(
        "--host",
        dest="host",
        type=str,
        default="127.0.0.1",
        help="Host to listen on. Passed to uvicorn.",
    )
    parser.add_argument(
        "--log-level",
        dest="log_level",
        choices=["debug", "info", "warning", "error"],
        help="Log level",
        default="info",
    )
    parser.add_argument(
        "--reload",
        dest="reload",
        action="store_true",
        help="If this argument is passed, enable uvicorn reloading.",
    )
    return parser
