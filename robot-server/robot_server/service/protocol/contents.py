"""Functions and models of the contents and location of uploaded protocol."""
from dataclasses import dataclass, field, replace
from pathlib import Path
from tempfile import TemporaryDirectory

import typing

from fastapi import UploadFile

from robot_server.service.protocol.errors import ProtocolAlreadyExistsException
from robot_server.util import FileMeta, save_upload


DIR_PREFIX = 'opentrons_'
DIR_SUFFIX = '._proto_dir'


@dataclass
class Contents:
    protocol_file: FileMeta
    directory: TemporaryDirectory
    support_files: typing.List[FileMeta] = field(default_factory=list)


def create(
        protocol_file: UploadFile,
        support_files: typing.List[UploadFile]) -> Contents:
    """
    Create the temporary directory.

    :param protocol_file: The uploaded protocol file
    :param support_files: Optional support files
    """
    temp_dir = TemporaryDirectory(suffix=DIR_SUFFIX,
                                  prefix=DIR_PREFIX)

    temp_dir_path = Path(temp_dir.name)
    protocol_file_meta = save_upload(temp_dir_path, protocol_file)
    support_files_meta = [save_upload(temp_dir_path, s)
                          for s in support_files]

    return Contents(
        protocol_file=protocol_file_meta,
        support_files=support_files_meta,
        directory=temp_dir,
    )


def add(
        contents: Contents,
        support_file: UploadFile):
    """Add a support file to protocol temp directory"""
    temp_dir = Path(contents.directory.name)

    path = temp_dir / support_file.filename
    if path.exists():
        raise ProtocolAlreadyExistsException(
            f"File {support_file.filename} already exists"
        )

    file_meta = save_upload(directory=temp_dir, upload_file=support_file)

    return replace(
        contents,
        support_files=contents.support_files + [file_meta],
    )


def get_protocol_contents(contents: Contents) -> str:
    """Read the protocol file contents as a string"""
    with contents.protocol_file.path.open("r") as f:
        return f.read()


def clean_up(contents: Contents):
    """Protocol is being removed. Perform any clean up required."""
    contents.directory.cleanup()
