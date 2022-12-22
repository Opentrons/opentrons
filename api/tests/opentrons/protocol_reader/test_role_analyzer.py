"""Tests for opentrons.protocol_reader.role_analyzer.RoleAnalyzer."""
import pytest
from typing import List, NamedTuple

from opentrons.protocols.api_support.types import APIVersion

from opentrons.protocol_reader.file_reader_writer import BufferedFile
from opentrons.protocol_reader.basic_info_extractor import (
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


@pytest.mark.parametrize(
    "main_file",
    [
        PythonProtocolFileInfo(
            original_file=BufferedFile(name="foo", path=None, contents=b""),
            api_level=APIVersion(9001, 9001),
            metadata={},
        ),
        JsonProtocolFileInfo(
            original_file=BufferedFile(
                name="foo",
                contents=b"",
                path=None,
            ),
            unvalidated_json={},
            schema_version=123,
            metadata={},
        ),
    ],
)
def test_single_main_file(main_file: FileInfo) -> None:
    """It should analyze a file list containing only a single main file."""
    subject = RoleAnalyzer()
    result = subject.analyze([main_file])
    assert result.main_file == main_file
    assert result.labware_files == []


@pytest.mark.parametrize(
    "main_file",
    [
        PythonProtocolFileInfo(
            original_file=BufferedFile(name="foo", path=None, contents=b""),
            api_level=APIVersion(9001, 9001),
            metadata={},
        ),
        JsonProtocolFileInfo(
            original_file=BufferedFile(
                name="foo",
                contents=b"",
                path=None,
            ),
            unvalidated_json={},
            schema_version=123,
            metadata={},
        ),
    ],
)
def test_single_main_file_and_labware(main_file: FileInfo) -> None:
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
    assert result.main_file == main_file
    assert result.labware_files == [labware_file_1, labware_file_2]


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
            PythonProtocolFileInfo(
                original_file=BufferedFile(name="main_file_1", path=None, contents=b""),
                api_level=APIVersion(9001, 9001),
                metadata={},
            ),
            PythonProtocolFileInfo(
                original_file=BufferedFile(name="main_file_2", path=None, contents=b""),
                api_level=APIVersion(9001, 9001),
                metadata={},
            ),
        ),
        # Python plus JSON:
        (
            PythonProtocolFileInfo(
                original_file=BufferedFile(name="main_file_1", path=None, contents=b""),
                api_level=APIVersion(9001, 9001),
                metadata={},
            ),
            JsonProtocolFileInfo(
                original_file=BufferedFile(
                    name="main_file_2",
                    contents=b"",
                    path=None,
                ),
                unvalidated_json={},
                schema_version=123,
                metadata={},
            ),
        ),
        # JSON plus JSON:
        (
            JsonProtocolFileInfo(
                original_file=BufferedFile(
                    name="main_file_1",
                    contents=b"",
                    path=None,
                ),
                unvalidated_json={},
                schema_version=123,
                metadata={},
            ),
            JsonProtocolFileInfo(
                original_file=BufferedFile(
                    name="main_file_2",
                    contents=b"",
                    path=None,
                ),
                unvalidated_json={},
                schema_version=123,
                metadata={},
            ),
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
            [
                LabwareDefinitionFileInfo(
                    original_file=BufferedFile(
                        name="labware",
                        contents=b"",
                        path=None,
                    ),
                    unvalidated_json={},
                )
            ],
            '"labware" is not a valid protocol file.',
        ),
        (
            [
                LabwareDefinitionFileInfo(
                    original_file=BufferedFile(
                        name="labware_1",
                        contents=b"",
                        path=None,
                    ),
                    unvalidated_json={},
                ),
                LabwareDefinitionFileInfo(
                    original_file=BufferedFile(
                        name="labware_2",
                        contents=b"",
                        path=None,
                    ),
                    unvalidated_json={},
                ),
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
