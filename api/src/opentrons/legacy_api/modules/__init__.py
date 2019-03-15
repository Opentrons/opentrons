import os
import logging
import re
import asyncio
from typing import List, Tuple, Any
from .magdeck import MagDeck
from .tempdeck import TempDeck
from opentrons import HERE as package_root, config

log = logging.getLogger(__name__)

PORT_SEARCH_TIMEOUT = 5.5
SUPPORTED_MODULES = {
    'magdeck': MagDeck,
    'magnetic module': MagDeck,
    'tempdeck': TempDeck,
    'temperature module': TempDeck
}

# avrdude_options
PART_NO = 'atmega32u4'
PROGRAMMER_ID = 'avr109'
BAUDRATE = '57600'


class UnsupportedModuleError(Exception):
    pass


class AbsentModuleError(Exception):
    pass


_mod_robot = None
_mod_labware = None


def provide_singleton(robot):
    global _mod_robot
    _mod_robot = robot


def provide_labware(lw):
    global _mod_labware
    _mod_labware = lw


def load(name, slot):
    module_instance = None
    name = name.lower()
    if name in SUPPORTED_MODULES:
        if _mod_robot.is_simulating():
            labware_instance = _mod_labware.load(name, slot)
            module_class = SUPPORTED_MODULES.get(name)
            module_instance = module_class(
                lw=labware_instance, broker=_mod_robot.broker)
        else:
            # TODO: BC 2018-08-01 this currently loads the first module of
            # that type that is on the robot, in the future we should add
            # support for multiple instances of one module type this
            # accessor would then load the correct disambiguated module
            # instance via the module's serial
            module_instances = _mod_robot.attached_modules.values()
            matching_modules = [
                mod for mod in module_instances if isinstance(
                    mod, SUPPORTED_MODULES.get(name)
                )
            ]
            if matching_modules:
                module_instance = matching_modules[0]
                labware_instance = _mod_labware.load(name, slot)
                module_instance.labware = labware_instance
            else:
                raise AbsentModuleError(
                    "no module of name {} is currently connected".format(name)
                )
    else:
        raise UnsupportedModuleError("{} is not a valid module".format(name))

    return module_instance


# Note: this function should be called outside the robot class, because
# of the circular dependency that it would create if imported into robot.py
def discover() -> List[Tuple[str, Any]]:
    if config.IS_ROBOT and os.path.isdir('/dev/modules'):
        devices = os.listdir('/dev/modules')
    else:
        devices = []

    discovered_modules = []

    module_port_regex = re.compile('|'.join(SUPPORTED_MODULES.keys()), re.I)
    for port in devices:
        match = module_port_regex.search(port)
        if match:
            name = match.group().lower()
            if name not in SUPPORTED_MODULES:
                log.warning("Unexpected module connected: {} on {}"
                            .format(name, port))
                continue
            discovered_modules.append((port, name))
    log.info('Discovered modules: {}'.format(discovered_modules))

    return discovered_modules


async def enter_bootloader(module):
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

    module._driver.enter_programming_mode()
    module.disconnect()
    new_port = ''
    try:
        new_port = await asyncio.wait_for(
            _port_poll(_has_old_bootloader(module), ports_before_dfu_mode),
            PORT_SEARCH_TIMEOUT)
    except asyncio.TimeoutError:
        pass
    return new_port


async def update_firmware(module, firmware_file_path, loop):
    """
    Run avrdude firmware upload command. Switch back to normal module port

    Note: For modules with old bootloader, the kernel could assign the module
    a new port after the update (since the board is automatically reset).
    Scan for such a port change and use the appropriate port
    """
    # TODO: Make sure the module isn't in the middle of operation

    ports_before_update = await _discover_ports()
    config_file_path = os.path.join(package_root,
                                    'config', 'modules', 'avrdude.conf')
    proc = await asyncio.create_subprocess_exec(
        'avrdude', '-C{}'.format(config_file_path), '-v',
        '-p{}'.format(PART_NO),
        '-c{}'.format(PROGRAMMER_ID),
        '-P{}'.format(module.port),
        '-b{}'.format(BAUDRATE), '-D',
        '-Uflash:w:{}:i'.format(firmware_file_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE, loop=loop)
    await proc.wait()

    _result = await proc.communicate()
    result = _result[1].decode()
    log.debug(result)
    log.debug("Switching back to non-bootloader port")
    module._port = _port_on_mode_switch(ports_before_update)

    return _format_avrdude_response(result)


def _format_avrdude_response(raw_response):
    response = {'message': '', 'avrdudeResponse': ''}
    avrdude_log = ''
    for line in raw_response.splitlines():
        if 'avrdude:' in line and line != raw_response.splitlines()[1]:
            avrdude_log += line.lstrip('avrdude:') + '..'
            if 'flash verified' in line:
                response['message'] = 'Firmware update successful'
                response['avrdudeResponse'] = line.lstrip('avrdude: ')
    if not response['message']:
        response['message'] = 'Firmware update failed'
        response['avrdudeResponse'] = avrdude_log
    return response


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


def _has_old_bootloader(module):
    return True if module.device_info.get('model') == 'temp_deck_v1' or \
                   module.device_info.get('model') == 'temp_deck_v2' else False


async def _discover_ports():
    if os.environ.get('RUNNING_ON_PI') and os.path.isdir('/dev/modules'):
        for attempt in range(2):
            # Measure for race condition where port is being switched in
            # between calls to isdir() and listdir()
            try:
                return os.listdir('/dev/modules')
            except (FileNotFoundError, OSError):
                pass
            await asyncio.sleep(2)
        raise Exception("No /dev/modules found. Try again")
