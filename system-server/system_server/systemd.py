"""Systemd bindings with fallbacks for test."""

import logging.config

try:
    # systemd journal is available, we can use its handler
    import systemd.journal  # noqa: F401

    def log_handler(topic_name: str, log_level: int) -> dict[str, int | str]:
        """Initialize log handler."""
        return {
            "class": "systemd.journal.JournalHandler",
            "formatter": "message_only",
            "level": log_level,
            "SYSLOG_IDENTIFIER": topic_name,
        }

    SOURCE: str = "systemd"

except ImportError:
    # systemd journal isn't available, probably running tests

    def log_handler(topic_name: str, log_level: int) -> dict[str, int | str]:
        """Initialize log handler."""
        return {
            "class": "logging.StreamHandler",
            "formatter": "basic",
            "level": log_level,
        }

    SOURCE = "dummy"


def configure_logging(level: int) -> None:
    """Configure logging and set hostname."""
    config = {
        "version": 1,
        "formatters": {
            "basic": {"format": "%(name)s %(levelname)s %(message)s"},
            "message_only": {"format": "%(message)s"},
        },
        "handlers": {"journald": log_handler("opentrons-system-server", level)},
        "loggers": {
            "system_server": {
                "handlers": ["journald"],
                "level": level,
                "propagate": False,
            },
            "__main__": {
                "handlers": ["journald"],
                "level": level,
                "propagate": False,
            },
        },
        "root": {"handlers": ["journald"], "level": level},
    }
    logging.config.dictConfig(config)


__all__ = ["configure_logging"]
