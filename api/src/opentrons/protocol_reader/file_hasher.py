"""File hashing utiliy class."""

from typing import Sequence
import anyio
import unicodedata
from hashlib import md5
from .file_reader_writer import BufferedFile


# TODO (spp: 2024-06-17): move file hasher to utils
class FileHasher:
    """Hashing utility class that hashes a combination of protocol and labware files."""

    @staticmethod
    async def hash(files: Sequence[BufferedFile]) -> str:
        """Sort and hash a sequence of protocol and labware files."""
        return await anyio.to_thread.run_sync(_hash_sync, files)


def _hash_sync(files: Sequence[BufferedFile]) -> str:
    sorted_files = sorted(files, key=lambda x: unicodedata.normalize("NFC", x.name))
    name_content_hasher = md5()
    for file in sorted_files:
        name_hash = md5(file.name.encode("utf-8")).digest()
        contents_hash = md5(file.contents).digest()
        name_content_hasher.update(name_hash + contents_hash)
    return name_content_hasher.hexdigest()
