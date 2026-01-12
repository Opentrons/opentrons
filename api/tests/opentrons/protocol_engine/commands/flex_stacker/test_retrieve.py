"""Test Flex Stacker retrieve command implementation."""

from datetime import datetime
from typing import Type, Union
from unittest.mock import sentinel

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.errors.exceptions import (
    FlexStackerHopperLabwareError,
    FlexStackerShuttleLabwareError,
    FlexStackerShuttleMissingError,
    FlexStackerShuttleNotEmptyError,
    FlexStackerStallError,
)
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
)

from opentrons.drivers.flex_stacker.types import StackerAxis
from opentrons.hardware_control.modules import FlexStacker, PlatformState
from opentrons.protocol_engine.commands import flex_stacker
from opentrons.protocol_engine.commands.command import DefinedErrorData, SuccessData
from opentrons.protocol_engine.commands.flex_stacker.common import (
    FlexStackerHopperError,
    FlexStackerLabwareRetrieveError,
    FlexStackerShuttleError,
    FlexStackerShuttleOccupiedError,
    FlexStackerStallOrCollisionError,
)
from opentrons.protocol_engine.commands.flex_stacker.retrieve import RetrieveImpl
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
    LabwareOffset,
    LabwareUri,
    LoadedModule,
    ModuleLocation,
    ModuleModel,
    OnAddressableAreaLocationSequenceComponent,
    OnCutoutFixtureLocationSequenceComponent,
    OnLabwareLocation,
    OnLabwareLocationSequenceComponent,
    OnLabwareOffsetLocationSequenceComponent,
    OnModuleLocationSequenceComponent,
    StackerStoredLabwareGroup,
)
from opentrons.types import DeckSlotName


def _contained_labware(
    count: int, with_lid: bool = False, with_adapter: bool = False
) -> list[StackerStoredLabwareGroup]:
    return [
        StackerStoredLabwareGroup(
            primaryLabwareId=f"primary-id-{i + 1}",
            adapterLabwareId=f"adapter-id-{i + 1}" if with_adapter else None,
            lidLabwareId=f"lid-id-{i + 1}" if with_lid else None,
        )
        for i in range(count)
    ]


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
) -> RetrieveImpl:
    """Get a retrieve command to test."""
    return RetrieveImpl(
        state_view=state_view, equipment=equipment, model_utils=model_utils
    )


async def test_retrieve_raises_when_empty(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: RetrieveImpl,
    flex_50uL_tiprack: LabwareDefinition,
    stacker_id: FlexStackerId,
) -> None:
    """It should raise an exception when called on an empty pool."""
    data = flex_stacker.RetrieveParams(moduleId=stacker_id)

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


async def test_retrieve_primary_only(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: RetrieveImpl,
    flex_50uL_tiprack: LabwareDefinition,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should be able to retrieve a labware."""
    data = flex_stacker.RetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=_contained_labware(1),
        max_pool_count=5,
        pool_overlap=6,
        pool_height=10,
    )
    decoy.when(
        state_view.labware.get_uri_from_definition(flex_50uL_tiprack)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_filtertiprack_50ul/1"))
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId=stacker_id),
        )
    ).then_return(_stacker_base_loc_seq(stacker_id))
    decoy.when(
        state_view.geometry.get_projected_offset_location(
            ModuleLocation(moduleId=stacker_id)
        )
    ).then_return(sentinel.primary_offset_location)
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "opentrons/opentrons_flex_96_filtertiprack_50ul/1",
            sentinel.primary_offset_location,
        )
    ).then_return(
        LabwareOffset.model_construct(id="offset-id-1")  # type: ignore[call-arg]
    )

    _prep_stacker_own_location(decoy, state_view, stacker_id)

    result = await subject.execute(data)

    decoy.verify(
        await stacker_hardware.dispense_labware(labware_height=4),
        times=1,
    )

    assert result == SuccessData(
        public=flex_stacker.RetrieveResult(
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
                new_offset_ids_by_id={"primary-id-1": "offset-id-1"},
            ),
            flex_stacker_state_update=FlexStackerStateUpdate(
                module_id=stacker_id, contained_labware_bottom_first=[]
            ),
            addressable_area_used=AddressableAreaUsedUpdate(
                addressable_area_name="flexStackerV1B4"
            ),
        ),
    )


async def test_retrieve_primary_and_lid(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: RetrieveImpl,
    flex_50uL_tiprack: LabwareDefinition,
    tiprack_lid_def: LabwareDefinition,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should be able to retrieve a labware with a lid on it."""
    data = flex_stacker.RetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=tiprack_lid_def,
        contained_labware_bottom_first=_contained_labware(2, with_lid=True),
        max_pool_count=5,
        pool_overlap=2,
        pool_height=10,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)
    decoy.when(
        state_view.labware.get_uri_from_definition(flex_50uL_tiprack)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_filtertiprack_50ul/1"))
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(tiprack_lid_def)
    ).then_return(LabwareUri("opentrons/opentrons_flex_tiprack_lid/1"))
    decoy.when(state_view.labware.get_uri_from_definition(tiprack_lid_def)).then_return(
        LabwareUri("opentrons/opentrons_flex_tiprack_lid/1")
    )

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId=stacker_id),
        )
    ).then_return(_stacker_base_loc_seq(stacker_id))
    decoy.when(
        state_view.geometry.get_projected_offset_location(
            ModuleLocation(moduleId=stacker_id),
        )
    ).then_return([sentinel.primary_offset_location])
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "opentrons/opentrons_flex_96_filtertiprack_50ul/1",
            [sentinel.primary_offset_location],
        )
    ).then_return(
        LabwareOffset.model_construct(id="offset-id-1")  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "opentrons/opentrons_flex_tiprack_lid/1",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons/opentrons_flex_96_filtertiprack_50ul/1"
                ),
                sentinel.primary_offset_location,
            ],
        )
    ).then_return(None)
    _prep_stacker_own_location(decoy, state_view, stacker_id)

    result = await subject.execute(data)

    decoy.verify(
        await stacker_hardware.dispense_labware(labware_height=8),
        times=1,
    )

    assert result == SuccessData(
        public=flex_stacker.RetrieveResult(
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
            originalPrimaryLocationSequence=[
                InStackerHopperLocation(moduleId=stacker_id)
            ],
            originalLidLocationSequence=[
                OnLabwareLocationSequenceComponent(
                    labwareId="primary-id-1", lidId="lid-id-1"
                ),
                InStackerHopperLocation(moduleId=stacker_id),
            ],
            lidLabwareURI="opentrons/opentrons_flex_tiprack_lid/1",
        ),
        state_update=StateUpdate(
            batch_labware_location=BatchLabwareLocationUpdate(
                new_locations_by_id={
                    "primary-id-1": ModuleLocation(moduleId=stacker_id),
                    "lid-id-1": OnLabwareLocation(labwareId="primary-id-1"),
                },
                new_offset_ids_by_id={"primary-id-1": "offset-id-1", "lid-id-1": None},
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


async def test_retrieve_primary_and_adapter(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: RetrieveImpl,
    flex_50uL_tiprack: LabwareDefinition,
    tiprack_adapter_def: LabwareDefinition,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should be able to retrieve a labware on an adapter."""
    data = flex_stacker.RetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=tiprack_adapter_def,
        pool_lid_definition=None,
        contained_labware_bottom_first=_contained_labware(2, with_adapter=True),
        max_pool_count=5,
        pool_overlap=3,
        pool_height=15,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)
    decoy.when(
        state_view.labware.get_uri_from_definition(flex_50uL_tiprack)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_filtertiprack_50ul/1"))
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(tiprack_adapter_def)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_tiprack_adapter/1"))
    decoy.when(
        state_view.labware.get_uri_from_definition(tiprack_adapter_def)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_tiprack_adapter/1"))

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId=stacker_id)
        )
    ).then_return(_stacker_base_loc_seq(stacker_id))
    decoy.when(
        state_view.geometry.get_projected_offset_location(
            ModuleLocation(moduleId=stacker_id)
        )
    ).then_return([sentinel.adapter_offset_location])
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "opentrons/opentrons_flex_96_tiprack_adapter/1",
            [sentinel.adapter_offset_location],
        )
    ).then_return(
        LabwareOffset.model_construct(id="offset-id-1")  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "opentrons/opentrons_flex_96_filtertiprack_50ul/1",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons/opentrons_flex_96_tiprack_adapter/1"
                ),
                sentinel.adapter_offset_location,
            ],
        )
    ).then_return(
        LabwareOffset.model_construct(id="offset-id-2")  # type: ignore[call-arg]
    )

    _prep_stacker_own_location(decoy, state_view, stacker_id)
    result = await subject.execute(data)

    decoy.verify(
        await stacker_hardware.dispense_labware(labware_height=12),
        times=1,
    )

    assert result == SuccessData(
        public=flex_stacker.RetrieveResult(
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
                new_offset_ids_by_id={
                    "primary-id-1": "offset-id-2",
                    "adapter-id-1": "offset-id-1",
                },
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


async def test_retrieve_primary_adapter_and_lid(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: RetrieveImpl,
    flex_50uL_tiprack: LabwareDefinition,
    tiprack_adapter_def: LabwareDefinition,
    tiprack_lid_def: LabwareDefinition,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should be able to retrieve a labware on an adapter."""
    data = flex_stacker.RetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=tiprack_adapter_def,
        pool_lid_definition=tiprack_lid_def,
        contained_labware_bottom_first=_contained_labware(
            2, with_lid=True, with_adapter=True
        ),
        max_pool_count=5,
        pool_overlap=4,
        pool_height=20,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)
    decoy.when(
        state_view.labware.get_uri_from_definition(flex_50uL_tiprack)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_filtertiprack_50ul/1"))
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(tiprack_lid_def)
    ).then_return(LabwareUri("opentrons/opentrons_flex_tiprack_lid/1"))
    decoy.when(state_view.labware.get_uri_from_definition(tiprack_lid_def)).then_return(
        LabwareUri("opentrons/opentrons_flex_tiprack_lid/1")
    )
    decoy.when(
        state_view.labware.get_uri_from_definition_unless_none(tiprack_adapter_def)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_tiprack_adapter/1"))
    decoy.when(
        state_view.labware.get_uri_from_definition(tiprack_adapter_def)
    ).then_return(LabwareUri("opentrons/opentrons_flex_96_tiprack_adapter/1"))

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId=stacker_id),
        )
    ).then_return(_stacker_base_loc_seq(stacker_id))
    decoy.when(
        state_view.geometry.get_projected_offset_location(
            ModuleLocation(moduleId=stacker_id)
        )
    ).then_return([sentinel.adapter_offset_location])
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "opentrons/opentrons_flex_96_tiprack_adapter/1",
            [sentinel.adapter_offset_location],
        )
    ).then_return(
        LabwareOffset.model_construct(id="offset-id-1")  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "opentrons/opentrons_flex_96_filtertiprack_50ul/1",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons/opentrons_flex_96_tiprack_adapter/1"
                ),
                sentinel.adapter_offset_location,
            ],
        )
    ).then_return(
        LabwareOffset.model_construct(id="offset-id-2")  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "opentrons/opentrons_flex_tiprack_lid/1",
            [
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons/opentrons_flex_96_filtertiprack_50ul/1"
                ),
                OnLabwareOffsetLocationSequenceComponent(
                    labwareUri="opentrons/opentrons_flex_96_tiprack_adapter/1"
                ),
                sentinel.adapter_offset_location,
            ],
        )
    ).then_return(None)

    _prep_stacker_own_location(decoy, state_view, stacker_id)
    result = await subject.execute(data)

    decoy.verify(
        await stacker_hardware.dispense_labware(
            labware_height=16,
        ),
        times=1,
    )

    assert result == SuccessData(
        public=flex_stacker.RetrieveResult(
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
            originalLidLocationSequence=[
                OnLabwareLocationSequenceComponent(
                    labwareId="primary-id-1", lidId="lid-id-1"
                ),
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
                    "lid-id-1": OnLabwareLocation(labwareId="primary-id-1"),
                },
                new_offset_ids_by_id={
                    "primary-id-1": "offset-id-2",
                    "adapter-id-1": "offset-id-1",
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


@pytest.mark.parametrize(
    "shared_data_error,protocol_engine_error",
    [
        (
            FlexStackerStallError(serial="123", axis=StackerAxis.Z),
            FlexStackerStallOrCollisionError,
        ),
        (
            FlexStackerShuttleMissingError(
                serial="123",
                expected_state=PlatformState.EXTENDED,
                shuttle_state=PlatformState.UNKNOWN,
            ),
            FlexStackerShuttleError,
        ),
        (
            FlexStackerHopperLabwareError(
                serial="123",
                labware_expected=True,
            ),
            FlexStackerHopperError,
        ),
        (
            FlexStackerShuttleLabwareError(
                serial="123", labware_expected=True, shuttle_state=""
            ),
            FlexStackerLabwareRetrieveError,
        ),
        (
            FlexStackerShuttleNotEmptyError(
                serial="123", labware_expected=True, shuttle_state=""
            ),
            FlexStackerShuttleOccupiedError,
        ),
    ],
)
async def test_retrieve_raises_recoverable_error(
    decoy: Decoy,
    equipment: EquipmentHandler,
    state_view: StateView,
    subject: RetrieveImpl,
    model_utils: ModelUtils,
    stacker_id: FlexStackerId,
    flex_50uL_tiprack: LabwareDefinition,
    stacker_hardware: FlexStacker,
    shared_data_error: Exception,
    protocol_engine_error: Type[
        Union[
            FlexStackerStallOrCollisionError,
            FlexStackerShuttleError,
            FlexStackerLabwareRetrieveError,
        ]
    ],
) -> None:
    """It should raise a stall error."""
    error_id = "error-id"
    error_timestamp = datetime(year=2020, month=1, day=2)

    data = flex_stacker.RetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=_contained_labware(1),
        max_pool_count=999,
        pool_overlap=4,
        pool_height=20,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)

    _prep_stacker_own_location(decoy, state_view, stacker_id)

    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(model_utils.get_timestamp()).then_return(error_timestamp)

    decoy.when(
        await stacker_hardware.dispense_labware(  # type: ignore[func-returns-value]
            labware_height=16,
        )
    ).then_raise(shared_data_error)

    result = await subject.execute(data)

    assert result == DefinedErrorData(
        public=protocol_engine_error.model_construct(
            id=error_id,
            createdAt=error_timestamp,
            wrappedErrors=[matchers.Anything()],
            errorInfo={"labwareId": "primary-id-1"},
        ),
        state_update_if_false_positive=StateUpdate(
            batch_labware_location=BatchLabwareLocationUpdate(
                new_locations_by_id={
                    "primary-id-1": ModuleLocation(moduleId=stacker_id),
                },
                new_offset_ids_by_id={
                    "primary-id-1": None,
                },
            ),
            flex_stacker_state_update=FlexStackerStateUpdate(
                module_id=stacker_id,
                contained_labware_bottom_first=[],
            ),
            addressable_area_used=AddressableAreaUsedUpdate(
                addressable_area_name="flexStackerV1B4"
            ),
        ),
    )
