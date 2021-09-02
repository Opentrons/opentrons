from starlette import status
from fastapi import APIRouter, Depends
from pydantic import ValidationError

from opentrons.hardware_control import ThreadManager
from opentrons.hardware_control.types import Axis

from robot_server.errors import LegacyErrorResponse
from robot_server.service.dependencies import get_hardware
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
    hardware: ThreadManager = Depends(get_hardware),
) -> model.EngagedMotors:  # type: ignore
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
    axes: model.Axes, hardware: ThreadManager = Depends(get_hardware)
) -> V1BasicResponse:

    input_axes = [Axis[ax.upper()] for ax in axes.axes]
    await hardware.disengage_axes(input_axes)
    return V1BasicResponse(message="Disengaged axes: {}".format(", ".join(axes.axes)))
