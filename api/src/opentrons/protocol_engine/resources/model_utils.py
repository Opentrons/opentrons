"""Unique ID generation provider."""
from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional


class ModelUtils:
    """Common resource model utilities provider."""

    @staticmethod
    def generate_id(prefix: str = "") -> str:
        """Generate a unique identifier.

        Uses UUIDv4 for safety in a multiprocessing environment.

        Params:
            prefix: Prepended to the UUIDv4.
        """
        return prefix + str(uuid4())

    @staticmethod
    def ensure_id(maybe_id: Optional[str] = None) -> str:
        """Generate a unique identifier only if the given input is None.

        Uses UUIDv4 for safety in a multiprocessing environment.
        """
        return maybe_id if maybe_id is not None else ModelUtils.generate_id()

    @staticmethod
    def get_timestamp() -> datetime:
        """Get a timestamp of the current time."""
        return datetime.now(tz=timezone.utc)
