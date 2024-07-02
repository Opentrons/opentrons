"""System resource tracker logging config."""

import logging
import logging.config


def log_init(level_value: int = logging.INFO) -> None:
    """Initialize logging for the system resource tracker."""
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            },
        },
        "handlers": {
            "console": {
                "level": level_value,
                "class": "logging.StreamHandler",
                "formatter": "standard",
            },
            "journal": {
                "level": level_value,
                "class": "systemd.journal.JournalHandler",
                "formatter": "standard",
            },
        },
        "root": {
            "handlers": ["console", "journal"],
            "level": level_value,
        },
    }

    logging.config.dictConfig(logging_config)
