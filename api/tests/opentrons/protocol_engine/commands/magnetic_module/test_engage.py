"""Test magnetic module engage commands."""

import pytest
from decoy import Decoy

from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    MovementHandler,
    PipettingHandler,
    RunControlHandler,
    RailLightsHandler,
)
from opentrons.protocol_engine.commands.magnetic_module import EngageParams
from opentrons.protocol_engine.commands.magnetic_module.engage import (
    EngageImplementation,
)


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
async def test_magnetic_module_engage_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    run_control: RunControlHandler,
    rail_lights: RailLightsHandler,
) -> None:
    """It should engage the magnets."""
    subject = EngageImplementation(
        equipment=equipment,
        movement=movement,
        pipetting=pipetting,
        run_control=run_control,
        rail_lights=rail_lights,
    )
    params = EngageParams(
        moduleId="module-id",
        engageHeight=3.14159,
    )
    await subject.execute(params=params)
