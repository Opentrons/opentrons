import hashlib
import json
import logging
import os
import shutil
import subprocess
from typing import Dict, Any, List
from aiohttp import web
from opentrons.system import nmcli
from opentrons.util import environment

log = logging.getLogger(__name__)

EAP_CONFIG_SHAPE = {
    'options': [
        {
            'name': 'eapType',
            'friendlyName': 'EAP Type',
            'required': True,
            'type': 'choice',
            'choices': [t.qualified_name() for t in nmcli.EAP_TYPES]
        }
    ],
    'methods': [
        {'name': method.qualified_name(),
         'options': [{k: v for k, v in arg.items()
                      if k in ['name',
                               'friendlyName',
                               'required',
                               'type',
                               'choices',
                               'fileType']}
                     for arg in method.args()]}
        for method in nmcli.EAP_TYPES]
}


class ConfigureArgsError(Exception):
    def __init__(self, message):
        self.msg = message
        super().__init__()


async def list_networks(request: web.Request) -> web.Response:
    """
    Get request will return a list of discovered ssids.
    """
    try:
        networks = await nmcli.available_ssids()
    except RuntimeError as e:
        return web.json_response({'message': ' '.join(e.args)}, status=500)
    else:
        return web.json_response({'list': networks}, status=200)


def _get_key_file(arg: str) -> str:
    keys_dir = environment.get_path('WIFI_KEYS_DIR')
    available_keys = os.listdir(keys_dir)
    if arg not in available_keys:
        raise ConfigureArgsError('Key ID {} is not valid on the system'
                                 .format(arg))
    files_in_dir = os.listdir(os.path.join(keys_dir, arg))
    if len(files_in_dir) > 1:
        raise OSError(
            'Key ID {} has multiple files, try deleting and reuploading'
            .format(arg))
    return os.path.join(keys_dir, arg, files_in_dir[0])


def _eap_check_no_extra_args(
        config: Dict[str, Any], options: Any):
    # options is an Any because the type annotation for EAP_CONFIG_SHAPE itself
    # can’t quite express the type properly because of the inference from the
    # dict annotation.
    """Check for args that are not required for this method (to aid debugging)
    ``config`` should be the user config.
    ``options`` should be the options submember for the eap method.

    Before this method is called, the validity of the 'eapType' key should be
    established.
    """
    arg_names = [k for k in config.keys() if k != 'eapType']
    valid_names = [o['name'] for o in options]
    for an in arg_names:
        if an not in valid_names:
            raise ConfigureArgsError(
                'Option {} is not valid for EAP method {}'
                .format(an, config['eapType']))


def _eap_check_option_ok(opt: Dict[str, str], config: Dict[str, Any]):
    """ Check that a given EAP option is in the user config (if required)
     and, if specified, is the right type.

    ``opt`` should be an options dict from EAP_CONFIG_SHAPE.
    ``config`` should be the user config dict.

    Before this method is called, the validity of the eapType key should be
    established.
    """
    if opt['name'] not in config:
        if opt['required']:
            raise ConfigureArgsError(
                'Required argument {} for eap method {} not present'
                .format(opt['friendlyName'], config['eapType']))
        else:
            return
    name = opt['name']
    o_type = opt['type']
    arg = config[name]
    if name in config:
        if o_type in ('str', 'password') and not isinstance(arg, str):
            raise ConfigureArgsError('Option {} should be a str'
                                     .format(name))
        elif o_type == 'choice' and arg not in opt['choices']:
            raise ConfigureArgsError('Option {} must be one of {}'
                                     .format(name,
                                             ','.join(opt['choices'])))
        elif o_type == 'bool' and not isinstance(arg, bool):
            raise ConfigureArgsError('Option {} must be a bool'
                                     .format(name))
        elif o_type == 'file' and not isinstance(arg, str):
            raise ConfigureArgsError('Option {} must be a str'
                                     .format(name))


def _eap_check_config(eap_config: Dict[str, Any]) -> Dict[str, Any]:
    """ Check the eap specific args, and replace values where needed.

    Similar to _check_configure_args but for only EAP.
    """
    eap_type = eap_config.get('eapType')
    for method in EAP_CONFIG_SHAPE['methods']:
        if method['name'] == eap_type:
            options = method['options']
            break
    else:
        raise ConfigureArgsError('EAP method {} is not valid'.format(eap_type))

    _eap_check_no_extra_args(eap_config, options)

    for opt in options:  # type: ignore
        # Ignoring most types to do with EAP_CONFIG_SHAPE because of issues
        # wth type inference for dict comprehensions
        _eap_check_option_ok(opt, eap_config)
        if opt['type'] == 'file' and opt['name'] in eap_config:
            # Special work for file: rewrite from key id to path
            eap_config[opt['name']] = _get_key_file(eap_config[opt['name']])
    return eap_config


def _deduce_security(kwargs) -> nmcli.SECURITY_TYPES:
    """ Make sure that the security_type is known, or throw. """
    # Security should be one of our valid strings
    sec_translation = {
        'wpa-psk': nmcli.SECURITY_TYPES.WPA_PSK,
        'none': nmcli.SECURITY_TYPES.NONE,
        'wpa-eap': nmcli.SECURITY_TYPES.WPA_EAP,
    }
    if not kwargs.get('security_type'):
        if kwargs.get('psk') and kwargs.get('eap_config'):
            raise ConfigureArgsError(
                'Cannot deduce security type: psk and eap both passed')
        elif kwargs.get('psk'):
            kwargs['security_type'] = 'wpa-psk'
        elif kwargs.get('eap_config'):
            kwargs['security_type'] = 'wpa-eap'
        else:
            kwargs['security_type'] = 'none'
    try:
        return sec_translation[kwargs['security_type']]
    except KeyError:
        raise ConfigureArgsError('security_type must be one of {}'
                                 .format(','.join(sec_translation.keys())))


def _check_configure_args(**kwargs) -> Dict[str, Any]:
    """ Check the arguments passed to configure.

    Raises an exception on failure. On success, returns a dict of
    kwargs with any necessary mutations.
    """
    # SSID must always be present
    if not kwargs.get('ssid') or not isinstance(kwargs['ssid'], str):
        raise ConfigureArgsError("SSID must be specified")
    # If specified, hidden must be a bool
    if not kwargs.get('hidden'):
        kwargs['hidden'] = False
    elif not isinstance(kwargs['hidden'], bool):
        raise ConfigureArgsError('If specified, hidden must be a bool')

    kwargs['security_type'] = _deduce_security(kwargs)

    # If we have wpa2-personal, we need a psk
    if kwargs['security_type'] == nmcli.SECURITY_TYPES.WPA_PSK:
        if not kwargs.get('psk'):
            raise ConfigureArgsError(
                'If security_type is wpa-psk, psk must be specified')
        return kwargs

    # If we have wpa2-enterprise, we need eap config, and we need to check
    # it
    if kwargs['security_type'] == nmcli.SECURITY_TYPES.WPA_EAP:
        if not kwargs.get('eap_config'):
            raise ConfigureArgsError(
                'If security_type is wpa-eap, eap_config must be specified')
        kwargs['eap_config'] = _eap_check_config(kwargs['eap_config'])
        return kwargs

    # If we’re still here we have no security and we’re done
    return kwargs


async def configure(request: web.Request) -> web.Response:
    """
    Post request should include a json body specifying config information
    (see below). Robot will attempt to connect to this network and respond
    with Ok if successful or an error code if not.

    Fields in the body are:
    ssid: str Required. The SSID to connect to.
    security_type: str Optional. one of 'none', 'wpa-psk', 'wpa-eap.
                       If not specified and
                       - psk is also not specified: assumed to be 'none'
                       - psk is specified: assumed to be 'wpa-psk'
    psk: str Optional. The password for the network, if there is one.
    hidden: bool Optional. True if the network is not broadcasting its
                           SSID. If not specified, assumed to be False.
    eap_config: dict Optional. Configuration for WPA-EAP, required if
                     security_type is wpa-eap. Should follow the format
                     described by /wifi/eapoptions, e.g.
                     {
                         "method": <valid eap method>,
                         "valid-eap-option1": arg,
                         ...
                         "valid-eap-optionN": arg
                     }
                     The types of the options should be as specified in
                     /wifi/eapoptions. If the type is "file", the value
                     should be a string containing the id of a previously
                     uploaded key.
    """
    try:
        body = await request.json()
    except json.JSONDecodeError as e:
        log.debug("Error: JSONDecodeError in /wifi/configure: {}".format(e))
        return web.json_response({'message': e.msg}, status=400)

    try:
        configure_kwargs = _check_configure_args(**body)
    except ConfigureArgsError as e:
        return web.json_response({'message': e.msg}, status=400)
    except TypeError as te:  # Indicates an unexpected kwarg
        return web.json_response({'message': str(te)}, status=400)

    try:
        ok, message = await nmcli.configure(**configure_kwargs)
        log.debug("Wifi configure result: {}".format(message))
    except ValueError as ve:
        return web.json_response({'message': str(ve)}, status=400)

    if ok:
        return web.json_response({'message': message,
                                  'ssid': configure_kwargs['ssid']},
                                 status=201)
    else:
        return web.json_response({'message': message}, status=401)


async def status(request: web.Request) -> web.Response:
    """
    Get request will return the status of the wifi connection from the
    RaspberryPi to the internet.

    The body of the response is a json dict containing

    'status': connectivity status, where the options are:
      "none" - no connection to router or network
      "portal" - device behind a captive portal and cannot reach full internet
      "limited" - connection to router but not internet
      "full" - connection to router and internet
      "unknown" - an exception occured while trying to determine status
    'ipAddress': the ip address, if it exists (null otherwise); this also
                 contains the subnet mask in CIDR notation, e.g. 10.2.12.120/16
    'macAddress': the mac address
    'gatewayAddress': the address of the current gateway, if it exists (null
                      otherwise)
    """
    connectivity = {'status': 'none',
                    'ipAddress': None,
                    'macAddress': 'unknown',
                    'gatewayAddress': None}
    try:
        connectivity['status'] = await nmcli.is_connected()
        net_info = await nmcli.iface_info(nmcli.NETWORK_IFACES.WIFI)
        connectivity.update(net_info)
        log.debug("Connectivity: {}".format(connectivity['status']))
        status = 200
    except subprocess.CalledProcessError as e:
        log.error("CalledProcessError: {}".format(e.stdout))
        status = 500
    except FileNotFoundError as e:
        log.error("FileNotFoundError: {}".format(e))
        status = 500

    return web.json_response(connectivity, status=status)


async def add_key(request: web.Request) -> web.Response:
    """ Add a key file (for later use in EAP config) to the system.

    ```
    POST /wifi/keys Content-Type: multipart/form-data,
    Body:
        file field named 'key'
    ```
    returns
    ```
    201 Created
    {
     uri: '/wifi/keys/some-hex-digest',
     id: 'some-hex-digest',
     name: 'keyfile.pem'
    }
    ```

    If a file with the same hash (regardless of filename) has already been
    uploaded, returns
    ```
    200 OK
    {
     uri: '/wifi/keys/some-hex-digest',
     id: 'some-hex-digest',
     name: 'keyfile.pem',
     message: "Key file already present"
    }
    ```
    """
    keys_dir = environment.get_path('WIFI_KEYS_DIR')
    if not request.can_read_body:
        return web.json_response({'message': "Must upload key file"},
                                 status=400)
    data = await request.post()
    keyfile = data.get('key')
    if not keyfile:
        return web.json_response(
            {'message': "No key 'key' in request"}, status=400)
    hasher = hashlib.sha256()
    key_contents = keyfile.file.read()
    hasher.update(key_contents)
    key_hash = hasher.hexdigest()
    if key_hash in os.listdir(keys_dir):
        files = os.listdir(os.path.join(keys_dir, key_hash))
        if files:
            return web.json_response(
                {'message': 'Key file already present',
                 'uri': '/wifi/keys/{}'.format(key_hash),
                 'id': key_hash,
                 'name': files[0]},
                status=200)
        else:
            log.warning(
                "Key directory with nothing in it: {}"
                .format(key_hash))
            os.rmdir(os.path.join(keys_dir, key_hash))
    key_hash_path = os.path.join(keys_dir, key_hash)
    os.mkdir(key_hash_path)
    with open(os.path.join(key_hash_path,
                           os.path.basename(keyfile.filename)), 'wb') as f:
        f.write(key_contents)
    return web.json_response(
        {'uri': '/wifi/keys/{}'.format(key_hash),
         'id': key_hash,
         'name': os.path.basename(keyfile.filename)},
        status=201)


async def list_keys(request: web.Request) -> web.Response:
    """ List the key files installed in the system.

    This responds with a list of the same objects as key:

    ```
    GET /wifi/keys -> 200 OK
    { keys: [
         {
          uri: '/wifi/keys/some-hex-digest',
          id: 'some-hex-digest',
          name: 'keyfile.pem'
         },
         ...
       ]
    }
    ```
    """
    keys_dir = environment.get_path('WIFI_KEYS_DIR')
    response: List[Dict[str, str]] = []
    for path in os.listdir(keys_dir):
        full_path = os.path.join(keys_dir, path)
        if os.path.isdir(full_path):
            in_path = os.listdir(full_path)
            if len(in_path) > 1:
                log.warning("Garbage in key dir for key {}".format(path))
            response.append(
                {'uri': '/wifi/keys/{}'.format(path),
                 'id': path,
                 'name': os.path.basename(in_path[0])})
        else:
            log.warning("Garbage in wifi keys dir: {}".format(full_path))
    return web.json_response(response, status=200)


async def remove_key(request: web.Request) -> web.Response:
    """ Remove a key.

    ```
    DELETE /wifi/keys/:id

    -> 200 OK
    {message: 'Removed key keyfile.pem'}
    ```
    """
    keys_dir = environment.get_path('WIFI_KEYS_DIR')
    available_keys = os.listdir(keys_dir)
    requested_hash = request.match_info['key_uuid']
    if requested_hash not in available_keys:
        return web.json_response(
            {'message': 'No such key file {}'
             .format(requested_hash)},
            status=404)
    key_path = os.path.join(keys_dir, requested_hash)
    name = os.listdir(key_path)[0]
    shutil.rmtree(key_path)
    return web.json_response(
        {'message': 'Key file {} deleted'.format(name)},
        status=200)


async def eap_options(request: web.Request) -> web.Response:
    """ Get request returns the available configuration options for WPA-EAP.

    Because the options for connecting to WPA-EAP secured networks are quite
    complex, to avoid duplicating logic this endpoint returns a json object
    describing the structure of arguments and options for the eap_config arg to
    /wifi/configure.

    The object is shaped like this:
    {
        options: [  // top-level options valid for any EAP configuration method
            {
                  name: str // i.e. "identity"
                  friendlyName: str // something human readable like "Username"
                  required: bool,
                  type: str,
                  choices: optional list[str]
            },
        ],
        methods: [ // Supported EAP methods and their options. One of these
                   // method names must be passed in the eap_config dict
            {
                name: str // i.e. TTLS-EAPMSCHAPv2
                options: [
                    {
                     name: str // i.e. "username"
                     friendlyName: str // i.e. "Username"
                     required: bool,
                     type: str,
                     choices: optional list[str]
                   }
                ]
            }
        ]
    }


    The ``type`` keys denore the semantic kind of the argument. Valid types
    are:

    password: This is some kind of password. It may be a psk for the network,
              an Active Directory password, or the passphrase for a private key
    str:      A generic string; perhaps a username, or a subject-matches
              domain name for server validation
    choice:   A string field with a limited number of options. If this is the
              the type of an option, the option will also have a ``choices``
              field presenting a list of valid options (as strings)
    bool:     A boolean
    file:     A file that the user must provide. This should be the id of a
              file previously uploaded via POST /wifi/keys.


    Although the arguments are described hierarchically, they should be
    specified in eap_config as a flat dict. For instance, a /configure
    invocation for TTLS/EAP-TLS might look like

    ```
    POST
    {
        ssid: "my-ssid",
        securityType: "wpa-eap",
        hidden: false,
        eap_config : {
            method: "TTLS/EAP-TLS",  // One of the method options
            identity: "alice@example.com", // And then its arguments
            anonymousIdentity: "anonymous@example.com",
            password: "testing123",
            caCert: "12d1f180f081b",
            phase2CaCert: "12d1f180f081b",
            phase2ClientCert: "009909fd9fa",
            phase2PrivateKey: "081009fbcbc"
            phase2PrivateKeyPassword: "testing321"
        }
    }
    ```
    """

    return web.json_response(EAP_CONFIG_SHAPE, status=200)
