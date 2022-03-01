"""Unique ID generation provider."""
from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional


class ModelUtils:
    """Common resource model utilities provider."""

    @staticmethod
    def generate_fake_serial_number() -> str:
        """Generate a unique stand-in for a serial number.

        This is meant to be used for protocol analysis (simulation),
        where commands like module loads are supposed to report a serial number,
        but there is no actual physical hardware to provide that serial number.
        """
        return f"fake-serial-number-{uuid4()}"

    @staticmethod
    def generate_id() -> str:
        """Generate a unique identifier.

        Uses UUIDv4 for safety in a multiprocessing environment.
        """
        return str(uuid4())

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
