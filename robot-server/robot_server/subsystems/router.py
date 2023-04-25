""" The router for the /subsystems endpoints."""

from datetime import datetime
from typing import Optional, List, Dict, Union
from typing_extensions import Final

from fastapi import APIRouter, status, Depends
from typing_extensions import Literal

from opentrons.protocol_engine.errors import HardwareNotSupportedError
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import UpdateState

from robot_server.hardware import get_hardware
from robot_server.service.json_api import (
    SimpleMultiBody,
    PydanticResponse,
    MultiBodyMeta,
    RequestModel,
    SimpleBody,
)
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .firmware_update_manager import (
    FirmwareUpdateManager,
    UpdateIdNotFound as _UpdateIdNotFound,
    UpdateIdExists as _UpdateIdExists,
    UpdateFailed as _UpdateFailed,
    InstrumentNotFound as _InstrumentNotFound,
    UpdateInProgress as _UpdateInProgress,
    UpdateProcessSummary,
)

from ..errors import ErrorDetails, ErrorBody
from ..errors.robot_errors import InstrumentNotFound, NotSupportedOnOT2
from ..errors.global_errors import IDNotFound

from ..service.dependencies import get_unique_id, get_current_time
from ..service.task_runner import TaskRunner, get_task_runner


from .models import PresentSubsystem, UpdateProgressData, UpdateCreate

subsystems_router = APIRouter()

_firmware_update_manager_accessor = AppStateAccessor[FirmwareUpdateManager](
    "firmware_update_manager"
)

UPDATE_CREATE_TIMEOUT_S: Final = 5


async def get_firmware_update_manager(
    app_state: AppState = Depends(get_app_state),
    hardware_api: HardwareControlAPI = Depends(get_hardware),
    task_runner: TaskRunner = Depends(get_task_runner),
) -> FirmwareUpdateManager:
    """Get an update manager to track firmware update statuses."""
    update_manager = _firmware_update_manager_accessor.get_from(app_state)

    if update_manager is None:
        try:
            ot3_hardware = ensure_ot3_hardware(hardware_api=hardware_api)
        except HardwareNotSupportedError as e:
            raise NotSupportedOnOT2(detail=str(e)).as_error(
                status.HTTP_403_FORBIDDEN
            ) from e
        update_manager = FirmwareUpdateManager(
            task_runner=task_runner, hw_handle=ot3_hardware
        )
        _firmware_update_manager_accessor.set_on(app_state, update_manager)
    return update_manager


class NoUpdateAvailable(ErrorDetails):
    """An error if no update is available for the specified mount."""

    id: Literal["NoUpdateAvailable"] = "NoUpdateAvailable"
    title: str = "No Update Available"


class UpdateInProgress(ErrorDetails):
    """An error thrown if there is already an update in progress."""

    id: Literal["UpdateInProgress"] = "UpdateInProgress"
    title: str = "An update is already in progress."


class TimeoutStartingUpdate(ErrorDetails):
    """Error raised when the update took too long to start."""

    id: Literal["TimeoutStartingUpdate"] = "TimeoutStartingUpdate"
    title: str = "Timeout Starting Update"


class FirmwareUpdateFailed(ErrorDetails):
    """An error if a firmware update failed for some reason."""

    id: Literal["FirmwareUpdateFailed"] = "FirmwareUpdateFailed"
    title: str = "Firmware Update Failed"

async def _create_and_remove_if_error(
    manager: FirmwareUpdateManager,
    update_id: str,
    mount: OT3Mount,
    created_at: datetime,
    timeout: float,
) -> UpdateProcessSummary:
    try:
        handle = await manager.start_update_process(
            update_id,
            mount,
            created_at,
            UPDATE_CREATE_TIMEOUT_S,
        )
        return await handle.get_process_summary()
    except Exception:
        try:
            await manager.complete_update_process(update_id)
        except Exception:
            pass
        raise

@subsystems_router.get(
    "/subsystems/status",
    summary="Get attached subsystems.",
    description="Get a list of subsystems currently attached to the robot.",
    response={status.HTTP_200_OK: {"model": SimpleMultiBody[PresentSubsystem]}})
async def get_attached_subsystems(hardware: HardwareControlAPI = Depends(get_hardware)) -> PydanticResponse[SimpleMultiBody[PresentSubsystem]]:
    pass

@subsystems_router.get(
    "/subsystems/status/{subsystem}"
)
async def get_subsystem_update(hardware: HardwareControlAPI = Depends(get_hardware)) -> PydanticResponse:
    pass

@subsystems_router.get(
    "/subsystems/updates/current",
    summary="Get a list of currently-ongoing updates by subsystem.",
    description="Get a list of currently-running subsystem firmware updates. This is a good snapshot of what, if anything, is currently being updated and may block other robot work. To guarantee data about an update you were previously interested in, get its id using /subsystems/updates/all.",
    response={status.HTTP_200_OK: {"model": SimpleMultiBody[UpdateProgressData]}}
)
async def get_subsystem_updates(hardware: HardwareControlAPI = Depends(get_hardware)) -> PydanticResponse[SimpleMultiBody[UpdateProgressData]]:
    pass

@subsystems_router.get(
    "/subsystems/updates/current/{subsystem}",
    summary="Get any currently-ongoing update for a specific subsystem.",
    description="As /subsystems/updates/current but filtered by the route parameter."
)
async def get_subsystem_update(
        subsystem: str,
        hardware: HardwareControlAPI = Depends(get_hardware),
) -> PydanticResponse[SimpleBody[UpdateProgressData]]:
    pass

@subsystems_router.get(
    "/subsystems/updates/all",
    summary="Get a list of all updates by id.",
    description="Get a list of all updates, including both current and concluded ones, by their update id. This is a list of all previous updates since the machine booted, including their final status and whether they succeeded or failed. While an update might complete while you're not polling and therefore disappear from /subsystems/updates/running, you can always pull a previous update by id from here.",
    response={status.HTTP_200_OK: {"model": SimpleMultiBody[UpdateProgressData]}}
)
async def get_update_processes(hardware: HardwareControlAPI = Depends(get_hardware)) -> PydanticResponse[SimpleMultiBody[UpdateProgressData]]:
    pass

@subsystems_router.get(
    "/subsystems/updates/all/{id}",
    summary="Get the details of a specific update id.",
    description="As /subsystems/updates/all but filtered by the route parameter.",
    response={status.HTTP_200_OK: {"model": SimpleBody[UpdateProgressData]}}
)
async def get_update_process(id: str, hardware: HardwareControlAPI = Depends(get_hardware)) -> PydanticResponse[SimpleBody[UpdateProgress]]:
    pass

@subsystems_router.post(
    "/subsystems/updates",
    summary="Start an update for a subsystem.",
    description="Begin a firmware update for some subsystems.",
    response={status.HTTP_201_CREATED: {"model": SimpleBody[UpdateProgressData]},
              status.HTTP_303_SEE_OTHER: {"model": ""},
              status.HTTP_404_NOT_FOUND: {"model": ErrorBody[SubsystemNotFound]},
              status.HTTP_412_PRECONDITION_FAILED: {"model": ErrorBody[NoUpdateAvailable]},
              status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ErrorBody[FirmwareUpdateFailed]},

              },
)
async def begin_subsystem_update(hardware: HardwareControlAPI = Depends(get_hardware)) -> PydanticResponse:
    """Update the firmware of the OT3 instrument on the specified mount.

    Arguments:
        request_body: Optional request body with instrument to update. If not specified,
                      will start an update of all attached instruments.
        update_process_id: Generated ID to assign to the update resource.
        created_at: Timestamp to attach to created update resource.
        hardware: hardware controller instance.
        firmware_update_manager: Injected manager for firmware updates.
    """
    mount_to_update = request_body.data.mount
    ot3_mount = MountType.to_ot3_mount(mount_to_update)
    await hardware.cache_instruments()

    try:
        summary = await _create_and_remove_if_error(
            firmware_update_manager,
            update_process_id,
            ot3_mount,
            created_at,
            UPDATE_CREATE_TIMEOUT_S,
        )
    except _InstrumentNotFound:
        raise InstrumentNotFound(
            detail=f"No instrument found on {mount_to_update} mount."
        ).as_error(status.HTTP_404_NOT_FOUND)
    except _UpdateInProgress:
        raise UpdateInProgress(
            detail=f"{mount_to_update} is already either queued for update"
            f" or is currently updating"
        ).as_error(status.HTTP_409_CONFLICT)
    except _UpdateFailed as e:
        raise FirmwareUpdateFailed(detail=str(e)).as_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except TimeoutError as e:
        raise TimeoutStartingUpdate(detail=str(e)).as_error(
            status.HTTP_408_REQUEST_TIMEOUT
        )
    except _UpdateIdExists:
        raise UpdateInProgress(
            detail="An update is already ongoing with this ID."
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR)

    return await PydanticResponse.create(
        content=SimpleBody.construct(
            data=UpdateProgressData(
                id=summary.details.update_id,
                createdAt=summary.details.created_at,
                mount=MountType.from_ot3_mount(
                    summary.details.mount
                ).value_as_literal(),
                updateStatus=summary.progress.state,
                updateProgress=summary.progress.progress,
            )
        ),
        status_code=status.HTTP_201_CREATED,
    )

@subsystems_router.get(
    "/subsystems/updates/{subsystem}",
    summary="Get progress of an ongoing subsystem update.",
    description="Get the state and progress of a subsystem update that is currently running.",
    response={status.HTTP_200_OK: {"model": SimpleBody[UpdateProgressData]},
              status.HTTP_404_NOT_FOUND: {"model": ErrorBody[SubsystemNotFound]},
              },

)
async def get_subsystem_update(hardware: HardwareControlAPI = Depends(get_hardware)) -> PydanticResponse[SimpleBody[UpdateProgressData]]:
    """Get status of instrument firmware update.

    update_id: the ID to get the status of
    firmware_update_manager: The firmware update manage rcontrolling the update processes.
    """
    try:
        handle = firmware_update_manager.get_update_process_handle(update_id)
        summary = await handle.get_process_summary()
    except _UpdateIdNotFound as e:
        raise IDNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)
    except _UpdateFailed as e:
        raise FirmwareUpdateFailed(detail=str(e)).as_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    if summary.progress.state == UpdateState.done:
        try:
            await firmware_update_manager.complete_update_process(update_id)
        except _UpdateIdNotFound:
            # this access could theoretically race, and that's fine if we already got
            # here.
            pass

    return await PydanticResponse.create(
        content=SimpleBody.construct(
            data=UpdateProgressData(
                id=summary.details.update_id,
                createdAt=summary.details.created_at,
                mount=MountType.from_ot3_mount(
                    summary.details.mount
                ).value_as_literal(),
                updateStatus=summary.progress.state,
                updateProgress=summary.progress.progress,
            )
        ),
        status_code=status.HTTP_200_OK,
    )

@subsystems_router.post(
    "/subsystems/updates/{subsystem}/complete",
    summary="Acknowledge that an update is complete.",
    description="Acknowledge that a subsystem update is complete, allowing the resource to be freed.",
    response={status.HTTP_200_OK: {"model": SimpleBody[Something]},
              status.HTTP_404_NOT_FOUND: {"model": ErrorBody[SubsystemNotFound]}
              }
)
async def acknowledge_update_complete(hardware: HardwareControlAPI = Depends(get_hardware)) -> PydanticResponse[SimpleBody[UpdateProgressData]]:
    pass
