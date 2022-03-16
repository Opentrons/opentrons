from typing_extensions import Protocol


class Stoppable(Protocol):
    """Protocol specifying controllability of teardown"""

    async def clean_up(self) -> None:
        """Get the API ready to stop cleanly."""
        ...
