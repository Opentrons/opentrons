"""Command factories to use in tests as data fixtures."""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, cast

from opentrons.types import MountType
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.types import (
    LabwareOffset,
    PipetteName,
    WellLocation,
    LabwareLocation,
)


def create_pending_command(
    command_id: str = "command-id",
    command_type: str = "command-type",
    params: Optional[BaseModel] = None,
) -> cmd.Command:
    """Given command data, build a pending command model."""
    return cast(
        cmd.Command,
        cmd.BaseCommand(
            id=command_id,
            commandType=command_type,
            createdAt=datetime(year=2021, month=1, day=1),
            status=cmd.CommandStatus.QUEUED,
            params=params or BaseModel(),
        ),
    )


def create_running_command(
    command_id: str = "command-id",
    command_type: str = "command-type",
    params: Optional[BaseModel] = None,
) -> cmd.Command:
    """Given command data, build a running command model."""
    return cast(
        cmd.Command,
        cmd.BaseCommand(
            id=command_id,
            createdAt=datetime(year=2021, month=1, day=1),
            commandType=command_type,
            status=cmd.CommandStatus.RUNNING,
            params=params or BaseModel(),
        ),
    )


def create_failed_command(
    command_id: str = "command-id",
    command_type: str = "command-type",
    params: Optional[BaseModel] = None,
) -> cmd.Command:
    """Given command data, build a failed command model."""
    return cast(
        cmd.Command,
        cmd.BaseCommand(
            id=command_id,
            createdAt=datetime(year=2021, month=1, day=1),
            commandType=command_type,
            status=cmd.CommandStatus.FAILED,
            params=params or BaseModel(),
        ),
    )


def create_completed_command(
    command_id: str = "command-id",
    command_type: str = "command-type",
    params: Optional[BaseModel] = None,
    result: Optional[BaseModel] = None,
) -> cmd.Command:
    """Given command data and result, build a completed command model."""
    return cast(
        cmd.Command,
        cmd.BaseCommand(
            id=command_id,
            createdAt=datetime(year=2021, month=1, day=1),
            commandType=command_type,
            status=cmd.CommandStatus.SUCCEEDED,
            params=params or BaseModel(),
            result=result or BaseModel(),
        ),
    )


def create_load_labware_command(
    labware_id: str,
    location: LabwareLocation,
    definition: LabwareDefinition,
    offset: Optional[LabwareOffset],
) -> cmd.LoadLabware:
    """Create a completed LoadLabware command."""
    params = cmd.LoadLabwareParams(
        loadName=definition.parameters.loadName,
        namespace=definition.namespace,
        version=definition.version,
        location=location,
        labwareId=None,
    )

    result = cmd.LoadLabwareResult(
        labwareId=labware_id, definition=definition, offset=offset
    )

    return cmd.LoadLabware(
        id="command-id",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_add_definition_command(
    definition: LabwareDefinition,
) -> cmd.AddLabwareDefinition:
    """Create a completed AddLabwareDefinition command."""
    params = cmd.AddLabwareDefinitionParams(definition=definition)

    result = cmd.AddLabwareDefinitionResult(
        loadName=definition.parameters.loadName,
        namespace=definition.namespace,
        version=definition.version,
    )

    return cmd.AddLabwareDefinition(
        id="command-id",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_load_pipette_command(
    pipette_id: str,
    pipette_name: PipetteName,
    mount: MountType,
) -> cmd.LoadPipette:
    """Get a completed LoadPipette command."""
    params = cmd.LoadPipetteParams(pipetteName=pipette_name, mount=mount)
    result = cmd.LoadPipetteResult(pipetteId=pipette_id)

    return cmd.LoadPipette(
        id="command-id",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_aspirate_command(
    pipette_id: str,
    volume: float,
    labware_id: str = "labware-id",
    well_name: str = "A1",
    well_location: Optional[WellLocation] = None,
) -> cmd.Aspirate:
    """Get a completed Aspirate command."""
    params = cmd.AspirateParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location or WellLocation(),
        volume=volume,
    )
    result = cmd.AspirateResult(volume=volume)

    return cmd.Aspirate(
        id="command-id",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_dispense_command(
    pipette_id: str,
    volume: float,
    labware_id: str = "labware-id",
    well_name: str = "A1",
    well_location: Optional[WellLocation] = None,
) -> cmd.Dispense:
    """Get a completed Dispense command."""
    params = cmd.DispenseParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location or WellLocation(),
        volume=volume,
    )
    result = cmd.DispenseResult(volume=volume)

    return cmd.Dispense(
        id="command-id",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_pick_up_tip_command(
    pipette_id: str,
    labware_id: str = "labware-id",
    well_name: str = "A1",
) -> cmd.PickUpTip:
    """Get a completed PickUpTip command."""
    data = cmd.PickUpTipParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
    )

    result = cmd.PickUpTipResult()

    return cmd.PickUpTip(
        id="command-id",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=data,
        result=result,
    )


def create_drop_tip_command(
    pipette_id: str,
    labware_id: str = "labware-id",
    well_name: str = "A1",
) -> cmd.DropTip:
    """Get a completed DropTip command."""
    params = cmd.DropTipParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
    )

    result = cmd.DropTipResult()

    return cmd.DropTip(
        id="command-id",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_move_to_well_command(
    pipette_id: str,
    labware_id: str = "labware-id",
    well_name: str = "A1",
) -> cmd.MoveToWell:
    """Get a completed MoveToWell command."""
    params = cmd.MoveToWellParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
    )

    result = cmd.MoveToWellResult()

    return cmd.MoveToWell(
        id="command-id",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )
