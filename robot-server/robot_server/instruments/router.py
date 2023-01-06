"""Instruments routes."""
from typing import Optional, List, Dict

from fastapi import APIRouter, status, Depends, Query
from opentrons.protocol_engine.errors import HardwareNotSupportedError

from robot_server.hardware import get_hardware
from robot_server.service.json_api import (
    SimpleMultiBody,
    PydanticResponse,
    MultiBodyMeta,
)

from opentrons.types import Mount
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.dev_types import PipetteDict, GripperDict

from .instrument_models import (
    MountType,
    PipetteData,
    Pipette,
    GripperData,
    Gripper,
    AttachedInstrument,
)

instruments_router = APIRouter()


def _pipette_dict_to_pipette_res(pipette_dict: PipetteDict, mount: MountType) -> Pipette:
    """Convert PipetteDict to local Pipette class."""
    return Pipette(
        mount=mount,
        instrumentName=pipette_dict["name"],
        instrumentModel=pipette_dict["model"],
        instrumentSerial=pipette_dict["pipette_id"],
        data=PipetteData(
            channels=pipette_dict["channels"],
            min_volume=pipette_dict["min_volume"],
            max_volume=pipette_dict["max_volume"],
        ),
    )


def _gripper_dict_to_gripper_res(gripper_dict: GripperDict) -> Gripper:
    """Convert GripperDict to local Gripper class."""
    return Gripper(
                mount=MountType.EXTENSION,
                instrumentName=gripper_dict["name"],
                instrumentModel=gripper_dict["model"],
                instrumentSerial=gripper_dict["gripper_id"],
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
    refresh: Optional[bool] = Query(
        False,
        description="If true, actively scan for attached pipettes. Note:"
        " this requires  disabling the pipette motors and"
        " should only be done when no  protocol is running "
        "and you know  it won't cause a problem",
    ),
    hardware: HardwareControlAPI = Depends(get_hardware),
) -> PydanticResponse[SimpleMultiBody[AttachedInstrument]]:
    """Get a list of all attached instruments."""
    response_data: List[AttachedInstrument] = []
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

    left_pip = pipettes.get(Mount.LEFT)
    right_pip = pipettes.get(Mount.RIGHT)

    if gripper:
        response_data.append(
            _gripper_dict_to_gripper_res(gripper_dict=gripper)
        )
    if left_pip:
        response_data.append(
            _pipette_dict_to_pipette_res(pipette_dict=left_pip, mount=MountType.LEFT)
        )
    if right_pip:
        response_data.append(
            _pipette_dict_to_pipette_res(pipette_dict=right_pip, mount=MountType.RIGHT)
        )

    return await PydanticResponse.create(
        content=SimpleMultiBody.construct(
            data=response_data,
            meta=MultiBodyMeta(cursor=0, totalLength=len(response_data)),
        ),
        status_code=status.HTTP_200_OK,
    )
