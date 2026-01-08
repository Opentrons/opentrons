"""Test Flex Stacker empty command implementation."""

from typing import cast

import pytest
from decoy import Decoy

from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.protocol_engine.commands.flex_stacker.empty import (
    EmptyImpl,
    EmptyParams,
    EmptyResult,
)
from opentrons.protocol_engine.errors import (
    FlexStackerLabwarePoolNotYetDefinedError,
    ModuleNotLoadedError,
)
from opentrons.protocol_engine.execution import EquipmentHandler, RunControlHandler
from opentrons.protocol_engine.state.module_substates import (
    FlexStackerId,
    FlexStackerSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.update_types import (
    BatchLabwareLocationUpdate,
    FlexStackerStateUpdate,
    StateUpdate,
)
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    DeckSlotLocation,
    InStackerHopperLocation,
    LabwareUri,
    NotOnDeckLocationSequenceComponent,
    StackerFillEmptyStrategy,
    StackerStoredLabwareGroup,
)
from opentrons.types import DeckSlotName


def _contained_labware(count: int) -> list[StackerStoredLabwareGroup]:
    return [
        StackerStoredLabwareGroup(
            primaryLabwareId=f"primary-id-{i + 1}",
            adapterLabwareId=None,
            lidLabwareId=None,
        )
        for i in range(count)
    ]


@pytest.fixture
def subject(
    state_view: StateView, run_control: RunControlHandler, equipment: EquipmentHandler
) -> EmptyImpl:
    """An EmptyImpl for testing."""
    return EmptyImpl(
        state_view=state_view, run_control=run_control, equipment=equipment
    )


@pytest.mark.parametrize(
    "current_stored,count_param,target_stored,removed",
    [
        pytest.param([], 0, [], [], id="empty-to-empty"),
        pytest.param(
            _contained_labware(3), 0, [], _contained_labware(3), id="full-to-empty"
        ),
        pytest.param(
            _contained_labware(3), 3, _contained_labware(3), [], id="full-noop"
        ),
        pytest.param(
            _contained_labware(2),
            3,
            _contained_labware(2),
            [],
            id="cant-increase",
        ),
        pytest.param(
            _contained_labware(3),
            2,
            _contained_labware(2),
            [_contained_labware(3)[-1]],
            id="not-full-empty",
        ),
        pytest.param(
            _contained_labware(3), 4, _contained_labware(3), [], id="overfull"
        ),
        pytest.param(
            _contained_labware(3), None, [], _contained_labware(3), id="default-count"
        ),
    ],
)
async def test_empty_happypath(
    decoy: Decoy,
    state_view: StateView,
    subject: EmptyImpl,
    current_stored: list[StackerStoredLabwareGroup],
    count_param: int | None,
    target_stored: list[StackerStoredLabwareGroup],
    removed: list[StackerStoredLabwareGroup],
    flex_50uL_tiprack: LabwareDefinition,
) -> None:
    """It should empty a valid stacker's labware pool."""
    module_id = "some-module-id"
    stacker_state = FlexStackerSubState(
        module_id=cast(FlexStackerId, module_id),
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=current_stored,
        max_pool_count=3,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(state_view.modules.get_flex_stacker_substate(module_id)).then_return(
        stacker_state
    )
    decoy.when(
        state_view.labware.get_uri_from_definition(flex_50uL_tiprack)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_filtertiprack_50ul/1"))
    params = EmptyParams(
        moduleId=module_id,
        count=count_param,
        message="some-message",
        strategy=StackerFillEmptyStrategy.LOGICAL,
    )
    result = await subject.execute(params)
    assert result.state_update == StateUpdate(
        flex_stacker_state_update=FlexStackerStateUpdate(
            module_id=module_id, contained_labware_bottom_first=target_stored
        ),
        batch_labware_location=BatchLabwareLocationUpdate(
            new_locations_by_id={
                g.primaryLabwareId: OFF_DECK_LOCATION for g in removed
            },
            new_offset_ids_by_id={g.primaryLabwareId: None for g in removed},
        ),
    )
    assert result.public == EmptyResult(
        count=len(target_stored),
        primaryLabwareURI="opentrons/opentrons_flex_96_filtertiprack_50ul/1",
        adapterLabwareURI=None,
        lidLabwareURI=None,
        storedLabware=target_stored,
        removedLabware=removed,
        originalPrimaryLabwareLocationSequences=[
            [InStackerHopperLocation(moduleId="some-module-id")] for _ in removed
        ],
        originalAdapterLabwareLocationSequences=None,
        originalLidLabwareLocationSequences=None,
        newPrimaryLabwareLocationSequences=[
            [NotOnDeckLocationSequenceComponent(logicalLocationName=OFF_DECK_LOCATION)]
            for _ in removed
        ],
        newAdapterLabwareLocationSequences=None,
        newLidLabwareLocationSequences=None,
    )


async def test_empty_requires_stacker(
    decoy: Decoy, state_view: StateView, subject: EmptyImpl
) -> None:
    """It should require a stacker."""
    decoy.when(state_view.modules.get_flex_stacker_substate("asda")).then_raise(
        ModuleNotLoadedError(module_id="asda")
    )
    with pytest.raises(ModuleNotLoadedError):
        await subject.execute(
            EmptyParams(
                moduleId="asda",
                strategy=StackerFillEmptyStrategy.LOGICAL,
                message="blah",
                count=3,
            )
        )


async def test_empty_requires_constrained_pool(
    decoy: Decoy, state_view: StateView, subject: EmptyImpl
) -> None:
    """It should require a constrained labware pool."""
    module_id = "module-id"
    stacker_state = FlexStackerSubState(
        module_id=cast(FlexStackerId, module_id),
        pool_primary_definition=None,
        pool_lid_definition=None,
        pool_adapter_definition=None,
        contained_labware_bottom_first=_contained_labware(3),
        max_pool_count=5,
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
        match=".*The Flex Stacker in.*A3.*has not been configured yet and cannot be emptied.",
    ):
        await subject.execute(
            EmptyParams(
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
    subject: EmptyImpl,
    flex_50uL_tiprack: LabwareDefinition,
) -> None:
    """It should pause the system when the pause strategy is used."""
    module_id = "some-module-id"
    current_count = 2
    count_param = 1
    target_count = 1
    stacker_state = FlexStackerSubState(
        module_id=cast(FlexStackerId, module_id),
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=_contained_labware(current_count),
        max_pool_count=5,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(state_view.modules.get_flex_stacker_substate(module_id)).then_return(
        stacker_state
    )
    decoy.when(
        state_view.labware.get_uri_from_definition(flex_50uL_tiprack)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_filtertiprack_50ul/1"))
    params = EmptyParams(
        moduleId=module_id,
        count=count_param,
        message="some-message",
        strategy=StackerFillEmptyStrategy.MANUAL_WITH_PAUSE,
    )
    primary_id = _contained_labware(2)[1].primaryLabwareId
    result = await subject.execute(params)
    assert result.state_update == StateUpdate(
        flex_stacker_state_update=FlexStackerStateUpdate(
            module_id=module_id,
            contained_labware_bottom_first=_contained_labware(count_param),
        ),
        batch_labware_location=BatchLabwareLocationUpdate(
            new_locations_by_id={primary_id: OFF_DECK_LOCATION},
            new_offset_ids_by_id={primary_id: None},
        ),
    )
    assert result.public == EmptyResult(
        count=target_count,
        primaryLabwareURI="opentrons/opentrons_flex_96_filtertiprack_50ul/1",
        adapterLabwareURI=None,
        lidLabwareURI=None,
        storedLabware=_contained_labware(1),
        removedLabware=_contained_labware(2)[1:],
        originalPrimaryLabwareLocationSequences=[
            [InStackerHopperLocation(moduleId="some-module-id")]
        ],
        originalAdapterLabwareLocationSequences=None,
        originalLidLabwareLocationSequences=None,
        newPrimaryLabwareLocationSequences=[
            [NotOnDeckLocationSequenceComponent(logicalLocationName=OFF_DECK_LOCATION)]
        ],
        newAdapterLabwareLocationSequences=None,
        newLidLabwareLocationSequences=None,
    )
    decoy.verify(await run_control.wait_for_resume())
