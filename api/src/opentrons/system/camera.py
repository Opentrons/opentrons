import asyncio
import os
from pathlib import Path

from opentrons.config import ARCHITECTURE, SystemArchitecture
from opentrons_shared_data.errors.exceptions import CommunicationError
from opentrons_shared_data.errors.codes import ErrorCodes


class CameraException(CommunicationError):
    def __init__(self, message: str, system_error: str) -> None:
        super().__init__(
            ErrorCodes.COMMUNICATION_ERROR,
            message,
            {"internal-error-message": system_error},
        )


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
