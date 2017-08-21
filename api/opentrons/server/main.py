#!/usr/bin/env python

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


def main():
    kwargs = {}
    # TODO(artyom, 08/11/2017)
    # Refactor this into regex and proper use of
    # command line argument parsing
    if (len(sys.argv) == 2):
        try:
            address = sys.argv[1].split(':')
            host, port, *_ = tuple(address + [])
            # Check that our IP address is 4 octets in 0..255 range each
            octets = list(filter(
                lambda v: 0 <= v <= 255,
                [int(octet) for octet in host.split('.')]))
            if len(octets) != 4:
                raise ValueError('Invalid octets: {0}'.format(octets))
            kwargs = {'host': host, 'port': int(port)}
        except Exception as e:
            log.debug('While parsing IP address: {0}'.format(e))
            print('Invalid address {0}.'.format(sys.argv[1]))
            exit(1)
    elif (len(sys.argv) > 2):
        print('Too many arguments. Valid argument is IP:PORT')
        exit(1)

    server = Server(RobotContainer(), **kwargs)
    print(
        'Started Opentrons API RPC Server listening at ws://{0}:{1}/'
        .format(server.host, server.port))
    server.start()


if __name__ == "__main__":
    main()
