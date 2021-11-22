"""Read relevant protocol information from a set of files."""
from typing import Any, IO, Sequence


class ProtocolFilesInvalidError(ValueError):
    """An error raised if the input files cannot be read to a protocol."""


class ProtocolReader:
    """Collaborator to turn a set of files into a protocol object."""

    async def read(self, files: Sequence[IO[bytes]]) -> Any:
        """Read a set of file-like objects to disk, returning a ProtocolSource."""
        raise NotImplementedError("ProtocolReader not yet implemented")
