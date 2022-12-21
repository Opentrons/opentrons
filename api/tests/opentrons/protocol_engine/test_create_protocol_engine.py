"""Smoke tests for the ProtocolEngine creation factory."""
from opentrons.calibration_storage.helpers import uri_from_details
from opentrons_shared_data.deck.dev_types import DeckDefinitionV3
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import DoorState

from opentrons.protocol_engine import (
    ProtocolEngine,
    Config as EngineConfig,
    create_protocol_engine,
)
from opentrons.protocol_engine.types import DeckSlotLocation, LoadedLabware


async def test_create_engine_initializes_state_with_deck_geometry(
    hardware_api: HardwareAPI,
    standard_deck_def: DeckDefinitionV3,
    fixed_trash_def: LabwareDefinition,
) -> None:
    """It should load deck geometry data into the store on create."""
    engine = await create_protocol_engine(
        hardware_api=hardware_api,
        config=EngineConfig(
            # robot_type chosen to match hardware_api.
            robot_type="OT-2 Standard"
        ),
    )
    state = engine.state_view

    assert isinstance(engine, ProtocolEngine)

    # TODO(mm, 2022-12-07): The expected deck definition and fixed trash
    # labware should depend on EngineConfig, and we should parametrize this
    # test to cover that.
    assert state.labware.get_deck_definition() == standard_deck_def
    assert state.labware.get_all() == [
        LoadedLabware(
            id="fixedTrash",
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


async def test_create_engine_initializes_state_with_door_state(
    hardware_api: HardwareAPI,
) -> None:
    """It should load current door status into the store on create."""
    hardware_api.door_state = DoorState.OPEN
    engine = await create_protocol_engine(
        hardware_api=hardware_api,
        config=EngineConfig(
            block_on_door_open=True,
            robot_type="OT-2 Standard",  # Choice of robot_type is arbitrary.
        ),
    )
    state = engine.state_view
    assert state.commands.get_is_door_blocking() is True
