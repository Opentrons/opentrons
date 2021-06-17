"""Command factories to use in tests as data fixtures."""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Tuple, cast

from opentrons.types import MountType
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.errors import ProtocolEngineError
from opentrons.protocol_engine.types import PipetteName, WellLocation, LabwareLocation


def create_pending_command(
    request: Optional[BaseModel] = None,
) -> cmd.PendingCommandType:
    """Given a request and result, build a pending command model."""
    return cast(
        cmd.PendingCommandType,
        cmd.PendingCommand(
            created_at=datetime(year=2021, month=1, day=1),
            request=request or BaseModel(),
        ),
    )


def create_running_command(
    request: Optional[BaseModel] = None,
) -> cmd.RunningCommandType:
    """Given a request and result, build a running command model."""
    return cast(
        cmd.RunningCommandType,
        cmd.RunningCommand(
            created_at=datetime(year=2021, month=1, day=1),
            started_at=datetime(year=2022, month=2, day=2),
            request=request or BaseModel(),
        ),
    )


def create_failed_command(
    request: Optional[BaseModel] = None,
    error: Optional[ProtocolEngineError] = None,
) -> cmd.FailedCommandType:
    """Given a request and result, build a failed command model."""
    return cast(
        cmd.FailedCommandType,
        cmd.FailedCommand(
            created_at=datetime(year=2021, month=1, day=1),
            started_at=datetime(year=2022, month=2, day=2),
            failed_at=datetime(year=2023, month=3, day=3),
            request=request or BaseModel(),
            error=error or ProtocolEngineError(),
        ),
    )


def create_completed_command(
    request: Optional[BaseModel] = None,
    result: Optional[BaseModel] = None,
) -> cmd.CompletedCommandType:
    """Given a request and result, build a completed command model."""
    return cast(
        cmd.CompletedCommandType,
        cmd.CompletedCommand(
            created_at=datetime(year=2021, month=1, day=1),
            started_at=datetime(year=2022, month=2, day=2),
            completed_at=datetime(year=2023, month=3, day=3),
            request=request or BaseModel(),
            result=result or BaseModel(),
        ),
    )


def create_load_labware_command(
    labware_id: str,
    location: LabwareLocation,
    definition: LabwareDefinition,
    calibration: Tuple[float, float, float],
) -> cmd.CompletedCommandType:
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
) -> cmd.CompletedCommandType:
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
) -> cmd.CompletedCommandType:
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
) -> cmd.CompletedCommandType:
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
) -> cmd.CompletedCommandType:
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
) -> cmd.CompletedCommandType:
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
) -> cmd.CompletedCommandType:
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
) -> cmd.CompletedCommandType:
    """Get a completed MoveToWell command."""
    request = cmd.MoveToWellRequest(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
    )

    result = cmd.MoveToWellResult()

    return create_completed_command(request, result)
