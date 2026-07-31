"""Entrypoint for the Hardware API subprocess, hosts the Thread Managed hardware resource and a Pyro daemon to serve requests."""

import argparse
import asyncio
import logging
import threading
import time
from typing import Any

import Pyro5.api as pyro

from opentrons.config import feature_flags as ff
from opentrons.config import robot_configs
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.hardware_control.thread_manager import ThreadManager  # noqa: E402
from opentrons.hardware_control.types import HardwareFeatureFlags
from opentrons.util import logging_config
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon

log = logging.getLogger(__name__)


def hardware_process_notify_up() -> bool:
    """Notify systemd that the current service is up and running.

    This was based off an identical systemd notification utility on server_utils.
    On dev machines without systemd, this will no-op. On dev machines that happen to be
    running Linux and systemd, this will actually send the notification, but that
    should be harmless.
    """
    try:
        import systemd.daemon  # type: ignore

        systemd.daemon.notify("READY=1")

    except ImportError:
        pass
    return True


def _build_thread_manager(use_simulator: bool) -> ThreadManager[OT3API]:
    """Build a Thread Managed hardware api or simulated hardware api."""
    if use_simulator:
        return ThreadManager(
            OT3API.build_hardware_simulator,
            feature_flags=HardwareFeatureFlags.build_from_ff(),
        )
    else:
        return ThreadManager(
            OT3API.build_hardware_controller,
            use_usb_bus=ff.rear_panel_integration(),
            feature_flags=HardwareFeatureFlags.build_from_ff(),
        )


async def _build_api(use_simulator: bool) -> ThreadManager[OT3API]:
    """Build a hardware API within a ThreadManager and ensure it is ready for async requests on it's event loop."""
    tm = _build_thread_manager(use_simulator)
    await tm.managed_thread_ready_async()

    return tm


async def build_and_run_hwc_pyro(simulate: bool) -> None:
    """Build an instance of the OT3API and provide it to the Pyro Daemon Factory as a resource"""
    robot_conf = robot_configs.load()
    logging_config.log_init(robot_conf.log_level)
    # todo(chb, 03-06-26): Logging should be configured for process entry given this will no longer be handled by the original HWC process creator

    log.info("Building OT-3 API Instance")

    # todo(chb: 2026-02-18): Make this support simulated hardware controller - important for unit tests
    ot3api = await _build_api(use_simulator=simulate)

    def _daemon_request_loop(pyroname: str, resource: Any, registry: Any) -> None:
        # todo(chb: 2026-02-18): For the PYRONAMEs registered with the nameserver, do we want them to live in a centralized location (shared-data)?
        log.info("Creating Pyro Daemon for OT3API")
        create_pyro_daemon(pyroname=pyroname, resource=resource, registry=registry)

    daemon_request_thread = threading.Thread(
        target=_daemon_request_loop,
        args=("OT3API", ot3api, register_hardware_types),
        daemon=True,
    )

    daemon_request_thread.start()

    # Alert the systemd service that this process has spun up as soon as the resource is on the nameserver
    service_notified = False
    start_time = time.monotonic()
    with pyro.locate_ns() as ns:
        while time.monotonic() - start_time < 60:
            if "OT3API" in ns.list():
                service_notified = hardware_process_notify_up()
                break
            time.sleep(0.01)
    if not service_notified:
        raise RuntimeError(
            "Hardware process failed to verify registration with Pyro daemon."
        )

    # Handle firmware updates on the hardware api
    async def _do_update() -> None:
        async for update in ot3api.update_firmware():
            log.info(f"Update: {update.subsystem.name}: {update.progress}%")

    await _do_update()

    # Gracefully join the daemon request loop thread
    daemon_request_thread.join()


if __name__ == "__main__":
    # NOTE: This is here to no-op the entire hardware layer entry process for robot versions below 10.0.0
    # this patch should be REMOVED for releases >= 10.0.0
    # See: https://opentrons.atlassian.net/browse/EXEC-2897
    if False:
        parser = argparse.ArgumentParser(
            description="Starts and runs the hardware subprocess and a Pyro daemon to handle requests."
            " Requires a nameserver to be running."
        )
        parser.add_argument(
            "--simulate",
            required=False,
            default=False,
            help="Flag to determine if the process should run with a hardware simulator or active hardware.",
        )
        asyncio.run(build_and_run_hwc_pyro(parser.parse_args().simulate))

    # NOTE: this notification patch should be REMOVED for releases >= 10.0.0
    hardware_process_notify_up()
