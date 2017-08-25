#!/usr/bin/env python

import argparse
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

log = logging.getLogger(__name__)


def parse_address(address):
    error_message = 'Invalid address: {0}'.format(address)
    match = re.fullmatch(
        '^(\d+)\.(\d+)\.(\d+)\.(\d+)(:(?P<port>\d+))?$', address)
    if not match:
        raise ValueError('address')

    octets = [o for o in match.groups()[0:4] if 0 <= int(o) <= 255]
    if len(octets) != 4:
        raise ValueError('address')

    port = match.groupdict().get('port', None)
    if port:
        port = int(port)
    return ('.'.join(octets), port)


def parse_command_line(argv):
    try:
        address = '127.0.0.1:31950' if len(argv) != 2 else argv[1]
    except:
        raise Exception('Invalid address: {0}'.format(address))

    return parse_address(address)


if __name__ == "__main__":
    try:
        host, port = parse_command_line(sys.argv)
    except Exception as e:
        print(str(e))
        exit(code)

    server = Server(RobotContainer())
    print(
        'Started Opentrons API Server listening at ws://{host}:{port}/'
        .format(host=host, port=port))
    server.start(host, port)

