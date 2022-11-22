"""Tests for opentrons.protocol_api.core.engine.LabwareCore."""
from typing import cast

import pytest
from decoy import Decoy

from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition as LabwareDefDict,
    LabwareParameters as LabwareParamsDict,
)
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


@pytest.fixture
def subject(mock_engine_client: EngineClient) -> LabwareCore:
    """Get a LabwareCore test subject with mocked out dependencies."""
    return LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)


@pytest.mark.parametrize(
    "labware_definition",
    [
        LabwareDefinition.construct(  # type: ignore[call-arg]
            namespace="hello",
            version=42,
            parameters=LabwareDefinitionParameters.construct(loadName="world"),  # type: ignore[call-arg]
            ordering=[],
        )
    ],
)
def test_get_load_params(subject: LabwareCore) -> None:
    """It should be able to get the definition's load parameters."""
    assert subject.get_load_params() == LabwareLoadParams("hello", "world", 42)
    assert subject.load_name == "world"


def test_set_calibration(subject: LabwareCore) -> None:
    """It should no-op if calibration is set."""
    subject.set_calibration(Point(1, 2, 3))


@pytest.mark.parametrize(
    "labware_definition",
    [
        LabwareDefinition.construct(  # type: ignore[call-arg]
            namespace="hello",
            parameters=LabwareDefinitionParameters.construct(loadName="world"),  # type: ignore[call-arg]
            ordering=[],
        )
    ],
)
def test_get_definition(subject: LabwareCore) -> None:
    """It should get the labware's definition as a dictionary."""
    assert subject.get_definition() == cast(
        LabwareDefDict,
        {"namespace": "hello", "parameters": {"loadName": "world"}, "ordering": []},
    )
    assert subject.get_parameters() == cast(LabwareParamsDict, {"loadName": "world"})


def test_get_user_display_name(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should get the labware's user-provided label, if any."""
    decoy.when(
        mock_engine_client.state.labware.get_display_name("cool-labware")
    ).then_return("Cool Label")

    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)
    result = subject.get_user_display_name()

    assert result == "Cool Label"
    assert result == subject.get_display_name()


@pytest.mark.parametrize(
    "labware_definition",
    [
        LabwareDefinition.construct(  # type: ignore[call-arg]
            ordering=[],
            metadata=LabwareDefinitionMetadata.construct(  # type: ignore[call-arg]
                displayName="Cool Display Name"
            ),
        )
    ],
)
def test_get_display_name(subject: LabwareCore) -> None:
    """It should get the labware's display name from the definition, if no label."""
    result = subject.get_display_name()

    assert result == "Cool Display Name"


@pytest.mark.parametrize(
    "labware_definition",
    [
        LabwareDefinition.construct(  # type: ignore[call-arg]
            ordering=[],
            parameters=LabwareDefinitionParameters.construct(isTiprack=True),  # type: ignore[call-arg]
        )
    ],
)
def test_is_tip_rack(subject: LabwareCore) -> None:
    """It should know whether it's a tip rack."""
    result = subject.is_tip_rack()

    assert result is True


@pytest.mark.parametrize(
    "labware_definition",
    [
        LabwareDefinition.construct(  # type: ignore[call-arg]
            ordering=[["A1", "B1"], ["A2", "B2"]],
        )
    ],
)
def test_get_well_columns(subject: LabwareCore) -> None:
    """It should get a well name columns from the definition."""
    result = subject.get_well_columns()

    assert result == [["A1", "B1"], ["A2", "B2"]]


def test_get_well_core(subject: LabwareCore) -> None:
    """It should get a well name grid from the definition."""
    result = subject.get_well_core("A1")

    assert isinstance(result, WellCore)
    assert result.get_name() == "A1"
    assert result.labware_id == "cool-labware"


def test_get_uri(
    decoy: Decoy, mock_engine_client: EngineClient, subject: LabwareCore
) -> None:
    """It should get a labware's URI from the core."""
    decoy.when(
        mock_engine_client.state.labware.get_definition_uri("cool-labware")
    ).then_return("great/uri/42")

    result = subject.get_uri()

    assert result == "great/uri/42"


def test_get_next_tip(
    decoy: Decoy, mock_engine_client: EngineClient, subject: LabwareCore
) -> None:
    """It should get the next available tip from the core."""
    decoy.when(
        mock_engine_client.state.tips.get_next_tip(
            labware_id="cool-labware",
            use_column=True,
            starting_tip_name="B1",
        )
    ).then_return("A2")

    starting_tip = WellCore(
        name="B1", labware_id="cool-labware", engine_client=mock_engine_client
    )
    result = subject.get_next_tip(num_tips=8, starting_tip=starting_tip)

    assert result == "A2"


def test_reset_tips(
    decoy: Decoy, mock_engine_client: EngineClient, subject: LabwareCore
) -> None:
    """It should reset the tip state of a labware."""
    subject.reset_tips()
    decoy.verify(mock_engine_client.reset_tips(labware_id="cool-labware"), times=1)
