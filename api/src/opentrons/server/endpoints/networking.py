import json
import logging
import os
import subprocess
from typing import Dict, Any
from aiohttp import web
from opentrons.system import nmcli, wifi

log = logging.getLogger(__name__)


class DisconnectArgsError(Exception):
    pass


async def list_networks(request: web.Request) -> web.Response:
    """
    Get request will return a list of discovered ssids:

    GET /wifi/list

    200 OK
    { "list": [
        {
           ssid: string // e.g. "linksys", name to connect to
           signal: int // e.g. 100; arbitrary signal strength, more is better
           active: boolean // e.g. true; whether there is a connection active
           security: str // e.g. "WPA2 802.1X" raw nmcli security type output
           securityType: str // e.g. "wpa-eap"; see below
        }
      ]
    }

    The securityType field contains a value suitable for passing to the
    securityType argument of /configure, or 'unsupported'. The security
    field is mostly useful for debugging if you are unable to connect to
    the network even though you think you are using the correct security
    type.
    """
    try:
        networks = await nmcli.available_ssids()
    except RuntimeError as e:
        return web.json_response({'message': ' '.join(e.args)}, status=500)
    else:
        return web.json_response({'list': networks}, status=200)


def _deduce_security(kwargs) -> nmcli.SECURITY_TYPES:
    """ Make sure that the security_type is known, or throw. """
    # Security should be one of our valid strings
    sec_translation = {
        'wpa-psk': nmcli.SECURITY_TYPES.WPA_PSK,
        'none': nmcli.SECURITY_TYPES.NONE,
        'wpa-eap': nmcli.SECURITY_TYPES.WPA_EAP,
    }
    if not kwargs.get('securityType'):
        if kwargs.get('psk') and kwargs.get('eapConfig'):
            raise wifi.ConfigureArgsError(
                'Cannot deduce security type: psk and eap both passed')
        elif kwargs.get('psk'):
            kwargs['securityType'] = 'wpa-psk'
        elif kwargs.get('eapConfig'):
            kwargs['securityType'] = 'wpa-eap'
        else:
            kwargs['securityType'] = 'none'
    try:
        return sec_translation[kwargs['securityType']]
    except KeyError:
        raise wifi.ConfigureArgsError(
            'securityType must be one of {}'
                .format(','.join(sec_translation.keys())))


def _check_configure_args(configure_args: Dict[str, Any]) -> Dict[str, Any]:
    """ Check the arguments passed to configure.

    Raises an exception on failure. On success, returns a dict of
    configure_args with any necessary mutations.
    """
    # SSID must always be present
    if not configure_args.get('ssid')\
       or not isinstance(configure_args['ssid'], str):
        raise wifi.ConfigureArgsError("SSID must be specified")
    # If specified, hidden must be a bool
    if not configure_args.get('hidden'):
        configure_args['hidden'] = False
    elif not isinstance(configure_args['hidden'], bool):
        raise wifi.ConfigureArgsError('If specified, hidden must be a bool')

    configure_args['securityType'] = _deduce_security(configure_args)

    # If we have wpa2-personal, we need a psk
    if configure_args['securityType'] == nmcli.SECURITY_TYPES.WPA_PSK:
        if not configure_args.get('psk'):
            raise wifi.ConfigureArgsError(
                'If securityType is wpa-psk, psk must be specified')
        return configure_args

    # If we have wpa2-enterprise, we need eap config, and we need to check
    # it
    if configure_args['securityType'] == nmcli.SECURITY_TYPES.WPA_EAP:
        if not configure_args.get('eapConfig'):
            raise wifi.ConfigureArgsError(
                'If securityType is wpa-eap, eapConfig must be specified')
        configure_args['eapConfig']\
            = wifi.eap_check_config(configure_args['eapConfig'])
        return configure_args

    # If we’re still here we have no security and we’re done
    return configure_args


async def configure(request: web.Request) -> web.Response:
    """
    Post request should include a json body specifying config information
    (see below). Robot will attempt to connect to this network and respond
    with Ok if successful or an error code if not.

    Fields in the body are:
    ssid: str Required. The SSID to connect to.
    securityType: str Optional. one of 'none', 'wpa-psk', 'wpa-eap.
                      If not specified and
                      - psk is also not specified: assumed to be 'none'
                      - psk is specified: assumed to be 'wpa-psk'
    psk: str Optional. The password for the network, if there is one.
    hidden: bool Optional. True if the network is not broadcasting its
                           SSID. If not specified, assumed to be False.
    eapConfig: dict Optional. Configuration for WPA-EAP, required if
                    securityType is wpa-eap. Should follow the format
                    described by /wifi/eap-options, e.g.
                    {
                        "eapType": <valid eap method>,
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
        configure_kwargs = _check_configure_args(body)
    except wifi.ConfigureArgsError as e:
        return web.json_response({'message': str(e)}, status=400)

    try:
        ok, message = await nmcli.configure(**configure_kwargs)
        log.debug("Wifi configure result: {}".format(message))
    except ValueError as ve:
        return web.json_response({'message': str(ve)}, status=400)
    except TypeError as te:
        # Indicates an unexpected kwarg; check is done here to avoid keeping
        # the _check_configure_args signature up to date with nmcli.configure
        return web.json_response({'message': str(te)}, status=400)

    if ok:
        return web.json_response({'message': message,
                                  'ssid': configure_kwargs['ssid']},
                                 status=201)
    else:
        return web.json_response({'message': message}, status=401)


async def disconnect(request: web.Request) -> web.Response:
    """
    Post request should include a json body specifying the ssid to disconnect
    the robot from.
    Robot will attempt to disconnect from the specified wifi ssid and
    on successful disconnect, will remove ssid from connection list.
    It will respond with an OK if it successfully disconnects from wifi
    and an error code if it is unsuccessful. If it disconnects successfully
    but fails to delete the ssid from list, it will respond with an OK with
    error code of 207 for multi-status.

    """
    try:
        body = await request.json()
    except json.JSONDecodeError as e:
        log.exception("Error: JSONDecodeError in "
                      "/wifi/disconnect: {}".format(e))
        return web.json_response({'message': e.msg}, status=400)

    ssid = body.get('ssid')
    try:
        # SSID must always be present
        if not ssid or not isinstance(ssid, str):
            raise DisconnectArgsError("SSID must be specified as a string")
    except DisconnectArgsError as e:
        return web.json_response({'message': str(e)}, status=400)

    try:
        ok, message = await nmcli.wifi_disconnect(ssid)
    except Exception as excep:
        return web.json_response({'message': str(excep)}, status=500)

    response = {'message': message}
    if ok:
        stat = 200 if 'successfully deleted' in message else 207
    else:
        stat = 500
    return web.json_response(response, status=stat)


async def status(request: web.Request) -> web.Response:
    """
    Get request will return the status of the machine's connection to the
    internet as well as the status of its network interfaces.

    The body of the response is a json dict containing

    'status': internet connectivity status, where the options are:
      "none" - no connection to router or network
      "portal" - device behind a captive portal and cannot reach full internet
      "limited" - connection to router but not internet
      "full" - connection to router and internet
      "unknown" - an exception occured while trying to determine status
    'interfaces': JSON object of networking interfaces, keyed by device name,
    where the value of each entry is another object with the keys:
      - 'type': "ethernet" or "wifi"
      - 'state': state string, e.g. "disconnected", "connecting", "connected"
      - 'ipAddress': the ip address, if it exists (null otherwise); this also
        contains the subnet mask in CIDR notation, e.g. 10.2.12.120/16
      - 'macAddress': the MAC address of the interface device
      - 'gatewayAddress': the address of the current gateway, if it exists
        (null otherwise)


    Example request:
    ```
    GET /networking/status
    ```

    Example response:
    ```
    200 OK
    {
        "status": "full",
        "interfaces": {
            "wlan0": {
                "ipAddress": "192.168.43.97/24",
                "macAddress": "B8:27:EB:6C:95:CF",
                "gatewayAddress": "192.168.43.161",
                "state": "connected",
                "type": "wifi"
            },
            "eth0": {
                "ipAddress": "169.254.229.173/16",
                "macAddress": "B8:27:EB:39:C0:9A",
                "gatewayAddress": null,
                "state": "connected",
                "type": "ethernet"
            }
        }
    }
    ```
    """
    connectivity = {'status': 'none', 'interfaces': {}}
    try:
        connectivity['status'] = await nmcli.is_connected()
        connectivity['interfaces'] = {
            i.value: await nmcli.iface_info(i) for i in nmcli.NETWORK_IFACES
        }
        log.debug("Connectivity: {}".format(connectivity['status']))
        log.debug("Interfaces: {}".format(connectivity['interfaces']))
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
    if not request.can_read_body:
        return web.json_response({'message': "Must upload key file"},
                                 status=400)
    data = await request.post()
    keyfile = data.get('key')
    if not keyfile:
        return web.json_response(
            {'message': "No key 'key' in request"}, status=400)

    add_key_result = wifi.add_key(keyfile.filename, keyfile.file.read())

    response_body = {
        'uri': '/wifi/keys/{}'.format(add_key_result.key.directory),
        'id': add_key_result.key.directory,
        'name': os.path.basename(add_key_result.key.file)
    }
    if add_key_result.created:
        return web.json_response(response_body, status=201)
    else:
        response_body['message'] = 'Key file already present'
        return web.json_response(response_body, status=200)


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
    keys = [
        {'uri': '/wifi/keys/{}'.format(key.directory),
         'id': key.directory,
         'name': os.path.basename(key.file)} for key in wifi.list_keys()
    ]
    return web.json_response({'keys': keys}, status=200)


async def remove_key(request: web.Request) -> web.Response:
    """ Remove a key.

    ```
    DELETE /wifi/keys/:id

    -> 200 OK
    {message: 'Removed key keyfile.pem'}
    ```
    """
    requested_hash = request.match_info['key_uuid']
    deleted_file = wifi.remove_key(requested_hash)
    if not deleted_file:
        return web.json_response(
            {'message': f"No such key file {requested_hash}"}, status=404)
    return web.json_response(
        {'message': f'Key file {deleted_file} deleted'},
        status=200)


async def eap_options(request: web.Request) -> web.Response:
    """ Get request returns the available configuration options for WPA-EAP.

    Because the options for connecting to WPA-EAP secured networks are quite
    complex, to avoid duplicating logic this endpoint returns a json object
    describing the structure of arguments and options for the eap_config arg to
    /wifi/configure.

    The object is shaped like this:
    {
        options: [ // Supported EAP methods and their options. One of these
                   // method names must be passed in the eapConfig dict
            {
                name: str // i.e. TTLS-EAPMSCHAPv2. Should be in the eapType
                          // key of eapConfig when sent to /configure.
                options: [
                    {
                     name: str // i.e. "username"
                     displayName: str // i.e. "Username"
                     required: bool,
                     type: str
                   }
                ]
            }
        ]
    }


    The ``type`` keys denote the semantic kind of the argument. Valid types
    are:

    password: This is some kind of password. It may be a psk for the network,
              an Active Directory password, or the passphrase for a private key
    string:   A generic string; perhaps a username, or a subject-matches
              domain name for server validation
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
        eapConfig : {
            eapType: "TTLS/EAP-TLS",  // One of the method options
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
    return web.json_response(wifi.EAP_CONFIG_SHAPE, status=200)
