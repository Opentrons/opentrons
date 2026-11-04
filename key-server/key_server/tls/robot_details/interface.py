from typing import AsyncGenerator, Protocol


class RobotDetails(Protocol):
    """Interface for getting robot network details."""

    async def get_details(self) -> tuple[str | None, list[str]]:
        """Get the current robot network details."""
        ...

    async def yield_details_on_change(
        self,
    ) -> AsyncGenerator[tuple[str | None, list[str]], None]:
        """Await new robot network details when they change."""
        # we need this stanza because the function has to have a yield in it to
        # return an async generator rather than a coroutine that would evaluate
        # to an async generator when awaited
        if False:
            yield (None, [])
