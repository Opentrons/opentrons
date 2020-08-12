import logging
import typing
from datetime import datetime
from tempfile import TemporaryDirectory
from dataclasses import dataclass, field, replace
from pathlib import Path

from fastapi import UploadFile

from robot_server.service.protocol.errors import ProtocolAlreadyExistsException
from robot_server.util import FileMeta, save_upload


log = logging.getLogger(__name__)


@dataclass(frozen=True)
class UploadedProtocolMeta:
    identifier: str
    protocol_file: FileMeta
    directory: TemporaryDirectory
    support_files: typing.List[FileMeta] = field(default_factory=list)
    last_modified_at: datetime = field(default_factory=datetime.utcnow)
    created_at: datetime = field(default_factory=datetime.utcnow)


class UploadedProtocol:
    DIR_PREFIX = 'opentrons_'
    DIR_SUFFIX = '._proto_dir'

    def __init__(self,
                 protocol_id: str,
                 protocol_file: UploadFile,
                 support_files: typing.List[UploadFile]
                 ):
        """
        Constructor

        :param protocol_id: The id assigned to this protocol
        :param protocol_file: The uploaded protocol file
        :param support_files: Optional support files
        """
        temp_dir = TemporaryDirectory(suffix=UploadedProtocol.DIR_SUFFIX,
                                      prefix=UploadedProtocol.DIR_PREFIX)

        temp_dir_path = Path(temp_dir.name)
        protocol_file_meta = save_upload(temp_dir_path, protocol_file)
        support_files_meta = [save_upload(temp_dir_path, s)
                              for s in support_files]

        self._meta = UploadedProtocolMeta(
            identifier=protocol_id,
            protocol_file=protocol_file_meta,
            support_files=support_files_meta,
            directory=temp_dir
        )

    def add(self, support_file: UploadFile):
        """Add a support file to protocol temp directory"""
        temp_dir = Path(self._meta.directory.name)

        path = temp_dir / support_file.filename
        if path.exists():
            raise ProtocolAlreadyExistsException(
                f"File {support_file.filename} already exists"
            )

        file_meta = save_upload(directory=temp_dir, upload_file=support_file)

        self._meta = replace(
            self._meta,
            support_files=self._meta.support_files + [file_meta],
            last_modified_at=datetime.utcnow()
        )

    def clean_up(self):
        """Protocol is being removed. Perform any clean up required."""
        self._meta.directory.cleanup()

    @property
    def meta(self) -> UploadedProtocolMeta:
        return self._meta

    def get_contents(self) -> str:
        """Read the protocol file contents as a string"""

        with self.meta.protocol_file.path.open("r") as f:
            return f.read()
