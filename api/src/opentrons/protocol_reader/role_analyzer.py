"""Input file role analysis."""
from dataclasses import dataclass
from typing import List, Sequence

from opentrons.protocols.models import JsonProtocol, LabwareDefinition
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


class RoleAnalysisError(ValueError):
    """Error raised if the input file list is invalid."""


class RoleAnalyzer:
    """Input file role analysis interface."""

    @staticmethod
    def analyze(files: Sequence[BufferedFile]) -> RoleAnalysis:
        """Analyze a set of input files to determine each of their roles."""
        python_files = [f for f in files if f.name.endswith(".py")]
        json_files = [f for f in files if f.name.endswith(".json")]

        if len(files) == 0:
            raise RoleAnalysisError("No files were provided.")

        if len(files) == 1:
            main_file = files[0]

            if not main_file.name.endswith(".py") and not isinstance(
                main_file.data, JsonProtocol
            ):
                raise RoleAnalysisError(
                    f"{main_file.name} is not a valid protocol file."
                )

        elif len(python_files) == 1:
            main_file = python_files[0]

        elif len(python_files) > 1:
            init_files = [f for f in files if f.name == "__init__.py"]

            if len(init_files) == 0:
                raise RoleAnalysisError(
                    "If protocol contains multiple Python files, "
                    " the main file must be named __init__.py."
                )

            if len(init_files) > 1:
                raise RoleAnalysisError("Multiple __init__.py files provided.")

            main_file = init_files[0]

        elif len(json_files) > 1:
            raise RoleAnalysisError("A JSON protocol must consist of a single file.")

        else:
            raise RoleAnalysisError("No valid main protocol file found.")

        return RoleAnalysis(
            main_file=RoleAnalyzedFile(
                name=main_file.name,
                contents=main_file.contents,
                data=main_file.data,
                role=ProtocolFileRole.MAIN,
            ),
            other_files=[
                RoleAnalyzedFile(
                    name=f.name,
                    contents=f.contents,
                    data=f.data,
                    role=RoleAnalyzer._get_support_file_role(f),
                )
                for f in files
                if f != main_file
            ],
        )

    @staticmethod
    def _get_support_file_role(support_file: BufferedFile) -> ProtocolFileRole:
        if support_file.name.endswith(".py"):
            return ProtocolFileRole.PYTHON_SUPPORT

        if isinstance(support_file.data, LabwareDefinition):
            return ProtocolFileRole.LABWARE_DEFINITION

        return ProtocolFileRole.DATA
