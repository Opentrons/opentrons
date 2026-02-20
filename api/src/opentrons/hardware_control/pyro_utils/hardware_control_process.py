import os
import asyncio
import logging
from opentrons.hardware_control.ot3api import OT3API
from opentrons.config import feature_flags as ff, robot_configs
from opentrons.hardware_control.types import HardwareFeatureFlags
from opentrons.hardware_control.thread_manager import ThreadManager  # noqa: E402
from opentrons.hardware_control.pyro_utils.hardware_control_type_registry import register_hardware_types
from opentrons.util.pyro_daemon_utility import create_pyro_daemon
from opentrons.util import logging_config

log = logging.getLogger(__name__)

def _build_thread_manager() -> ThreadManager[OT3API]:
        return ThreadManager(
            OT3API.build_hardware_controller,
            use_usb_bus=ff.rear_panel_integration(),
            feature_flags=HardwareFeatureFlags.build_from_ff(),
        )

async def _build_api(use_simulator: bool = False) -> ThreadManager[OT3API]:
    tm = _build_thread_manager()
    await tm.managed_thread_ready_async()

    async def _do_update() -> None:
        async for update in tm.update_firmware():
            log.info(f"Update: {update.subsystem.name}: {update.progress}%")

    await _do_update()

    return tm

def build_and_run_hwc_pyro():
    """Build an instance of the OT3API and provide it to the Pyro Daemon Factory as a resource"""
    robot_conf = robot_configs.load()
    logging_config.log_init(robot_conf.log_level)

    log.info("Building OT-3 API Instance")

    # todo(chb: 2026-02-18): Make this support simulated hardware controller - important for unit tests
    ot3api = asyncio.run(_build_api(use_simulator=False))

    # todo(chb: 2026-02-18): For the PYRONAMEs registered with the nameserver, do we want them to live in a centralized location (shared-data)?
    log.info("Creating Pyro Daemon for OT3API")
    create_pyro_daemon(pyroname="OT3API", resource=ot3api, registry=register_hardware_types)

if __name__ == "__main__":
    build_and_run_hwc_pyro()