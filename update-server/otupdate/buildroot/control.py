"""
otupdate.buildroot.control: non-update-specific endpoints for otupdate

This has endpoints like /restart that aren't specific to update tasks.
"""
import asyncio
import logging
import shlex
import socket
import string
import subprocess
from typing import Callable, Coroutine, Mapping

from aiohttp import web

from .constants import (RESTART_LOCK_NAME,
                        DEVICE_PRETTYNAME_VARNAME, DEVICE_HOSTNAME_VARNAME)


LOG = logging.getLogger(__name__)


def _do_restart():
    subprocess.check_call(['reboot'])


async def restart(request: web.Request) -> web.Response:
    """ Restart the robot.

    Blocks while the restart lock is held.
    """
    async with request.app[RESTART_LOCK_NAME]:
        asyncio.get_event_loop().call_later(1, _do_restart)
    return web.json_response({'message': 'Restarting in 1s'},
                             status=200)


def build_health_endpoint(
        version_dict: Mapping[str, str])\
        -> Callable[[web.Request],
                    Coroutine[None, None, web.Response]]:
    """ Build a coroutine to serve /health that captures version info
    """
    async def health(request: web.Request) -> web.Response:
        return web.json_response(
            {
                'name': request.app[DEVICE_PRETTYNAME_VARNAME],
                'updateServerVersion': version_dict.get(
                    'update_server_version', 'unknown'),
                'apiServerVersion': version_dict.get(
                    'opentrons_api_version', 'unknown'),
                'smoothieVersion': 'unimplemented',
                'systemVersion': version_dict.get(
                    'buildroot_version', 'unknown'),
                'capabilities': {'buildroot-update': '/server/update/begin',
                                 'restart': '/server/update/restart'}
            },
            headers={'Access-Control-Allow-Origin': '*'}
        )
    return health


def get_hostname() -> str:
    """ Get the system hostname. """
    try:
        return open('/etc/hostname').read().strip()
    except OSError:
        return socket.gethostname()


def get_prettyname() -> str:
    """ Get the system prettyname. """
    try:
        with open('/etc/machine-info') as emi:
            for line in emi.read().split('\n'):
                if line.startswith('PRETTYNAME='):
                    return '='.join(line.split('=')[1:])
            return get_hostname()
    except OSError:
        return get_hostname()


def _write_name_details(name: str, pretty_name: str):
    """ Write the hostname to the system. """
    with open('/etc/hostname', 'w') as ehn:
        LOG.debug(f"Writing {name} to /etc/hostname")
        ehn.write(name)

    with open('/etc/machine-info', 'r+') as emi:
        current = emi.read()
        emi.seek(0)
        new = [line for line in current.split('\n')
               if not line.startswith('PRETTY_HOSTNAME')]
        new += [f'PRETTY_HOSTNAME={shlex.quote(pretty_name)}']
        LOG.debug(f"Writing {new} to /etc/machine-info")
        emi.write('\n'.join(new) + '\n')


async def update_system_for_name(hostname: str,
                                 timeout_sec: float = 30):
    """ Make sure the advertised name is available on mdns.

    The hostname is required since we poll to wait for hostnamed to finish.

    If the hostname isn't specified, read it from /etc/hostname. This can
    be used at server boot to fix the case where systemd didn't pick up on
    the hostname in /etc/hostname because it wasn't bind-mounted from /var
    yet.
    """
    LOG.debug("Running hostnamed")
    proc = await asyncio.create_subprocess_exec(
        'systemctl', 'start', 'systemd-hostnamed',
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await proc.communicate()
    ret = proc.returncode
    if ret != 0:
        LOG.error(
            f'Error starting systemd-hostnamed: {ret} '
            f'stdout: {stdout} stderr: {stderr}')
        raise RuntimeError("Couldn't run hostnamed")
    LOG.debug("Checking hostname")
    then = asyncio.get_event_loop().time()
    while True:
        proc = await asyncio.create_subprocess_exec(
            'hostname',
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await proc.communicate()
        ret = proc.returncode
        if ret != 0:
            LOG.error(
                f'Error checking hostname: {ret} '
                f'stdout: {stdout} stderr: {stderr}')
            raise RuntimeError("Couldn't check hostname")
        if stdout.decode().strip() == hostname:
            break
        if asyncio.get_event_loop().time() - then > timeout_sec:
            raise RuntimeError("Timeout setting hostname")
        await asyncio.sleep(0.1)
    LOG.debug("Restarting avahi")
    proc = await asyncio.create_subprocess_exec(
        'systemctl', 'restart', 'avahi-daemon',
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await proc.communicate()
    ret = proc.returncode
    if ret != 0:
        LOG.error(
            f'Error restarting avahi-daemon: {ret} '
            f'stdout: {stdout} stderr: {stderr}')
        raise RuntimeError("Error restarting avahi")
    LOG.debug("Updated hostname and restarted avahi OK")


def hostname_from_pretty_name(pretty_name: str) -> str:
    """ Make a hostname that follows the rules from a pretty name """
    MAX_LEN = 64 - len('opentrons')
    OK_CHARS = string.ascii_letters + string.digits + '-'

    def ensure_char(char):
        if char in OK_CHARS:
            return char
        else:
            return '-'

    hostname = ''.join([ensure_char(c) for c in pretty_name[:MAX_LEN]])
    LOG.debug(f"hostname_from_pretty_name: {pretty_name}->{hostname}")
    return hostname


async def update_name(name: str) -> str:
    """ Update the system name.

    The passed name will be used unchanged as the pretty name and a version
    of it capped to 53 chars and with only ascii letters, digits, and - used
    as the hostname. After the hostname is written, hostnamed will run and
    avahi will update.

    :param name: The pretty name. Will be quoted.
    :returns: The hostname generated from the pretty name
    """
    LOG.info(f"Updating name to {name}")
    hostname = hostname_from_pretty_name(name)
    _write_name_details(hostname, name)
    await update_system_for_name(hostname)
    return hostname


async def set_name(request: web.Request) -> web.Response:
    """ Set the name of the robot.

    Request with POST /server/name {"name": new_name}
    Responds with 200 OK {"hostname": new_name, "prettyname": pretty_name}
    or 400 Bad Request

    In general, the new pretty name will be the specified name. The true
    hostname will be capped to 53 letters, and have any characters other than
    ascii letters or dashes replaced with dashes to fit the requirements here
    https://www.freedesktop.org/software/systemd/man/hostname.html#.
    """

    def build_400(msg: str) -> web.Response:
        return web.json_response(
            data={'message': msg},
            status=400)

    body = await request.json()
    if 'name' not in body or not isinstance(body['name'], str):
        return build_400('Body has no "name" key with a string')

    hostname = await update_name(body['name'])
    request.app[DEVICE_HOSTNAME_VARNAME] = hostname
    request.app[DEVICE_PRETTYNAME_VARNAME] = body['name']

    return web.json_response(data={'hostname': hostname,
                                   'prettyname': body['name']},
                             status=200)
