"""Tests for Flex Stacker Engine Core."""

import pytest
from decoy import Decoy

from opentrons.protocol_api.core.engine.csv import CSVCore
from opentrons.protocol_api.core.engine.protocol import ProtocolCore
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol core."""
    mock_protocol_core = decoy.mock(cls=ProtocolCore)
    decoy.when(mock_protocol_core.annotation_ids).then_return([])
    return mock_protocol_core


@pytest.fixture
def subject(
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
) -> CSVCore:
    """Get a Flex Stacker Core test subject."""
    return CSVCore(
        file_id="1234",
        columns=10,
        engine_client=mock_engine_client,
        protocol_core=mock_protocol_core,
    )


def test_good_write(
    decoy: Decoy,
    subject: CSVCore,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
) -> None:
    """Test the standard senario."""
    subject.write_row(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"])
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.CSVWriteRowParams(
                fileId="1234",
                rowData=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
            ),
            command_annotations=[],
        )
    )


def test_short_row_write(
    decoy: Decoy,
    subject: CSVCore,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
) -> None:
    """Test that row thats too short is written, empty strings pad out to the column def size."""
    subject.write_row(["1", "2", "3", "4", "5"])
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.CSVWriteRowParams(
                fileId="1234", rowData=["1", "2", "3", "4", "5", "", "", "", "", ""]
            ),
            command_annotations=[],
        )
    )


def test_long_row_write(
    decoy: Decoy,
    subject: CSVCore,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
) -> None:
    """Test that row thats too long is written, an error is raised."""
    with pytest.raises(RuntimeError):
        subject.write_row(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"])
