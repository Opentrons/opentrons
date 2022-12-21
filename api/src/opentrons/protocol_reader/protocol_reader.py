"""Read relevant protocol information from a set of files."""
from pathlib import Path
from typing import List, Optional, Sequence

from .input_file import AbstractInputFile
from .basic_info_extractor import (
    BasicInfo,
    BasicInfoExtractor,
    FileInfo,
    JsonProtocolFileInfo,
    PythonProtocolFileInfo,
    LabwareDefinitionFileInfo,
)
from .file_format_validator import FileFormatValidator
from .file_reader_writer import FileReaderWriter, FileReadError
from .protocol_source import (
    ProtocolSource,
    ProtocolSourceFile,
    ProtocolConfig,
    ProtocolFileRole,
    JsonProtocolConfig,
    PythonProtocolConfig,
)


class ProtocolFilesInvalidError(ValueError):
    """An error raised if the input files cannot be read to a protocol."""


class ProtocolReader:
    """Collaborator to turn a set of files into a protocol object."""

    def __init__(
        self,
        file_reader_writer: Optional[FileReaderWriter] = None,
        basic_info_extractor: Optional[BasicInfoExtractor] = None,
        file_format_validator: Optional[FileFormatValidator] = None,
    ) -> None:
        """Initialize the reader with its dependencies.

        Arguments:
            file_reader_writer: Input file reader/writer. Default impl. used if None.
            basic_info_extractor: Extracts basic info from protocols. Default impl. used
                if None.
            config_analyzer: Protocol config analyzer. Default impl. used if None.
        """
        self._file_reader_writer = file_reader_writer or FileReaderWriter()
        self._basic_info_extractor = basic_info_extractor or BasicInfoExtractor()
        self._file_format_validator = file_format_validator or FileFormatValidator()

    async def read_and_save(
        self, files: Sequence[AbstractInputFile], directory: Path
    ) -> ProtocolSource:
        """Compute a `ProtocolSource` from file-like objects and save them as files.

        The input is parsed and statically analyzed to ensure it's basically
        well-formed. For example, labware definition files must conform to the labware
        definition schema.

        Arguments:
            files: List of files-like objects. Do not attempt to reuse any objects
                objects in this list once they've been passed to the ProtocolReader.
            directory: Name of the directory to create and place files in.

        Returns:
            A ProtocolSource describing the validated protocol.

        Raises:
            ProtocolFilesInvalidError: Input file list given to the reader
                could not be validated as a protocol.
        """
        try:
            buffered_files = await self._file_reader_writer.read(files)
            basic_info = await self._basic_info_extractor.extract(buffered_files)
            await self._file_format_validator.validate(basic_info.all_files)
        except Exception as e:
            # FIX BEFORE MERGE: Catch specific exception types
            raise ProtocolFilesInvalidError(str(e)) from e

        files_to_write = [f.original_file for f in basic_info.all_files]
        await self._file_reader_writer.write(directory=directory, files=files_to_write)

        main_file = directory / basic_info.main_file.original_file.name
        output_files = [
            ProtocolSourceFile(
                path=directory / f.original_file.name, role=self._map_file_role(f)
            )
            for f in basic_info.all_files
        ]

        return ProtocolSource(
            directory=directory,
            main_file=main_file,
            files=output_files,
            config=self._map_config(basic_info),
            metadata=basic_info.main_file.metadata,
        )

    async def read_saved(
        self,
        files: Sequence[Path],
        directory: Optional[Path],
        files_are_prevalidated: bool = False,
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

        Returns:
            A `ProtocolSource` describing the validated protocol.

        Raises:
            ProtocolFilesInvalidError: Input file list given to the reader
                could not be validated as a protocol.
        """
        try:
            buffered_files = await self._file_reader_writer.read(files)
            basic_info = await self._basic_info_extractor.extract(buffered_files)
            if not files_are_prevalidated:
                await self._file_format_validator.validate(basic_info.all_files)
        except Exception as e:
            # FIX BEFORE MERGE: Catch specific exception types
            raise ProtocolFilesInvalidError(str(e)) from e

        # We know these paths will not be None because we supplied real Paths,
        # not AbstractInputFiles, to FileReaderWriter.
        # TODO(mc, 2022-04-01): these asserts are a bit awkward,
        # consider restructuring so they're not needed.
        assert isinstance(basic_info.main_file.original_file.path, Path)
        assert all(isinstance(f.original_file.path, Path) for f in basic_info.all_files)

        main_file = basic_info.main_file.original_file.path
        output_files = [
            ProtocolSourceFile(path=f.original_file.path, role=self._map_file_role(f))  # type: ignore[arg-type]
            for f in basic_info.all_files
        ]

        return ProtocolSource(
            directory=directory,
            main_file=main_file,
            files=output_files,
            config=self._map_config(basic_info),
            metadata=basic_info.main_file.metadata,
        )

    @staticmethod
    def _map_file_role(file: FileInfo) -> ProtocolFileRole:
        if isinstance(file, (JsonProtocolFileInfo, PythonProtocolFileInfo)):
            return ProtocolFileRole.MAIN
        elif isinstance(file, LabwareDefinitionFileInfo):
            return ProtocolFileRole.LABWARE

    @staticmethod
    def _map_config(protocol_info: BasicInfo) -> ProtocolConfig:
        if isinstance(protocol_info.main_file, JsonProtocolFileInfo):
            return JsonProtocolConfig(
                schema_version=protocol_info.main_file.schema_version
            )
        elif isinstance(protocol_info.main_file, PythonProtocolFileInfo):
            return PythonProtocolConfig(api_version=protocol_info.main_file.api_level)
