from __future__ import annotations

import os
import signal
import subprocess
import sys
import tempfile
from pathlib import Path
from types import TracebackType
from typing import Optional


class DevServer:
    """An instance of the server, running as a background process."""

    def __init__(self, port: int) -> None:
        """Initialize a dev server."""
        self.port: int = port
        self._base_dir = tempfile.TemporaryDirectory()
        self._mount_dir = tempfile.TemporaryDirectory()
        signing_key_dir = Path(self._mount_dir.name) / "signing_keys"
        signing_key_dir.mkdir(parents=True)
        (signing_key_dir / "audit-signing-key.private").write_bytes(
            (
                Path(__file__).parent / "integration" / "audit-signing-key-test.private"
            ).read_bytes()
        )

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
        env = {k: v for k, v in os.environ.items()}
        env["OT_KEY_SERVER_secure_storage_implementation"] = "dev"
        env["OT_KEY_SERVER_base_directory"] = self._base_dir.name
        env["OT_KEY_SERVER_image_mount_point"] = self._mount_dir.name
        env["OT_KEY_SERVER_tls_server_integration"] = "dev-none"
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
                "key_server",
                "-m",
                "key_server",
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

    @property
    def base_directory(self) -> Path:
        return Path(self._base_dir.name)

    @property
    def secure_volume(self) -> Path:
        return Path(self._mount_dir.name)
