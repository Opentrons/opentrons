"""Command factories to use in tests as data fixtures."""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, cast

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons.types import MountType
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import ErrorOccurrence, commands as cmd
from opentrons.protocol_engine.types import (
    DeckPoint,
    ModuleModel,
    ModuleDefinition,
    MovementAxis,
    WellLocation,
    LabwareLocation,
    DeckSlotLocation,
    LabwareMovementStrategy,
)


def create_queued_command(
    command_id: str = "command-id",
    command_key: str = "command-key",
    command_type: str = "command-type",
    params: Optional[BaseModel] = None,
) -> cmd.Command:
    """Given command data, build a pending command model."""
    return cast(
        cmd.Command,
        cmd.BaseCommand(
            id=command_id,
            key=command_key,
            commandType=command_type,
            createdAt=datetime(year=2021, month=1, day=1),
            status=cmd.CommandStatus.QUEUED,
            params=params or BaseModel(),
        ),
    )


def create_running_command(
    command_id: str = "command-id",
    command_key: str = "command-key",
    command_type: str = "command-type",
    created_at: datetime = datetime(year=2021, month=1, day=1),
    params: Optional[BaseModel] = None,
) -> cmd.Command:
    """Given command data, build a running command model."""
    return cast(
        cmd.Command,
        cmd.BaseCommand(
            id=command_id,
            key=command_key,
            createdAt=created_at,
            commandType=command_type,
            status=cmd.CommandStatus.RUNNING,
            params=params or BaseModel(),
        ),
    )


def create_failed_command(
    command_id: str = "command-id",
    command_key: str = "command-key",
    command_type: str = "command-type",
    created_at: datetime = datetime(year=2021, month=1, day=1),
    completed_at: datetime = datetime(year=2022, month=2, day=2),
    params: Optional[BaseModel] = None,
    error: Optional[ErrorOccurrence] = None,
    intent: Optional[cmd.CommandIntent] = None,
) -> cmd.Command:
    """Given command data, build a failed command model."""
    return cast(
        cmd.Command,
        cmd.BaseCommand(
            id=command_id,
            key=command_key,
            createdAt=created_at,
            completedAt=completed_at,
            commandType=command_type,
            status=cmd.CommandStatus.FAILED,
            params=params or BaseModel(),
            error=error,
            intent=intent,
        ),
    )


def create_succeeded_command(
    command_id: str = "command-id",
    command_key: str = "command-key",
    command_type: str = "command-type",
    created_at: datetime = datetime(year=2021, month=1, day=1),
    params: Optional[BaseModel] = None,
    result: Optional[BaseModel] = None,
) -> cmd.Command:
    """Given command data and result, build a completed command model."""
    return cast(
        cmd.Command,
        cmd.BaseCommand(
            id=command_id,
            key=command_key,
            createdAt=created_at,
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
    offset_id: Optional[str],
    display_name: Optional[str],
) -> cmd.LoadLabware:
    """Create a completed LoadLabware command."""
    params = cmd.LoadLabwareParams(
        loadName=definition.parameters.loadName,
        namespace=definition.namespace,
        version=definition.version,
        location=location,
        labwareId=None,
        displayName=display_name,
    )

    result = cmd.LoadLabwareResult(
        labwareId=labware_id,
        definition=definition,
        offsetId=offset_id,
    )

    return cmd.LoadLabware(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_load_pipette_command(
    pipette_id: str,
    pipette_name: PipetteNameType,
    mount: MountType,
) -> cmd.LoadPipette:
    """Get a completed LoadPipette command."""
    params = cmd.LoadPipetteParams(pipetteName=pipette_name, mount=mount)
    result = cmd.LoadPipetteResult(pipetteId=pipette_id)

    return cmd.LoadPipette(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_load_module_command(
    module_id: str,
    location: DeckSlotLocation,
    model: ModuleModel,
) -> cmd.LoadModule:
    """Get a completed LoadModule command."""
    params = cmd.LoadModuleParams(moduleId=module_id, location=location, model=model)
    result = cmd.LoadModuleResult(
        moduleId=module_id,
        model=model,
        serialNumber=None,
        definition=ModuleDefinition.construct(),  # type: ignore[call-arg]
    )

    return cmd.LoadModule(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_aspirate_command(
    pipette_id: str,
    volume: float,
    flow_rate: float,
    labware_id: str = "labware-id",
    well_name: str = "A1",
    well_location: Optional[WellLocation] = None,
    destination: DeckPoint = DeckPoint(x=0, y=0, z=0),
) -> cmd.Aspirate:
    """Get a completed Aspirate command."""
    params = cmd.AspirateParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location or WellLocation(),
        volume=volume,
        flowRate=flow_rate,
    )
    result = cmd.AspirateResult(volume=volume, position=destination)

    return cmd.Aspirate(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_dispense_command(
    pipette_id: str,
    volume: float,
    flow_rate: float,
    labware_id: str = "labware-id",
    well_name: str = "A1",
    well_location: Optional[WellLocation] = None,
    destination: DeckPoint = DeckPoint(x=0, y=0, z=0),
) -> cmd.Dispense:
    """Get a completed Dispense command."""
    params = cmd.DispenseParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location or WellLocation(),
        volume=volume,
        flowRate=flow_rate,
    )
    result = cmd.DispenseResult(volume=volume, position=destination)

    return cmd.Dispense(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_dispense_in_place_command(
    pipette_id: str,
    volume: float,
    flow_rate: float,
) -> cmd.DispenseInPlace:
    """Get a completed DispenseInPlace command."""
    params = cmd.DispenseInPlaceParams(
        pipetteId=pipette_id,
        volume=volume,
        flowRate=flow_rate,
    )
    result = cmd.DispenseInPlaceResult(volume=volume)

    return cmd.DispenseInPlace(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_pick_up_tip_command(
    pipette_id: str,
    labware_id: str = "labware-id",
    well_name: str = "A1",
    tip_volume: float = 123.4,
    tip_length: float = 567.8,
    tip_diameter: float = 9.0,
    destination: DeckPoint = DeckPoint(x=0, y=0, z=0),
) -> cmd.PickUpTip:
    """Get a completed PickUpTip command."""
    data = cmd.PickUpTipParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
    )

    result = cmd.PickUpTipResult(
        tipVolume=tip_volume,
        tipLength=tip_length,
        tipDiameter=tip_diameter,
        position=destination,
    )

    return cmd.PickUpTip(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=data,
        result=result,
    )


def create_drop_tip_command(
    pipette_id: str,
    labware_id: str = "labware-id",
    well_name: str = "A1",
    destination: DeckPoint = DeckPoint(x=0, y=0, z=0),
) -> cmd.DropTip:
    """Get a completed DropTip command."""
    params = cmd.DropTipParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
    )

    result = cmd.DropTipResult(position=destination)

    return cmd.DropTip(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_drop_tip_in_place_command(
    pipette_id: str,
) -> cmd.DropTipInPlace:
    """Get a completed DropTip command."""
    params = cmd.DropTipInPlaceParams(pipetteId=pipette_id)

    result = cmd.DropTipInPlaceResult()

    return cmd.DropTipInPlace(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_move_to_well_command(
    pipette_id: str,
    labware_id: str = "labware-id",
    well_name: str = "A1",
    destination: DeckPoint = DeckPoint(x=0, y=0, z=0),
) -> cmd.MoveToWell:
    """Get a completed MoveToWell command."""
    params = cmd.MoveToWellParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
    )

    result = cmd.MoveToWellResult(position=destination)

    return cmd.MoveToWell(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_move_to_coordinates_command(
    pipette_id: str,
    coordinates: DeckPoint = DeckPoint(x=0, y=0, z=0),
) -> cmd.MoveToCoordinates:
    """Get a completed MoveToWell command."""
    params = cmd.MoveToCoordinatesParams(
        pipetteId=pipette_id,
        coordinates=coordinates,
    )

    result = cmd.MoveToCoordinatesResult(position=coordinates)

    return cmd.MoveToCoordinates(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_move_relative_command(
    pipette_id: str,
    axis: MovementAxis = MovementAxis.X,
    distance: float = 42,
    destination: DeckPoint = DeckPoint(x=0, y=0, z=0),
) -> cmd.MoveRelative:
    """Get a completed MoveToWell command."""
    params = cmd.MoveRelativeParams(pipetteId=pipette_id, axis=axis, distance=distance)

    result = cmd.MoveRelativeResult(position=destination)

    return cmd.MoveRelative(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime.now(),
        params=params,
        result=result,
    )


def create_blow_out_command(
    pipette_id: str,
    flow_rate: float,
    labware_id: str = "labware-id",
    well_name: str = "A1",
    well_location: Optional[WellLocation] = None,
    destination: DeckPoint = DeckPoint(x=0, y=0, z=0),
) -> cmd.BlowOut:
    """Get a completed BlowOut command."""
    params = cmd.BlowOutParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location or WellLocation(),
        flowRate=flow_rate,
    )
    result = cmd.BlowOutResult(position=destination)

    return cmd.BlowOut(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime(year=2022, month=1, day=1),
        params=params,
        result=result,
    )


def create_touch_tip_command(
    pipette_id: str,
    labware_id: str = "labware-id",
    well_name: str = "A1",
    well_location: Optional[WellLocation] = None,
    radius: float = 1.0,
    speed: Optional[float] = None,
    destination: DeckPoint = DeckPoint(x=0, y=0, z=0),
) -> cmd.TouchTip:
    """Get a completed BlowOut command."""
    params = cmd.TouchTipParams(
        pipetteId=pipette_id,
        labwareId=labware_id,
        wellName=well_name,
        wellLocation=well_location or WellLocation(),
        radius=radius,
        speed=speed,
    )
    result = cmd.TouchTipResult(position=destination)

    return cmd.TouchTip(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime(year=2022, month=1, day=1),
        params=params,
        result=result,
    )


def create_move_labware_command(
    new_location: LabwareLocation,
    strategy: LabwareMovementStrategy,
    labware_id: str = "labware-id",
    offset_id: Optional[str] = None,
) -> cmd.MoveLabware:
    """Get a completed MoveLabware command."""
    params = cmd.MoveLabwareParams(
        labwareId=labware_id,
        newLocation=new_location,
        strategy=strategy,
    )
    result = cmd.MoveLabwareResult(offsetId=offset_id)

    return cmd.MoveLabware(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime(year=2022, month=1, day=1),
        params=params,
        result=result,
    )


def create_prepare_to_aspirate_command(pipette_id: str) -> cmd.PrepareToAspirate:
    """Get a completed PrepareToAspirate command."""
    params = cmd.PrepareToAspirateParams(pipetteId=pipette_id)
    result = cmd.PrepareToAspirateResult()
    return cmd.PrepareToAspirate(
        id="command-id",
        key="command-key",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime(year=2023, month=10, day=24),
        params=params,
        result=result,
    )
