"""Tests for opentrons.protocol_reader.role_analyzer.RoleAnalyzer."""
import pytest
from typing import List, Union

from opentrons.protocols.api_support.types import APIVersion

from opentrons.protocol_reader.file_reader_writer import BufferedFile
from opentrons.protocol_reader.file_identifier import (
    FileInfo,
    JsonProtocolFileInfo,
    PythonProtocolFileInfo,
    LabwareDefinitionFileInfo,
)
from opentrons.protocol_reader.role_analyzer import (
    RoleAnalyzer,
    RoleAnalysis,
    RoleAnalysisError,
)


def dummy_python_protocol_file(file_name: str) -> PythonProtocolFileInfo:
    """Return a PythonProtocolFileInfo with trivial placeholder data."""
    return PythonProtocolFileInfo(
        original_file=BufferedFile(name=file_name, path=None, contents=b""),
        api_level=APIVersion(9001, 9001),
        metadata={},
    )


def dummy_json_protocol_file(file_name: str) -> JsonProtocolFileInfo:
    """Return a JsonProtocolFileInfo with trivial placeholder data."""
    return JsonProtocolFileInfo(
        original_file=BufferedFile(
            name=file_name,
            contents=b"",
            path=None,
        ),
        unvalidated_json={},
        schema_version=123,
        metadata={},
    )


def dummy_labware_definition_file(file_name: str) -> LabwareDefinitionFileInfo:
    """Return a LabwareDefinitionFileInfo with trivial placeholder data."""
    return LabwareDefinitionFileInfo(
        original_file=BufferedFile(
            name=file_name,
            contents=b"",
            path=None,
        ),
        unvalidated_json={},
    )


def test_role_analysis_all_files() -> None:
    """It should return all member files."""
    main_file = dummy_python_protocol_file(file_name="main")
    labware_file_1 = dummy_labware_definition_file(file_name="labware_1")
    labware_file_2 = dummy_labware_definition_file(file_name="labware_2")
    subject = RoleAnalysis(
        main_file=main_file, labware_files=[labware_file_1, labware_file_2]
    )
    assert subject.all_files == [main_file, labware_file_1, labware_file_2]


@pytest.mark.parametrize(
    "main_file",
    [
        dummy_python_protocol_file(file_name="foo"),
        dummy_json_protocol_file(file_name="foo"),
    ],
)
def test_single_main_file(
    main_file: Union[JsonProtocolFileInfo, PythonProtocolFileInfo]
) -> None:
    """It should analyze a file list containing only a single main file."""
    subject = RoleAnalyzer()
    result = subject.analyze([main_file])
    assert result == RoleAnalysis(
        main_file=main_file,
        labware_files=[],
    )


@pytest.mark.parametrize(
    "main_file",
    [
        dummy_python_protocol_file(file_name="foo"),
        dummy_json_protocol_file(file_name="bar"),
    ],
)
def test_single_main_file_and_labware(
    main_file: Union[JsonProtocolFileInfo, PythonProtocolFileInfo]
) -> None:
    """It should analyze a file list containing a single main file, plus labware."""
    labware_file_1 = LabwareDefinitionFileInfo(
        original_file=BufferedFile(
            name="labware_1",
            contents=b"",
            path=None,
        ),
        unvalidated_json={},
    )
    labware_file_2 = LabwareDefinitionFileInfo(
        original_file=BufferedFile(
            name="labware_2",
            contents=b"",
            path=None,
        ),
        unvalidated_json={},
    )

    subject = RoleAnalyzer()
    result = subject.analyze([main_file, labware_file_1, labware_file_2])
    assert result == RoleAnalysis(
        main_file=main_file,
        labware_files=[labware_file_1, labware_file_2],
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
    main_file_1: FileInfo, main_file_2: FileInfo
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
    labware_files: List[FileInfo], expected_message: str
) -> None:
    """It should raise if no main files are provided, but other files are."""
    subject = RoleAnalyzer()
    with pytest.raises(
        RoleAnalysisError,
        match=expected_message,
    ):
        subject.analyze(labware_files)
