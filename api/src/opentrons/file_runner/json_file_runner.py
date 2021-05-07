"""File runner interfaces for JSON protocols."""
from .abstract_file_runner import AbstractFileRunner


class JsonFileRunner(AbstractFileRunner):
    """JSON protocol file runner."""

    def play(self) -> None:
        """Start (or un-pause) running the JSON protocol file."""
        raise NotImplementedError()

    def pause(self) -> None:
        """Pause the running JSON protocol file's execution."""
        raise NotImplementedError()

    def stop(self) -> None:
        """Cancel the running JSON protocol file."""
        raise NotImplementedError()
