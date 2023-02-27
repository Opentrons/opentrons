"""File hashing utiliy class."""

from typing import List
from hashlib import md5
from .file_reader_writer import BufferedFile


class FileHasher:
    """Hashing utility class that hashes a combination of protocol and labware files."""

    @staticmethod
    def hash(files: List[BufferedFile]) -> str:
        """Sort and hash a list of protocol and labware files."""
        md5_hasher = md5()
        sorted_files = sorted(files, key=lambda x: x.name)
        for file in sorted_files:
            md5_hasher.update(file.contents)
        return md5_hasher.hexdigest()
