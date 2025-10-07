import logging
import os
import io
import tempfile
from functools import lru_cache
from typing import Annotated
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from starlette import status
from starlette.background import BackgroundTask
from starlette.responses import StreamingResponse
from opentrons.system import camera
from opentrons.system.camera import StreamConfigurationKeys
from robot_server.errors.error_responses import LegacyErrorResponse
from opentrons_shared_data.errors import ErrorCodes
from robot_server.service.legacy.models.settings import (
    CameraEnable,
    LiveStreamData,
    LiveStreamSettings,
    Resolution,
    StreamStatusType,
)
from robot_server.service.json_api import RequestModel
from opentrons.config import IS_ROBOT
from robot_server.runs.dependencies import get_run_data_manager
from robot_server.runs.run_data_manager import RunDataManager
from opentrons.protocol_engine import EngineStatus
from robot_server.camera.settings.store import (
    CameraSettingStore,
    get_camera_setting_store,
)


log = logging.getLogger(__name__)

router = APIRouter()

JPG = "image/jpg"

# todo(chb, 2025-09-19): This temporary for an initial implementation while we determine if some units will ship without cameras
DEFAULT_CAMERA = "/dev/ot_system_camera"


@router.post(
    "/camera",
    description="Set the camera enablement statuses for general camera, live stream and error recovery camera use.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
)
async def post_camera(
    request_body: RequestModel[CameraEnable],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    camera_settings_store: Annotated[
        CameraSettingStore, Depends(get_camera_setting_store)
    ],
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
    await camera.restart_live_stream()

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


# todo(chb, 2025-09-08): Implement POST/GET /camera/picture/settings for picture taking settings when in protocol run


@router.post(
    "/camera/picture",
    description="Capture an image from the OT-2's on-board camera " "and return it",
    responses={status.HTTP_200_OK: {"content": {JPG: {}}, "description": "The image"}},
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
)
async def post_live_stream_settings(
    request_body: RequestModel[LiveStreamSettings],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    camera_settings_store: Annotated[
        CameraSettingStore, Depends(get_camera_setting_store)
    ],
) -> LiveStreamSettings:
    """
    Configure the Live Stream and restart it.

    The request body contains the parameters for the live stream.

    Arguments:
        request_body: Input payload from the request body.
    """
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

    await camera.restart_live_stream()

    return updated_settings


@router.get(
    "/camera/stream/settings",
    description="Request the settings for the Opentrons Live Stream service.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
)
async def get_live_stream_settings() -> LiveStreamSettings:
    """
    Request the Live Stream settings.
    """
    return _get_stream_settings()


def _get_stream_settings() -> LiveStreamSettings:
    src = camera.get_stream_configuration_filepath()
    if not src.exists():
        # todo(chb, 2025-09-03): Need to introduce a CAMERA_ERROR code for missing stream configuration file, maybe just general?
        raise LegacyErrorResponse(
            message=f"Stream Configuration file not found: {src}",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR)

    return _parse_stream_settings(src)


def _parse_stream_settings(filename: Path) -> LiveStreamSettings:
    contents = camera.parse_stream_configuration_file_data()
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
        StreamConfigurationKeys.BOOT_ID: _get_boot_id(),
        StreamConfigurationKeys.STATUS: stream_status,
        StreamConfigurationKeys.SOURCE: settings.source,
        StreamConfigurationKeys.RESOLUTION: f"{settings.resolution.width}x{settings.resolution.height}",
        StreamConfigurationKeys.FRAMERATE: str(settings.framerate),
        StreamConfigurationKeys.BITRATE: f"{settings.bitrate_k}K",
    }
    camera.write_stream_configuration_file_data(contents)


def _validate_camera_present() -> None:
    if IS_ROBOT and not os.path.exists(DEFAULT_CAMERA):
        # todo(chb, 2025-09-19): for the time being we will just be checking that the embedded flex camera exists to satisfy requirements
        # incase the camera isn't present, however eventually we can change this to support dynamically set third party cameras
        raise LegacyErrorResponse(
            message=f"No video device found with device path: {DEFAULT_CAMERA}",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_503_SERVICE_UNAVAILABLE)


@lru_cache(maxsize=1)
def _get_boot_id() -> str:
    if IS_ROBOT:
        return Path("/proc/sys/kernel/random/boot_id").read_text().strip()
    else:
        return "SIMULATED_BOOT_ID"
