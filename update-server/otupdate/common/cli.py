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
        help="Port to listen on. Passed to uvicorn",
    )
    parser.add_argument(
        "--host",
        dest="host",
        type=str,
        default="127.0.0.1",
        help="Host to listen on. Passed to uvicorn",
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
    auth_server_location = parser.add_mutually_exclusive_group()
    auth_server_location.add_argument(
        "--auth-server-uds",
        dest="auth_server_uds",
        type=str,
        default=None,
        help="The path to the Unix domain socket where auth-server is listening."
        " Mutually exclusive with --auth-server-url."
        " If neither is given, this robot's default socket path is used.",
    )
    auth_server_location.add_argument(
        "--auth-server-url",
        dest="auth_server_url",
        type=str,
        default=None,
        help="The base URL (e.g. http://localhost:1234) where auth-server is"
        " listening. Mutually exclusive with --auth-server-uds.",
    )
    audit_server_location = parser.add_mutually_exclusive_group()
    audit_server_location.add_argument(
        "--audit-server-uds",
        dest="audit_server_uds",
        type=str,
        default=None,
        help="The path to the Unix domain socket where audit-server is listening."
        " Mutually exclusive with --audit-server-url."
        " If neither is given, this robot's default socket path is used.",
    )
    audit_server_location.add_argument(
        "--audit-server-url",
        dest="audit_server_url",
        type=str,
        default=None,
        help="The base URL (e.g. http://localhost:1234) where audit-server is"
        " listening. Mutually exclusive with --audit-server-uds.",
    )
    return parser
