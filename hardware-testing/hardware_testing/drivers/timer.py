"""Timer module."""
import time


class Timer:
    """Timer class to track time."""

    def __init__(self) -> None:
        """Initialize class."""
        self.start_time = 0.0
        self.elapsed_time = 0.0

    def start(self) -> None:
        """Start timer."""
        self.start_time = time.perf_counter()

    def elapsed(self) -> float:
        """Calculate elapsed time."""
        self.elapsed_time = time.perf_counter() - self.start_time
        return self.elapsed_time
