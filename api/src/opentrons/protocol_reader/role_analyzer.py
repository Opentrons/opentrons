"""Input file role analysis."""
from dataclasses import dataclass
from typing import Sequence

from opentrons.protocols.models import JsonProtocol
from .protocol_source import ProtocolFileRole
from .input_file import BufferedFile


@dataclass(frozen=True)
class RoleAnalyzedFile(BufferedFile):
    """A buffered file with its role analyzed."""

    role: ProtocolFileRole


# TODO(mc, 2021-12-07): add support for other files, like labware definitions
@dataclass(frozen=True)
class RoleAnalysis:
    """Role analysis results."""

    main_file: RoleAnalyzedFile


class RoleAnalysisError(ValueError):
    """Error raised if the input file list is invalid."""


class RoleAnalyzer:
    """Input file role analysis interface."""

    @staticmethod
    def analyze(files: Sequence[BufferedFile]) -> RoleAnalysis:
        """Analyze a set of input files to determine each of their roles."""
        if len(files) == 0:
            raise RoleAnalysisError("No files were provided.")

        # TODO(mc, 2021-12-07): support multifile protocols
        if len(files) > 1:
            raise NotImplementedError("Multi-file protocols not yet supported.")

        main_file = files[0]

        # TODO(mc, 2021-12-07): cover both clauses in this if statement with tests
        # when `data` can be more types than just JsonProtocol
        if not main_file.name.endswith(".py") and not isinstance(
            main_file.data, JsonProtocol
        ):
            raise RoleAnalysisError(f'"{main_file.name}" is not a valid protocol file.')

        return RoleAnalysis(
            main_file=RoleAnalyzedFile(
                name=main_file.name,
                contents=main_file.contents,
                data=main_file.data,
                role=ProtocolFileRole.MAIN,
            )
        )
