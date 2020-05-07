import os
from pathlib import Path
import logging
import asyncio
import re
from typing import List, Tuple
from opentrons import HERE
from opentrons import server
from opentrons.hardware_control import API, ThreadManager
from opentrons.server.main import build_arg_parser
from argparse import ArgumentParser
from opentrons import __version__
from opentrons.config import (feature_flags as ff, name,
                              robot_configs, IS_ROBOT, ROBOT_FIRMWARE_DIR)
from opentrons.util import logging_config

try:
    from opentrons.hardware_control.socket_server\
        import run as install_hardware_server
except ImportError:
    async def install_hardware_server(sock_path, api):  # type: ignore
        log.warning("Cannot start hardware server: missing dependency")


log = logging.getLogger(__name__)

try:
    import systemd.daemon  # type: ignore
except ImportError:
    log.info("Systemd couldn't be imported, not notifying")

SMOOTHIE_HEX_RE = re.compile('smoothie-(.*).hex')


def _find_smoothie_file() -> Tuple[Path, str]:
    resources: List[Path] = []

    # Search for smoothie files in /usr/lib/firmware first then fall back to
    # value packed in wheel
    if IS_ROBOT:
        resources.extend(ROBOT_FIRMWARE_DIR.iterdir())  # type: ignore

    resources_path = Path(HERE) / 'resources'
    resources.extend(resources_path.iterdir())

    for path in resources:
        matches = SMOOTHIE_HEX_RE.search(path.name)
        if matches:
            branch_plus_ref = matches.group(1)
            return path, branch_plus_ref
    raise OSError(f"Could not find smoothie firmware file in {resources_path}")


async def initialize_robot() -> ThreadManager:
    if os.environ.get("ENABLE_VIRTUAL_SMOOTHIE"):
        log.info("Initialized robot using virtual Smoothie")
        return ThreadManager(API.build_hardware_simulator)
    packed_smoothie_fw_file, packed_smoothie_fw_ver = _find_smoothie_file()
    systemd.daemon.notify("READY=1")
    hardware = ThreadManager(API.build_hardware_controller,
                             threadmanager_nonblocking=True,
                             firmware=(packed_smoothie_fw_file,
                                       packed_smoothie_fw_ver))
    try:
        await hardware.managed_thread_ready_async()
    except RuntimeError:
        log.exception(
            'Could not build hardware controller, forcing virtual')
        return ThreadManager(API.build_hardware_simulator)

    loop = asyncio.get_event_loop()

    async def blink():
        while True:
            await hardware.set_lights(button=True)
            await asyncio.sleep(0.5)
            await hardware.set_lights(button=False)
            await asyncio.sleep(0.5)

    blink_task = loop.create_task(blink())

    if not ff.disable_home_on_boot():
        log.info("Homing Z axes")
        await hardware.home_z()

    blink_task.cancel()
    await hardware.set_lights(button=True)

    return hardware


def initialize(
        hardware_server: bool = False,
        hardware_server_socket: str = None) \
        -> ThreadManager:
    """
    Initialize the Opentrons hardware returning a hardware instance.

    :param hardware_server: Run a jsonrpc server allowing rpc to the  hardware
     controller. Only works on buildroot because extra dependencies are
     required.
    :param hardware_server_socket: Override for the hardware server socket
    """
    checked_socket = hardware_server_socket\
        or "/var/run/opentrons-hardware.sock"
    robot_conf = robot_configs.load()
    logging_config.log_init(robot_conf.log_level)

    log.info(f"API server version:  {__version__}")
    log.info(f"Robot Name: {name()}")

    loop = asyncio.get_event_loop()
    hardware = loop.run_until_complete(initialize_robot())

    if hardware_server:
        #  TODO: BC 2020-02-25 adapt hardware socket server to ThreadManager
        loop.run_until_complete(
                install_hardware_server(checked_socket,
                                        hardware))  # type: ignore

    return hardware


def run(**kwargs):  # noqa(C901)
    """
    This function was necessary to separate from main() to accommodate for
    server startup path on system 3.0, which is server.main. In the case where
    the api is on system 3.0, server.main will redirect to this function with
    an additional argument of 'patch_old_init'. kwargs are hence used to allow
    the use of different length args
    """
    hardware = initialize(bool(kwargs.get('hardware_server', False)),
                          kwargs.get('hardware_server_socket'))

    server.run(hardware,
               kwargs.get('hostname'),
               kwargs.get('port'),
               kwargs.get('path'))


def main():
    """ The main entrypoint for the Opentrons robot API server stack.

    This function
    - creates and starts the server for both the RPC routes
      handled by :py:mod:`opentrons.server.rpc` and the HTTP routes handled
      by :py:mod:`opentrons.server.http`
    - initializes the hardware interaction handled by either
      :py:mod:`opentrons.legacy_api` or :py:mod:`opentrons.hardware_control`

    This function does not return until the server is brought down.
    """

    arg_parser = ArgumentParser(
        description="Opentrons robot software",
        parents=[build_arg_parser()])
    arg_parser.add_argument(
        '--hardware-server', action='store_true',
        help='Run a jsonrpc server allowing rpc to the'
        ' hardware controller. Only works on buildroot '
        'because extra dependencies are required.')
    arg_parser.add_argument(
        '--hardware-server-socket', action='store',
        default='/var/run/opentrons-hardware.sock',
        help='Override for the hardware server socket')
    args = arg_parser.parse_args()

    run(**vars(args))
    arg_parser.exit(message="Stopped\n")


if __name__ == "__main__":
    main()
