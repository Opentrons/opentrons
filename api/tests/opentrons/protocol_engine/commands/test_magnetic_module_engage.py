"""Test magnetic module engage commands."""

import pytest
from decoy import Decoy

from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    MovementHandler,
    PipettingHandler,
    RunControlHandler,
)
from opentrons.protocol_engine.commands.magnetic_module_engage import (
    MagneticModuleEngageParams,
    MagneticModuleEngageImplementation,
)


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
async def test_magnetic_module_engage_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    run_control: RunControlHandler,
) -> None:
    """It should engage the magnets."""
    subject = MagneticModuleEngageImplementation(
        equipment=equipment,
        movement=movement,
        pipetting=pipetting,
        run_control=run_control,
    )
    params = MagneticModuleEngageParams(
        moduleId="module-id",
        engageHeight=3.14159,
    )
    await subject.execute(params=params)
