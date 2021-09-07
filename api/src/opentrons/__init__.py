import json
import os
import sys
from functools import partial
from pathlib import Path
import logging
import asyncio
import re
from typing import Any, List, Tuple, cast

from opentrons.drivers.serial_communication import get_ports_by_name
from opentrons.hardware_control import API, ThreadManager
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


def __getattr__(attrname):
    """
    Prevent import of legacy modules from global to officially
    deprecate Python API Version 1.0.
    """
    if attrname in LEGACY_MODULES:
        raise ApiDeprecationError(APIVersion(1, 0))
    raise AttributeError(attrname)


def __dir__():
    return sorted(__all__ + LEGACY_MODULES)


log = logging.getLogger(__name__)

try:
    import systemd.daemon  # type: ignore

    systemdd_notify = partial(systemd.daemon.notify, "READY=1")
except ImportError:
    log.info("Systemd couldn't be imported, not notifying")
    systemdd_notify = partial(lambda: None)


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


async def _create_thread_manager() -> ThreadManager:
    """Build the hardware controller wrapped in a ThreadManager.

    .. deprecated:: 4.6
        ThreadManager is on its way out.
    """
    if os.environ.get("ENABLE_VIRTUAL_SMOOTHIE"):
        log.info("Initialized robot using virtual Smoothie")
        return ThreadManager(API.build_hardware_simulator)

    thread_manager = ThreadManager(
        API.build_hardware_controller,
        threadmanager_nonblocking=True,
        port=_get_motor_control_serial_port(),
        firmware=_find_smoothie_file(),
    )

    try:
        await thread_manager.managed_thread_ready_async()
    except RuntimeError:
        log.exception("Could not build hardware controller, forcing virtual")
        return ThreadManager(API.build_hardware_simulator)

    return thread_manager


async def _create_hardware_api() -> API:
    use_hardware_simulator = os.environ.get("ENABLE_VIRTUAL_SMOOTHIE")

    if use_hardware_simulator:
        return await API.build_hardware_simulator()

    return await API.build_hardware_controller(
        port=_get_motor_control_serial_port(),
        firmware=_find_smoothie_file(),
    )


async def initialize() -> API:
    """
    Initialize the Opentrons hardware returning a hardware instance.
    """
    robot_conf = robot_configs.load()
    logging_config.log_init(robot_conf.log_level)

    log.info(f"API server version: {__version__}")
    log.info(f"Robot Name: {name()}")
    systemdd_notify()

    use_thread_manager = ff.enable_protocol_engine() is False

    if use_thread_manager:
        thread_manager = await _create_thread_manager()
        hardware = cast(API, thread_manager)
    else:
        hardware = await _create_hardware_api()

    async def _blink():
        while True:
            await hardware.set_lights(button=True)
            await asyncio.sleep(0.5)
            await hardware.set_lights(button=False)
            await asyncio.sleep(0.5)

    blink_task = asyncio.create_task(_blink())

    if not ff.disable_home_on_boot():
        log.info("Homing Z axes")
        await hardware.home_z()

    blink_task.cancel()
    await asyncio.gather(blink_task, return_exceptions=True)
    await hardware.set_lights(button=True)

    return hardware
