"""Addressable area state store tests.

DEPRECATED: Testing AddressableAreaStore independently of AddressableAreaView is no
longer helpful. Add new tests to test_addressable_area_state.py, where they can be
tested together.
"""

import pytest

from opentrons_shared_data.deck.types import DeckDefinitionV5
from opentrons_shared_data.labware.models import Parameters
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName

from opentrons.protocol_engine.commands import Command
from opentrons.protocol_engine.actions import (
    SucceedCommandAction,
    AddAddressableAreaAction,
)
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.state.addressable_areas import (
    AddressableAreaStore,
    AddressableAreaState,
)
from opentrons.protocol_engine.types import (
    DeckType,
    DeckConfigurationType,
    ModuleModel,
    LabwareMovementStrategy,
    DeckSlotLocation,
    AddressableAreaLocation,
)

from .command_fixtures import (
    create_load_labware_command,
    create_load_module_command,
    create_move_labware_command,
    create_move_to_addressable_area_command,
)


def _make_deck_config() -> DeckConfigurationType:
    return [
        ("cutoutA1", "singleLeftSlot", None),
        ("cutoutB1", "singleLeftSlot", None),
        ("cutoutC1", "singleLeftSlot", None),
        ("cutoutD1", "singleLeftSlot", None),
        ("cutoutA2", "singleCenterSlot", None),
        ("cutoutB2", "singleCenterSlot", None),
        ("cutoutC2", "singleCenterSlot", None),
        ("cutoutD2", "singleCenterSlot", None),
        ("cutoutA3", "trashBinAdapter", None),
        ("cutoutB3", "singleRightSlot", None),
        ("cutoutC3", "stagingAreaRightSlot", None),
        ("cutoutD3", "wasteChuteRightAdapterNoCover", None),
    ]


@pytest.fixture
def simulated_subject(
    ot3_standard_deck_def: DeckDefinitionV5,
) -> AddressableAreaStore:
    """Get an AddressableAreaStore test subject, under simulated deck conditions."""
    return AddressableAreaStore(
        deck_configuration=[],
        config=Config(
            use_simulated_deck_config=True,
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
        ),
        deck_definition=ot3_standard_deck_def,
        robot_definition={
            "displayName": "OT-3",
            "robotType": "OT-3 Standard",
            "models": ["OT-3 Standard"],
            "extents": [477.2, 493.8, 0.0],
            "paddingOffsets": {
                "rear": -177.42,
                "front": 51.8,
                "leftSide": 31.88,
                "rightSide": -80.32,
            },
            "mountOffsets": {
                "left": [-13.5, -60.5, 255.675],
                "right": [40.5, -60.5, 255.675],
                "gripper": [84.55, -12.75, 93.85],
            },
        },
    )


@pytest.fixture
def subject(
    ot3_standard_deck_def: DeckDefinitionV5,
) -> AddressableAreaStore:
    """Get an AddressableAreaStore test subject."""
    return AddressableAreaStore(
        deck_configuration=_make_deck_config(),
        config=Config(
            use_simulated_deck_config=False,
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
        ),
        deck_definition=ot3_standard_deck_def,
        robot_definition={
            "displayName": "OT-3",
            "robotType": "OT-3 Standard",
            "models": ["OT-3 Standard"],
            "extents": [477.2, 493.8, 0.0],
            "paddingOffsets": {
                "rear": -177.42,
                "front": 51.8,
                "leftSide": 31.88,
                "rightSide": -80.32,
            },
            "mountOffsets": {
                "left": [-13.5, -60.5, 255.675],
                "right": [40.5, -60.5, 255.675],
                "gripper": [84.55, -12.75, 93.85],
            },
        },
    )


def test_initial_state_simulated(
    ot3_standard_deck_def: DeckDefinitionV5,
    simulated_subject: AddressableAreaStore,
) -> None:
    """It should create the Addressable Area store with no loaded addressable areas."""
    assert simulated_subject.state == AddressableAreaState(
        loaded_addressable_areas_by_name={},
        potential_cutout_fixtures_by_cutout_id={},
        deck_definition=ot3_standard_deck_def,
        deck_configuration=[],
        robot_type="OT-3 Standard",
        use_simulated_deck_config=True,
        robot_definition={
            "displayName": "OT-3",
            "robotType": "OT-3 Standard",
            "models": ["OT-3 Standard"],
            "extents": [477.2, 493.8, 0.0],
            "paddingOffsets": {
                "rear": -177.42,
                "front": 51.8,
                "leftSide": 31.88,
                "rightSide": -80.32,
            },
            "mountOffsets": {
                "left": [-13.5, -60.5, 255.675],
                "right": [40.5, -60.5, 255.675],
                "gripper": [84.55, -12.75, 93.85],
            },
        },
    )


def test_initial_state(
    ot3_standard_deck_def: DeckDefinitionV5,
    subject: AddressableAreaStore,
) -> None:
    """It should create the Addressable Area store with loaded addressable areas."""
    assert subject.state.potential_cutout_fixtures_by_cutout_id == {}
    assert not subject.state.use_simulated_deck_config
    assert subject.state.deck_definition == ot3_standard_deck_def
    assert subject.state.deck_configuration == _make_deck_config()
    # Loading 9 regular slots, 1 trash, 2 Staging Area slots and 4 waste chute types
    assert len(subject.state.loaded_addressable_areas_by_name) == 16


@pytest.mark.parametrize(
    ("command", "expected_area"),
    (
        (
            create_load_labware_command(
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
                labware_id="test-labware-id",
                definition=LabwareDefinition.construct(
                    parameters=Parameters.construct(loadName="blah"),
                    namespace="bleh",
                    version=123,
                ),
                offset_id="offset-id",
                display_name="display-name",
            ),
            "A1",
        ),
        (
            create_load_labware_command(
                location=AddressableAreaLocation(addressableAreaName="A4"),
                labware_id="test-labware-id",
                definition=LabwareDefinition.construct(
                    parameters=Parameters.construct(loadName="blah"),
                    namespace="bleh",
                    version=123,
                ),
                offset_id="offset-id",
                display_name="display-name",
            ),
            "A4",
        ),
        (
            create_load_module_command(
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
                module_id="test-module-id",
                model=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            "A1",
        ),
        (
            create_move_labware_command(
                new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
                strategy=LabwareMovementStrategy.USING_GRIPPER,
            ),
            "A1",
        ),
        (
            create_move_labware_command(
                new_location=AddressableAreaLocation(addressableAreaName="A4"),
                strategy=LabwareMovementStrategy.USING_GRIPPER,
            ),
            "A4",
        ),
        (
            create_move_to_addressable_area_command(
                pipette_id="pipette-id", addressable_area_name="gripperWasteChute"
            ),
            "gripperWasteChute",
        ),
    ),
)
def test_addressable_area_referencing_commands_load_on_simulated_deck(
    command: Command,
    expected_area: str,
    simulated_subject: AddressableAreaStore,
) -> None:
    """It should check and store the addressable area when referenced in a command."""
    simulated_subject.handle_action(
        SucceedCommandAction(private_result=None, command=command)
    )
    assert expected_area in simulated_subject.state.loaded_addressable_areas_by_name


@pytest.mark.parametrize(
    ("command", "expected_area"),
    (
        (
            create_load_labware_command(
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
                labware_id="test-labware-id",
                definition=LabwareDefinition.construct(
                    parameters=Parameters.construct(loadName="blah"),
                    namespace="bleh",
                    version=123,
                ),
                offset_id="offset-id",
                display_name="display-name",
            ),
            "A1",
        ),
        (
            create_load_labware_command(
                location=AddressableAreaLocation(addressableAreaName="C4"),
                labware_id="test-labware-id",
                definition=LabwareDefinition.construct(
                    parameters=Parameters.construct(loadName="blah"),
                    namespace="bleh",
                    version=123,
                ),
                offset_id="offset-id",
                display_name="display-name",
            ),
            "C4",
        ),
        (
            create_load_module_command(
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
                module_id="test-module-id",
                model=ModuleModel.TEMPERATURE_MODULE_V2,
            ),
            "A1",
        ),
        (
            create_move_labware_command(
                new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
                strategy=LabwareMovementStrategy.USING_GRIPPER,
            ),
            "A1",
        ),
        (
            create_move_labware_command(
                new_location=AddressableAreaLocation(addressableAreaName="C4"),
                strategy=LabwareMovementStrategy.USING_GRIPPER,
            ),
            "C4",
        ),
    ),
)
def test_addressable_area_referencing_commands_load(
    command: Command,
    expected_area: str,
    subject: AddressableAreaStore,
) -> None:
    """It should check that the addressable area is in the deck config."""
    subject.handle_action(SucceedCommandAction(private_result=None, command=command))
    assert expected_area in subject.state.loaded_addressable_areas_by_name


def test_add_addressable_area_action(
    simulated_subject: AddressableAreaStore,
) -> None:
    """It should add the addressable area to the store."""
    simulated_subject.handle_action(
        AddAddressableAreaAction(
            addressable_area=AddressableAreaLocation(
                addressableAreaName="movableTrashA1"
            )
        )
    )
    assert "movableTrashA1" in simulated_subject.state.loaded_addressable_areas_by_name
