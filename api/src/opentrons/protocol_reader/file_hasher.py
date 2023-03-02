"""File hashing utiliy class."""

from typing import List
import anyio
import unicodedata
from hashlib import md5
from .file_reader_writer import BufferedFile


class FileHasher:
    """Hashing utility class that hashes a combination of protocol and labware files."""

    @staticmethod
    async def hash(files: List[BufferedFile]) -> str:
        """Sort and hash a list of protocol and labware files."""
        return await anyio.to_thread.run_sync(_hash_sync, files)


def _hash_sync(files: List[BufferedFile]) -> str:
    md5_hasher = md5()
    sorted_files = sorted(files, key=lambda x: unicodedata.normalize("NFC", x.name))
    for file in sorted_files:
        md5_hasher.update(file.name.encode("utf-8") + file.contents)
    return md5_hasher.hexdigest()
