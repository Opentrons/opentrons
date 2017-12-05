#!/usr/bin/env python

import sys
import logging
from aiohttp import web
from opentrons.api import MainRouter
from opentrons.server.rpc import Server
from logging.config import dictConfig


log = logging.getLogger(__name__)


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
                'level': logging.INFO
            },
            'opentrons.api': {
                'handlers': ['debug'],
                'level': logging.DEBUG
            }
        }
    )
    dictConfig(logging_config)


async def health(request):
    return web.Response()


# Support for running using aiohttp CLI.
# See: https://docs.aiohttp.org/en/stable/web.html#command-line-interface-cli  # NOQA
def init(argv):
    log_init()
    server = Server(MainRouter())
    # TODO (artyom, 20171205): find a better place for health check
    # as requirements evolve
    server.app.router.add_get('/health', health)
    return server.app


if __name__ == "__main__":
    # TODO(artyom, 20170828): consider moving class name definition into
    # command line arguments, so one could us as a shell starting various
    # RPC servers with different root objects from a command line
    web.main(sys.argv[1:] + ['opentrons.server.main:init'])
