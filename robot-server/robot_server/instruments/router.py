"""Instruments routes."""
from typing import Optional, List, Dict

from pydantic import BaseModel, Field
from typing_extensions import Literal
from fastapi import APIRouter, status, Depends, Query

from opentrons.protocol_engine.errors import HardwareNotSupportedError
from robot_server.hardware import get_hardware
from robot_server.service.json_api import (
    SimpleMultiBody,
    SimpleBody,
    PydanticResponse,
    MultiBodyMeta, SimpleEmptyBody, RequestModel,
)
from robot_server.errors import ErrorBody, ErrorDetails

from opentrons.types import Mount
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware
from opentrons.protocol_engine.types import Vec3f

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset
)
from opentrons.hardware_control.dev_types import PipetteDict, GripperDict, O
from opentrons.hardware_control.types import OT3Mount

from .instrument_models import (
    MountType,
    PipetteData,
    Pipette,
    GripperData,
    Gripper,
    AttachedInstrument,
)

instruments_router = APIRouter()


class InstrumentNotFound(ErrorDetails):
    """An error if a given instrument is not found."""

    id: Literal["RunNotFound"] = "InstrumentNotFound"
    title: str = "Instrument Not Found"


class InstrumentTypeMismatch(ErrorDetails):
    """An error returned when sending a request to the wrong type of instrument.

    For example, if a request is meant for a gripper but is issued for a pipette.
    """

    id: Literal["InstrumentTypeMismatch"] = "InstrumentTypeMismatch"
    title: str = "Request for different instrument type."


def _pipette_dict_to_pipette_res(pipette_dict: PipetteDict, mount: Mount) -> Pipette:
    """Convert PipetteDict to Pipette response model."""
    if pipette_dict:
        return Pipette.construct(
            mount=MountType.from_hw_mount(mount).as_string(),
            instrumentName=pipette_dict["name"],
            instrumentModel=pipette_dict["model"],
            serialNumber=pipette_dict["pipette_id"],
            data=PipetteData(
                channels=pipette_dict["channels"],
                min_volume=pipette_dict["min_volume"],
                max_volume=pipette_dict["max_volume"],
            ),
        )


def _gripper_dict_to_gripper_res(gripper_dict: GripperDict) -> Gripper:
    """Convert GripperDict to Gripper response model."""
    return Gripper.construct(
        mount=MountType.EXTENSION.as_string(),
        instrumentName=gripper_dict["name"],
        instrumentModel=gripper_dict["model"],
        serialNumber=gripper_dict["gripper_id"],
        data=GripperData(
            jawState=gripper_dict["state"],
            calibratedOffset=gripper_dict["calibration_offset"],
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


class JawOffsets(BaseModel):
    """Create request data for a new run."""

    frontProbeOffset: Optional[Vec3f] = Field(
        None,
        description="Front probe offset",
    )
    rearProbeOffset: Optional[Vec3f] = Field(
        None,
        description="Rear probe offset",
    )

@instruments_router.patch(
    path="/instruments/{gripperSerial}/gripper_offset",
    summary="Save/update gripper calibration offset.",
    description="Provided the offsets found for front and rear gripper jaws using"
                " calibration probes, compute the total offset and save to disk.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[GripperCalibrationOffset]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[InstrumentNotFound]},
        status.HTTP_422_UNPROCESSABLE_ENTITY: {"model": ErrorBody[InstrumentTypeMismatch]},
    },
)
async def save_gripper_offset(
    gripperSerial: str,
    request_body: RequestModel[JawOffsets],
    hardware: HardwareControlAPI = Depends(get_hardware)
) -> PydanticResponse[SimpleEmptyBody]:
    """Save the given gripper's calibration offset to disk and load it into hardware controller."""
    ot3_hardware = ensure_ot3_hardware(hardware_api=hardware)
    # Do gripper serial validation?
    total_offset = 0.5 * (request_body.data.frontProbeOffset + request_body.data.rearProbeOffset)
    await ot3_hardware.save_instrument_offset(mount=OT3Mount.GRIPPER, delta=total_offset)
    return await PydanticResponse.create(
        content=SimpleEmptyBody.construct(),
        status_code=status.HTTP_200_OK,
    )
