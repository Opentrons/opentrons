from __future__ import annotations
from aiohttp import web 
from typing import Optional
from types import TracebackType
import sys
import signal
import subprocess
from multiprocessing import Process

class DevSystemServer:
    def __init__(
        self,
        port: int
    ) -> None:
        self.proc = None
        self.port = port
    
    def __enter__(self) -> DevSystemServer:
        return self
    
    def __exit__(
        self,
        exc_type: Optional[BaseException],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        self.stop()
    
    def __del__(self):
        self.stop()
    
    def start(self) -> None:
        """Run the server in another process."""
        env = {
            "OT_SYSTEM_SERVER_persistence_directory": "automatically_make_temporary"
        }
        self.proc = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "system_server",
                "--port",
                f"{self.port}",
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