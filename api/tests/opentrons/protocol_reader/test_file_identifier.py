"""Tests for opentrons.protocol_reader.file_identifier."""

import json
from dataclasses import dataclass

from decoy import Decoy
import pytest

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.protocols import parse
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.types import MalformedPythonProtocolError, PythonProtocol

from opentrons.protocol_reader.file_identifier import (
    FileIdentifier,
    FileIdentificationError,
    IdentifiedJsonMain,
    IdentifiedPythonMain,
    IdentifiedLabwareDefinition,
)
from opentrons.protocol_reader.file_reader_writer import BufferedFile
from opentrons.protocol_reader.protocol_source import Metadata


# TODO(mm, 2023-08-08): Make this autouse=True (apply to all test functions) when
# FileReaderWriter delegates to opentrons.protocols.parse for JSON files.
@pytest.fixture
def use_mock_parse(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace opentrons.protocols.parse.parse() with a mock."""
    mock_parse = decoy.mock(func=parse.parse)
    monkeypatch.setattr(parse, "parse", mock_parse)


@pytest.mark.parametrize("filename", ["protocol.py", "protocol.PY", "protocol.Py"])
async def test_python_parsing(
    decoy: Decoy, use_mock_parse: None, filename: str
) -> None:
    """It should use opentrons.protocols.parse() to extract basic ID info out of Python files."""
    input_file = BufferedFile(name=filename, contents=b"contents", path=None)

    decoy.when(parse.parse(b"contents", filename)).then_return(
        PythonProtocol(
            api_level=APIVersion(2, 1),
            robot_type="OT-3 Standard",
            metadata={"Hello": "World"},
            text="",
            filename="",
            contents=None,
            bundled_data=None,
            bundled_labware=None,
            bundled_python=None,
            extra_labware=None,
        )
    )

    subject = FileIdentifier()
    [result] = await subject.identify([input_file])

    assert result == IdentifiedPythonMain(
        original_file=input_file,
        api_level=APIVersion(2, 1),
        robot_type="OT-3 Standard",
        metadata={"Hello": "World"},
    )


@dataclass
class _ValidJsonProtocolSpec:
    file_name: str
    contents: bytes
    expected_schema_version: int
    expected_robot_type: RobotType
    expected_metadata: Metadata


# todo(mm, 2021-09-13): Some of these tests overlap with opentrons.protocols.parse.
# Delegate to opentrons.protocols.parse and test with mocks here.
@pytest.mark.parametrize(
    "spec",
    [
        # Basic JSON protocols of various versions:
        _ValidJsonProtocolSpec(
            file_name="foo.json",
            contents=load_shared_data("protocol/fixtures/7/simpleV7.json"),
            expected_schema_version=7,
            expected_robot_type="OT-2 Standard",
            expected_metadata={
                "protocolName": "Simple test protocol",
                "author": "engineering <engineering@opentrons.com>",
                "description": "A short test protocol",
                "created": 1223131231,
                "tags": ["unitTest"],
            },
        ),
        _ValidJsonProtocolSpec(
            file_name="foo.json",
            contents=load_shared_data("protocol/fixtures/6/simpleV6.json"),
            expected_schema_version=6,
            expected_robot_type="OT-2 Standard",
            expected_metadata={
                "protocolName": "Simple test protocol",
                "author": "engineering <engineering@opentrons.com>",
                "description": "A short test protocol",
                "created": 1223131231,
                "tags": ["unitTest"],
            },
        ),
        _ValidJsonProtocolSpec(
            file_name="foo.json",
            contents=load_shared_data("protocol/fixtures/5/simpleV5.json"),
            expected_schema_version=5,
            expected_robot_type="OT-2 Standard",
            expected_metadata={
                "protocolName": "Simple test protocol",
                "author": "engineering <engineering@opentrons.com>",
                "description": "A short test protocol",
                "category": None,
                "subcategory": None,
                "created": 1223131231,
                "lastModified": None,
                "tags": ["unitTest"],
            },
        ),
        _ValidJsonProtocolSpec(
            file_name="foo.json",
            contents=load_shared_data("protocol/fixtures/4/simpleV4.json"),
            expected_schema_version=4,
            expected_robot_type="OT-2 Standard",
            expected_metadata={
                "protocolName": "Simple test protocol",
                "author": "engineering <engineering@opentrons.com>",
                "description": "A short test protocol",
                "category": None,
                "subcategory": None,
                "created": 1223131231,
                "lastModified": None,
                "tags": ["unitTest"],
            },
        ),
        _ValidJsonProtocolSpec(
            file_name="foo.json",
            contents=load_shared_data("protocol/fixtures/3/simple.json"),
            expected_schema_version=3,
            expected_robot_type="OT-2 Standard",
            expected_metadata={
                "protocolName": "Simple test protocol v3",
                "author": "engineering <engineering@opentrons.com>",
                "description": "A short test protocol",
                "category": None,
                "subcategory": None,
                "created": 1223131231,
                "lastModified": None,
                "tags": ["unitTest"],
            },
        ),
        # JSON with a weirdly capitalized file extension:
        _ValidJsonProtocolSpec(
            file_name="foo.JsOn",
            contents=load_shared_data("protocol/fixtures/3/simple.json"),
            expected_schema_version=3,
            expected_robot_type="OT-2 Standard",
            expected_metadata={
                "protocolName": "Simple test protocol v3",
                "author": "engineering <engineering@opentrons.com>",
                "description": "A short test protocol",
                "category": None,
                "subcategory": None,
                "created": 1223131231,
                "lastModified": None,
                "tags": ["unitTest"],
            },
        ),
    ],
)
async def test_valid_json_protocol(spec: _ValidJsonProtocolSpec) -> None:
    """It should identify the file as a JSON main file and extract basic info."""
    input_file = BufferedFile(name=spec.file_name, contents=spec.contents, path=None)
    expected_result = IdentifiedJsonMain(
        original_file=input_file,
        schema_version=spec.expected_schema_version,
        robot_type=spec.expected_robot_type,
        metadata=spec.expected_metadata,
        unvalidated_json=json.loads(spec.contents),
    )
    subject = FileIdentifier()
    [result] = await subject.identify([input_file])
    assert result == expected_result


@dataclass
class _ValidLabwareDefinitionSpec:
    file_name: str
    contents: bytes


@pytest.mark.parametrize(
    "spec",
    [
        _ValidLabwareDefinitionSpec(
            file_name="foo.json",
            contents=load_shared_data(
                "labware/definitions/2/armadillo_96_wellplate_200ul_pcr_full_skirt/1.json"
            ),
        ),
        _ValidLabwareDefinitionSpec(
            file_name="foo.json",
            contents=load_shared_data(
                "labware/definitions/2/opentrons_96_tiprack_10ul/1.json"
            ),
        ),
    ],
)
async def test_valid_labware_definition(spec: _ValidLabwareDefinitionSpec) -> None:
    """It should identify the file as a labware definition and extract basic info."""
    input_file = BufferedFile(name=spec.file_name, contents=spec.contents, path=None)
    expected_result = IdentifiedLabwareDefinition(
        original_file=input_file, unvalidated_json=json.loads(spec.contents)
    )
    subject = FileIdentifier()
    [result] = await subject.identify([input_file])
    assert result == expected_result


@dataclass
class _InvalidInputSpec:
    file_name: str
    contents: str
    expected_message: str


@pytest.mark.parametrize(
    "spec",
    [
        # Unrecognized file extension:
        _InvalidInputSpec(
            file_name="protocol.python",
            contents="",
            expected_message="protocol.python has an unrecognized file extension.",
        ),
        _InvalidInputSpec(
            file_name="extensionless",
            contents="",
            expected_message="extensionless has an unrecognized file extension.",
        ),
        _InvalidInputSpec(
            file_name="data.dat",
            contents="",
            expected_message="data.dat has an unrecognized file extension.",
        ),
        # .json file that isn't JSON:
        _InvalidInputSpec(
            file_name="foo.json",
            contents="!@#$%",
            expected_message="foo.json is not valid JSON.",
        ),
        # .json file that doesn't conform to any of our protocol or labware schemas:
        _InvalidInputSpec(
            file_name="foo.json",
            contents="{}",
            expected_message="foo.json is not a known Opentrons format.",
        ),
    ],
)
async def test_invalid_input(spec: _InvalidInputSpec) -> None:
    """It should raise errors on invalid input."""
    input_file = BufferedFile(
        name=spec.file_name, contents=spec.contents.encode("utf-8"), path=None
    )
    subject = FileIdentifier()
    with pytest.raises(FileIdentificationError, match=spec.expected_message):
        await subject.identify([input_file])


async def test_invalid_python_api_level(decoy: Decoy, use_mock_parse: None) -> None:
    """It should check the apiLevel and raise if it's not supported."""
    input_file = BufferedFile(name="filename.py", contents=b"contents", path=None)

    decoy.when(parse.parse(b"contents", "filename.py")).then_return(
        PythonProtocol(
            api_level=APIVersion(999, 999),
            robot_type="OT-3 Standard",
            metadata=None,
            text="",
            filename="",
            contents=None,
            bundled_data=None,
            bundled_labware=None,
            bundled_python=None,
            extra_labware=None,
        )
    )

    subject = FileIdentifier()

    with pytest.raises(FileIdentificationError, match="999.999 is not supported"):
        await subject.identify([input_file])


async def test_malformed_python(decoy: Decoy, use_mock_parse: None) -> None:
    """It should propagate errors that mean the Python file was malformed."""
    input_file = BufferedFile(name="filename.py", contents=b"contents", path=None)

    decoy.when(parse.parse(b"contents", "filename.py")).then_raise(
        MalformedPythonProtocolError(
            short_message="message 1", long_additional_message="message 2"
        )
    )

    subject = FileIdentifier()

    with pytest.raises(FileIdentificationError) as exc_info:
        await subject.identify([input_file])

    # TODO(mm, 2023-08-8): We probably want to propagate the longer message too, if there is one.
    # Align with the app+UI team about how to do this safely.
    assert str(exc_info.value) == "message 1"
