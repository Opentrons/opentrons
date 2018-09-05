import json
import logging
import subprocess
from aiohttp import web
from opentrons.system import nmcli

log = logging.getLogger(__name__)


async def list_networks(request):
    """
    Get request will return a list of discovered ssids.
    """
    res = {"list": []}

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


async def configure(request):
    """
    Post request should include a json body specifying config information
    (see below). Robot will attempt to connect to this network and respond
    with Ok if successful or an error code if not.

    Fields in the body are:
    ssid: str Required. The SSID to connect to.
    security_type: str Optional. one of 'none', 'wpa2-psk'.
                       If not specified and
                       - psk is also not specified: assumed to be 'none'
                       - psk is specified: assumed to be 'wpa2-psk'
    psk: str Optional. The password for the network, if there is one.
    """
    result = {}

    try:
        body = await request.json()
        ssid = body.get('ssid')
        psk = body.get('psk')
        security = body.get('security_type')

        if ssid is None:
            status = 400
            message = 'Error: "ssid" string is required'
        else:
            ok, message = await nmcli.configure(ssid,
                                                security_type=security,
                                                psk=psk)
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


async def status(request):
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
        net_info = await nmcli.iface_info('wlan0')
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
