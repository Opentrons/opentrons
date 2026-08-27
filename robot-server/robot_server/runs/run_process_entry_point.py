"""This file is run directly in its own process and encapsulates a run."""

import argparse
import asyncio
import logging
import threading
from typing import Any

from opentrons.protocol_engine import DeckType
from opentrons.util.logging_config import log_init
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon

from robot_server.runs.run_process import DirectedRunProcess, register_all_needed_types

log = logging.getLogger(__name__)


def initialize_run_process(process_name: str) -> threading.Thread:
    """Build an instance of the DirectedRunProcess, create a thread to run it, and return a pyro daemon thread."""
    log.info(f"run process {process_name} begins")

    def _start_and_run_process(process: DirectedRunProcess) -> None:
        process.loop = asyncio.new_event_loop()
        try:
            asyncio.set_event_loop(process.loop)
            process.loop.run_forever()
        except Exception as e:
            raise e
        finally:
            process.loop.close()

    def _start_and_run_pyro_daemon(
        pyroname: str, process: DirectedRunProcess, registry: Any
    ) -> None:
        create_pyro_daemon(pyroname=pyroname, resource=process, registry=registry)

    # TODO hard coding this for now since it's only gonna be on Flex
    run_process = DirectedRunProcess("OT-3 Standard", DeckType.OT3_STANDARD)

    process_resource_thread = threading.Thread(
        target=_start_and_run_process,
        name="RunProcessResourceThread",
        args=(),
        kwargs={"process": run_process},
        daemon=True,
    )
    process_resource_thread.start()

    pyro_daemon_thread = threading.Thread(
        target=_start_and_run_pyro_daemon,
        name="RunProcessPyroThread",
        args=(),
        kwargs={
            "pyroname": process_name,
            "process": run_process,
            "registry": register_all_needed_types,
        },
        daemon=True,
    )
    return pyro_daemon_thread


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Starts and runs a pyro daemon for the protocol subprocess."
        " Requires a nameserver to be running."
    )
    parser.add_argument(
        "--pyroname", required=True, help="The name of the pyro daemon."
    )
    parser.add_argument(
        "--loglevel",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "NONE"],
        required=False,
        help="Logging level",
        default="NONE",
    )
    args = parser.parse_args()
    if args.loglevel != "NONE":
        log_init(args.loglevel.upper())
    pyro_thread = initialize_run_process(args.pyroname)

    pyro_thread.start()
    pyro_thread.join()
