import logging
import os
import subprocess

from starlette import status
from starlette.responses import JSONResponse
from fastapi import APIRouter, HTTPException, File, Path, UploadFile
from opentrons.system import nmcli, wifi

from robot_server.service.exceptions import V1HandlerError
from robot_server.service.models import V1BasicResponse
from robot_server.service.models.networking import NetworkingStatus, \
    WifiNetworks, WifiNetwork, WifiConfiguration, WifiConfigurationResponse, \
    WifiKeyFiles, WifiKeyFile, EapOptions, EapVariant, EapConfigOption, \
    EapConfigOptionType, WifiNetworkFull, AddWifiKeyFileResponse

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
        log.exception("Failed calling nmcli")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))


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
             responses={
                 status.HTTP_401_UNAUTHORIZED: {"model": V1BasicResponse}
             },
             status_code=status.HTTP_201_CREATED)
async def post_wifi_configure(configuration: WifiConfiguration)\
        -> WifiConfigurationResponse:
    try:
        psk = configuration.psk.get_secret_value() if \
            configuration.psk else None
        ok, message = await nmcli.configure(
            ssid=configuration.ssid,
            securityType=nmcli.SECURITY_TYPES(configuration.securityType),
            eapConfig=configuration.eapConfig,
            hidden=configuration.hidden is True,
            psk=psk
        )
        log.debug("Wifi configure result: %s", message)
    except (ValueError, TypeError) as e:
        # Indicates an unexpected kwarg; check is done here to avoid keeping
        # the _check_configure_args signature up to date with nmcli.configure
        raise V1HandlerError(status.HTTP_400_BAD_REQUEST, str(e))

    if not ok:
        raise V1HandlerError(status.HTTP_401_UNAUTHORIZED,
                             message=message)

    return WifiConfigurationResponse(message=message, ssid=configuration.ssid)


@router.get("/wifi/keys",
            description="Get a list of key files known to the system",
            response_model=WifiKeyFiles,
            response_model_by_alias=True,
            )
async def get_wifi_keys():
    keys = [
        WifiKeyFile(uri=f'/wifi/keys/{key.directory}',
                    id=key.directory,
                    name=os.path.basename(key.file))
        for key in wifi.list_keys()
    ]
    # Why not create a WifiKeyFiles? Because validation fails when there's a
    # pydantic model with attribute named keys. Deep in the guts of pydantic
    # there's a call to `dict(model)` which raises an exception because `keys`
    # is not callable, like the `keys` member of dict.
    # A problem for another time.
    return {
        "keys": keys
    }


@router.post("/wifi/keys",
             description="Send a new key file to the OT-2",
             responses={
                 status.HTTP_200_OK: {"model": AddWifiKeyFileResponse}
             },
             response_model=AddWifiKeyFileResponse,
             status_code=status.HTTP_201_CREATED,
             response_model_exclude_unset=True)
async def post_wifi_key(key: UploadFile = File(...)):
    add_key_result = wifi.add_key(key.filename, key.file.read())

    response = AddWifiKeyFileResponse(
        uri=f'/wifi/keys/{add_key_result.key.directory}',
        id=add_key_result.key.directory,
        name=os.path.basename(add_key_result.key.file)
    )
    if add_key_result.created:
        return response
    else:
        # We return a JSONResponse because we want the 200 status code.
        response.message = 'Key file already present'
        return JSONResponse(content=response.dict())


@router.delete("/wifi/keys/{key_uuid}",
               description="Delete a key file from the OT-2",
               responses={
                   status.HTTP_404_NOT_FOUND: {"model": V1BasicResponse}
               },
               response_model=V1BasicResponse)
async def delete_wifi_key(
        key_uuid: str = Path(
            ...,
            description="The ID of key to delete, as determined by a previous"
                        " call to GET /wifi/keys")) -> V1BasicResponse:
    """Delete wifi key handler"""
    deleted_file = wifi.remove_key(key_uuid)
    if not deleted_file:
        raise V1HandlerError(status.HTTP_404_NOT_FOUND,
                             message=f"No such key file {key_uuid}")
    return V1BasicResponse(message=f'Key file {deleted_file} deleted')


@router.get("/wifi/eap-options",
            description="Get the supported EAP variants and their "
                        "configuration parameters",
            response_model=EapOptions)
async def get_eap_options() -> EapOptions:
    options = [
        EapVariant(name=m.qualified_name(),
                   displayName=m.display_name(),
                   options=[EapConfigOption(
                       name=o.get('name'),
                       displayName=o.get('displayName'),
                       required=o.get('required'),
                       type=EapConfigOptionType(o.get('type'))
                   ) for o in m.args()])
        for m in nmcli.EAP_TYPES
    ]
    result = EapOptions(options=options)
    return result


@router.post("/wifi/disconnect",
             description="Disconnect the OT-2 from WiFi network",
             summary="Deactivates the wifi connection and removes it from "
                     "known connections",
             response_model=V1BasicResponse,
             responses={status.HTTP_200_OK: {"model": V1BasicResponse}},
             status_code=status.HTTP_207_MULTI_STATUS)
async def post_wifi_disconnect(wifi_ssid: WifiNetwork):
    ok, message = await nmcli.wifi_disconnect(wifi_ssid.ssid)

    result = V1BasicResponse(message=message)
    if ok:
        # TODO have nmcli interpret error messages rather than exposing them
        #  all the way up here.
        stat = status.HTTP_200_OK if 'successfully deleted' in message\
            else status.HTTP_207_MULTI_STATUS
    else:
        stat = status.HTTP_500_INTERNAL_SERVER_ERROR
    return JSONResponse(status_code=stat, content=result.dict())
