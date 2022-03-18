"""Tests for opentrons.protocol_reader.role_analyzer.RoleAnalyzer."""
import pytest
from decoy import matchers
from typing import List, NamedTuple

from opentrons_shared_data.protocol.models import ProtocolSchemaV6
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons.protocols.models import JsonProtocol
from opentrons.protocol_reader.file_reader_writer import BufferedFile

from opentrons.protocol_reader.role_analyzer import (
    RoleAnalyzer,
    RoleAnalysis,
    MainFile,
    LabwareFile,
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
            main_file=MainFile(name="protocol.py", contents=b""),
            labware_files=[],
            labware_definitions=[],
        ),
    ),
    RoleAnalyzerSpec(
        files=[
            BufferedFile(
                name="protocol.json",
                contents=b"",
                data=JsonProtocol.construct(  # type: ignore[call-arg]
                    labwareDefinitions={
                        "uri": LabwareDefinition.construct()  # type: ignore[call-arg]
                    },
                ),
            ),
        ],
        expected=RoleAnalysis(
            main_file=MainFile(
                name="protocol.json",
                contents=b"",
                data=JsonProtocol.construct(  # type: ignore[call-arg]
                    labwareDefinitions=matchers.Anything()
                ),
            ),
            labware_files=[],
            labware_definitions=[
                LabwareDefinition.construct()  # type: ignore[call-arg]
            ],
        ),
    ),
    RoleAnalyzerSpec(
        files=[
            BufferedFile(name="protocol.py", contents=b"", data=None),
            BufferedFile(
                name="labware.json",
                contents=b"",
                data=LabwareDefinition.construct(),  # type: ignore[call-arg]
            ),
        ],
        expected=RoleAnalysis(
            main_file=MainFile(name="protocol.py", contents=b""),
            labware_files=[
                LabwareFile(
                    name="labware.json",
                    contents=b"",
                    data=LabwareDefinition.construct(),  # type: ignore[call-arg]
                )
            ],
            labware_definitions=[
                LabwareDefinition.construct(),  # type: ignore[call-arg]
            ],
        ),
    ),
    RoleAnalyzerSpec(
        files=[
            BufferedFile(
                name="protocol.json",
                contents=b"",
                data=JsonProtocol.construct(  # type: ignore[call-arg]
                    labwareDefinitions={
                        "uri": LabwareDefinition.construct(  # type: ignore[call-arg]
                            version=1
                        )
                    },
                ),
            ),
            BufferedFile(
                name="labware.json",
                contents=b"",
                data=LabwareDefinition.construct(version=2),  # type: ignore[call-arg]
            ),
        ],
        expected=RoleAnalysis(
            main_file=MainFile(
                name="protocol.json",
                contents=b"",
                data=JsonProtocol.construct(  # type: ignore[call-arg]
                    labwareDefinitions=matchers.Anything()
                ),
            ),
            labware_files=[],
            labware_definitions=[
                LabwareDefinition.construct(version=1)  # type: ignore[call-arg]
            ],
        ),
    ),
    RoleAnalyzerSpec(
        files=[
            BufferedFile(name="PROTOCOL.PY", contents=b"", data=None),
        ],
        expected=RoleAnalysis(
            main_file=MainFile(name="PROTOCOL.PY", contents=b""),
            labware_files=[],
            labware_definitions=[],
        ),
    ),
    RoleAnalyzerSpec(
        files=[
            BufferedFile(
                name="protocol.json",
                contents=b"",
                data=ProtocolSchemaV6.construct(  # type: ignore[call-arg]
                    labwareDefinitions={
                        "uri": LabwareDefinition.construct()  # type: ignore[call-arg]
                    },
                ),
            ),
        ],
        expected=RoleAnalysis(
            main_file=MainFile(
                name="protocol.json",
                contents=b"",
                data=ProtocolSchemaV6.construct(  # type: ignore[call-arg]
                    labwareDefinitions=matchers.Anything()
                ),
            ),
            labware_files=[],
            labware_definitions=[
                LabwareDefinition.construct()  # type: ignore[call-arg]
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
        files=[BufferedFile(name="foo.txt", contents=b"", data=None)],
        expected_message='"foo.txt" is not a valid protocol file.',
    ),
    RoleAnalyzerErrorSpec(
        files=[
            BufferedFile(name="hello.py", contents=b"", data=None),
            BufferedFile(name="world.py", contents=b"", data=None),
        ],
        expected_message='Could not pick single main file from "hello.py", "world.py"',
    ),
    RoleAnalyzerErrorSpec(
        files=[
            BufferedFile(name="hello.txt", contents=b"", data=None),
            BufferedFile(name="world.txt", contents=b"", data=None),
        ],
        expected_message='No valid protocol file found in "hello.txt", "world.txt"',
    ),
    RoleAnalyzerErrorSpec(
        files=[
            BufferedFile(name="hello.py", contents=b"", data=None),
            BufferedFile(
                name="world.json",
                contents=b"",
                data=JsonProtocol.construct(),  # type: ignore[call-arg]
            ),
        ],
        expected_message=(
            'Could not pick single main file from "hello.py", "world.json"'
        ),
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
