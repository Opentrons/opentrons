"""Test Flex Stacker unsafe manual retrieve command implementation."""

import pytest
from decoy import Decoy

from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
)

from opentrons.hardware_control.modules import FlexStacker
from opentrons.hardware_control.modules.types import PlatformState
from opentrons.protocol_engine.commands import unsafe
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.unsafe.unsafe_stacker_manual_retrieve import (
    UnsafeFlexStackerManualRetrieveImpl,
)
from opentrons.protocol_engine.errors import CannotPerformModuleAction
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates import (
    FlexStackerId,
    FlexStackerSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.update_types import (
    AddressableAreaUsedUpdate,
    BatchLabwareLocationUpdate,
    FlexStackerStateUpdate,
    StateUpdate,
)
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    InStackerHopperLocation,
    LabwareLocationSequence,
    LabwareUri,
    LoadedModule,
    ModuleLocation,
    ModuleModel,
    OnAddressableAreaLocationSequenceComponent,
    OnCutoutFixtureLocationSequenceComponent,
    OnLabwareLocation,
    OnLabwareLocationSequenceComponent,
    OnModuleLocationSequenceComponent,
    StackerStoredLabwareGroup,
)
from opentrons.types import DeckSlotName


def _contained_labware(
    count: int, with_adapter: bool = False, with_lid: bool = False
) -> list[StackerStoredLabwareGroup]:
    return [
        StackerStoredLabwareGroup(
            primaryLabwareId=f"primary-id-{i + 1}",
            adapterLabwareId=None if not with_adapter else f"adapter-id-{i + 1}",
            lidLabwareId=None if not with_lid else f"lid-id-{i + 1}",
        )
        for i in range(count)
    ]


@pytest.fixture
def stacker_id() -> FlexStackerId:
    """Get a consistent ID for a stacker."""
    return FlexStackerId("flex-stacker-id")


@pytest.fixture
def stacker_hardware(
    decoy: Decoy, equipment: EquipmentHandler, stacker_id: FlexStackerId
) -> FlexStacker:
    """Get a mocked hardware stacker."""
    hardware = decoy.mock(cls=FlexStacker)
    decoy.when(equipment.get_module_hardware_api(stacker_id)).then_return(hardware)
    return hardware


def _prep_stacker_own_location(
    decoy: Decoy, state_view: StateView, stacker_id: str
) -> None:
    decoy.when(state_view.modules.get_location(stacker_id)).then_return(
        DeckSlotLocation(slotName=DeckSlotName(value="B3")),
    )
    decoy.when(state_view.modules.get(stacker_id)).then_return(
        LoadedModule(
            id=stacker_id,
            location=DeckSlotLocation(slotName=DeckSlotName(value="B3")),
            model=ModuleModel.FLEX_STACKER_MODULE_V1,
            serialNumber="HIIIII",
        )
    )
    decoy.when(
        state_view.modules.ensure_and_convert_module_fixture_location(
            deck_slot=DeckSlotName("B3"), model=ModuleModel.FLEX_STACKER_MODULE_V1
        )
    ).then_return("flexStackerV1B4")


def _stacker_base_loc_seq(stacker_id: str) -> LabwareLocationSequence:
    return [
        OnAddressableAreaLocationSequenceComponent(
            addressableAreaName="flexStackerV1B4"
        ),
        OnModuleLocationSequenceComponent(moduleId=stacker_id),
        OnCutoutFixtureLocationSequenceComponent(
            cutoutId="cutoutB3", possibleCutoutFixtureIds=["flexStackerModuleV1"]
        ),
    ]


@pytest.fixture
def subject(
    state_view: StateView, equipment: EquipmentHandler, model_utils: ModelUtils
) -> UnsafeFlexStackerManualRetrieveImpl:
    """Get a retrieve command to test."""
    return UnsafeFlexStackerManualRetrieveImpl(
        state_view=state_view, equipment=equipment, model_utils=model_utils
    )


async def test_manual_retrieve_raises_when_empty(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: UnsafeFlexStackerManualRetrieveImpl,
    flex_50uL_tiprack: LabwareDefinition,
    stacker_id: FlexStackerId,
) -> None:
    """It should raise an exception when called on an empty pool."""
    data = unsafe.UnsafeFlexStackerManualRetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=[],
        max_pool_count=5,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)

    with pytest.raises(
        CannotPerformModuleAction,
        match="Cannot retrieve labware from Flex Stacker in .* because it contains no labware",
    ):
        await subject.execute(data)


async def test_manual_retrieve_primary_only(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: UnsafeFlexStackerManualRetrieveImpl,
    flex_50uL_tiprack: LabwareDefinition,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should be able to retrieve a labware."""
    data = unsafe.UnsafeFlexStackerManualRetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=_contained_labware(2),
        max_pool_count=5,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId=stacker_id),
        )
    ).then_return(_stacker_base_loc_seq(stacker_id))
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            InStackerHopperLocation(moduleId=stacker_id),
        )
    ).then_return([InStackerHopperLocation(moduleId=stacker_id)])
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(flex_50uL_tiprack)
    ).then_return("opentrons/opentrons_flex_96_filtertiprack_50ul/1")
    decoy.when(
        state_view.labware.get_uri_from_definition(flex_50uL_tiprack)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_filtertiprack_50ul/1"))
    _prep_stacker_own_location(decoy, state_view, stacker_id)

    decoy.when(stacker_hardware.platform_state).then_return(PlatformState.EXTENDED)

    result = await subject.execute(data)

    assert result == SuccessData(
        public=unsafe.UnsafeFlexStackerManualRetrieveResult(
            labwareId="primary-id-1",
            primaryLocationSequence=_stacker_base_loc_seq(stacker_id),
            primaryLabwareURI="opentrons/opentrons_flex_96_filtertiprack_50ul/1",
            originalPrimaryLocationSequence=[
                InStackerHopperLocation(moduleId=stacker_id)
            ],
        ),
        state_update=StateUpdate(
            batch_labware_location=BatchLabwareLocationUpdate(
                new_locations_by_id={
                    "primary-id-1": ModuleLocation(moduleId=stacker_id)
                },
                new_offset_ids_by_id={"primary-id-1": None},
            ),
            flex_stacker_state_update=FlexStackerStateUpdate(
                module_id=stacker_id,
                contained_labware_bottom_first=[_contained_labware(2)[1]],
            ),
            addressable_area_used=AddressableAreaUsedUpdate(
                addressable_area_name="flexStackerV1B4"
            ),
        ),
    )


async def test_manual_retrieve_primary_and_lid(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: UnsafeFlexStackerManualRetrieveImpl,
    flex_50uL_tiprack: LabwareDefinition,
    tiprack_lid_def: LabwareDefinition,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should be able to retrieve a labware with a lid on it."""
    data = unsafe.UnsafeFlexStackerManualRetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=tiprack_lid_def,
        contained_labware_bottom_first=_contained_labware(2, with_lid=True),
        max_pool_count=5,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId=stacker_id),
        )
    ).then_return(_stacker_base_loc_seq(stacker_id))
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            InStackerHopperLocation(moduleId=stacker_id)
        )
    ).then_return([InStackerHopperLocation(moduleId=stacker_id)])

    _prep_stacker_own_location(decoy, state_view, stacker_id)
    decoy.when(stacker_hardware.platform_state).then_return(PlatformState.EXTENDED)
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(flex_50uL_tiprack)
    ).then_return("opentrons/opentrons_flex_96_filtertiprack_50ul/1")
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(tiprack_lid_def)
    ).then_return("opentrons/opentrons_flex_tiprack_lid/1")

    decoy.when(
        state_view.labware.get_uri_from_definition(flex_50uL_tiprack)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_filtertiprack_50ul/1"))
    decoy.when(state_view.labware.get_uri_from_definition(tiprack_lid_def)).then_return(
        LabwareUri("opentrons/opentrons_flex_tiprack_lid/1")
    )

    result = await subject.execute(data)

    assert result == SuccessData(
        public=unsafe.UnsafeFlexStackerManualRetrieveResult(
            labwareId="primary-id-1",
            lidId="lid-id-1",
            primaryLocationSequence=_stacker_base_loc_seq(stacker_id),
            primaryLabwareURI="opentrons/opentrons_flex_96_filtertiprack_50ul/1",
            lidLocationSequence=(
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="primary-id-1", lidId="lid-id-1"
                    )
                ]
                + _stacker_base_loc_seq(stacker_id)
            ),
            lidLabwareURI="opentrons/opentrons_flex_tiprack_lid/1",
            originalPrimaryLocationSequence=[
                InStackerHopperLocation(moduleId=stacker_id)
            ],
            originalLidLocationSequence=[
                OnLabwareLocationSequenceComponent(
                    labwareId="primary-id-1", lidId="lid-id-1"
                ),
                InStackerHopperLocation(moduleId=stacker_id),
            ],
        ),
        state_update=StateUpdate(
            batch_labware_location=BatchLabwareLocationUpdate(
                new_locations_by_id={
                    "primary-id-1": ModuleLocation(moduleId=stacker_id),
                    "lid-id-1": OnLabwareLocation(labwareId="primary-id-1"),
                },
                new_offset_ids_by_id={"primary-id-1": None, "lid-id-1": None},
            ),
            flex_stacker_state_update=FlexStackerStateUpdate(
                module_id=stacker_id,
                contained_labware_bottom_first=[
                    _contained_labware(2, with_lid=True)[1]
                ],
            ),
            addressable_area_used=AddressableAreaUsedUpdate(
                addressable_area_name="flexStackerV1B4"
            ),
        ),
    )


async def test_manual_retrieve_primary_and_adapter(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: UnsafeFlexStackerManualRetrieveImpl,
    flex_50uL_tiprack: LabwareDefinition,
    tiprack_adapter_def: LabwareDefinition,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should be able to retrieve a labware on an adapter."""
    data = unsafe.UnsafeFlexStackerManualRetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=tiprack_adapter_def,
        pool_lid_definition=None,
        contained_labware_bottom_first=_contained_labware(2, with_adapter=True),
        max_pool_count=5,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId=stacker_id),
        )
    ).then_return(_stacker_base_loc_seq(stacker_id))
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            InStackerHopperLocation(moduleId=stacker_id)
        )
    ).then_return([InStackerHopperLocation(moduleId=stacker_id)])

    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(flex_50uL_tiprack)
    ).then_return("opentrons/opentrons_flex_96_filtertiprack_50ul/1")
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(tiprack_adapter_def)
    ).then_return("opentrons/opentrons_flex_96_tiprack_adapter/1")

    decoy.when(
        state_view.labware.get_uri_from_definition(flex_50uL_tiprack)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_filtertiprack_50ul/1"))
    decoy.when(
        state_view.labware.get_uri_from_definition(tiprack_adapter_def)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_tiprack_adapter/1"))

    _prep_stacker_own_location(decoy, state_view, stacker_id)
    decoy.when(stacker_hardware.platform_state).then_return(PlatformState.EXTENDED)

    result = await subject.execute(data)

    assert result == SuccessData(
        public=unsafe.UnsafeFlexStackerManualRetrieveResult(
            labwareId="primary-id-1",
            adapterId="adapter-id-1",
            primaryLocationSequence=(
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-1", lidId=None
                    )
                ]
                + _stacker_base_loc_seq(stacker_id)
            ),
            primaryLabwareURI="opentrons/opentrons_flex_96_filtertiprack_50ul/1",
            adapterLocationSequence=_stacker_base_loc_seq(stacker_id),
            adapterLabwareURI="opentrons/opentrons_flex_96_tiprack_adapter/1",
            originalPrimaryLocationSequence=[
                OnLabwareLocationSequenceComponent(
                    labwareId="adapter-id-1", lidId=None
                ),
                InStackerHopperLocation(moduleId=stacker_id),
            ],
            originalAdapterLocationSequence=[
                InStackerHopperLocation(moduleId=stacker_id)
            ],
        ),
        state_update=StateUpdate(
            batch_labware_location=BatchLabwareLocationUpdate(
                new_locations_by_id={
                    "adapter-id-1": ModuleLocation(moduleId=stacker_id),
                    "primary-id-1": OnLabwareLocation(labwareId="adapter-id-1"),
                },
                new_offset_ids_by_id={"primary-id-1": None, "adapter-id-1": None},
            ),
            flex_stacker_state_update=FlexStackerStateUpdate(
                module_id=stacker_id,
                contained_labware_bottom_first=[
                    _contained_labware(2, with_adapter=True)[1]
                ],
            ),
            addressable_area_used=AddressableAreaUsedUpdate(
                addressable_area_name="flexStackerV1B4"
            ),
        ),
    )


async def test_manual_retrieve_primary_adapter_and_lid(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: UnsafeFlexStackerManualRetrieveImpl,
    flex_50uL_tiprack: LabwareDefinition,
    tiprack_adapter_def: LabwareDefinition,
    tiprack_lid_def: LabwareDefinition,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should be able to retrieve a labware on an adapter."""
    data = unsafe.UnsafeFlexStackerManualRetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=tiprack_adapter_def,
        pool_lid_definition=tiprack_lid_def,
        contained_labware_bottom_first=_contained_labware(
            2, with_adapter=True, with_lid=True
        ),
        max_pool_count=5,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId=stacker_id),
        )
    ).then_return(_stacker_base_loc_seq(stacker_id))
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            InStackerHopperLocation(moduleId=stacker_id)
        )
    ).then_return([InStackerHopperLocation(moduleId=stacker_id)])
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            OnLabwareLocation(labwareId="adapter-id-1"),
        )
    ).then_return(
        [OnLabwareLocationSequenceComponent(labwareId="adapter-id-1", lidId=None)]
        + _stacker_base_loc_seq(stacker_id)
    )
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            OnLabwareLocation(labwareId="primary-id-1"),
        )
    ).then_return(
        [
            OnLabwareLocationSequenceComponent(
                labwareId="primary-id-1", lidId="lid-id-1"
            ),
            OnLabwareLocationSequenceComponent(labwareId="adapter-id-1", lidId=None),
        ]
        + _stacker_base_loc_seq(stacker_id)
    )
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(flex_50uL_tiprack)
    ).then_return("opentrons/opentrons_flex_96_filtertiprack_50ul/1")
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(tiprack_adapter_def)
    ).then_return("opentrons/opentrons_flex_96_tiprack_adapter/1")
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(tiprack_lid_def)
    ).then_return("opentrons/opentrons_flex_tiprack_lid/1")

    decoy.when(
        state_view.labware.get_uri_from_definition(flex_50uL_tiprack)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_filtertiprack_50ul/1"))
    decoy.when(
        state_view.labware.get_uri_from_definition(tiprack_adapter_def)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_tiprack_adapter/1"))
    decoy.when(state_view.labware.get_uri_from_definition(tiprack_lid_def)).then_return(
        LabwareUri("opentrons/opentrons_flex_tiprack_lid/1")
    )

    _prep_stacker_own_location(decoy, state_view, stacker_id)
    decoy.when(stacker_hardware.platform_state).then_return(PlatformState.EXTENDED)

    result = await subject.execute(data)

    assert result == SuccessData(
        public=unsafe.UnsafeFlexStackerManualRetrieveResult(
            labwareId="primary-id-1",
            adapterId="adapter-id-1",
            lidId="lid-id-1",
            primaryLocationSequence=(
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-1", lidId=None
                    )
                ]
                + _stacker_base_loc_seq(stacker_id)
            ),
            primaryLabwareURI="opentrons/opentrons_flex_96_filtertiprack_50ul/1",
            adapterLocationSequence=_stacker_base_loc_seq(stacker_id),
            adapterLabwareURI="opentrons/opentrons_flex_96_tiprack_adapter/1",
            lidLocationSequence=(
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId="primary-id-1", lidId="lid-id-1"
                    ),
                    OnLabwareLocationSequenceComponent(
                        labwareId="adapter-id-1", lidId=None
                    ),
                ]
                + _stacker_base_loc_seq(stacker_id)
            ),
            lidLabwareURI="opentrons/opentrons_flex_tiprack_lid/1",
            originalPrimaryLocationSequence=[
                OnLabwareLocationSequenceComponent(
                    labwareId="adapter-id-1", lidId=None
                ),
                InStackerHopperLocation(moduleId=stacker_id),
            ],
            originalAdapterLocationSequence=[
                InStackerHopperLocation(moduleId=stacker_id)
            ],
            originalLidLocationSequence=[
                OnLabwareLocationSequenceComponent(
                    labwareId="primary-id-1", lidId="lid-id-1"
                ),
                OnLabwareLocationSequenceComponent(
                    labwareId="adapter-id-1", lidId=None
                ),
                InStackerHopperLocation(moduleId=stacker_id),
            ],
        ),
        state_update=StateUpdate(
            batch_labware_location=BatchLabwareLocationUpdate(
                new_locations_by_id={
                    "adapter-id-1": ModuleLocation(moduleId=stacker_id),
                    "primary-id-1": OnLabwareLocation(labwareId="adapter-id-1"),
                    "lid-id-1": OnLabwareLocation(labwareId="primary-id-1"),
                },
                new_offset_ids_by_id={
                    "primary-id-1": None,
                    "adapter-id-1": None,
                    "lid-id-1": None,
                },
            ),
            flex_stacker_state_update=FlexStackerStateUpdate(
                module_id=stacker_id,
                contained_labware_bottom_first=[
                    _contained_labware(2, with_adapter=True, with_lid=True)[1]
                ],
            ),
            addressable_area_used=AddressableAreaUsedUpdate(
                addressable_area_name="flexStackerV1B4"
            ),
        ),
    )


async def test_manual_retrieve_fails_due_to_platform_state(
    decoy: Decoy,
    equipment: EquipmentHandler,
    state_view: StateView,
    subject: UnsafeFlexStackerManualRetrieveImpl,
    model_utils: ModelUtils,
    stacker_id: FlexStackerId,
    flex_50uL_tiprack: LabwareDefinition,
    stacker_hardware: FlexStacker,
) -> None:
    """It should raise a CannotPerformModuleAction error."""
    data = unsafe.UnsafeFlexStackerManualRetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=_contained_labware(1),
        max_pool_count=999,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId=stacker_id),
        )
    ).then_return(_stacker_base_loc_seq(stacker_id))
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            InStackerHopperLocation(moduleId=stacker_id)
        )
    ).then_return([InStackerHopperLocation(moduleId=stacker_id)])

    decoy.when(stacker_hardware.platform_state).then_return(PlatformState.UNKNOWN)
    with pytest.raises(
        CannotPerformModuleAction,
        match="Cannot manually retrieve a labware from Flex Stacker in .* if the carriage is not in gripper position.",
    ):
        await subject.execute(data)
