import logging
import os
import io
import tempfile
import asyncio
from typing import Annotated
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from starlette import status
from starlette.background import BackgroundTask
from starlette.responses import StreamingResponse
from opentrons.system import camera
from robot_server.errors.error_responses import LegacyErrorResponse
from opentrons_shared_data.errors import ErrorCodes
from robot_server.service.legacy.models.settings import (
    CameraEnable,
    LiveStreamData,
    LiveStreamSettings,
)
from robot_server.service.json_api import RequestModel
from opentrons.config import advanced_settings
from robot_server.hardware import get_robot_type_enum
from opentrons_shared_data.robot.types import RobotTypeEnum

log = logging.getLogger(__name__)

router = APIRouter()

JPG = "image/jpg"

# todo(chb, 2025-09-10): These Camera defined values should live in a consolidated place
FRAMERATE_MINIMUM = 1
FRAMERATE_MAXIMUM = 60


@router.post(
    "/camera",
    description="Set the camera enablement status. Disabling this disables both the Camera and the Opentrons Live Stream.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
)
async def post_camera(
    request_body: RequestModel[CameraEnable],
) -> CameraEnable:
    """
    Sets the Opentrons Camera enablement status. Disabling this disables both the Camera and the Opentrons Live Stream.

    Returns the enable/disable status of the camera..
    """
    await advanced_settings.set_adv_setting("enableCamera", request_body.data.enabled)
    if request_body.data.enabled is False:
        # Shut off the live stream service
        stream_settings = _get_stream_settings()
        stream_settings.source = "NONE"
        _write_stream_settings(stream_settings)

        command = ["systemctl", "stop", "opentrons-live-stream"]
        subprocess = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await subprocess.communicate()
        if subprocess.returncode == 0:
            log.info("Disabled opentrons-live-stream service")
        else:
            log.info(
                f"Failed to stop opentrons-live-stream, returncode:{ subprocess.returncode}, stdout: {stdout.decode()}, stderr: {stderr.decode()}"
            )

    return CameraEnable(enabled=request_body.data.enabled)


@router.get(
    "/camera",
    description="Request the Camera enablement status.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
)
async def get_camera(
    robot_type: Annotated[RobotTypeEnum, Depends(get_robot_type_enum)],
) -> CameraEnable:
    """
    Request the Opentrons Camera enablement status.
    """
    enable_status = advanced_settings.get_setting_with_env_overload(
        "enableCamera", robot_type
    )
    return CameraEnable(
        enabled=enable_status,
    )


# todo(chb, 2025-09-08): Implement POST/GET /camera/picture/settings for picture taking settings when in protocol run


@router.post(
    "/camera/picture",
    description="Capture an image from the OT-2's on-board camera " "and return it",
    responses={status.HTTP_200_OK: {"content": {JPG: {}}, "description": "The image"}},
)
async def post_picture_capture(
    robot_type: Annotated[RobotTypeEnum, Depends(get_robot_type_enum)]
) -> StreamingResponse:
    """Take a picture"""
    filename = Path(tempfile.mktemp(suffix=".jpg"))

    camera_enabled = advanced_settings.get_setting_with_env_overload(
        "enableCamera", robot_type
    )
    if camera_enabled:
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
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
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


@router.post(
    "/camera/stream",
    description="Set the stream enablement status.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
)
async def post_live_stream(
    request_body: RequestModel[CameraEnable],
    robot_type: Annotated[RobotTypeEnum, Depends(get_robot_type_enum)],
) -> LiveStreamData:
    """
    Sets the Opentrons Live Stream enablement status.


    Returns both the HLS and RTMP relative URLs for this device's live streams.

    HLS:
        The full HLS stream URL is formatted as: http://{ROBOT_IP}:31950/hls/stream.m3u
    RTMP:
        The full RTMP stream URL is formatted as: rtmp://{ROBOT_IP}/live/stream
    """
    camera_enabled = advanced_settings.get_setting_with_env_overload(
        "enableCamera", robot_type
    )

    # Set the camera enablement status based on request
    await advanced_settings.set_adv_setting(
        "enableLiveStream", request_body.data.enabled
    )

    if camera_enabled:
        if request_body.data.enabled:
            # todo(chb, 2025-09-08): In order to restart the stream service, validate that a protocol run is active first.
            settings = _get_stream_settings()
            await _restart_live_stream(settings)
        else:
            # Shut off the live stream service
            stream_settings = _get_stream_settings()
            stream_settings.source = "NONE"
            _write_stream_settings(stream_settings)

            command = ["systemctl", "stop", "opentrons-live-stream"]
            subprocess = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await subprocess.communicate()
            if subprocess.returncode == 0:
                log.info("Disabled opentrons-live-stream service")
            else:
                raise RuntimeError(
                    "Error stopping opentrons-live-stream.",
                    {
                        "returncode": subprocess.returncode,
                        "stdout": stdout,
                        "stderr": stderr,
                    },
                )

    return LiveStreamData(
        enabled=request_body.data.enabled,
        hls="/hls/stream.m3u",
        rtmp="/live/stream",
    )


@router.get(
    "/camera/stream",
    description="Request the Opentrons Live Stream enablement status and stream URLs.",
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": LegacyErrorResponse},
    },
)
async def get_live_stream(
    robot_type: Annotated[RobotTypeEnum, Depends(get_robot_type_enum)],
) -> LiveStreamData:
    """
    Request the Opentrons Live Stream enablement status and stream URLs.

    Returns both the HLS and RTMP relative URLs for this device's live streams.

    HLS:
        The full HLS stream URL is formatted as: http://{ROBOT_IP}:31950/hls/stream.m3u
    RTMP:
        The full RTMP stream URL is formatted as: rtmp://{ROBOT_IP}/live/stream
    """
    enable_status = advanced_settings.get_setting_with_env_overload(
        "enableLiveStream", robot_type
    )
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
    robot_type: Annotated[RobotTypeEnum, Depends(get_robot_type_enum)],
) -> LiveStreamSettings:
    """
    Configure the Live Stream and restart it.

    The request body contains the parameters for the live stream.

    Arguments:
        request_body: Input payload from the request body.
    """
    stream_settings = _get_stream_settings()

    # === Validate incoming stream settings
    # Source device names must be enclosed in quotations for FFMPEG to identify the device
    formatted_source = request_body.data.source
    if formatted_source is not None and formatted_source[0] != '"':
        formatted_source = '"' + formatted_source
    if formatted_source is not None and formatted_source[-1] != '"':
        formatted_source = formatted_source + '"'

    raw_device = str(formatted_source)[1:-1]

    if (
        formatted_source is not None
        and "NONE" not in formatted_source
        and not os.path.exists(raw_device)
    ):
        # todo(chb, 2025-09-03): Need to introduce a CAMERA_ERROR code for missing video device
        raise LegacyErrorResponse(
            message=f"No device found with device path: {raw_device}",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_400_BAD_REQUEST)

    # todo(chb, 2025-09-05): Add validation for: Resolution, Bitrate

    if request_body.data.framerate is not None and (
        request_body.data.framerate < FRAMERATE_MINIMUM
        or request_body.data.framerate > FRAMERATE_MAXIMUM
    ):
        # todo(chb, 2025-09-03): Need to introduce a CAMERA_ERROR code for invalid settings
        raise LegacyErrorResponse(
            message=f"Framerate of {request_body.data.framerate} is invalid.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_400_BAD_REQUEST)

    updated_settings = LiveStreamSettings(
        source=formatted_source
        if formatted_source is not None
        else stream_settings.source,
        resolution=request_body.data.resolution
        if request_body.data.resolution is not None
        else stream_settings.resolution,
        framerate=request_body.data.framerate
        if request_body.data.framerate is not None
        else stream_settings.framerate,
        bitrate=request_body.data.bitrate
        if request_body.data.bitrate is not None
        else stream_settings.bitrate,
    )

    log.info(
        f"Updated Opentrons-Live-Stream settings: {updated_settings.source} {updated_settings.resolution} {updated_settings.framerate} {updated_settings.bitrate}"
    )

    # write changes to the opentrons-live-stream.conf file
    _write_stream_settings(updated_settings)

    camera_enabled = advanced_settings.get_setting_with_env_overload(
        "enableCamera", robot_type
    )
    live_stream_enabled = advanced_settings.get_setting_with_env_overload(
        "enableLiveStream", robot_type
    )
    if camera_enabled and live_stream_enabled:
        # todo(chb, 2025-09-08): In order to restart the stream service, validate that a protocol run is active first.

        await _restart_live_stream(updated_settings)

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
            message=f"ERROR: Stream Configuration file not found: {src}",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR)

    return _parse_stream_settings(src)


def _parse_stream_settings(filename: Path) -> LiveStreamSettings:
    with filename.open("rb") as fd:
        contents = {
            key.decode("utf-8"): val.decode("utf-8")
            for key, val in [
                line.split(b"=") for line in fd.read().split(b"\n") if b"=" in line
            ]
        }

    return LiveStreamSettings(
        source=contents["SOURCE"],
        resolution=contents["RESOLUTION"],
        framerate=int(contents["FRAMERATE"]),
        bitrate=contents["BITRATE"],
    )


def _write_stream_settings(settings: LiveStreamSettings) -> None:
    src = camera.get_stream_configuration_filepath()

    if not src.exists():
        # todo(chb, 2025-09-03): Need to introduce a CAMERA_ERROR code for missing stream configuration file, maybe just general?
        raise LegacyErrorResponse(
            message=f"ERROR: Stream Configuration file not found: {src}",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR)

    with src.open("w") as fd:
        file_lines = [
            f"SOURCE={settings.source}\n",
            f"RESOLUTION={settings.resolution}\n",
            f"FRAMERATE={settings.framerate}\n",
            f"BITRATE={settings.bitrate}\n",
        ]
        fd.writelines(file_lines)


async def _restart_live_stream(settings: LiveStreamSettings) -> None:
    # attempt to restart the live stream
    command = ["systemctl", "restart", "opentrons-live-stream"]
    subprocess = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await subprocess.communicate()
    if subprocess.returncode == 0:
        log.info(f"Restarted opentrons-live-stream with settings: {settings}")
    else:
        log.info(
            f"Failed to restart opentrons-live-stream, returncode:{ subprocess.returncode}, stdout: {stdout.decode()}, stderr: {stderr.decode()}"
        )
