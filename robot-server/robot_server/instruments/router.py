"""Instruments routes."""
from typing import Optional, List, Dict, cast

from fastapi import APIRouter, status, Depends, Query
from typing_extensions import Literal

from opentrons.protocol_engine.errors import HardwareNotSupportedError

from robot_server.hardware import get_hardware
from robot_server.service.json_api import (
    SimpleMultiBody,
    PydanticResponse,
    MultiBodyMeta,
    RequestModel,
    EmptyBody,
    ResourceLink,
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
    UpdateRequestModel,
    UpdateProgressStatus,
    MountTypesStr,
    UpdateStatusLink,
)
from ..errors import ErrorDetails

instruments_router = APIRouter()


class PeripheralNotFound(ErrorDetails):
    """An error if a specified peripheral is not found."""

    id: Literal["PeripheralNotFound"] = "PeripheralNotFound"
    title: str = "Peripheral Not Found"


class UpdateInProgress(ErrorDetails):
    """An error thrown if there is already an update in progress."""

    id: Literal["UpdateInProgress"] = "UpdateInProgress"
    title: str = "An update is already in progress."


class NotSupportedOnOT2(ErrorDetails):
    """An error if one tries to update instruments on the OT2."""

    id: Literal["NotSupportedOnOT2"] = "NotSupportedOnOT2"
    title: str = "Cannot update OT2 instruments' firmware."


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


@instruments_router.put(
    path="/instruments/update",
    summary="Initiate a firmware update on a specific instrument.",
    description="Update the firmware of the instrument attached to the specified mount"
    " if a firmware update is available for it. If no instrument is"
    " specified, attempts to update all attached instruments.",
    responses={status.HTTP_200_OK: {"model": SimpleMultiBody[AttachedInstrument]}},
)
async def update_firmware(
    request_body: RequestModel[Optional[UpdateRequestModel]],
    hardware: HardwareControlAPI = Depends(get_hardware),
) -> PydanticResponse[EmptyBody[UpdateStatusLink]]:
    """Update the firmware of the OT3 instrument on the specified mount.

    Arguments:
        request_body: Optional request body with instrument to update. If not specified,
                      will start an update of all attached instruments.
        hardware: hardware controller instance
    """
    try:
        ot3_hardware = ensure_ot3_hardware(hardware_api=hardware)
    except HardwareNotSupportedError as e:
        raise NotSupportedOnOT2(detail=str(e)).as_error(
            status.HTTP_403_FORBIDDEN
        ) from e

    requested_mount = request_body.data
    mount_to_update = (
        MountType.to_ot3_mount(requested_mount.mount)
        if requested_mount is not None
        else None
    )
    await ot3_hardware.update_instrument_firmware(
        mounts={mount_to_update} if mount_to_update else None
    )

    return await PydanticResponse.create(
        content=EmptyBody.construct(
            links=UpdateStatusLink(
                updateStatus=ResourceLink.construct(href="/instruments/update/status")
            )
        )
    )


@instruments_router.get(
    path="/instruments/update/status",
    summary="Get firmware update status of all attached instruments.",
    description="Get firmware update status of all attached instruments. "
    "Shows update progress if instrument is being updated.",
    responses={status.HTTP_200_OK: {"model": SimpleMultiBody[UpdateProgressStatus]}},
)
async def get_firmware_update_status(
    hardware: HardwareControlAPI = Depends(get_hardware),
) -> PydanticResponse[SimpleMultiBody[UpdateProgressStatus]]:
    """Get status of instrument firmware update."""
    try:
        ot3_hardware = ensure_ot3_hardware(hardware_api=hardware)
    except HardwareNotSupportedError as e:
        raise NotSupportedOnOT2(detail=str(e)).as_error(
            status.HTTP_403_FORBIDDEN
        ) from e

    update_progress = ot3_hardware.get_firmware_update_progress()
    instrument_update_status: List[UpdateProgressStatus] = []
    for mount, update_status in update_progress.items():
        instrument_update_status.append(
            UpdateProgressStatus(
                mount=cast(MountTypesStr, MountType.from_ot3_mount(mount).as_string()),
                updateStatus=str(update_status.status),
                updateProgress=update_status.progress,
            )
        )

    return await PydanticResponse.create(
        content=SimpleMultiBody.construct(
            data=instrument_update_status,
            meta=MultiBodyMeta(cursor=0, totalLength=len(instrument_update_status)),
        ),
        status_code=status.HTTP_200_OK,
    )
