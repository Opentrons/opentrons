import asyncio
import typing

from fastapi import APIRouter, Depends, Path
from starlette import status

from opentrons.hardware_control import HardwareControlAPI, modules
from opentrons_shared_data.errors.codes import ErrorCodes
from opentrons_shared_data.errors.exceptions import (
    APIRemoved,
    MissingConfigurationData,
    ModuleNotPresent,
)
from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope

from robot_server.errors.error_responses import LegacyErrorResponse
from robot_server.hardware import get_hardware
from robot_server.service.legacy.models import V1BasicResponse
from robot_server.service.legacy.models.modules import (
    SerialCommand,
    SerialCommandResponse,
)

router = APIRouter()


@router.post(
    path="/modules/{serial}",
    summary="Execute a command on a specific module",
    description=(
        "**Deprecated:** Removed with `Opentrons-Version: 3`."
        " Use `POST /commands` instead."
    ),
    response_model=SerialCommandResponse,
    responses={
        status.HTTP_410_GONE: {"model": LegacyErrorResponse},
    },
    deprecated=True,
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("execute module command")),
    ],
)
async def post_serial_command(
    command: SerialCommand,
    serial: typing.Annotated[str, Path(..., description="Serial number of the module")],
) -> SerialCommandResponse:
    """Send a command on device identified by serial"""
    raise LegacyErrorResponse.from_exc(
        APIRemoved(
            api_element="/modules/{serial}",
            since_version="3",
            extra_message="This endpoint has been removed. Use POST /commands instead.",
        ),
    ).as_error(status.HTTP_410_GONE)


@router.post(
    path="/modules/{serial}/update",
    summary="Initiate a firmware update on a specific module",
    description=(
        "Command robot to flash its bundled firmware file "
        "for this module's type to this specific module"
    ),
    response_model=V1BasicResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": LegacyErrorResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": LegacyErrorResponse},
    },
    dependencies=[
        Depends(require_scopes(Scope.UPDATES_WRITE)),
        Depends(get_audit_logger("update module firmware")),
    ],
)
async def post_serial_update(
    serial: typing.Annotated[str, Path(..., description="Serial number of the module")],
    hardware: typing.Annotated[HardwareControlAPI, Depends(get_hardware)],
) -> V1BasicResponse:
    """Update module firmware"""
    try:
        await asyncio.wait_for(hardware.update_module(serial), 100)
        return V1BasicResponse(message=f"Successfully updated module {serial}")
    except ModuleNotPresent as e:
        raise LegacyErrorResponse(
            message=f"Module with serial {serial} not found",
            errorCode=e.code.value.code,
        ).as_error(status.HTTP_404_NOT_FOUND)
    except (modules.UpdateError, MissingConfigurationData) as e:
        raise LegacyErrorResponse(
            message=f"Update error: {e}",
            errorCode=e.code.value.code,
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR)
    except asyncio.TimeoutError:
        raise LegacyErrorResponse(
            message="Module not responding",
            errorCode=ErrorCodes.FIRMWARE_UPDATE_FAILED.value.code,
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR)
