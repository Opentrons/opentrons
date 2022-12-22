"""Tests for opentrons.protocol_reader.config_analyzer.ConfigAnalyzer."""
import json
from dataclasses import dataclass
import pytest
import textwrap
from typing import Dict, List, NamedTuple

from opentrons_shared_data import load_shared_data
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.models import JsonProtocol

from opentrons.protocol_reader import (
    ProtocolFileRole,
    PythonProtocolConfig,
    JsonProtocolConfig,
)

from opentrons.protocol_reader.protocol_source import Metadata

from opentrons.protocol_reader.role_analyzer import RoleAnalysis

from opentrons.protocol_reader.file_identifier import (
    FileIdentifier,
    IdentifiedFile,
    IdentifiedJsonMain,
    IdentifiedPythonMain,
    IdentifiedLabwareDefinition,
    ConfigAnalysisError,
)

from opentrons.protocol_reader.file_reader_writer import BufferedFile


@dataclass
class ValidPythonProtocolSpec:
    file_name: str
    contents: str
    expected_api_level: APIVersion
    expected_metadata: Metadata


@pytest.mark.parametrize(
    "spec",
    [
        # Basic Python:
        ValidPythonProtocolSpec(
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
            expected_metadata={"author": "Dr. Sy. N. Tist", "apiLevel": "2.11"},
        ),
        # Python with a weirdly capitalized file extension:
        ValidPythonProtocolSpec(
            file_name="foo.Py",
            contents=textwrap.dedent(
                """
                metadata = {
                    "apiLevel": "2.11",
                }
                """
            ),
            expected_api_level=APIVersion(2, 11),
            expected_metadata={"apiLevel": "2.11"},
        ),
    ],
)
async def test_valid_python_protocol(spec: ValidPythonProtocolSpec) -> None:
    input_file = BufferedFile(
        name=spec.file_name, contents=spec.contents.encode("utf-8"), path=None
    )
    expected_result = IdentifiedPythonMain(
        original_file=input_file,
        api_level=spec.expected_api_level,
        metadata=spec.expected_metadata,
    )
    subject = FileIdentifier()
    [result] = await subject.identify([input_file])
    assert result == expected_result


@dataclass
class ValidJsonProtocolSpec:
    file_name: str
    contents: bytes
    expected_schema_version: int
    expected_metadata: Metadata


@pytest.mark.parametrize(
    "spec",
    [
        # Basic JSON protocols of various versions:
        # todo(mm, 2022-12-22): Add a v7 protocol when we support that in production.
        ValidJsonProtocolSpec(
            file_name="foo.json",
            contents=load_shared_data("protocol/fixtures/6/simpleV6.json"),
            expected_schema_version=6,
            expected_metadata={
                "protocolName": "Simple test protocol",
                "author": "engineering <engineering@opentrons.com>",
                "description": "A short test protocol",
                "created": 1223131231,
                "tags": ["unitTest"],
            },
        ),
        ValidJsonProtocolSpec(
            file_name="foo.json",
            contents=load_shared_data("protocol/fixtures/5/simpleV5.json"),
            expected_schema_version=5,
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
        ValidJsonProtocolSpec(
            file_name="foo.json",
            contents=load_shared_data("protocol/fixtures/4/simpleV4.json"),
            expected_schema_version=4,
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
        ValidJsonProtocolSpec(
            file_name="foo.json",
            contents=load_shared_data("protocol/fixtures/3/simple.json"),
            expected_schema_version=3,
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
        ValidJsonProtocolSpec(
            file_name="foo.JsOn",
            contents=load_shared_data("protocol/fixtures/3/simple.json"),
            expected_schema_version=3,
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
async def test_valid_json_protocol(spec: ValidJsonProtocolSpec) -> None:
    input_file = BufferedFile(name=spec.file_name, contents=spec.contents, path=None)
    expected_result = IdentifiedJsonMain(
        original_file=input_file,
        schema_version=spec.expected_schema_version,
        metadata=spec.expected_metadata,
        unvalidated_json=json.loads(spec.contents),
    )
    subject = FileIdentifier()
    [result] = await subject.identify([input_file])
    assert result == expected_result


@dataclass
class ValidLabwareDefinitionSpec:
    file_name: str
    contents: bytes


@pytest.mark.parametrize(
    "spec",
    [
        ValidLabwareDefinitionSpec(
            file_name="foo.json",
            contents=load_shared_data(
                "labware/definitions/2/armadillo_96_wellplate_200ul_pcr_full_skirt/1.json"
            ),
        ),
        ValidLabwareDefinitionSpec(
            file_name="foo.json",
            contents=load_shared_data(
                "labware/definitions/2/opentrons_96_tiprack_10ul/1.json"
            ),
        ),
    ],
)
async def test_valid_labware_definition(spec: ValidLabwareDefinitionSpec) -> None:
    input_file = BufferedFile(name=spec.file_name, contents=spec.contents, path=None)
    expected_result = IdentifiedLabwareDefinition(
        original_file=input_file, unvalidated_json=json.loads(spec.contents)
    )
    subject = FileIdentifier()
    [result] = await subject.identify([input_file])
    assert result == expected_result


@dataclass
class InvalidSpec:
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
        InvalidSpec(
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
        InvalidSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # Metadata missing entirely.
                """
            ),
            expected_message="metadata.apiLevel missing",
        ),
        InvalidSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # Metadata provided, but not as a dict.
                metadata = "Hello"
                """
            ),
            expected_message="metadata.apiLevel missing",
        ),
        InvalidSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # apiLevel missing from metadata.
                metadata = {"Hello": "World"}
                """
            ),
            expected_message="metadata.apiLevel missing",
        ),
        InvalidSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # Metadata not statically parsable.
                metadata = {"apiLevel": "123" + ".456"}
                """
            ),
            expected_message="Unable to extract metadata from protocol.py",
        ),
        InvalidSpec(
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
        InvalidSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # apiLevel provided, but not as a well formatted string.
                metadata = {"apiLevel": "123*456"}
                """
            ),
            expected_message="is not of the format X.Y",
        ),
        InvalidSpec(
            file_name="protocol.py",
            contents=textwrap.dedent(
                """
                # apiLevel provided, but not a valid version.
                metadata = {"apiLevel": "123.456"}
                """
            ),
            expected_message="API version 123.456 is not supported by this robot software. Please either reduce your requested API version or update your robot.",
        ),
        # Unrecognized file extension:
        InvalidSpec(
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
        # .json file that isn't JSON:
        InvalidSpec(
            file_name="foo.json",
            contents="!@#$%",
            expected_message="foo.json is not valid JSON.",
        ),
        # .json file that doesn't conform to any of our protocol or labware schemas:
        InvalidSpec(
            file_name="foo.json",
            contents="{}",
            expected_message="foo.json is not a known Opentrons format.",
        ),
    ],
)
async def test_invalid_input(spec: InvalidSpec) -> None:
    """It should raise errors on invalid input."""
    input_file = BufferedFile(
        name=spec.file_name, contents=spec.contents.encode("utf-8"), path=None
    )
    subject = FileIdentifier()
    with pytest.raises(ConfigAnalysisError, match=spec.expected_message):
        await subject.identify([input_file])
