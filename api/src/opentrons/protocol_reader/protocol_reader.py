"""Read relevant protocol information from a set of files."""
from pathlib import Path
from typing import List, Optional, Sequence

from .input_file import AbstractInputFile
from .file_reader_writer import FileReaderWriter, FileReadError
from .role_analyzer import RoleAnalyzer, RoleAnalysisFile, RoleAnalysisError
from .config_analyzer import ConfigAnalyzer, ConfigAnalysisError
from .protocol_source import ProtocolSource, ProtocolSourceFile


class ProtocolFilesInvalidError(ValueError):
    """An error raised if the input files cannot be read to a protocol."""


class ProtocolReader:
    """Collaborator to turn a set of files into a protocol object."""

    def __init__(
        self,
        file_reader_writer: Optional[FileReaderWriter] = None,
        role_analyzer: Optional[RoleAnalyzer] = None,
        config_analyzer: Optional[ConfigAnalyzer] = None,
    ) -> None:
        """Initialize the reader with its dependencies.

        Arguments:
            directory: The directory into which files will be copied.
            file_reader_writer: Input file reader/writer. Default impl. used if None.
            role_analyzer: File role analyzer. Default impl. used if None.
            config_analyzer: Protocol config analyzer. Default impl. used if None.
        """
        self._file_reader_writer = file_reader_writer or FileReaderWriter()
        self._role_analyzer = role_analyzer or RoleAnalyzer()
        self._config_analyzer = config_analyzer or ConfigAnalyzer()

    async def read_and_save(
        self, files: Sequence[AbstractInputFile], directory: Path
    ) -> ProtocolSource:
        """Compute a `ProtocolSource` from file-like objects and save them as files.

        The input is parsed and statically analyzed to ensure it's basically
        well-formed--for example, labware definition files must conform to the labware
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
            role_analysis = self._role_analyzer.analyze(buffered_files)
            config_analysis = self._config_analyzer.analyze(role_analysis.main_file)
        except (FileReadError, RoleAnalysisError, ConfigAnalysisError) as e:
            raise ProtocolFilesInvalidError(str(e)) from e

        # TODO(mc, 2021-12-07): add support for other files, like arbitrary data files
        all_files: List[RoleAnalysisFile] = [
            role_analysis.main_file,
            *role_analysis.labware_files,
        ]

        await self._file_reader_writer.write(directory=directory, files=all_files)
        main_file = directory / role_analysis.main_file.name
        output_files = [
            ProtocolSourceFile(path=directory / f.name, role=f.role) for f in all_files
        ]

        return ProtocolSource(
            directory=directory,
            main_file=main_file,
            files=output_files,
            config=config_analysis.config,
            metadata=config_analysis.metadata,
        )

    async def read_saved(
        self,
        files: Sequence[Path],
        directory: Optional[Path],
    ) -> ProtocolSource:
        """Compute a `ProtocolSource` from protocol source files on the filesystem.

        The input is parsed and statically analyzed to ensure it's basically
        well-formed--for example, labware definition files must conform to the labware
        definition schema.

        Arguments:
            files: The files comprising the protocol.
            directory: Passed through to `ProtocolSource.directory`. Otherwise unused.

        Returns:
            A ProtocolSource describing the validated protocol.

        Raises:
            ProtocolFilesInvalidError: Input file list given to the reader
                could not be validated as a protocol.
        """
        try:
            buffered_files = await self._file_reader_writer.read(files)
            role_analysis = self._role_analyzer.analyze(buffered_files)
            config_analysis = self._config_analyzer.analyze(role_analysis.main_file)
        except (FileReadError, RoleAnalysisError, ConfigAnalysisError) as e:
            raise ProtocolFilesInvalidError(str(e)) from e

        # TODO(mc, 2021-12-07): add support for other files, like arbitrary data files
        all_files: List[RoleAnalysisFile] = [
            role_analysis.main_file,
            *role_analysis.labware_files,
        ]

        # TODO(mc, 2022-04-01): these asserts are a bit awkward,
        # consider restructuring so they're not needed
        assert isinstance(role_analysis.main_file.path, Path)
        assert all(isinstance(f.path, Path) for f in all_files)

        main_file = role_analysis.main_file.path
        output_files = [
            ProtocolSourceFile(path=f.path, role=f.role)  # type: ignore[arg-type]
            for f in all_files
        ]

        return ProtocolSource(
            directory=directory,
            main_file=main_file,
            files=output_files,
            config=config_analysis.config,
            metadata=config_analysis.metadata,
        )

    async def read_saved_prevalidated(
        self,
        files: Sequence[Path],
        directory: Path,
    ) -> ProtocolSource:
        """Compute a `ProtocolSource` from already-validated protocol source files.

        This is just like `read_saved()`, except it assumes the input represents
        a protocol that's known to be valid. And instead of fully parsing and statically
        analyzing, it only does the minimum required to extract the stuff for the
        `ProtocolSource`.

        So this is faster, but it should only be used with input that's already
        been fully validated by this class at least once before.
        """
        raise NotImplementedError()
