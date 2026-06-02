"""The server's CLI entry point."""

import argparse
import logging
import sys
import traceback
from dataclasses import dataclass
from logging.config import dictConfig

import uvicorn

from server_utils import logging_utils


@dataclass
class _ParsedArgs:
    port: int
    host: str
    uds: str | None
    log_level: int
    reload: bool


def _parse_args() -> _ParsedArgs:
    parser = argparse.ArgumentParser(description="Opentrons audit server")
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

    log_config: dict[str, object] | None
    try:
        log_config = logging_utils.get_dict_config(
            args.log_level, syslog_id="opentrons-audit-server"
        )
        dictConfig(log_config)
    except Exception as e:
        # needs to be a print because logging doesn't work yet!
        print("Error: Couldn't configure logging!", file=sys.stderr)  # noqa: T201
        traceback.print_exception(e, file=sys.stderr)
        log_config = None

    uvicorn.run(
        "audit_server.app:app",
        port=args.port,
        host=args.host,
        uds=args.uds,
        reload=args.reload,
        # Note: We're redundantly telling uvicorn to apply our log_config even though we just
        # applied it ourselves with dictConfig(), above. It seems like uvicorn always applies
        # some config no matter what--it can't just leave the current config alone--so we
        # need to do this to prevent it from clobbering our config.
        log_config=log_config,
        # This log_level arg is a uvicorn-specific thing that would only affect
        # messages from uvicorn. It's superseded by our own handling of log levels
        # in our own log config, applied above.
        log_level=None,
    )
