from datetime import datetime, timezone
from uuid import uuid4

from opentrons.hardware_control import ThreadedAsyncLock
from server_utils.util import call_once


@call_once
async def get_motion_lock() -> ThreadedAsyncLock:
    """
    Get the single motion lock.

    :return: a threaded async lock
    """
    return ThreadedAsyncLock()


async def get_unique_id() -> str:
    """Get a unique ID string to use as a resource identifier."""
    return UniqueIDFactory().get()


class UniqueIDFactory:
    """
    This is equivalent to the `get_unique_id()` free function. Wrapping it in a factory
    class makes things easier for FastAPI endpoint functions that need multiple unique
    IDs. They can do:

        unique_id_factory: UniqueIDFactory = fastapi.Depends(UniqueIDFactory)

    And then:

        unique_id_1 = await unique_id_factory.get()
        unique_id_2 = await unique_id_factory.get()
    """

    @staticmethod
    def get() -> str:
        """Get a unique ID to use as a resource identifier."""
        return str(uuid4())


async def get_current_time() -> datetime:
    """Get the current time in UTC to use as a resource timestamp."""
    return datetime.now(tz=timezone.utc)
