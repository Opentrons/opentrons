"""Unique ID generation provider."""
from datetime import datetime, timezone
from uuid import uuid4


class ModelUtils:
    """Common resource model utilities provider."""

    @staticmethod
    def generate_id() -> str:
        """Generate a unique identifier.

        Uses UUIDv4 for safety in a multiprocessing environment.
        """
        return str(uuid4())

    @staticmethod
    def get_timestamp() -> datetime:
        """Get a timestamp of the current time."""
        return datetime.now(tz=timezone.utc)
