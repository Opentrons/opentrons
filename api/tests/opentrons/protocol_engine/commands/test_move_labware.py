"""Test the ``moveLabware`` command."""

import inspect
from datetime import datetime
from unittest.mock import sentinel

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.errors.exceptions import (
    EnumeratedError,
    FailedGripperPickupError,
    LabwareDroppedError,
    StallOrCollisionDetectedError,
)
from opentrons_shared_data.gripper.constants import GRIPPER_PADDLE_WIDTH
from opentrons_shared_data.labware.labware_definition import (
    Dimensions,
    LabwareDefinition,
    LabwareDefinition2,
    Parameters2,
)

from opentrons.protocol_engine import Config, errors
from opentrons.protocol_engine.commands.command import DefinedErrorData, SuccessData
from opentrons.protocol_engine.commands.move_labware import (
    GripperMovementError,
    MoveLabwareImplementation,
    MoveLabwareParams,
    MoveLabwareResult,
    VacuumModuleUnderVacuumMovementError,
)
from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    LabwareMovementHandler,
    RunControlHandler,
)
from opentrons.protocol_engine.resources import labware_validation
from opentrons.protocol_engine.resources.model_utils import ModelUtils
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types import (
    WASTE_CHUTE_LOCATION,
    AddressableAreaLocation,
    CurrentWell,
    DeckSlotLocation,
    DeckType,
    LabwareLocationSequence,
    LabwareMovementStrategy,
    LabwareOffsetVector,
    LoadedLabware,
    ModuleLocation,
    NotOnDeckLocationSequenceComponent,
    OnAddressableAreaLocationSequenceComponent,
    OnLabwareLocation,
    OnLabwareLocationSequenceComponent,
)
from opentrons.protocol_engine.types.module import LoadedModule, ModuleModel
from opentrons.types import DeckSlotName, Point


@pytest.fixture(autouse=True)
def patch_mock_labware_validation(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out labware_validation.py functions."""
    for name, func in inspect.getmembers(labware_validation, inspect.isfunction):
        monkeypatch.setattr(labware_validation, name, decoy.mock(func=func))
    decoy.when(
        labware_validation.validate_definition_is_deck_slot_compatible(
            matchers.Anything()
        )
    ).then_return(True)


@pytest.fixture
def subject(
    equipment: EquipmentHandler,
    labware_movement: LabwareMovementHandler,
    state_view: StateView,
    run_control: RunControlHandler,
    model_utils: ModelUtils,
) -> MoveLabwareImplementation:
    """Return a test subject configured to use mocked-out dependencies."""
    return MoveLabwareImplementation(
        state_view=state_view,
        equipment=equipment,
        labware_movement=labware_movement,
        run_control=run_control,
        model_utils=model_utils,
    )


@pytest.mark.parametrize(
    argnames=["strategy", "times_pause_called"],
    argvalues=[
        [LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE, 1],
        [LabwareMovementStrategy.MANUAL_MOVE_WITHOUT_PAUSE, 0],
    ],
)
async def test_manual_move_labware_implementation(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    subject: MoveLabwareImplementation,
    equipment: EquipmentHandler,
    state_view: StateView,
    run_control: RunControlHandler,
    strategy: LabwareMovementStrategy,
    times_pause_called: int,
) -> None:
    """It should execute a pause and return the new offset."""
    new_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_4)
    data = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=new_location,
        strategy=strategy,
    )

    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_return(
        LoadedLabware(
            id="my-cool-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            offsetId=None,
        )
    )

    lw_def = LabwareDefinition2.model_construct(
        namespace="opentrons-test",
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.get_definition(labware_id="my-cool-labware-id")
    ).then_return(lw_def)
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
            None,
            lw_def,
        )
    ).then_return(DeckSlotLocation(slotName=DeckSlotName.SLOT_5))
    decoy.when(
        equipment.find_applicable_labware_offset_id(
            labware_definition_uri="opentrons-test/load-name/1",
            labware_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
        )
    ).then_return("wowzers-a-new-offset-id")
    decoy.when(
        state_view.geometry.get_location_sequence("my-cool-labware-id")
    ).then_return([OnAddressableAreaLocationSequenceComponent(addressableAreaName="5")])
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(new_location)
    ).then_return([OnAddressableAreaLocationSequenceComponent(addressableAreaName="4")])

    result = await subject.execute(data)
    decoy.verify(await run_control.wait_for_resume(), times=times_pause_called)
    decoy.verify(
        state_view.labware.raise_if_labware_has_non_lid_labware_on_top(
            "my-cool-labware-id"
        )
    )
    assert result == SuccessData(
        public=MoveLabwareResult(
            offsetId="wowzers-a-new-offset-id",
            originLocationSequence=[
                OnAddressableAreaLocationSequenceComponent(addressableAreaName="5")
            ],
            immediateDestinationLocationSequence=[
                OnAddressableAreaLocationSequenceComponent(addressableAreaName="4")
            ],
            eventualDestinationLocationSequence=[
                OnAddressableAreaLocationSequenceComponent(addressableAreaName="4")
            ],
        ),
        state_update=update_types.StateUpdate(
            labware_location=update_types.LabwareLocationUpdate(
                labware_id="my-cool-labware-id",
                offset_id="wowzers-a-new-offset-id",
                new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
            ),
            addressable_area_used=update_types.AddressableAreaUsedUpdate(
                addressable_area_name=new_location.slotName.id
            ),
        ),
    )


async def test_move_labware_implementation_on_labware(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    equipment: EquipmentHandler,
    state_view: StateView,
    run_control: RunControlHandler,
) -> None:
    """It should execute a pause and return the new offset."""
    data = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=OnLabwareLocation(labwareId="new-labware-id"),
        strategy=LabwareMovementStrategy.MANUAL_MOVE_WITHOUT_PAUSE,
    )

    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_return(
        LoadedLabware(
            id="my-cool-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            offsetId=None,
        )
    )
    lw_def = LabwareDefinition2.model_construct(
        namespace="opentrons-test",
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.get_definition(labware_id="my-cool-labware-id")
    ).then_return(lw_def)
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            OnLabwareLocation(labwareId="new-labware-id"), None, lw_def
        )
    ).then_return(OnLabwareLocation(labwareId="my-even-cooler-labware-id"))
    decoy.when(
        equipment.find_applicable_labware_offset_id(
            labware_definition_uri="opentrons-test/load-name/1",
            labware_location=OnLabwareLocation(labwareId="my-even-cooler-labware-id"),
        )
    ).then_return("wowzers-a-new-offset-id")
    decoy.when(
        state_view.geometry.get_location_sequence("my-cool-labware-id")
    ).then_return([OnAddressableAreaLocationSequenceComponent(addressableAreaName="1")])
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            OnLabwareLocation(labwareId="new-labware-id")
        )
    ).then_return(
        [
            OnLabwareLocationSequenceComponent(labwareId="new-labware-id", lidId=None),
            OnAddressableAreaLocationSequenceComponent(addressableAreaName="2"),
        ]
    )

    result = await subject.execute(data)
    decoy.verify(
        state_view.labware.raise_if_labware_has_non_lid_labware_on_top(
            "my-cool-labware-id"
        ),
        state_view.labware.raise_if_labware_is_contained("my-cool-labware-id"),
        state_view.labware.raise_if_labware_has_labware_on_top(
            "my-even-cooler-labware-id"
        ),
        state_view.labware.raise_if_labware_cannot_be_stacked(
            lw_def,
            "my-even-cooler-labware-id",
        ),
    )
    assert result == SuccessData(
        public=MoveLabwareResult(
            offsetId="wowzers-a-new-offset-id",
            originLocationSequence=[
                OnAddressableAreaLocationSequenceComponent(addressableAreaName="1")
            ],
            immediateDestinationLocationSequence=[
                OnLabwareLocationSequenceComponent(
                    labwareId="new-labware-id", lidId=None
                ),
                OnAddressableAreaLocationSequenceComponent(addressableAreaName="2"),
            ],
            eventualDestinationLocationSequence=[
                OnLabwareLocationSequenceComponent(
                    labwareId="new-labware-id", lidId=None
                ),
                OnAddressableAreaLocationSequenceComponent(addressableAreaName="2"),
            ],
        ),
        state_update=update_types.StateUpdate(
            labware_location=update_types.LabwareLocationUpdate(
                labware_id="my-cool-labware-id",
                offset_id="wowzers-a-new-offset-id",
                new_location=OnLabwareLocation(labwareId="my-even-cooler-labware-id"),
            )
        ),
    )


async def test_gripper_move_labware_implementation(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    equipment: EquipmentHandler,
    labware_movement: LabwareMovementHandler,
    state_view: StateView,
) -> None:
    """It should delegate to the equipment handler and return the new offset."""
    from_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    new_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_5)
    pick_up_offset = LabwareOffsetVector(x=1, y=2, z=3)

    data = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=new_location,
        strategy=LabwareMovementStrategy.USING_GRIPPER,
        pickUpOffset=pick_up_offset,
        dropOffset=None,
    )

    lw_def = LabwareDefinition2.model_construct(
        namespace="opentrons-test",
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.get_definition(labware_id="my-cool-labware-id")
    ).then_return(lw_def)
    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_return(
        LoadedLabware(
            id="my-cool-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=from_location,
            offsetId=None,
        )
    )
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(new_location, None, lw_def)
    ).then_return(sentinel.new_location_validated_unoccupied)
    decoy.when(
        equipment.find_applicable_labware_offset_id(
            labware_definition_uri="opentrons-test/load-name/1",
            labware_location=sentinel.new_location_validated_unoccupied,
        )
    ).then_return("wowzers-a-new-offset-id")

    decoy.when(
        state_view.geometry.ensure_valid_gripper_location(from_location)
    ).then_return(sentinel.from_location_validated_for_gripper)
    decoy.when(
        state_view.geometry.ensure_valid_gripper_location(
            sentinel.new_location_validated_unoccupied
        )
    ).then_return(sentinel.new_location_validated_for_gripper)
    decoy.when(labware_validation.validate_gripper_compatible(lw_def)).then_return(True)
    decoy.when(
        state_view.geometry.get_location_sequence("my-cool-labware-id")
    ).then_return(
        [
            OnAddressableAreaLocationSequenceComponent(
                addressableAreaName="1",
            )
        ]
    )
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            sentinel.new_location_validated_for_gripper
        )
    ).then_return([OnAddressableAreaLocationSequenceComponent(addressableAreaName="5")])

    result = await subject.execute(data)
    decoy.verify(
        state_view.labware.raise_if_labware_has_non_lid_labware_on_top(
            "my-cool-labware-id"
        ),
        await labware_movement.move_labware_with_gripper(
            labware_id="my-cool-labware-id",
            current_location=sentinel.from_location_validated_for_gripper,
            new_location=sentinel.new_location_validated_for_gripper,
            user_pick_up_offset=Point(
                pick_up_offset.x, pick_up_offset.y, pick_up_offset.z
            ),
            user_drop_offset=Point(),
            post_drop_slide_offset=None,
        ),
    )
    assert result == SuccessData(
        public=MoveLabwareResult(
            offsetId="wowzers-a-new-offset-id",
            originLocationSequence=[
                OnAddressableAreaLocationSequenceComponent(addressableAreaName="1")
            ],
            immediateDestinationLocationSequence=[
                OnAddressableAreaLocationSequenceComponent(addressableAreaName="5")
            ],
            eventualDestinationLocationSequence=[
                OnAddressableAreaLocationSequenceComponent(addressableAreaName="5")
            ],
        ),
        state_update=update_types.StateUpdate(
            pipette_location=update_types.CLEAR,
            labware_location=update_types.LabwareLocationUpdate(
                labware_id="my-cool-labware-id",
                new_location=sentinel.new_location_validated_unoccupied,
                offset_id="wowzers-a-new-offset-id",
            ),
            addressable_area_used=update_types.AddressableAreaUsedUpdate(
                addressable_area_name=new_location.slotName.id
            ),
        ),
    )


@pytest.mark.parametrize(
    "underlying_exception",
    [
        FailedGripperPickupError(),
        LabwareDroppedError(),
        StallOrCollisionDetectedError(),
    ],
)
async def test_gripper_error(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
    model_utils: ModelUtils,
    labware_movement: LabwareMovementHandler,
    underlying_exception: EnumeratedError,
) -> None:
    """Test the handling of errors during a gripper movement."""
    labware_id = "labware-id"
    labware_load_name = "load-name"
    labware_definition_uri = "opentrons-test/load-name/1"
    origin_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_A1)
    new_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_A2)
    error_id = "error-id"
    error_created_at = datetime.now()

    # Common MoveLabwareImplementation boilerplate:
    lw_def = LabwareDefinition2.model_construct(
        namespace="opentrons-test",
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )
    decoy.when(state_view.labware.get_definition(labware_id=labware_id)).then_return(
        lw_def
    )
    decoy.when(state_view.labware.get(labware_id=labware_id)).then_return(
        LoadedLabware(
            id=labware_id,
            loadName=labware_load_name,
            definitionUri=labware_definition_uri,
            location=origin_location,
            offsetId=None,
        )
    )
    decoy.when(
        state_view.geometry.ensure_valid_gripper_location(origin_location)
    ).then_return(origin_location)
    decoy.when(
        state_view.geometry.ensure_valid_gripper_location(new_location)
    ).then_return(new_location)
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(new_location, None, lw_def)
    ).then_return(new_location)
    decoy.when(labware_validation.validate_gripper_compatible(lw_def)).then_return(True)
    params = MoveLabwareParams(
        labwareId=labware_id,
        newLocation=new_location,
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )

    # Actual setup for this test:
    decoy.when(
        await labware_movement.move_labware_with_gripper(  # type: ignore[func-returns-value]
            labware_id=labware_id,
            current_location=origin_location,
            new_location=new_location,
            user_pick_up_offset=Point(),
            user_drop_offset=Point(),
            post_drop_slide_offset=None,
        )
    ).then_raise(underlying_exception)
    decoy.when(model_utils.get_timestamp()).then_return(error_created_at)
    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(state_view.geometry.get_location_sequence("labware-id")).then_return(
        [OnAddressableAreaLocationSequenceComponent(addressableAreaName="A1")]
    )
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(new_location)
    ).then_return(
        [OnAddressableAreaLocationSequenceComponent(addressableAreaName="A2")]
    )

    result = await subject.execute(params)

    assert result == DefinedErrorData(
        public=GripperMovementError.model_construct(
            id=error_id,
            createdAt=error_created_at,
            errorCode=underlying_exception.code.value.code,
            detail=underlying_exception.code.value.detail,
            errorInfo={
                "originLocationSequence": [
                    OnAddressableAreaLocationSequenceComponent(addressableAreaName="A1")
                ],
                "immediateDestinationLocationSequence": [
                    OnAddressableAreaLocationSequenceComponent(addressableAreaName="A2")
                ],
                "eventualDestinationLocationSequence": [
                    OnAddressableAreaLocationSequenceComponent(addressableAreaName="A2")
                ],
            },
            wrappedErrors=[matchers.Anything()],
        ),
        state_update=update_types.StateUpdate(
            labware_location=update_types.NO_CHANGE,
            pipette_location=update_types.CLEAR,
            addressable_area_used=update_types.AddressableAreaUsedUpdate(
                addressable_area_name=new_location.slotName.id
            ),
        ),
    )


@pytest.mark.parametrize(
    ("current_labware_id", "moved_labware_id", "expect_cleared_location"),
    [
        ("lw1", "lw2", False),
        ("lw1", "lw1", True),
    ],
)
async def test_clears_location_if_current_labware_moved_from_under_pipette(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
    current_labware_id: str,
    moved_labware_id: str,
    expect_cleared_location: bool,
) -> None:
    """If it moves the labware that the pipette is currently over, it should clear the location."""
    from_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_A1)
    to_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_A2)

    decoy.when(state_view.labware.get(labware_id=moved_labware_id)).then_return(
        LoadedLabware(
            id=moved_labware_id,
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=from_location,
            offsetId=None,
        )
    )

    lw_def = LabwareDefinition2.model_construct(
        namespace="opentrons-test",
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.get_definition(labware_id=moved_labware_id)
    ).then_return(lw_def)
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(to_location, None, lw_def)
    ).then_return(to_location)

    decoy.when(state_view.pipettes.get_current_location()).then_return(
        CurrentWell(
            pipette_id="pipette-id", labware_id=current_labware_id, well_name="A1"
        )
    )
    decoy.when(state_view.geometry.get_location_sequence(moved_labware_id)).then_return(
        []
    )
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(to_location)
    ).then_return([])

    result = await subject.execute(
        params=MoveLabwareParams(
            labwareId=moved_labware_id,
            newLocation=to_location,
            strategy=LabwareMovementStrategy.MANUAL_MOVE_WITHOUT_PAUSE,
        )
    )
    assert (
        result.state_update.pipette_location == update_types.CLEAR
        if expect_cleared_location
        else update_types.NO_CHANGE
    )


async def test_gripper_move_to_waste_chute_implementation(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    equipment: EquipmentHandler,
    labware_movement: LabwareMovementHandler,
    state_view: StateView,
) -> None:
    """It should drop the labware with a delay added."""
    from_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    new_location = AddressableAreaLocation(addressableAreaName="gripperWasteChute")
    labware_width = 50
    expected_slide_offset = Point(
        x=labware_width / 2 + GRIPPER_PADDLE_WIDTH / 2 + 8, y=0, z=0
    )
    from_loc_sequence: LabwareLocationSequence = [
        OnAddressableAreaLocationSequenceComponent(addressableAreaName="1")
    ]
    immediate_dest_loc_sequence: LabwareLocationSequence = [
        NotOnDeckLocationSequenceComponent(logicalLocationName=WASTE_CHUTE_LOCATION)
    ]
    eventual_dest_loc_sequence = immediate_dest_loc_sequence

    data = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=new_location,
        strategy=LabwareMovementStrategy.USING_GRIPPER,
        pickUpOffset=LabwareOffsetVector(x=1, y=2, z=3),
        dropOffset=None,
    )
    labware_def = LabwareDefinition2.model_construct(
        namespace="my-cool-namespace",
        dimensions=Dimensions(
            yDimension=labware_width, zDimension=labware_width, xDimension=labware_width
        ),
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.get_definition(labware_id="my-cool-labware-id")
    ).then_return(labware_def)
    decoy.when(
        state_view.geometry.get_location_sequence("my-cool-labware-id")
    ).then_return(from_loc_sequence)
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(new_location)
    ).then_return(immediate_dest_loc_sequence)
    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_return(
        LoadedLabware(
            id="my-cool-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=from_location,
            offsetId=None,
        )
    )
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            new_location, None, labware_def
        )
    ).then_return(new_location)
    decoy.when(
        equipment.find_applicable_labware_offset_id(
            labware_definition_uri="opentrons-test/load-name/1",
            labware_location=new_location,
        )
    ).then_return("wowzers-a-new-offset-id")

    decoy.when(
        state_view.geometry.ensure_valid_gripper_location(from_location)
    ).then_return(from_location)
    decoy.when(
        state_view.geometry.ensure_valid_gripper_location(new_location)
    ).then_return(new_location)
    decoy.when(labware_validation.validate_gripper_compatible(labware_def)).then_return(
        True
    )

    result = await subject.execute(data)
    decoy.verify(
        state_view.labware.raise_if_labware_has_non_lid_labware_on_top(
            "my-cool-labware-id"
        ),
        await labware_movement.move_labware_with_gripper(
            labware_id="my-cool-labware-id",
            current_location=from_location,
            new_location=new_location,
            user_pick_up_offset=Point(1, 2, 3),
            user_drop_offset=Point(),
            post_drop_slide_offset=expected_slide_offset,
        ),
    )
    assert result == SuccessData(
        public=MoveLabwareResult(
            offsetId="wowzers-a-new-offset-id",
            originLocationSequence=from_loc_sequence,
            immediateDestinationLocationSequence=immediate_dest_loc_sequence,
            eventualDestinationLocationSequence=eventual_dest_loc_sequence,
        ),
        state_update=update_types.StateUpdate(
            pipette_location=update_types.CLEAR,
            labware_location=update_types.LabwareLocationUpdate(
                labware_id="my-cool-labware-id",
                new_location=new_location,
                offset_id="wowzers-a-new-offset-id",
            ),
            addressable_area_used=update_types.AddressableAreaUsedUpdate(
                addressable_area_name=new_location.addressableAreaName
            ),
        ),
    )


async def test_move_labware_raises_for_labware_or_module_not_found(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """It should raise an error when specified labware/ module is not found."""
    move_non_existent_labware_params = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )
    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_raise(
        errors.LabwareNotLoadedError("Woops!")
    )
    with pytest.raises(errors.LabwareNotLoadedError):
        await subject.execute(move_non_existent_labware_params)

    move_labware_from_questionable_module_params = MoveLabwareParams(
        labwareId="real-labware-id",
        newLocation=ModuleLocation(moduleId="imaginary-module-id-1"),
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )
    decoy.when(state_view.labware.get(labware_id="real-labware-id")).then_return(
        LoadedLabware(
            id="real-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=ModuleLocation(moduleId="imaginary-module-id-3"),
            offsetId=None,
        )
    )
    lw_def = LabwareDefinition2.model_construct(
        namespace="opentrons-test",
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )

    decoy.when(
        state_view.labware.get_definition(labware_id="real-labware-id")
    ).then_return(lw_def)
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            ModuleLocation(moduleId="imaginary-module-id-1"), None, lw_def
        )
    ).then_return(ModuleLocation(moduleId="imaginary-module-id-2"))

    decoy.when(
        equipment.find_applicable_labware_offset_id(
            labware_definition_uri="opentrons-test/load-name/1",
            labware_location=ModuleLocation(moduleId="imaginary-module-id-2"),
        )
    ).then_raise(errors.ModuleNotLoadedError(module_id="woops-i-dont-exist"))

    with pytest.raises(errors.ModuleNotLoadedError):
        await subject.execute(move_labware_from_questionable_module_params)


async def test_move_labware_raises_if_movement_obstructed(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    equipment: EquipmentHandler,
    labware_movement: LabwareMovementHandler,
    state_view: StateView,
) -> None:
    """It should execute a pause and return the new offset."""
    data = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
        strategy=LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE,
    )
    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_return(
        LoadedLabware(
            id="my-cool-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            offsetId=None,
        )
    )

    lw_def = LabwareDefinition2.model_construct(
        namespace="opentrons-test",
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )

    decoy.when(
        state_view.labware.get_definition(labware_id="my-cool-labware-id")
    ).then_return(lw_def)
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_5), None, lw_def
        )
    ).then_return(DeckSlotLocation(slotName=DeckSlotName.SLOT_6))
    decoy.when(
        equipment.find_applicable_labware_offset_id(
            labware_definition_uri="opentrons-test/load-name/1",
            labware_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_6),
        )
    ).then_return("wowzers-a-new-offset-id")

    decoy.when(
        await labware_movement.ensure_movement_not_obstructed_by_module(  # type: ignore[func-returns-value]
            labware_id="my-cool-labware-id",
            new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_6),
        )
    ).then_raise(errors.LabwareMovementNotAllowedError("Oh boy"))

    with pytest.raises(errors.LabwareMovementNotAllowedError):
        await subject.execute(data)


async def test_move_labware_raises_when_location_occupied(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
) -> None:
    """It should raise an error when trying to move labware to non-empty location."""
    move_labware_params = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )
    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_return(
        LoadedLabware(
            id="my-cool-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
            offsetId=None,
        )
    )
    lw_def = LabwareDefinition2.model_construct(
        namespace="opentrons-test",
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )

    decoy.when(
        state_view.labware.get_definition(labware_id="my-cool-labware-id")
    ).then_return(lw_def)
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_5), None, lw_def
        )
    ).then_raise(errors.LocationIsOccupiedError("Woops!"))

    with pytest.raises(errors.LocationIsOccupiedError):
        await subject.execute(move_labware_params)


async def test_move_labware_raises_when_moving_adapter_with_gripper(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
) -> None:
    """It should raise an error when trying to move an adapter with a gripper."""
    data = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )

    definition = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
        parameters=Parameters2.model_construct(loadName="My cool adapter"),  # type: ignore[call-arg]
    )

    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_return(
        LoadedLabware(
            id="my-cool-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
            offsetId=None,
        )
    )
    decoy.when(
        state_view.labware.get_definition(labware_id="my-cool-labware-id")
    ).then_return(definition)
    decoy.when(labware_validation.validate_gripper_compatible(definition)).then_return(
        True
    )
    decoy.when(
        labware_validation.validate_definition_is_adapter(definition)
    ).then_return(True)

    with pytest.raises(
        errors.LabwareMovementNotAllowedError, match="move adapter 'My cool adapter'"
    ):
        await subject.execute(data)


async def test_move_labware_raises_when_moving_labware_with_gripper_incompatible_quirk(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
) -> None:
    """It should raise an error when trying to move an adapter with a gripper."""
    data = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )

    definition = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
        parameters=Parameters2.model_construct(loadName="My cool labware"),  # type: ignore[call-arg]
    )

    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_return(
        LoadedLabware(
            id="my-cool-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
            offsetId=None,
        )
    )
    decoy.when(
        state_view.labware.get_definition(labware_id="my-cool-labware-id")
    ).then_return(definition)
    decoy.when(labware_validation.validate_gripper_compatible(definition)).then_return(
        False
    )

    with pytest.raises(
        errors.LabwareMovementNotAllowedError,
        match="Cannot move labware 'My cool labware' with gripper",
    ):
        await subject.execute(data)


async def test_move_labware_with_gripper_raises_on_ot2(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
) -> None:
    """It should raise an error when using a gripper with robot type of OT2."""
    data = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )
    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_return(
        LoadedLabware(
            id="my-cool-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
            offsetId=None,
        )
    )

    decoy.when(
        state_view.labware.get_definition(labware_id="my-cool-labware-id")
    ).then_return(
        LabwareDefinition2.model_construct(
            namespace="spacename",
            parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
        )
    )

    decoy.when(state_view.config).then_return(
        Config(robot_type="OT-2 Standard", deck_type=DeckType.OT2_STANDARD)
    )
    with pytest.raises(errors.NotSupportedOnRobotType):
        await subject.execute(data)


async def test_move_labware_raises_when_moving_fixed_trash_labware(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
) -> None:
    """It should raise an error when trying to move a fixed trash."""
    data = MoveLabwareParams(
        labwareId="my-cool-labware-id",
        newLocation=DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH),
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )

    definition = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
        parameters=Parameters2.model_construct(  # type: ignore[call-arg]
            loadName="My cool labware", quirks=["fixedTrash"]
        ),
    )

    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_return(
        LoadedLabware(
            id="my-cool-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
            offsetId=None,
        )
    )
    decoy.when(
        state_view.labware.get_definition(labware_id="my-cool-labware-id")
    ).then_return(definition)

    decoy.when(state_view.labware.is_fixed_trash("my-cool-labware-id")).then_return(
        True
    )

    with pytest.raises(
        errors.LabwareMovementNotAllowedError,
        match="Cannot move fixed trash labware 'My cool labware'.",
    ):
        await subject.execute(data)


async def test_labware_raises_when_moved_onto_itself(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
) -> None:
    """It should raise when the OnLabwareLocation has the same labware ID as the labware being moved."""
    data = MoveLabwareParams(
        labwareId="the-same-labware-id",
        newLocation=OnLabwareLocation(labwareId="a-cool-labware-id"),
        strategy=LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE,
    )

    decoy.when(state_view.labware.get(labware_id="the-same-labware-id")).then_return(
        LoadedLabware(
            id="the-same-labware-id",
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
            offsetId=None,
        )
    )

    lw_def = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
        namespace="opentrons-test",
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.get_definition(labware_id="the-same-labware-id")
    ).then_return(lw_def)

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            OnLabwareLocation(labwareId="a-cool-labware-id"), None, lw_def
        )
    ).then_return(OnLabwareLocation(labwareId="the-same-labware-id"))

    with pytest.raises(
        errors.LabwareMovementNotAllowedError,
        match="Cannot move a labware onto itself.",
    ):
        await subject.execute(data)


async def test_move_labware_calls_raise_if_labware_is_contained(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
) -> None:
    """It should always call raise_if_labware_is_contained before moving."""
    data = MoveLabwareParams(
        labwareId="labware-id",
        newLocation=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )

    decoy.when(state_view.labware.get(labware_id="labware-id")).then_return(
        LoadedLabware(
            id="labware-id",
            loadName="load-name",
            definitionUri="test/load-name/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            offsetId=None,
        )
    )
    lw_def = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
        namespace="test",
        parameters=Parameters2.model_construct(isMovableAdapter=False),  # type: ignore[call-arg]
    )
    decoy.when(state_view.labware.get_definition("labware-id")).then_return(lw_def)
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(data.newLocation, None, lw_def)
    ).then_return(data.newLocation)
    decoy.when(labware_validation.validate_gripper_compatible(lw_def)).then_return(True)

    await subject.execute(data)

    decoy.verify(
        state_view.labware.raise_if_labware_is_contained("labware-id"),
    )


async def test_move_labware_raises_when_labware_is_contained(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
) -> None:
    """It should raise LabwareIsContainedError when trying to move contained labware."""
    data = MoveLabwareParams(
        labwareId="inner-labware-id",
        newLocation=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )

    decoy.when(state_view.labware.get(labware_id="inner-labware-id")).then_return(
        LoadedLabware(
            id="inner-labware-id",
            loadName="filter-plate",
            definitionUri="test/filter-plate/1",
            location=OnLabwareLocation(labwareId="collar-id"),
            offsetId=None,
        )
    )
    lw_def = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
        namespace="test",
        parameters=Parameters2.model_construct(isMovableAdapter=False),  # type: ignore[call-arg]
    )
    decoy.when(state_view.labware.get_definition("inner-labware-id")).then_return(
        lw_def
    )
    decoy.when(labware_validation.validate_gripper_compatible(lw_def)).then_return(True)

    decoy.when(
        state_view.labware.raise_if_labware_is_contained("inner-labware-id")
    ).then_raise(errors.LabwareIsContainedError("Cannot move contained labware"))

    with pytest.raises(errors.LabwareIsContainedError):
        await subject.execute(data)


async def test_movable_adapter_can_move_with_labware_on_top(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
) -> None:
    """Movable adapters (like the vacuum collar) are allowed to move with gripper even with labware on top."""
    new_location = AddressableAreaLocation(addressableAreaName="vacuumModuleV1DockA4")
    data = MoveLabwareParams(
        labwareId="movable-adapter-id",
        newLocation=new_location,
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )

    decoy.when(state_view.labware.get("movable-adapter-id")).then_return(
        LoadedLabware(
            id="movable-adapter-id",
            loadName="collar",
            definitionUri="test/collar/1",
            location=ModuleLocation(moduleId="vacuum-module-id"),
            offsetId=None,
        )
    )
    movable_def = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
        namespace="test",
        parameters=Parameters2.model_construct(isMovableAdapter=True),  # type: ignore[call-arg]
    )
    decoy.when(state_view.labware.get_definition("movable-adapter-id")).then_return(
        movable_def
    )
    decoy.when(labware_validation.validate_gripper_compatible(movable_def)).then_return(
        True
    )

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            data.newLocation, None, movable_def
        )
    ).then_return(data.newLocation)

    await subject.execute(data)

    # Should skip the "has non-lid labware on top" check for movable adapters
    decoy.verify(
        state_view.labware.raise_if_labware_has_non_lid_labware_on_top(
            "movable-adapter-id"
        ),
        times=0,
    )
    # Containment check still runs
    decoy.verify(state_view.labware.raise_if_labware_is_contained("movable-adapter-id"))


async def test_vacuum_module_dock_incompatibility_raises(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
) -> None:
    """It should raise when moving incompatible labware onto the vacuum module dock using gripper."""
    area_name = "vacuumModuleV1DockA4"
    data = MoveLabwareParams(
        labwareId="incompatible-labware-id",
        newLocation=AddressableAreaLocation(addressableAreaName=area_name),
        strategy=LabwareMovementStrategy.USING_GRIPPER,
    )

    decoy.when(state_view.labware.get("incompatible-labware-id")).then_return(
        LoadedLabware(
            id="incompatible-labware-id",
            loadName="bad-plate",
            definitionUri="test/bad-plate/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            offsetId=None,
        )
    )

    expected_module = LoadedModule.model_construct(
        id=matchers.IsA(str),
        model=ModuleModel.VACUUM_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName("A3")),
        serialNumber=matchers.IsA(str),
    )
    decoy.when(
        state_view.modules.get_by_addressable_area(
            area_name, state_view.addressable_areas.deck_definition
        )
    ).then_return(expected_module)

    lw_def = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
        namespace="test",
        parameters=Parameters2.model_construct(isMovableAdapter=False),  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.get_definition("incompatible-labware-id")
    ).then_return(lw_def)
    decoy.when(labware_validation.validate_gripper_compatible(lw_def)).then_return(True)

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(data.newLocation, None, lw_def)
    ).then_return(data.newLocation)

    decoy.when(
        state_view.labware.raise_if_labware_incompatible_with_vacuum_module_dock(
            data.newLocation, lw_def
        )
    ).then_raise(
        errors.LabwareIsNotAllowedInLocationError("Labware not compatible with dock")
    )

    with pytest.raises(errors.LabwareIsNotAllowedInLocationError):
        await subject.execute(data)


async def test_move_filter_plate_directly_on_vacuum_module_raises(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    state_view: StateView,
) -> None:
    """It should reject moving a filter plate directly onto the vacuum module."""
    new_location = ModuleLocation(moduleId="vacuum-module-id")
    data = MoveLabwareParams(
        labwareId="filter-plate-id",
        newLocation=new_location,
        strategy=LabwareMovementStrategy.MANUAL_MOVE_WITHOUT_PAUSE,
    )

    decoy.when(state_view.labware.get("filter-plate-id")).then_return(
        LoadedLabware(
            id="filter-plate-id",
            loadName="empore_96_wellplate_1200ul_c18_filter",
            definitionUri="opentrons/empore_96_wellplate_1200ul_c18_filter/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_C1),
            offsetId=None,
        )
    )
    lw_def = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
        namespace="opentrons",
        parameters=Parameters2.model_construct(  # type: ignore[call-arg]
            isMovableAdapter=False,
            loadName="empore_96_wellplate_1200ul_c18_filter",
            quirks=["filterPlate"],
        ),
    )
    decoy.when(state_view.labware.get_definition("filter-plate-id")).then_return(lw_def)
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(new_location, None, lw_def)
    ).then_return(new_location)
    decoy.when(state_view.modules.get("vacuum-module-id")).then_return(
        LoadedModule.model_construct(
            id="vacuum-module-id",
            model=ModuleModel.VACUUM_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName("A3")),
            serialNumber="serial",
        )
    )
    decoy.when(
        state_view.labware.raise_if_labware_incompatible_with_vacuum_module(lw_def)
    ).then_raise(
        errors.LabwareIsNotAllowedInLocationError(
            "Cannot place 'empore_96_wellplate_1200ul_c18_filter' directly"
            " onto the vacuum module."
        )
    )

    with pytest.raises(
        errors.LabwareIsNotAllowedInLocationError, match="directly onto"
    ):
        await subject.execute(data)


@pytest.mark.parametrize(
    "strategy",
    [
        LabwareMovementStrategy.MANUAL_MOVE_WITHOUT_PAUSE,
        LabwareMovementStrategy.USING_GRIPPER,
    ],
)
async def test_move_labware_raises_when_vacuum_module_still_under_vacuum(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    equipment: EquipmentHandler,
    labware_movement: LabwareMovementHandler,
    state_view: StateView,
    model_utils: ModelUtils,
    strategy: LabwareMovementStrategy,
) -> None:
    """It should raise a defined error when the vacuum chamber is still evacuated."""
    labware_id = "manifold-collar-id"
    module_id = "vacuum-module-id"
    current_gauge_pressure_mbar = -275.0
    error_id = "vacuum-error-id"
    error_created_at = datetime.now()
    origin_location = ModuleLocation(moduleId=module_id)
    new_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_4)
    available_new_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_5)

    data = MoveLabwareParams(
        labwareId=labware_id,
        newLocation=new_location,
        strategy=strategy,
    )
    lw_def = LabwareDefinition2.model_construct(
        namespace="opentrons-test",
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )

    decoy.when(state_view.labware.get(labware_id=labware_id)).then_return(
        LoadedLabware(
            id=labware_id,
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=origin_location,
            offsetId=None,
        )
    )
    decoy.when(state_view.labware.get_definition(labware_id=labware_id)).then_return(
        lw_def
    )
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(new_location, None, lw_def)
    ).then_return(available_new_location)
    decoy.when(
        equipment.find_applicable_labware_offset_id(
            labware_definition_uri="opentrons-test/load-name/1",
            labware_location=available_new_location,
        )
    ).then_return("wowzers-a-new-offset-id")
    decoy.when(
        await labware_movement.ensure_movement_not_obstructed_by_module(  # type: ignore[func-returns-value]
            labware_id=labware_id,
            new_location=available_new_location,
        )
    ).then_raise(
        errors.VacuumModuleStillUnderVacuumError(
            module_id=module_id,
            current_gauge_pressure_mbar=current_gauge_pressure_mbar,
        )
    )
    decoy.when(model_utils.get_timestamp()).then_return(error_created_at)
    decoy.when(model_utils.generate_id()).then_return(error_id)

    result = await subject.execute(data)

    assert result == DefinedErrorData(
        public=VacuumModuleUnderVacuumMovementError.model_construct(
            id=error_id,
            createdAt=error_created_at,
            detail=(
                f"Vacuum Module {module_id} is still under vacuum at "
                f"{current_gauge_pressure_mbar} mbar. Wait for pressure to equalize "
                "before moving labware to or from it."
            ),
            errorInfo={
                "moduleId": module_id,
                "currentGaugePressureMbar": current_gauge_pressure_mbar,
            },
        ),
        state_update=update_types.StateUpdate(
            addressable_area_used=update_types.AddressableAreaUsedUpdate(
                addressable_area_name=new_location.slotName.id
            ),
        ),
    )


async def test_move_labware_raises_when_vacuum_module_pump_engaged(
    decoy: Decoy,
    subject: MoveLabwareImplementation,
    equipment: EquipmentHandler,
    labware_movement: LabwareMovementHandler,
    state_view: StateView,
) -> None:
    """It should raise when the vacuum module pump is still engaged."""
    labware_id = "manifold-collar-id"
    module_id = "vacuum-module-id"
    origin_location = ModuleLocation(moduleId=module_id)
    new_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_4)
    available_new_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_5)

    data = MoveLabwareParams(
        labwareId=labware_id,
        newLocation=new_location,
        strategy=LabwareMovementStrategy.MANUAL_MOVE_WITHOUT_PAUSE,
    )
    lw_def = LabwareDefinition2.model_construct(
        namespace="opentrons-test",
        parameters=Parameters2.model_construct(),  # type: ignore[call-arg]
    )

    decoy.when(state_view.labware.get(labware_id=labware_id)).then_return(
        LoadedLabware(
            id=labware_id,
            loadName="load-name",
            definitionUri="opentrons-test/load-name/1",
            location=origin_location,
            offsetId=None,
        )
    )
    decoy.when(state_view.labware.get_definition(labware_id=labware_id)).then_return(
        lw_def
    )
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(new_location, None, lw_def)
    ).then_return(available_new_location)
    decoy.when(
        equipment.find_applicable_labware_offset_id(
            labware_definition_uri="opentrons-test/load-name/1",
            labware_location=available_new_location,
        )
    ).then_return("wowzers-a-new-offset-id")
    decoy.when(
        await labware_movement.ensure_movement_not_obstructed_by_module(  # type: ignore[func-returns-value]
            labware_id=labware_id,
            new_location=available_new_location,
        )
    ).then_raise(
        errors.LabwareMovementNotAllowedError(
            "Cannot move labware to or from a Vacuum Module when the pump is running."
        )
    )

    with pytest.raises(
        errors.LabwareMovementNotAllowedError,
        match="when the pump is running",
    ):
        await subject.execute(data)
