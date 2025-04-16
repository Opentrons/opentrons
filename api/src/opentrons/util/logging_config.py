import logging
from logging.config import dictConfig
from logging.handlers import QueueListener, RotatingFileHandler
import sys
from queue import Queue

from opentrons.config import CONFIG, ARCHITECTURE, SystemArchitecture

if ARCHITECTURE is SystemArchitecture.YOCTO:
    from opentrons_hardware.sensors import SENSOR_LOG_NAME
else:
    # we don't use the sensor log on ot2 or host
    SENSOR_LOG_NAME = "unused"


# We want this big enough to smooth over any temporary stalls in journald's ability
# to consume our records--but bounded, so if we consistently outpace journald for
# some reason, we don't leak memory or get latency from buffer bloat.
# 50000 is basically an arbitrary guess.
_LOG_QUEUE_SIZE = 50000


log_queue = Queue[logging.LogRecord](maxsize=_LOG_QUEUE_SIZE)
"""A buffer through which log records will pass.

This is intended to work around problems when our logs are going to journald:
we think journald can block for a while when it flushes records to the filesystem,
and the backpressure from that will cause calls like `log.debug()` to block and
interfere with timing-sensitive hardware control.
https://github.com/Opentrons/opentrons/issues/18034

`log_init()` will configure all the logs that this package knows about to pass through
this queue. This queue is exposed so consumers of this package (i.e. robot-server)
can do the same thing with their own logs, which is important to preserve ordering.
"""


def _config_for_host(level_value: int) -> None:
    serial_log_filename = CONFIG["serial_log_file"]
    api_log_filename = CONFIG["api_log_file"]
    sensor_log_filename = CONFIG["sensor_log_file"]
    config = {
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
                "filename": serial_log_filename,
                "maxBytes": 1000000,
                "level": logging.DEBUG,
                "backupCount": 3,
            },
            "api": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "basic",
                "filename": api_log_filename,
                "maxBytes": 1000000,
                "level": logging.DEBUG,
                "backupCount": 5,
            },
            "sensor": {
                "class": "logging.handlers.RotatingFileHandler",
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

    dictConfig(config)


def _config_for_robot(level_value: int) -> None:
    # Import systemd.journald here since it is generally unavailble on non
    # linux systems and we probably don't want to use it on linux desktops
    # either
    from systemd.journal import JournalHandler  # type: ignore

    sensor_log_filename = CONFIG["sensor_log_file"]

    sensor_log_queue = Queue[logging.LogRecord](maxsize=_LOG_QUEUE_SIZE)

    config = {
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
            "sensor": {
                "class": "opentrons.util.logging_queue_handler.CustomQueueHandler",
                "level": logging.DEBUG,
                "formatter": "message_only",
                "queue": sensor_log_queue,
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

    # Start draining from the queue and sending messages to journald.
    # Then, stash the queue listener in a global variable so it doesn't get garbage-collected.
    # I don't know if we actually need to do this, but let's not find out the hard way.
    global _queue_listener
    if _queue_listener is not None:
        # In case this log init function was called multiple times for some reason.
        _queue_listener.stop()
    _queue_listener = QueueListener(log_queue, JournalHandler())
    _queue_listener.start()

    # Sensor logs are a special one-off thing that go to their own file instead of journald.
    # We apply the same QueueListener performance workaround for basically the same reasons.
    sensor_rotating_file_handler = RotatingFileHandler(
        filename=sensor_log_filename, maxBytes=1000000, backupCount=3
    )
    sensor_rotating_file_handler.setLevel(logging.DEBUG)
    sensor_rotating_file_handler.setFormatter(logging.Formatter(fmt="%(message)s"))
    global _sensor_queue_listener
    if _sensor_queue_listener is not None:
        _sensor_queue_listener.stop()
    _sensor_queue_listener = QueueListener(
        sensor_log_queue, sensor_rotating_file_handler
    )
    _sensor_queue_listener.start()

    dictConfig(config)

    # TODO(2025-04-15): We need some kind of log_deinit() function to call
    # queue_listener.stop() before the process ends. Not doing that means we're
    # dropping some records when the process shuts down.


_queue_listener: QueueListener | None = None
_sensor_queue_listener: QueueListener | None = None


def _config(arch: SystemArchitecture, level_value: int) -> None:
    {
        SystemArchitecture.YOCTO: _config_for_robot,
        SystemArchitecture.BUILDROOT: _config_for_robot,
        SystemArchitecture.HOST: _config_for_host,
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

    _config(ARCHITECTURE, level_value)
