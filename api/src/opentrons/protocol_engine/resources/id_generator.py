"""Unique ID generation provider."""

from uuid import uuid4


class IdGenerator:
    """Unique ID generation provider."""

    def generate_id(self) -> str:
        """
        Generate a unique identifier.

        Uses UUIDv4 for safety in a multiprocessing environment.
        """
        return str(uuid4())
