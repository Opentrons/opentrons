"""Tests for the protocol response model builder."""
from datetime import datetime

from opentrons.protocol_runner import ProtocolFileType
from opentrons.protocol_runner.pre_analysis import JsonPreAnalysis
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.protocols.protocol_models import Protocol, Metadata
from robot_server.protocols.analysis_models import PendingAnalysis
from robot_server.protocols.response_builder import ResponseBuilder


def test_create_single_json_file_response() -> None:
    """It should create a response for a single-file JSON `ProtocolResource`."""
    metadata_as_dict = {
        "a_string": "hello",
        "an_int": 9001,
        "a_float": 3.14,
        "a_nested_object": {"a_bool": True},
    }

    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.JSON,
        pre_analysis=JsonPreAnalysis(schema_version=123, metadata=metadata_as_dict),
        created_at=datetime(year=2021, month=1, day=1),
        files=[],
    )

    protocol_analysis = PendingAnalysis(id="analysis-id")

    subject = ResponseBuilder()
    result = subject.build(resource=protocol_resource, analyses=[protocol_analysis])

    assert result == Protocol(
        id="protocol-id",
        protocolType=ProtocolFileType.JSON,
        metadata=Metadata.parse_obj(metadata_as_dict),
        createdAt=datetime(year=2021, month=1, day=1),
        analyses=[protocol_analysis],
    )
