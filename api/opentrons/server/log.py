import logging
from logging.config import dictConfig
import os
from opentrons import util

LOG_FILE_DIR = util.environment.get_path('LOG_DIR')

logging_config = dict(
    version=1,
    formatters={
        'basic': {
            'format': '%(asctime)s %(name)s %(levelname)s [Line %(lineno)s]     %(message)s'  #NOQA
        }
    },
    handlers={
        'debug': {
            'class': 'logging.StreamHandler',
            'formatter': 'basic',
        },
        'null': {
            'class': 'logging.NullHandler',
        },
        'opentrons-app': {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'basic',
            'filename': os.path.join(LOG_FILE_DIR, 'opentrons-app.log'),
            'maxBytes': 5000000,
            'backupCount': 3
        },
        'socketio': {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'basic',
            'filename': os.path.join(LOG_FILE_DIR, 'socketio.log'),
            'maxBytes': 5000000,
            'backupCount': 3
        },
        'opentrons': {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'basic',
            'filename': os.path.join(LOG_FILE_DIR, 'opentrons.log'),
            'maxBytes': 5000000,
            'backupCount': 3
        },
    },
    loggers={
        'opentrons-app': {
            'handlers': ['opentrons-app'],
            'level': logging.DEBUG,
        },
        # 'socketio': {
        #  'handlers': ['socketio'],
        #  'level': logging.INFO,
        # },
        'opentrons': {
            'handlers': ['opentrons'],
            'level': logging.DEBUG,
        },
    },
    # Used to override root logger in opentrons-api
    root={
        'handlers': ['opentrons-app'],
        'level': logging.ERROR,
    }
)

dictConfig(logging_config)
