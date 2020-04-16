from starlette import status
from fastapi import APIRouter, Depends
from pydantic import ValidationError

from opentrons.hardware_control import HardwareAPILike
from opentrons.hardware_control.types import Axis

from robot_server.service.dependencies import get_hardware
from robot_server.service.errors import V1HandlerError
from robot_server.service.models import motors as model, V1BasicResponse


router = APIRouter()


@router.get("/motors/engaged",
            description="Query which motors are engaged and holding",
            response_model=model.EngagedMotors)
async def get_engaged_motors(hardware: HardwareAPILike = Depends(get_hardware)
                             ) -> model.EngagedMotors:  # type: ignore
    try:
        engaged_axes = hardware.engaged_axes    # type: ignore
        axes_dict = {str(k).lower(): model.EngagedMotor(enabled=v)
                     for k, v in engaged_axes.items()}
        return model.EngagedMotors(**axes_dict)
    except ValidationError as e:
        raise V1HandlerError(
            status.HTTP_500_INTERNAL_SERVER_ERROR, str(e)
        )


@router.post("/motors/disengage",
             description="Disengage a motor or set of motors",
             response_model=V1BasicResponse)
async def post_disengage_motors(
        axes: model.Axes,
        hardware: HardwareAPILike = Depends(get_hardware)) \
        -> V1BasicResponse:

    input_axes = [Axis[ax.upper()] for ax in axes.axes]
    await hardware.disengage_axes(input_axes)    # type: ignore
    return V1BasicResponse(
        message="Disengaged axes: {}".format(', '.join(axes.axes))
    )
