import json
import os
import sys
from pathlib import Path
import logging
import asyncio
import re
from typing import Any, List, Tuple

from opentrons.drivers.serial_communication import get_ports_by_name
from opentrons.hardware_control import (
    API as HardwareAPI,
    ThreadManager,
    ThreadManagedHardware,
)

from opentrons.config import (
    feature_flags as ff,
    name,
    robot_configs,
    IS_ROBOT,
    ROBOT_FIRMWARE_DIR,
)
from opentrons.util import logging_config
from opentrons.protocols.types import ApiDeprecationError
from opentrons.protocols.api_support.types import APIVersion

version = sys.version_info[0:2]
if version < (3, 7):
    raise RuntimeError(
        "opentrons requires Python 3.7 or above, this is {0}.{1}".format(
            version[0], version[1]
        )
    )

HERE = os.path.abspath(os.path.dirname(__file__))

try:
    with open(os.path.join(HERE, "package.json")) as pkg:
        package_json = json.load(pkg)
        __version__ = package_json.get("version")
except (FileNotFoundError, OSError):
    __version__ = "unknown"

from opentrons import config  # noqa: E402

LEGACY_MODULES = ["robot", "reset", "instruments", "containers", "labware", "modules"]

__all__ = ["version", "HERE", "config"]


def __getattr__(attrname: str) -> None:
    """
    Prevent import of legacy modules from global to officially
    deprecate Python API Version 1.0.
    """
    if attrname in LEGACY_MODULES:
        raise ApiDeprecationError(APIVersion(1, 0))
    raise AttributeError(attrname)


def __dir__() -> List[str]:
    return sorted(__all__ + LEGACY_MODULES)


log = logging.getLogger(__name__)


SMOOTHIE_HEX_RE = re.compile("smoothie-(.*).hex")


def _find_smoothie_file() -> Tuple[Path, str]:
    resources: List[Path] = []

    # Search for smoothie files in /usr/lib/firmware first then fall back to
    # value packed in wheel
    if IS_ROBOT:
        resources.extend(ROBOT_FIRMWARE_DIR.iterdir())  # type: ignore

    resources_path = Path(HERE) / "resources"
    resources.extend(resources_path.iterdir())

    for path in resources:
        matches = SMOOTHIE_HEX_RE.search(path.name)
        if matches:
            branch_plus_ref = matches.group(1)
            return path, branch_plus_ref
    raise OSError(f"Could not find smoothie firmware file in {resources_path}")


def _get_motor_control_serial_port() -> Any:
    port = os.environ.get("OT_SMOOTHIE_EMULATOR_URI")

    if port is None:
        smoothie_id = os.environ.get("OT_SMOOTHIE_ID", "AMA")
        # TODO(mc, 2021-08-01): raise a more informative exception than
        # IndexError if a valid serial port is not found
        port = get_ports_by_name(device_name=smoothie_id)[0]

    log.info(f"Connecting to motor controller at port {port}")
    return port


def should_use_ot3() -> bool:
    """Return true if ot3 hardware controller should be used."""
    if ff.enable_ot3_hardware_controller():
        try:
            from opentrons_hardware.drivers.can_bus import CanDriver  # noqa: F401

            return True
        except ModuleNotFoundError:
            log.exception("Cannot use OT3 Hardware controller.")
    return False


async def _create_thread_manager() -> ThreadManagedHardware:
    """Build the hardware controller wrapped in a ThreadManager.

    .. deprecated:: 4.6
        ThreadManager is on its way out.
    """
    if os.environ.get("ENABLE_VIRTUAL_SMOOTHIE"):
        log.info("Initialized robot using virtual Smoothie")
        thread_manager: ThreadManagedHardware = ThreadManager(
            HardwareAPI.build_hardware_simulator
        )
    elif should_use_ot3():
        from opentrons.hardware_control.ot3api import OT3API

        thread_manager = ThreadManager(
            OT3API.build_hardware_controller,
            threadmanager_nonblocking=True,
        )
    else:
        thread_manager = ThreadManager(
            HardwareAPI.build_hardware_controller,
            threadmanager_nonblocking=True,
            port=_get_motor_control_serial_port(),
            firmware=_find_smoothie_file(),
        )

    try:
        await thread_manager.managed_thread_ready_async()
    except RuntimeError:
        log.exception("Could not build hardware controller, forcing virtual")
        thread_manager = ThreadManager(HardwareAPI.build_hardware_simulator)

    return thread_manager


async def initialize() -> ThreadManagedHardware:
    """
    Initialize the Opentrons hardware returning a hardware instance.
    """
    robot_conf = robot_configs.load()
    logging_config.log_init(robot_conf.log_level)

    log.info(f"API server version: {__version__}")
    log.info(f"Robot Name: {name()}")

    hardware = await _create_thread_manager()

    async def _blink() -> None:
        while True:
            await hardware.set_lights(button=True)
            await asyncio.sleep(0.5)
            await hardware.set_lights(button=False)
            await asyncio.sleep(0.5)

    # While the hardware was initializing in _create_hardware_api(), it blinked the
    # front button light. But that blinking stops when the completed hardware object
    # is returned. Do our own blinking here to keep it going while we home the robot.
    blink_task = asyncio.create_task(_blink())

    try:
        if not ff.disable_home_on_boot():
            log.info("Homing Z axes")
            await hardware.home_z()

        await hardware.set_lights(button=True)

        return hardware
    finally:
        blink_task.cancel()
        try:
            await blink_task
        except asyncio.CancelledError:
            pass
