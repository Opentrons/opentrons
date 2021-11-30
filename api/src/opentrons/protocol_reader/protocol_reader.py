"""Read relevant protocol information from a set of files."""
from pathlib import Path
from typing import Optional, Sequence

from .input_file import AbstractInputFile
from .file_reader_writer import FileReaderWriter
from .role_analyzer import RoleAnalyzer
from .config_analyzer import ConfigAnalyzer
from .protocol_source import ProtocolSource, ProtocolSourceFile


class ProtocolFilesInvalidError(ValueError):
    """An error raised if the input files cannot be read to a protocol."""


class ProtocolReader:
    """Collaborator to turn a set of files into a protocol object."""

    def __init__(
        self,
        directory: Path,
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
        self._directory = directory
        self._file_reader_writer = file_reader_writer or FileReaderWriter()
        self._role_analyzer = role_analyzer or RoleAnalyzer()
        self._config_analyzer = config_analyzer or ConfigAnalyzer()

    async def read(
        self,
        name: str,
        files: Sequence[AbstractInputFile],
    ) -> ProtocolSource:
        """Read a set of file-like objects to disk, returning a ProtocolSource.

        Arguments:
            name: Name of the directory to create and place files in.
            files: List of files. Do not attempt to reuse and file-like objects
                in this list once they've been passed to the ProtocolReader.

        Returns:
            A validated ProtocolSource.

        Raises:
            ProtocolFilesInvalidError: Input file list given to the reader
                could not be validated as a protocol.
        """
        directory = self._directory / name
        buffered_files = await self._file_reader_writer.read(files)
        role_analysis = self._role_analyzer.analyze(buffered_files)
        config_analysis = self._config_analyzer.analyze(role_analysis.main_file)
        all_files = [role_analysis.main_file] + role_analysis.other_files

        await self._file_reader_writer.write(directory=directory, files=all_files)

        return ProtocolSource(
            directory=directory,
            main_file=directory / role_analysis.main_file.name,
            config=config_analysis.config,
            metadata=config_analysis.metadata,
            files=[ProtocolSourceFile(name=f.name, role=f.role) for f in all_files],
        )
