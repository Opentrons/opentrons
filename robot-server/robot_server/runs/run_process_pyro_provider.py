"""Manages protocol run subprocesses and provides Pyro proxies to communicate with them."""

import asyncio
import logging
import os
import subprocess
import sys
import time
from typing import Optional, cast

import Pyro5.api

from opentrons.config import feature_flags
from opentrons.util.pyro.pyro_client_async_adapter import AsyncClientPyroObject

from . import run_process_entry_point
from .run_process import DirectedRunProcess, register_process_types

_log = logging.getLogger(__name__)

_RESTRICTED_USER_NAME = "ot-protocol"
_ROOT_USER_NAME = "root"

_RUN_PROXY_NAME = "ot-protocol"
_SIMULATING_RUN_PROXY_NAME = "ot-simulating-protocol"

_RUN_PROXY_TIMEOUT = 30  # seconds
_RUN_PROCESS_TERMINATE_TIMEOUT = 10  # seconds


class RunProcessPyroProvider:
    """A provider for run subprocesses and pyro run process proxies."""

    def __init__(self) -> None:
        self._run_process: Optional[subprocess.Popen[bytes]] = None
        self._simulating_run_process: Optional[subprocess.Popen[bytes]] = None

        # The protocol subprocess username defaults to root unless otherwise specified
        self._protocol_username: str = "root"

    def initialize(self, access_control_mode: bool) -> None:
        """Called when server first starts up.

        If feature flag is on for protocol subprocess, registers the process types
        for pyro serialization, then starts a run process in the background ready to
        be used by a run.

        If feature flag is on for running as a user with limited permissions then
        ensure the protocol user name is set.
        """
        if feature_flags.run_protocol_as_restricted_user() or access_control_mode:
            self._protocol_username = _RESTRICTED_USER_NAME
        elif (
            feature_flags.run_protocol_as_restricted_user() is False
            and access_control_mode is False
        ):
            self._protocol_username = _ROOT_USER_NAME
        if feature_flags.protocol_subprocess_enabled():
            register_process_types()
            self._start_run_process()
            self._start_simulating_process()

    async def teardown(self) -> None:
        """Called when server ends.

        If feature flag is on for protocol subprocess, ends the process and removes
        the run process proxy name from the nameserver.
        """
        if feature_flags.protocol_subprocess_enabled():
            await self._end_run_process()
            await self._end_simulating_process()
            with Pyro5.api.locate_ns() as ns:
                ns.remove(_RUN_PROXY_NAME)
                ns.remove(_SIMULATING_RUN_PROXY_NAME)

    async def refresh(self, access_control_mode: bool) -> None:
        """Ends the currently running process and starts a new one."""
        await self._end_run_process()
        # Validate user level settings
        if feature_flags.run_protocol_as_restricted_user() or access_control_mode:
            self._protocol_username = _RESTRICTED_USER_NAME
        elif (
            feature_flags.run_protocol_as_restricted_user() is False
            and access_control_mode is False
        ):
            self._protocol_username = _ROOT_USER_NAME
        with Pyro5.api.locate_ns() as ns:
            ns.remove(_RUN_PROXY_NAME)
        self._start_run_process()

    async def refresh_simulating(self, access_control_mode: bool) -> None:
        """Ends the currently running simulating process and starts a new one."""
        await self._end_simulating_process()
        # Validate user level settings
        if feature_flags.run_protocol_as_restricted_user() or access_control_mode:
            self._protocol_username = _RESTRICTED_USER_NAME
        elif (
            feature_flags.run_protocol_as_restricted_user() is False
            and access_control_mode is False
        ):
            self._protocol_username = _ROOT_USER_NAME
        with Pyro5.api.locate_ns() as ns:
            ns.remove(_SIMULATING_RUN_PROXY_NAME)
        self._start_simulating_process()

    @staticmethod
    async def _wait_for_proxy(proxy_name: str) -> Optional[DirectedRunProcess]:
        start_time = time.monotonic()
        with Pyro5.api.locate_ns() as ns:
            while time.monotonic() - start_time < _RUN_PROXY_TIMEOUT:
                if proxy_name in ns.list():
                    proxy = AsyncClientPyroObject(
                        Pyro5.api.Proxy(ns.list()[proxy_name])  # type: ignore[no-untyped-call]
                    )
                    return cast(DirectedRunProcess, cast(object, proxy))
                await asyncio.sleep(0.01)
        return None

    async def wait_for_run_proxy(self) -> DirectedRunProcess:
        """Returns a proxy for the run process.

        Depending on how recently it started, this may take up to around 25 seconds to resolve.
        """
        if self._run_process is None:
            self._start_run_process()

        run_proxy = await self._wait_for_proxy(_RUN_PROXY_NAME)
        if run_proxy is None:
            await self._end_run_process()
            self._start_run_process()
            raise RuntimeError(f"Can't resolve pyro proxy '{_RUN_PROXY_NAME}'")
        return run_proxy

    async def wait_for_simulating_run_proxy(self) -> DirectedRunProcess:
        """Returns a proxy for the simulating run process for use in on-robot analysis.

        Depending on how recently it started, this may take up to around 25 seconds to resolve.
        """
        if self._simulating_run_process is None:
            self._start_simulating_process()

        simulating_proxy = await self._wait_for_proxy(_SIMULATING_RUN_PROXY_NAME)
        if simulating_proxy is None:
            await self._end_simulating_process()
            self._start_simulating_process()
            raise RuntimeError(
                f"Can't resolve pyro proxy '{_SIMULATING_RUN_PROXY_NAME}'"
            )
        return simulating_proxy

    @staticmethod
    def _open_process(process_name: str, user_name: str) -> subprocess.Popen[bytes]:
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

    def _start_run_process(self) -> None:
        if self._run_process is not None:
            return

        self._run_process = self._open_process(
            process_name=_RUN_PROXY_NAME, user_name=self._protocol_username
        )

    async def _end_run_process(self) -> None:
        if self._run_process is None:
            return

        await self._end_process(self._run_process)
        self._run_process = None

    def _start_simulating_process(self) -> None:
        if self._simulating_run_process is not None:
            return

        self._simulating_run_process = self._open_process(
            process_name=_SIMULATING_RUN_PROXY_NAME, user_name=self._protocol_username
        )

    async def _end_simulating_process(self) -> None:
        if self._simulating_run_process is None:
            return

        await self._end_process(self._simulating_run_process)
        self._simulating_run_process = None
