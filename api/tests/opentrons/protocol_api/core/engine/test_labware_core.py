"""Tests for opentrons.protocol_api.core.engine.LabwareCore."""
from typing import cast

import pytest
from decoy import Decoy

from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    Parameters as LabwareDefinitionParameters,
)

from opentrons.types import Point
from opentrons.protocol_engine.clients import SyncClient as EngineClient

from opentrons.protocol_api.core.labware import LabwareLoadParams
from opentrons.protocol_api.core.engine import LabwareCore


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


def test_get_load_params(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should be able to get the definition's load parameters."""
    labware_definition = LabwareDefinition.construct(  # type: ignore[call-arg]
        namespace="hello",
        version=42,
        parameters=LabwareDefinitionParameters.construct(loadName="world"),  # type: ignore[call-arg]
    )

    decoy.when(
        mock_engine_client.state.labware.get_definition("cool-labware")
    ).then_return(labware_definition)

    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)
    result = subject.get_load_params()

    assert result == LabwareLoadParams("hello", "world", 42)


def test_set_calibration(mock_engine_client: EngineClient) -> None:
    """It should no-op if calibration is set."""
    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)
    subject.set_calibration(Point(1, 2, 3))


def test_get_definition(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should get the labware's definition as a dictionary."""
    labware_definition = LabwareDefinition.construct(namespace="hello")  # type: ignore[call-arg]

    decoy.when(
        mock_engine_client.state.labware.get_definition("cool-labware")
    ).then_return(labware_definition)

    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)
    result = subject.get_definition()

    assert result == cast(LabwareDefDict, {"namespace": "hello"})


def test_get_user_display_name(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should get the labware's user-provided label, if any."""
    decoy.when(
        mock_engine_client.state.labware.get_display_name("cool-labware")
    ).then_return("Cool Label")

    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)
    result = subject.get_user_display_name()

    assert result == "Cool Label"
