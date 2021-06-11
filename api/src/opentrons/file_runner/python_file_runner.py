"""File runner interfaces for Python protocols."""
from .abstract_file_runner import AbstractFileRunner


class PythonFileRunner(AbstractFileRunner):
    """Python protocol file runner."""

    def load(self) -> None:
        """Prepare to run the Python protocol file."""
        raise NotImplementedError("Python protocol loading not implemented")

    def play(self) -> None:
        """Start (or un-pause) running the Python protocol file."""
        raise NotImplementedError()

    def pause(self) -> None:
        """Pause the running Python protocol file's execution."""
        raise NotImplementedError()

    def stop(self) -> None:
        """Cancel the running Python protocol file."""
        raise NotImplementedError()
