from __future__ import annotations
from typing import Optional
from types import TracebackType
import sys
import signal
import subprocess


class DevSystemServer:
    def __init__(self, port: str) -> None:
        self.proc: Optional[subprocess.Popen[bytes]] = None
        self.port = str(port)

    def __enter__(self) -> DevSystemServer:
        return self

    def __exit__(
        self,
        exc_type: Optional[BaseException],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        self.stop()

    def __del__(self) -> None:
        self.stop()

    def start(self) -> None:
        """Run the server in another process."""
        env = {"OT_SYSTEM_SERVER_persistence_directory": "automatically_make_temporary"}
        self.proc = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "system_server",
                "--port",
                self.port,
            ],
            env=env,
            stdin=subprocess.DEVNULL,
            # The server will log to its stdout or stderr.
            # Let it inherit our stdout and stderr so pytest captures its logs.
            stdout=None,
            stderr=None,
        )

    def stop(self) -> None:
        """Stop the robot server."""
        if self.proc is not None:
            self.proc.send_signal(signal.SIGTERM)
            self.proc.wait()
            self.proc = None
