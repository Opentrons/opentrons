import logging
from logging.config import dictConfig
from opentrons.config import IS_ROBOT


def init_logging(level: int):
    """Initialize logging"""
    if IS_ROBOT:
        c = _robot_log_config(level)
    else:
        c = _dev_log_config(level)
    dictConfig(c)


def _robot_log_config(log_level: int):
    """Logging configuration for robot deployment"""
    return  {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'message_only': {
                'format': '%(message)s'
            },
        },
        'handlers': {
            'robot_server': {
                'class': 'systemd.journal.JournalHandler',
                'level': logging.DEBUG,
                'formatter': 'message_only',
                'SYSLOG_IDENTIFIER': 'opentrons-api',
            }
        },
        'loggers': {
            'robot_server': {
                'handlers': ['robot_server'],
                'level': log_level,
                'propagate': False
            },
            'uvicorn': {
                'handlers': ['robot_server'],
                'level': log_level,
                'propagate': False
            },
        }
    }


def _dev_log_config(log_level: int):
    """Logging configuration for local dev deployment"""
    return {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'basic': {
                'format': '%(asctime)s %(name)s %(levelname)s [Line %(lineno)s] %(message)s'  # noqa: E501
            },
        },
        'handlers': {
            'robot_server': {
                'class': 'logging.StreamHandler',
                'level': logging.DEBUG,
                'formatter': 'basic',
            }
        },
        'loggers': {
            'robot_server': {
                'handlers': ['robot_server'],
                'level': log_level,
                'propagate': False
            },
            'uvicorn': {
                'handlers': ['robot_server'],
                'level': log_level,
                'propagate': False
            },
        }
    }
