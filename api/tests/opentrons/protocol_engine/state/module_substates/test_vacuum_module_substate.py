"""Tests for VacuumModuleSubState."""

from opentrons.protocol_engine.state.module_substates.vacuum_module_substate import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.update_types import VacuumModuleStateUpdate


def test_new_from_state_change_updates_pump_and_residual() -> None:
    """It should apply pump and residual vacuum updates."""
    state = VacuumModuleSubState(
        module_id=VacuumModuleId("vm-1"),
        pump_engaged=False,
        residual_vacuum=False,
    )
    updated = state.new_from_state_change(
        VacuumModuleStateUpdate(
            module_id="vm-1",
            pump_engaged=True,
            residual_vacuum=True,
        )
    )
    assert updated.pump_engaged is True
    assert updated.residual_vacuum is True
    assert updated.module_id == VacuumModuleId("vm-1")


def test_new_from_state_change_preserves_unspecified_fields() -> None:
    """NO_CHANGE fields should keep prior values."""
    state = VacuumModuleSubState(
        module_id=VacuumModuleId("vm-1"),
        pump_engaged=True,
        residual_vacuum=True,
        target_pressure=-100.0,
    )
    updated = state.new_from_state_change(
        VacuumModuleStateUpdate(module_id="vm-1", residual_vacuum=False)
    )
    assert updated.pump_engaged is True
    assert updated.residual_vacuum is False
    assert updated.target_pressure == -100.0
