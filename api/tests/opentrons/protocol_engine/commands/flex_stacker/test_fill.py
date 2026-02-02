"""Test Flex Stacker fill command implementation."""

from typing import cast

import pytest
from decoy import Decoy

from opentrons_shared_data.errors.exceptions import CommandPreconditionViolated
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.protocol_engine.commands.flex_stacker.fill import (
    FillImpl,
    FillParams,
    FillResult,
)
from opentrons.protocol_engine.errors import (
    FlexStackerLabwarePoolNotYetDefinedError,
    ModuleNotLoadedError,
)
from opentrons.protocol_engine.execution import EquipmentHandler, RunControlHandler
from opentrons.protocol_engine.execution.equipment import LoadedLabwarePoolData
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates import (
    FlexStackerId,
    FlexStackerSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.update_types import (
    BatchLabwareLocationUpdate,
    BatchLoadedLabwareUpdate,
    FlexStackerStateUpdate,
    LabwareLidUpdate,
    StateUpdate,
)
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    SYSTEM_LOCATION,
    DeckSlotLocation,
    InStackerHopperLocation,
    LoadedLabware,
    NotOnDeckLocationSequenceComponent,
    StackerFillEmptyStrategy,
    StackerStoredLabwareGroup,
)
from opentrons.types import DeckSlotName


@pytest.fixture
def subject(
    state_view: StateView,
    run_control: RunControlHandler,
    model_utils: ModelUtils,
    equipment: EquipmentHandler,
) -> FillImpl:
    """A FillImpl for testing."""
    return FillImpl(
        state_view=state_view,
        run_control=run_control,
        equipment=equipment,
        model_utils=model_utils,
    )


def _contained_labware(count: int) -> list[StackerStoredLabwareGroup]:
    return [
        StackerStoredLabwareGroup(
            primaryLabwareId=f"primary-id-{i + 1}",
            adapterLabwareId=None,
            lidLabwareId=None,
        )
        for i in range(count)
    ]


@pytest.mark.parametrize(
    "current_stored,count_param,max_pool_count",
    [
        pytest.param(_contained_labware(3), 3, 3, id="already-full"),
        pytest.param(_contained_labware(0), 4, 3, id="empty-fill-more-than-max"),
        pytest.param(_contained_labware(1), 3, 3, id="nonempty-fill-more-than-max"),
    ],
)
async def test_fill_by_count_exceeding_max(
    decoy: Decoy,
    state_view: StateView,
    model_utils: ModelUtils,
    equipment: EquipmentHandler,
    subject: FillImpl,
    current_stored: list[StackerStoredLabwareGroup],
    count_param: int,
    max_pool_count: int,
    flex_50uL_tiprack: LabwareDefinition,
) -> None:
    """It should fill a valid stacker's labware pool."""
    module_id = "some-module-id"
    stacker_state = FlexStackerSubState(
        module_id=cast(FlexStackerId, module_id),
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=current_stored,
        max_pool_count=max_pool_count,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(state_view.modules.get_flex_stacker_substate(module_id)).then_return(
        stacker_state
    )
    params = FillParams(
        moduleId=module_id,
        count=count_param,
        message="some-message",
        strategy=StackerFillEmptyStrategy.LOGICAL,
    )
    with pytest.raises(CommandPreconditionViolated):
        await subject.execute(params)


@pytest.mark.parametrize(
    "current_stored,count_param,max_pool_count,expected_new_labware",
    [
        pytest.param([], 3, 3, 3, id="empty-to-full"),
        pytest.param(
            _contained_labware(1),
            None,
            3,
            2,
            id="default-count",
        ),
    ],
)
async def test_fill_by_count_happypath(
    decoy: Decoy,
    state_view: StateView,
    model_utils: ModelUtils,
    equipment: EquipmentHandler,
    subject: FillImpl,
    current_stored: list[StackerStoredLabwareGroup],
    count_param: int | None,
    max_pool_count: int,
    expected_new_labware: int,
    flex_50uL_tiprack: LabwareDefinition,
) -> None:
    """It should fill a valid stacker's labware pool."""
    module_id = "some-module-id"
    stacker_state = FlexStackerSubState(
        module_id=cast(FlexStackerId, module_id),
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=current_stored,
        max_pool_count=max_pool_count,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(state_view.modules.get_flex_stacker_substate(module_id)).then_return(
        stacker_state
    )
    params = FillParams(
        moduleId=module_id,
        count=count_param,
        message="some-message",
        strategy=StackerFillEmptyStrategy.LOGICAL,
    )
    primary_ids = iter([f"new-primary-{i + 1}" for i in range(expected_new_labware)])
    decoy.when(model_utils.generate_id()).then_do(lambda: next(primary_ids))
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(flex_50uL_tiprack)
    ).then_return("opentrons/opentrons_flex_96_filtertiprack_50ul/1")
    for i in range(expected_new_labware):
        decoy.when(state_view.labware.known(f"new-primary-{i + 1}")).then_return(False)
        decoy.when(
            await equipment.load_labware_pool_from_definitions(
                pool_primary_definition=flex_50uL_tiprack,
                pool_adapter_definition=None,
                pool_lid_definition=None,
                location=InStackerHopperLocation(moduleId="some-module-id"),
                primary_id=f"new-primary-{i + 1}",
                adapter_id=None,
                lid_id=None,
            )
        ).then_return(
            LoadedLabwarePoolData(
                primary_labware=LoadedLabware(
                    id=f"new-primary-{i + 1}",
                    loadName="loadname",
                    definitionUri="opentrons/opentrons_flex_96_filtertiprack_50ul/1",
                    location=InStackerHopperLocation(moduleId="some-module-id"),
                    lid_id=None,
                    offsetId=None,
                    displayName=None,
                ),
                adapter_labware=None,
                lid_labware=None,
            )
        )
    result = await subject.execute(params)
    added_labware = [
        StackerStoredLabwareGroup(
            primaryLabwareId=f"new-primary-{i + 1}",
            adapterLabwareId=None,
            lidLabwareId=None,
        )
        for i in range(expected_new_labware)
    ]
    new_stored_labware = current_stored + added_labware
    assert result.state_update == StateUpdate(
        flex_stacker_state_update=FlexStackerStateUpdate(
            module_id=module_id, contained_labware_bottom_first=new_stored_labware
        ),
        batch_loaded_labware=BatchLoadedLabwareUpdate(
            new_locations_by_id={
                f"new-primary-{i + 1}": InStackerHopperLocation(
                    moduleId="some-module-id"
                )
                for i in range(expected_new_labware)
            },
            offset_ids_by_id={
                f"new-primary-{i + 1}": None for i in range(expected_new_labware)
            },
            display_names_by_id={
                f"new-primary-{i + 1}": None for i in range(expected_new_labware)
            },
            definitions_by_id={
                f"new-primary-{i + 1}": flex_50uL_tiprack
                for i in range(expected_new_labware)
            },
        ),
        labware_lid=LabwareLidUpdate(parent_labware_ids=[], lid_ids=[]),
    )
    assert result.public.storedLabware == new_stored_labware
    assert result.public.addedLabware == added_labware
    assert result.public == FillResult(
        count=(len(current_stored) + expected_new_labware),
        storedLabware=new_stored_labware,
        addedLabware=added_labware,
        primaryLabwareURI="opentrons/opentrons_flex_96_filtertiprack_50ul/1",
        adapterLabwareURI=None,
        lidLabwareURI=None,
        originalPrimaryLabwareLocationSequences=[
            [NotOnDeckLocationSequenceComponent(logicalLocationName=SYSTEM_LOCATION)]
            for _ in added_labware
        ],
        originalAdapterLabwareLocationSequences=None,
        originalLidLabwareLocationSequences=None,
        newPrimaryLabwareLocationSequences=[
            [InStackerHopperLocation(moduleId="some-module-id")] for _ in added_labware
        ],
        newAdapterLabwareLocationSequences=None,
        newLidLabwareLocationSequences=None,
    )


async def test_fill_requires_stacker(
    decoy: Decoy, state_view: StateView, subject: FillImpl
) -> None:
    """It should require a stacker."""
    decoy.when(state_view.modules.get_flex_stacker_substate("asda")).then_raise(
        ModuleNotLoadedError(module_id="asda")
    )
    with pytest.raises(ModuleNotLoadedError):
        await subject.execute(
            FillParams(
                moduleId="asda",
                strategy=StackerFillEmptyStrategy.LOGICAL,
                message="blah",
                count=3,
            )
        )


async def test_fill_requires_constrained_pool(
    decoy: Decoy, state_view: StateView, subject: FillImpl
) -> None:
    """It should require a constrained labware pool."""
    module_id = "module-id"
    stacker_state = FlexStackerSubState(
        module_id=cast(FlexStackerId, module_id),
        pool_primary_definition=None,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=_contained_labware(3),
        max_pool_count=0,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(state_view.modules.get_flex_stacker_substate(module_id)).then_return(
        stacker_state
    )
    decoy.when(state_view.modules.get_location(module_id)).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_A3)
    )
    with pytest.raises(
        FlexStackerLabwarePoolNotYetDefinedError,
        match=".*The Flex Stacker in.*A3.*has not been configured yet and cannot be filled.",
    ):
        await subject.execute(
            FillParams(
                moduleId=module_id,
                count=2,
                message="hello",
                strategy=StackerFillEmptyStrategy.LOGICAL,
            )
        )


async def test_pause_strategy_pauses(
    decoy: Decoy,
    state_view: StateView,
    run_control: RunControlHandler,
    model_utils: ModelUtils,
    subject: FillImpl,
    flex_50uL_tiprack: LabwareDefinition,
) -> None:
    """It should pause the system when the pause strategy is used."""
    current_count = 1
    max_pool_count = 6
    module_id = "some-module-id"
    beginning_contained_labware = _contained_labware(current_count)
    stacker_state = FlexStackerSubState(
        module_id=cast(FlexStackerId, module_id),
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=beginning_contained_labware,
        max_pool_count=max_pool_count,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(state_view.modules.get_flex_stacker_substate(module_id)).then_return(
        stacker_state
    )
    new_labware = [
        StackerStoredLabwareGroup(
            primaryLabwareId="new-primary", adapterLabwareId=None, lidLabwareId=None
        )
    ]
    params = FillParams(
        moduleId=module_id,
        labwareToStore=new_labware,
        message="some-message",
        strategy=StackerFillEmptyStrategy.MANUAL_WITH_PAUSE,
    )
    decoy.when(state_view.labware.known("new-primary")).then_return(True)
    decoy.when(state_view.geometry.get_location_sequence("new-primary")).then_return(
        [NotOnDeckLocationSequenceComponent(logicalLocationName=OFF_DECK_LOCATION)]
    )
    decoy.when(state_view.labware.get_location("new-primary")).then_return(
        OFF_DECK_LOCATION
    )
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(flex_50uL_tiprack)
    ).then_return("opentrons/opentrons_flex_96_filtertiprack_50ul/1")
    new_contained_labware = beginning_contained_labware + new_labware
    result = await subject.execute(params)
    assert result.state_update == StateUpdate(
        flex_stacker_state_update=FlexStackerStateUpdate(
            module_id=module_id, contained_labware_bottom_first=new_contained_labware
        ),
        batch_labware_location=BatchLabwareLocationUpdate(
            new_locations_by_id={
                "new-primary": InStackerHopperLocation(moduleId="some-module-id")
            },
            new_offset_ids_by_id={"new-primary": None},
        ),
    )
    assert result.public == FillResult(
        count=2,
        primaryLabwareURI="opentrons/opentrons_flex_96_filtertiprack_50ul/1",
        storedLabware=new_contained_labware,
        addedLabware=new_labware,
        originalPrimaryLabwareLocationSequences=[
            [NotOnDeckLocationSequenceComponent(logicalLocationName=OFF_DECK_LOCATION)]
        ],
        newPrimaryLabwareLocationSequences=[
            [InStackerHopperLocation(moduleId="some-module-id")]
        ],
    )
    decoy.verify(await run_control.wait_for_resume())
