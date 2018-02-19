import os
import json
import logging
import subprocess
from threading import Thread
from aiohttp import web
from opentrons import robot, __version__

log = logging.getLogger(__name__)
ENABLE_NMCLI = os.environ.get('ENABLE_NETWORKING_ENDPOINTS', '')


async def health(request):
    res = {
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

    return web.json_response(
        body=json.dumps(res)
    )


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
    result = '...'
    try:
        body = await request.text()
        jbody = json.loads(body)
    except Exception as e:
        result = "Error: {}, type: {}".format(e, type(e))
        log.warning(result)
    else:
        if ENABLE_NMCLI:
            cmd = 'nmcli device wifi connect {} password "{}"'.format(
                jbody['ssid'], jbody['psk'])
            proc = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE)
            result = proc.stdout.decode().strip().split("\r")[-1]
        else:
            result = "Configuration successful. SSID: {}, PSK: {}".format(
                jbody['ssid'], jbody['psk'])
    log.info("Wifi configure result: {}".format(result))
    return web.Response(text=result)


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
    return web.json_response(
        body=json.dumps(connectivity)
    )


async def identify(request):
    Thread(target=lambda: robot.identify(
        int(request.query.get('seconds', '10')))).run()
    return web.Response(text='Ok')


async def turn_on_rail_lights(request):
    robot.turn_on_rail_lights()
    return web.Response(text='Ok')


async def turn_off_rail_lights(request):
    robot.turn_off_rail_lights()
    return web.Response(text='Ok')
