import asyncio
import os
from pathlib import Path
from opentrons.config import IS_OSX


class CameraException(Exception):
    pass


async def take_picture(filename: Path,
                       loop: asyncio.AbstractEventLoop = None):
    """
    Take a picture and save it to filename

    :param filename: Name of file to save picture to
    :param loop: optional loop to use
    :return: None
    :raises: CameraException
    """
    try:
        os.remove(filename)
    except OSError:
        pass

    cmd = 'ffmpeg -f video4linux2 -s 640x480 -i /dev/video0 -ss 0:0:1 -frames 1'  # NOQA

    if IS_OSX:
        # Purely for development on macos
        cmd = 'ffmpeg -f avfoundation -framerate 1  -s 640x480  -i "0" -ss 0:0:1 -frames 1'  # NOQA

    proc = await asyncio.create_subprocess_shell(
        f'{cmd} {filename}',
        stderr=asyncio.subprocess.PIPE,
        loop=loop or asyncio.get_event_loop())

    res = await proc.stderr.read()  # type: ignore
    res = res.decode().strip()
    await proc.wait()

    if proc.returncode != 0:
        raise CameraException(res)
    if not filename.exists():
        raise CameraException('picture not saved')
