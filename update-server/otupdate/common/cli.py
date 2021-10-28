"""
Common CLI configuration elements and defaults. Extra args can be used
by continuing to customize the parser.
"""

import argparse

from . import config


def build_root_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Opentrons update server")
    parser.add_argument(
        "-p",
        "--port",
        dest="port",
        type=int,
        help="Port to listen on. Passed to aiohttp",
    )
    parser.add_argument(
        "--host",
        dest="host",
        type=str,
        default="127.0.0.1",
        help="Host to listen on. Passed to aiohttp",
    )
    parser.add_argument(
        "--version-file",
        dest="version_file",
        type=str,
        default=None,
        help="Version file path if not default",
    )
    parser.add_argument(
        "--log-level",
        dest="log_level",
        choices=["debug", "info", "warning", "error"],
        help="Log level",
        default="info",
    )
    parser.add_argument(
        "--config-file",
        dest="config_file",
        type=str,
        default=None,
        help="Config file path. If not specified, falls back "
        f"to {config.PATH_ENVIRONMENT_VARIABLE} env var and "
        f"then default path {config.DEFAULT_PATH}",
    )
    return parser
