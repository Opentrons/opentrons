"""Tests for hardware fixups during error recovery."""

import pytest
from decoy import Decoy, matchers

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.execution.error_recovery_hardware_state_synchronizer import (
    ErrorRecoveryHardwareStateSynchronizer,
)
from opentrons.protocol_engine.state.state import StateStore
from opentrons.protocol_engine.state.update_types import (
    PipetteAspirateReadyUpdate,
    StateUpdate,
)
from opentrons.protocol_engine.types import LabwareWellId, TipGeometry
from opentrons.types import MountType


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore."""
    return decoy.mock(cls=StateStore)


def _attached_tip_update() -> tuple[StateUpdate, TipGeometry]:
    tip = TipGeometry(length=40, diameter=1, volume=200)
    state_update = (
        StateUpdate()
        .update_pipette_tip_state(
            pipette_id="pipette-id",
            tip_geometry=tip,
            tip_source=LabwareWellId(labware_id="labware-id", well_name="A1"),
        )
        .set_pipette_ready_to_aspirate("pipette-id", True)
    )
    return state_update, tip


async def test_prepares_plunger_when_false_positive_attaches_a_tip(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
) -> None:
    """It should cache the tip and prepare the plunger."""
    state_update, tip = _attached_tip_update()
    mount = MountType.LEFT.to_hw_mount()
    decoy.when(state_store.pipettes.get_mount("pipette-id")).then_return(MountType.LEFT)
    subject = ErrorRecoveryHardwareStateSynchronizer(hardware_api, state_store)

    await subject.prepare_for_false_positive_tip_pickup(state_update)

    decoy.verify(
        hardware_api.cache_tip(mount=mount, tip_length=tip.length),
        await hardware_api.prepare_for_aspirate(mount=mount),
    )


async def test_skips_prepare_when_false_positive_does_not_attach_a_tip(
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
    decoy: Decoy,
) -> None:
    """It should not move the plunger when the update does not attach a tip."""
    subject = ErrorRecoveryHardwareStateSynchronizer(hardware_api, state_store)

    await subject.prepare_for_false_positive_tip_pickup(StateUpdate())

    decoy.verify(
        await hardware_api.prepare_for_aspirate(mount=matchers.Anything()),
        times=0,
    )


async def test_clears_ready_when_plunger_prepare_fails(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
) -> None:
    """It should leave the pipette not ready if the plunger move fails."""
    state_update, _tip = _attached_tip_update()
    mount = MountType.LEFT.to_hw_mount()
    decoy.when(state_store.pipettes.get_mount("pipette-id")).then_return(MountType.LEFT)
    decoy.when(
        await hardware_api.prepare_for_aspirate(  # type: ignore[func-returns-value]
            mount=mount
        )
    ).then_raise(RuntimeError("overpressure"))
    subject = ErrorRecoveryHardwareStateSynchronizer(hardware_api, state_store)

    await subject.prepare_for_false_positive_tip_pickup(state_update)

    ready_update = state_update.ready_to_aspirate
    assert isinstance(ready_update, PipetteAspirateReadyUpdate)
    assert ready_update.ready_to_aspirate is False


async def test_skips_prepare_when_pickup_is_not_ready(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
) -> None:
    """It should not prepare when the false-positive update is not ready to aspirate."""
    state_update, _tip = _attached_tip_update()
    state_update.set_pipette_ready_to_aspirate("pipette-id", False)
    subject = ErrorRecoveryHardwareStateSynchronizer(hardware_api, state_store)

    await subject.prepare_for_false_positive_tip_pickup(state_update)

    decoy.verify(
        hardware_api.cache_tip(
            mount=matchers.Anything(), tip_length=matchers.Anything()
        ),
        times=0,
    )
