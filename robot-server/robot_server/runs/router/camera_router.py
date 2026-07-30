"""Router for /runs endpoints dealing with run specific camera settings and behavior."""

import logging
import os
from pathlib import Path
from typing import Annotated, Union

from fastapi import Depends, HTTPException, status
from fastapi.responses import FileResponse

from opentrons.config import IS_ROBOT
from opentrons.protocol_engine import EngineStatus
from opentrons.protocol_engine.resources.camera_provider import (
    CameraProvider,
    CameraSettings,
    ImageParameters,
)
from opentrons.system import camera
from opentrons_shared_data.errors import ErrorCodes
from opentrons_shared_data.robot.types import RobotType
from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.light_router import LightRouter
from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
)

from ..dependencies import get_run_orchestrator_store
from ..run_models import Run
from ..run_orchestrator_store import RunOrchestratorStore
from .base_router import RunNotFound, RunNotIdle, RunStopped, get_run_data_from_url
from robot_server.camera.fastapi_dependencies import (
    get_camera_provider,
)
from robot_server.data_files.models import FileNotFound
from robot_server.errors.error_responses import ErrorBody, LegacyErrorResponse
from robot_server.hardware import get_robot_type
from robot_server.persistence.fastapi_dependencies import get_images_directory
from robot_server.service.legacy.models.settings import (
    CameraCaptureImageSettings,
    CameraEnable,
)
from robot_server.service.legacy.routers.camera import DEFAULT_CAMERA_ID

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
        status.HTTP_503_SERVICE_UNAVAILABLE: {},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("change run camera settings")),
    ],
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
    if not camera.camera_exists():
        raise LegacyErrorResponse(
            message="Video device is unavailable.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_503_SERVICE_UNAVAILABLE)
    if run.current is False:
        raise RunStopped(detail=f"Run {run.id} is not the current run").as_error(
            status.HTTP_409_CONFLICT
        )

    camera_settings = CameraSettings(
        cameraEnabled=(
            request_body.data.cameraEnabled
            if request_body.data.cameraEnabled is not None
            else False
        ),
        liveStreamEnabled=(
            request_body.data.liveStreamEnabled
            if request_body.data.liveStreamEnabled is not None
            else False
        ),
        errorRecoveryCameraEnabled=(
            request_body.data.errorRecoveryCameraEnabled
            if request_body.data.errorRecoveryCameraEnabled is not None
            else False
        ),
    )

    response_data = run_orchestrator_store.add_camera_enablement_settings(
        camera_settings
    )
    log.info(f'Added unique camera settings "{request_body.data}" to run "{run.id}".')

    # Restart the stream with any the newest live stream settings
    await camera.update_live_stream_status(
        robot_type=robot_type,
        stream_status=(
            response_data.liveStreamEnabled
            if response_data.cameraEnabled is True
            else False
        ),
        camera_settings=await camera_provider.get_camera_settings(),
        override_settings=camera_settings,
    )

    return await PydanticResponse.create(
        content=SimpleBody.model_construct(
            data=CameraEnable(
                cameraEnabled=response_data.cameraEnabled,
                liveStreamEnabled=response_data.liveStreamEnabled,
                errorRecoveryCameraEnabled=response_data.errorRecoveryCameraEnabled,
            )
        ),
        status_code=status.HTTP_201_CREATED,
    )


@PydanticResponse.wrap_route(
    camera_router.post,
    path="/runs/{runId}/camera/cameraSettings",
    summary="Add run specific camera capture image settings to be used in place of the system image capture defaults.",
    description=(
        "Add run-specific camera capture image settings returning the implemented settings."
        "\n\n"
        "The response body's `data` will be the image capture settings provided once set."
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[CameraCaptureImageSettings]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[Union[RunStopped, RunNotIdle]]},
        status.HTTP_503_SERVICE_UNAVAILABLE: {},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("change run camera capture settings")),
    ],
)
async def add_camera_capture_image_settings(
    request_body: RequestModel[CameraCaptureImageSettings],
    run_orchestrator_store: Annotated[
        RunOrchestratorStore, Depends(get_run_orchestrator_store)
    ],
    run: Annotated[Run, Depends(get_run_data_from_url)],
) -> PydanticResponse[SimpleBody[CameraCaptureImageSettings]]:
    """Add run specific camera capture image settings to be used in place of the global camera image capture settings.

    Args:
        request_body: New camera capture image settings from request body.
        run_orchestrator_store: Engine storage interface.
        run: Run response data by ID from URL; ensures 404 if run not found.
        robot_type: Used to validate robot type for live stream service.
        camera_provider: Access to the camera settings and related services.
    """
    if IS_ROBOT and not camera.camera_exists():
        # todo(chb): Eventually we'll have mulitple camera ids that can be sent, so this should be able to verify more than just the default
        raise LegacyErrorResponse(
            message="Video device is unavailable.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_503_SERVICE_UNAVAILABLE)
    if run.current is False:
        raise RunStopped(detail=f"Run {run.id} is not the current run").as_error(
            status.HTTP_409_CONFLICT
        )

    run_orchestrator_store.add_camera_capture_image_settings(
        capture_image_settings=request_body.data
    )
    log.info(
        f'Added unique camera capture image settings "{request_body.data}" to run "{run.id}".'
    )

    return await PydanticResponse.create(
        content=SimpleBody.model_construct(data=request_body.data),
        status_code=status.HTTP_201_CREATED,
    )


@camera_router.get(
    path="/runs/{runId}/cameraSettings/{cameraId}",
    summary="Query run specific camera capture image settings.",
    description=(
        "Query run specific camera capture image settings returning the implemented settings."
        "\n\n"
        "The response body's data will be the camera capture image settings provided once set."
    ),
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {},
    },
)
async def get_camera_capture_image_settings(
    cameraId: str,
    run_orchestrator_store: Annotated[
        RunOrchestratorStore, Depends(get_run_orchestrator_store)
    ],
) -> CameraCaptureImageSettings:
    """Query the run specific camera capture image settings.

    Args:
        cameraId: Camera ID for the camera settings to query.
        run_orchestrator_store: Engine storage interface.
        run: Run response data by ID from URL; ensures 404 if run not found.
        robot_type: Used to validate robot type for live stream service.
        camera_provider: Access to the camera settings and related services.
    """
    result = run_orchestrator_store.get_camera_capture_image_settings(
        camera_id=cameraId
    )

    # todo(chb, 2025-01-14): For now we only support one camera, the default camera. The engine only stores one cameras settings at a time.
    #  If we intend to support multiple cameras in the future we'll need to store and return a dictionary of many camera settings sets.
    if cameraId != DEFAULT_CAMERA_ID:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(
                f"No stored camera image settings for Camera ID: {cameraId}, current settings are for {DEFAULT_CAMERA_ID}."
            ),
        )

    return result


@camera_router.post(
    path="/runs/{runId}/camera/capturePreviewImage",
    summary="Capture a preview image based on provided settings and the run specific camera enablement.",
    description="Return a preview image based on provided capture image settings.",
    responses={
        status.HTTP_200_OK: {
            "content": {"image/jpeg": {}},
            "description": "Preview image taken with specific settings.",
        },
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[FileNotFound]},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("capture run preview image")),
    ],
)
async def post_camera_preview_image(
    request_body: RequestModel[CameraCaptureImageSettings],
    run: Annotated[Run, Depends(get_run_data_from_url)],
    images_directory: Annotated[Path, Depends(get_images_directory)],
    robot_type: Annotated[RobotType, Depends(get_robot_type)],
) -> FileResponse:
    """Return a preview image based on the provided capture image settings and run specific enablement."""
    if IS_ROBOT and not camera.camera_exists():
        # todo(chb): Eventually we'll have mulitple camera ids that can be sent, so this should be able to verify more than just the default
        raise LegacyErrorResponse(
            message="Video device is unavailable.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_503_SERVICE_UNAVAILABLE)

    if run.status not in [
        EngineStatus.IDLE,
        EngineStatus.STOPPED,
        EngineStatus.FAILED,
        EngineStatus.SUCCEEDED,
    ]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str("Cannot capture preview photo, run is not inactive."),
        )

    image_data = await camera.image_capture(
        robot_type=robot_type,
        parameters=ImageParameters(
            resolution=request_body.data.resolution,
            zoom=request_body.data.zoom,
            pan=request_body.data.pan,
            contrast=(
                (request_body.data.contrast / 100) * 2.0
                if request_body.data.contrast is not None
                else None
            ),
            brightness=(
                int(((request_body.data.brightness * 256) // 100) - 128) * -1
                if request_body.data.brightness is not None
                else None
            ),
            saturation=(
                (request_body.data.saturation / 100) * 2.0
                if request_body.data.saturation is not None
                else None
            ),
        ),
    )

    file_path = images_directory / camera.PREVIEW_IMAGE

    if IS_ROBOT:
        if isinstance(image_data, bytes):
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            with open(file=file_path, mode="wb") as f:
                f.write(image_data)
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(
                    f"Preview image capture failed with the following: {image_data.message}"
                ),
            )

        if not file_path.exists():
            raise FileNotFound(detail="Preview image file not found.").as_error(
                status.HTTP_404_NOT_FOUND
            )

    return FileResponse(
        path=file_path,
        media_type="image/jpeg",
        filename=camera.PREVIEW_IMAGE,
    )
