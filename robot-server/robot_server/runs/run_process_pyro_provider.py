"""Manages protocol run subprocesses and provides Pyro proxies to communicate with them."""

import asyncio
import enum
import logging
import os
import pwd
import subprocess
import sys
import time
from dataclasses import dataclass
from typing import List, Optional, cast
from uuid import uuid4

import Pyro5.api

from opentrons.config import feature_flags
from opentrons.util.pyro.pyro_proxy_utility import wait_for_proxy

from . import run_process_entry_point
from .run_process import DirectedRunProcess, register_process_types

_log = logging.getLogger(__name__)

_RESTRICTED_USER_NAME = "ot-protocol"
_ROOT_USER_NAME = "root"

_RUN_PROXY_NAME = (
    "ot-protocol"  # During runtime this gains a random uuid4 extension  "_1234ABCD"
)
_SIMULATING_RUN_PROXY_NAME = "ot-simulating-protocol"  # During runtime this gains a random uuid4 extension  "_1234ABCD"

_RUN_PROCESS_LIMIT = 1  # Number of run processes to keep qeueued
_SIMULATING_PROCESS_LIMIT = 1  # Number of simulation processes to keep qeueued


_RUN_PROCESS_TIMEOUT = 60  # seconds
_RUN_PROCESS_TERMINATE_TIMEOUT = 10  # seconds


class _ProcessStatus(enum.Enum):
    ACTIVE = enum.auto()
    USED = enum.auto()
    UNUSED = enum.auto()


@dataclass
class _RunProcess:
    pyroname: str
    process: subprocess.Popen[bytes]
    status: _ProcessStatus


class RunProcessPyroProvider:
    """A provider for run subprocesses and pyro run process proxies."""

    def __init__(self) -> None:
        self._run_processes: Optional[List[_RunProcess]] = None
        self._simulating_run_processes: Optional[List[_RunProcess]] = None

        self._update_user_subprocess(False)

        self._teardown_signal = asyncio.Event()
        self._process_maintainer_task: asyncio.Task[None] | None = None

    def initialize(self, access_control_mode: bool) -> None:
        """Called when server first starts up.

        If feature flag is on for protocol subprocess, registers the process types
        for pyro serialization, then starts a run process in the background ready to
        be used by a run.

        If feature flag is on for running as a user with limited permissions then
        ensure the protocol user name is set.
        """
        self._update_user_subprocess(access_control_mode)
        if feature_flags.protocol_subprocess_enabled():
            register_process_types()
            # Start up the process maintainer
            self._process_maintainer_task = asyncio.create_task(
                self.process_maintainer()
            )

    async def teardown(self) -> None:
        """Called when server ends.

        If feature flag is on for protocol subprocess, ends the process and removes
        the run process proxy name from the nameserver.
        """
        if feature_flags.protocol_subprocess_enabled():
            self._teardown_signal.set()
            if self._process_maintainer_task is not None:
                await self._process_maintainer_task

    async def process_maintainer(self) -> None:  # noqa: C901
        """This will maintain the run processes and simulated run processes, creating and destroying as needed.

        This task will only spin up if subprocess mode is enabled.
        """
        _log.info("Beginning Protocol Subprocess maintainer task.")
        if self._run_processes is None and self._simulating_run_processes is None:
            # Initialize the process registries are empty
            self._run_processes = []
            self._simulating_run_processes = []
        else:
            raise RuntimeError(
                "Run process registries were not empty on startup of process maintainer task."
            )
        while not self._teardown_signal.is_set():
            if len(self._run_processes) < _RUN_PROCESS_LIMIT:
                pyro_id = _RUN_PROXY_NAME + "_" + str(uuid4())
                self._run_processes.append(
                    _RunProcess(
                        pyroname=pyro_id,
                        process=self._start_run_process(process_name=pyro_id),
                        status=_ProcessStatus.UNUSED,
                    )
                )
            if len(self._simulating_run_processes) < _SIMULATING_PROCESS_LIMIT:
                sim_pyro_id = _SIMULATING_RUN_PROXY_NAME + "_" + str(uuid4())
                self._simulating_run_processes.append(
                    _RunProcess(
                        pyroname=sim_pyro_id,
                        process=self._start_run_process(process_name=sim_pyro_id),
                        status=_ProcessStatus.UNUSED,
                    )
                )

            # Groom process queue for used inactive processes
            for process in self._run_processes:
                if process.status == _ProcessStatus.USED:
                    await self._dequeue_process(
                        process=process, process_registry=self._run_processes
                    )

            for sim_process in self._simulating_run_processes:
                if sim_process.status == _ProcessStatus.USED:
                    await self._dequeue_process(
                        process=sim_process,
                        process_registry=self._simulating_run_processes,
                    )
            # Wait and then repeat process spin-up and grooming as needed
            await asyncio.sleep(1.0)

        # Teardown behavior after teardown signal recieved:
        for process in self._run_processes:
            _log.info(f"Tearing down Run Process: {process.pyroname}")
            await self._dequeue_process(
                process=process, process_registry=self._run_processes
            )
        for sim_process in self._simulating_run_processes:
            _log.info(f"Tearing down Simulator Run Process: {sim_process.pyroname}")
            await self._dequeue_process(
                process=sim_process, process_registry=self._simulating_run_processes
            )

    def _get_active_run_process(
        self, process_registry: List[_RunProcess]
    ) -> _RunProcess | None:
        """Get the active process to be used by a run."""
        if process_registry is not None:
            for process in process_registry:
                if process.status == _ProcessStatus.ACTIVE:
                    return process
        return None

    def _set_active_process(self, process_registry: List[_RunProcess]) -> _RunProcess:
        """Set a run process in a given process registry as the active process to be used by a run."""
        for process in process_registry:
            if process.status == _ProcessStatus.UNUSED:
                process.status = _ProcessStatus.ACTIVE
                return process
        raise RuntimeError("Could not identify unused process in process registry.")

    def set_active_process_as_used(self, simulator: Optional[bool] = False) -> None:
        """Set the active process as used, meaning it will no longer be utilized for a Run."""
        if simulator:
            assert self._simulating_run_processes is not None
            for process in self._simulating_run_processes:
                if process.status == _ProcessStatus.ACTIVE:
                    process.status = _ProcessStatus.USED
        else:
            assert self._run_processes is not None
            for process in self._run_processes:
                if process.status == _ProcessStatus.ACTIVE:
                    process.status = _ProcessStatus.USED

    async def _validate_process_registry_ready(
        self, simulator: Optional[bool] = False
    ) -> List[_RunProcess]:
        """Validate that the process registries have processes that can be used.

        If `simulator` is provided, this will validate that there is a simulation process available.
        Otherwise, it will validate that a normal run process is available.
        """
        if simulator:
            if self._simulating_run_processes is None:
                # There are no run processes yet, try again throughout the timeout period and raise if one never appears
                start_time = time.monotonic()
                while time.monotonic() - start_time < _RUN_PROCESS_TIMEOUT:
                    if self._simulating_run_processes is not None:
                        # Simulation process is ready
                        return self._simulating_run_processes
                    await asyncio.sleep(0.01)
                raise RuntimeError("Active simulator process never became available.")
            return self._simulating_run_processes
        else:
            if self._run_processes is None:
                # There are no run processes yet, try again throughout the timeout period and raise if one never appears
                start_time = time.monotonic()
                while time.monotonic() - start_time < _RUN_PROCESS_TIMEOUT:
                    if self._run_processes is not None:
                        # Run process is ready
                        return self._run_processes
                    await asyncio.sleep(0.01)
                raise RuntimeError(
                    "Active protocol run process never became available."
                )
            return self._run_processes

    async def wait_for_run_proxy(
        self, simulator: Optional[bool] = False
    ) -> DirectedRunProcess:
        """Returns a proxy for the run process or simulating run process.

        Depending on how recently the desired process started, this may take up to around 25 seconds to resolve.
        """
        process_regisry = await self._validate_process_registry_ready(
            simulator=simulator
        )
        run_process = self._get_active_run_process(process_registry=process_regisry)
        if run_process is None:
            run_process = self._set_active_process(process_registry=process_regisry)

        run_proxy = await wait_for_proxy(proxy_name=run_process.pyroname)
        if run_proxy is None:
            raise RuntimeError(f"Can't resolve pyro proxy '{run_process.pyroname}'")
        return cast(DirectedRunProcess, cast(object, run_proxy))

    @staticmethod
    def _open_process(
        process_name: str,
        user_name: str,
        main_group_id: int,
        supplemental_group_ids: list[int],
    ) -> subprocess.Popen[bytes]:
        return subprocess.Popen(
            args=[
                sys.executable,
                "-m",
                run_process_entry_point.__name__,
                "--pyroname",
                process_name,
            ],
            env={k: v for k, v in os.environ.items()},
            user=user_name,
            group=main_group_id,
            extra_groups=supplemental_group_ids,
        )

    @staticmethod
    async def _end_process(process: subprocess.Popen[bytes]) -> None:
        process.terminate()
        start_time = time.monotonic()
        while (
            process.poll() is None
            and time.monotonic() - start_time < _RUN_PROCESS_TERMINATE_TIMEOUT
        ):
            await asyncio.sleep(0.01)
        else:
            process.kill()

    async def _dequeue_process(
        self,
        process: _RunProcess,
        process_registry: List[_RunProcess],
        broadcast_mode: bool = False,
    ) -> None:
        """Removes a process from a process registry, ending that process and delisting it from the global Pyro Nameserver."""
        with Pyro5.api.locate_ns(broadcast=broadcast_mode) as ns:
            ns.remove(process.pyroname)
        await self._end_process(process=process.process)
        process_registry.remove(process)

    def _start_run_process(self, process_name: str) -> subprocess.Popen[bytes]:
        return self._open_process(
            process_name=process_name,
            user_name=self._process_username,
            main_group_id=self._process_gid,
            supplemental_group_ids=self._supplemental_gids,
        )

    def _set_user_subprocess_for(self, username: str) -> None:
        gid = pwd.getpwnam(username).pw_gid
        supplemental_gids = os.getgrouplist(username, gid)
        _log.info(
            f"Configuring subprocesses to run as {username}: username={username}, main gid={gid}, supplemental gids={', '.join([str(gid) for gid in supplemental_gids])}"
        )
        self._process_username = username
        self._process_gid = gid
        self._supplemental_gids = supplemental_gids

    def _update_user_subprocess(self, access_control_mode: bool) -> None:
        """Update which system user should execute the protocol subprocess."""
        if feature_flags.run_protocol_as_restricted_user() or access_control_mode:
            self._set_user_subprocess_for(_RESTRICTED_USER_NAME)
        else:
            self._set_user_subprocess_for(_ROOT_USER_NAME)
