"""Read relevant protocol information from a set of files."""
from pathlib import Path
from typing import Optional, Sequence

from opentrons.protocols.parse import PythonParseMode

from .file_identifier import (
    FileIdentifier,
    IdentifiedFile,
    IdentifiedJsonMain,
    IdentifiedPythonMain,
    IdentifiedLabwareDefinition,
    IdentifiedData,
)
from .role_analyzer import RoleAnalyzer, RoleAnalysis
from .file_format_validator import FileFormatValidator
from .file_reader_writer import FileReaderWriter, BufferedFile
from .file_hasher import FileHasher
from .protocol_source import (
    ProtocolSource,
    ProtocolSourceFile,
    ProtocolConfig,
    ProtocolFileRole,
    JsonProtocolConfig,
    PythonProtocolConfig,
)


class ProtocolReader:
    """Collaborator to turn a set of files into a protocol object."""

    def __init__(
        self,
        file_reader_writer: Optional[FileReaderWriter] = None,
        file_identifier: Optional[FileIdentifier] = None,
        role_analyzer: Optional[RoleAnalyzer] = None,
        file_format_validator: Optional[FileFormatValidator] = None,
        file_hasher: Optional[FileHasher] = None,
    ) -> None:
        """Initialize the reader with its dependencies.

        Arguments:
            file_reader_writer: Input file reader/writer. Default impl. used if None.
            file_identifier: File identifier. Default impl. used if None.
            role_analyzer: File role analyzer. Default impl. used if None.
            file_format_validator: File format validator. Default impl. used if None.
            file_hasher: File hasher. Default impl. used if None.
        """
        self._file_reader_writer = file_reader_writer or FileReaderWriter()
        self._file_identifier = file_identifier or FileIdentifier()
        self._role_analyzer = role_analyzer or RoleAnalyzer()
        self._file_format_validator = file_format_validator or FileFormatValidator()
        self._file_hasher = file_hasher or FileHasher()

    async def save(
        self,
        files: Sequence[BufferedFile],
        directory: Path,
        content_hash: str,
    ) -> ProtocolSource:
        """Compute a `ProtocolSource` from buffered files and save them as files.

        The input is parsed and statically analyzed to ensure it's basically
        well-formed. For example, labware definition files must conform to the labware
        definition schema.

        Arguments:
            files: List buffered files. Do not attempt to reuse any objects
                in this list once they've been passed to the ProtocolReader.
            directory: Name of the directory to create and place files in.

        Returns:
            A ProtocolSource describing the validated protocol.

        Raises:
            ProtocolFilesInvalidError: Input file list given to the reader
                could not be validated as a protocol.
        """
        identified_files = await self._file_identifier.identify(
            files, python_parse_mode=PythonParseMode.NORMAL
        )
        role_analysis = self._role_analyzer.analyze(identified_files)
        await self._file_format_validator.validate(role_analysis.all_files)

        files_to_write = [f.original_file for f in role_analysis.all_files]
        await self._file_reader_writer.write(directory=directory, files=files_to_write)

        main_file = directory / role_analysis.main_file.original_file.name
        output_files = [
            ProtocolSourceFile(
                path=directory / f.original_file.name, role=self._map_file_role(f)
            )
            for f in role_analysis.all_files
        ]

        return ProtocolSource(
            directory=directory,
            main_file=main_file,
            content_hash=content_hash,
            files=output_files,
            config=self._map_config(role_analysis),
            robot_type=role_analysis.main_file.robot_type,
            metadata=role_analysis.main_file.metadata,
        )

    async def read_saved(
        self,
        files: Sequence[Path],
        directory: Optional[Path],
        files_are_prevalidated: bool = False,
        python_parse_mode: PythonParseMode = PythonParseMode.NORMAL,
    ) -> ProtocolSource:
        """Compute a `ProtocolSource` from protocol source files on the filesystem.

        The input is parsed and statically analyzed to ensure it's basically
        well-formed. For example, labware definition files must conform to the labware
        definition schema.

        Arguments:
            files: The files comprising the protocol.
            directory: Passed through to `ProtocolSource.directory`. Otherwise unused.
            files_are_prevalidated: Assume that the input files are valid. Skip full
                parsing and validation, doing only the minimum required to extract the
                stuff for the `ProtocolSource`. This can be 10-100x faster, but you
                should only do it with protocols that have already been validated
                by this module.
            python_parse_mode: See the documentation in `PythonParseMode`.

        Returns:
            A `ProtocolSource` describing the validated protocol.

        Raises:
            ProtocolFilesInvalidError: Input file list given to the reader
                could not be validated as a protocol.
        """
        buffered_files = await self._file_reader_writer.read(files)
        identified_files = await self._file_identifier.identify(
            files=buffered_files,
            python_parse_mode=python_parse_mode,
        )
        role_analysis = self._role_analyzer.analyze(identified_files)
        if not files_are_prevalidated:
            await self._file_format_validator.validate(role_analysis.all_files)

        # We know these paths will not be None because we supplied real Paths,
        # not AbstractInputFiles, to FileReaderWriter.
        # TODO(mc, 2022-04-01): these asserts are a bit awkward,
        # consider restructuring so they're not needed.
        assert isinstance(role_analysis.main_file.original_file.path, Path)
        assert all(
            isinstance(f.original_file.path, Path) for f in role_analysis.all_files
        )

        main_file = role_analysis.main_file.original_file.path
        content_hash = await self._file_hasher.hash(buffered_files)

        output_files = [
            ProtocolSourceFile(path=f.original_file.path, role=self._map_file_role(f))  # type: ignore[arg-type]
            for f in role_analysis.all_files
        ]

        return ProtocolSource(
            directory=directory,
            main_file=main_file,
            content_hash=content_hash,
            files=output_files,
            config=self._map_config(role_analysis),
            robot_type=role_analysis.main_file.robot_type,
            metadata=role_analysis.main_file.metadata,
        )

    @staticmethod
    def _map_file_role(file: IdentifiedFile) -> ProtocolFileRole:
        if isinstance(file, (IdentifiedJsonMain, IdentifiedPythonMain)):
            return ProtocolFileRole.MAIN
        elif isinstance(file, IdentifiedLabwareDefinition):
            return ProtocolFileRole.LABWARE
        elif isinstance(file, IdentifiedData):
            return ProtocolFileRole.DATA

    @staticmethod
    def _map_config(protocol_info: RoleAnalysis) -> ProtocolConfig:
        if isinstance(protocol_info.main_file, IdentifiedJsonMain):
            return JsonProtocolConfig(
                schema_version=protocol_info.main_file.schema_version
            )
        elif isinstance(protocol_info.main_file, IdentifiedPythonMain):
            return PythonProtocolConfig(api_version=protocol_info.main_file.api_level)
