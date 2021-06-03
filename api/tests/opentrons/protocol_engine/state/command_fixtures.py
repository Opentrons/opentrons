"""Command factories to use in tests as data fixtures."""
from datetime import datetime, timezone
from typing import Tuple

from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.types import LabwareLocation
from opentrons.protocol_engine.commands.command import ReqT, ResT


def create_completed_command(
    request: ReqT, result: ResT
) -> cmd.CompletedCommand[ReqT, ResT]:
    """Given a request and result, build a command model."""
    return cmd.CompletedCommand(
        created_at=datetime.now(tz=timezone.utc),
        started_at=datetime.now(tz=timezone.utc),
        completed_at=datetime.now(tz=timezone.utc),
        request=request,
        result=result,
    )


def create_load_labware_command(
    labware_id: str,
    location: LabwareLocation,
    definition: LabwareDefinition,
    calibration: Tuple[float, float, float],
) -> cmd.CompletedCommand[cmd.LoadLabwareRequest, cmd.LoadLabwareResult]:
    """Create a completed LoadLabware command."""
    request = cmd.LoadLabwareRequest(
        loadName=definition.parameters.loadName,
        namespace=definition.namespace,
        version=definition.version,
        location=location,
        labwareId=None,
    )
    result = cmd.LoadLabwareResult(
        labwareId=labware_id,
        definition=definition,
        calibration=calibration,
    )

    return create_completed_command(request, result)


def create_add_definition_command(
    definition: LabwareDefinition,
) -> cmd.CompletedCommand[
    cmd.AddLabwareDefinitionRequest, cmd.AddLabwareDefinitionResult
]:
    """Create a completed AddLabwareDefinition command."""
    request = cmd.AddLabwareDefinitionRequest(definition=definition)
    result = cmd.AddLabwareDefinitionResult(
        loadName=definition.parameters.loadName,
        namespace=definition.namespace,
        version=definition.version,
    )

    return create_completed_command(request, result)
