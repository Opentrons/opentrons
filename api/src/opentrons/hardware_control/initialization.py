import os

from pathlib import Path
import logging
import re
from typing import Any, List, Tuple

from opentrons import should_use_ot3
from opentrons.drivers.serial_communication import get_ports_by_name
from opentrons.hardware_control import (
    API as HardwareAPI,
    ThreadManager,
    ThreadManagedHardware,
    types as hw_types,
)

from opentrons.config import (
    feature_flags as ff,
    name,
    robot_configs,
    IS_ROBOT,
    ROBOT_FIRMWARE_DIR,
)
from opentrons.util import logging_config

from opentrons._resources_path import RESOURCES_PATH
from opentrons._version import version


SMOOTHIE_HEX_RE = re.compile("smoothie-(.*).hex")


log = logging.getLogger(__name__)


def _find_smoothie_file() -> Tuple[Path, str]:
    resources: List[Path] = []

    # Search for smoothie files in /usr/lib/firmware first then fall back to
    # value packed in wheel
    if IS_ROBOT:
        resources.extend(ROBOT_FIRMWARE_DIR.iterdir())  # type: ignore

    resources.extend(RESOURCES_PATH.iterdir())

    for path in resources:
        matches = SMOOTHIE_HEX_RE.search(path.name)
        if matches:
            branch_plus_ref = matches.group(1)
            return path, branch_plus_ref
    raise OSError(f"Could not find smoothie firmware file in {RESOURCES_PATH}")


def _get_motor_control_serial_port() -> Any:
    port = os.environ.get("OT_SMOOTHIE_EMULATOR_URI")

    if port is None:
        smoothie_id = os.environ.get("OT_SMOOTHIE_ID", "AMA")
        # TODO(mc, 2021-08-01): raise a more informative exception than
        # IndexError if a valid serial port is not found
        port = get_ports_by_name(device_name=smoothie_id)[0]

    log.info(f"Connecting to motor controller at port {port}")
    return port


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
            ThreadManager.nonblocking_builder(OT3API.build_hardware_controller),
            use_usb_bus=ff.rear_panel_integration(),
            status_bar_enabled=ff.status_bar_enabled(),
            feature_flags=hw_types.HardwareFeatureFlags.build_from_ff(),
        )
    else:
        thread_manager = ThreadManager(
            ThreadManager.nonblocking_builder(HardwareAPI.build_hardware_controller),
            port=_get_motor_control_serial_port(),
            firmware=_find_smoothie_file(),
            feature_flags=hw_types.HardwareFeatureFlags.build_from_ff(),
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

    log.info(f"API server version: {version}")
    log.info(f"Robot Name: {name()}")

    return await _create_thread_manager()
