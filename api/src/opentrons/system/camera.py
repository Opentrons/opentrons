import asyncio
import os
from pathlib import Path
import logging
from enum import Enum
from typing import Dict
from opentrons.config import ARCHITECTURE, SystemArchitecture, get_opentrons_path
from opentrons_shared_data.errors.exceptions import CommunicationError
from opentrons_shared_data.errors.codes import ErrorCodes
from opentrons.protocol_engine.resources.camera_provider import CameraProvider, ImageParameters


log = logging.getLogger(__name__)

# Default System Cameras
FLEX_EMBEDDED_CAMERA = "/dev/ot_system_camera"
OT2_CAMERA = "/dev/video0"

# Stream Globals
STREAM_CONF_FILE = "opentrons-live-stream.conf"
STREAM_CONF_FILE_KEYS = [
    "BOOT_ID",
    "STATUS",
    "SOURCE",
    "RESOLUTION",
    "FRAMERATE",
    "BITRATE",
]

# Camera Parameter Globals
ZOOM_MIN = 1.0
ZOOM_MAX = 2.0
ZOOM_DEFAULT = 1.0
CONTRAST_MIN = 0.0
CONTRAST_MAX = 2.0
CONTRAST_DEFAULT = 1.0
BRIGHTNESS_MIN = -128.0
BRIGHTNESS_MAX = 128.0
BRIGHTNESS_DEFAULT = 0.0
SATURATION_MIN = 0.0
SATURATION_MAX = 2.0
SATURATION_DEFAULT = 1.0

class StreamConfigurationKeys(str, Enum):
    """The Configuration Key Types."""

    BOOT_ID = "BOOT_ID"
    STATUS = "STATUS"
    SOURCE = "SOURCE"
    RESOLUTION = "RESOLUTION"
    FRAMERATE = "FRAMERATE"
    BITRATE = "BITRATE"


class CameraException(CommunicationError):
    def __init__(self, message: str, system_error: str) -> None:
        super().__init__(
            ErrorCodes.COMMUNICATION_ERROR,
            message,
            {"internal-error-message": system_error},
        )


async def take_picture(filename: Path) -> None:
    """Legacy method to take a picture and save it to filename

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
        cmd = f"v4l2-ctl --device /dev/ot_system_camera --set-fmt-video=width=1280,height=720,pixelformat=MJPG --stream-mmap --stream-to={str(filename)} --stream-count=1"
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


async def update_live_stream_status(
    stream_status: bool, camera_provider: CameraProvider
) -> None:
    """Update and handle a change in the Opentrons Live Stream status."""
    contents = load_stream_configuration_file_data()
    if contents is None:
        log.error("Opentrons Live Stream Configuraiton file cannot be updated.")
        return None

    # Validate the stream status
    camera_enable_settings = await camera_provider.get_camera_settings()
    status = "OFF"
    if (
        stream_status
        and camera_enable_settings.camera_enabled
        and camera_enable_settings.live_stream_enabled
    ):
        # Check to see if the camera device is available
        raw_device = str(contents["SOURCE"])[1:-1]
        if not os.path.exists(raw_device):
            log.error(
                "Opentrons Live Stream cannot sample the camera. No video device found with device path: {raw_device}"
            )
        # Enable the stream
        status = "ON"
    # Overwrite the contents
    contents["STATUS"] = status
    write_stream_configuration_file_data(contents)
    await restart_live_stream()


async def stop_live_stream() -> None:
    """Attempt to stop the Opentrons Live Stream service."""
    command = ["systemctl", "stop", "opentrons-live-stream"]
    subprocess = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await subprocess.communicate()
    if subprocess.returncode == 0:
        log.info("Stopped the opentrons-live-stream service.")
    else:
        log.error(
            f"Failed to stop opentrons-live-stream, returncode:{ subprocess.returncode}, stdout: {stdout.decode()}, stderr: {stderr.decode()}"
        )

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


def load_stream_configuration_file_data() -> dict[str, str] | None:
    """Load the Opentrons Live Stream Conf file and return parsed data or None if an error occurs."""
    src = get_stream_configuration_filepath()
    if not src.exists():
        log.error(f"Opentrons Live Stream configuration file not found: {src}")
        return None
    with src.open("rb") as fd:
        try:
            return parse_stream_configuration_file_data(fd.read())
        except Exception as e:
            log.error(
                f"Opentrons Live Stream status update file parsing failed with: {e}"
            )
    return None


def parse_stream_configuration_file_data(data: bytes) -> Dict[str, str] | None:
    """
    Parse a collect of bytes for Opentrons Live Stream Configuration data and return a dictionary of
    results keyed by configuration constants. Returns None if an error occurred during parsing.
    """
    contents: Dict[str, str] = {
        key.decode("utf-8"): val.decode("utf-8")
        for key, val in [line.split(b"=") for line in data.split(b"\n") if b"=" in line]
    }

    enum_stream_keys = {stream_key.value for stream_key in StreamConfigurationKeys}
    if sorted(list(contents.keys())) != sorted(enum_stream_keys):
        log.error(
            "Opentrons Live Stream Configuraiton file data is incorrect or missing."
        )
        # We don't want to write bad or incomplete data to the file
        return None
    return contents


def write_stream_configuration_file_data(data: Dict[str, str]) -> None:
    src = get_stream_configuration_filepath()
    if not src.exists():
        log.error(f"Opentrons Live Stream configuration file not found: {src}")
        return None

    enum_stream_keys = {stream_key.value for stream_key in StreamConfigurationKeys}
    if sorted(list(data.keys())) != sorted(enum_stream_keys):
        log.error(
            "Data provided to write is not compatible with Opentrons Live Stream Configuraiton file."
        )
        return None

    with src.open("w") as fd:
        file_lines = [
            f"{StreamConfigurationKeys.BOOT_ID}={data[StreamConfigurationKeys.BOOT_ID]}\n",
            f"{StreamConfigurationKeys.STATUS}={data[StreamConfigurationKeys.STATUS]}\n",
            f"{StreamConfigurationKeys.SOURCE}={data[StreamConfigurationKeys.SOURCE]}\n",
            f"{StreamConfigurationKeys.RESOLUTION}={data[StreamConfigurationKeys.RESOLUTION]}\n",
            f"{StreamConfigurationKeys.FRAMERATE}={data[StreamConfigurationKeys.FRAMERATE]}\n",
            f"{StreamConfigurationKeys.BITRATE}={data[StreamConfigurationKeys.BITRATE]}\n",
        ]
        fd.writelines(file_lines)

async def image_capture(parameters: ImageParameters) -> bytes | None:
    """Process an Image Capture request with a Camera utilizing a given set of parameters."""
    if parameters.zoom < ZOOM_MIN or parameters.zoom > ZOOM_MAX:
        potential_invalid_param = "Zoom"
    elif parameters.contrast < CONTRAST_MIN or parameters.contrast > CONTRAST_MAX:
        potential_invalid_param = "Contrast"
    elif parameters.brightness < BRIGHTNESS_MIN or parameters.brightness > BRIGHTNESS_MAX:
        potential_invalid_param = "Brightness"
    elif parameters.saturation < SATURATION_MIN or parameters.saturation > SATURATION_MAX:
        potential_invalid_param = "Saturation"
    else:
        potential_invalid_param = None
    if potential_invalid_param is not None:
        # If a parameter is invalid log it and return without capturing an image
        log.error(
            f"{potential_invalid_param} parameter of {parameters.contrast} is outside the boundaries allowed for image capture."
        )
        return None

    # Always stop the live stream service to ensure the Camera is always free
    await stop_live_stream()
    zoom = parameters.zoom if parameters.zoom is not None else ZOOM_DEFAULT
    contrast = parameters.contrast if parameters.contrast is not None else CONTRAST_DEFAULT
    brightness = parameters.brightness if parameters.brightness is not None else BRIGHTNESS_DEFAULT
    saturation = parameters.saturation if parameters.saturation is not None else SATURATION_DEFAULT
    resolution = parameters.resolution if parameters.resolution is not None else (1920, 1080)

    filters : str = f"-vf \"crop=iw/{zoom}:ih/{zoom}:(iw-iw/{zoom})/{zoom}:(ih-ih/{zoom})/{zoom},"
    + f"scale={resolution[0]}:{resolution[1]},"
    + f"lut=y='(val-128)*{contrast}+128-{brightness}',"
    + f"hue=s={saturation},"
    + "format=nv12\""

    command = [
        "ffmpeg",
        "-hwaccel", "auto",
        "-video_size", f"{resolution[0]}x{resolution[1]}"
        "-i", f"{FLEX_EMBEDDED_CAMERA if ARCHITECTURE == SystemArchitecture.YOCTO else OT2_CAMERA}",
        "-vf", filters,
        "-frames:v", "1",
        "-f", "image2pipe",
        "-vcodec", "mjpeg",
        "-"
    ]
    subprocess = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await subprocess.communicate()
    if subprocess.returncode == 0:
        log.info("Successfully captured an image with camera.")
        # Upon success, dump our byte stream to the result
        result = stdout
    else:
        log.error(
            f"Failed to restart opentrons-live-stream, returncode:{ subprocess.returncode}, stdout: {stdout.decode()}, stderr: {stderr.decode()}"
        )
        result = None

    # Restart the live stream service
    await restart_live_stream()
    # Return the process result
    return result