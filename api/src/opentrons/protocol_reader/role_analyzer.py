from dataclasses import dataclass
from typing import Union, List, Sequence

from .basic_info_extractor import (
    FileInfo,
    JsonProtocolFileInfo,
    PythonProtocolFileInfo,
    LabwareDefinitionFileInfo,
)


# FIX BEFORE MERGE: Rename exception.
class RoleAnalysisError(ValueError):
    pass


@dataclass(frozen=True)
class RoleAnalysis:
    main_file: Union[JsonProtocolFileInfo, PythonProtocolFileInfo]
    labware_files: List[LabwareDefinitionFileInfo]
    # todo(mm, 2022-12-19): Add data files like .txt and .csv.

    @property
    def all_files(self) -> List[FileInfo]:
        return [self.main_file, *self.labware_files]


class RoleAnalyzer:
    @staticmethod
    def analyze(files: Sequence[FileInfo]) -> RoleAnalysis:
        """Analyze a set of input files to determine each of their roles."""
        if len(files) == 0:
            raise RoleAnalysisError("No files were provided.")

        main_file_candidates = []
        labware_files = []

        for f in files:
            if isinstance(f, (JsonProtocolFileInfo, PythonProtocolFileInfo)):
                main_file_candidates.append(f)
            else:
                # todo(mm, 2022-12-21): Support data files like .txt and .csv.
                assert isinstance(f, LabwareDefinitionFileInfo)
                labware_files.append(f)

        if len(main_file_candidates) == 0:
            if len(files) == 1:
                raise RoleAnalysisError(
                    f'"{files[0].original_file.name}" is not a valid protocol file.'
                )
            else:
                file_list = ", ".join(f'"{f.original_file.name}"' for f in files)
                raise RoleAnalysisError(f"No valid protocol file found in {file_list}.")
        elif len(main_file_candidates) > 1:
            file_list = ", ".join(
                f'"{f.original_file.name}"' for f in main_file_candidates
            )
            raise RoleAnalysisError(
                f"Could not pick single main file from {file_list}."
            )
        else:
            main_file = main_file_candidates[0]

        return RoleAnalysis(
            main_file=main_file,
            labware_files=labware_files,
        )
