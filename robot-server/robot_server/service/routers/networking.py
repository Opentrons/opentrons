import logging
import typing
import subprocess
from http import HTTPStatus

from fastapi import APIRouter, HTTPException, File, Path
from opentrons.system import nmcli
from robot_server.service.models import V1ErrorMessage
from robot_server.service.models.networking import NetworkingStatus, \
    WifiNetworks, WifiNetworkFull, WifiConfiguration, \
    WifiConfigurationResponse, WifiKeyFiles, WifiKeyFile, EapOptions, \
    WifiNetwork


log = logging.getLogger(__name__)


router = APIRouter()


@router.get("/networking/status",
            description="Query the current network connectivity state",
            summary="Gets information about the OT-2's network interfaces "
                    "including their connectivity, their "
                    "addresses, and their networking info",
            response_model=NetworkingStatus)
async def get_networking_status() -> NetworkingStatus:

    try:
        connectivity = await nmcli.is_connected()
        interfaces = {i.value: await nmcli.iface_info(i)
                      for i in nmcli.NETWORK_IFACES}
        log.debug("Connectivity: %s", connectivity)
        log.debug("Interfaces: %s", interfaces)
        return NetworkingStatus(status=connectivity, interfaces=interfaces)
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError) as e:
        log.error("Failed calling nmcli")
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, str(e))


@router.get("/wifi/list",
            description="Scan for visible WiFi networks",
            summary="Scans for beaconing WiFi networks and returns the list of"
                    " visible ones along with some data about their security "
                    "and strength",
            response_model=WifiNetworks)
async def get_wifi_networks() -> WifiNetworks:
    networks = await nmcli.available_ssids()
    return WifiNetworks(list=[WifiNetworkFull(**n) for n in networks])


@router.post("/wifi/configure",
             description="Configure the OT-2's WiFi",
             summary="Configures the wireless network interface to connect to"
                     " a network",
             response_model=WifiConfigurationResponse,
             responses={HTTPStatus.CREATED: {
                 "model": WifiConfigurationResponse
             }})
async def post_wifi_configurution(configuration: WifiConfiguration)\
        -> WifiConfigurationResponse:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.get("/wifi/keys",
            description="Get a list of key files known to the system",
            response_model=WifiKeyFiles)
async def get_wifi_keys() -> WifiKeyFiles:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/wifi/keys",
             description="Send a new key file to the OT-2",
             responses={HTTPStatus.CREATED: {"model": WifiKeyFile}},
             response_model=WifiKeyFile)
async def post_wifi_key(key: bytes = File(...)) -> WifiKeyFile:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.delete("/wifi/keys/{key_uuid}",
               description="Delete a key file from the OT-2",
               responses={HTTPStatus.NOT_FOUND: {"model": V1ErrorMessage}},
               response_model=V1ErrorMessage)
async def delete_wifi_key(
        key_uuid: str = Path(...,
                             description="The ID of key to delete, as "
                                         "determined by a previous call to GET"
                                         " /wifi/keys"))\
        -> V1ErrorMessage:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.get("/wifi/eap-options",
            description="Get the supported EAP variants and their "
                        "configuration parameters",
            response_model=EapOptions)
async def get_eap_options() -> EapOptions:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")


@router.post("/wifi/disconnect",
             description="Disconnect the OT-2 from WiFi network",
             summary="Deactivates the wifi connection and removes it from "
                     "known connections",
             response_model=V1ErrorMessage,
             responses={HTTPStatus.MULTI_STATUS: {
                 "model": V1ErrorMessage
             }})
async def post_wifi_disconnect(wifi_ssid: WifiNetwork) -> V1ErrorMessage:
    raise HTTPException(HTTPStatus.NOT_IMPLEMENTED, "not implemented")
