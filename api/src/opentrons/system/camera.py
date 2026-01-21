import asyncio
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Dict, Optional

from opentrons_shared_data.errors.codes import ErrorCodes
from opentrons_shared_data.errors.exceptions import CommunicationError
from opentrons_shared_data.robot.types import RobotType, RobotTypeEnum
from opentrons_shared_data.util import StrEnum

from opentrons.config import (
    ARCHITECTURE,
    IS_ROBOT,
    SystemArchitecture,
    get_opentrons_path,
)
from opentrons.protocol_engine.resources.camera_provider import (
    CameraError,
    CameraProvider,
    CameraSettings,
    ImageParameters,
)
from opentrons.system import ffmpeg

log = logging.getLogger(__name__)

# Default System Cameras
DEFAULT_SYSTEM_CAMERA = "/dev/ot_system_camera"

# Default Preview Image Filename
PREVIEW_IMAGE = "preview_image.jpeg"

# Stream Globals
DEFAULT_CONF_FILE = (
    "/lib/systemd/system/opentrons-live-stream/opentrons-live-stream.env"
)
STREAM_CONF_FILE_KEYS = [
    "BOOT_ID",
    "STATUS",
    "SOURCE",
    "RESOLUTION",
    "FRAMERATE",
    "BITRATE",
]

# Camera Parameter Globals
RESOLUTION_MIN = (320, 240)
RESOLUTION_MAX = (7680, 4320)
RESOLUTION_DEFAULT = (1920, 1080)
ZOOM_MIN = 1.0
ZOOM_MAX = 2.0
ZOOM_DEFAULT = 1.0
CONTRAST_MIN = 0.0
CONTRAST_MAX = 2.0
CONTRAST_DEFAULT = 1.0
BRIGHTNESS_MIN = -128
BRIGHTNESS_MAX = 128
BRIGHTNESS_DEFAULT = 0
SATURATION_MIN = 0.0
SATURATION_MAX = 2.0
SATURATION_DEFAULT = 1.0


class StreamConfigurationKeys(StrEnum):
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
    filepath = get_opentrons_path("live_stream_environment_file")
    if IS_ROBOT and not os.path.exists(filepath):
        # If the dynamic configuration file doesn't exist make it using our defaults file
        with open(DEFAULT_CONF_FILE, "r") as default_config:
            content = default_config.read()
        with open(filepath, "w") as new_config_file:
            new_config_file.write(content)
    return filepath


def robot_supports_livestream(robot_type: RobotType) -> bool:
    """Validate whether or not robot supports live streaming service."""
    robot = RobotTypeEnum.robot_literal_to_enum(robot_type)
    if robot == RobotTypeEnum.OT2:
        # If we are on an OT-2 we do not support live streams
        return False
    return True


async def update_live_stream_status(
    robot_type: RobotType,
    stream_status: bool,
    camera_provider: CameraProvider,
    override_settings: Optional[CameraSettings] = None,
) -> None:
    """Update and handle a change in the Opentrons Live Stream status."""
    if not IS_ROBOT or robot_supports_livestream(robot_type) is False:
        # If we are not on a robot we simply no-op updating the stream
        return None

    contents = load_stream_configuration_file_data()
    if contents is None:
        log.error("Opentrons Live Stream Configuration file cannot be updated.")
        return None

    # Validate the stream status
    if override_settings is not None:
        camera_enable_settings = override_settings
    else:
        camera_enable_settings = await camera_provider.get_camera_settings()
    status = "OFF"
    if (
        stream_status
        and camera_enable_settings.cameraEnabled
        and camera_enable_settings.liveStreamEnabled
    ):
        # Check to see if the camera device is available
        raw_device = str(contents["SOURCE"])
        if not os.path.exists(raw_device):
            log.error(
                f"Opentrons Live Stream cannot sample the camera. No video device found with device path: {raw_device}"
            )
        # Enable the stream
        status = "ON"
    # Overwrite the contents
    contents["BOOT_ID"] = get_boot_id()
    contents["STATUS"] = status
    write_stream_configuration_file_data(contents)
    await restart_live_stream(robot_type)


async def stop_live_stream(robot_type: RobotType) -> None:
    """Attempt to stop the Opentrons Live Stream service."""
    if robot_supports_livestream(robot_type) is False:
        # No-op on OT-2 since we don't have a live stream service there
        return None

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
            f"Failed to stop opentrons-live-stream, returncode: {subprocess.returncode}, stdout: {stdout.decode()}, stderr: {stderr.decode()}"
        )


async def restart_live_stream(robot_type: RobotType) -> None:
    """Attempt to restart the Opentrons Live Stream service."""
    if robot_supports_livestream(robot_type) is False:
        # No-op on OT-2 since we don't have a live stream service there
        return None

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
            f"Failed to restart opentrons-live-stream, returncode: {subprocess.returncode}, stdout: {stdout.decode()}, stderr: {stderr.decode()}"
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
            "Opentrons Live Stream Configuration file data is incorrect or missing."
        )
        # We don't want to write bad or incomplete data to the file
        return None

    # Migrate old camera default file data to new uniform default
    if contents[StreamConfigurationKeys.SOURCE] == "NONE":
        contents[StreamConfigurationKeys.SOURCE] = DEFAULT_SYSTEM_CAMERA
    return contents


def write_stream_configuration_file_data(data: Dict[str, str]) -> None:
    src = get_stream_configuration_filepath()
    if not src.exists():
        log.error(f"Opentrons Live Stream configuration file not found: {src}")
        return None

    enum_stream_keys = {stream_key.value for stream_key in StreamConfigurationKeys}
    if sorted(list(data.keys())) != sorted(enum_stream_keys):
        log.error(
            "Data provided to write is not compatible with Opentrons Live Stream Configuration file."
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


async def image_capture(  # noqa: C901
    robot_type: RobotType, parameters: ImageParameters
) -> bytes | CameraError:
    """Process an Image Capture request with a Camera utilizing a given set of parameters."""
    camera = DEFAULT_SYSTEM_CAMERA

    # We must always validate the camera exists
    if not os.path.exists(camera):
        return CameraError(
            message=f"No video device found with device path {camera}", code=None
        )

    if parameters.zoom is not None and (
        parameters.zoom < ZOOM_MIN or parameters.zoom > ZOOM_MAX
    ):
        potential_invalid_param = "Zoom"
    elif parameters.contrast is not None and (
        parameters.contrast < CONTRAST_MIN or parameters.contrast > CONTRAST_MAX
    ):
        potential_invalid_param = "Contrast"
    elif parameters.brightness is not None and (
        parameters.brightness < BRIGHTNESS_MIN or parameters.brightness > BRIGHTNESS_MAX
    ):
        potential_invalid_param = "Brightness"
    elif parameters.saturation is not None and (
        parameters.saturation < SATURATION_MIN or parameters.saturation > SATURATION_MAX
    ):
        potential_invalid_param = "Saturation"
    elif parameters.resolution is not None and (
        parameters.resolution[0] < RESOLUTION_MIN[0]
        or parameters.resolution[1] < RESOLUTION_MIN[1]
        or parameters.resolution[0] > RESOLUTION_MAX[0]
        or parameters.resolution[1] > RESOLUTION_MAX[1]
    ):
        potential_invalid_param = "Resolution"
    else:
        potential_invalid_param = None

    if potential_invalid_param is not None:
        return CameraError(
            message=f"{potential_invalid_param} parameter is outside the boundaries allowed for image capture.",
            code="IMAGE_SETTINGS",
        )
    try:
        # Always stop the live stream service to ensure the Camera is always free when attempting an image capture
        await stop_live_stream(robot_type)

        zoom = parameters.zoom if parameters.zoom is not None else ZOOM_DEFAULT
        contrast = (
            parameters.contrast if parameters.contrast is not None else CONTRAST_DEFAULT
        )
        brightness = (
            parameters.brightness
            if parameters.brightness is not None
            else BRIGHTNESS_DEFAULT
        )
        saturation = (
            parameters.saturation
            if parameters.saturation is not None
            else SATURATION_DEFAULT
        )
        resolution = (
            parameters.resolution
            if parameters.resolution is not None
            else RESOLUTION_DEFAULT
        )

        result = await ffmpeg.ffmpeg_capture_image_bytes(
            robot_type=robot_type,
            resolution=resolution,
            camera=camera,
            zoom=zoom,
            pan=parameters.pan if parameters.pan is not None else (0, 0),
            contrast=contrast,
            brightness=brightness,
            saturation=saturation,
        )
    except Exception:
        result = CameraError(
            message="Exception occured during execution of system image capture.",
            code=None,
        )
    finally:
        # Restart the live stream service
        await restart_live_stream(robot_type)
    return result


@lru_cache(maxsize=1)
def get_boot_id() -> str:
    if IS_ROBOT:
        return Path("/proc/sys/kernel/random/boot_id").read_text().strip()
    else:
        return "SIMULATED_BOOT_ID"


def camera_exists() -> bool:
    """Validate whether or not the camera device exists."""
    return os.path.exists(DEFAULT_SYSTEM_CAMERA)
    # todo(chb, 2025-11-10): Eventually when we support multiple cameras this should accept a camera parameter to check for
