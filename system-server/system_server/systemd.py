"""Systemd bindings with fallbacks for test."""

import logging.config
from typing import Dict, Union

try:
    # systemd journal is available, we can use its handler
    import systemd.journal
    import systemd.daemon

    def log_handler(topic_name: str, log_level: int) -> Dict[str, Union[int, str]]:
        """Initialize log handler."""
        return {
            "class": "systemd.journal.JournalHandler",
            "formatter": "message_only",
            "level": log_level,
            "SYSLOG_IDENTIFIER": topic_name,
        }

    # By using sd_notify
    # (https://www.freedesktop.org/software/systemd/man/sd_notify.html)
    # and type=notify in the unit file, we can prevent systemd from starting
    # dependent services until we actually say we're ready. By calling this
    # after we change the hostname, we make anything with an After= on us
    # be guaranteed to see the correct hostname
    def notify_up() -> None:
        """Notify systemd that the service is up."""
        systemd.daemon.notify("READY=1")

    SOURCE: str = "systemd"

except ImportError:
    # systemd journal isn't available, probably running tests

    def log_handler(topic_name: str, log_level: int) -> Dict[str, Union[int, str]]:
        """Initialize log handler."""
        return {
            "class": "logging.StreamHandler",
            "formatter": "basic",
            "level": log_level,
        }

    def notify_up() -> None:
        """Notify systemd that the service is up."""
        pass

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


__all__ = ["notify_up", "configure_logging"]
