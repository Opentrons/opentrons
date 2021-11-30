"""Tests for opentrons.protocol_reader.role_analyzer.RoleAnalyzer."""
import pytest
from typing import List, NamedTuple

from opentrons.protocols.models import JsonProtocol, LabwareDefinition
from opentrons.protocol_reader import ProtocolFileRole
from opentrons.protocol_reader.input_file import BufferedFile

from opentrons.protocol_reader.role_analyzer import (
    RoleAnalyzer,
    RoleAnalysis,
    RoleAnalyzedFile,
    RoleAnalysisError,
)


class RoleAnalyzerSpec(NamedTuple):
    """Spec data for a RoleAnalyzer test."""

    files: List[BufferedFile]
    expected: RoleAnalysis


class RoleAnalyzerErrorSpec(NamedTuple):
    """Spec data for a RoleAnalyzer test."""

    files: List[BufferedFile]
    expected_message: str


ROLE_ANALYZER_SPECS: List[RoleAnalyzerSpec] = [
    RoleAnalyzerSpec(
        files=[
            BufferedFile(name="protocol.py", contents=b"", data=None),
        ],
        expected=RoleAnalysis(
            main_file=RoleAnalyzedFile(
                name="protocol.py",
                contents=b"",
                data=None,
                role=ProtocolFileRole.MAIN,
            ),
            other_files=[],
        ),
    ),
    RoleAnalyzerSpec(
        files=[
            BufferedFile(name="data.csv", contents=b"", data=None),
            BufferedFile(name="protocol.py", contents=b"", data=None),
        ],
        expected=RoleAnalysis(
            main_file=RoleAnalyzedFile(
                name="protocol.py",
                contents=b"",
                data=None,
                role=ProtocolFileRole.MAIN,
            ),
            other_files=[
                RoleAnalyzedFile(
                    name="data.csv",
                    contents=b"",
                    data=None,
                    role=ProtocolFileRole.DATA,
                )
            ],
        ),
    ),
    RoleAnalyzerSpec(
        files=[
            BufferedFile(name="lib.py", contents=b"", data=None),
            BufferedFile(name="__init__.py", contents=b"", data=None),
        ],
        expected=RoleAnalysis(
            main_file=RoleAnalyzedFile(
                name="__init__.py",
                contents=b"",
                data=None,
                role=ProtocolFileRole.MAIN,
            ),
            other_files=[
                RoleAnalyzedFile(
                    name="lib.py",
                    contents=b"",
                    data=None,
                    role=ProtocolFileRole.PYTHON_SUPPORT,
                )
            ],
        ),
    ),
    RoleAnalyzerSpec(
        files=[
            BufferedFile(
                name="protocol.json",
                contents=b"",
                data=JsonProtocol.construct(),  # type: ignore[call-arg]
            ),
        ],
        expected=RoleAnalysis(
            main_file=RoleAnalyzedFile(
                name="protocol.json",
                contents=b"",
                data=JsonProtocol.construct(),  # type: ignore[call-arg]
                role=ProtocolFileRole.MAIN,
            ),
            other_files=[],
        ),
    ),
    RoleAnalyzerSpec(
        files=[
            BufferedFile(
                name="fixture_96_plate.json",
                contents=b"",
                data=LabwareDefinition.construct(),  # type: ignore[call-arg]
            ),
            BufferedFile(name="protocol.py", contents=b"", data=None),
        ],
        expected=RoleAnalysis(
            main_file=RoleAnalyzedFile(
                name="protocol.py",
                contents=b"",
                data=None,
                role=ProtocolFileRole.MAIN,
            ),
            other_files=[
                RoleAnalyzedFile(
                    name="fixture_96_plate.json",
                    contents=b"",
                    data=LabwareDefinition.construct(),  # type: ignore[call-arg]
                    role=ProtocolFileRole.LABWARE_DEFINITION,
                )
            ],
        ),
    ),
    RoleAnalyzerSpec(
        files=[
            BufferedFile(name="whatever.json", contents=b"", data={"hello": "world"}),
            BufferedFile(name="protocol.py", contents=b"", data=None),
        ],
        expected=RoleAnalysis(
            main_file=RoleAnalyzedFile(
                name="protocol.py",
                contents=b"",
                data=None,
                role=ProtocolFileRole.MAIN,
            ),
            other_files=[
                RoleAnalyzedFile(
                    name="whatever.json",
                    contents=b"",
                    data={"hello": "world"},
                    role=ProtocolFileRole.DATA,
                )
            ],
        ),
    ),
]


ROLE_ANALYZER_ERROR_SPECS: List[RoleAnalyzerErrorSpec] = [
    RoleAnalyzerErrorSpec(
        files=[],
        expected_message="No files were provided.",
    ),
    RoleAnalyzerErrorSpec(
        files=[
            BufferedFile(name="foo.py", contents=b"", data=None),
            BufferedFile(name="bar.py", contents=b"", data=None),
        ],
        expected_message="main file must be named __init__.py.",
    ),
    RoleAnalyzerErrorSpec(
        files=[
            BufferedFile(name="__init__.py", contents=b"", data=None),
            BufferedFile(name="__init__.py", contents=b"", data=None),
        ],
        expected_message="Multiple __init__.py files provided.",
    ),
    RoleAnalyzerErrorSpec(
        files=[
            BufferedFile(
                name="fixture_96_plate.json",
                contents=b"",
                data=LabwareDefinition.construct(),  # type: ignore[call-arg]
            ),
        ],
        expected_message="fixture_96_plate.json is not a valid protocol file",
    ),
    RoleAnalyzerErrorSpec(
        files=[
            BufferedFile(
                name="protocol.json",
                contents=b"",
                data=JsonProtocol.construct(),  # type: ignore[call-arg]
            ),
            BufferedFile(
                name="fixture_96_plate.json",
                contents=b"",
                data=LabwareDefinition.construct(),  # type: ignore[call-arg]
            ),
        ],
        expected_message="JSON protocol must consist of a single file.",
    ),
    RoleAnalyzerErrorSpec(
        files=[
            BufferedFile(
                name="data.csv",
                contents=b"",
                data=None,
            ),
            BufferedFile(
                name="more-data.csv",
                contents=b"",
                data=None,
            ),
        ],
        expected_message="No valid main protocol file found.",
    ),
]


@pytest.mark.parametrize(RoleAnalyzerSpec._fields, ROLE_ANALYZER_SPECS)
def test_role_analyzer(files: List[BufferedFile], expected: RoleAnalysis) -> None:
    """It should analyze a file list properly."""
    subject = RoleAnalyzer()
    result = subject.analyze(files)

    assert result == expected


@pytest.mark.parametrize(RoleAnalyzerErrorSpec._fields, ROLE_ANALYZER_ERROR_SPECS)
def test_role_analyzer_error(files: List[BufferedFile], expected_message: str) -> None:
    """It should raise errors on invalid input lists."""
    subject = RoleAnalyzer()

    with pytest.raises(RoleAnalysisError, match=expected_message):
        subject.analyze(files)
