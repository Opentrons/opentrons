"""Test add labware command."""
from decoy import Decoy

from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    MovementHandler,
    PipettingHandler,
    RunControlHandler,
)

from opentrons.protocol_engine.commands.add_labware_definition import (
    AddLabwareDefinitionParams,
    AddLabwareDefinitionResult,
    AddLabwareDefinitionImplementation,
)


async def test_add_labware_implementation(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    pipetting: PipettingHandler,
    run_control: RunControlHandler,
) -> None:
    """An AddLabwareRequest should have an execution implementation."""
    subject = AddLabwareDefinitionImplementation(
        equipment=equipment,
        movement=movement,
        pipetting=pipetting,
        run_control=run_control,
    )

    data = AddLabwareDefinitionParams(definition=well_plate_def)
    result = await subject.execute(data)

    assert result == AddLabwareDefinitionResult(
        loadName=well_plate_def.parameters.loadName,
        namespace=well_plate_def.namespace,
        version=well_plate_def.version,
    )
