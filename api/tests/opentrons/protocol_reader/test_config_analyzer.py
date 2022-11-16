"""Tests for opentrons.protocol_reader.config_analyzer.ConfigAnalyzer."""
import pytest
import textwrap
from typing import List, NamedTuple

from opentrons_shared_data import load_shared_data
from opentrons.protocol_api import APIVersion
from opentrons.protocols.models import JsonProtocol

from opentrons.protocol_reader import (
    ProtocolFileRole,
    PythonProtocolConfig,
    JsonProtocolConfig,
)
from opentrons.protocol_reader.role_analyzer import RoleAnalysisFile

from opentrons.protocol_reader.config_analyzer import (
    ConfigAnalyzer,
    ConfigAnalysis,
    ConfigAnalysisError,
)


class ConfigAnalyzerSpec(NamedTuple):
    """Spec data for a RoleAnalyzer test."""

    main_file: RoleAnalysisFile
    expected: ConfigAnalysis


class ConfigAnalyzerErrorSpec(NamedTuple):
    """Spec data for a RoleAnalyzer test."""

    main_file: RoleAnalysisFile
    expected_message: str


# TODO(mc, 2021-11-30): add JSON v6 spec when JsonProtocol model
# supports parsing schema v6
CONFIG_ANALYZER_SPECS: List[ConfigAnalyzerSpec] = [
    # Basic Python:
    ConfigAnalyzerSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                metadata = {
                    "author": "Dr. Sy. N. Tist",
                    "apiLevel": "2.11",
                }
                """
            ).encode(),
        ),
        expected=ConfigAnalysis(
            metadata={"author": "Dr. Sy. N. Tist", "apiLevel": "2.11"},
            robot_type="OT-2 Standard",
            config=PythonProtocolConfig(api_version=APIVersion(2, 11)),
        ),
    ),
    # Basic JSON:
    ConfigAnalyzerSpec(
        main_file=RoleAnalysisFile(
            name="protocol.json",
            role=ProtocolFileRole.MAIN,
            contents=b"",
            path=None,
            data=JsonProtocol.parse_raw(
                load_shared_data("protocol/fixtures/5/simpleV5.json")
            ),
        ),
        expected=ConfigAnalysis(
            metadata={
                "protocolName": "Simple test protocol",
                "author": "engineering <engineering@opentrons.com>",
                "description": "A short test protocol",
                "created": 1223131231,
                "tags": ["unitTest"],
            },
            robot_type="OT-2 Standard",
            config=JsonProtocolConfig(schema_version=5),
        ),
    ),
    ConfigAnalyzerSpec(
        main_file=RoleAnalysisFile(
            name="protocol.json",
            role=ProtocolFileRole.MAIN,
            contents=b"",
            path=None,
            data=JsonProtocol.parse_raw(
                load_shared_data("protocol/fixtures/4/simpleV4.json")
            ),
        ),
        expected=ConfigAnalysis(
            metadata={
                "protocolName": "Simple test protocol",
                "author": "engineering <engineering@opentrons.com>",
                "description": "A short test protocol",
                "created": 1223131231,
                "tags": ["unitTest"],
            },
            robot_type="OT-2 Standard",
            config=JsonProtocolConfig(schema_version=4),
        ),
    ),
    ConfigAnalyzerSpec(
        main_file=RoleAnalysisFile(
            name="protocol.json",
            role=ProtocolFileRole.MAIN,
            contents=b"",
            path=None,
            data=JsonProtocol.parse_raw(
                load_shared_data("protocol/fixtures/3/simple.json")
            ),
        ),
        expected=ConfigAnalysis(
            metadata={
                "protocolName": "Simple test protocol v3",
                "author": "engineering <engineering@opentrons.com>",
                "description": "A short test protocol",
                "created": 1223131231,
                "tags": ["unitTest"],
            },
            robot_type="OT-2 Standard",
            config=JsonProtocolConfig(schema_version=3),
        ),
    ),
    # Uppercase file extension:
    ConfigAnalyzerSpec(
        main_file=RoleAnalysisFile(
            name="protocol.PY",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                metadata = {
                    "author": "Dr. Sy. N. Tist",
                    "apiLevel": "2.11",
                }
                """
            ).encode(),
        ),
        expected=ConfigAnalysis(
            metadata={"author": "Dr. Sy. N. Tist", "apiLevel": "2.11"},
            robot_type="OT-2 Standard",
            config=PythonProtocolConfig(
                api_version=APIVersion(2, 11),
            ),
        ),
    ),
    # Explicitly specified robotType:
    ConfigAnalyzerSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                metadata = {"apiLevel": "2.11"}
                requirements = {"robotType": "OT-2"}
                """
            ).encode(),
        ),
        expected=ConfigAnalysis(
            metadata={"apiLevel": "2.11"},
            robot_type="OT-2 Standard",
            config=PythonProtocolConfig(api_version=APIVersion(2, 11)),
        ),
    ),
    ConfigAnalyzerSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                metadata = {"apiLevel": "2.11"}
                requirements = {"robotType": "OT-3"}
                """
            ).encode(),
        ),
        expected=ConfigAnalysis(
            metadata={"apiLevel": "2.11"},
            robot_type="OT-3 Standard",
            config=PythonProtocolConfig(
                api_version=APIVersion(2, 11),
            ),
        ),
    ),
    # apiLevel in `requirements`, instead of `metadata`:
    ConfigAnalyzerSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                requirements = {"apiLevel": "2.11"}
                """
            ).encode(),
        ),
        expected=ConfigAnalysis(
            metadata={},
            robot_type="OT-2 Standard",
            config=PythonProtocolConfig(
                api_version=APIVersion(2, 11),
            ),
        ),
    ),
]


# todo(mm, 2021-09-13): Some of these tests overlap with
# opentrons.protocol_runner.parse.
# Decide where this logic should canonically live, and deduplicate.
CONFIG_ANALYZER_ERROR_SPECS: List[ConfigAnalyzerErrorSpec] = [
    ConfigAnalyzerErrorSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                metadata = {
                    'apiLevel': '123.456'
                }

                def run()  # Syntax error: missing colon.
                    pass
                """
            ).encode(),
        ),
        expected_message="Unable to parse",
    ),
    ConfigAnalyzerErrorSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                # Metadata missing entirely.
                """
            ).encode(),
        ),
        expected_message="apiLevel not declared in protocol.py",
    ),
    ConfigAnalyzerErrorSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                # Metadata provided, but not as a dict.
                metadata = "Hello"
                """
            ).encode(),
        ),
        expected_message="apiLevel not declared in protocol.py",
    ),
    ConfigAnalyzerErrorSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                # apiLevel missing from metadata.
                metadata = {"Hello": "World"}
                """
            ).encode(),
        ),
        expected_message="apiLevel not declared in protocol.py",
    ),
    ConfigAnalyzerErrorSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                # Metadata not statically parsable.
                metadata = {"apiLevel": "123" + ".456"}
                """
            ).encode(),
        ),
        expected_message="Unable to extract metadata from protocol.py",
    ),
    ConfigAnalyzerErrorSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                # apiLevel provided, but not as a string.
                metadata = {"apiLevel": 123.456}
                """
            ).encode(),
        ),
        # TODO(mm, 2021-09-13): bug in opentrons.protocols.parse.extract_metadata.
        # It errors when a field isn't a string, even though its return type suggests
        # suggests it should allow ints. This error message should be different.
        expected_message="Unable to extract metadata from protocol.py",
    ),
    ConfigAnalyzerErrorSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                # apiLevel provided, but not as a well formatted string.
                metadata = {"apiLevel": "123*456"}
                """
            ).encode(),
        ),
        expected_message="is incorrectly formatted",
    ),
    ConfigAnalyzerErrorSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                # apiLevel provided, but not a valid version.
                metadata = {"apiLevel": "123.456"}
                """
            ).encode(),
        ),
        expected_message="API version 123.456 is not supported by this robot software. Please either reduce your requested API version or update your robot.",
    ),
    ConfigAnalyzerErrorSpec(
        main_file=RoleAnalysisFile(
            name="protocol.py",
            data=None,
            path=None,
            role=ProtocolFileRole.MAIN,
            contents=textwrap.dedent(
                """
                metadata = {"apiLevel": "2.11"}
                # robotType provided, but not a valid string.
                requirements = {"robotType": "ot2"}
                """
            ).encode(),
        ),
        expected_message="robotType must be 'OT-2' or 'OT-3', not 'ot2'.",
    ),
]


@pytest.mark.parametrize(ConfigAnalyzerSpec._fields, CONFIG_ANALYZER_SPECS)
def test_config_analyzer(main_file: RoleAnalysisFile, expected: ConfigAnalysis) -> None:
    """It should analyze a main file for config properly."""
    subject = ConfigAnalyzer()
    result = subject.analyze(main_file)

    assert result == expected


@pytest.mark.parametrize(ConfigAnalyzerErrorSpec._fields, CONFIG_ANALYZER_ERROR_SPECS)
def test_config_analyzer_error(
    main_file: RoleAnalysisFile,
    expected_message: str,
) -> None:
    """It should raise errors on invalid main file input."""
    subject = ConfigAnalyzer()

    with pytest.raises(ConfigAnalysisError, match=expected_message):
        subject.analyze(main_file)
