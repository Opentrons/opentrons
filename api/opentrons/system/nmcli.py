""" opentrons.system.nmcli: Functions and data for interacting with nmcli

The functions contained here are for bridging Python calls with nmcli command
line invocations. They are in general not safe to call anywhere except an
Opentrons robot; on systems that do not have network-manager (like OSX, Windows
and some Linux distributions) they will not work, but on systems that _do_ they
may alter or destroy networking configurations.

In general, the functions here are light shims around nmcli invocations. This
is relevant in particular because they mostly do not handle exceptions coming
from subprocess itself, only parsing nmcli output.
"""

import logging
import re
from typing import Optional, List, Tuple, Dict, Any, Callable, NamedTuple
import enum

from shlex import quote
from asyncio import subprocess as as_subprocess


log = logging.getLogger(__name__)


class SECURITY_TYPES(enum.Enum):
    """ The types of security that this module supports.
    """

    # The string values of these supported security types are passed
    # directly to nmcli; they should match the security types allowed
    # in the network-manager settings for 802-11-wireless-security.key-mgmt
    NONE = 'none'
    WPA_PSK = 'wpa-psk'


class CONNECTION_TYPES(enum.Enum):
    """ Types of connection (used to parse nmcli results)
    """

    # These connection types are used to parse nmcli results and should be
    # valid results for the last element when splitting connection.type by ’-’
    WIRELESS = 'wireless'
    ETHERNET = 'ethernet'


class NETWORK_IFACES(enum.Enum):
    """ Network interface names that we manage here.
    """
    WIFI = 'wlan0'
    ETH_LL = 'eth0'


async def available_ssids() -> List[Dict[str, Any]]:
    """ List the visible (broadcasting SSID) wireless networks.

    Returns a list of the SSIDs. They may contain spaces and should be escaped
    if later passed to a shell.
    """
    fields = ['ssid', 'signal', 'active']
    cmd = ['--terse',
           '--fields',
           ','.join(fields),
           'device',
           'wifi',
           'list']
    out, _ = await _call(cmd)
    return _dict_from_terse_tabular(
        fields, out,
        transformers={'signal': lambda s: int(s) if s.isdigit() else None,
                      'active': lambda s: s.lower() == 'yes'})


async def is_connected() -> str:
    """ Return nmcli's connection measure: none/portal/limited/full/unknown"""
    res, _ = await _call(['networking', 'connectivity'])
    return res


async def connections(
        for_type: Optional[CONNECTION_TYPES] = None) -> List[Dict[str, str]]:
    """ Return the list of configured connections.

    This is all connections that nmcli knows about and manages.
    Each connection is a dict containing some basic information - the
    information retrievable from nmcli connection show. Further information
    should be queried on a connection by connection basis.

    If for_type is not None, it should be a str containing an element of
    CONNECTION_TYPES, and results will be limited to that connection type.
    """
    fields = ['name', 'type', 'active']
    res, _ = await _call(['-t', '-f', ','.join(fields), 'connection', 'show'])
    found = _dict_from_terse_tabular(
        fields,
        res,
        # ’ethernet’ or ’wireless’ from ’802-11-wireless’ or ’802-4-ethernet’
        # and bools from ’yes’ or ’no
        transformers={'type': lambda s: s.split('-')[-1],
                      'active': lambda s: s.lower() == 'yes'}
    )
    if for_type is not None:
        should_return = []
        for c in found:
            if c['type'] == for_type.value:
                should_return.append(c)
        return should_return
    else:
        return found


async def connection_exists(ssid: str) -> Optional[str]:
    """ If there is already a connection for this ssid, return the name of
    the connection; if there is not, return None.
    """
    nmcli_conns = await connections()
    for wifi in [c['name']
                 for c in nmcli_conns if c['type'] == 'wireless']:
        res, _ = await _call(['-t', '-f', '802-11-wireless.ssid',
                              '-m', 'tabular',
                              'connection', 'show', wifi])
        if res == ssid:
            return wifi
    return None


async def _trim_old_connections(
        new_name: str, con_type: CONNECTION_TYPES) -> Tuple[bool, str]:
    """ Delete all connections of con_type but the one specified.
    """
    existing_cons = await connections(for_type=con_type)
    not_us = [c['name'] for c in existing_cons if c['name'] != new_name]
    ok = True
    res = []
    for c in not_us:
        this_ok, remove_res = await remove(name=c)
        ok = ok and this_ok
        if not this_ok:
            # This is not a failure case for connection, and indeed the new
            # connection is already established, so just warn about it
            log.warning("Could not remove wifi connection {}: {}"
                        .format(c, remove_res))
            res.append(remove_res)
        else:
            log.debug("Removed old wifi connection {}".format(c))
    return ok, ';'.join(res)


def _build_con_add_cmd(ssid: str, security_type: SECURITY_TYPES,
                       psk: Optional[str], hidden: bool) -> List[str]:
    """ Build the nmcli connection add command to configure the new network.

    The parameters are the same as configure but without the defaults; this
    should be called only by configure.
    """
    configure_cmd = ['connection', 'add',
                     'save', 'yes',
                     'autoconnect', 'yes',
                     'ifname', 'wlan0',
                     'type', 'wifi',
                     'con-name', ssid,
                     'wifi.ssid', ssid]
    if hidden:
        configure_cmd += ['wifi.hidden', 'true']
    if security_type == SECURITY_TYPES.WPA_PSK:
        configure_cmd += ['wifi-sec.key-mgmt', security_type.value]
        if psk is None:
            raise ValueError('wpa-psk security type requires psk')
        configure_cmd += ['wifi-sec.psk', psk]
    elif security_type == SECURITY_TYPES.NONE:
        pass
    elif security_type == SECURITY_TYPES.WPA_EAP:
        if eap_args is None:
            raise ValueError("wpa-eap security type requires eap_args")
        configure_cmd += _add_eap_args(eap_args)

    return configure_cmd


async def configure(ssid: str,
                    security_type: Optional[SECURITY_TYPES] = None,
                    psk: Optional[str] = None,
                    hidden: Optional[bool] = False,
                    eap_args: Optional[Dict[str, str]] = None,
                    up_retries: int = 3) -> Tuple[bool, str]:
    """ Configure a connection but do not bring it up (though it is configured
    for autoconnect).

    Returns (success, message) where ``success`` is a ``bool`` and ``message``
    is a ``str``.

    Only anticipated failures are treated that way - for instance, an ssid
    that doesn't exist will get a False and a message; a system where nmcli
    is not found will raise a CalledProcessError.

    The ssid is mandatory. If security_type is 'wpa-psk', the psk must be
    specified; if security_type is 'none', the psk will be ignored.

    If security_type is not specified, it will be inferred from the specified
    arguments.
    """

    if None is security_type:
        # Infer from arguments what kind of security this is
        if None is psk:
            security_type = SECURITY_TYPES.NONE
        else:
            security_type = SECURITY_TYPES.WPA_PSK

    hidden = bool(hidden)
    already = await connection_exists(ssid)
    if already:
        # TODO(seth, 8/29/2018): We may need to do connection modifies
        # here for EAP configuration if e.g. we’re passing a keyfile in a
        # different http request
        _1, _2 = await _call(['connection', 'delete', already])

    configure_cmd = _build_con_add_cmd(
        ssid, security_type, psk, hidden, eap_args)
    res, err = await _call(configure_cmd)

    # nmcli connection add returns a string that looks like
    # "Connection ’connection-name’ (connection-uuid) successfully added."
    # This unfortunately doesn’t respect the --terse flag, so we need to
    # regex out the name or the uuid to use later in connection up; the
    # uuid is slightly more regular, so that’s what we use.
    uuid_matches = re.search( # noqa
        "Connection '(.*)'[\s]+\(([\w\d-]+)\) successfully", res) # noqa
    if not uuid_matches:
        return False, err.split('\r')[-1]
    name = uuid_matches.group(1)
    uuid = uuid_matches.group(2)
    for _ in range(up_retries):
        res, err = await _call(['connection', 'up', 'uuid', uuid])
        if 'Connection successfully activated' in res:
            # If we successfully added the connection, remove other wifi
            # connections so they don’t accumulate over time

            _3, _4 = await _trim_old_connections(name,
                                                 CONNECTION_TYPES.WIRELESS)
            return True, res
    else:
        return False, err.split('\r')[-1]


async def remove(ssid: str = None, name: str = None) -> Tuple[bool, str]:
    """ Remove a network. Depending on what is known, specify either ssid
    (in which case this function will call ``connection_exists`` to get the
    nmcli connection name) or the nmcli connection name directly.

    Returns (True, msg) if the connection was deleted, (False, msg) otherwise.
    """
    if None is not ssid:
        name = await connection_exists(ssid)
    if None is not name:
        res, err = await _call(['connection', 'delete', name])
        if 'successfully deleted' in res:
            return True, res
        else:
            return False, err
    else:
        return False, 'No connection for ssid {}'.format(ssid)


async def iface_info(which_iface: NETWORK_IFACES) -> Dict[str, Optional[str]]:
    """ Get the basic network configuration of an interface.

    Returns a dict containing the info:
    {
      'ipAddress': 'xx.xx.xx.xx/yy' (ip4 addr with subnet as CIDR) or None
      'macAddress': 'aa:bb:cc:dd:ee:ff' or None
      'gatewayAddress: 'zz.zz.zz.zz' or None
    }

    which_iface should be a string in IFACE_NAMES.
    """
    default_res: Dict[str, Optional[str]] = {'ipAddress': None,
                                             'macAddress': None,
                                             'gatewayAddress': None}
    fields = ['GENERAL.HWADDR', 'IP4.ADDRESS', 'IP4.GATEWAY', 'GENERAL.STATE']
    # Note on this specific command: Most nmcli commands default to a tabular
    # output mode, where if there are multiple things to pull a couple specific
    # fields from it you’ll get a table where rows are, say, connections, and
    # columns are field name. However, specifically ‘con show <con-name>‘ and
    # ‘dev show <dev-name>’ default to a multiline representation, and even if
    # explicitly ask for it to be tabular, it’s not quite the same as the other
    # commands. So we have to special-case the parsing.
    res, err = await _call(['--mode', 'tabular',
                            '--escape', 'no',
                            '--terse', '--fields', ','.join(fields),
                            'dev', 'show', which_iface.value])
    values = res.split('\n')
    if len(fields) != len(values):
        # We failed
        raise ValueError("Bad result from nmcli: {}".format(err))
    default_res['macAddress'] = values[0]
    default_res['ipAddress'] = values[1]
    default_res['gatewayAddress'] = values[2]
    return default_res


async def _call(cmd: List[str]) -> Tuple[str, str]:
    """
    Runs the command in a subprocess and returns the captured stdout output.
    :param cmd: a list of arguments to nmcli. Should not include nmcli itself.

    :return: (stdout, stderr)
    """
    to_exec = [quote(c) for c in ['nmcli'] + cmd]
    cmd_str = ' '.join(to_exec)
    # We have to use a shell invocation here because nmcli will not accept
    # secrets specified on the command line unless it’s in a shell. The other
    # option is editing the connection configuration file in /etc/ afterwards
    # (or using d-bus and pretending to be an auth agent)
    proc = await as_subprocess.create_subprocess_shell(
        cmd_str,
        stdout=as_subprocess.PIPE, stderr=as_subprocess.PIPE)
    out, err = await proc.communicate()
    out_str, err_str = out.decode().strip(), err.decode().strip()
    sanitized = sanitize_args(to_exec)
    log.debug('{}: stdout={}'.format(' '.join(sanitized), out_str))
    if err_str:
        log.info('{}: stderr={}'.format(' '.join(sanitized), err_str))
    return out_str, err_str


def sanitize_args(cmd: List[str]) -> List[str]:
    """ Filter the command so that it no longer contains passwords
    """
    sanitized = []
    for idx, fieldname in enumerate(cmd):
        if idx > 0 and 'wifi-sec.psk' in cmd[idx-1]:
            sanitized.append('****')
        else:
            sanitized.append(fieldname)
    return sanitized


def _dict_from_terse_tabular(
        names: List[str],
        inp: str,
        transformers: Dict[str, Callable[[str], Any]] = {})\
        -> List[Dict[str, Any]]:
    """ Parse NMCLI terse tabular output into a list of Python dict.

    ``names`` is a list of strings of field names to apply to the input data,
    which is assumed to be colon separated.

    ``inp`` is the input as a string (i.e. already decode()d) from nmcli

    ``transformers`` is a dict mapping field names to callables of the form
    f: str -> any. If a fieldname is in transformers, that callable will be
    invoked on the field matching the name and the result stored.

    The return value is a list with one element per valid line of input, where
    each element is a dict with keys taken from names and values from the input
    """
    res = []
    for n in names:
        if n not in transformers:
            transformers[n] = lambda s: s
    for line in inp.split('\n'):
        if len(line) < 3:
            continue
        fields = line.split(':')
        res.append(dict([
            (elem[0], transformers[elem[0]](elem[1]))
            for elem in zip(names, fields)]))
    return res
