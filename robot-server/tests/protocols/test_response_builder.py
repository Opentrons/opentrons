"""Tests for the protocol response model builder."""
import pytest
from datetime import datetime
from pathlib import Path
from typing import List, NamedTuple

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_runner.pre_analysis import (
    PreAnalysis,
    JsonPreAnalysis,
    PythonPreAnalysis,
)

from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.protocols.analysis_models import PendingAnalysis
from robot_server.protocols.response_builder import ResponseBuilder
from robot_server.protocols.protocol_models import (
    Protocol,
    ProtocolType,
    ProtocolFile,
    ProtocolFileRole,
    Metadata,
)


class SingleFileSpec(NamedTuple):
    """Test data for single-file protocol responses."""

    expected_result: Protocol
    files: List[Path]
    pre_analysis: PreAnalysis
    protocol_id: str = "protocol-id"
    created_at: datetime = datetime(year=2021, month=1, day=1)


@pytest.mark.parametrize(
    SingleFileSpec._fields,
    [
        SingleFileSpec(
            expected_result=Protocol(
                id="protocol-id",
                createdAt=datetime(year=2021, month=1, day=1),
                protocolType=ProtocolType.JSON,
                metadata=Metadata(),
                analyses=[],
                files=[
                    ProtocolFile(name="my-protocol.json", role=ProtocolFileRole.MAIN)
                ],
            ),
            files=[Path("/dev/null/my-protocol.json")],
            pre_analysis=JsonPreAnalysis(schema_version=123, metadata={}),
        ),
        SingleFileSpec(
            expected_result=Protocol(
                id="protocol-id",
                createdAt=datetime(year=2021, month=1, day=1),
                protocolType=ProtocolType.PYTHON,
                metadata=Metadata(),
                analyses=[],
                files=[ProtocolFile(name="my-protocol.py", role=ProtocolFileRole.MAIN)],
            ),
            files=[Path("/dev/null/my-protocol.py")],
            pre_analysis=PythonPreAnalysis(api_version=APIVersion(2, 11), metadata={}),
        ),
    ],
)
def test_single_file_response(
    expected_result: Protocol,
    files: List[Path],
    pre_analysis: PreAnalysis,
    protocol_id: str,
    created_at: datetime,
) -> None:
    """It should create a response for single-file protocols."""
    protocol_resource = ProtocolResource(
        protocol_id=protocol_id,
        pre_analysis=pre_analysis,
        created_at=created_at,
        files=files,
    )

    subject = ResponseBuilder()
    result = subject.build(resource=protocol_resource, analyses=[])

    assert result == expected_result


def test_metadata_in_response() -> None:
    """It should add pre-analysis metadata to the response."""
    metadata_as_dict = {
        "a_string": "hello",
        "an_int": 9001,
        "a_float": 3.14,
        "a_nested_object": {"a_bool": True},
    }

    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        pre_analysis=JsonPreAnalysis(schema_version=123, metadata=metadata_as_dict),
        created_at=datetime(year=2021, month=1, day=1),
        files=[],
    )

    protocol_analysis = PendingAnalysis(id="analysis-id")

    subject = ResponseBuilder()
    result = subject.build(resource=protocol_resource, analyses=[protocol_analysis])

    assert result == Protocol(
        id="protocol-id",
        protocolType=ProtocolType.JSON,
        metadata=Metadata.parse_obj(metadata_as_dict),
        createdAt=datetime(year=2021, month=1, day=1),
        analyses=[protocol_analysis],
        files=[],
    )
