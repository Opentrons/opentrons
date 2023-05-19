from starlette import status
from fastapi import APIRouter, Depends
from pydantic import ValidationError

from opentrons.hardware_control.types import Axis
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.errors import HardwareNotSupportedError
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware

from robot_server.errors import LegacyErrorResponse
from robot_server.hardware import get_hardware
from robot_server.service.legacy.models import V1BasicResponse
from robot_server.service.legacy.models import motors as model

router = APIRouter()


@router.get(
    path="/motors/engaged",
    description="Query which motors are engaged and holding",
    response_model=model.EngagedMotors,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": LegacyErrorResponse},
    },
)
async def get_engaged_motors(
    hardware: HardwareControlAPI = Depends(get_hardware),
) -> model.EngagedMotors:
    try:
        engaged_axes = hardware.engaged_axes
        axes_dict = {
            str(k).lower(): model.EngagedMotor(enabled=v)
            for k, v in engaged_axes.items()
        }
        return model.EngagedMotors(**axes_dict)
    except ValidationError as e:
        raise LegacyErrorResponse(message=str(e)).as_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.post(
    "/motors/disengage",
    description="Disengage a motor or set of motors",
    response_model=V1BasicResponse,
)
async def post_disengage_motors(
    axes: model.Axes, hardware: HardwareControlAPI = Depends(get_hardware)
) -> V1BasicResponse:
    input_axes = [Axis[ax.upper()] for ax in axes.axes]
    # Do we want this endpoint to run on OT3?
    try:
        hardware = ensure_ot3_hardware(hardware)
    except HardwareNotSupportedError:
        # Filter out non-ot2 axes when running on OT2
        input_axes = [axis for axis in input_axes if axis in Axis.ot2_axes()]

    await hardware.disengage_axes(input_axes)
    return V1BasicResponse(message="Disengaged axes: {}".format(", ".join(axes.axes)))
