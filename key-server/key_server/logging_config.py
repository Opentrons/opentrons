"""Logging configuration."""

import logging.config


def configure_logging(level: int) -> None:
    """Configure logging and set hostname."""
    config = {
        "version": 1,
        "formatters": {
            "basic": {"format": "%(name)s %(levelname)s %(message)s"},
        },
        "handlers": {
            "mainsink": {
                "class": "logging.StreamHandler",
                "formatter": "basic",
                "level": level,
            }
        },
        "loggers": {
            "key_server": {
                "handlers": ["mainsink"],
                "level": level,
                "propagate": False,
            },
            "__main__": {
                "handlers": ["mainsink"],
                "level": level,
                "propagate": False,
            },
        },
        "root": {"handlers": ["mainsink"], "level": level},
    }
    logging.config.dictConfig(config)


__all__ = ["configure_logging"]
