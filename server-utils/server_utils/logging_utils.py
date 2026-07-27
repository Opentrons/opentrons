"""Utilities for servers to log stuff."""

from typing import TypeAlias

_FormatterConfig: TypeAlias = dict[str, object]
_HandlerConfig: TypeAlias = dict[str, object]


_ROOT_HANDLER_KEY = "root_handler"
_ROOT_FORMATTER_KEY = "root_formatter"


def get_dict_config(log_level: str | int, syslog_id: str) -> dict[str, object]:
    """Return a logging configuration suitable for most Opentrons servers.

    On robots, this will send logs to systemd. On dev machines, this will send logs
    to the terminal, possibly colorized.

    Params:
        log_level: The minimum log level to output.
        syslog_id: On robots, the syslog identifier to use. For clean journalctl
            output, this should generally match the service name, like "opentrons-system-server".

    Returns:
        A logging configuration that can be passed to `logging.config.dictConfig()`.
    """
    root_formatter, root_handler = _get_root_formatter_and_handler_for_system(syslog_id)
    return {
        "version": 1,
        # Many modules will already have been imported and will have created their
        # loggers with logging.getLogger(). Make sure we respect them.
        "disable_existing_loggers": False,
        # Fix up 3rd-party packages to make sure their logs propagate up to our root
        # handler. Most packages don't need this.
        "loggers": {
            "uvicorn": {"propagate": True},
            "uvicorn.access": {"propagate": True},
            # sqlalchemy by default only propagates logs of level WARN and above.
            # This changes it to follow the same level filtering as everything else.
            "sqlalchemy": {"level": log_level},
        },
        "root": {
            "handlers": [_ROOT_HANDLER_KEY],
            "level": log_level,
        },
        "handlers": {_ROOT_HANDLER_KEY: root_handler},
        "formatters": {_ROOT_FORMATTER_KEY: root_formatter},
    }


def _get_root_formatter_and_handler_for_system(
    syslog_id: str,
) -> tuple[_FormatterConfig, _HandlerConfig]:
    # todo(mm, 2026-03-26): On dev machines that happen to be running systemd,
    # this will accidentally send dev server logs to systemd instead of the terminal.
    return (
        _get_systemd_formatter_and_handler(syslog_id)
        or _get_uvicorn_formatter_and_handler()
        or _get_fallback_formatter_and_handler()
    )


def _get_systemd_formatter_and_handler(
    syslog_id: str,
) -> tuple[_FormatterConfig, _HandlerConfig] | None:
    try:
        from systemd.journal import JournalHandler  # type: ignore
    except ImportError:
        return None
    formatter: _FormatterConfig = {"format": "%(message)s"}
    handler: _HandlerConfig = {
        "formatter": _ROOT_FORMATTER_KEY,
        "class": JournalHandler,
        "SYSLOG_IDENTIFIER": syslog_id,
    }
    return formatter, handler


def _get_uvicorn_formatter_and_handler() -> (
    tuple[_FormatterConfig, _HandlerConfig] | None
):
    try:
        from uvicorn.logging import DefaultFormatter as UvicornColorizedFormatter
    except ImportError:
        return None
    formatter: _FormatterConfig = {
        "()": UvicornColorizedFormatter,
        "fmt": "%(levelprefix)s %(asctime)s %(name)s %(message)s",
        # `None` lets uvicorn decide whether to use colors or not depending on whether
        # we're outputting to an interactive terminal.
        "use_colors": None,
    }
    handler: _HandlerConfig = {
        "formatter": _ROOT_FORMATTER_KEY,
        "class": "logging.StreamHandler",
    }
    return formatter, handler


def _get_fallback_formatter_and_handler() -> tuple[_FormatterConfig, _HandlerConfig]:
    formatter: _FormatterConfig = {
        "format": "%(levelname)s %(asctime)s %(name)s %(message)s"
    }
    handler: _HandlerConfig = {
        "formatter": _ROOT_FORMATTER_KEY,
        "class": "logging.StreamHandler",
    }
    return formatter, handler
