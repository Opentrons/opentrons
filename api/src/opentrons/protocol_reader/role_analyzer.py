"""Input file role analysis."""
from dataclasses import dataclass
from typing import List, Sequence

from .protocol_source import ProtocolFileRole
from .input_file import BufferedFile


@dataclass(frozen=True)
class RoleAnalyzedFile(BufferedFile):
    """A buffered file with its role analyzed."""

    role: ProtocolFileRole


@dataclass(frozen=True)
class RoleAnalysis:
    """Role analysis results."""

    main_file: RoleAnalyzedFile
    other_files: List[RoleAnalyzedFile]


class RoleAnalyzer:
    """Input file role analysis interface."""

    @staticmethod
    def analyze(files: Sequence[BufferedFile]) -> RoleAnalysis:
        """Analyze a set of input files to determine each of their roles."""
        raise NotImplementedError("RoleAnalyzer not yet implemented")
