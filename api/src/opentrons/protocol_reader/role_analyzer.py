"""Input file role analysis."""
from dataclasses import dataclass
from typing import List, Sequence, Union

from .file_identifier import (
    IdentifiedFile,
    IdentifiedJsonMain,
    IdentifiedPythonMain,
    IdentifiedLabwareDefinition,
    IdentifiedData,
)
from .protocol_files_invalid_error import ProtocolFilesInvalidError


@dataclass(frozen=True)
class RoleAnalysis:
    """Role analysis results."""

    main_file: Union[IdentifiedJsonMain, IdentifiedPythonMain]
    labware_files: List[IdentifiedLabwareDefinition]
    data_files: List[IdentifiedData]

    @property
    def all_files(self) -> List[IdentifiedFile]:
        """Return all contained files."""
        return [self.main_file, *self.labware_files, *self.data_files]


class RoleAnalysisError(ProtocolFilesInvalidError):
    """Error raised if the input file list is invalid."""


class RoleAnalyzer:
    """Input file role analysis interface."""

    @staticmethod
    def analyze(files: Sequence[IdentifiedFile]) -> RoleAnalysis:
        """Analyze a set of input files to determine the role that each one fills.

        This validates that there is exactly one main protocol file.
        """
        if len(files) == 0:
            raise RoleAnalysisError(
                message="No files were provided.", detail={"kind": "no-files"}
            )

        main_file_candidates: List[Union[IdentifiedJsonMain, IdentifiedPythonMain]] = []
        labware_files: List[IdentifiedLabwareDefinition] = []
        bundled_data_files: List[IdentifiedData] = []

        for f in files:
            if isinstance(f, (IdentifiedJsonMain, IdentifiedPythonMain)):
                main_file_candidates.append(f)
            elif isinstance(f, IdentifiedLabwareDefinition):
                labware_files.append(f)
            else:
                bundled_data_files.append(f)

        if len(main_file_candidates) == 0:
            if len(files) == 1:
                raise RoleAnalysisError(
                    message=f'"{files[0].original_file.name}" is not a valid protocol file.',
                    detail={"kind": "protocol-does-not-have-main"},
                )
            else:
                file_list = ", ".join(f'"{f.original_file.name}"' for f in files)
                raise RoleAnalysisError(
                    message=f"No valid protocol file found in {file_list}.",
                    detail={"kind": "protocol-does-not-have-main"},
                )
        elif len(main_file_candidates) > 1:
            file_list = ", ".join(
                f'"{f.original_file.name}"' for f in main_file_candidates
            )
            raise RoleAnalysisError(
                message=f"Could not pick single main file from {file_list}.",
                detail={"kind": "multiple-main-candidates"},
            )
        else:
            main_file = main_file_candidates[0]

        return RoleAnalysis(
            main_file=main_file,
            labware_files=labware_files,
            data_files=bundled_data_files,
        )
