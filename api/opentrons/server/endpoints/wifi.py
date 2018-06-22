import json
import logging
import subprocess
from shlex import quote
from aiohttp import web

log = logging.getLogger(__name__)


async def list_networks(request):
    """
    Get request will return a list of discovered ssids.
    """
    res = {"list": []}

    try:
        cmd = [
            "nmcli",
            "--terse",
            "--fields",
            "ssid,signal,active",
            "device",
            "wifi",
            "list"]
        out, err = _subprocess(' '.join(cmd))
    except subprocess.CalledProcessError as e:
        res = "CalledProcessError: {}".format(e.stdout)
        status = 500
    except FileNotFoundError as e:
        res = "FileNotFoundError: {}".format(e)
        status = 500
    else:
        log.debug("'nmcli device wifi list' stdout: {}".format(out))
        if len(err) > 0:
            log.error("'nmcli device wifi list' stderr: {}".format(err))

        lines = out.split("\n")
        networks = [x.split(":") for x in lines]
        res["list"] = [
            {
                "ssid": n[0],
                "signal": int(n[1]) if n[1].isdigit() else None,
                "active": n[2].lower() == "yes"
            }
            for n in networks if len(n) >= 3
        ]
        status = 200

    return web.json_response(res, status=status)


async def configure(request):
    """
    Post request should include a json body with fields "ssid" (required) and
    "psk" (optional) for network name and password respectively. Robot will
    attempt to connect to this network and respond with Ok if successful or an
    error code if not.
    """
    result = {}

    try:
        body = await request.json()
        ssid = body.get('ssid')
        psk = body.get('psk')

        if ssid is None:
            status = 400
            message = 'Error: "ssid" string is required'
        else:
            cmd = 'nmcli device wifi connect {}'.format(quote(ssid))
            password = ' password {}'.format(quote(psk)) if psk else ''
            # some nmcli errors go to stdout (e.g. bad psk), while others go to
            # stderr (e.g. bad ssid), so we put both outputs together
            res, err = _subprocess(cmd + password)
            message = (res + err).split("\r")[-1]
            log.debug("nmcli device wifi connect -> {}".format(message))

            status = 401 if 'Error:' in message else 201
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

    Options are:
      "none" - no connection to router or network
      "portal" - device behind a captive portal and cannot reach full internet
      "limited" - connection to router but not internet
      "full" - connection to router and internet
      "unknown" - an exception occured while trying to determine status

    """
    connectivity = {"status": "unknown"}
    try:
        cmd = ["nmcli", "networking", "connectivity"]
        res, _ = _subprocess(' '.join(cmd))
        log.debug("Connectivity: {}".format(res))
        connectivity["status"] = res
        status = 200
    except subprocess.CalledProcessError as e:
        log.error("CalledProcessError: {}".format(e.stdout))
        status = 500
    except FileNotFoundError as e:
        log.error("FileNotFoundError: {}".format(e))
        status = 500

    return web.json_response(connectivity, status=status)


def _subprocess(cmd: str) -> (str, str):
    """
    Runs the command in a subprocess shell (use the string form of command,
    not the list of strings) and returns the captured stdout output.
    :param cmd: a command string to execute in a subprocess shell
    :return: (stdout, stderr)
    """
    proc = subprocess.run(
        cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out = proc.stdout.decode().strip()
    err = proc.stderr.decode().strip()
    return out, err
