"""Read relevant protocol information from a set of files."""
from pathlib import Path
from typing import Optional, Sequence

from .input_file import AbstractInputFile
from .input_reader import InputReader
from .role_analyzer import RoleAnalyzer
from .config_analyzer import ConfigAnalyzer
from .file_writer import FileWriter
from .protocol_source import ProtocolSource, ProtocolSourceFile


class ProtocolFilesInvalidError(ValueError):
    """An error raised if the input files cannot be read to a protocol."""


class ProtocolReader:
    """Collaborator to turn a set of files into a protocol object."""

    def __init__(
        self,
        directory: Path,
        input_reader: Optional[InputReader] = None,
        role_analyzer: Optional[RoleAnalyzer] = None,
        config_analyzer: Optional[ConfigAnalyzer] = None,
        file_writer: Optional[FileWriter] = None,
    ) -> None:
        """Initialize the reader with its dependencies.

        Arguments:
            directory: The directory into which files will be copied.
            input_reader: Input file reader. Default impl. used if None.
            role_analyzer: File role analyzer. Default impl. used if None.
            config_analyzer: Protocol config analyzer. Default impl. used if None.
            file_writer: File writer interface. Default impl. used if None.
        """
        self._directory = directory
        self._input_reader = input_reader or InputReader()
        self._role_analyzer = role_analyzer or RoleAnalyzer()
        self._config_analyzer = config_analyzer or ConfigAnalyzer()
        self._file_writer = file_writer or FileWriter()

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
        buffered_files = await self._input_reader.read(files)
        role_analysis = self._role_analyzer.analyze(buffered_files)
        config_analysis = self._config_analyzer.analyze(role_analysis.main_file)
        all_files = [role_analysis.main_file] + role_analysis.other_files

        await self._file_writer.write(directory=directory, files=all_files)

        return ProtocolSource(
            directory=directory,
            main_file=directory / role_analysis.main_file.name,
            config=config_analysis.config,
            metadata=config_analysis.metadata,
            files=[ProtocolSourceFile(name=f.name, role=f.role) for f in all_files],
        )
