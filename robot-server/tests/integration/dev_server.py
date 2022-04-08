import subprocess
import signal
import sys
import tempfile


class DevServer:
    def __init__(self, port: str = "31950") -> None:
        self.server_temp_directory: str = tempfile.mkdtemp()
        self.persistence_directory: str = tempfile.mkdtemp()
        self.port: str = port

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
                "OT_ROBOT_SERVER_persistence_directory": self.persistence_directory,
            },
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

    def stop(self) -> None:
        """Stop the robot server."""
        self.proc.send_signal(signal.SIGTERM)
        # This calls proc.wait() and does cleanup on stdin, stdout and stderr.
        self.proc.__exit__(None, None, None)
