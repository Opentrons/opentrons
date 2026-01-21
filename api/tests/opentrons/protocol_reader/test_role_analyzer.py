"""Tests for opentrons.protocol_reader.role_analyzer.RoleAnalyzer."""

from typing import List, Union

import pytest

from opentrons.protocol_reader.file_identifier import (
    IdentifiedData,
    IdentifiedFile,
    IdentifiedJsonMain,
    IdentifiedLabwareDefinition,
    IdentifiedPythonMain,
)
from opentrons.protocol_reader.file_reader_writer import BufferedFile
from opentrons.protocol_reader.role_analyzer import (
    RoleAnalysis,
    RoleAnalysisError,
    RoleAnalyzer,
)
from opentrons.protocols.api_support.types import APIVersion


def dummy_python_protocol_file(file_name: str) -> IdentifiedPythonMain:
    """Return a IdentifiedPythonMain with trivial placeholder data."""
    return IdentifiedPythonMain(
        original_file=BufferedFile(name=file_name, path=None, contents=b""),
        api_level=APIVersion(9001, 9001),
        robot_type="OT-2 Standard",
        metadata={},
    )


def dummy_json_protocol_file(file_name: str) -> IdentifiedJsonMain:
    """Return a IdentifiedJsonMain with trivial placeholder data."""
    return IdentifiedJsonMain(
        original_file=BufferedFile(
            name=file_name,
            contents=b"",
            path=None,
        ),
        unvalidated_json={},
        schema_version=123,
        robot_type="OT-2 Standard",
        metadata={},
    )


def dummy_labware_definition_file(file_name: str) -> IdentifiedLabwareDefinition:
    """Return a IdentifiedLabwareDefinition with trivial placeholder data."""
    return IdentifiedLabwareDefinition(
        original_file=BufferedFile(
            name=file_name,
            contents=b"",
            path=None,
        ),
        unvalidated_json={},
    )


def dummy_data_file(file_name: str) -> IdentifiedData:
    """Return an IdentifiedData with trivial placeholder data."""
    return IdentifiedData(
        original_file=BufferedFile(
            name=file_name,
            contents=b"",
            path=None,
        )
    )


def test_role_analysis_all_files() -> None:
    """It should return all member files."""
    main_file = dummy_python_protocol_file(file_name="main")
    labware_file_1 = dummy_labware_definition_file(file_name="labware_1")
    labware_file_2 = dummy_labware_definition_file(file_name="labware_2")
    data_file_1 = dummy_data_file(file_name="data_1")
    data_file_2 = dummy_data_file(file_name="data_2")
    subject = RoleAnalysis(
        main_file=main_file,
        labware_files=[labware_file_1, labware_file_2],
        data_files=[data_file_1, data_file_2],
    )
    assert subject.all_files == [
        main_file,
        labware_file_1,
        labware_file_2,
        data_file_1,
        data_file_2,
    ]


@pytest.mark.parametrize(
    "main_file",
    [
        dummy_python_protocol_file(file_name="main_file_name"),
        dummy_json_protocol_file(file_name="main_file_name"),
    ],
)
@pytest.mark.parametrize(
    "labware_files",
    [
        [],
        [
            IdentifiedLabwareDefinition(
                original_file=BufferedFile(
                    name="labware_1_file_name",
                    contents=b"",
                    path=None,
                ),
                unvalidated_json={},
            ),
            IdentifiedLabwareDefinition(
                original_file=BufferedFile(
                    name="labware_2_file_name",
                    contents=b"",
                    path=None,
                ),
                unvalidated_json={},
            ),
        ],
    ],
)
@pytest.mark.parametrize(
    "data_files",
    [
        [],
        [
            IdentifiedData(
                original_file=BufferedFile(
                    name="data_1_file_name",
                    contents=b"",
                    path=None,
                ),
            ),
            IdentifiedData(
                original_file=BufferedFile(
                    name="data_2_file_name",
                    contents=b"",
                    path=None,
                ),
            ),
        ],
    ],
)
def test_success(
    main_file: Union[IdentifiedJsonMain, IdentifiedPythonMain],
    labware_files: List[IdentifiedLabwareDefinition],
    data_files: List[IdentifiedData],
) -> None:
    """It should return everything in the input file list, separated by type."""
    subject = RoleAnalyzer()
    all_files = [main_file, *labware_files, *data_files]
    result = subject.analyze(all_files)
    assert result == RoleAnalysis(
        main_file=main_file,
        labware_files=labware_files,
        data_files=data_files,
    )


def test_error_if_no_files() -> None:
    """It should raise if the input file list contains no files."""
    subject = RoleAnalyzer()
    with pytest.raises(RoleAnalysisError, match="No files were provided."):
        subject.analyze([])


@pytest.mark.parametrize(
    "main_file_1, main_file_2",
    [
        # Python plus Python:
        (
            dummy_python_protocol_file(file_name="main_file_1"),
            dummy_python_protocol_file(file_name="main_file_2"),
        ),
        # Python plus JSON:
        (
            dummy_python_protocol_file(file_name="main_file_1"),
            dummy_json_protocol_file(file_name="main_file_2"),
        ),
        # JSON plus JSON:
        (
            dummy_json_protocol_file(file_name="main_file_1"),
            dummy_json_protocol_file(file_name="main_file_2"),
        ),
    ],
)
def test_error_if_multiple_main_files(
    main_file_1: IdentifiedFile, main_file_2: IdentifiedFile
) -> None:
    """It should raise if multiple main files are provided."""
    subject = RoleAnalyzer()
    with pytest.raises(
        RoleAnalysisError,
        match='Could not pick single main file from "main_file_1", "main_file_2"',
    ):
        subject.analyze([main_file_1, main_file_2])


@pytest.mark.parametrize(
    "labware_files, expected_message",
    [
        (
            [dummy_labware_definition_file(file_name="labware")],
            '"labware" is not a valid protocol file.',
        ),
        (
            [
                dummy_labware_definition_file(file_name="labware_1"),
                dummy_labware_definition_file(file_name="labware_2"),
            ],
            'No valid protocol file found in "labware_1", "labware_2"',
        ),
    ],
)
def test_error_if_files_but_no_main(
    labware_files: List[IdentifiedFile], expected_message: str
) -> None:
    """It should raise if no main files are provided, but other files are."""
    subject = RoleAnalyzer()
    with pytest.raises(
        RoleAnalysisError,
        match=expected_message,
    ):
        subject.analyze(labware_files)
