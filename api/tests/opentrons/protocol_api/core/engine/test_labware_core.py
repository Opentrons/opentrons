"""Tests for opentrons.protocol_api.core.engine.LabwareCore."""
from typing import cast

import pytest
from decoy import Decoy

from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition as LabwareDefDict,
    LabwareParameters as LabwareParamsDict,
    LabwareUri,
)
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareRole,
    Parameters as LabwareDefinitionParameters,
    Metadata as LabwareDefinitionMetadata,
)

from opentrons.types import DeckSlotName, Point
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.errors import LabwareNotOnDeckError

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
    """It should raise if you attempt to set calibration."""
    with pytest.raises(NotImplementedError):
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
        {
            "namespace": "hello",
            "parameters": {"loadName": "world"},
            "ordering": [],
            "allowedRoles": [],
            "stackingOffsetWithLabware": {},
            "stackingOffsetWithModule": {},
        },
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
            parameters=LabwareDefinitionParameters.construct(loadName="load-name"),  # type: ignore[call-arg]
        ),
    ],
)
def test_get_name_load_name(subject: LabwareCore) -> None:
    """It should get the load name when no display name is defined."""
    result = subject.get_name()

    assert result == "load-name"


def test_get_name_display_name(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should get the user display name when one is defined."""
    decoy.when(
        mock_engine_client.state.labware.get_display_name("cool-labware")
    ).then_return("my cool display name")

    subject = LabwareCore(labware_id="cool-labware", engine_client=mock_engine_client)

    result = subject.get_name()

    assert result == "my cool display name"


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
    argnames=["labware_definition", "expected_result"],
    argvalues=[
        (
            LabwareDefinition.construct(  # type: ignore[call-arg]
                ordering=[], allowedRoles=[LabwareRole.adapter]
            ),
            True,
        ),
        (
            LabwareDefinition.construct(  # type: ignore[call-arg]
                ordering=[], allowedRoles=[LabwareRole.labware]
            ),
            False,
        ),
    ],
)
def test_is_adapter(expected_result: bool, subject: LabwareCore) -> None:
    """It should know whether it's an adapter."""
    result = subject.is_adapter()

    assert result is expected_result


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
    ).then_return(LabwareUri("great/uri/42"))

    result = subject.get_uri()

    assert result == "great/uri/42"


def test_get_next_tip(
    decoy: Decoy, mock_engine_client: EngineClient, subject: LabwareCore
) -> None:
    """It should get the next available tip from the core."""
    decoy.when(
        mock_engine_client.state.tips.get_next_tip(
            labware_id="cool-labware",
            num_tips=8,
            starting_tip_name="B1",
        )
    ).then_return("A2")

    starting_tip = WellCore(
        name="B1", labware_id="cool-labware", engine_client=mock_engine_client
    )
    result = subject.get_next_tip(num_tips=8, starting_tip=starting_tip)

    assert result == "A2"


@pytest.mark.parametrize(
    "labware_definition",
    [
        LabwareDefinition.construct(  # type: ignore[call-arg]
            ordering=[],
            parameters=LabwareDefinitionParameters.construct(isTiprack=True),  # type: ignore[call-arg]
        )
    ],
)
def test_reset_tips(
    decoy: Decoy, mock_engine_client: EngineClient, subject: LabwareCore
) -> None:
    """It should reset the tip state of a labware."""
    subject.reset_tips()
    decoy.verify(mock_engine_client.reset_tips(labware_id="cool-labware"), times=1)


@pytest.mark.parametrize(
    "labware_definition",
    [
        LabwareDefinition.construct(  # type: ignore[call-arg]
            ordering=[],
            parameters=LabwareDefinitionParameters.construct(isTiprack=False),  # type: ignore[call-arg]
            metadata=LabwareDefinitionMetadata.construct(  # type: ignore[call-arg]
                displayName="Cool Display Name"
            ),
        )
    ],
)
def test_reset_tips_raises_if_not_tip_rack(
    decoy: Decoy, mock_engine_client: EngineClient, subject: LabwareCore
) -> None:
    """It should raise an exception if the labware isn't a tip rack."""
    with pytest.raises(TypeError, match="Cool Display Name is not a tip rack"):
        subject.reset_tips()


def test_get_tip_length(
    decoy: Decoy, mock_engine_client: EngineClient, subject: LabwareCore
) -> None:
    """It should get the tip length of a labware."""
    decoy.when(
        mock_engine_client.state.labware.get_tip_length("cool-labware")
    ).then_return(1.23)

    result = subject.get_tip_length()

    assert result == 1.23


def test_highest_z(
    decoy: Decoy, mock_engine_client: EngineClient, subject: LabwareCore
) -> None:
    """It should return the highest z of a labware."""
    decoy.when(
        mock_engine_client.state.geometry.get_labware_highest_z("cool-labware")
    ).then_return(9000.1)

    result = subject.highest_z

    assert result == 9000.1


def test_get_calibrated_offset(
    decoy: Decoy, mock_engine_client: EngineClient, subject: LabwareCore
) -> None:
    """It should get the calibrated offset."""
    decoy.when(
        mock_engine_client.state.geometry.get_labware_position("cool-labware")
    ).then_return(Point(1, 2, 3))

    result = subject.get_calibrated_offset()

    assert result == Point(1, 2, 3)


@pytest.mark.parametrize(
    "labware_definition",
    [
        LabwareDefinition.construct(  # type: ignore[call-arg]
            ordering=[],
            parameters=LabwareDefinitionParameters.construct(quirks=["quirk"]),  # type: ignore[call-arg]
        )
    ],
)
def test_get_quirks(subject: LabwareCore) -> None:
    """It should get a list of labware quirks."""
    result = subject.get_quirks()

    assert result == ["quirk"]


def test_get_deck_slot(
    decoy: Decoy, mock_engine_client: EngineClient, subject: LabwareCore
) -> None:
    """It should return its deck slot location, if in a slot."""
    decoy.when(
        mock_engine_client.state.geometry.get_ancestor_slot_name("cool-labware")
    ).then_return(DeckSlotName.SLOT_5)

    assert subject.get_deck_slot() == DeckSlotName.SLOT_5

    decoy.when(
        mock_engine_client.state.geometry.get_ancestor_slot_name("cool-labware")
    ).then_raise(LabwareNotOnDeckError("oh no"))

    assert subject.get_deck_slot() is None
