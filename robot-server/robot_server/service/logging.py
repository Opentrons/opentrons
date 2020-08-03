import logging
from logging.config import dictConfig
from opentrons.config import IS_ROBOT, robot_configs


def initialize_logging():
    """Initialize logging"""
    # TODO Amit 2019/04/08 Move the logging level from robot configs to
    #  robot server mutable configs.
    robot_conf = robot_configs.load()
    level = logging._nameToLevel.get(robot_conf.log_level.upper(),
                                     logging.INFO)
    if IS_ROBOT:
        c = _robot_log_config(level)
    else:
        c = _dev_log_config(level)
    dictConfig(c)


def _robot_log_config(log_level: int):
    """Logging configuration for robot deployment"""
    return {
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
            'uvicorn.error': {
                'handlers': ['robot_server'],
                'level': log_level,
                'propagate': False
            },
            'fastapi': {
                'handlers': ['robot_server'],
                'level': log_level,
                'propagate': False
            },
            'starlette':  {
                'handlers': ['robot_server'],
                'level': log_level,
                'propagate': False,
            }
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
