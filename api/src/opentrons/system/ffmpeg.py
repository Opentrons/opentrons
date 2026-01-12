"""opentrons.system.ffmpeg: Functions and data for interacting with FFMPEG."""

import asyncio
import logging
from typing import Tuple

from opentrons_shared_data.robot.types import RobotType

from opentrons.protocol_engine.resources.camera_provider import CameraError

log = logging.getLogger(__name__)

# === FFMPEG Filter Details ===
# The following filters are utilized via the '-vf' flag to manipulate the final image returned:
# 'crop' = [output_width]:[output_height]:x:y
#   The crop is composed of a desired output width and height for the image, and
#   an X/Y position to begin the crop at (becomes the top left of the new image).
# 'scale' = [width]:[height]
#   The resolution of the final image to export, scales up or down based on configuration.
# 'lut' (Look-Up Table) = 'y' (Luminance) = 'val' (Current value of a given pixel from 0-255)
#   The equation on the Look up table takes the current luminance value of an image per pixel
#   and manipulates it using Contrast and Brightness settings. This is applied to the whole image.
# 'hue' (Image color range) = 's' (Saturation) = [range]
#   The hue flag uses the 's' (saturation) modifier to scale image color intensity, default is 1.

# todo(chb, 2025-10-13): Right now we're just zooming towards the center of the frame. The 'pan'
# setting should be used on the latter half of 'crop' to determine our cropping location instead.


async def ffmpeg_capture_image_bytes(
    robot_type: RobotType,
    resolution: Tuple[int, int],
    camera: str,
    zoom: float,
    pan: Tuple[int, int],
    contrast: float,
    brightness: int,
    saturation: float,
) -> bytes | CameraError:
    """Execute an FFMPEG command to capture an image based on various image parameters."""
    if robot_type == "OT-2 Standard":
        ot2_brightness: float = (
            brightness / 128
        ) * -1  # OT-2's equilizer field takes a value of -1.0 to 1.0 for brightness
        command = [
            "ffmpeg",
            "-hwaccel",
            "auto",
            "-video_size",
            f"{resolution[0]}x{resolution[1]}",
            "-f",
            "v4l2",
            "-i",
            f"{camera}",
            "-vf",
            f"crop=iw/{zoom}:ih/{zoom}:(iw-iw/{zoom})/{zoom}:(ih-ih/{zoom})/{zoom},"
            f"scale={resolution[0]}:{resolution[1]},"
            f"eq=brightness={ot2_brightness}:contrast={contrast}:saturation={saturation}",
            "-frames:v",
            "1",
            "-f",
            "image2pipe",
            "-vcodec",
            "mjpeg",
            "-",
        ]
    else:
        command = [
            "ffmpeg",
            "-hwaccel",
            "auto",
            "-video_size",
            f"{resolution[0]}x{resolution[1]}",
            "-f",
            "v4l2",
            "-i",
            f"{camera}",
            "-vf",
            f"crop=iw/{zoom}:ih/{zoom}:(iw-iw/{zoom})/{zoom}:(ih-ih/{zoom})/{zoom},"
            f"scale={resolution[0]}:{resolution[1]},"
            f"lut=y=(val-128)*{contrast}+128-{brightness},"
            f"hue=s={saturation},format=nv12",
            "-frames:v",
            "1",
            "-f",
            "image2pipe",
            "-vcodec",
            "mjpeg",
            "-",
        ]

    subprocess = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout: bytes
    stderr: bytes
    stdout, stderr = await subprocess.communicate()
    if subprocess.returncode == 0:
        log.info("Successfully captured an image with camera.")
        # Upon success, dump our byte stream to the result
        return stdout
    else:
        log.error(
            f"Failed to capture an image with camera, returncode: {subprocess.returncode}, stdout: {stdout.decode()}, stderr: {stderr.decode()}"
        )
        return CameraError(
            message="Failed to return bytes from FFMPEG image capture.",
            code=str(subprocess.returncode)
            if subprocess.returncode is not None
            else None,
        )
