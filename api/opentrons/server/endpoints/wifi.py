import hashlib
import json
import logging
import os
import shutil
import subprocess
from typing import Dict, List
from aiohttp import web
from opentrons.system import nmcli
from opentrons.util import environment

log = logging.getLogger(__name__)


async def list_networks(request: web.Request) -> web.Response:
    """
    Get request will return a list of discovered ssids.
    """
    res: Dict[str, List[str]] = {"list": []}

    try:
        networks = await nmcli.available_ssids()
    except subprocess.CalledProcessError as e:
        res = "CalledProcessError: {}".format(e.stdout)
        status = 500
    except FileNotFoundError as e:
        res = "FileNotFoundError: {}".format(e)
        status = 500
    else:
        res["list"] = networks
        status = 200

    return web.json_response(res, status=status)


async def configure(request: web.Request) -> web.Response: # noqa(C901)
    # Skipping complexity test due to planned work
    """
    Post request should include a json body specifying config information
    (see below). Robot will attempt to connect to this network and respond
    with Ok if successful or an error code if not.

    Fields in the body are:
    ssid: str Required. The SSID to connect to.
    security_type: str Optional. one of 'none', 'wpa-psk'.
                       If not specified and
                       - psk is also not specified: assumed to be 'none'
                       - psk is specified: assumed to be 'wpa-psk'
    psk: str Optional. The password for the network, if there is one.
    hidden: bool Optional. True if the network is not broadcasting its
                           SSID. If not specified, assumed to be False.
    """
    result = {}
    sec_translation = {
        'wpa-psk': nmcli.SECURITY_TYPES.WPA_PSK,
        'none': nmcli.SECURITY_TYPES.NONE,
        None: nmcli.SECURITY_TYPES.NONE
    }
    try:
        body = await request.json()
        ssid = body.get('ssid')
        psk = body.get('psk')
        hidden = body.get('hidden')
        security = body.get('security_type')
        status = 200

        if ssid is None:
            status = 400
            message = 'Error: "ssid" string is required'
        try:
            checked_sec = sec_translation[security]
        except KeyError:
            status = 400
            message = 'Error: security type "{}" is invalid'.format(security)

        if status == 200:
            try:
                ok, message = await nmcli.configure(ssid,
                                                    security_type=checked_sec,
                                                    psk=psk,
                                                    hidden=hidden)
            except ValueError as ve:
                status = 400
                message = str(ve)
            else:
                status = 201 if ok else 401
            result['ssid'] = ssid

    except json.JSONDecodeError as e:
        log.debug("Error: JSONDecodeError in /wifi/configure: {}".format(e))
        status = 400
        message = e.msg

    except Exception as e:
        log.warning("Error: {} in /wifi/configure': {}".format(type(e), e))
        status = 500
        message = 'An unexpected error occurred.'

    result['message'] = message
    log.debug("Wifi configure result: {}".format(result))
    return web.json_response(data=result, status=status)


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
