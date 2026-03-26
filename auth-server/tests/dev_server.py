from __future__ import annotations

import signal
import subprocess
import sys
from types import TracebackType
from typing import Optional


class DevServer:
    """An instance of the server, running as a background process."""

    def __init__(self, port: int) -> None:
        """Initialize a dev server."""
        self.port: int = port

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
        """Run the robot server in a background process."""
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
                "auth_server",
                "-m",
                "auth_server",
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
        )

    def stop(self) -> None:
        """Stop the server and wait for it to clean up."""
        # todo(mm, 2024-08-15): self.proc does not necessarily exist if startup fails.
        self.proc.send_signal(signal.SIGTERM)
        self.proc.wait()

    @property
    def base_url(self) -> str:
        return f"http://localhost:{self.port}"
