"""This file is run directly in its own process and encapsulates a run."""

import asyncio
import threading
from typing import Any

from opentrons.protocol_engine import DeckType
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon

from robot_server.runs.run_process import DirectedRunProcess, register_process_types


def initialize_run_process() -> threading.Thread:
    """Build an instance of the DirectedRunProcess, create a thread to run it, and return a pyro daemon thread."""

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
        name="RunProcessThread",
        args=(),
        kwargs={"process": run_process},
        daemon=True,
    )
    process_resource_thread.start()

    pyro_daemon_thread = threading.Thread(
        target=_start_and_run_pyro_daemon,
        name="RunProcessThread",
        args=(),
        kwargs={
            "pyroname": "ot-protocol",
            "process": run_process,
            "registry": register_process_types,
        },
        daemon=True,
    )
    return pyro_daemon_thread


if __name__ == "__main__":
    pyro_thread = initialize_run_process()
    pyro_thread.start()
    pyro_thread.join()
