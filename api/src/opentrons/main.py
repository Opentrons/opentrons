import os
from pathlib import Path
import logging
import asyncio
import re
from opentrons import HERE
from opentrons.hardware_control import API, ThreadManager
from opentrons import __version__
from opentrons.config import (feature_flags as ff, name,
                              robot_configs, IS_ROBOT, ROBOT_FIRMWARE_DIR)
from opentrons.util import logging_config
from opentrons.drivers.smoothie_drivers.driver_3_0 import SmoothieDriver_3_0_0

try:
    from opentrons.hardware_control.socket_server\
        import run as install_hardware_server
except ImportError:
    async def install_hardware_server(sock_path, api):  # type: ignore
        log.warning("Cannot start hardware server: missing dependency")


log = logging.getLogger(__name__)

SMOOTHIE_HEX_RE = re.compile('smoothie-(.*).hex')


def _find_smoothie_file():

    resources = []

    # Search for smoothie files in /usr/lib/firmware first then fall back to
    # value packed in wheel
    if IS_ROBOT:
        resources.extend(ROBOT_FIRMWARE_DIR.iterdir())

    resources_path = Path(HERE) / 'resources'
    resources.extend(resources_path.iterdir())

    for path in resources:
        matches = SMOOTHIE_HEX_RE.search(path.name)
        if matches:
            branch_plus_ref = matches.group(1)
            return path, branch_plus_ref
    raise OSError(f"Could not find smoothie firmware file in {resources_path}")


async def _do_fw_update(new_fw_path, new_fw_ver):
    """ Update the connected smoothie board, with retries

    When the API server boots, it talks to the motor controller board for the
    first time. Sometimes the board is in a bad state - it might have the
    wrong firmware version (i.e. this is the first boot after an update), or it
    might just not be communicating correctly. Sometimes, the motor controller
    not communicating correctly in fact means it needs a firmware update; other
    times, it might mean it just needs to be reset.

    This function is called when the API server boots if either of the above
    cases happens. Its job is to make the motor controller board ready by
    updating its firmware, regardless of the state of the rest of the stack.

    To that end, this function uses the smoothie driver directly (so it can
    ignore the rest of the stack) and has a couple retries with different
    hardware line changes in between (so it can catch all failure modes). If
    this method ultimately fails, it lets the server boot by telling it to
    consider itself virtual.

    After this function has completed, it is always safe to call
    hardware.connect() - it just might be virtual
    """
    explicit_modeset = False
    driver = SmoothieDriver_3_0_0(robot_configs.load())
    for attempts in range(3):
        try:
            await driver.update_firmware(
                new_fw_path,
                explicit_modeset=explicit_modeset)
        except RuntimeError:
            explicit_modeset = True
            continue

        if driver.get_fw_version() == new_fw_ver:
            log.info(f"Smoothie fw update complete in {attempts} tries")
            break
        else:
            log.error(
                "Failed to update smoothie: did not connect after update")
    else:
        log.error("Could not update smoothie, forcing virtual")
        os.environ['ENABLE_VIRTUAL_SMOOTHIE'] = 'true'


async def initialize_robot() -> ThreadManager:
    packed_smoothie_fw_file, packed_smoothie_fw_ver = _find_smoothie_file()
    if os.environ.get("ENABLE_VIRTUAL_SMOOTHIE"):
        log.info("Initialized robot using virtual Smoothie")
        return ThreadManager(API.build_hardware_simulator)

    try:
        hardware = ThreadManager(API.build_hardware_controller)
    except Exception as e:
        # The most common reason for this exception (aside from hardware
        # failures such as a disconnected smoothie) is that the smoothie
        # is in programming mode. If it is, then we still want to update
        # it (so it can boot again), but we don’t have to do the GPIO
        # manipulations that _put_ it in programming mode
        log.exception("Error while connecting to motor driver: {}".format(e))
        fw_version = None
    else:
        fw_version = await hardware.fw_version
        hardware.clean_up()

    log.info(f"Smoothie FW version: {fw_version}")
    if fw_version != packed_smoothie_fw_ver:
        log.info(f"Executing smoothie update: current vers {fw_version},"
                 f" packed vers {packed_smoothie_fw_ver}")
        await _do_fw_update(packed_smoothie_fw_file, packed_smoothie_fw_ver)
    else:
        log.info(f"FW version OK: {packed_smoothie_fw_ver}")
    return ThreadManager(API.build_hardware_controller)


def initialize(
        hardware_server: bool = False,
        hardware_server_socket: str = "/var/run/opentrons-hardware.sock") \
        -> ThreadManager:
    """
    Initialize the Opentrons hardware returning a hardware instance.

    :param hardware_server: Run a jsonrpc server allowing rpc to the  hardware
     controller. Only works on buildroot because extra dependencies are
     required.
    :param hardware_server_socket: Override for the hardware server socket
    """
    robot_conf = robot_configs.load()
    logging_config.log_init(robot_conf.log_level)

    log.info(f"API server version:  {__version__}")
    log.info(f"Robot Name: {name()}")

    loop = asyncio.get_event_loop()
    hardware = loop.run_until_complete(initialize_robot())

    if not ff.disable_home_on_boot():
        log.info("Homing Z axes")
        loop.run_until_complete(hardware.home_z())

    if hardware_server:
        #  TODO: BC 2020-02-25 adapt hardware socket server to ThreadManager
        loop.run_until_complete(
                install_hardware_server(hardware_server_socket,
                                        hardware))

    return hardware
