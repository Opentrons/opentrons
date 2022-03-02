"""Test magnetic module engage commands."""

from decoy import Decoy

from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands.magnetic_module import (
    EngageParams,
    EngageResult,
)
from opentrons.protocol_engine.commands.magnetic_module.engage import (
    EngageImplementation,
)


async def test_magnetic_module_engage_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
) -> None:
    """It should delegate to the equipment handler."""
    subject = EngageImplementation(equipment=equipment)
    params = EngageParams(
        moduleId="module-id",
        engageHeight=3.14159,
    )
    result = await subject.execute(params=params)
    decoy.verify(
        await equipment.engage_magnets(
            magnetic_module_id="module-id",
            mm_above_labware_base=3.14159,
        )
    )
    assert result == EngageResult()
