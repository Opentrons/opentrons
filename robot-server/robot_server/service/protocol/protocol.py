import typing
from datetime import datetime
from tempfile import TemporaryDirectory
from dataclasses import dataclass, field, replace
from pathlib import Path

from fastapi import UploadFile

from robot_server.service.protocol.errors import ProtocolAlreadyExistsException


@dataclass(frozen=True)
class UploadedProtocolMeta:
    name: str
    protocol_file_name: Path
    directory: TemporaryDirectory
    user_files: typing.List[str] = field(default_factory=list)
    last_modified_at: datetime = field(default_factory=datetime.utcnow)
    created_at: datetime = field(default_factory=datetime.utcnow)


class UploadedProtocol:
    DIR_PREFIX = 'opentrons_'
    DIR_SUFFIX = '._proto_dir'

    def __init__(self, protocol_file: UploadFile):
        """Constructor"""
        temp_dir = TemporaryDirectory(suffix=UploadedProtocol.DIR_SUFFIX,
                                      prefix=UploadedProtocol.DIR_PREFIX)

        protocol_file_name = Path(protocol_file.filename)
        with open(Path(temp_dir.name) / protocol_file_name, 'wb') as p:
            p.write(protocol_file.file.read())

        self._meta = UploadedProtocolMeta(
            name=protocol_file_name.stem,
            protocol_file_name=protocol_file_name,
            directory=temp_dir
        )

    def add(self, support_file: UploadFile):
        """Add a support file to protocol temp directory"""
        path = Path(self._meta.directory.name) / support_file.filename
        if path.exists():
            raise ProtocolAlreadyExistsException(
                f"File {support_file.filename} already exists"
            )

        with open(path, 'wb') as p:
            p.write(support_file.file.read())

        self._meta = replace(
            self._meta,
            user_files=self._meta.user_files + [support_file.filename],
            last_modified_at=datetime.utcnow()
        )

    def clean_up(self):
        """Protocol is being removed. Perform any clean up required."""
        self._meta.directory.cleanup()

    @property
    def meta(self) -> UploadedProtocolMeta:
        return self._meta
