"""Test Flex Stacker set stored labware command implementation."""

from contextlib import nullcontext as does_not_raise
from typing import Any, ContextManager, cast
from unittest.mock import sentinel

import pytest
from decoy import Decoy

from opentrons_shared_data.errors.exceptions import CommandPreconditionViolated
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.flex_stacker.set_stored_labware import (
    SetStoredLabwareImpl,
    SetStoredLabwareParams,
    SetStoredLabwareResult,
    StackerStoredLabwareDetails,
)
from opentrons.protocol_engine.errors import (
    FlexStackerNotLogicallyEmptyError,
)
from opentrons.protocol_engine.execution.equipment import (
    EquipmentHandler,
    LoadedLabwarePoolData,
)
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates import (
    FlexStackerId,
    FlexStackerSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.update_types import (
    BatchLabwareLocationUpdate,
    BatchLoadedLabwareUpdate,
    FlexStackerPoolConstraint,
    FlexStackerStateUpdate,
    LabwareLidUpdate,
    StateUpdate,
)
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    SYSTEM_LOCATION,
    InStackerHopperLocation,
    LabwareLocation,
    LabwareLocationSequence,
    LoadedLabware,
    NotOnDeckLocationSequenceComponent,
    OnLabwareLocation,
    OnLabwareLocationSequenceComponent,
    OverlapOffset,
    StackerStoredLabwareGroup,
)


@pytest.fixture
def subject(
    state_view: StateView, equipment: EquipmentHandler, model_utils: ModelUtils
) -> SetStoredLabwareImpl:
    """A FillImpl for testing."""
    return SetStoredLabwareImpl(
        state_view=state_view, equipment=equipment, model_utils=model_utils
    )


@pytest.mark.parametrize(
    "adapter_labware,lid_labware,pool_definition,initial_stored_labware,primary_loc_seq_prefixes,lid_loc_seq_prefixes,locations",
    [
        pytest.param(
            StackerStoredLabwareDetails(
                loadName="adapter-name", namespace="adapter-namespace", version=2
            ),
            StackerStoredLabwareDetails(
                loadName="lid-name", namespace="lid-namespace", version=3
            ),
            FlexStackerPoolConstraint(
                max_pool_count=10,
                pool_overlap=5.0,
                pool_height=sentinel.pool_height,
                primary_definition=sentinel.primary_definition,
                lid_definition=sentinel.lid_definition,
                adapter_definition=sentinel.adapter_definition,
            ),
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-1",
                    adapterLabwareId="adapter-id-1",
                    lidLabwareId="lid-id-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-2",
                    adapterLabwareId="adapter-id-2",
                    lidLabwareId="lid-id-2",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-3",
                    adapterLabwareId="adapter-id-3",
                    lidLabwareId="lid-id-3",
                ),
            ],
            [
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-1", lidId=None
                    )
                ],
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-2", lidId=None
                    )
                ],
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-3", lidId=None
                    )
                ],
            ],
            [
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="labware-id-1", lidId="lid-id-1"
                    ),
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-1", lidId=None
                    ),
                ],
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="labware-id-2", lidId="lid-id-2"
                    ),
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-2", lidId=None
                    ),
                ],
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="labware-id-3", lidId="lid-id-3"
                    ),
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-3", lidId=None
                    ),
                ],
            ],
            {
                "adapter-id-1": InStackerHopperLocation(moduleId="module-id"),
                "adapter-id-2": InStackerHopperLocation(moduleId="module-id"),
                "adapter-id-3": InStackerHopperLocation(moduleId="module-id"),
            },
            id="all-specified",
        ),
        pytest.param(
            None,
            None,
            FlexStackerPoolConstraint(
                max_pool_count=10,
                pool_overlap=5.0,
                pool_height=sentinel.pool_height,
                primary_definition=sentinel.primary_definition,
                lid_definition=None,
                adapter_definition=None,
            ),
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-3",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            [[], [], []],
            [[], [], []],
            {
                "labware-id-1": InStackerHopperLocation(moduleId="module-id"),
                "labware-id-2": InStackerHopperLocation(moduleId="module-id"),
                "labware-id-3": InStackerHopperLocation(moduleId="module-id"),
            },
            id="none-specified",
        ),
        pytest.param(
            None,
            StackerStoredLabwareDetails(
                loadName="lid-name", namespace="lid-namespace", version=3
            ),
            FlexStackerPoolConstraint(
                max_pool_count=10,
                pool_overlap=5.0,
                primary_definition=sentinel.primary_definition,
                lid_definition=sentinel.lid_definition,
                adapter_definition=None,
                pool_height=sentinel.pool_height,
            ),
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-1",
                    adapterLabwareId=None,
                    lidLabwareId="lid-id-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-2",
                    adapterLabwareId=None,
                    lidLabwareId="lid-id-2",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-3",
                    adapterLabwareId=None,
                    lidLabwareId="lid-id-3",
                ),
            ],
            [[], [], []],
            [
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="labware-id-1", lidId="lid-id-1"
                    )
                ],
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="labware-id-2", lidId="lid-id-2"
                    )
                ],
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="labware-id-3", lidId="lid-id-3"
                    )
                ],
            ],
            {
                "labware-id-1": InStackerHopperLocation(moduleId="module-id"),
                "labware-id-2": InStackerHopperLocation(moduleId="module-id"),
                "labware-id-3": InStackerHopperLocation(moduleId="module-id"),
            },
            id="lid-only",
        ),
        pytest.param(
            StackerStoredLabwareDetails(
                loadName="adapter-name", namespace="adapter-namespace", version=2
            ),
            None,
            FlexStackerPoolConstraint(
                max_pool_count=10,
                pool_overlap=5.0,
                pool_height=sentinel.pool_height,
                primary_definition=sentinel.primary_definition,
                lid_definition=None,
                adapter_definition=sentinel.adapter_definition,
            ),
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-1",
                    adapterLabwareId="adapter-id-1",
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-2",
                    adapterLabwareId="adapter-id-2",
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-id-3",
                    adapterLabwareId="adapter-id-3",
                    lidLabwareId=None,
                ),
            ],
            [
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-1", lidId=None
                    )
                ],
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-2", lidId=None
                    )
                ],
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-3", lidId=None
                    )
                ],
            ],
            [[], [], []],
            {
                "adapter-id-1": InStackerHopperLocation(moduleId="module-id"),
                "adapter-id-2": InStackerHopperLocation(moduleId="module-id"),
                "adapter-id-3": InStackerHopperLocation(moduleId="module-id"),
            },
            id="adapter-only",
        ),
    ],
)
async def test_set_stored_labware_happypath(
    adapter_labware: StackerStoredLabwareDetails | None,
    lid_labware: StackerStoredLabwareDetails | None,
    pool_definition: FlexStackerPoolConstraint,
    decoy: Decoy,
    subject: SetStoredLabwareImpl,
    equipment: EquipmentHandler,
    state_view: StateView,
    flex_50uL_tiprack: LabwareDefinition,
    tiprack_adapter_def: LabwareDefinition,
    tiprack_lid_def: LabwareDefinition,
    initial_stored_labware: list[StackerStoredLabwareGroup],
    primary_loc_seq_prefixes: list[LabwareLocationSequence],
    lid_loc_seq_prefixes: list[LabwareLocationSequence],
    locations: dict[str, LabwareLocation],
) -> None:
    """It should load all possible main/lid/adapter combos."""
    module_id = "module-id"
    pool_definition.primary_definition = flex_50uL_tiprack
    pool_definition.lid_definition = (
        tiprack_lid_def if pool_definition.lid_definition is not None else None
    )
    pool_definition.adapter_definition = (
        tiprack_adapter_def if pool_definition.adapter_definition is not None else None
    )
    lid_definition: Any = None
    adapter_definition: Any = None
    params = SetStoredLabwareParams(
        moduleId=module_id,
        primaryLabware=StackerStoredLabwareDetails(
            loadName="main-name", namespace="main-namespace", version=1
        ),
        lidLabware=lid_labware,
        adapterLabware=adapter_labware,
        initialStoredLabware=initial_stored_labware,
    )
    decoy.when(state_view.modules.get_flex_stacker_substate(module_id)).then_return(
        FlexStackerSubState(
            module_id=cast(FlexStackerId, module_id),
            pool_primary_definition=None,
            pool_adapter_definition=None,
            pool_lid_definition=None,
            contained_labware_bottom_first=[],
            max_pool_count=0,
            pool_overlap=0,
            pool_height=0,
        )
    )
    decoy.when(
        await equipment.load_definition_for_details(
            load_name="main-name",
            namespace="main-namespace",
            version=1,
        )
    ).then_return((flex_50uL_tiprack, sentinel.unused))
    offset_ids_by_id: dict[str, str | None] = {}
    if lid_labware:
        decoy.when(
            await equipment.load_definition_for_details(
                load_name=lid_labware.loadName,
                namespace=lid_labware.namespace,
                version=lid_labware.version,
            )
        ).then_return((tiprack_lid_def, sentinel.unused))
        lid_definition = tiprack_lid_def
    if adapter_labware:
        decoy.when(
            await equipment.load_definition_for_details(
                load_name=adapter_labware.loadName,
                namespace=adapter_labware.namespace,
                version=adapter_labware.version,
            )
        ).then_return((tiprack_adapter_def, sentinel.unused))
        adapter_definition = tiprack_adapter_def

    for labware_group in initial_stored_labware:
        decoy.when(
            state_view.labware.known(labware_group.primaryLabwareId)
        ).then_return(True)
        offset_ids_by_id[labware_group.primaryLabwareId] = None
        if labware_group.adapterLabwareId:
            decoy.when(
                state_view.labware.known(labware_group.adapterLabwareId)
            ).then_return(True)
            decoy.when(
                state_view.geometry.get_location_sequence(
                    labware_group.adapterLabwareId
                )
            ).then_return(
                [
                    NotOnDeckLocationSequenceComponent(
                        logicalLocationName=OFF_DECK_LOCATION
                    )
                ]
            )
            decoy.when(
                state_view.labware.get_location(labware_group.primaryLabwareId)
            ).then_return(OnLabwareLocation(labwareId=labware_group.adapterLabwareId))
            decoy.when(
                state_view.labware.get_location(labware_group.adapterLabwareId)
            ).then_return(OFF_DECK_LOCATION)
            offset_ids_by_id[labware_group.adapterLabwareId] = None

        else:
            decoy.when(
                state_view.geometry.get_location_sequence(
                    labware_group.primaryLabwareId
                )
            ).then_return(
                [
                    NotOnDeckLocationSequenceComponent(
                        logicalLocationName=OFF_DECK_LOCATION
                    )
                ]
            )
            decoy.when(
                state_view.labware.get_location(labware_group.primaryLabwareId)
            ).then_return(OFF_DECK_LOCATION)

        if labware_group.lidLabwareId:
            decoy.when(
                state_view.labware.known(labware_group.lidLabwareId)
            ).then_return(True)
            decoy.when(
                state_view.labware.get_location(labware_group.lidLabwareId)
            ).then_return(OnLabwareLocation(labwareId=labware_group.primaryLabwareId))
            decoy.when(
                state_view.labware.get_lid_id_by_labware_id(
                    labware_group.primaryLabwareId
                )
            ).then_return(labware_group.lidLabwareId)
            offset_ids_by_id[labware_group.lidLabwareId] = None

    ordered_definitions = [
        x
        for x in [
            lid_definition,
            flex_50uL_tiprack,
            adapter_definition,
        ]
        if x is not None
    ]

    decoy.when(
        state_view.labware.stacker_labware_pool_to_ordered_list(
            primary_labware_definition=flex_50uL_tiprack,
            lid_labware_definition=lid_definition,
            adapter_labware_definition=adapter_definition,
        )
    ).then_return(ordered_definitions)

    decoy.when(
        state_view.geometry.get_height_of_labware_stack(ordered_definitions)
    ).then_return(sentinel.pool_height)

    decoy.when(
        state_view.labware.get_stacker_labware_overlap_offset(ordered_definitions)
    ).then_return(OverlapOffset(x=0, y=0, z=5.0))

    decoy.when(
        state_view.modules.stacker_max_pool_count_by_height(
            module_id, sentinel.pool_height, 5.0
        )
    ).then_return(10)

    result = await subject.execute(params)

    assert result == SuccessData(
        public=SetStoredLabwareResult.model_construct(
            primaryLabwareDefinition=flex_50uL_tiprack,
            lidLabwareDefinition=lid_definition,
            adapterLabwareDefinition=adapter_definition,
            storedLabware=initial_stored_labware,
            count=3,
            originalPrimaryLabwareLocationSequences=[
                prefix
                + [
                    NotOnDeckLocationSequenceComponent(
                        logicalLocationName=OFF_DECK_LOCATION
                    )
                ]
                for prefix in primary_loc_seq_prefixes
            ],
            originalAdapterLabwareLocationSequences=(
                [
                    [
                        NotOnDeckLocationSequenceComponent(
                            logicalLocationName=OFF_DECK_LOCATION
                        )
                    ]
                    for _ in initial_stored_labware
                ]
                if initial_stored_labware[0].adapterLabwareId is not None
                else None
            ),
            originalLidLabwareLocationSequences=(
                [
                    prefix
                    + [
                        NotOnDeckLocationSequenceComponent(
                            logicalLocationName=OFF_DECK_LOCATION
                        )
                    ]
                    for prefix in lid_loc_seq_prefixes
                ]
                if initial_stored_labware[0].lidLabwareId is not None
                else None
            ),
            newPrimaryLabwareLocationSequences=[
                prefix + [InStackerHopperLocation(moduleId=module_id)]
                for prefix in primary_loc_seq_prefixes
            ],
            newAdapterLabwareLocationSequences=(
                [
                    [InStackerHopperLocation(moduleId=module_id)]
                    for _ in initial_stored_labware
                ]
                if initial_stored_labware[0].adapterLabwareId is not None
                else None
            ),
            newLidLabwareLocationSequences=(
                [
                    prefix + [InStackerHopperLocation(moduleId=module_id)]
                    for prefix in lid_loc_seq_prefixes
                ]
                if initial_stored_labware[0].lidLabwareId is not None
                else None
            ),
        ),
        state_update=StateUpdate(
            flex_stacker_state_update=FlexStackerStateUpdate(
                module_id=module_id,
                pool_constraint=pool_definition,
                contained_labware_bottom_first=initial_stored_labware,
            ),
            batch_labware_location=BatchLabwareLocationUpdate(
                new_locations_by_id=locations,
                new_offset_ids_by_id=offset_ids_by_id,
            ),
        ),
    )


async def test_set_stored_labware_requires_empty_hopper(
    decoy: Decoy,
    state_view: StateView,
    subject: SetStoredLabwareImpl,
) -> None:
    """It should fail if the hopper is not empty."""
    module_id = "module-id"
    decoy.when(state_view.modules.get_flex_stacker_substate(module_id)).then_return(
        FlexStackerSubState(
            module_id=cast(FlexStackerId, module_id),
            pool_primary_definition=None,
            pool_adapter_definition=None,
            pool_lid_definition=None,
            contained_labware_bottom_first=[
                StackerStoredLabwareGroup(
                    primaryLabwareId="hello", adapterLabwareId=None, lidLabwareId=None
                )
            ],
            max_pool_count=6,
            pool_overlap=0,
            pool_height=0,
        )
    )
    with pytest.raises(FlexStackerNotLogicallyEmptyError):
        await subject.execute(
            SetStoredLabwareParams(
                moduleId=module_id,
                primaryLabware=StackerStoredLabwareDetails(
                    loadName="main-name", namespace="main-namespace", version=1
                ),
                lidLabware=None,
                adapterLabware=None,
                initialCount=3,
            )
        )


@pytest.mark.parametrize(
    "input_count,input_labware,output_labware,output_error",
    [
        (
            None,
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            does_not_raise(),
        ),
        (
            1,
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                )
            ],
            does_not_raise(),
        ),
    ],
)
@pytest.mark.parametrize(
    "overlap_override",
    [None, 5.0],
)
async def test_set_stored_labware_limits_count(
    input_count: int | None,
    input_labware: list[StackerStoredLabwareGroup] | None,
    output_labware: list[StackerStoredLabwareGroup],
    output_error: ContextManager[Any],
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: SetStoredLabwareImpl,
    model_utils: ModelUtils,
    flex_50uL_tiprack: LabwareDefinition,
    overlap_override: float | None,
) -> None:
    """It should default and limit the input count."""
    module_id = "module-id"
    params = SetStoredLabwareParams(
        moduleId=module_id,
        primaryLabware=StackerStoredLabwareDetails(
            loadName="opentrons_flex_96_filtertiprack_50ul",
            namespace="opentrons",
            version=1,
        ),
        lidLabware=None,
        adapterLabware=None,
        initialCount=input_count,
        initialStoredLabware=input_labware,
        poolOverlapOverride=overlap_override,
    )
    for i in range(len(output_labware)):
        decoy.when(model_utils.generate_id()).then_return(f"labware-{i + 1}")

    decoy.when(state_view.modules.get_flex_stacker_substate(module_id)).then_return(
        FlexStackerSubState(
            module_id=cast(FlexStackerId, module_id),
            pool_primary_definition=None,
            pool_adapter_definition=None,
            pool_lid_definition=None,
            contained_labware_bottom_first=[],
            max_pool_count=0,
            pool_overlap=0,
            pool_height=0,
        )
    )
    decoy.when(
        await equipment.load_definition_for_details(
            load_name="opentrons_flex_96_filtertiprack_50ul",
            namespace="opentrons",
            version=1,
        )
    ).then_return(
        (flex_50uL_tiprack, "opentrons/opentrons_flex_96_filtertiprack_50ul/1")
    )

    decoy.when(
        state_view.labware.stacker_labware_pool_to_ordered_list(
            flex_50uL_tiprack,
            None,
            None,
        )
    ).then_return([flex_50uL_tiprack])

    decoy.when(
        state_view.geometry.get_height_of_labware_stack([flex_50uL_tiprack])
    ).then_return(sentinel.pool_height)

    decoy.when(
        state_view.labware.get_stacker_labware_overlap_offset([flex_50uL_tiprack])
    ).then_return(OverlapOffset(x=0, y=0, z=10.0))

    decoy.when(
        state_view.modules.stacker_max_pool_count_by_height(
            module_id,
            sentinel.pool_height,
            10.0 if overlap_override is None else overlap_override,
        )
    ).then_return(2)

    # we need to control multiple return values from generate_id and it doesnt take
    # an argument so we can do this iter side-effecting thing
    labware_ids = iter(("labware-1", "labware-2"))
    decoy.when(model_utils.generate_id()).then_do(lambda: next(labware_ids))
    decoy.when(
        await equipment.load_labware_pool_from_definitions(
            pool_primary_definition=flex_50uL_tiprack,
            pool_adapter_definition=None,
            pool_lid_definition=None,
            location=InStackerHopperLocation(moduleId=module_id),
            primary_id="labware-1",
            adapter_id=None,
            lid_id=None,
        )
    ).then_return(
        LoadedLabwarePoolData(
            primary_labware=LoadedLabware(
                id="labware-1",
                loadName="some-loadname",
                definitionUri="opentrons/opentrons_flex_96_filtertiprack_50ul/1",
                location=InStackerHopperLocation(moduleId=module_id),
                lid_id=None,
                offsetId=None,
                displayName=None,
            ),
            adapter_labware=None,
            lid_labware=None,
        )
    )
    decoy.when(
        await equipment.load_labware_pool_from_definitions(
            pool_primary_definition=flex_50uL_tiprack,
            pool_adapter_definition=None,
            pool_lid_definition=None,
            location=InStackerHopperLocation(moduleId=module_id),
            primary_id="labware-2",
            adapter_id=None,
            lid_id=None,
        )
    ).then_return(
        LoadedLabwarePoolData(
            primary_labware=LoadedLabware(
                id="labware-2",
                loadName="some-loadname",
                definitionUri="opentrons/opentrons_flex_96_filtertiprack_50ul/1",
                location=InStackerHopperLocation(moduleId=module_id),
                lid_id=None,
                offsetId=None,
                displayName=None,
            ),
            adapter_labware=None,
            lid_labware=None,
        )
    )

    with output_error:
        result = await subject.execute(params)
    assert result == SuccessData(
        public=SetStoredLabwareResult.model_construct(
            primaryLabwareDefinition=flex_50uL_tiprack,
            lidLabwareDefinition=None,
            adapterLabwareDefinition=None,
            count=len(output_labware),
            storedLabware=output_labware,
            originalPrimaryLabwareLocationSequences=[
                [
                    NotOnDeckLocationSequenceComponent(
                        logicalLocationName=SYSTEM_LOCATION
                    )
                ]
                for _ in output_labware
            ],
            originalAdapterLabwareLocationSequences=None,
            originalLidLabwareLocationSequences=None,
            newPrimaryLabwareLocationSequences=[
                [InStackerHopperLocation(moduleId="module-id")] for _ in output_labware
            ],
            newAdapterLabwareLocationSequences=None,
            newLidLabwareLocationSequences=None,
        ),
        state_update=StateUpdate(
            flex_stacker_state_update=FlexStackerStateUpdate(
                module_id=module_id,
                pool_constraint=FlexStackerPoolConstraint(
                    max_pool_count=2,
                    pool_overlap=overlap_override or 10.0,
                    pool_height=sentinel.pool_height,
                    primary_definition=flex_50uL_tiprack,
                    lid_definition=None,
                    adapter_definition=None,
                ),
                contained_labware_bottom_first=output_labware,
            ),
            batch_loaded_labware=BatchLoadedLabwareUpdate(
                new_locations_by_id={
                    f"labware-{i + 1}": InStackerHopperLocation(moduleId="module-id")
                    for i, _ in enumerate(output_labware)
                },
                offset_ids_by_id={
                    f"labware-{i + 1}": None for i, _ in enumerate(output_labware)
                },
                display_names_by_id={
                    f"labware-{i + 1}": None for i, _ in enumerate(output_labware)
                },
                definitions_by_id={
                    f"labware-{i + 1}": flex_50uL_tiprack
                    for i, _ in enumerate(output_labware)
                },
            ),
            labware_lid=LabwareLidUpdate(parent_labware_ids=[], lid_ids=[]),
        ),
    )


@pytest.mark.parametrize(
    "input_count,input_labware",
    [
        (3, None),
        (
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="labware-3",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
        ),
    ],
)
async def test_set_stored_labware_exceeding_max(
    input_count: int | None,
    input_labware: list[StackerStoredLabwareGroup] | None,
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: SetStoredLabwareImpl,
    model_utils: ModelUtils,
    flex_50uL_tiprack: LabwareDefinition,
) -> None:
    """It should default and limit the input count."""
    module_id = "module-id"
    params = SetStoredLabwareParams(
        moduleId=module_id,
        primaryLabware=StackerStoredLabwareDetails(
            loadName="opentrons_flex_96_filtertiprack_50ul",
            namespace="opentrons",
            version=1,
        ),
        lidLabware=None,
        adapterLabware=None,
        initialCount=input_count,
        initialStoredLabware=input_labware,
    )

    decoy.when(state_view.modules.get_flex_stacker_substate(module_id)).then_return(
        FlexStackerSubState(
            module_id=cast(FlexStackerId, module_id),
            pool_primary_definition=None,
            pool_adapter_definition=None,
            pool_lid_definition=None,
            contained_labware_bottom_first=[],
            max_pool_count=0,
            pool_overlap=0,
            pool_height=0,
        )
    )
    decoy.when(
        await equipment.load_definition_for_details(
            load_name="opentrons_flex_96_filtertiprack_50ul",
            namespace="opentrons",
            version=1,
        )
    ).then_return(
        (flex_50uL_tiprack, "opentrons/opentrons_flex_96_filtertiprack_50ul/1")
    )

    decoy.when(
        state_view.labware.stacker_labware_pool_to_ordered_list(
            flex_50uL_tiprack,
            None,
            None,
        )
    ).then_return([flex_50uL_tiprack])

    decoy.when(
        state_view.labware.get_stacker_labware_overlap_offset([flex_50uL_tiprack])
    ).then_return(OverlapOffset(x=0, y=0, z=0))

    decoy.when(
        state_view.geometry.get_height_of_labware_stack([flex_50uL_tiprack])
    ).then_return(sentinel.pool_height)

    decoy.when(
        state_view.modules.stacker_max_pool_count_by_height(
            module_id, sentinel.pool_height, 0.0
        )
    ).then_return(2)

    with pytest.raises(CommandPreconditionViolated):
        await subject.execute(params)
