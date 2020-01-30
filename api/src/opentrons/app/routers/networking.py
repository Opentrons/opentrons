import logging
import typing
import subprocess

from fastapi import APIRouter, HTTPException, File, Path
from opentrons.app.models import V1ErrorMessage
from opentrons.app.models.networking import NetworkingStatus, WifiNetworks, WifiNetwork, WifiConfiguration, \
    WifiConfigurationResponse, WifiKeyFiles, WifiKeyFile, EapOptions
from opentrons.system import nmcli

log = logging.getLogger(__name__)


router = APIRouter()


@router.get("/networking/status",
            description="Query the current network connectivity state",
            summary="Gets information about the OT-2's network interfaces including their connectivity, their "
                    "addresses, and their networking info",
            response_model=NetworkingStatus)
async def get_networking_status() -> NetworkingStatus:

    try:
        connectivity = await nmcli.is_connected()
        interfaces = {i.value: await nmcli.iface_info(i) for i in nmcli.NETWORK_IFACES}
        log.debug("Connectivity: %s", connectivity)
        log.debug("Interfaces: %s", interfaces)
        return NetworkingStatus(status=connectivity, interfaces=interfaces)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        log.error("Failed calling nmcli")
        raise HTTPException(500, str(e))


@router.get("/wifi/list",
            description="Scan for visible WiFi networks",
            summary="Scans for beaconing WiFi networks and returns the list of visible ones along with some data about"
                    " their security and strength",
            response_model=WifiNetworks)
async def get_wifi_networks() -> WifiNetworks:
    networks = await nmcli.available_ssids()
    return WifiNetworks(list=[WifiNetwork(**n) for n in networks])


@router.post("/wifi/configure",
             description="Configure the OT-2's WiFi",
             summary="Configures the wireless network interface to connect to a network",
             response_model=WifiConfigurationResponse,
             responses={201: {"model": WifiConfigurationResponse}})
async def post_wifi_configurution(configuration: WifiConfiguration) -> WifiConfigurationResponse:
    raise HTTPException(500, "not implemented")


@router.get("/wifi/keys",
            description="Get a list of key files known to the system",
            response_model=WifiKeyFiles)
async def get_wifi_keys() -> WifiKeyFiles:
    raise HTTPException(500, "not implemented")


@router.post("/wifi/keys",
             description="Send a new key file to the OT-2",
             responses={201: {"model": WifiKeyFile}},
             response_model=WifiKeyFile)
async def post_wifi_key(key: bytes = File(...)) -> WifiKeyFile:
    raise HTTPException(500, "not implemented")


@router.delete("/wifi/keys/{key_uuid}",
               description="Delete a key file from the OT-2",
               responses={404: {"model": V1ErrorMessage}},
               response_model=V1ErrorMessage)
async def delete_wifi_key(
        key_uuid: str=Path(...,
                           description="The ID of key to delete, as determined by a previous call to GET /wifi/keys")) -> V1ErrorMessage:
    raise HTTPException(500, "not implemented")


@router.get("/wifi/eap-options",
            description="Get the supported EAP variants and their configuration parameters",
            response_model=EapOptions)
async def get_eap_options() -> EapOptions:
    raise HTTPException(500, "not implemented")