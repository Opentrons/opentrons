"""Instruments routes."""
from datetime import datetime
from typing import Optional, List, Dict

from fastapi import APIRouter, status, Depends, Query
from typing_extensions import Literal

from opentrons.protocol_engine.errors import HardwareNotSupportedError

from robot_server.hardware import get_hardware
from robot_server.service.json_api import (
    SimpleMultiBody,
    PydanticResponse,
    MultiBodyMeta,
    RequestModel,
    SimpleBody,
)

from opentrons.types import Mount
from opentrons.protocol_engine.types import Vec3f
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.dev_types import PipetteDict, GripperDict
from opentrons_shared_data.gripper.gripper_definition import GripperModelStr

from .instrument_models import (
    MountType,
    PipetteData,
    Pipette,
    GripperData,
    Gripper,
    AttachedInstrument,
    GripperCalibrationData,
    UpdateCreate,
    UpdateProgressData,
)
from .update_progress_monitor import UpdateProgressMonitor, UpdateIdNotFound
from ..errors import ErrorDetails, ErrorBody
from ..service.dependencies import get_unique_id, get_current_time

instruments_router = APIRouter()


async def get_update_progress_monitor(
    hardware_api: HardwareControlAPI = Depends(get_hardware),
) -> UpdateProgressMonitor:
    """Get an 'UpdateProgressMonitor' to track firmware update statuses."""
    return UpdateProgressMonitor(hardware_api=hardware_api)


class InstrumentNotFound(ErrorDetails):
    """An error if no instrument is found on the given mount."""

    id: Literal["InstrumentNotFound"] = "InstrumentNotFound"
    title: str = "Instrument Not Found"


class NoUpdateAvailable(ErrorDetails):
    """An error if no update is available for the specified mount."""

    id: Literal["NoUpdateAvailable"] = "NoUpdateAvailable"
    title: str = "No Update Available"


class UpdateInProgress(ErrorDetails):
    """An error thrown if there is already an update in progress."""

    id: Literal["UpdateInProgress"] = "UpdateInProgress"
    title: str = "An update is already in progress."


class NotSupportedOnOT2(ErrorDetails):
    """An error if one tries to update instruments on the OT2."""

    id: Literal["NotSupportedOnOT2"] = "NotSupportedOnOT2"
    title: str = "Cannot update OT2 instruments' firmware."


class InvalidUpdateId(ErrorDetails):
    """And error raised if trying to fetch a non-existent update process' status."""

    id: Literal["InvalidUpdateId"] = "InvalidUpdateId"
    title: str = "No such update ID found."


def _pipette_dict_to_pipette_res(pipette_dict: PipetteDict, mount: Mount) -> Pipette:
    """Convert PipetteDict to Pipette response model."""
    if pipette_dict:
        return Pipette.construct(
            mount=MountType.from_hw_mount(mount).as_string(),
            instrumentName=pipette_dict["name"],
            instrumentModel=pipette_dict["model"],
            serialNumber=pipette_dict["pipette_id"],
            firmwareUpdateRequired=pipette_dict["fw_update_required"],
            data=PipetteData(
                channels=pipette_dict["channels"],
                min_volume=pipette_dict["min_volume"],
                max_volume=pipette_dict["max_volume"],
            ),
        )


def _gripper_dict_to_gripper_res(gripper_dict: GripperDict) -> Gripper:
    """Convert GripperDict to Gripper response model."""
    calibration_data = gripper_dict["calibration_offset"]
    return Gripper.construct(
        mount=MountType.EXTENSION.as_string(),
        instrumentModel=GripperModelStr(str(gripper_dict["model"])),
        serialNumber=gripper_dict["gripper_id"],
        firmwareUpdateRequired=gripper_dict["fw_update_required"],
        data=GripperData(
            jawState=gripper_dict["state"].name.lower(),
            calibratedOffset=GripperCalibrationData.construct(
                offset=Vec3f(
                    x=calibration_data.offset.x,
                    y=calibration_data.offset.y,
                    z=calibration_data.offset.z,
                ),
                source=calibration_data.source,
                last_modified=calibration_data.last_modified,
            ),
        ),
    )


@instruments_router.get(
    path="/instruments",
    summary="Get attached instruments.",
    description="Get a list of all instruments (pipettes & gripper) currently attached"
    " to the robot.",
    responses={status.HTTP_200_OK: {"model": SimpleMultiBody[AttachedInstrument]}},
)
async def get_attached_instruments(
    # TODO (spp, 2023-01-06): Active scan restriction is probably not relevant for OT3.
    #  Furthermore, it might be better to have the server decide whether to do
    #  an active scan depending on whether a protocol or calibration session is active.
    refresh: Optional[bool] = Query(
        False,
        description="If true, actively scan for attached pipettes. Note:"
        " this requires  disabling the pipette motors and"
        " should only be done when no  protocol is running "
        "and you know it won't cause a problem",
    ),
    hardware: HardwareControlAPI = Depends(get_hardware),
) -> PydanticResponse[SimpleMultiBody[AttachedInstrument]]:
    """Get a list of all attached instruments."""
    pipettes: Dict[Mount, PipetteDict]
    gripper: Optional[GripperDict] = None

    if refresh is True:
        await hardware.cache_instruments()
    try:
        # TODO (spp, 2023-01-06): revise according to
        #  https://opentrons.atlassian.net/browse/RET-1295
        ot3_hardware = ensure_ot3_hardware(hardware_api=hardware)
        # OT3
        gripper = ot3_hardware.attached_gripper
        pipettes = ot3_hardware.attached_pipettes
    except HardwareNotSupportedError:
        # OT2
        pipettes = hardware.attached_instruments

    response_data: List[AttachedInstrument] = [
        _pipette_dict_to_pipette_res(pipette_dict=pipette_dict, mount=mount)
        for mount, pipette_dict in pipettes.items()
        if pipette_dict
    ]

    if gripper:
        response_data.append(_gripper_dict_to_gripper_res(gripper_dict=gripper))

    return await PydanticResponse.create(
        content=SimpleMultiBody.construct(
            data=response_data,
            meta=MultiBodyMeta(cursor=0, totalLength=len(response_data)),
        ),
        status_code=status.HTTP_200_OK,
    )


@instruments_router.post(
    path="/instruments/updates",
    summary="Initiate a firmware update on a specific instrument.",
    description="Update the firmware of the instrument attached to the specified mount"
    " if a firmware update is available for it.",
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[AttachedInstrument]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[InstrumentNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[UpdateInProgress]},
        status.HTTP_412_PRECONDITION_FAILED: {"model": ErrorBody[NoUpdateAvailable]},
    },
)
async def update_firmware(
    request_body: RequestModel[UpdateCreate],
    update_process_id: str = Depends(get_unique_id),
    created_at: datetime = Depends(get_current_time),
    hardware: HardwareControlAPI = Depends(get_hardware),
    update_progress_monitor: UpdateProgressMonitor = Depends(
        get_update_progress_monitor
    ),
) -> PydanticResponse[SimpleBody[UpdateProgressData]]:
    """Update the firmware of the OT3 instrument on the specified mount.

    Arguments:
        request_body: Optional request body with instrument to update. If not specified,
                      will start an update of all attached instruments.
        update_process_id: Generated ID to assign to the update resource.
        created_at: Timestamp to attach to created update resource.
        hardware: hardware controller instance
        update_progress_monitor: Update progress monitoring utility
    """
    try:
        ot3_hardware = ensure_ot3_hardware(hardware_api=hardware)
    except HardwareNotSupportedError as e:
        raise NotSupportedOnOT2(detail=str(e)).as_error(
            status.HTTP_403_FORBIDDEN
        ) from e

    mount_to_update = request_body.data.mount
    ot3_mount = MountType.to_ot3_mount(mount_to_update)

    await hardware.cache_instruments()
    attached_instrument = ot3_hardware.get_all_attached_instr()[ot3_mount]
    if attached_instrument is None:
        raise InstrumentNotFound(
            detail=f"No instrument found on {mount_to_update} mount."
        ).as_error(status.HTTP_404_NOT_FOUND)

    if ot3_hardware.get_firmware_update_progress().get(ot3_mount):
        raise UpdateInProgress(
            detail=f"{mount_to_update} is already either queued for update"
            f" or is currently updating"
        ).as_error(status.HTTP_409_CONFLICT)

    # The hardware controller skips the update if the instrument is already up-to-date.
    # So a wrong mount could end up confusing a client since there won't be any
    # clear indication that it's wrong.
    if not attached_instrument["fw_update_required"]:
        raise NoUpdateAvailable(
            detail=f"There is no update available for mount {mount_to_update}"
        ).as_error(status.HTTP_412_PRECONDITION_FAILED)

    await ot3_hardware.update_instrument_firmware(mount=ot3_mount)

    update_response = update_progress_monitor.create(
        update_id=update_process_id, created_at=created_at, mount=mount_to_update
    )

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=update_response),
        status_code=status.HTTP_201_CREATED,
    )


@instruments_router.get(
    path="/instruments/updates/{update_id}",
    summary="Get specified firmware update process' information.",
    description="Get firmware update status & progress of the specified update.",
    responses={
        status.HTTP_200_OK: {"model": SimpleMultiBody[UpdateProgressData]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[InvalidUpdateId]},
    },
)
async def get_firmware_update_status(
    update_id: str,
    update_progress_monitor: UpdateProgressMonitor = Depends(
        get_update_progress_monitor
    ),
) -> PydanticResponse[SimpleBody[UpdateProgressData]]:
    """Get status of instrument firmware update."""
    try:
        update_response = update_progress_monitor.get_progress_status(update_id)
    except UpdateIdNotFound as e:
        raise InvalidUpdateId(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=update_response),
        status_code=status.HTTP_200_OK,
    )
