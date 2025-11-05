"""Router for /runs endpoints dealing with run specific camera settings and behavior."""

import logging
from typing import Annotated, Union

from fastapi import Depends, status
from server_utils.fastapi_utils.light_router import LightRouter

from opentrons.protocol_engine.resources.camera_provider import CameraSettings
from opentrons.system import camera

from robot_server.errors.error_responses import ErrorBody
from robot_server.service.json_api import (
    RequestModel,
    SimpleBody,
    PydanticResponse,
)
from robot_server.hardware import get_robot_type
from opentrons_shared_data.robot.types import RobotType
from robot_server.camera.fastapi_dependencies import (
    get_camera_provider,
)
from opentrons.protocol_engine.resources.camera_provider import CameraProvider

from ..run_models import Run
from ..run_orchestrator_store import RunOrchestratorStore
from ..dependencies import get_run_orchestrator_store
from .base_router import RunNotFound, RunStopped, RunNotIdle, get_run_data_from_url

from robot_server.service.legacy.models.settings import CameraEnable

log = logging.getLogger(__name__)
camera_router = LightRouter()


@PydanticResponse.wrap_route(
    camera_router.post,
    path="/runs/{runId}/camera/settings",
    summary="Add unique camera settings to a run to be used in place of the global camera settings.",
    description=(
        "Add camera settings to an existing run, returning the implemented settings."
        "\n\n"
        "The response body's `data` will be the settings provided once set."
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[CameraSettings]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[Union[RunStopped, RunNotIdle]]},
    },
)
async def add_camera_settings(
    request_body: RequestModel[CameraEnable],
    run_orchestrator_store: Annotated[
        RunOrchestratorStore, Depends(get_run_orchestrator_store)
    ],
    run: Annotated[Run, Depends(get_run_data_from_url)],
    robot_type: Annotated[RobotType, Depends(get_robot_type)],
    camera_provider: Annotated[CameraProvider, Depends(get_camera_provider)],
) -> PydanticResponse[SimpleBody[CameraEnable]]:
    """Add unique camera settings to a run to be used in place of the global camera settings.

    Args:
        request_body: New camera settings from request body.
        run_orchestrator_store: Engine storage interface.
        run: Run response data by ID from URL; ensures 404 if run not found.
        robot_type: Used to validate robot type for live stream service.
        camera_provider: Access to the camera settings and related services.
    """
    if run.current is False:
        raise RunStopped(detail=f"Run {run.id} is not the current run").as_error(
            status.HTTP_409_CONFLICT
        )

    camera_settings = CameraSettings(
        cameraEnabled=request_body.data.cameraEnabled
        if request_body.data.cameraEnabled is not None
        else False,
        liveStreamEnabled=request_body.data.liveStreamEnabled
        if request_body.data.liveStreamEnabled is not None
        else False,
        errorRecoveryEnabled=request_body.data.errorRecoveryCameraEnabled
        if request_body.data.errorRecoveryCameraEnabled is not None
        else False,
    )

    response_data = run_orchestrator_store.add_camera_enablement_settings(
        camera_settings
    )
    log.info(f'Added unique camera settings "{request_body.data}" to run "{run.id}".')

    # Restart the stream with any the newest live stream settings
    await camera.update_live_stream_status(
        robot_type=robot_type,
        stream_status=response_data.liveStreamEnabled
        if response_data.cameraEnabled is True
        else False,
        camera_provider=camera_provider,
        override_settings=camera_settings,
    )

    return await PydanticResponse.create(
        content=SimpleBody.model_construct(
            data=CameraEnable(
                cameraEnabled=response_data.cameraEnabled,
                liveStreamEnabled=response_data.liveStreamEnabled,
                errorRecoveryCameraEnabled=response_data.errorRecoveryEnabled,
            )
        ),
        status_code=status.HTTP_201_CREATED,
    )
