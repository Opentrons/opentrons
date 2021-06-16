"""Command factories to use in tests as data fixtures."""
from datetime import datetime, timezone
from typing import Optional, Tuple

from opentrons.types import MountType
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.types import PipetteName, WellLocation, LabwareLocation
from opentrons.protocol_engine.commands.command import ReqT, ResT


def create_completed_command(
    request: ReqT,
    result: ResT,
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


def create_load_pipette_command(
    pipette_id: str,
    pipette_name: PipetteName,
    mount: MountType,
) -> cmd.CompletedCommand[cmd.LoadPipetteRequest, cmd.LoadPipetteResult]:
    """Get a completed LoadPipette command."""
    request = cmd.LoadPipetteRequest(pipetteName=pipette_name, mount=mount)
    result = cmd.LoadPipetteResult(pipetteId=pipette_id)

    return create_completed_command(request, result)


def create_aspirate_command(
    pipette_id: str,
    volume: float,
    labware_id: str = "labware-id",
    well_name: str = "A1",
    well_location: Optional[WellLocation] = None,
) -> cmd.CompletedCommand[cmd.AspirateRequest, cmd.AspirateResult]:
    """Get a completed Aspirate command."""
    request = cmd.AspirateRequest(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location or WellLocation(),
        volume=volume,
    )
    result = cmd.AspirateResult(volume=volume)

    return create_completed_command(request, result)


def create_dispense_command(
    pipette_id: str,
    volume: float,
    labware_id: str = "labware-id",
    well_name: str = "A1",
    well_location: Optional[WellLocation] = None,
) -> cmd.CompletedCommand[cmd.DispenseRequest, cmd.DispenseResult]:
    """Get a completed Dispense command."""
    request = cmd.DispenseRequest(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location or WellLocation(),
        volume=volume,
    )
    result = cmd.DispenseResult(volume=volume)

    return create_completed_command(request, result)


def create_pick_up_tip_command(
    pipette_id: str,
    labware_id: str = "labware-id",
    well_name: str = "A1",
) -> cmd.CompletedCommand[cmd.PickUpTipRequest, cmd.PickUpTipResult]:
    """Get a completed PickUpTip command."""
    request = cmd.PickUpTipRequest(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
    )

    result = cmd.PickUpTipResult()

    return create_completed_command(request, result)


def create_drop_tip_command(
    pipette_id: str,
    labware_id: str = "labware-id",
    well_name: str = "A1",
) -> cmd.CompletedCommand[cmd.DropTipRequest, cmd.DropTipResult]:
    """Get a completed DropTip command."""
    request = cmd.DropTipRequest(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
    )

    result = cmd.DropTipResult()

    return create_completed_command(request, result)


def create_move_to_well_command(
    pipette_id: str,
    labware_id: str = "labware-id",
    well_name: str = "A1",
) -> cmd.CompletedCommand[cmd.MoveToWellRequest, cmd.MoveToWellResult]:
    """Get a completed MoveToWell command."""
    request = cmd.MoveToWellRequest(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
    )

    result = cmd.MoveToWellResult()

    return create_completed_command(request, result)
