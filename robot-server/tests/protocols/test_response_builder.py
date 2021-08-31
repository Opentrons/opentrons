"""Tests for the protocol response model builder."""
import pytest
from datetime import datetime
from pathlib import Path

from opentrons.protocol_runner import ProtocolFileType
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.protocols.protocol_models import Protocol, Metadata
from robot_server.protocols.response_builder import ResponseBuilder


@pytest.fixture
def subject() -> ResponseBuilder:
    """Get an instance of the ResponseBuilder test subject."""
    return ResponseBuilder()


def test_create_single_json_file_response(
    current_time: datetime,
    subject: ResponseBuilder,
) -> None:
    """It should create a BasicSession if session_data is None."""
    protocol_entry = ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.JSON,
        created_at=current_time,
        files=[Path("/tmp/protocol.json")],
    )

    result = subject.build(protocol_entry)

    assert result == Protocol(
        id="protocol-id",
        protocolType=ProtocolFileType.JSON,
        protocolMetadata=Metadata(),
        createdAt=current_time,
    )
