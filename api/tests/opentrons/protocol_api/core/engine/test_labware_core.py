"""Tests for opentrons.protocol_api.core.engine.LabwareCore."""
from typing import cast

import pytest
from decoy import Decoy

from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    Parameters as LabwareDefinitionParameters,
    Metadata as LabwareDefinitionMetadata,
)

from opentrons.types import Point
from opentrons.protocol_engine.clients import SyncClient as EngineClient

from opentrons.protocol_api.core.labware import LabwareLoadParams
from opentrons.protocol_api.core.engine import LabwareCore, WellCore


@pytest.fixture
def labware_definition() -> LabwareDefinition:
    """Get a LabwareDefinition value object to use in tests."""
    return LabwareDefinition.construct(ordering=[])  # type: ignore[call-arg]


@pytest.fixture
def mock_engine_client(
    decoy: Decoy, labware_definition: LabwareDefinition
) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    engine_client = decoy.mock(cls=EngineClient)

    decoy.when(engine_client.state.labware.get_definition("cool-labware")).then_return(
        labware_definition
    )

    return engine_client


def test_get_load_params(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should be able to get the definition's load parameters."""
    labware_definition = LabwareDefinition.construct(  # type: ignore[call-arg]
        namespace="hello",
        version=42,
        parameters=LabwareDefinitionParameters.construct(loadName="world"),  # type: ignore[call-arg]
        ordering=[],
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
    labware_definition = LabwareDefinition.construct(namespace="hello", ordering=[])  # type: ignore[call-arg]

    decoy.when(
        mock_engine_client.state.labware.get_definition("cool-labware")
    ).then_return(labware_definition)

    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)
    result = subject.get_definition()

    assert result == cast(LabwareDefDict, {"namespace": "hello", "ordering": []})


def test_get_user_display_name(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should get the labware's user-provided label, if any."""
    decoy.when(
        mock_engine_client.state.labware.get_display_name("cool-labware")
    ).then_return("Cool Label")

    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)
    result = subject.get_user_display_name()

    assert result == "Cool Label"
    assert result == subject.get_display_name()


def test_get_display_name(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should get the labware's display name from the definition, if no label."""
    labware_definition = LabwareDefinition.construct(  # type: ignore[call-arg]
        ordering=[],
        metadata=LabwareDefinitionMetadata.construct(  # type: ignore[call-arg]
            displayName="Cool Display Name"
        ),
    )

    decoy.when(
        mock_engine_client.state.labware.get_definition("cool-labware")
    ).then_return(labware_definition)

    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)
    result = subject.get_display_name()

    assert result == "Cool Display Name"


def test_is_tip_rack(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should know whether it's a tip rack."""
    labware_definition = LabwareDefinition.construct(  # type: ignore[call-arg]
        ordering=[],
        parameters=LabwareDefinitionParameters.construct(isTiprack=True),  # type: ignore[call-arg]
    )

    decoy.when(
        mock_engine_client.state.labware.get_definition("cool-labware")
    ).then_return(labware_definition)

    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)
    result = subject.is_tip_rack()

    assert result is True


def test_get_wells(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should get a wells list in order, from the definition."""
    labware_definition = LabwareDefinition.construct(  # type: ignore[call-arg]
        ordering=[["A1", "B1"], ["A2", "B2"]],
    )

    decoy.when(
        mock_engine_client.state.labware.get_definition("cool-labware")
    ).then_return(labware_definition)

    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)
    result = subject.get_wells()

    assert len(result) == 4
    assert all(isinstance(wc, WellCore) for wc in result)
    assert list(wc.get_name() for wc in result) == ["A1", "B1", "A2", "B2"]


def test_get_uri(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should get a labware's URI from the core."""
    decoy.when(
        mock_engine_client.state.labware.get_definition_uri("cool-labware")
    ).then_return("great/uri/42")

    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)
    result = subject.get_uri()

    assert result == "great/uri/42"
