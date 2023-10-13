import sys
import logging

from dataclasses import dataclass
from logging.config import dictConfig
from typing import Any, Dict, Optional
from typing_extensions import TypedDict
from pydantic import BaseSettings

from ..constants import PackageName
from ..config import IS_ROBOT


class _LogBelow:
    def __init__(self, level: int) -> None:
        self._log_below_level = level

    def __call__(self, record: logging.LogRecord) -> bool:
        return record.levelno < self._log_below_level


def _host_config(settings: BaseSettings, level_value: int) -> Dict[str, Any]:
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "basic": {
                "format": (
                    "%(asctime)s %(name)s %(levelname)s [Line %(lineno)s] %(message)s"
                )
            }
        },
        "handlers": {
            "debug": {
                "class": "logging.StreamHandler",
                "formatter": "basic",
                "level": level_value,
            },
            "serial": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "basic",
                "filename": "api_serial_log_file",
                "maxBytes": 5000000,
                "level": logging.DEBUG,
                "backupCount": 3,
            },
            "api": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "basic",
                "filename": "api_log_file",
                "maxBytes": 1000000,
                "level": logging.DEBUG,
                "backupCount": 5,
            },
        },
        "loggers": {
            "opentrons": {
                "handlers": ["debug", "api"],
                "level": level_value,
            },
            "opentrons.deck_calibration": {
                "handlers": ["debug", "api"],
                "level": level_value,
            },
            "opentrons.drivers.asyncio.communication.serial_connection": {
                "handlers": ["serial"],
                "level": logging.DEBUG,
                "propagate": False,
            },
            "opentrons_hardware.drivers.can_bus.can_messenger": {
                "handlers": ["serial"],
                "level": logging.DEBUG,
                "propagate": False,
            },
            "opentrons_hardware.drivers.binary_usb.bin_serial": {
                "handlers": ["serial"],
                "level": logging.DEBUG,
                "propagate": False,
            },
            "__main__": {"handlers": ["api"], "level": level_value},
        },
    }


def _robot_server_config(log_level: int) -> Dict[str, Any]:
    """Logging configuration for the robot_server."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "message_only": {"format": "%(message)s"},
        },
        "filters": {"records_below_warning": {"()": _LogBelow, "level": logging.WARN}},
        "handlers": {
            "unit_only": {
                "class": "systemd.journal.JournalHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
            },
            "syslog_plus_unit": {
                "class": "systemd.journal.JournalHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
                "SYSLOG_IDENTIFIER": "uvicorn",
            },
            "syslog_plus_unit_above_warn": {
                "class": "systemd.journal.JournalHandler",
                "level": logging.WARN,
                "formatter": "message_only",
                "SYSLOG_IDENTIFIER": "uvicorn",
            },
            "unit_only_below_warn": {
                "class": "systemd.journal.JournalHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
                "filters": ["records_below_warning"],
                "SYSLOG_IDENTIFIER": "uvicorn",
            },
        },
        "loggers": {
            "robot_server": {
                "handlers": ["syslog_plus_unit"],
                "level": log_level,
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["syslog_plus_unit"],
                "level": log_level,
                "propagate": False,
            },
            "uvicorn": {
                "handlers": ["syslog_plus_unit"],
                "level": log_level,
                "propagate": False,
            },
            "fastapi": {
                "handlers": ["syslog_plus_unit"],
                "level": log_level,
                "propagate": False,
            },
            "starlette": {
                "handlers": ["syslog_plus_unit"],
                "level": log_level,
                "propagate": False,
            },
            "sqlalchemy": {
                "handlers": ["syslog_plus_unit_above_warn", "unit_only_below_warn"],
                # SQLAlchemy's logging is slightly unusual:
                # they set up their logger with a default level of WARN by itself,
                # so even if we enabled propagation, we'd have to override the level
                # to see things below WARN.
                # docs.sqlalchemy.org/en/14/core/engines.html#configuring-logging
                "level": log_level,
                "propagate": False,
            },
        },
    }


def _system_server_config(log_level: int) -> Dict[str, Any]:
    """Logging configuration for the system_server."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "basic": {"format": "%(name)s %(levelname)s %(message)s"},
            "message_only": {"format": "%(message)s"},
        },
        "filters": {"records_below_warning": {"()": _LogBelow, "level": logging.WARN}},
        "handlers": {
            "journald": {
                "class": "systemd.journal.JournalHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
                "SYSLOG_IDENTIFIER": "opentrons-system-server",
            },
        },
        "loggers": {
            "system_server": {
                "handlers": ["journald"],
                "level": log_level,
                "propagate": False,
            },
            "__main__": {
                "handlers": ["journald"],
                "level": log_level,
                "propagate": False,
            },
        },
        "root": {"handlers": ["journald"], "level": level}
    }


def _update_server_config(log_level: int) -> Dict[str, Any]:
    """Logging configuration for the update_server."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "basic": {"format": "%(name)s %(levelname)s %(message)s"},
            "message_only": {"format": "%(message)s"},
        },
        "handlers": {
            "journald": {
                "class": "systemd.journal.JournalHandler",
                "level": log_level,
                "formatter": "message_only",
                "SYSLOG_IDENTIFIER": "opentrons-update",
            },
        },
        "loggers": {
            "otupdate": {
                "handlers": ["journald"],
                "level": log_level,
                "propagate": False,
            },
            "__main__": {
                "handlers": ["journald"],
                "level": log_level,
                "propagate": False,
            },
        },
        "root": {"handlers": ["journald"], "level": level},
    }


def _hardware_server_config(level_value: int) -> Dict[str, Any]:
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "message_only": {"format": "%(message)s"},
        },
        "handlers": {
            "api": {
                "class": "systemd.journal.JournalHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
                "SYSLOG_IDENTIFIER": "opentrons-api",
            },
            "serial": {
                "class": "systemd.journal.JournalHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
                "SYSLOG_IDENTIFIER": "opentrons-api-serial",
            },
        },
        "loggers": {
            "opentrons.drivers.asyncio.communication.serial_connection": {
                "handlers": ["serial"],
                "level": logging.DEBUG,
                "propagate": False,
            },
            "opentrons": {
                "handlers": ["api"],
                "level": level_value,
            },
            "opentrons_hardware": {
                "handlers": ["api"],
                "level": level_value,
            },
            "opentrons_hardware.drivers.can_bus.can_messenger": {
                "handlers": ["serial"],
                "level": logging.DEBUG,
                "propagate": False,
            },
            "opentrons_hardware.drivers.binary_usb.bin_serial": {
                "handlers": ["serial"],
                "level": logging.DEBUG,
                "propagate": False,
            },
            "__main__": {"handlers": ["api"], "level": level_value},
        },
    }


def _ot3usb_config(log_level: int) -> Dict[str, Any]:
    """Logging configuration for the ot3usb bridge."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "basic": {"format": "%(name)s %(levelname)s %(message)s"},
            "message_only": {"format": "%(message)s"},
        },
        "handlers": {
            "journald": {
                "class": "systemd.journal.JournalHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
                "SYSLOG_IDENTIFIER": "ot3usb",
            },
        },
        "loggers": {
            "ot3usb": {
                "handlers": ["journald"],
                "level": log_level,
                "propagate": False,
            },
        },
        "root": {"handlers": ["journald"], "level": level},
    }


def _config(package: PackageName, log_level: int, settings: BaseSettings) -> Dict[str, Any]:
    settings = settings or BaseSettings()
    if IS_ROBOT:
        return {
            PackageName.ROBOT_SERVER: _robot_server_config,
            PackageName.SYSTEM_SERVER: _system_server_config,
            PackageName.UPDATE_SERVER: _update_server_config,
            PackageName.HARDWARE_SERVER: _hardware_server_config,
            PackageName.OT3USBBridge: _ot3usb_config,
        }[package](log_level)
    return _host_config(settings, log_level)


def log_init(package: PackageName, level_name: str, settings: Optional[BaseSettings] = None) -> None:
    """
    Function that sets log levels and format strings. Checks for the
    OT_API_LOG_LEVEL environment variable otherwise defaults to INFO
    """
    fallback_log_level = "INFO"
    ot_log_level = level_name.upper()
    if ot_log_level not in logging._nameToLevel:
        sys.stderr.write(
            f"OT Log Level {ot_log_level} not found. "
            f"Defaulting to {fallback_log_level}\n"
        )
        ot_log_level = fallback_log_level
    level_value = logging._nameToLevel[ot_log_level]
    logging_config = _config(package, level_value, settings)
    dictConfig(logging_config)
