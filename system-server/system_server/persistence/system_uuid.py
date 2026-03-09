"""Generates a UUID in the persistence directory."""
from uuid import UUID, uuid4
from pathlib import Path


async def get_system_uuid(path: Path) -> UUID:
    """Get a saved UUID if it exists, or create a new one."""
    if not path.exists():
        path.write_bytes(data=uuid4().bytes)

    return UUID(bytes=path.read_bytes())
