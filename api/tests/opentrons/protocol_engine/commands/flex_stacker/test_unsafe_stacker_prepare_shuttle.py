"""Test Flex Stacker prepare shuttle command implementation."""

from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.errors.exceptions import FlexStackerStallError

from opentrons.drivers.flex_stacker.types import StackerAxis
from opentrons.hardware_control.modules import FlexStacker
from opentrons.protocol_engine.commands.command import DefinedErrorData, SuccessData
from opentrons.protocol_engine.commands.flex_stacker.common import (
    FlexStackerStallOrCollisionError,
)
from opentrons.protocol_engine.commands.unsafe.unsafe_stacker_prepare_shuttle import (
    UnsafeFlexStackerPrepareShuttleImpl,
    UnsafeFlexStackerPrepareShuttleParams,
    UnsafeFlexStackerPrepareShuttleResult,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates import (
    FlexStackerId,
    FlexStackerSubState,
)
from opentrons.protocol_engine.state.state import StateView


@pytest.fixture
def subject(
    state_view: StateView, equipment: EquipmentHandler, model_utils: ModelUtils
) -> UnsafeFlexStackerPrepareShuttleImpl:
    """Get a UnsafeFlexStackerPrepareShuttle command to test."""
    return UnsafeFlexStackerPrepareShuttleImpl(
        state_view=state_view, equipment=equipment, model_utils=model_utils
    )


async def test_home_command(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: UnsafeFlexStackerPrepareShuttleImpl,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should return a success data."""
    data = UnsafeFlexStackerPrepareShuttleParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=None,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=[],
        max_pool_count=0,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)

    result = await subject.execute(data)

    decoy.verify(await stacker_hardware.home_all(False), times=1)

    assert result == SuccessData(public=UnsafeFlexStackerPrepareShuttleResult())


async def test_home_command_with_stall_detected(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: UnsafeFlexStackerPrepareShuttleImpl,
    model_utils: ModelUtils,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should return a success data."""
    err_id = "error-id"
    err_timestamp = datetime(year=2025, month=3, day=19)

    data = UnsafeFlexStackerPrepareShuttleParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        pool_primary_definition=None,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        contained_labware_bottom_first=[],
        max_pool_count=0,
        pool_overlap=0,
        pool_height=0,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)
    decoy.when(model_utils.generate_id()).then_return(err_id)
    decoy.when(model_utils.get_timestamp()).then_return(err_timestamp)

    decoy.when(await stacker_hardware.home_all(False)).then_raise(  # type: ignore[func-returns-value]
        FlexStackerStallError(serial="123", axis=StackerAxis.Z)
    )

    result = await subject.execute(data)

    assert result == DefinedErrorData(
        public=FlexStackerStallOrCollisionError.model_construct(
            id=err_id,
            createdAt=err_timestamp,
            wrappedErrors=[matchers.Anything()],
            errorInfo={},
        )
    )
