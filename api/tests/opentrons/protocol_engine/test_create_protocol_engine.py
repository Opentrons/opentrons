"""Smoke tests for the ProtocolEngine creation factory."""

import pytest

from opentrons_shared_data.deck import load as load_deck
from opentrons_shared_data.deck.types import DeckDefinitionV6
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.hardware_control.ot3api import OT3API as HardwareAPI
from opentrons.hardware_control.types import DoorState
from opentrons.protocol_engine import (
    Config as EngineConfig,
)
from opentrons.protocol_engine import (
    DeckType,
    ProtocolEngine,
    error_recovery_policy,
)
from opentrons.protocol_engine.create_protocol_engine import create_protocol_engine
from opentrons.protocol_engine.types import DeckSlotLocation, LoadedLabware
from opentrons.protocols.api_support.deck_type import (
    STANDARD_OT3_DECK,
)
from opentrons.types import DeckSlotName


@pytest.fixture(scope="session")
def ot3_standard_deck_def() -> DeckDefinitionV6:
    """Get the OT-3 standard deck definition."""
    return load_deck(STANDARD_OT3_DECK, 6)


async def test_create_engine_initializes_state_with_no_fixed_trash(
    hardware_api: HardwareAPI,
    ot3_standard_deck_def: DeckDefinitionV6,
) -> None:
    """It should load deck geometry data into the store on create."""
    engine = await create_protocol_engine(
        hardware_api=hardware_api,
        config=EngineConfig(
            # robot_type chosen to match hardware_api.
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
        ),
        error_recovery_policy=error_recovery_policy.never_recover,
        load_fixed_trash=False,
    )
    state = engine.state_view

    assert isinstance(engine, ProtocolEngine)
    assert state.labware.get_deck_definition() == ot3_standard_deck_def
    assert state.labware.get_all() == []


async def test_create_engine_initializes_state_with_fixed_trash(
    hardware_api: HardwareAPI,
    ot3_standard_deck_def: DeckDefinitionV6,
    ot3_fixed_trash_def: LabwareDefinition,
) -> None:
    """It should load deck geometry data into the store on create."""
    engine = await create_protocol_engine(
        hardware_api=hardware_api,
        config=EngineConfig(
            # robot_type chosen to match hardware_api.
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
        ),
        error_recovery_policy=error_recovery_policy.never_recover,
        load_fixed_trash=True,
    )
    state = engine.state_view

    assert isinstance(engine, ProtocolEngine)
    assert state.labware.get_deck_definition() == ot3_standard_deck_def
    assert state.labware.get_all() == [
        LoadedLabware(
            id="fixedTrash",
            loadName=ot3_fixed_trash_def.parameters.loadName,
            definitionUri=uri_from_details(
                load_name=ot3_fixed_trash_def.parameters.loadName,
                namespace=ot3_fixed_trash_def.namespace,
                version=ot3_fixed_trash_def.version,
            ),
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A3),
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
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
        ),
        error_recovery_policy=error_recovery_policy.never_recover,
    )
    state = engine.state_view
    assert state.commands.get_is_door_blocking() is True
