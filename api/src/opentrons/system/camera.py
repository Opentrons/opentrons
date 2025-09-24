import asyncio
import os
from pathlib import Path
import logging
from opentrons.config import ARCHITECTURE, SystemArchitecture, get_opentrons_path
from opentrons_shared_data.errors.exceptions import CommunicationError
from opentrons_shared_data.errors.codes import ErrorCodes


log = logging.getLogger(__name__)
STREAM_CONF_FILE = "opentrons-live-stream.conf"
STREAM_CONF_FILE_KEYS = ["BOOT_ID", "STATUS", "SOURCE", "RESOLUTION", "FRAMERATE", "BITRATE"]


class CameraException(CommunicationError):
    def __init__(self, message: str, system_error: str) -> None:
        super().__init__(
            ErrorCodes.COMMUNICATION_ERROR,
            message,
            {"internal-error-message": system_error},
        )

class CameraSettings(BaseModel):
    """Camera API settings for general enablement and use."""

    camera_enabled: bool = Field(
        ..., description="Enablement status for general camera use."
    )
    live_stream_enabled: bool = Field(
        ..., description="Enablement status for the Opentrons Live Stream service."
    )
    error_recovery_enabled: bool = Field(..., description="Enablement status for camera usage with Error Recovery.")


async def take_picture(filename: Path) -> None:
    """Take a picture and save it to filename

    :param filename: Name of file to save picture to
    :param loop: optional loop to use
    :return: None
    :raises: CameraException
    """
    try:
        os.remove(filename)
    except OSError:
        pass

    if ARCHITECTURE == SystemArchitecture.YOCTO:
        cmd = f"v4l2-ctl --device /dev/video2 --set-fmt-video=width=1280,height=720,pixelformat=MJPG --stream-mmap --stream-to={str(filename)} --stream-count=1"
    elif ARCHITECTURE == SystemArchitecture.BUILDROOT:
        cmd = f"ffmpeg -f video4linux2 -s 640x480 -i /dev/video0 -ss 0:0:1 -frames 1 {str(filename)}"
    else:  # HOST
        cmd = f'ffmpeg -f avfoundation -framerate 1  -s 640x480  -i "0" -ss 0:0:1 -frames 1 {str(filename)}'

    proc = await asyncio.create_subprocess_shell(
        cmd,
        stderr=asyncio.subprocess.PIPE,
    )

    res = await proc.stderr.read()  # type: ignore
    res = res.decode().strip()
    await proc.wait()

    if proc.returncode != 0:
        raise CameraException("Failed to communicate with camera", res)
    if not filename.exists():
        raise CameraException("Failed to save image", "")

def get_stream_configuration_filepath() -> Path:
    """Return the file path to the Opentrons Live Stream Configuration file."""
    return get_opentrons_path("live_stream_configuration_file")


# todo: (chb, 2025-09-24): For engine needs refactor to implement the camera settings callback rather than passing object in
async def update_live_stream_status(stream_status: bool, camera_enable_settings: CameraSettings) -> None:
    """Update and handle a change in the Opentrons Live Stream status."""
    src = get_stream_configuration_filepath()
    if not src.exists():
        log.error(f"Opentrons Live Stream configuration file not found: {src}")
        return None
    with src.open("rb") as fd:
        contents = {
            key.decode("utf-8"): val.decode("utf-8")
            for key, val in [
                line.split(b"=") for line in fd.read().split(b"\n") if b"=" in line
            ]
        }
    if sorted(list(contents.keys())) != sorted(STREAM_CONF_FILE_KEYS):
        log.error("Opentrons Live Stream Configuraiton file data is incorrect or missing.")
        # We don't want to write bad or incomplete data to the file
        return None
    
    # Validate the stream status
    status = "OFF"
    if stream_status and camera_enable_settings.camera_enabled and camera_enable_settings.live_stream_enabled:
        # Check to see if the camera device is available
        raw_device = str(contents['SOURCE'])[1:-1]
        if not os.path.exists(raw_device):
            log.error("Opentrons Live Stream cannot sample the camera. No video device found with device path: {raw_device}")
        # Enable the stream
        status = "ON"
    with src.open("w") as fd:
        file_lines = [
            f"BOOT_ID={contents['BOOT_ID']}\n",
            f"STATUS={status}\n",
            f"SOURCE={contents['SOURCE']}\n",
            f"RESOLUTION={contents['RESOLUTION']}\n",
            f"FRAMERATE={contents['FRAMERATE']}\n",
            f"BITRATE={contents['BITRATE']}\n",
        ]
        fd.writelines(file_lines)
    await restart_live_stream()

async def restart_live_stream() -> None:
    """Attempt to restart the Opentrons Live Stream service."""
    command = ["systemctl", "restart", "opentrons-live-stream"]
    subprocess = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await subprocess.communicate()
    if subprocess.returncode == 0:
        log.info("Restarted opentrons-live-stream service.")
    else:
        log.error(
            f"Failed to restart opentrons-live-stream, returncode:{ subprocess.returncode}, stdout: {stdout.decode()}, stderr: {stderr.decode()}"
        )
