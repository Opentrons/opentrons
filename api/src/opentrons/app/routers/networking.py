import logging
import subprocess

from fastapi import APIRouter, HTTPException
from opentrons.app.models.networking import NetworkingStatus, WifiNetworks, WifiNetwork, WifiConfiguration, \
    WifiConfigurationResponse
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
