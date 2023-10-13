"""Entrypoint for the USB-TCP bridge application."""
import logging
from . import systemd
from .cli import build_root_parser
import uvicorn  # type: ignore[import]


log = logging.getLogger(__name__)


if __name__ == "__main__":
    args = build_root_parser().parse_args()
    log.info(f"Starting system server on {args.host}:{args.port}")
    systemd.notify_up()
    uvicorn.run(
        app="system_server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level=args.log_level,
    )
