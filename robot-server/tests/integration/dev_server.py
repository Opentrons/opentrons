from __future__ import annotations
from pathlib import Path
import subprocess
import signal
import sys
import tempfile
from types import TracebackType
from typing import Optional


class DevServer:
    def __init__(
        self, port: str = "31950", persistence_directory: Optional[Path] = None
    ) -> None:
        """Initialize a dev server."""
        self.server_temp_directory: str = tempfile.mkdtemp()
        self.persistence_directory: Path = (
            persistence_directory
            if persistence_directory is not None
            else Path(tempfile.mkdtemp())
        )
        self.port: str = port

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
                "robot_server",
                "-m",
                "uvicorn",
                "robot_server:app",
                "--host",
                "localhost",
                "--port",
                f"{self.port}",
            ],
            # This environment is only for the subprocess so it should
            # not have any side effects.
            env={
                "OT_ROBOT_SERVER_DOT_ENV_PATH": "dev.env",
                "OT_API_CONFIG_DIR": self.server_temp_directory,
                "OT_ROBOT_SERVER_persistence_directory": str(
                    self.persistence_directory
                ),
            },
            stdin=subprocess.DEVNULL,
            # The server will log to its stdout or stderr.
            # Let it inherit our stdout and stderr so pytest captures its logs.
            stdout=None,
            stderr=None,
        )

    def stop(self) -> None:
        """Stop the robot server."""
        self.proc.send_signal(signal.SIGTERM)
        self.proc.wait()
