"""Tests for the protocol response model builder."""
from datetime import datetime

from opentrons.protocol_runner import ProtocolFileType, EngineExecution
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.protocols.protocol_models import Protocol
from robot_server.protocols.analysis_models import PendingAnalysis
from robot_server.protocols.response_builder import ResponseBuilder


def test_create_single_json_file_response() -> None:
    """It should create a BasicSession if session_data is None."""
    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.JSON,
        execution_method=EngineExecution(),
        created_at=datetime(year=2021, month=1, day=1),
        files=[],
    )

    protocol_analysis = PendingAnalysis(id="analysis-id")

    subject = ResponseBuilder()
    result = subject.build(resource=protocol_resource, analyses=[protocol_analysis])

    assert result == Protocol(
        id="protocol-id",
        protocolType=ProtocolFileType.JSON,
        createdAt=datetime(year=2021, month=1, day=1),
        analyses=[protocol_analysis],
    )
