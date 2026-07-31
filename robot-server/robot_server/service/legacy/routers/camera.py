import io
import logging
import os
import tempfile
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from starlette import status
from starlette.background import BackgroundTask
from starlette.responses import StreamingResponse

from opentrons.config import IS_ROBOT
from opentrons.protocol_engine import EngineStatus
from opentrons.protocol_engine.resources.camera_provider import ImageParameters
from opentrons.system import camera
from opentrons.system.camera import PREVIEW_IMAGE, StreamConfigurationKeys
from opentrons_shared_data.errors import ErrorCodes
from opentrons_shared_data.robot.types import RobotType
from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.camera.settings.store import (
    CameraSettingStore,
    get_camera_setting_store,
)
from robot_server.data_files.models import FileNotFound
from robot_server.errors.error_responses import ErrorBody, LegacyErrorResponse
from robot_server.hardware import get_robot_type
from robot_server.persistence.fastapi_dependencies import get_images_directory
from robot_server.runs.dependencies import get_run_data_manager
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.service.legacy.models.settings import (
    CameraCaptureImageSettings,
    CameraEnable,
    LiveStreamData,
    LiveStreamSettings,
    Resolution,
    StreamStatusType,
)

log = logging.getLogger(__name__)

router = APIRouter()

JPG = "image/jpg"

# todo(chb, 2025-09-19): This temporary for an initial implementation while we determine if some units will ship without cameras
DEFAULT_CAMERA_ID = "ot_system_camera"
DEFAULT_CAMERA_PATH = f"/dev/{DEFAULT_CAMERA_ID}"


@router.post(
    "/camera",
    description="Set the camera enablement statuses for general camera, live stream and error recovery camera use.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("change camera enable")),
    ],
)
async def post_camera(
    request_body: RequestModel[CameraEnable],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    camera_settings_store: Annotated[
        CameraSettingStore, Depends(get_camera_setting_store)
    ],
    robot_type: Annotated[RobotType, Depends(get_robot_type)],
) -> CameraEnable:
    """
    Sets the Opentrons Camera enablement statuses.

    - Disabling the general camera enablement will disable all camera functionality, including the live stream.
    - Disabling the live stream will exclusively disable streaming.
    - Disabling the error recovery camera interaction will exclusively disable error based camera activity.

    Returns the enable/disable statuses of the camera.
    """
    _validate_camera_present()

    if request_body.data.cameraEnabled is not None:
        camera_settings_store.set_camera_enable(request_body.data.cameraEnabled)
    if request_body.data.liveStreamEnabled is not None:
        camera_settings_store.set_live_stream_enable(
            request_body.data.liveStreamEnabled
        )
    if request_body.data.errorRecoveryCameraEnabled:
        camera_settings_store.set_error_recovery_camera_enable(
            request_body.data.errorRecoveryCameraEnabled
        )

    camera_enabled = camera_settings_store.get_camera_enabled()
    live_stream_enabled = camera_settings_store.get_live_stream_enabled()
    error_recovery_camera_enabled = (
        camera_settings_store.get_error_recovery_camera_enabled()
    )

    if camera.robot_supports_livestream(robot_type):
        stream_settings = _get_stream_settings()
        if (
            camera_enabled
            and live_stream_enabled
            and (
                run_data_manager.current_run_id is not None
                and (
                    True
                    if run_data_manager.get(run_data_manager.current_run_id).status
                    not in [
                        EngineStatus.IDLE,
                        EngineStatus.STOPPED,
                        EngineStatus.FAILED,
                        EngineStatus.SUCCEEDED,
                    ]
                    else False
                )
            )
        ):
            stream_status = StreamStatusType.ON
        else:
            stream_status = StreamStatusType.OFF

        _live_stream_settings_to_configuration_file(stream_settings, stream_status)
        await camera.restart_live_stream(robot_type)

    return CameraEnable(
        cameraEnabled=camera_enabled,
        liveStreamEnabled=live_stream_enabled,
        errorRecoveryCameraEnabled=error_recovery_camera_enabled,
    )


@router.get(
    "/camera",
    description="Request the Camera enablement status.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
)
async def get_camera(
    camera_settings_store: Annotated[
        CameraSettingStore, Depends(get_camera_setting_store)
    ],
) -> CameraEnable:
    """
    Request the Opentrons Camera enablement status.
    """
    _validate_camera_present()

    camera_status = camera_settings_store.get_camera_enabled()
    live_status = camera_settings_store.get_live_stream_enabled()
    error_recovery_camera_status = (
        camera_settings_store.get_error_recovery_camera_enabled()
    )
    return CameraEnable(
        cameraEnabled=camera_status,
        liveStreamEnabled=live_status,
        errorRecoveryCameraEnabled=error_recovery_camera_status,
    )


@router.get(
    path="/camera/cameraSettings/{cameraId}",
    summary="Query general camera capture image settings.",
    description=(
        "Query general camera capture image settings returning the implemented settings."
        "\n\n"
        "The response body's data will be the camera capture image settings provided once set."
    ),
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {},
    },
)
async def get_camera_capture_image_settings(
    cameraId: str,
    camera_settings_store: Annotated[
        CameraSettingStore, Depends(get_camera_setting_store)
    ],
) -> CameraCaptureImageSettings:
    """Query the general camera capture image settings.

    Args:
        cameraId: Camera ID for the camera settings to query.
        camera_provider: Access to the camera settings and related services.
    """
    result = camera_settings_store.get_camera_capture_image_settings(
        camera_id=cameraId if DEFAULT_CAMERA_ID not in cameraId else DEFAULT_CAMERA_PATH
    )
    # todo(chb, 2025-01-14): At some point we need to dereference camera devices and camera ids, and dedicate entirely one way or another.
    # This isn't done now because of how the device field is pulled as a default camera by other sources for ffmpeg.

    return result


@router.post(
    path="/camera/cameraSettings",
    summary="Add general camera capture image settings to be used in place of the system image capture defaults.",
    description=(
        "Add general camera capture image settings returning the implemented settings."
        "\n\n"
        "The response body's `data` will be the image capture settings provided once set."
    ),
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("change camera settings")),
    ],
)
async def add_camera_capture_image_settings(
    request_body: RequestModel[CameraCaptureImageSettings],
    camera_settings_store: Annotated[
        CameraSettingStore, Depends(get_camera_setting_store)
    ],
) -> CameraCaptureImageSettings:
    """Add general camera capture image settings to be used in place of the global camera image capture settings.

    Args:
        request_body: New camera capture image settings from request body.
        camera_provider: Access to the camera settings and related services.
    """
    if IS_ROBOT and not camera.camera_exists():
        # todo(chb): Eventually we'll have mulitple camera ids that can be sent, so this should be able to verify more than just the default
        raise LegacyErrorResponse(
            message="Video device is unavailable.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_503_SERVICE_UNAVAILABLE)

    camera_settings_store.set_camera_capture_image_settings(settings=request_body.data)

    # Get the newly set database settings
    result = camera_settings_store.get_camera_capture_image_settings()

    return result


@router.post(
    "/camera/capturePreviewImage",
    description="Return a preview image based on provided capture image settings.",
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[FileNotFound]},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("capture preview image")),
    ],
)
async def post_camera_preview_image(
    request_body: RequestModel[CameraCaptureImageSettings],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    camera_settings_store: Annotated[
        CameraSettingStore, Depends(get_camera_setting_store)
    ],
    images_directory: Annotated[Path, Depends(get_images_directory)],
    robot_type: Annotated[RobotType, Depends(get_robot_type)],
) -> Response:
    """
    Return a preview image based on the provided capture image settings.
    """
    if run_data_manager.current_run_id is not None and (
        run_data_manager.get(run_data_manager.current_run_id).status
        not in [EngineStatus.STOPPED, EngineStatus.FAILED, EngineStatus.SUCCEEDED]
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str("Cannot capture preview photo, run is active."),
        )

    _validate_camera_present()

    if not camera_settings_store.get_camera_enabled():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str("Cannot capture preview photo, camera is disabled on robot."),
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

    file_path = images_directory / PREVIEW_IMAGE

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
        filename=PREVIEW_IMAGE,
    )


@router.post(
    "/camera/picture",
    description="Capture an image from the OT-2's on-board camera and return it",
    responses={status.HTTP_200_OK: {"content": {JPG: {}}, "description": "The image"}},
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("capture image")),
    ],
)
async def post_picture_capture(
    camera_settings_store: Annotated[
        CameraSettingStore, Depends(get_camera_setting_store)
    ],
) -> StreamingResponse:
    """Take a picture"""
    filename = Path(tempfile.mktemp(suffix=".jpg"))

    camera_enabled = camera_settings_store.get_camera_enabled()
    if camera_enabled:
        try:
            await camera.take_picture(filename)
            log.info(f"Image taken at {filename}")
            # Open the file. It will be closed and deleted when the response is
            # finished.
            fd = filename.open("rb")
            return StreamingResponse(
                fd,
                media_type=JPG,
                background=BackgroundTask(func=_cleanup, filename=filename, fd=fd),
            )
        except camera.CameraException as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str("Cannot take photo, camera is disabled."),
        )


def _cleanup(filename: Path, fd: io.IOBase) -> None:
    """Clean up after sending the response"""
    try:
        log.info(f"Closing and deleting image at {filename}")
        fd.close()
        os.remove(filename)
    except OSError:
        pass


@router.get(
    "/camera/stream",
    description="Request the Opentrons Live Stream enablement status and stream URLs.",
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": LegacyErrorResponse},
    },
)
async def get_live_stream(
    camera_settings_store: Annotated[
        CameraSettingStore, Depends(get_camera_setting_store)
    ],
) -> LiveStreamData:
    """
    Request the Opentrons Live Stream enablement status and stream URLs.

    Returns both the HLS and RTMP relative URLs for this device's live streams.

    HLS:
        The full HLS stream URL is formatted as: http://{ROBOT_IP}:{PORT}/hls/stream.m3u
    RTMP:
        The full RTMP stream URL is formatted as: rtmp://{ROBOT_IP}/live/stream
    """
    _validate_camera_present()
    enable_status = camera_settings_store.get_live_stream_enabled()
    return LiveStreamData(
        enabled=enable_status,
        hls="/hls/stream.m3u",
        rtmp="/live/stream",
    )


@router.post(
    "/camera/stream/settings",
    description="Configure the settings for the Flex Live Stream service.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("change camera stream settings")),
    ],
)
async def post_live_stream_settings(
    request_body: RequestModel[LiveStreamSettings],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    camera_settings_store: Annotated[
        CameraSettingStore, Depends(get_camera_setting_store)
    ],
    robot_type: Annotated[RobotType, Depends(get_robot_type)],
) -> LiveStreamSettings:
    """
    Configure the Live Stream and restart it.

    The request body contains the parameters for the live stream.

    Arguments:
        request_body: Input payload from the request body.
    """
    _validate_camera_present()
    if camera.robot_supports_livestream(robot_type) is False:
        raise LegacyErrorResponse(
            message="Opentrons Live Stream service is not available on OT-2.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_400_BAD_REQUEST)

    formatted_source = request_body.data.source
    # Source device names must be enclosed in quotations for FFMPEG to identify the device
    if formatted_source[0] != '"':
        formatted_source = '"' + formatted_source
    if formatted_source[-1] != '"':
        formatted_source = formatted_source + '"'

    raw_device = str(formatted_source)[1:-1]

    if (
        formatted_source is not None
        and "NONE" not in formatted_source
        and not os.path.exists(raw_device)
    ):
        raise LegacyErrorResponse(
            message=f"No video device found with device path: {raw_device}",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_400_BAD_REQUEST)

    camera_enabled = camera_settings_store.get_camera_enabled()
    live_stream_enabled = camera_settings_store.get_live_stream_enabled()

    if (
        camera_enabled
        and live_stream_enabled
        and (
            run_data_manager.current_run_id is not None
            and (
                True
                if run_data_manager.get(run_data_manager.current_run_id).status
                not in [
                    EngineStatus.IDLE,
                    EngineStatus.STOPPED,
                    EngineStatus.FAILED,
                    EngineStatus.SUCCEEDED,
                ]
                else False
            )
        )
    ):
        stream_status = StreamStatusType.ON
    else:
        stream_status = StreamStatusType.OFF

    # todo(chb, 2025-09-22): To validate framerates, resolutions and bitrates create a common resource resolutions table for front/back end to reference
    updated_settings = LiveStreamSettings(
        source=formatted_source,
        resolution=Resolution(
            width=request_body.data.resolution.width,
            height=request_body.data.resolution.height,
        ),
        framerate=request_body.data.framerate,
        bitrate_k=request_body.data.bitrate_k,
    )

    log.info(
        f"Updated Opentrons-Live-Stream settings: Status={stream_status}, Source={updated_settings.source}, Resolution={updated_settings.resolution}, Framerate={updated_settings.framerate}, Bitrate={updated_settings.bitrate_k}"
    )

    # write changes to the configuration file
    _live_stream_settings_to_configuration_file(updated_settings, stream_status)

    await camera.restart_live_stream(robot_type)

    return updated_settings


@router.get(
    "/camera/stream/settings",
    description="Request the settings for the Opentrons Live Stream service.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
)
async def get_live_stream_settings(
    robot_type: Annotated[RobotType, Depends(get_robot_type)],
) -> LiveStreamSettings:
    """
    Request the Opentrons Live Stream settings.
    """
    if camera.robot_supports_livestream(robot_type) is False:
        raise LegacyErrorResponse(
            message="Opentrons Live Stream service is not available on OT-2.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_400_BAD_REQUEST)
    return _get_stream_settings()


def _get_stream_settings() -> LiveStreamSettings:
    _validate_camera_present()
    contents = camera.load_stream_configuration_file_data()
    if contents is None:
        raise LegacyErrorResponse(
            message="Stream Configuration file data is incorrect or missing.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Validate file contents to ensure proper formatting
    # For now we do not validate the camera source, as the camera may no longer exist
    try:
        # Validate the status typing
        StreamStatusType(contents["STATUS"])
    except KeyError:
        raise LegacyErrorResponse(
            message="Stream Configuration file Status setting is not an acceptable status type.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR)

    res_raw = contents["RESOLUTION"].split("x")
    if not res_raw[0].isdigit() or not res_raw[1].isdigit():
        raise LegacyErrorResponse(
            message="Stream Configuration file Resolution setting is not in an acceptable format.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR)
    resolution_data = Resolution(width=int(res_raw[0]), height=int(res_raw[1]))

    if not contents["FRAMERATE"].isdigit():
        raise LegacyErrorResponse(
            message="Stream Configuration file Framerate setting is not a number.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR)

    if (
        "K" not in contents["BITRATE"]
        or not contents["BITRATE"].split("K")[0].isdigit()
    ):
        raise LegacyErrorResponse(
            message="Stream Configuration file Bitrate setting is not in an acceptable format.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR)

    return LiveStreamSettings(
        source=contents["SOURCE"],
        resolution=resolution_data,
        framerate=int(contents["FRAMERATE"]),
        bitrate_k=int(contents["BITRATE"].split("K")[0]),
    )


def _live_stream_settings_to_configuration_file(
    settings: LiveStreamSettings, stream_status: StreamStatusType
) -> None:
    contents: dict[str, str] = {
        StreamConfigurationKeys.BOOT_ID: camera.get_boot_id(),
        StreamConfigurationKeys.STATUS: stream_status,
        StreamConfigurationKeys.SOURCE: settings.source,
        StreamConfigurationKeys.RESOLUTION: f"{settings.resolution.width}x{settings.resolution.height}",
        StreamConfigurationKeys.FRAMERATE: str(settings.framerate),
        StreamConfigurationKeys.BITRATE: f"{settings.bitrate_k}K",
    }
    camera.write_stream_configuration_file_data(contents)


def _validate_camera_present() -> None:
    if IS_ROBOT and not camera.camera_exists():
        # todo(chb, 2025-09-19): for the time being we will just be checking that the embedded flex camera exists to satisfy requirements
        # incase the camera isn't present, however eventually we can change this to support dynamically set third party cameras
        raise LegacyErrorResponse(
            message=f"No video device found with device path: {DEFAULT_CAMERA_PATH}",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_503_SERVICE_UNAVAILABLE)
