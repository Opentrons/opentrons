import logging
import os
import re
import socket
import time
from pathlib import Path
from typing import Any, List, Tuple, cast

import Pyro5.api as pyro
import Pyro5.errors as pyro_errors

from ._version import version
from opentrons.config import (
    IS_ROBOT,
    ROBOT_FIRMWARE_DIR,
    name,
    robot_configs,
)
from opentrons.config import (
    feature_flags as ff,
)
from opentrons.drivers.serial_communication import get_ports_by_name
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control import (
    HardwareControlAPI,
    ThreadManagedHardware,
    ThreadManager,
)
from opentrons.hardware_control import (
    types as hw_types,
)
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.types import ApiDeprecationError
from opentrons.util import logging_config
from opentrons.util.pyro.pyro_client_async_adapter import AsyncClientPyroObject

HERE = os.path.abspath(os.path.dirname(__file__))
__version__ = version


LEGACY_MODULES = ["robot", "reset", "instruments", "containers", "labware", "modules"]


__all__ = ["version", "__version__", "HERE", "config"]


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


def identify_hardware_process() -> HardwareControlAPI:
    """
    Identify the Pyro Proxy for the OT3API and return a wrapped hardware instance.
    """
    robot_conf = robot_configs.load()
    logging_config.log_init(robot_conf.log_level)
    try:
        # Find the OT3API on the nameserver
        # todo(chb, 03-31-2026): for now this is using the same methodology as the DirectedRunProcess work, consolidate
        ot3_process_proxy = None
        start_time = time.monotonic()
        with pyro.locate_ns() as ns:
            while time.monotonic() - start_time < 60:
                if "OT3API" in ns.list():
                    ot3_process_proxy = pyro.Proxy(ns.list()["OT3API"])  # type: ignore[no-untyped-call]
                    break
                time.sleep(0.01)

        if ot3_process_proxy is None:
            raise pyro_errors.CommunicationError(
                "Opentrons-robot-server could not find OT3API URI on Pyro5 Nameserver."
            )
        else:
            ot3_process_async_client = AsyncClientPyroObject(ot3_process_proxy)
            hardware_api = cast(HardwareControlAPI, ot3_process_async_client)
            # Register hardware types for the robot server process
            register_hardware_types()
            log.info("Opentrons Hardware API Subprocess identified and ready for use.")

            return hardware_api

    except (pyro_errors.NamingError, pyro_errors.CommunicationError, socket.timeout):
        raise pyro_errors.CommunicationError(
            "Opentrons Pyro5 Nameserver not found within 60 seconds."
        )
