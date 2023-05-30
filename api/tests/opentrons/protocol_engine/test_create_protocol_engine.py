"""Smoke tests for the ProtocolEngine creation factory."""
import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]

from opentrons_shared_data.deck.dev_types import DeckDefinitionV3
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import DoorState
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import (
    ProtocolEngine,
    Config as EngineConfig,
    DeckType,
    create_protocol_engine,
)
from opentrons.protocol_engine.types import DeckSlotLocation, LoadedLabware
from opentrons.types import DeckSlotName


@pytest.mark.parametrize(
    (
        "robot_type",
        "deck_type",
        "expected_deck_def",
        "expected_fixed_trash_def",
        "expected_fixed_trash_slot",
    ),
    [
        (
            "OT-2 Standard",
            DeckType.OT2_STANDARD,
            lazy_fixture("ot2_standard_deck_def"),
            lazy_fixture("ot2_fixed_trash_def"),
            DeckSlotName.FIXED_TRASH,
        ),
        (
            "OT-2 Standard",
            DeckType.OT2_SHORT_TRASH,
            lazy_fixture("ot2_short_trash_deck_def"),
            lazy_fixture("ot2_short_fixed_trash_def"),
            DeckSlotName.FIXED_TRASH,
        ),
        (
            "OT-3 Standard",
            DeckType.OT3_STANDARD,
            lazy_fixture("ot3_standard_deck_def"),
            lazy_fixture("ot3_fixed_trash_def"),
            DeckSlotName.FIXED_TRASH,  # TODO: Update when OT-3 deck slots get renamed.
        ),
    ],
)
async def test_create_engine_initializes_state_with_deck_geometry(
    hardware_api: HardwareAPI,
    robot_type: RobotType,
    deck_type: DeckType,
    expected_deck_def: DeckDefinitionV3,
    expected_fixed_trash_def: LabwareDefinition,
    expected_fixed_trash_slot: DeckSlotName,
) -> None:
    """It should load deck geometry data into the store on create."""
    engine = await create_protocol_engine(
        hardware_api=hardware_api,
        config=EngineConfig(
            # robot_type chosen to match hardware_api.
            robot_type=robot_type,
            deck_type=deck_type,
        ),
    )
    state = engine.state_view

    assert isinstance(engine, ProtocolEngine)
    assert state.labware.get_deck_definition() == expected_deck_def
    assert state.labware.get_all() == [
        LoadedLabware(
            id="fixedTrash",
            loadName=expected_fixed_trash_def.parameters.loadName,
            definitionUri=uri_from_details(
                load_name=expected_fixed_trash_def.parameters.loadName,
                namespace=expected_fixed_trash_def.namespace,
                version=expected_fixed_trash_def.version,
            ),
            location=DeckSlotLocation(slotName=expected_fixed_trash_slot),
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
            # Choice of robot and deck type are arbitrary.
            robot_type="OT-2 Standard",
            deck_type=DeckType.OT2_SHORT_TRASH,
        ),
    )
    state = engine.state_view
    assert state.commands.get_is_door_blocking() is True
