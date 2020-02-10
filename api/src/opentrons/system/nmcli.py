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
import copy
from typing import Optional, List, Tuple, Dict, Callable, Any, NamedTuple
import enum
import os

from shlex import quote
from asyncio import subprocess as as_subprocess

from opentrons import config


log = logging.getLogger(__name__)


class EAPType(NamedTuple):
    name: str
    displayName: str
    args: List[Dict[str, Any]]


class _EAP_OUTER_TYPES(enum.Enum):
    """ The types of phase-1 EAP we support.
    """

    # The string values of these supported EAP types should match both what
    # is expected by nmcli/wpa_supplicant (in 802-1x.eap) and the keys in
    # the CONFIG_REQUIRES dict above
    # Note: if a file field has an optional password, the password field `name`
    # must start with the `name` of the file field
    TLS = EAPType(
        name='tls',
        displayName='EAP-TLS',
        args=[{'name': 'identity',
               'displayName': 'Username',
               'nmName': 'identity',
               'required': True,
               'type': 'string'},
              {'name': 'caCert',
               'displayName': 'CA Certificate File',
               'nmName': 'ca-cert',
               'required': False,
               'type': 'file'},
              {'name': 'clientCert',
               'displayName': 'Client Certificate File',
               'nmName': 'client-cert',
               'required': True,
               'type': 'file'},
              {'name': 'privateKey',
               'displayName': 'Private Key File',
               'nmName': 'private-key',
               'required': True,
               'type': 'file'},
              {'name': 'privateKeyPassword',
               'displayName': 'Private Key Password',
               'nmName': 'private-key-password',
               'required': False,
               'type': 'password'}])
    PEAP = EAPType(
        name='peap',
        displayName='EAP-PEAP',
        args=[{'name': 'identity',
               'displayName': 'Username',
               'nmName': 'identity',
               'required': True,
               'type': 'string'},
              {'name': 'anonymousIdentity',
               'displayName': 'Anonymous Identity',
               'nmName': 'anonymous-identity',
               'required': False,
               'type': 'string'},
              {'name': 'caCert',
               'displayName': 'CA Certificate File',
               'nmName': 'ca-cert',
               'required': False,
               'type': 'file'}])
    TTLS = EAPType(
        name='ttls',
        displayName='EAP-TTLS',
        args=[{'name': 'identity',
               'displayName': 'Username',
               'nmName': 'identity',
               'required': True,
               'type': 'string'},
              {'name': 'anonymousIdentity',
               'displayName': 'Anonymous Identity',
               'nmName': 'anonymous-identity',
               'required': False,
               'type': 'string'},
              {'name': 'caCert',
               'displayName': 'CA Certificate File',
               'nmName': 'ca-cert',
               'required': False,
               'type': 'file'},
              {'name': 'clientCert',
               'displayName': 'Client Certificate File',
               'nmName': 'client-cert',
               'required': False,
               'type': 'file'},
              {'name': 'privateKey',
               'displayName': 'Private Key File',
               'nmName': 'private-key',
               'required': False,
               'type': 'file'},
              {'name': 'privateKeyPassword',
               'displayName': 'Private Key Password',
               'nmName': 'private-key-password',
               'required': False,
               'type': 'password'}])

    def qualified_name(self) -> str:
        return self.value.name


class _EAP_PHASE2_TYPES(enum.Enum):
    """ The types of EAP phase 2 auth (for tunneled EAP) we support
    """

    # The string values of these supported EAP types should match both what
    # is expected by nmcli/wpa_supplicant (in 802-1x.phase2-autheap) and the
    # keys in the CONFIG_REQUIRES dict above
    MSCHAP_V2 = EAPType(
        name='mschapv2',
        displayName='MS-CHAP v2',
        args=[{'name': 'password',
               'displayName': 'Password',
               'nmName': 'password',
               'required': True,
               'type': 'password'}])
    MD5 = EAPType(
        name='md5',
        displayName='MD5',
        args=[{'name': 'password',
               'displayName': 'Password',
               'nmName': 'password',
               'required': True,
               'type': 'password'}])
    TLS = EAPType(
        name='tls',
        displayName='TLS',
        args=[{'name': 'phase2CaCert',
               'displayName': 'Inner CA Certificate File',
               'nmName': 'phase2-ca-cert',
               'required': False,
               'type': 'file'},
              {'name': 'phase2ClientCert',
               'displayName': 'Inner Client Certificate File',
               'nmName': 'phase2-client-cert',
               'required': True,
               'type': 'file'},
              {'name': 'phase2PrivateKey',
               'displayName': 'Inner Private Key File',
               'nmName': 'phase2-private-key',
               'required': True,
               'type': 'file'},
              {'name': 'phase2PrivateKeyPassword',
               'displayName': 'Inner Private Key Password',
               'nmName': 'phase2-private-key-password',
               'required': False,
               'type': 'password'}])

    def qualified_name(self) -> str:
        return 'eap-' + self.value.name


class EAP_TYPES(enum.Enum):
    """ The types of EAP we support, fusing inner and outer methods """
    TTLS_EAPTLS = (_EAP_OUTER_TYPES.TTLS, _EAP_PHASE2_TYPES.TLS)
    TTLS_EAPMSCHAPV2 = (_EAP_OUTER_TYPES.TTLS, _EAP_PHASE2_TYPES.MSCHAP_V2)
    TTLS_MD5 = (_EAP_OUTER_TYPES.TTLS, _EAP_PHASE2_TYPES.MD5)
    PEAP_EAPMSCHAPV2 = (_EAP_OUTER_TYPES.PEAP, _EAP_PHASE2_TYPES.MSCHAP_V2)
    TLS = (_EAP_OUTER_TYPES.TLS, None)

    def __init__(self, outer, inner):
        self.outer = outer
        self.inner = inner

    def qualified_name(self) -> str:
        name = self.outer.qualified_name()
        if self.inner:
            name += '/' + self.inner.qualified_name()
        return name

    @classmethod
    def by_qualified_name(cls, qname: str) -> 'EAP_TYPES':
        for val in cls.__members__.values():
            if val.qualified_name() == qname:
                return val
        raise KeyError(qname)

    def args(self) -> List[Dict[str, Any]]:
        # Have to copy these or reference semantics modify the version stored
        # in the enums
        to_ret = copy.deepcopy(self.outer.value.args)
        if self.inner:
            to_ret += copy.deepcopy(self.inner.value.args)
        return to_ret

    def display_name(self) -> str:
        name = self.outer.value.displayName
        if self.inner:
            name += ' with ' + self.inner.value.displayName
        return name


class SECURITY_TYPES(enum.Enum):
    """ The types of security that this module supports.
    """

    # The string values of these supported security types are passed
    # directly to nmcli; they should match the security types allowed
    # in the network-manager settings for 802-11-wireless-security.key-mgmt
    NONE = 'none'
    WPA_PSK = 'wpa-psk'
    WPA_EAP = 'wpa-eap'


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


def _add_security_type_to_scan(scan_out: Dict[str, Any]) -> Dict[str, Any]:
    sec = scan_out['security']
    if '802.1X' in sec:
        scan_out['securityType'] = 'wpa-eap'
    elif 'WPA2' in sec:
        scan_out['securityType'] = 'wpa-psk'
    elif '' == sec:
        scan_out['securityType'] = 'none'
    else:
        scan_out['securityType'] = 'unsupported'
    return scan_out


async def available_ssids() -> List[Dict[str, Any]]:
    """ List the visible (broadcasting SSID) wireless networks.

    Returns a list of the SSIDs. They may contain spaces and should be escaped
    if later passed to a shell.
    """
    # Force nmcli to actually scan rather than reuse cached results. We ignore
    # errors here because NetworkManager yells at you if you do it twice in a
    # row without another operation in between
    cmd = ['device', 'wifi', 'rescan']
    _1, _2 = await _call(cmd, suppress_err=True)

    fields = ['ssid', 'signal', 'active', 'security']
    cmd = ['--terse',
           '--fields',
           ','.join(fields),
           'device',
           'wifi',
           'list']
    out, err = await _call(cmd)
    if err:
        raise RuntimeError(err)
    output = _dict_from_terse_tabular(
        fields, out,
        transformers={'signal': lambda s: int(s) if s.isdigit() else None,
                      'active': lambda a: a.lower() == 'yes',
                      'ssid': lambda s: s if s != '--' else None})

    return [_add_security_type_to_scan(nw) for nw in output if nw['ssid']]


async def is_connected() -> str:
    """ Return nmcli's connection measure: none/portal/limited/full/unknown"""
    res, _ = await _call(['networking', 'connectivity', 'check'])
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


def _add_eap_args(eap_args: Dict[str, str]) -> List[str]:
    """ Add configuration options suitable for an nmcli con add command
    for WPA-EAP configuration. These options are mostly in the
    802-1x group.

    The eap_args dict should be a flat structure of arguments. They
    must contain at least 'eapType', specifying the EAP type to use
    (the qualified_name() of one of the members of EAP_TYPES) and the
    required arguments for that EAP type.
    """
    args = ['wifi-sec.key-mgmt', 'wpa-eap']
    eap_type = EAP_TYPES.by_qualified_name(eap_args['eapType'])
    type_args = eap_type.args()
    args += ['802-1x.eap', eap_type.outer.value.name]
    if eap_type.inner:
        args += ['802-1x.phase2-autheap', eap_type.inner.value.name]
    for ta in type_args:
        if ta['name'] in eap_args:
            if ta['type'] == 'file':
                # Keyfiles must be prepended with file:// so nm-cli
                # knows that we’re not giving it DER-encoded blobs
                if config.ARCHITECTURE == config.SystemArchitecture.BALENA:
                    _make_host_symlink_if_necessary()
                    path = _rewrite_key_path_to_host_path(eap_args[ta['name']])
                else:
                    path = eap_args[ta['name']]
                val = 'file://' + path
            else:
                val = eap_args[ta['name']]
            args += ['802-1x.' + ta['nmName'], val]
    return args


def _build_con_add_cmd(ssid: str, security_type: SECURITY_TYPES,
                       psk: Optional[str], hidden: bool,
                       eap_args: Optional[Dict[str, Any]]) -> List[str]:
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
                     'wifi.ssid', ssid,
                     '802-11-wireless.cloned-mac-address', 'permanent']
    if hidden:
        configure_cmd += ['wifi.hidden', 'true']
    if security_type == SECURITY_TYPES.WPA_PSK:
        configure_cmd += ['wifi-sec.key-mgmt', security_type.value]
        if psk is None:
            raise ValueError('wpa-psk security type requires psk')
        configure_cmd += ['wifi-sec.psk', psk]
    elif security_type == SECURITY_TYPES.WPA_EAP:
        if eap_args is None:
            raise ValueError('wpa-eap security type requires eap_args')
        configure_cmd += _add_eap_args(eap_args)
    elif security_type == SECURITY_TYPES.NONE:
        pass
    else:
        raise ValueError("Bad security_type {}".format(security_type))

    return configure_cmd


async def configure(ssid: str,
                    securityType: SECURITY_TYPES,
                    psk: Optional[str] = None,
                    hidden: bool = False,
                    eapConfig: Optional[Dict[str, Any]] = None,
                    upRetries: int = 2) -> Tuple[bool, str]:
    """ Configure a connection but do not bring it up (though it is configured
    for autoconnect).

    Returns (success, message) where ``success`` is a ``bool`` and ``message``
    is a ``str``.

    Only anticipated failures are treated that way - for instance, an ssid
    that doesn't exist will get a False and a message; a system where nmcli
    is not found will raise a CalledProcessError.

    Input checks should be conducted before calling this function; any issues
    with arguments that make it to this function will probably surface
    themselves as TypeErrors and ValueErrors rather than anything more
    structured.

    The ssid and security_type arguments are mandatory; the others have
    different requirements depending on the security type.
    """
    already = await connection_exists(ssid)
    if already:
        # TODO(seth, 8/29/2018): We may need to do connection modifies
        # here for EAP configuration if e.g. we’re passing a keyfile in a
        # different http request
        _1, _2 = await _call(['connection', 'delete', already])

    configure_cmd = _build_con_add_cmd(
        ssid, securityType, psk, hidden, eapConfig)
    res, err = await _call(configure_cmd)

    # nmcli connection add returns a string that looks like
    # "Connection ’connection-name’ (connection-uuid) successfully added."
    # This unfortunately doesn’t respect the --terse flag, so we need to
    # regex out the name or the uuid to use later in connection up; the
    # uuid is slightly more regular, so that’s what we use.
    uuid_matches = re.search(  # noqa
        "Connection '(.*)'[\s]+\(([\w\d-]+)\) successfully", res)  # noqa
    if not uuid_matches:
        return False, err.split('\r')[-1]
    name = uuid_matches.group(1)
    uuid = uuid_matches.group(2)
    for _ in range(upRetries):
        res, err = await _call(['connection', 'up', 'uuid', uuid])
        if 'Connection successfully activated' in res:
            # If we successfully added the connection, remove other wifi
            # connections so they don’t accumulate over time

            _3, _4 = await _trim_old_connections(name,
                                                 CONNECTION_TYPES.WIRELESS)
            return True, res
    else:
        return False, err.split('\r')[-1]


async def wifi_disconnect(ssid: str = None) -> Tuple[bool, str]:
    """
    Disconnect from specified wireless network.
    Ideally, user would be allowed to disconnect a robot from wifi only over an
    ethernet connection to the robot so that, 1) they get the disconnect
    response back and 2) their robot isn't left with no connectivity at all
    However, with robot discovery (over eth0) issues still pending, we will
    allow the users to disconnect the robot from wifi regardless of whether
    they are connected via ethernet.

    Returns (True, msg) if the network was disconnected from successfully,
            (False, msg) otherwise
    """

    res, err = await _call(['connection', 'down', ssid])
    if 'successfully deactivated' in res:
        return True, res
    else:
        return False, err


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
    # example device info lines
    #  GENERAL.HWADDR:B8:27:EB:24:D1:D0
    #  IP4.ADDRESS[1]:10.10.2.221/22
    # capture the field name (without the number in brackets) and the value
    # using regex instead of split because there may be ":" in the value
    _DEV_INFO_LINE_RE = re.compile(r'([\w.]+)(?:\[\d+])?:(.*)')
    # example device info: 30 (disconnected)
    # capture the string without the number
    _IFACE_STATE_RE = re.compile(r'\d+ \((.+)\)')

    info: Dict[str, Optional[str]] = {'ipAddress': None,
                                      'macAddress': None,
                                      'gatewayAddress': None,
                                      'state': None,
                                      'type': None}
    fields = ['GENERAL.HWADDR', 'IP4.ADDRESS',
              'IP4.GATEWAY', 'GENERAL.TYPE', 'GENERAL.STATE']
    # Note on this specific command: Most nmcli commands default to a tabular
    # output mode, where if there are multiple things to pull a couple specific
    # fields from it you’ll get a table where rows are, say, connections, and
    # columns are field name. However, specifically ‘con show <con-name>‘ and
    # ‘dev show <dev-name>’ default to a multiline representation, and even if
    # explicitly ask for it to be tabular, it’s not quite the same as the other
    # commands. So we have to special-case the parsing.
    res, err = await _call(['--mode', 'multiline',
                            '--escape', 'no',
                            '--terse', '--fields', ','.join(fields),
                            'dev', 'show', which_iface.value])

    field_map = {}
    for line in res.split('\n'):
        # pull the key (without brackets) and the value out of the line
        match = _DEV_INFO_LINE_RE.fullmatch(line)
        if match is None:
            raise ValueError(
                "Bad nmcli result; out: {}; err: {}".format(res, err))
        key, val = match.groups()
        # nmcli can put "--" instead of "" for None
        field_map[key] = None if val == '--' else val

    info['macAddress'] = field_map.get('GENERAL.HWADDR')
    info['ipAddress'] = field_map.get('IP4.ADDRESS')
    info['gatewayAddress'] = field_map.get('IP4.GATEWAY')
    info['type'] = field_map.get('GENERAL.TYPE')
    state_val = field_map.get('GENERAL.STATE')

    if state_val:
        state_match = _IFACE_STATE_RE.fullmatch(state_val)
        if state_match:
            info['state'] = state_match.group(1)

    return info


async def _call(cmd: List[str], suppress_err: bool = False) -> Tuple[str, str]:
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
    if err_str and not suppress_err:
        log.warning('{}: stderr={}'.format(' '.join(sanitized), err_str))
    return out_str, err_str


def sanitize_args(cmd: List[str]) -> List[str]:
    """ Filter the command so that it no longer contains passwords
    """
    sanitized = []
    for idx, fieldname in enumerate(cmd):
        def _is_password(cmdstr):
            return 'wifi-sec.psk' in cmdstr\
                or 'password' in cmdstr.lower()
        if idx > 0 and _is_password(cmd[idx-1]):
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


# The functions that follow are designed to configure the system so that the
# paths to the keys specified in `nmcli con add`, from our perspective in
# the container, are the same as the paths to the keys from the perspective
# of the host.

# When we run nmcli, it is talking via D-bus to the NetworkManager daemon
# running in the host - not in our container. That means that all the config
# lives in the host’s /etc/NetworkManager/system-connections (you can tell
# because when we have connections up, the containers
# /etc/NetworkManager/system-connections is empty - I think it only exists
# because nmcli creates it on install). That means that file paths must be
# correct from that perspective.

# In addition, `nmcli con add` checks locally, _in the container_, that the
# paths specified as key files do indeed contain keyfiles. That means
# whatever paths we specify must be valid in the container at the time that
# we call `nmcli con add`, and valid in the host when we call `nmcli con up`
# (i.e., all the time, including when the container isn’t running). So, we
# make the paths be what the host will see, and we create a symlink in the
# container to make the path look the same here.

# This path depends on the resin app ID, which cannot be hardcoded because
# it changes based on which Resin application the robot running the code
# is in. It is also specified by Resin, which means it is given to pid 1
# and relies on pid 1 passing it to children made with execve. To make this
# path specification work whenever we run this, including if somebody is
# running it directly from a shell which _won’t_ correctly pass the data,
# we need to parse the environment of pid1.

def _get_host_data_prefix() -> str:
    return os.path.join('mnt', 'data', 'resin-data', _get_resin_app_id())


def _get_resin_app_id() -> str:
    if not config.IS_ROBOT:
        raise RuntimeError('Resin app id is only available on the pi')
    p1_env = open('/proc/1/environ').read()
    # /proc/x/environ is pretty much just the raw memory segment of the
    # process that represents its environment. It contains a
    # NUL-separated list of strings.
    app_id = re.search('RESIN_APP_ID=([^\x00]*)\x00',
                       p1_env)
    if not app_id:
        raise RuntimeError(
            'Cannot find resin app id! /proc/1/env={}'.format(p1_env))
    return app_id.group(1)


def _rewrite_key_path_to_host_path(key_path) -> str:
    resin_id = _get_resin_app_id()
    key_abspath = os.path.abspath(key_path)
    if key_abspath.startswith('/data'):
        key_relpath = os.path.relpath(key_abspath, '/data')
        key_hostpath = os.path.join('/', 'mnt', 'data', 'resin-data',
                                    resin_id, key_relpath)
        log.debug("Rewrote key path {} to {} for host"
                  .format(key_path, key_hostpath))
        return key_hostpath
    else:
        log.warning('Wifi keys that are not in /data may not work unless'
                    'they are specified in a path common to the host and'
                    ' the container')
        return key_path


def _make_host_symlink_if_necessary():
    host_data_prefix = _get_host_data_prefix()
    if not os.path.islink(_get_host_data_prefix()):
        parent = os.path.abspath(os.path.join(host_data_prefix, os.pardir))
        os.makedirs(parent, exist_ok=True)
        os.symlink('/data', host_data_prefix)
