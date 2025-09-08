import logging
import os
import io
import tempfile
import socket
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

STREAM_CONF_FILE = "opentrons-live-stream/opentrons-live-stream.conf"
FRAMERATE_MINIMUM = 1
FRAMERATE_MAXIMUM = 60


@router.post(
    "/camera",
    description="Set the camera enablement status.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
)
async def post_live_stream(
    request_body: RequestModel[CameraEnable],
) -> CameraEnable:
    """
    Sets the Opentrons Camera enablement status.

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
            raise RuntimeError(
                "Error stopping opentrons-live-stream.",
                {
                    "returncode": subprocess.returncode,
                    "stdout": stdout,
                    "stderr": stderr,
                },
            )

    return CameraEnable(enabled=request_body.data.enabled)


@router.get(
    "/camera",
    description="Request the Camera enablement status.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
)
async def get_live_stream(
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


# todo(chb, 2025-08-08): Implement POST/GET /camera/picture/settings for picture taking settings when in protocol run


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

    try:
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
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str("Cannot take photo, camera is disabled."),
            )
    except camera.CameraException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
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

    Returns t the HLS and RTMP URLs for this device's live streams.
    """
    try:
        # check to see if the camera is generally enabled
        camera_enabled = advanced_settings.get_setting_with_env_overload(
            "enableCamera", robot_type
        )
        hostname = socket.gethostname()
        ip_address = socket.gethostbyname(hostname)

        if camera_enabled:
            if request_body.data.enabled:  # TODO: add in the "and run exists"
                # todo(chb, 2025-08-08): In order to restart the stream service, validate that a protocol run is active first.
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

            # Set the camera enablement status based on request
            await advanced_settings.set_adv_setting(
                "enableLiveStream", request_body.data.enabled
            )

            return LiveStreamData(
                enabled=request_body.data.enabled,
                hls=f"http://{ip_address}:31950/hls/stream.m3u",
                rtmp=f"rtmp://{ip_address}/live/stream",
            )
        else:
            # todo(chb, 2025-08-05): Do we want to raise an error here instead?
            # For now return the general camera enabled state (False) because it supercedes
            return LiveStreamData(
                enabled=camera_enabled,
                hls=f"http://{ip_address}:31950/hls/stream.m3u",
                rtmp=f"rtmp://{ip_address}/live/stream",
            )
    except Exception:
        raise LegacyErrorResponse(
            message=f"ERROR: Failed to set Live Stream enable to {request_body.data.enabled}.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_400_BAD_REQUEST)


@router.get(
    "/camera/stream",
    description="Request the stream enablement status and stream URLs.",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": LegacyErrorResponse},
    },
)
async def get_live_stream(
    robot_type: Annotated[RobotTypeEnum, Depends(get_robot_type_enum)],
) -> LiveStreamData:
    """
    Request the Opentrons Live Stream enablement status and stream URLs.

    Returns both the HLS and RTMP URLs for this device's live streams.
    """
    try:
        hostname = socket.gethostname()
        ip_address = socket.gethostbyname(hostname)
        enable_status = advanced_settings.get_setting_with_env_overload(
            "enableLiveStream", robot_type
        )
        return LiveStreamData(
            enabled=enable_status,
            hls=f"http://{ip_address}:31950/hls/stream.m3u",
            rtmp=f"rtmp://{ip_address}/live/stream",
        )
    except Exception:
        raise LegacyErrorResponse(
            message="ERROR: Cannot fetch Live Stream data.",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_400_BAD_REQUEST)


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
        log.info('No first "')
        formatted_source = '"' + formatted_source
    if formatted_source is not None and formatted_source[-1] != '"':
        log.info('No final "')
        formatted_source = formatted_source + '"'

    raw_device = formatted_source[1:-1]

    if (
        formatted_source is not None
        and "NONE" not in formatted_source
        and not os.path.exists(raw_device)
    ):
        # todo(chb, 2025-08-03): Need to introduce a CAMERA_ERROR code for missing video device
        raise LegacyErrorResponse(
            message=f"ERROR: No device found with device path: {raw_device}",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_400_BAD_REQUEST)

    # todo(chb, 2025-08-05): Add validation for: Resolution, Bitrate

    if request_body.data.framerate is not None and (
        request_body.data.framerate < FRAMERATE_MINIMUM
        or request_body.data.framerate > FRAMERATE_MAXIMUM
    ):
        # todo(chb, 2025-08-03): Need to introduce a CAMERA_ERROR code for invalid settings
        raise LegacyErrorResponse(
            message=f"ERROR: Framerate of {request_body.data.framerate} is invalid.",
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
        f"Updated settings: {updated_settings.source} {updated_settings.resolution} {updated_settings.framerate} {updated_settings.bitrate}"
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
        # todo(chb, 2025-08-08): In order to restart the stream service, validate that a protocol run is active first.

        await _restart_live_stream(updated_settings)

    return updated_settings


@router.get(
    "/camera/stream/settings",
    description="Request the settings for the Flex Live Stream service.",
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
    src = f"/var/lib/{STREAM_CONF_FILE}"

    if not os.path.exists(src):
        # todo(chb, 2025-08-03): Need to introduce a CAMERA_ERROR code for missing stream configuration file, maybe just general?
        raise LegacyErrorResponse(
            message=f"ERROR: Stream Configuration file not found: {src}",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_400_BAD_REQUEST)
    filename = Path(src)

    return _parse_stream_settings(filename)


def _parse_stream_settings(filename: Path) -> LiveStreamSettings:
    fd = filename.open("rb")
    source = str(fd.readline())
    source = source[source.find("=") + 1 : -3]
    resolution = str(fd.readline())
    resolution = resolution[resolution.find("=") + 1 : -3]
    framerate_raw = str(fd.readline())
    framerate_raw = framerate_raw[framerate_raw.find("=") + 1 : -3]
    # todo(chb, 2025-08-03): Add error handling incase the file-read framerate was not a number
    framerate = int(framerate_raw)
    bitrate = str(fd.readline())
    bitrate = bitrate[bitrate.find("=") + 1 : -3]
    fd.close()

    return LiveStreamSettings(
        source=source, resolution=resolution, framerate=framerate, bitrate=bitrate
    )


def _write_stream_settings(settings: LiveStreamSettings) -> None:
    src = f"/var/lib/{STREAM_CONF_FILE}"

    if not os.path.exists(src):
        # todo(chb, 2025-08-03): Need to introduce a CAMERA_ERROR code for missing stream configuration file, maybe just general?
        raise LegacyErrorResponse(
            message=f"ERROR: Stream Configuration file not found: {src}",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ).as_error(status.HTTP_400_BAD_REQUEST)
    filename = Path(src)
    fd = filename.open("w")
    file_lines: list[str] = []
    file_lines.append(f"SOURCE={settings.source}\n")
    file_lines.append(f"RESOLUTION={settings.resolution}\n")
    file_lines.append(f"FRAMERATE={settings.framerate}\n")
    file_lines.append(f"BITRATE={settings.bitrate}\n")
    fd.writelines(file_lines)
    fd.close()


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
        raise RuntimeError(
            "Error restarting opentrons-live-stream.",
            {
                "returncode": subprocess.returncode,
                "stdout": stdout,
                "stderr": stderr,
            },
        )
