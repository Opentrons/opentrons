"""Entrypoint for the USB-TCP bridge application."""

import logging
import sys
import traceback
from logging.config import dictConfig

import uvicorn

from server_utils import logging_utils
from server_utils.systemd_utils import notify_up

from .cli import build_root_parser

LOG = logging.getLogger(__name__)


if __name__ == "__main__":
    args = build_root_parser().parse_args()
    log_level = logging.getLevelNamesMapping()[args.log_level.upper()]

    log_config: dict[str, object] | None
    try:
        log_config = logging_utils.get_dict_config(
            log_level, syslog_id="opentrons-system-server"
        )
        dictConfig(log_config)
    except Exception as e:
        # needs to be a print because logging doesn't work yet!
        print("Error: Couldn't configure logging!", file=sys.stderr)  # noqa: T201
        traceback.print_exception(e, file=sys.stderr)
        log_config = None

    LOG.info(f"Starting system server on {args.host}:{args.port}")
    notify_up()
    uvicorn.run(
        app="system_server:app",
        host=args.host,
        port=args.port,
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
