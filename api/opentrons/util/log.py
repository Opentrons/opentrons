import logging
from logging.config import dictConfig

from opentrons.util import environment


LOG_FILENAME = environment.get_path('LOG_FILE')
SERIAL_LOG_FILENAME = environment.get_path('SERIAL_LOG_FILE')

logging_config = dict(
    version=1,
    formatters={
        'basic': {
            'format': '%(asctime)s %(name)s %(levelname)s [Line %(lineno)s]     %(message)s'  # noqa: E501
        }
    },
    handlers={
        'debug': {
            'class': 'logging.StreamHandler',
            'formatter': 'basic',
            'level': logging.DEBUG},
        'development': {
            'class': 'logging.StreamHandler',
            'formatter': 'basic',
            'level': logging.WARNING},
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'basic',
            'filename': LOG_FILENAME,
            'maxBytes': 5000000,
            'level': logging.INFO,
            'backupCount': 3
        },
        'serial': {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'basic',
            'filename': SERIAL_LOG_FILENAME,
            'maxBytes': 5000000,
            'level': logging.DEBUG,
            'backupCount': 3
        }
    },
    root={
        'handlers': ['file'],
        'level': logging.DEBUG
    },
    loggers={
        'opentrons.drivers.smoothie_drivers.serial_communication': {
            'handlers': ['serial'],
            'level': logging.DEBUG
        }
    }
)

dictConfig(logging_config)


def get_logger(name=None):
    return logging.getLogger(name)
