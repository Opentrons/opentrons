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
