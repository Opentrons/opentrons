"""Addressable area state store tests."""
import pytest

from opentrons_shared_data.deck.dev_types import DeckDefinitionV4
from opentrons_shared_data.labware.labware_definition import Parameters
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName

from opentrons.protocol_engine.commands import Command
from opentrons.protocol_engine.actions import UpdateCommandAction
from opentrons.protocol_engine.errors import (
    # AreaNotInDeckConfigurationError,
    IncompatibleAddressableAreaError,
)
from opentrons.protocol_engine.state import Config
from opentrons.protocol_engine.state.addressable_areas import (
    AddressableAreaStore,
    AddressableAreaState,
)
from opentrons.protocol_engine.types import (
    DeckConfigurationType,
    DeckType,
    ModuleModel,
    LabwareMovementStrategy,
    DeckSlotLocation,
    AddressableAreaLocation,
)

from .command_fixtures import (
    create_load_labware_command,
    create_load_module_command,
    create_move_labware_command,
)


def _make_deck_config() -> DeckConfigurationType:
    return [
        ("cutoutA1", "singleLeftSlot"),
        ("cutoutB1", "singleLeftSlot"),
        ("cutoutC1", "singleLeftSlot"),
        ("cutoutD1", "singleLeftSlot"),
        ("cutoutA2", "singleCenterSlot"),
        ("cutoutB2", "singleCenterSlot"),
        ("cutoutC2", "singleCenterSlot"),
        ("cutoutD2", "singleCenterSlot"),
        ("cutoutA3", "trashBinAdapter"),
        ("cutoutB3", "singleRightSlot"),
        ("cutoutC3", "stagingAreaRightSlot"),
        ("cutoutD3", "wasteChuteRightAdapterNoCover"),
    ]


@pytest.fixture
def simulated_subject(
    ot3_standard_deck_def: DeckDefinitionV4,
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
    )


@pytest.fixture
def subject(
    ot3_standard_deck_def: DeckDefinitionV4,
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
    )


def test_initial_state_simulated(
    ot3_standard_deck_def: DeckDefinitionV4,
    simulated_subject: AddressableAreaStore,
) -> None:
    """It should create the Addressable Area store with no loaded addressable areas."""
    assert simulated_subject.state == AddressableAreaState(
        loaded_addressable_areas_by_name={},
        potential_cutout_fixtures_by_cutout_id={},
        deck_definition=ot3_standard_deck_def,
        use_simulated_deck_config=True,
    )


def test_initial_state(
    ot3_standard_deck_def: DeckDefinitionV4,
    subject: AddressableAreaStore,
) -> None:
    """It should create the Addressable Area store with loaded addressable areas."""
    assert subject.state.potential_cutout_fixtures_by_cutout_id == {}
    assert not subject.state.use_simulated_deck_config
    assert subject.state.deck_definition == ot3_standard_deck_def
    # Loading 9 regular slots, 1 trash, 2 Staging Area slots and 3 waste chute types
    assert len(subject.state.loaded_addressable_areas_by_name) == 15


@pytest.mark.parametrize(
    ("command", "expected_area"),
    (
        (
            create_load_labware_command(
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
                labware_id="test-labware-id",
                definition=LabwareDefinition.construct(  # type: ignore[call-arg]
                    parameters=Parameters.construct(loadName="blah"),  # type: ignore[call-arg]
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
                definition=LabwareDefinition.construct(  # type: ignore[call-arg]
                    parameters=Parameters.construct(loadName="blah"),  # type: ignore[call-arg]
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
    ),
)
def test_addressable_area_referencing_commands_load_on_simulated_deck(
    command: Command,
    expected_area: str,
    simulated_subject: AddressableAreaStore,
) -> None:
    """It should check and store the addressable area when referenced in a command."""
    simulated_subject.handle_action(
        UpdateCommandAction(private_result=None, command=command)
    )
    assert expected_area in simulated_subject.state.loaded_addressable_areas_by_name


@pytest.mark.parametrize(
    "command",
    (
        create_load_labware_command(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_D3),
            labware_id="test-labware-id",
            definition=LabwareDefinition.construct(  # type: ignore[call-arg]
                parameters=Parameters.construct(loadName="blah"),  # type: ignore[call-arg]
                namespace="bleh",
                version=123,
            ),
            offset_id="offset-id",
            display_name="display-name",
        ),
        create_load_module_command(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_D3),
            module_id="test-module-id",
            model=ModuleModel.TEMPERATURE_MODULE_V2,
        ),
        create_move_labware_command(
            new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_D3),
            strategy=LabwareMovementStrategy.USING_GRIPPER,
        ),
    ),
)
def test_handles_command_simulated_raises(
    command: Command,
    simulated_subject: AddressableAreaStore,
) -> None:
    """It should raise when two incompatible areas are referenced."""
    initial_command = create_move_labware_command(
        new_location=AddressableAreaLocation(addressableAreaName="gripperWasteChute"),
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )

    simulated_subject.handle_action(
        UpdateCommandAction(private_result=None, command=initial_command)
    )

    with pytest.raises(IncompatibleAddressableAreaError):
        simulated_subject.handle_action(
            UpdateCommandAction(private_result=None, command=command)
        )


@pytest.mark.parametrize(
    ("command", "expected_area"),
    (
        (
            create_load_labware_command(
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
                labware_id="test-labware-id",
                definition=LabwareDefinition.construct(  # type: ignore[call-arg]
                    parameters=Parameters.construct(loadName="blah"),  # type: ignore[call-arg]
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
                definition=LabwareDefinition.construct(  # type: ignore[call-arg]
                    parameters=Parameters.construct(loadName="blah"),  # type: ignore[call-arg]
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
    subject.handle_action(UpdateCommandAction(private_result=None, command=command))
    assert expected_area in subject.state.loaded_addressable_areas_by_name


# TODO Uncomment this out once this check is back in
# @pytest.mark.parametrize(
#     "command",
#     (
#         create_load_labware_command(
#             location=DeckSlotLocation(slotName=DeckSlotName.SLOT_D3),
#             labware_id="test-labware-id",
#             definition=LabwareDefinition.construct(  # type: ignore[call-arg]
#                 parameters=Parameters.construct(loadName="blah"),  # type: ignore[call-arg]
#                 namespace="bleh",
#                 version=123,
#             ),
#             offset_id="offset-id",
#             display_name="display-name",
#         ),
#         create_load_module_command(
#             location=DeckSlotLocation(slotName=DeckSlotName.SLOT_D3),
#             module_id="test-module-id",
#             model=ModuleModel.TEMPERATURE_MODULE_V2,
#         ),
#         create_move_labware_command(
#             new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_D3),
#             strategy=LabwareMovementStrategy.USING_GRIPPER,
#         ),
#     ),
# )
# def test_handles_load_labware_raises(
#     command: Command,
#     subject: AddressableAreaStore,
# ) -> None:
#     """It should raise when referencing an addressable area not in the deck config."""
#     with pytest.raises(AreaNotInDeckConfigurationError):
#         subject.handle_action(UpdateCommandAction(private_result=None, command=command))
