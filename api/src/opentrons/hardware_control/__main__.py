""" Entrypoint for the OT2 hardware control server

This server listens on a variety of different interfaces and runs a hardware
controller. It is the only thing that is allowed to talk to the OT2's hardware,
including the smoothie, the camera, and the various GPIO interfaces.

This server can only be run on a system with a connected smoothie board, and
_should_ only be run on an OT-2.
"""

import argparse
import asyncio
import logging
from typing import Optional, Dict, Any

from . import API
from .types import HardwareFeatureFlags
from opentrons.config import robot_configs as rc
from opentrons.config.types import RobotConfig

LOG = logging.getLogger("opentrons.hardware_control.__main__")


def exception_handler(loop: asyncio.AbstractEventLoop, context: Dict[str, Any]) -> None:
    message = ""
    if "exception" in context:
        message += f'exception: {repr(context["exception"])}'
    if "future" in context:
        message += f' while running future {repr(context["future"])}'
    if "protocol" in context:
        message += f' from protocol {repr(context["protocol"])}'
    if "transport" in context:
        message += f' from transport {repr(context["transport"])}'
    if "socket" in context:
        message += f' from socket {repr(context["socket"])}'
    LOG.error(f"Unhandled exception in event loop: {message}")
    loop.default_exception_handler(context)


async def arun(
    config: Optional[RobotConfig] = None, port: Optional[str] = None
) -> None:
    """Asynchronous entrypoint for the server

    :param config: Optional config override
    :param port: Optional smoothie port override
    """
    rconf = config or rc.load()
    hc = await API.build_hardware_controller(  # noqa: F841
        config=rconf, port=port, feature_flags=HardwareFeatureFlags.build_from_ff()
    )


def run(config: Optional[RobotConfig] = None, port: Optional[str] = None) -> None:
    """Synchronous entrypoint for the server.

    Mostly builds a loop and calls arun.

    :param config: Optional config override
    :param port: Optional Smoothie port override
    """
    loop = asyncio.get_event_loop()
    loop.set_exception_handler(exception_handler)
    loop.run_until_complete(arun(config, port))
    loop.run_forever()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Opentrons hardware control server")
    parser.add_argument(
        "-s",
        "--smoothie-port",
        help="Port on which to talk to smoothie, autodetected by default",
        default=None,
    )
    args = parser.parse_args()
    run(port=args.port)
