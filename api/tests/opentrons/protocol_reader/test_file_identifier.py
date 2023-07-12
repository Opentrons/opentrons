"""Tests for opentrons.protocol_reader.file_identifier."""

import json
from dataclasses import dataclass
import textwrap

import pytest

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.protocols.api_support.types import APIVersion

from opentrons.protocol_reader.file_identifier import (
    FileIdentifier,
    FileIdentificationError,
    IdentifiedJsonMain,
    IdentifiedPythonMain,
    IdentifiedLabwareDefinition,
)
from opentrons.protocol_reader.file_reader_writer import BufferedFile
from opentrons.protocol_reader.protocol_source import Metadata


@dataclass
class _ValidPythonProtocolSpec:
    file_name: str
    contents: str
    expected_api_level: APIVersion
    expected_robot_type: RobotType
    expected_metadata: Metadata


@pytest.mark.parametrize(
    "spec",
    [
        # Basic Python:
        _ValidPythonProtocolSpec(
            file_name="foo.py",
            contents=textwrap.dedent(
                """
                metadata = {
                    "author": "Dr. Sy. N. Tist",
                    "apiLevel": "2.11",
                }
                """
            ),
            expected_api_level=APIVersion(2, 11),
            expected_robot_type="OT-2 Standard",
            expected_metadata={"author": "Dr. Sy. N. Tist", "apiLevel": "2.11"},
        ),
        # Python with a weirdly capitalized file extension:
        _ValidPythonProtocolSpec(
            file_name="foo.Py",
            contents=textwrap.dedent(
                """
                metadata = {
                    "apiLevel": "2.11",
                }
                """
            ),
            expected_api_level=APIVersion(2, 11),
            expected_robot_type="OT-2 Standard",
            expected_metadata={"apiLevel": "2.11"},
        ),
        # Explicitly specified robotType:
        _ValidPythonProtocolSpec(
            file_name="foo.py",
            contents=textwrap.dedent(
                """
                metadata = {
                    "apiLevel": "2.11",
                }
                requirements = {
                    "robotType": "OT-2",
                }
                """
            ),
            expected_api_level=APIVersion(2, 11),
            expected_robot_type="OT-2 Standard",
            expected_metadata={"apiLevel": "2.11"},
        ),
        _ValidPythonProtocolSpec(
            file_name="foo.py",
            contents=textwrap.dedent(
                """
                metadata = {
                    "apiLevel": "2.11",
                }
                requirements = {
                    "robotType": "Flex",
                }
                """
            ),
            expected_api_level=APIVersion(2, 11),
            expected_robot_type="OT-3 Standard",
            expected_metadata={"apiLevel": "2.11"},
        ),
        _ValidPythonProtocolSpec(
            file_name="foo.py",
            contents=textwrap.dedent(
                """
                metadata = {
                    "apiLevel": "2.11",
                }
                requirements = {
                    "robotType": "OT-3",
                }
                """
            ),
            expected_api_level=APIVersion(2, 11),
            expected_robot_type="OT-3 Standard",
            expected_metadata={"apiLevel": "2.11"},
        ),
        # apiLevel in `requirements`, instead of `metadata`:
        _ValidPythonProtocolSpec(
            file_name="foo.py",
            contents=textwrap.dedent(
                """
                requirements = {
                    "apiLevel": "2.11",
                }
                """
            ),
            expected_api_level=APIVersion(2, 11),
            expected_robot_type="OT-2 Standard",
            expected_metadata={},
        ),
    ],
)
async def test_valid_python_protocol(spec: _ValidPythonProtocolSpec) -> None:
    """It should identify the file as a Python main file and extract basic info."""
    input_file = BufferedFile(
        name=spec.file_name, contents=spec.contents.encode("utf-8"), path=None
    )
    expected_result = IdentifiedPythonMain(
        original_file=input_file,
        api_level=spec.expected_api_level,
        robot_type=spec.expected_robot_type,
        metadata=spec.expected_metadata,
    )
    subject = FileIdentifier()
    [result] = await subject.identify([input_file])
    assert result == expected_result


@dataclass
class _ValidJsonProtocolSpec:
    file_name: str
    contents: bytes
    expected_schema_version: int
    expected_robot_type: RobotType
    expected_metadata: Metadata


@pytest.mark.parametrize(
    "spec",
    [
        # Basic JSON protocols of various versions:
        # todo(mm, 2022-12-22): Add a v7 protocol when we support that in production.
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


# todo(mm, 2021-09-13): Some of these tests overlap with
# opentrons.protocol_runner.parse.
# Decide where this logic should canonically live, and deduplicate.
@pytest.mark.parametrize(
    "spec",
    [
        # Python syntax error:
        _InvalidInputSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                metadata = {
                    'apiLevel': '123.456'
                }

                def run()  # Syntax error: missing colon.
                    pass
                """
            ),
            expected_message="Unable to parse",
        ),
        # Python with various kinds of invalid metadata dict or apiLevel:
        _InvalidInputSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # Metadata missing entirely.
                """
            ),
            expected_message="apiLevel not declared in protocol.py",
        ),
        _InvalidInputSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # Metadata provided, but not as a dict.
                metadata = "Hello"
                """
            ),
            expected_message="apiLevel not declared in protocol.py",
        ),
        _InvalidInputSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # apiLevel missing from metadata.
                metadata = {"Hello": "World"}
                """
            ),
            expected_message="apiLevel not declared in protocol.py",
        ),
        _InvalidInputSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # Metadata not statically parsable.
                metadata = {"apiLevel": "123" + ".456"}
                """
            ),
            expected_message="Unable to extract metadata from protocol.py",
        ),
        _InvalidInputSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # apiLevel provided, but not as a string.
                metadata = {"apiLevel": 123.456}
                """
            ),
            # TODO(mm, 2021-09-13): bug in opentrons.protocols.parse.extract_metadata.
            # It errors when a field isn't a string, even though its return type suggests
            # suggests it should allow ints. This error message should be different.
            expected_message="Unable to extract metadata from protocol.py",
        ),
        _InvalidInputSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # apiLevel provided, but not as a well formatted string.
                metadata = {"apiLevel": "123*456"}
                """
            ),
            expected_message="is incorrectly formatted",
        ),
        _InvalidInputSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # apiLevel provided, but not a valid version.
                metadata = {"apiLevel": "123.456"}
                """
            ),
            expected_message="API version 123.456 is not supported by this robot software. Please either reduce your requested API version or update your robot.",
        ),
        _InvalidInputSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                metadata = {"apiLevel": "2.11"}
                # robotType provided, but not a valid string.
                requirements = {"robotType": "ot2"}
                """
            ),
            expected_message="robotType must be 'OT-2' or 'Flex', not 'ot2'.",
        ),
        _InvalidInputSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                metadata = {"apiLevel": "2.11"}
                # robotType provided, but not a valid string.
                requirements = {"robotType": "flex"}
                """
            ),
            expected_message="robotType must be 'OT-2' or 'Flex', not 'flex'.",
        ),
        # Unrecognized file extension:
        _InvalidInputSpec(
            file_name="protocol.python",
            contents=textwrap.dedent(
                """
                metadata = {
                    'apiLevel': '123.456'
                }

                def run()  # Syntax error: missing colon.
                    pass
                """
            ),
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
