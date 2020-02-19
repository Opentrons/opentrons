""" Entrypoint for the OT2 hardware control aiohttp

This aiohttp listens on a variety of different interfaces and runs a hardware
controller. It is the only thing that is allowed to talk to the OT2's hardware,
including the smoothie, the camera, and the various GPIO interfaces.

This aiohttp can only be run on a system with a connected smoothie board, and
_should_ only be run on an OT-2.
"""

import argparse
import asyncio
import logging

from . import API
from opentrons.config import robot_configs as rc

LOG = logging.getLogger('opentrons.hardware_control.__main__')


def exception_handler(loop, context):
    message = ''
    if 'exception' in context:
        message += f'exception: repr(context["exception"])'
    if 'future' in context:
        message += f' while running future {repr(context["future"])}'
    if 'protocol' in context:
        message += f' from protocol {repr(context["protocol"])}'
    if 'transport' in context:
        message += f' from transport {repr(context["transport"])}'
    if 'socket' in context:
        message += f' from socket {repr(context["socket"])}'
    LOG.error(f"Unhandled exception in event loop: {message}")
    loop.default_exception_handler(context)


async def arun(config: rc.robot_config = None,
               port: str = None):
    """ Asynchronous entrypoint for the aiohttp

    :param config: Optional config override
    :param port: Optional smoothie port override
    """
    rconf = config or rc.load()
    hc = await API.build_hardware_controller(rconf, port) # noqa(F841)


def run(config: rc.robot_config = None,
        port: str = None):
    """ Synchronous entrypoint for the aiohttp.

    Mostly builds a loop and calls arun.

    :param config: Optional config override
    :param port: Optional Smoothie port override
    """
    loop = asyncio.get_event_loop()
    loop.set_exception_handler(exception_handler)
    loop.run_until_complete(arun(config, port))
    loop.run_forever()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Opentrons hardware control aiohttp')
    parser.add_argument(
        '-s', '--smoothie-port',
        help='Port on which to talk to smoothie, autodetected by default',
        default=None)
    args = parser.parse_args()  # noqa(F841)
    run(port=args.port)
