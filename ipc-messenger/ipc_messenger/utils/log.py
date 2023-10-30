"""Logging module for the ipc messenger."""

import logging
import logging.config


def _config(level: int, use_journal: bool) -> None:
    handler = {
        "class": 'systemd.journal.JournalHandler'
        if use_journal else 'logging.StreamHandler',
        "formatter": "basic",
        "level": level,
    }
    if use_journal:
        handler["SYSLOG_IDENTIFIER"] = "ipc-messenger"

    return {
        "version": 1,
        "formatters": {
            "basic": {"format": "%(name)s %(levelname)s %(message)s"},
            "message_only": {"format": "%(message)s"},
        },
        "handlers": {
            "journald": handler,
        },
        "loggers": {
            "ipc_messenger": {
                "handlers": ["journald"],
                "level": level,
                "propagate": False
            },
        },
        "root": {"handlers": ["journald"], "level": level},
    }


def init_logging(level_name: str) -> None:
    """Configure the logging."""
    level = logging._nameToLevel[level_name]

    # check if we are using journal
    try:
        import systemd.journal
        use_journal = True
    except ModuleNotFoundError:
        use_journal = False

    config = _config(level, use_journal)
    logging.config.dictConfig(config)

__all__ = [
    "init_logging",
]
