"""Router for /robot/control endpoints."""
from fastapi import APIRouter, status, Depends
from typing import TYPE_CHECKING

from robot_server.errors import ErrorBody
from robot_server.errors.robot_errors import NotSupportedOnOT2
from robot_server.service.json_api import (
    PydanticResponse,
    SimpleBody,
)
from robot_server.hardware import (
    get_ot3_hardware,
    get_thread_manager,
)
from opentrons.hardware_control import ThreadManagedHardware

from .models import (
    EstopState,
    EstopStatusModel,
    EstopPhysicalStatus,
)

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API  # noqa: F401

control_router = APIRouter()


async def _get_estop_status(
    thread_manager: ThreadManagedHardware,
) -> PydanticResponse[SimpleBody[EstopStatusModel]]:
    """Helper to generate the current Estop Status as a response model."""
    get_ot3_hardware(thread_manager)

    # TODO - unstub the response here
    data = EstopStatusModel.construct(
        status=EstopState.DISENGAGED,
        leftEstopPhysicalStatus=EstopPhysicalStatus.DISENGAGED,
        rightEstopPhysicalStatus=EstopPhysicalStatus.DISENGAGED,
    )
    return await PydanticResponse.create(content=SimpleBody.construct(data=data))


@control_router.get(
    "/robot/control/estopStatus",
    summary="Get connected estop status.",
    description="Get the current estop status of the robot, as well as a list of connected estops.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[EstopStatusModel]},
        status.HTTP_403_FORBIDDEN: {"model": ErrorBody[NotSupportedOnOT2]},
    },
)
async def get_estop_status(
    thread_manager: ThreadManagedHardware = Depends(get_thread_manager),
) -> PydanticResponse[SimpleBody[EstopStatusModel]]:
    """Return the current status of the estop."""
    return await _get_estop_status(thread_manager)


@control_router.put(
    "/robot/control/acknowledgeEstopDisengage",
    summary="Acknowledge and clear an Estop event.",
    description="If the estop is currently logically engaged (the estop was previously pressed but is "
    + "now released), this endpoint will reset the state to reflect the current physical status.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[EstopStatusModel]},
        status.HTTP_403_FORBIDDEN: {"model": ErrorBody[NotSupportedOnOT2]},
    },
)
async def put_acknowledge_estop_disengage(
    thread_manager: ThreadManagedHardware = Depends(get_thread_manager),
) -> PydanticResponse[SimpleBody[EstopStatusModel]]:
    """Transition from the `logically_engaged` status if applicable."""
    return await _get_estop_status(thread_manager)
