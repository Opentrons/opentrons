"""Manages protocol run subprocesses and provides Pyro proxies to communicate with them."""

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


class RunProcessRunningError(RuntimeError):
    """Raised if a run process is attempted to be opened when one is already running."""


class NoRunProcessRunningError(RuntimeError):
    """Raised if a run process is attempted to be closed when one is not running."""


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

    def teardown(self) -> None:
        """Called when server ends.

        If feature flag is on for protocol subprocess, ends the process and removes
        the run process proxy name from the nameserver.
        """
        if feature_flags.protocol_subprocess_enabled():
            self._end_run_process()
            with Pyro5.api.locate_ns() as ns:
                ns.remove(_RUN_PROXY_NAME)

    def refresh(self) -> None:
        """Ends the currently running process and starts a new one."""
        self._end_run_process()
        with Pyro5.api.locate_ns() as ns:
            ns.remove(_RUN_PROXY_NAME)
        self._start_run_process()

    def wait_for_run_proxy(self) -> DirectedRunProcess:
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
                time.sleep(0.01)
            else:
                self._end_run_process()
                self._start_run_process()
                raise RuntimeError("Can't resolve pyro proxy 'ot-protocol'")

    def _start_run_process(self) -> None:
        if self._run_process is not None:
            raise RunProcessRunningError("Protocol run process already running.")

        self._run_process = subprocess.Popen(
            args=[sys.executable, "-m", run_process_entry_point.__name__],
            env={k: v for k, v in os.environ.items()},
            # user="ot-protocol"  # TODO how do we make sure this works locally?
        )

    def _end_run_process(self) -> None:
        if self._run_process is None:
            raise NoRunProcessRunningError("No protocol run process currently running.")

        self._run_process.terminate()
        start_time = time.monotonic()
        while (
            self._run_process.poll() is None
            and time.monotonic() - start_time < _RUN_PROCESS_TERMINATE_TIMEOUT
        ):
            time.sleep(0.01)
        else:
            self._run_process.kill()

        self._run_process = None
