#!/usr/bin/env python

import re
import sys
import logging
from opentrons.api import MainRouter
from opentrons.server.rpc import Server
from logging.config import dictConfig


log = logging.getLogger(__name__)


def parse_address(address):
    match = re.fullmatch(
        '^(\d+)\.(\d+)\.(\d+)\.(\d+)(:(?P<port>\d+))?$', address)
    if not match:
        raise ValueError('Expected format ip[:port]. Example: 127.0.0.1:31950')

    octets = [o for o in match.groups()[0:4] if 0 <= int(o) <= 255]
    if len(octets) != 4:
        raise ValueError('Expected octets to be between 0 and 255')

    port = match.groupdict().get('port', None)
    if port:
        port = int(port)
    return ('.'.join(octets), port)


def parse_command_line(argv):
    try:
        address = '127.0.0.1:31950' if len(argv) != 2 else argv[1]
    except Exception as e:
        raise Exception('Invalid address: {0} ({1})'.format(address, str(e)))

    return parse_address(address)


def log_init():
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


if __name__ == "__main__":
    log_init()
    try:
        host, port = parse_command_line(sys.argv)
    except Exception as e:
        print(str(e))
        exit(1)

    # TODO(artyom, 20170828): consider moving class name definition into
    # command line arguments, so one could us as a shell starting various
    # RPC servers with different root objects from a command line
    server = Server(MainRouter())
    print(
        'Started Opentrons API Server listening at ws://{host}:{port}/'
        .format(host=host, port=port))
    server.start(host, port)
