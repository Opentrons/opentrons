from __future__ import annotations

import os
import signal
import subprocess
import sys
from types import TracebackType
from typing import Mapping, Optional


class DevServer:
    """An instance of the server, running as a background process."""

    def __init__(
        self,
        port: int,
        extra_env: Optional[Mapping[str, str]] = None,
    ) -> None:
        """Initialize a dev server.

        ``extra_env`` is layered on top of the parent process's environment
        when spawning the subprocess, so tests can inject configuration like
        ``OT_AUDIT_SERVER_key_server_url`` without polluting ``os.environ``.
        """
        self.port: int = port
        self._extra_env: Mapping[str, str] = extra_env or {}

    def __enter__(self) -> DevServer:
        return self

    def __exit__(
        self,
        exc_type: Optional[BaseException],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        self.stop()

    def start(self) -> None:
        """Run the audit server in a background process."""
        env = {k: v for k, v in os.environ.items()}
        env.update(self._extra_env)
        # In order to collect coverage we run using `coverage`.
        # `-a` is to append to existing `.coverage` file.
        # `--source` is the source code folder to collect coverage stats on.
        self.proc = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "coverage",
                "run",
                "-a",
                "--source",
                "audit_server",
                "-m",
                "audit_server",
                "--host",
                "localhost",
                "--port",
                f"{self.port}",
            ],
            stdin=subprocess.DEVNULL,
            # The server will log to its stdout or stderr.
            # Let it inherit our stdout and stderr so pytest captures its logs.
            stdout=None,
            stderr=None,
            env=env,
        )

    def stop(self) -> None:
        """Stop the server and wait for it to clean up."""
        # todo(mm, 2024-08-15): self.proc does not necessarily exist if startup fails.
        self.proc.send_signal(signal.SIGTERM)
        self.proc.wait()

    @property
    def base_url(self) -> str:
        return f"http://localhost:{self.port}"
