import asyncio
import logging
import os
from pathlib import Path
from glob import glob
from typing import Any, Dict, Tuple

log = logging.getLogger(__name__)

PORT_SEARCH_TIMEOUT = 5.5


async def enter_bootloader(driver, model):
    """
    Using the driver method, enter bootloader mode of the module board.
    The bootloader mode opens a new port on the uC to upload the firmware file.
    The new port shows up as 'ot_module_(avrdude|samba)_bootloader' on the pi;
    upload fw through it.
    """
    if model == 'thermocycler':
        await driver.enter_programming_mode()
    else:
        driver.enter_programming_mode()

    new_port = ''
    try:
        new_port = await asyncio.wait_for(_find_bootloader_port(), PORT_SEARCH_TIMEOUT)
    except asyncio.TimeoutError:
        pass
    return new_port


async def _find_bootloader_port():
    """
    Checks for the bootloader port
    """
    for attempt in range(2):
        bootloader_ports = glob('/dev/ot_module_*_bootloader')
        if bootloader_ports:
            if len(bootloader_ports) == 1:
                return bootloader_ports[0]
            elif len(bootloader_ports) > 1:
                raise OSError('Multiple new bootloader ports'
                              'found on mode switch')
        await asyncio.sleep(2)
    raise Exception("No ot_module bootloaders found in /dev. Try again")


async def upload_via_avrdude(port: str,
                             firmware_file_path: str,
                             kwargs: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Run firmware upload command for hardware module with avrdude bootloader.

    Returns tuple of success boolean and message from bootloader.
    """
    # avrdude_options
    PART_NO = 'atmega32u4'
    PROGRAMMER_ID = 'avr109'
    BAUDRATE = '57600'

    config_file_path = Path('/etc/avrdude.conf')
    proc = await asyncio.create_subprocess_exec(
        'avrdude', '-C{}'.format(config_file_path), '-v',
        '-p{}'.format(PART_NO),
        '-c{}'.format(PROGRAMMER_ID),
        '-P{}'.format(port),
        '-b{}'.format(BAUDRATE), '-D',
        '-Uflash:w:{}:i'.format(firmware_file_path),
        **kwargs)
    await proc.wait()

    _result = await proc.communicate()
    result = _result[1].decode()
    avrdude_res = _format_avrdude_response(result)
    if avrdude_res[0]:
        log.debug(result)
    else:
        log.error("Failed to update module firmware for {}: {}"
                  .format(port, avrdude_res[1]))
    return avrdude_res


def _format_avrdude_response(raw_response: str) -> Tuple[bool, str]:
    avrdude_log = ''
    for line in raw_response.splitlines():
        if 'avrdude:' in line and line != raw_response.splitlines()[1]:
            avrdude_log += line.lstrip('avrdude:') + '..'
            if 'flash verified' in line:
                return True, line.lstrip('avrdude: ')
    return False, avrdude_log


async def upload_via_bossa(port: str,
                           firmware_file_path: str,
                           kwargs: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Run firmware upload command for hardware module with SAMBA bootloader.

    Returns tuple of success boolean and message from bootloader.
    """
    # bossac -p/dev/ttyACM1 -e -w -v -R --offset=0x2000
    #   modules/thermo-cycler/production/firmware/thermo-cycler-arduino.ino.bin
    # NOTE: bossac cannot traverse symlinks to port,
    # so we resolve to real path
    resolved_symlink = os.path.realpath(port)
    log.info(
        f"device at symlinked port: {port} "
        f"resolved to path: {resolved_symlink}")
    bossa_args = ['bossac', f'-p{resolved_symlink}',
                  '-e', '-w', '-v', '-R',
                  '--offset=0x2000', f'{firmware_file_path}']

    proc = await asyncio.create_subprocess_exec(*bossa_args, **kwargs)
    stdout, stderr = await proc.communicate()
    res = stdout.decode()
    if "Verify successful" in res:
        log.debug(res)
        return True, res
    elif stderr:
        log.error(f"Failed to update module firmware for {port}: {res}")
        log.error(f"Error given: {stderr.decode()}")
        return False, res
    return False, ''
