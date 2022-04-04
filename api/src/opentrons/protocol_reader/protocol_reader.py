"""Read relevant protocol information from a set of files."""
from pathlib import Path
from typing import List, Optional, Sequence, Union, overload

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

    @overload
    async def read(
        self,
        files: Sequence[AbstractInputFile],
        directory: Path,
    ) -> ProtocolSource:
        """Read a set of files and save them to disk."""
        ...

    @overload
    async def read(self, files: Sequence[Path]) -> ProtocolSource:
        """Read a set of files already on disk."""
        ...

    async def read(
        self,
        files: Union[
            Sequence[AbstractInputFile],
            Sequence[Path],
        ],
        directory: Optional[Path] = None,
    ) -> ProtocolSource:
        """Read a set of file-like objects or paths, returning a ProtocolSource.

        Arguments:
            files: List of files or paths. Do not attempt to reuse and file-like
                objects once they've been passed to the ProtocolReader.
            directory: Name of the directory to create and place files in.
                Required if `files` is a list of `AbstractInputFile`s, unused
                if `files` is a list of `Path`'s.

        Returns:
            A validated ProtocolSource.

        Raises:
            ProtocolFilesInvalidError: Input file list given to the reader
                could not be validated as a protocol.
        """
        # TODO(mc, 2022-04-01): this assert is a bit awkward,
        # consider restructuring so it isn't needed
        if directory is None:
            assert all(isinstance(f, Path) for f in files), "Must provide a directory"

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

        if directory is not None:
            await self._file_reader_writer.write(directory=directory, files=all_files)
            main_file = directory / role_analysis.main_file.name
            output_files = [
                ProtocolSourceFile(path=directory / f.name, role=f.role)
                for f in all_files
            ]
        else:
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
            labware_definitions=role_analysis.labware_definitions,
        )
