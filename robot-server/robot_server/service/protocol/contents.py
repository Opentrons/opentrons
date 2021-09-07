"""Functions and models of the contents and location of uploaded protocol."""
import logging
import typing
from dataclasses import dataclass, field, replace
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi import UploadFile
from opentrons.util import entrypoint_util
from opentrons_shared_data.labware.dev_types import LabwareDefinition

from robot_server.service.protocol.errors import ProtocolIOException
from robot_server.util import FileMeta, save_upload


log = logging.getLogger(__name__)


DIR_PREFIX = "opentrons_"
DIR_SUFFIX = "._proto_dir"


@dataclass
class Contents:
    protocol_file: FileMeta
    directory: TemporaryDirectory
    support_files: typing.List[FileMeta] = field(default_factory=list)


def create(
    protocol_file: UploadFile, support_files: typing.List[UploadFile]
) -> Contents:
    """
    Create the temporary directory.

    :param protocol_file: The uploaded protocol file
    :param support_files: Optional support files
    :raise ProtocolIOException:
    """
    try:
        temp_dir = TemporaryDirectory(suffix=DIR_SUFFIX, prefix=DIR_PREFIX)

        try:
            temp_dir_path = Path(temp_dir.name)
            protocol_file_meta = save_upload(temp_dir_path, protocol_file)
            support_files_meta = [save_upload(temp_dir_path, s) for s in support_files]
        except IOError:
            # File saving failed. Remove the temporary directory and reraise.
            temp_dir.cleanup()
            raise
    except IOError as e:
        log.exception("Failed to save uploaded files.")
        raise ProtocolIOException(str(e))

    return Contents(
        protocol_file=protocol_file_meta,
        support_files=support_files_meta,
        directory=temp_dir,
    )


def update(contents: Contents, upload_file: UploadFile) -> Contents:
    """
    Update the contents of the protocol temp directory.

    Existing files are replaced and new files are added.

    :raise ProtocolIOException:
    """
    temp_dir = Path(contents.directory.name)
    try:
        file_meta = save_upload(directory=temp_dir, upload_file=upload_file)
    except IOError as e:
        log.exception("Failed to save uploaded file")
        raise ProtocolIOException(str(e))

    if file_meta.path == contents.protocol_file.path:
        # The protocol file has been replaced
        return replace(contents, protocol_file=file_meta)
    else:
        # A support file has been added or replaces.
        # Omit the file being replaced from existing support files (if found).
        filtered_files = [f for f in contents.support_files if f.path != file_meta.path]
        return replace(
            contents,
            support_files=filtered_files + [file_meta],
        )


def get_protocol_contents(contents: Contents) -> str:
    """Read the protocol file contents as a string"""
    with contents.protocol_file.path.open("r") as f:
        return f.read()


def get_custom_labware(contents: Contents) -> typing.Dict[str, LabwareDefinition]:
    """Get the custom labware present in this uploaded protocol."""
    # TODO (al, 2021-04-21): This is not the ideal way to feed custom
    #  labware into a protocol but it is the path of least resistance. I'd
    #  prefer a lazy loading approach, but this is a nice function and it solves
    #  the problem.
    return entrypoint_util.labware_from_paths([contents.directory.name])


def clean_up(contents: Contents):
    """Protocol is being removed. Perform any clean up required."""
    contents.directory.cleanup()
