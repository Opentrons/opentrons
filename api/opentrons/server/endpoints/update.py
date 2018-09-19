import logging
import asyncio
import shutil
import os

from opentrons import robot

log = logging.getLogger(__name__)


def _ensure_programmer_executable():
    """ Find the lpc21isp executable and ensure it is executable
    """
    # Find the lpc21isp executable, explicitly allowing the case where it
    # is not executable (since that’s exactly what we’re trying to fix)
    updater_executable = shutil.which('lpc21isp',
                                      mode=os.F_OK)
    # updater_executable might be None; we’re passing it here unchecked
    # because if it is None, we’re about to fail when we try to program
    # the smoothie, and we want the exception to bubble up.
    os.chmod(updater_executable, 0o777)


async def _update_firmware(filename, loop, explicit_modeset=True):
    """
    This method remains in the API currently because of its use of the robot
    singleton's copy of the driver. This should move to the server lib project
    eventually and use its own driver object (preferably involving moving the
    drivers themselves to the serverlib)

    If explicit_modeset is True (default), explicitly place the smoothie in
    programming mode.

    If explicit_modeset is False, assume the smoothie is already in programming
    mode.
    """
    # ensure there is a reference to the port
    if not robot.is_connected():
        robot.connect()

    # get port name
    port = str(robot._driver.port)

    if explicit_modeset:
        # set smoothieware into programming mode
        robot._driver._smoothie_programming_mode()
        # close the port so other application can access it
        robot._driver._connection.close()

    _ensure_programmer_executable()

    # run lpc21isp, THIS WILL TAKE AROUND 1 MINUTE TO COMPLETE
    update_cmd = 'lpc21isp -wipe -donotstart {0} {1} {2} 12000'.format(
        filename, port, robot.config.serial_speed)
    proc = await asyncio.create_subprocess_shell(
        update_cmd,
        stdout=asyncio.subprocess.PIPE,
        loop=loop)
    rd = await proc.stdout.read()
    res = rd.decode().strip()
    await proc.communicate()

    # re-open the port
    robot._driver._connection.open()
    # reset smoothieware
    robot._driver._smoothie_reset()
    # run setup gcodes
    robot._driver._setup()

    return res
