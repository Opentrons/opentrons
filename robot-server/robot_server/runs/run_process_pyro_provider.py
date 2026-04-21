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

_RUN_PROXY_NAME = "ot-protocol"
_RUN_PROXY_TIMEOUT = 30  # seconds
_RUN_PROCESS_TERMINATE_TIMEOUT = 10  # seconds


class RunProcessPyroProvider:
    """A provider for run subprocesses and pyro run process proxies."""

    def __init__(self) -> None:
        self._run_process: Optional[subprocess.Popen[bytes]] = None

    def initialize(self) -> None:
        """Called when server first starts up.

        If feature flag is on for protocol subprocess, registers the process types
        for pyro serialization, then starts a run process in the background ready to
        be used by a run.
        """
        if feature_flags.protocol_subprocess_enabled():
            register_process_types()
            self._start_run_process()

    async def teardown(self) -> None:
        """Called when server ends.

        If feature flag is on for protocol subprocess, ends the process and removes
        the run process proxy name from the nameserver.
        """
        if feature_flags.protocol_subprocess_enabled():
            await self._end_run_process()
            with Pyro5.api.locate_ns() as ns:
                ns.remove(_RUN_PROXY_NAME)

    async def refresh(self) -> None:
        """Ends the currently running process and starts a new one."""
        await self._end_run_process()
        with Pyro5.api.locate_ns() as ns:
            ns.remove(_RUN_PROXY_NAME)
        self._start_run_process()

    async def wait_for_run_proxy(self) -> DirectedRunProcess:
        """Returns a proxy for the run process.

        Depending on how recently it started, this may take up to around 25 seconds to resolve.
        """
        if self._run_process is None:
            self._start_run_process()

        start_time = time.monotonic()
        with Pyro5.api.locate_ns() as ns:
            while time.monotonic() - start_time < _RUN_PROXY_TIMEOUT:
                if _RUN_PROXY_NAME in ns.list():
                    proxy = AsyncClientPyroObject(
                        Pyro5.api.Proxy(ns.list()[_RUN_PROXY_NAME])  # type: ignore[no-untyped-call]
                    )
                    return cast(DirectedRunProcess, cast(object, proxy))
                await asyncio.sleep(0.01)
            else:
                await self._end_run_process()
                self._start_run_process()
                raise RuntimeError("Can't resolve pyro proxy 'ot-protocol'")

    def _start_run_process(self) -> None:
        if self._run_process is not None:
            return

        self._run_process = subprocess.Popen(
            args=[sys.executable, "-m", run_process_entry_point.__name__],
            env={k: v for k, v in os.environ.items()},
            # user="ot-protocol"
        )

    async def _end_run_process(self) -> None:
        if self._run_process is None:
            return

        self._run_process.terminate()
        start_time = time.monotonic()
        while (
            self._run_process.poll() is None
            and time.monotonic() - start_time < _RUN_PROCESS_TERMINATE_TIMEOUT
        ):
            await asyncio.sleep(0.01)
        else:
            self._run_process.kill()

        self._run_process = None
