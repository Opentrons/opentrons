"""The server's CLI entry point."""

import argparse
import logging
from dataclasses import dataclass

import uvicorn

_log = logging.getLogger(__name__)


@dataclass
class _ParsedArgs:
    port: int
    host: str
    uds: str | None
    log_level: int
    reload: bool


def _parse_args() -> _ParsedArgs:
    parser = argparse.ArgumentParser(description="Opentrons auth server")
    parser.add_argument(
        "-p",
        "--port",
        dest="port",
        type=int,
        default=0,
        help="Port to listen on, or 0 to auto-select a port.",
    )
    parser.add_argument(
        "--host",
        dest="host",
        type=str,
        default="127.0.0.1",
        help="Host to listen on.",
    )
    parser.add_argument("--uds", dest="uds", help="")
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

    parse_result = parser.parse_args()
    return _ParsedArgs(
        port=parse_result.port,
        host=parse_result.host,
        uds=parse_result.uds,
        log_level=logging.getLevelNamesMapping()[parse_result.log_level.upper()],
        reload=parse_result.reload,
    )


if __name__ == "__main__":
    args = _parse_args()

    if args.uds is not None:
        _log.info(f"Starting auth server on {args.uds}.")
    else:
        _log.info(f"Starting auth server on {args.host}:{args.port}.")

    uvicorn.run(
        "auth_server.app:app",
        port=args.port,
        host=args.host,
        uds=args.uds,
        reload=args.reload,
        log_level=args.log_level,
    )
