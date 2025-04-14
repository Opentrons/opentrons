import logging
from logging.config import dictConfig
from logging.handlers import QueueHandler, QueueListener
import sys
from typing import Any, Dict, cast
from typing_extensions import override

from opentrons.config import CONFIG, ARCHITECTURE, SystemArchitecture

if ARCHITECTURE is SystemArchitecture.YOCTO:
    from opentrons_hardware.sensors import SENSOR_LOG_NAME
else:
    # we don't use the sensor log on ot2 or host
    SENSOR_LOG_NAME = "unused"


from queue import Queue

# Note that this is an unbounded queue. Ideally, it would be bounded just big enough to
# smooth over any temporary stalls in journald's ability to consume our messages.
# Unfortunately, QueueHandler uses `queue.put_nowait()`, which would raise an exception
# out of our log.debug() etc. statements when the queue gets full. We'd ideally have some
# custom version of QueueHandler that handles that uses `queue.put()` or drops the message.
# log_queue = SimpleQueue[object]()
"""
This should usually not be used directly. It's exposed so that consumers of this package
that configure their own logging (i.e. robot-server) can inject their messages into
the same queue and
library
"""


log_queue = Queue[logging.LogRecord]()


def _host_config(level_value: int) -> Dict[str, Any]:
    serial_log_filename = CONFIG["serial_log_file"]
    api_log_filename = CONFIG["api_log_file"]
    sensor_log_filename = CONFIG["sensor_log_file"]
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
                "class": "logging.handlers.RotatingFileHandler",  # NOTE
                "formatter": "basic",
                "filename": serial_log_filename,
                "maxBytes": 1000000,
                "level": logging.DEBUG,
                "backupCount": 3,
            },
            "api": {
                "class": "logging.handlers.RotatingFileHandler",  # NOTE
                "formatter": "basic",
                "filename": api_log_filename,
                "maxBytes": 1000000,
                "level": logging.DEBUG,
                "backupCount": 5,
            },
            "sensor": {
                "class": "logging.handlers.RotatingFileHandler",  # NOTE
                "formatter": "basic",
                "filename": sensor_log_filename,
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
            SENSOR_LOG_NAME: {
                "handlers": ["sensor"],
                "level": logging.DEBUG,
                "propagate": False,
            },
            "__main__": {"handlers": ["api"], "level": level_value},
        },
    }


def _robot_config(level_value: int) -> Dict[str, Any]:
    sensor_log_filename = CONFIG["sensor_log_file"]
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "message_only": {"format": "%(message)s"},
        },
        "handlers": {
            "api": {
                "class": "opentrons.util.logging_queue_handler.CustomQueueHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
                "extra": {"SYSLOG_IDENTIFIER": "opentrons-api"},
                "queue": log_queue,
            },
            "serial": {
                "class": "opentrons.util.logging_queue_handler.CustomQueueHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
                "extra": {"SYSLOG_IDENTIFIER": "opentrons-api-serial"},
                "queue": log_queue,
            },
            "can_serial": {
                "class": "opentrons.util.logging_queue_handler.CustomQueueHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
                "extra": {"SYSLOG_IDENTIFIER": "opentrons-api-serial-can"},
                "queue": log_queue,
            },
            "usbbin_serial": {
                "class": "opentrons.util.logging_queue_handler.CustomQueueHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
                "extra": {"SYSLOG_IDENTIFIER": "opentrons-api-serial-usbbin"},
                "queue": log_queue,
            },
            # TODO
            "sensor": {
                "class": "logging.handlers.RotatingFileHandler",  # NOTE
                "formatter": "message_only",
                "filename": sensor_log_filename,
                "maxBytes": 1000000,
                "level": logging.DEBUG,
                "backupCount": 3,
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
                "handlers": ["can_serial"],
                "level": logging.DEBUG,
                "propagate": False,
            },
            "opentrons_hardware.drivers.binary_usb.bin_serial": {
                "handlers": ["usbbin_serial"],
                "level": logging.DEBUG,
                "propagate": False,
            },
            SENSOR_LOG_NAME: {
                "handlers": ["sensor"],
                "level": logging.DEBUG,
                "propagate": False,
            },
            "__main__": {"handlers": ["api"], "level": level_value},
        },
    }


def _config(arch: SystemArchitecture, level_value: int) -> Dict[str, Any]:
    return {
        SystemArchitecture.YOCTO: _robot_config,
        SystemArchitecture.BUILDROOT: _robot_config,
        SystemArchitecture.HOST: _host_config,
    }[arch](level_value)


def log_init(level_name: str) -> None:
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

    # todo(mm, 2025-04-14): Use logging.getLevelNamesMapping() when we have Python >=3.11.
    level_value = logging._nameToLevel[ot_log_level]

    logging_config = _config(ARCHITECTURE, level_value)

    # TODO
    if ARCHITECTURE != SystemArchitecture.HOST:
        # Conditional import: we only want to use systemd when we're on a robot.
        from systemd.journal import JournalHandler  # type: ignore

        global _journal_shoveler
        _journal_shoveler = QueueListener(log_queue, JournalHandler())
        _journal_shoveler.start()

    dictConfig(logging_config)


_journal_shoveler: QueueListener | None = None
