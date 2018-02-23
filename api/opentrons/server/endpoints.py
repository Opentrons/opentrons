import os
import json
import logging
import asyncio
import subprocess
from time import sleep
from threading import Thread
from aiohttp import web
from opentrons import robot, __version__

log = logging.getLogger(__name__)
ENABLE_NMCLI = os.environ.get('ENABLE_NETWORKING_ENDPOINTS', '')

# TODO(mc, 2018-02-22): this naming logic is copied instead of shared
#   from compute/scripts/anounce_mdns.py
NAME = 'opentrons-{}'.format(
    os.environ.get('RESIN_DEVICE_NAME_AT_INIT', 'dev'))


async def health(request):
    res = {
        'name': NAME,
        'api_version': __version__,
        'fw_version': robot.fw_version
    }
    return web.json_response(
        headers={'Access-Control-Allow-Origin': '*'},
        body=json.dumps(res))


async def wifi_list(request):
    """
    Get request will return a list of discovered ssids.

    If the environment variable ENABLE_NETWORKING_ENDPOINTS is set, this list
    is discovered using `nmcli`. If it is not set, then a dummy list of strings
    is returned. The environment variable will be set on the robot running the
    server, but will not be set during development on a laptop, or while
    running the server during test on CI.
    """
    res = {"list": []}
    if ENABLE_NMCLI:
        try:
            proc = subprocess.run(["nmcli", "--terse",
                                   "--fields", "ssid,signal,active",
                                   "device", "wifi", "list"],
                                  stdout=subprocess.PIPE)
        except subprocess.CalledProcessError as e:
            res = "CalledProcessError: {}".format(e.stdout)
        except FileNotFoundError as e:
            res = "FileNotFoundError: {}".format(e)
        else:
            lines = proc.stdout.decode().split("\n")
            networks = [x.split(":") for x in lines]
            res["list"] = [
                {
                    "ssid": n[0],
                    "signal": int(n[1]) if n[1].isdigit() else None,
                    "active": n[2].lower() == "yes"
                }
                for n in networks if len(n) >= 3
            ]
    else:
        res["list"] = [
            {"ssid": "a", "signal": 42, "active": True},
            {"ssid": "b", "signal": 43, "active": False},
            {"ssid": "c", "signal": None, "active": False}
        ]

    # TODO(mc, 2019-02-20): return error status code if error
    return web.json_response(res)


async def wifi_configure(request):
    """
    Post request should include a json body with fields "ssid" and "psk" for
    network name and password respectively. Robot will attempt to connect to
    this network and respond with Ok if successful or an error code if not.

    If the environment variable ENABLE_NETWORKING_ENDPOINTS is set, this is
    perfomed using `nmcli`. If it is not set, then a dummy status is returned.
    The environment variable will be set on the robot running the server, but
    will not be set during development on a laptop, or while running the server
    during test on CI.
    """
    result = {}
    try:
        body = await request.text()
        jbody = json.loads(body)
        ssid = jbody['ssid']
        psk = jbody['psk']
    except Exception as e:
        result = "Error: {}, type: {}".format(e, type(e))
        log.warning(result)
    else:
        message = ''
        if ENABLE_NMCLI:
            cmd = 'nmcli device wifi connect {} password "{}"'.format(
                ssid, psk)
            proc = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE)
            # TODO(mc, 2019-02-20): check this string for success or failure
            #   nmcli success: "Device 'wlan0' successfully activated..."
            message = proc.stdout.decode().strip().split("\r")[-1]
        else:
            message = "Configuration successful. PSK: '{}'".format(psk)

        result = {'ssid': ssid, 'message': message}

    log.info("Wifi configure result: {}".format(result))

    # TODO(mc, 2019-02-20): return error status code if error
    return web.json_response(result)


async def wifi_status(request):
    """
    Get request will return the status of the wifi connection from the
    RaspberryPi to the internet.

    Options are:
      "none" - no connection to router or network
      "portal" - device behind a captive portal and cannot reach full internet
      "limited" - connection to router but not internet
      "full" - connection to router and internet
      "unknown" - an exception occured while trying to determine status

    If the environment variable ENABLE_NETWORKING_ENDPOINTS is set, this list
    is discovered using `nmcli`. If it is not set, then "testing" is returned.
    The environment variable will be set on the robot running the server, but
    will not be set during development on a laptop, or while running the server
    during test on CI.
    """
    connectivity = {"status": "unknown"}
    if ENABLE_NMCLI:
        try:
            proc = subprocess.run(["nmcli", "networking", "connectivity"],
                                  stdout=subprocess.PIPE)
            res = proc.stdout.decode().strip()
            log.debug("Connectivity: {}".format(res))
            connectivity["status"] = res
        except subprocess.CalledProcessError as e:
            log.error("CalledProcessError: {}".format(e.stdout))
        except FileNotFoundError as e:
            log.error("FileNotFoundError: {}".format(e))
    else:
        connectivity['status'] = "testing"

    # TODO(mc, 2019-02-20): return error status code if error
    return web.json_response(connectivity)


async def _install(filename, loop):
    proc = await asyncio.create_subprocess_shell(
        'pip install --upgrade --force-reinstall --no-deps {}'.format(
            filename),
        stdout=asyncio.subprocess.PIPE,
        loop=loop)

    rd = await proc.stdout.read()
    res = rd.decode().strip()
    print(res)
    await proc.wait()
    return res


async def update_api(request):
    """
    This handler accepts a POST request with Content-Type: multipart/form-data
    and a file field in the body named "whl". The file should be a valid Python
    wheel to be installed. The received file is install using pip, and then
    deleted and a success code is returned.
    """
    log.debug('Update request received')
    data = await request.post()
    filename = data['whl'].filename
    log.info('Preparing to install: {}'.format(filename))
    content = data['whl'].file.read()

    with open(filename, 'wb') as wf:
        wf.write(content)

    res = await _install(filename, request.loop)
    log.debug('Install complete')
    try:
        os.remove(filename)
    except OSError:
        pass
    log.debug("Result: {}".format(res))
    return web.json_response({
        'message': res,
        'filename': filename
    })


async def restart(request):
    """
    Returns OK, then waits approximately 3 seconds and restarts container
    """
    def wait_and_restart():
        log.info('Restarting server')
        sleep(3)
        os.system('kill 1')
    Thread(target=wait_and_restart).start()
    return web.json_response({"message": "restarting"})


async def identify(request):
    Thread(target=lambda: robot.identify(
        int(request.query.get('seconds', '10')))).start()
    return web.json_response({"message": "identifying"})


async def turn_on_rail_lights(request):
    robot.turn_on_rail_lights()
    return web.json_response({"lights": "on"})


async def turn_off_rail_lights(request):
    robot.turn_off_rail_lights()
    return web.json_response({"lights": "off"})
