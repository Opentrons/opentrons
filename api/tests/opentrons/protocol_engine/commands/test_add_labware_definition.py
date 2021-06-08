"""Test add labware command."""
from decoy import Decoy

from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine.execution import CommandHandlers
from opentrons.protocol_engine.commands.add_labware_definition import (
    AddLabwareDefinitionData,
    AddLabwareDefinitionResult,
    AddLabwareDefinitionImplementation,
)


async def test_add_labware_implementation(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    command_handlers: CommandHandlers,
) -> None:
    """An AddLabwareRequest should have an execution implementation."""
    data = AddLabwareDefinitionData(definition=well_plate_def)
    subject = AddLabwareDefinitionImplementation(data)
    result = await subject.execute(command_handlers)

    assert result == AddLabwareDefinitionResult(
        loadName=well_plate_def.parameters.loadName,
        namespace=well_plate_def.namespace,
        version=well_plate_def.version,
    )
