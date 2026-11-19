"""Read one terminal key at a time without queuing robot jogs."""

from contextlib import contextmanager
import os
import select
import signal
import sys
import termios
import tty
from typing import Any, Iterator


class Terminal:
    """Restore the terminal on exit and discard repeated keys after each move."""

    def __init__(self) -> None:
        """Bind to the SSH terminal's standard input."""
        self.fd = sys.stdin.fileno()

    @contextmanager
    def active(self) -> Iterator["Terminal"]:
        """Use cbreak mode while preserving Ctrl-C and signal cleanup."""
        if not os.isatty(self.fd):
            raise RuntimeError("需要交互终端；SSH 请使用 -tt。")
        original = termios.tcgetattr(self.fd)
        handlers = {
            signum: signal.getsignal(signum)
            for signum in (signal.SIGHUP, signal.SIGTERM)
        }

        def interrupted(signum: int, frame: Any) -> None:
            raise KeyboardInterrupt(f"Terminal interrupted: {signum}")

        try:
            for signum in handlers:
                signal.signal(signum, interrupted)
            tty.setcbreak(self.fd)
            yield self
        finally:
            try:
                termios.tcsetattr(self.fd, termios.TCSANOW, original)
            finally:
                for signum, handler in handlers.items():
                    signal.signal(signum, handler)

    def discard_pending(self) -> None:
        """Prevent keys typed during motion from becoming future motor commands."""
        termios.tcflush(self.fd, termios.TCIFLUSH)

    def read_key(self) -> str:
        """Decode arrows, page keys, Enter and single-letter commands."""
        first = os.read(self.fd, 1)
        if not first:
            raise EOFError("SSH 终端已断开。")
        if first in (b"\r", b"\n"):
            return "ENTER"
        if first != b"\x1b":
            return first.decode("ascii", errors="ignore").lower()
        sequence = bytearray(first)
        # SSH may split an escape sequence into several packets.
        while len(sequence) < 8 and select.select([self.fd], [], [], 0.15)[0]:
            byte = os.read(self.fd, 1)
            if not byte:
                raise EOFError("SSH 终端已断开。")
            sequence.extend(byte)
            if byte in (b"A", b"B", b"C", b"D", b"~"):
                break
        return {
            b"\x1b[A": "UP",
            b"\x1b[B": "DOWN",
            b"\x1b[C": "RIGHT",
            b"\x1b[D": "LEFT",
            b"\x1bOA": "UP",
            b"\x1bOB": "DOWN",
            b"\x1bOC": "RIGHT",
            b"\x1bOD": "LEFT",
            b"\x1b[5~": "PAGEUP",
            b"\x1b[6~": "PAGEDOWN",
            b"\x1b": "ESC",
        }.get(bytes(sequence), "UNKNOWN")

    def write(self, message: str) -> None:
        """Display an operator message immediately."""
        print(message, flush=True)
