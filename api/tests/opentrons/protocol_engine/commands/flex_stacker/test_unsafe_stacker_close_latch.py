"""Test Flex Stacker close latch command implementation."""

import pytest
from decoy import Decoy

from opentrons.hardware_control.modules import FlexStacker
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.unsafe.unsafe_stacker_close_latch import (
    UnsafeFlexStackerCloseLatchImpl,
    UnsafeFlexStackerCloseLatchParams,
    UnsafeFlexStackerCloseLatchResult,
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
) -> UnsafeFlexStackerCloseLatchImpl:
    """Get a UnsafeFlexStackerCloseLatch command to test."""
    return UnsafeFlexStackerCloseLatchImpl(
        state_view=state_view, equipment=equipment, model_utils=model_utils
    )


async def test_close_latch_command(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    subject: UnsafeFlexStackerCloseLatchImpl,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should return a success data."""
    data = UnsafeFlexStackerCloseLatchParams(moduleId=stacker_id)

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

    decoy.verify(await stacker_hardware.close_latch(), times=1)

    assert result == SuccessData(public=UnsafeFlexStackerCloseLatchResult())
