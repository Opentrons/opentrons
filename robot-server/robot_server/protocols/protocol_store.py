"""Methods for saving and retrieving protocol files."""
from dataclasses import dataclass
from datetime import datetime
from fastapi import UploadFile
from logging import getLogger
from pathlib import Path
from typing import Dict, List, Sequence, Union

from opentrons.protocol_runner import (
    ProtocolFile,
    ProtocolFileType,
    PreAnalyzer,
    JsonPreAnalysis,
    PythonPreAnalysis,
)

log = getLogger(__name__)


@dataclass(frozen=True)
class ProtocolResource(ProtocolFile):
    """An entry in the protocol store, used to construct response models."""

    protocol_id: str
    created_at: datetime
    pre_analysis: Union[JsonPreAnalysis, PythonPreAnalysis]


class ProtocolNotFoundError(KeyError):
    """Error raised when a protocol ID was not found in the store."""

    def __init__(self, protocol_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(f"Protocol {protocol_id} was not found.")


class ProtocolFileInvalidError(ValueError):
    """Error raised when a given source file is invalid.

    May be caused by an empty filename.
    """

    pass


class ProtocolStore:
    """Methods for storing and retrieving protocol files."""

    def __init__(self, directory: Path, pre_analyzer: PreAnalyzer) -> None:
        """Initialize the ProtocolStore.

        Arguments:
            directory: Directory in which to place created files.

            pre_analyzer: Called to extract basic info from protocols when they are
            `create()`ed.
        """
        self._directory = directory
        self._pre_analyzer = pre_analyzer
        self._protocols_by_id: Dict[str, ProtocolResource] = {}

    async def create(
        self,
        protocol_id: str,
        created_at: datetime,
        files: Sequence[UploadFile],
    ) -> ProtocolResource:
        """Add a protocol to the store."""
        protocol_dir = self._get_protocol_dir(protocol_id)
        # TODO(mc, 2021-06-02): check for protocol collision
        protocol_dir.mkdir(parents=True)
        saved_files: List[Path] = []

        for index, upload_file in enumerate(files):
            if upload_file.filename == "":
                raise ProtocolFileInvalidError(f"File {index} is missing a filename")

            contents = await upload_file.read()
            file_path = protocol_dir / upload_file.filename

            if isinstance(contents, str):
                file_path.write_text(contents, "utf-8")
            else:
                file_path.write_bytes(contents)

            saved_files.append(file_path)

        pre_analysis = self._pre_analyzer.analyze(saved_files)

        entry = ProtocolResource(
            protocol_id=protocol_id,
            protocol_type=self._get_protocol_type(pre_analysis),
            pre_analysis=pre_analysis,
            created_at=created_at,
            files=saved_files,
        )

        self._protocols_by_id[protocol_id] = entry

        return entry

    def get(self, protocol_id: str) -> ProtocolResource:
        """Get a single protocol by ID."""
        try:
            return self._protocols_by_id[protocol_id]
        except KeyError as e:
            raise ProtocolNotFoundError(protocol_id) from e

    def get_all(self) -> List[ProtocolResource]:
        """Get all protocols currently saved in this store."""
        return list(self._protocols_by_id.values())

    def remove(self, protocol_id: str) -> ProtocolResource:
        """Remove a protocol from the store."""
        try:
            entry = self._protocols_by_id.pop(protocol_id)
        except KeyError as e:
            raise ProtocolNotFoundError(protocol_id) from e

        try:
            for file_path in entry.files:
                file_path.unlink()
            self._get_protocol_dir(protocol_id).rmdir()
        except Exception as e:
            log.warning(
                f"Unable to delete all files for protocol {protocol_id}",
                exc_info=e,
            )

        return entry

    def _get_protocol_dir(self, protocol_id: str) -> Path:
        return self._directory / protocol_id

    @staticmethod
    def _get_protocol_type(
        pre_analysis: Union[JsonPreAnalysis, PythonPreAnalysis]
    ) -> ProtocolFileType:
        if isinstance(pre_analysis, JsonPreAnalysis):
            return ProtocolFileType.JSON
        else:
            return ProtocolFileType.PYTHON
