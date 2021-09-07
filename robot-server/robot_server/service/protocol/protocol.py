"""Internal models of uploaded protocol"""
import logging
import typing
from contextlib import contextmanager
from datetime import datetime
from dataclasses import dataclass, field

from fastapi import UploadFile
from opentrons_shared_data.labware.dev_types import LabwareDefinition

from robot_server.service.protocol import contents, analyze, environment
from opentrons.util.helpers import utc_now

log = logging.getLogger(__name__)


@dataclass
class UploadedProtocolData:
    identifier: str
    contents: contents.Contents
    analysis_result: analyze.AnalysisResult
    last_modified_at: datetime = field(default_factory=utc_now)
    created_at: datetime = field(default_factory=utc_now)


class UploadedProtocol:
    # TODO AL 20201219 - make the methods of this class async
    def __init__(self, data: UploadedProtocolData):
        """Constructor"""
        self._data = data

    @classmethod
    def create(
        cls,
        protocol_id: str,
        protocol_file: UploadFile,
        support_files: typing.List[UploadFile],
    ) -> "UploadedProtocol":
        """
        Create the UploadedProtocol object. The protocol is analyzed after the
         files are saved.

        :param protocol_id: The id assigned to this protocol
        :param protocol_file: The uploaded protocol file
        :param support_files: Optional support files

        :raise ProtocolIOException: On failure to save uploaded files.
        :raise ProtocolAnalysisException: On failure to analyze the protocol.
        """
        protocol_contents = contents.create(
            protocol_file=protocol_file,
            support_files=support_files,
        )
        analysis_results = analyze.analyze_protocol(protocol_contents)

        return cls(
            UploadedProtocolData(
                identifier=protocol_id,
                analysis_result=analysis_results,
                contents=protocol_contents,
            )
        )

    def update(self, support_file: UploadFile) -> None:
        """
        Add or replace a file in the protocol temp directory.

        :raise ProtocolIOException: On failure to save uploaded file.
        """
        c = contents.update(self._data.contents, support_file)

        # Re-analyze protocol
        self._data.analysis_result = analyze.analyze_protocol(c)
        self._data.last_modified_at = utc_now()
        self._data.contents = c

    def clean_up(self) -> None:
        """Protocol is being removed. Perform any clean up required."""
        contents.clean_up(self._data.contents)

    @property
    def data(self) -> UploadedProtocolData:
        return self._data

    def get_contents(self) -> str:
        """Read the protocol file contents as a string"""
        return contents.get_protocol_contents(self._data.contents)

    def get_custom_labware(self) -> typing.Dict[str, LabwareDefinition]:
        """Read the protocol file contents as a string"""
        return contents.get_custom_labware(self._data.contents)

    @contextmanager
    def protocol_environment(self):
        """Context manager used to run a protocol within the environment
        created by the uploaded protocol."""
        with environment.protocol_environment(self._data.contents):
            yield self
