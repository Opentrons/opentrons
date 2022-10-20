"""Tests for opentrons.protocol_api.core.engine.ModuleCore."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_api.core.engine.module_core import ModuleCore
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
)
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.types import DeckSlotName
from opentrons.protocols.api_support.types import APIVersion


@pytest.fixture
def mock_module_geometry(decoy: Decoy) -> ModuleGeometry:
    """Get a mock of ModuleGeometry."""
    return decoy.mock(cls=ModuleGeometry)


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture()
def subject(
    mock_engine_client: EngineClient, mock_module_geometry: ModuleGeometry
) -> ModuleCore:
    """Get a ModuleCore test subject."""
    return ModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=APIVersion(2, 12),
    )


def test_get_deck_slot(
    decoy: Decoy, subject: ModuleCore, mock_engine_client: EngineClient
) -> None:
    """Should return the deck slot accosiated to the module id."""
    decoy.when(mock_engine_client.state.modules.get_location("1234")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )

    assert subject.get_deck_slot() == DeckSlotName.SLOT_1
