"""Dependencies related to /robot/control endpoints."""

from typing import Annotated

from fastapi import Depends, status

from opentrons.hardware_control import HardwareControlAPI, ThreadManagedHardware

from .estop_handler import EstopHandler
from .models import (
    EstopState,
)
from robot_server.errors.error_responses import ApiError
from robot_server.errors.robot_errors import (
    EstopEngaged,
    EstopNotAcknowledged,
    EstopNotAttached,
)
from robot_server.hardware import get_hardware_resource, get_ot3_hardware


async def require_estop_in_good_state(
    hardware_resource: Annotated[
        ThreadManagedHardware | HardwareControlAPI, Depends(get_hardware_resource)
    ],
) -> bool:
    """Check that the estop is in a good state.

    This requires that an estop is attached and disengaged. An exception will
    be raised if any of the following is true:
      - No estop is connected
      - An estop is engaged
      - An estop was engaged and released, but has not been acknowledged yet.

    If the robot does not support Estop, this dependency will never fail.

    Returns True if the Estop state is okay. Raises an exception in any other case.
    """
    try:
        estop_handler = EstopHandler(hw_handle=get_ot3_hardware(hardware_resource))
    except ApiError:
        # This is an OT-2 and there's no estop, so don't block out the endpoint
        return True
    else:
        estop_status = await estop_handler.get_status()
        state = estop_status.status
        if state is EstopState.NOT_PRESENT:
            raise EstopNotAttached(
                detail="An estop must be attached to access this endpoint"
            ).as_error(status.HTTP_403_FORBIDDEN)
        if state is EstopState.PHYSICALLY_ENGAGED:
            raise EstopEngaged(
                detail="Endpoint access is not permitted while estop is engaged"
            ).as_error(status.HTTP_403_FORBIDDEN)
        if state is EstopState.LOGICALLY_ENGAGED:
            raise EstopNotAcknowledged(
                detail="Must acknowledge estop event to access this endpoint"
            ).as_error(status.HTTP_403_FORBIDDEN)
        return True
