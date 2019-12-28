"""
otupdate.buildroot.name_management: functions for managing machine names

The robot has two names associated with it:

- The hostname is the name by which the machine is advertised on mdns. This can
  be used to ping, issue HTTP requests, ssh in, etc. It should be set when the
  update server starts by :py:func:`setup_hostname`. During this call, avahi
  will be restarted to pick up the new hostname.
- The name (unqualified) is the name of the robot. The name is stored in
  /etc/machine-info as the PRETTY_HOSTNAME. `opentrons-${name}` is used as the
  name value in the health endpoints and as the avahi service name. This name
  can be set with POST /server/name, but does not change the machine hostname.
  This can be set with :py:func:`set_name`, which should be called at boot
  and whenever the name changes; this function will write /etc/machine-info
  and change the avahi service advertisement (without restarting avahi).
"""

import asyncio
import logging
import os
from typing import Optional
import urllib.parse

from aiohttp import web

from .constants import DEVICE_NAME_VARNAME

LOG = logging.getLogger(__name__)


try:
    import dbus

    class DBusState:
        """ Bundle of state for dbus """
        def __init__(self,
                     bus: dbus.SystemBus,
                     server: dbus.Interface,
                     entrygroup: dbus.Interface) -> None:
            """
            Build the state bundle.

            :param bus: The system bus instance
            :param server: An org.freedesktop.Avahi.Server interface
            :param entrygroup: An org.freedesktop.Avahi.EntryGroup interface
            """
            self.bus = bus
            #: The system bus
            self.entrygroup = entrygroup
            #: The entry group interface
            self.server = server
            #: The avahi server interface

    _BUS_STATE: Optional[DBusState] = None

    def _set_name_future(name: str):
        """
        The implementation of the name setting, to be run in a concurrent
        executor since the dbus module doesn't work with asyncio
        """
        global _BUS_STATE
        if not _BUS_STATE:
            bus = dbus.SystemBus()
            server_obj = bus.get_object('org.freedesktop.Avahi', '/')
            server_if = dbus.Interface(
                server_obj, 'org.freedesktop.Avahi.Server')
            entrygroup_path = server_if.EntryGroupNew()
            entrygroup_obj = bus.get_object(
                'org.freedesktop.Avahi', entrygroup_path)
            entrygroup_if = dbus.Interface(
                entrygroup_obj, 'org.freedesktop.Avahi.EntryGroup')
            _BUS_STATE = DBusState(bus, server_if, entrygroup_if)

        _BUS_STATE.entrygroup.Reset()
        hostname = _BUS_STATE.server.GetHostName()
        domainname = _BUS_STATE.server.GetDomainName()
        _BUS_STATE.entrygroup.AddService(
            dbus.Int32(-1),                  # avahi.IF_UNSPEC
            dbus.Int32(-1),                  # avahi.PROTO_UNSPEC
            dbus.UInt32(0),                  # flags
            name,                            # sname
            '_http._tcp',                    # stype
            domainname,                      # sdomain (.local)
            f'{hostname}.{domainname}',      # shost (hostname.local)
            dbus.UInt16(31950),              # port
            dbus.Array([], signature='ay'))
        _BUS_STATE.entrygroup.Commit()

except ImportError:
    LOG.exception("Couldn't import dbus, name setting will be nonfunctional")

    def _set_name_future(name: str):
        LOG.warning("Not setting name, dbus could not be imported")


_BUS_LOCK = asyncio.Lock()


def _get_hostname() -> str:
    """ Get a good value for the system hostname.

    The hostname is loaded from, in order of preference,

    - url-encoding the contents of /var/serial-number, if it is present,
      not empty, and not the default
    - the systemd-generated machine-id, which changes at every boot.
    """
    if os.path.exists('/var/serial'):
        serial = open('/var/serial').read().strip()
        if serial:
            LOG.info("Using serial for hostname")
            hn = ''.join([c for c in urllib.parse.quote(serial, safe='')
                          if c != '%'])
            if hn != serial:
                LOG.warning(f"Reencoded serial to {hn}")
            return hn

        else:
            LOG.info("Using machine-id for hostname: empty /var/serial")
    else:
        LOG.info("Using machine-id for hostname: no /var/serial")

    return open('/etc/machine-id').read().strip()[:6]


async def setup_hostname() -> str:
    """
    Intended to be run when the server starts. Sets the machine hostname.

    Once the hostname is set, we restart avahi.

    This is a separate task from establishing and changing the opentrons
    machine name, which is UTF-8 and stored in /etc/machine-info as the
    PRETTY_HOSTNAME and used in the avahi service name.

    :returns: the hostname
    """
    hostname = _get_hostname()
    with open('/etc/hostname', 'w') as ehn:
        ehn.write(f'{hostname}\n')

    # First, we run hostnamed which will set the transient hostname
    # and loaded static hostname from the value we just wrote to
    # /etc/hostname
    LOG.debug("Setting hostname")
    proc = await asyncio.create_subprocess_exec(
        'hostname', '-F', '/etc/hostname',
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await proc.communicate()
    ret = proc.returncode
    if ret != 0:
        LOG.error(
            f'Error starting hostname: {ret} '
            f'stdout: {stdout!r} stderr: {stderr!r}')
        raise RuntimeError("Couldn't run hostname")

    # Then, with the hostname set, we can restart avahi
    LOG.debug("Restarting avahi")
    proc = await asyncio.create_subprocess_exec(
        'systemctl', 'restart', 'avahi-daemon',
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await proc.communicate()
    ret = proc.returncode
    if ret != 0:
        LOG.error(
            f'Error restarting avahi-daemon: {ret} '
            f'stdout: {stdout!r} stderr: {stderr!r}')
        raise RuntimeError("Error restarting avahi")
    LOG.debug("Updated hostname and restarted avahi OK")
    return hostname


def _update_pretty_hostname(new_val: str):
    """ Write a new value for the pretty hostname.

    :raises OSError: If the new value could not be written.
    """
    try:
        with open('/etc/machine-info') as emi:
            contents = emi.read()
    except OSError:
        LOG.exception("Couldn't read /etc/machine-info")
        contents = ''
    new_contents = _new_machine_info_contents(contents, new_val)
    with open('/etc/machine-info', 'w') as emi:
        emi.write(new_contents)


def _new_machine_info_contents(current_machine_info_contents: str, new_pretty_hostname: str) -> str:
    """
    Return current_machine_info_contents - the full contents of /etc/machine-info - with the
    PRETTY_HOSTNAME=... line rewritten to refer to new_pretty_hostname.
    """
    new_contents = ''
    for line in current_machine_info_contents.split('\n'):
        if not line.startswith('PRETTY_HOSTNAME'):
            new_contents += f'{line}\n'
    new_contents += f'PRETTY_HOSTNAME={new_pretty_hostname}\n'
    return new_contents


def get_name(default: str = 'no name set'):
    """ Get the currently-configured name of the machine """
    try:
        with open('/etc/machine-info') as emi:
            contents = emi.read()
    except OSError:
        LOG.exception(
            "Couldn't read /etc/machine-info")
        contents = ''
    for line in contents.split('\n'):
        if line.startswith('PRETTY_HOSTNAME='):
            return '='.join(line.split('=')[1:])
    LOG.warning(f"No PRETTY_HOSTNAME in {contents}, defaulting to {default}")
    try:
        _update_pretty_hostname(default)
    except OSError:
        LOG.exception("Could not write new pretty hostname!")
    return default


async def set_name(name: str = None) -> str:
    """
    Change the name by writing /etc/machine-info and then calling setup_name

    :param name: The name to set. If ``None``, read it from /etc/machine-info
    :returns: The name that was set. This may be different from ``name``, if
              ``name`` was none or if the pretty hostname could not be written
    """

    if name:
        checked_name = name
        try:
            _update_pretty_hostname(checked_name)
        except OSError:
            LOG.exception("Could not set pretty hostname")
            checked_name = get_name()
    else:
        checked_name = get_name()

    async with _BUS_LOCK:
        await asyncio.get_event_loop().run_in_executor(
            None, _set_name_future, checked_name)
    return checked_name


async def set_name_endpoint(request: web.Request) -> web.Response:
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

    new_name = await set_name(body['name'])
    request.app[DEVICE_NAME_VARNAME] = new_name

    return web.json_response(data={'name': new_name},
                             status=200)


async def get_name_endpoint(request: web.Request) -> web.Response:
    """ Get the name of the robot.

    This information is also accessible in /server/update/health, but this
    endpoint provides symmetry with POST /server/name.

    GET /server/name -> 200 OK, {'name': robot name}
    """
    return web.json_response(
        data={'name': request.app[DEVICE_NAME_VARNAME]},
        status=200)
