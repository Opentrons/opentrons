"""Abstract interfaces for protocol file running."""
from abc import ABC, abstractmethod


class AbstractFileRunner(ABC):
    """Abstract interface for an object that can run protocol files."""

    @abstractmethod
    def load(self) -> None:
        """Prepare runner and engine state prior to starting the run."""
        ...

    @abstractmethod
    async def run(self) -> None:
        """Run the protocol file to completion."""
        ...

    @abstractmethod
    def play(self) -> None:
        """Resume running the protocol file after a pause."""
        ...

    @abstractmethod
    def pause(self) -> None:
        """Pause the running protocol file's execution."""
        ...

    @abstractmethod
    def stop(self) -> None:
        """Cancel the running protocol file."""
        ...
