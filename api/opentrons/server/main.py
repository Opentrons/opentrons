#!/usr/bin/env python

import re
import sys
import logging
from opentrons.server.rpc import Server
from opentrons.server.robot_container import RobotContainer
from logging.config import dictConfig

# TODO(artyom): might as well use this:
# https://pypi.python.org/pypi/logging-color-formatter
logging_config = dict(
    version=1,
    formatters={
        'basic': {
            'format':
            '%(asctime)s %(name)s %(levelname)s [Line %(lineno)s] %(message)s'  # noqa: E501
        }
    },
    handlers={
        'debug': {
            'class': 'logging.StreamHandler',
            'formatter': 'basic',
        }
    },
    loggers={
        '__main__': {
            'handlers': ['debug'],
            'level': logging.DEBUG
        },
        'opentrons.server': {
            'handlers': ['debug'],
            'level': logging.DEBUG
        },
    }
)
dictConfig(logging_config)
