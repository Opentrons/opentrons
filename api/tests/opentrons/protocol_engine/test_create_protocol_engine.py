"""Smoke tests for the ProtocolEngine creation factory."""
from opentrons.calibration_storage.helpers import uri_from_details
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName
from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocols.geometry.deck import FIXED_TRASH_ID

from opentrons.protocol_engine import ProtocolEngine, create_protocol_engine
from opentrons.protocol_engine.types import DeckSlotLocation, LoadedLabware


async def test_create_engine_initializes_state_with_deck_geometry(
    hardware_api: HardwareAPI,
    standard_deck_def: DeckDefinitionV2,
    fixed_trash_def: LabwareDefinition,
) -> None:
    """It should load deck geometry data into the store on create."""
    engine = await create_protocol_engine(hardware_api=hardware_api)
    state = engine.state_view

    assert isinstance(engine, ProtocolEngine)
    assert state.labware.get_deck_definition() == standard_deck_def
    assert state.labware.get_all() == [
        LoadedLabware(
            id=FIXED_TRASH_ID,
            loadName=fixed_trash_def.parameters.loadName,
            definitionUri=uri_from_details(
                load_name=fixed_trash_def.parameters.loadName,
                namespace=fixed_trash_def.namespace,
                version=fixed_trash_def.version,
            ),
            location=DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH),
            offsetId=None,
        )
    ]
