"""Logging configuration."""

import logging
from logging.config import dictConfig
from typing import Dict, Any


def initialize_logging(production: bool) -> None:
    """Initialize logging."""
    if production:
        c = _production_log_config()
    else:
        c = _dev_log_config()
    dictConfig(c)


def _production_log_config() -> Dict[str, Any]:
    """Log configuration for robot deployment."""
    lvl = logging.INFO
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "message_only": {"format": "%(message)s"},
        },
        "handlers": {
            "notify_server": {
                "class": "systemd.journal.JournalHandler",
                "level": lvl,
                "formatter": "message_only",
                "SYSLOG_IDENTIFIER": "opentrons-notify-server",
            }
        },
        "loggers": {
            "notify_server": {
                "handlers": ["notify_server"],
                "level": lvl,
                "propagate": False,
            },
        },
        "root": {"handlers": ["notify_server"], "level": lvl},
    }


def _dev_log_config() -> Dict[str, Any]:
    """Log configuration for local dev deployment."""
    lvl = logging.DEBUG
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "basic": {
                "format": "%(asctime)s %(name)s %(levelname)s [Line %(lineno)s] %(message)s"  # noqa: E501
            },
        },
        "handlers": {
            "notify_server": {
                "class": "logging.StreamHandler",
                "level": lvl,
                "formatter": "basic",
            }
        },
        "loggers": {
            "notify_server": {
                "handlers": ["notify_server"],
                "level": lvl,
                "propagate": False,
            },
        },
        "root": {"handlers": ["notify_server"], "level": lvl},
    }
