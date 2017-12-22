#!/usr/bin/env python

import sys
import logging
import os
from aiohttp import web
from opentrons.api import MainRouter
from opentrons.server.rpc import Server
from logging.config import dictConfig


log = logging.getLogger(__name__)


def log_init():
    """
    Function that sets log levels and format strings. Checks for the
    OT_LOG_LEVEL environment variable otherwise defaults to DEBUG.
    :return:
    """
    # TODO(artyom): might as well use this:
    # https://pypi.python.org/pypi/logging-color-formatter

    # TODO (Laura 20171222): Elevate default to INFO or WARN for production
    default_log_level = 'DEBUG'
    ot_log_level = os.environ.get('OT_LOG_LEVEL', default_log_level)
    if ot_log_level not in logging._nameToLevel:
        log.warning("OT Log Level {} not found. Defaulting to {}".format(
            ot_log_level, default_log_level))
        ot_log_level = default_log_level

    level_value = logging._nameToLevel[ot_log_level]

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
                'level': level_value
            },
            'opentrons.server': {
                'handlers': ['debug'],
                'level': level_value
            },
            'opentrons.api': {
                'handlers': ['debug'],
                'level': level_value
            },
            'opentrons.drivers.smoothie_drivers.driver_3_0': {
                'handlers': ['debug'],
                'level': level_value
            }
        }
    )
    dictConfig(logging_config)


async def health(request):
    return web.json_response(
        headers={
            'Access-Control-Allow-Origin': '*'
        })


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
