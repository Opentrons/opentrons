import asyncio
import logging
import os
from typing import Any, Dict, Optional, Tuple
from opentrons import HERE as package_root

log = logging.getLogger(__name__)

PORT_SEARCH_TIMEOUT = 5.5

# avrdude_options
PART_NO = 'atmega32u4'
PROGRAMMER_ID = 'avr109'
BAUDRATE = '57600'


async def enter_bootloader(driver, model):
    """
    Using the driver method, enter bootloader mode of the atmega32u4.
    The bootloader mode opens a new port on the uC to upload the hex file.
    After receiving a 'dfu' command, the firmware provides a 3-second window to
    close the current port so as to do a clean switch to the bootloader port.
    The new port shows up as 'ttyn_bootloader' on the pi; upload fw through it.
    NOTE: Modules with old bootloader will have the bootloader port show up as
    a regular module port- 'ttyn_tempdeck'/ 'ttyn_magdeck' with the port number
    being either different or same as the one that the module was originally on
    So we check for changes in ports and use the appropriate one
    """
    # Required for old bootloader
    ports_before_dfu_mode = await _discover_ports()

    driver.enter_programming_mode()
    driver.disconnect()
    new_port = ''
    try:
        new_port = await asyncio.wait_for(
            _port_poll(_has_old_bootloader(model), ports_before_dfu_mode),
            PORT_SEARCH_TIMEOUT)
    except asyncio.TimeoutError:
        pass
    return new_port


async def update_firmware(port: str,
                          firmware_file_path: str,
                          loop: Optional[asyncio.AbstractEventLoop])\
                          -> Tuple[str, Tuple[bool, str]]:
    """
    Run avrdude firmware upload command. Switch back to normal module port

    Note: For modules with old bootloader, the kernel could assign the module
    a new port after the update (since the board is automatically reset).
    Scan for such a port change and use the appropriate port.

    Returns a tuple of the new port to communicate on (or None if it was not
    found) and a tuple of success and message from avrdude.
    """

    ports_before_update = await _discover_ports()
    config_file_path = os.path.join(package_root,
                                    'config', 'modules', 'avrdude.conf')
    kwargs: Dict[str, Any] = {
        'stdout': asyncio.subprocess.PIPE,
        'stderr': asyncio.subprocess.PIPE
    }
    if loop:
        kwargs['loop'] = loop
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
    new_port = await _port_on_mode_switch(ports_before_update)
    log.info("New port: {}".format(new_port))
    return new_port, avrdude_res


def _format_avrdude_response(raw_response: str) -> Tuple[bool, str]:
    avrdude_log = ''
    for line in raw_response.splitlines():
        if 'avrdude:' in line and line != raw_response.splitlines()[1]:
            avrdude_log += line.lstrip('avrdude:') + '..'
            if 'flash verified' in line:
                return True, line.lstrip('avrdude: ')
    return False, avrdude_log


async def _port_on_mode_switch(ports_before_switch):
    ports_after_switch = await _discover_ports()
    new_port = ''
    if ports_after_switch and \
            len(ports_after_switch) >= len(ports_before_switch) and \
            not set(ports_before_switch) == set(ports_after_switch):
        new_ports = list(filter(
            lambda x: x not in ports_before_switch,
            ports_after_switch))
        if len(new_ports) > 1:
            raise OSError('Multiple new ports found on mode switch')
        new_port = '/dev/modules/{}'.format(new_ports[0])
    return new_port


async def _port_poll(is_old_bootloader, ports_before_switch=None):
    """
    Checks for the bootloader port
    """
    new_port = ''
    while not new_port:
        if is_old_bootloader:
            new_port = await _port_on_mode_switch(ports_before_switch)
        else:
            ports = await _discover_ports()
            if ports:
                discovered_ports = list(filter(
                    lambda x: x.endswith('bootloader'), ports))
                if len(discovered_ports) == 1:
                    new_port = '/dev/modules/{}'.format(discovered_ports[0])
        await asyncio.sleep(0.05)
    return new_port


def _has_old_bootloader(model: str) -> bool:
    return model in ('temp_deck_v1', 'temp_deck_v2')


async def _discover_ports():
    for attempt in range(2):
        # Measure for race condition where port is being switched in
        # between calls to isdir() and listdir()
        try:
            return os.listdir('/dev/modules')
        except (FileNotFoundError, OSError):
            pass
        await asyncio.sleep(2)
    raise Exception("No /dev/modules found. Try again")
