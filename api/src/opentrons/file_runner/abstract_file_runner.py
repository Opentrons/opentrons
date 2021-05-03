"""Abstract interfaces for protocol file running."""
from abc import ABC, abstractmethod


class AbstractFileRunner(ABC):
    """Abstract interface for an object that can run protocol files."""

    @abstractmethod
    def load(self) -> None:
        """Prepare to run the protocol file."""
        ...

    @abstractmethod
    def play(self) -> None:
        """Start (or un-pause) running the protocol file."""
        ...

    @abstractmethod
    def pause(self) -> None:
        """Pause the running protocol file's execution."""
        ...

    @abstractmethod
    def stop(self) -> None:
        """Cancel the running protocol file."""
        ...
