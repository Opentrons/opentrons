import logging
import os
import io
import tempfile
from pathlib import Path
import asyncio
from fastapi import APIRouter, HTTPException
from starlette import status
from starlette.background import BackgroundTask
from starlette.responses import StreamingResponse
from opentrons.system import camera
from robot_server.errors.error_responses import LegacyErrorResponse
from opentrons_shared_data.errors import ErrorCodes
from robot_server.service.legacy.models.settings import LiveStreamSettings
from robot_server.service.json_api import RequestModel

log = logging.getLogger(__name__)

router = APIRouter()

JPG = "image/jpg"


@router.post(
    "/camera/picture",
    description="Capture an image from the OT-2's on-board camera " "and return it",
    responses={status.HTTP_200_OK: {"content": {JPG: {}}, "description": "The image"}},
)
async def post_picture_capture() -> StreamingResponse:
    """Take a picture"""
    filename = Path(tempfile.mktemp(suffix=".jpg"))

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


def _cleanup(filename: Path, fd: io.IOBase) -> None:
    """Clean up after sending the response"""
    try:
        log.info(f"Closing and deleting image at {filename}")
        fd.close()
        os.remove(filename)
    except OSError:
        pass


@router.post(
    "/camera/settings/stream",
    description="Configure the settings for the Flex Live Stream service.",
    responses={
        status.HTTP_404_NOT_FOUND: {"model": LegacyErrorResponse},
    },
)
async def post_live_stream_settings(
    request_body: RequestModel[LiveStreamSettings],
) -> LiveStreamSettings:
    """
    Configure the Live Stream and restart it.

    The request body contains the parameters for the live stream.

    Arguments:
        request_body: Input payload from the request body.
    """

    configuration_file = "opentrons-live-stream/opentrons-live-stream.conf"
    src = f"/var/lib/{configuration_file}"

    if not os.path.exists(src):
        # CASEY NOTE - the file isnt being found, why? probably isnt going to the actual var root directory, whoops!
        # todo(chb, 2025-08-03): Need to introduce a CAMERA_ERROR equivalent to ErrorCodes
        raise ValueError(f"FILE NOT FOUND {src}")
        # raise LegacyErrorResponse(
        #     message=f"ERROR: Stream Configuration file not found: {src}",
        #     errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        # )
    filename = Path(src)

    stream_settings = _parse_stream_settings(filename)

    log.info(
        f"STREAM SETTINGS: {stream_settings.source} {stream_settings.resolution} {stream_settings.framerate} {stream_settings.bitrate}"
    )

    # FIRST - check the new device the user supplied in the body, check if it is present in the device list
    # Validate the device string
    new_source = request_body.data.source
    if new_source is not None and new_source[0] != '"':
        log.info('No first "')
        new_source = '"' + new_source
    if new_source is not None and new_source[-1] != '"':
        log.info('No final "')
        new_source = new_source + '"'
    # Validate that the device exists - TODO

    updated_settings = LiveStreamSettings()
    # Write the new values (if provided)
    if new_source is not None:
        updated_settings.source = new_source
    else:
        updated_settings.source = stream_settings.source
    if request_body.data.resolution is not None:
        updated_settings.resolution = request_body.data.resolution
    else:
        updated_settings.resolution = stream_settings.resolution
    if request_body.data.framerate is not None:
        updated_settings.framerate = request_body.data.framerate
    else:
        updated_settings.framerate = stream_settings.framerate
    if request_body.data.bitrate is not None:
        updated_settings.bitrate = request_body.data.bitrate
    else:
        updated_settings.bitrate = stream_settings.bitrate

    log.info(
        f"Updated settings: {updated_settings.source} {updated_settings.resolution} {updated_settings.framerate} {updated_settings.bitrate}"
    )
    # write changes to the opentrons-live-stream.conf file

    _write_stream_settings(filename, updated_settings)

    # attempt to restart the live stream
    command = ["systemctl", "restart", "opentrons-live-stream"]
    subprocess = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await subprocess.communicate()
    if subprocess.returncode == 0:
        log.info("Restarted opentrons-live-stream")
    else:
        raise RuntimeError(
            "Error restarting opentrons-live-stream.",
            {
                "returncode": subprocess.returncode,
                "stdout": stdout,
                "stderr": stderr,
            },
        )

    # check the status, if its down then return an error?
    return updated_settings


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


def _write_stream_settings(filename: Path, settings: LiveStreamSettings) -> None:
    fd = filename.open("w")
    file_lines: list[str] = []
    file_lines.append(f"SOURCE={settings.source}\n")
    file_lines.append(f"RESOLUTION={settings.resolution}\n")
    file_lines.append(f"FRAMERATE={settings.framerate}\n")
    file_lines.append(f"BITRATE={settings.bitrate}\n")
    fd.writelines(file_lines)
    fd.close()
