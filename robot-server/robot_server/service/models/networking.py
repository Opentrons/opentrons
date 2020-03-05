import typing
from enum import Enum

from pydantic import BaseModel, Field, SecretStr, validator, root_validator


class ConnectivityStatus(str, Enum):
    full = "full"
    limited = "limited"
    none = "none"
    portal = "portal"
    unknown = "unknown"


class ConnectionState(str, Enum):
    connected = "connected"
    connecting = "connecting"
    disconnected = "disconnected"


class ConnectionType(str, Enum):
    wifi = "wifi"
    ethernet = "ethernet"


class InterfaceStatus(BaseModel):
    """Status for an interface"""
    ipAddress: str = \
        Field(None,
              description="The interface IP address with CIDR subnet appended "
                          "(e.g. 10.0.0.1/24)")
    macAddress: str = \
        Field(None,
              description="The MAC address of this interface (at least when "
                          "connected to this network - it may change due to "
                          "NetworkManager's privacy functionality when "
                          "disconnected or connected to a different network)")
    gatewayAddress: str = \
        Field(None,
              description="The address of the configured gateway")
    state: ConnectionState = \
        Field(...,
              description="The state of the connection")
    type: ConnectionType = \
        Field(...,
              description="What kind of interface this is")


class NetworkingStatus(BaseModel):
    status: ConnectivityStatus = \
        Field(ConnectivityStatus.none,
              description="Overall connectivity of the robot")
    interfaces: typing.Dict[str, InterfaceStatus] = \
        Field({},
              description="Per-interface networking status. Properties are "
                          "named for network interfaces")

    class Config:
        schema_extra = {
            "example": {
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
                        "gatewayAddress": None,
                        "state": "connected",
                        "type": "ethernet"
                    }
                }
            }
        }


class NetworkingSecurityType(str, Enum):
    """Top-level type of network security"""
    wpa_eap = "wpa-eap"
    wpa_psk = "wpa-psk"
    none = "none"
    unsupported = "unsupported"


class WifiNetwork(BaseModel):
    """"""
    ssid: str = \
        Field(...,
              description="The network's SSID")


class WifiNetworkFull(WifiNetwork):
    """A visible Network"""
    signal: int =\
        Field(...,
              description="A unitless signal strength; a higher number is a "
                          "better signal")
    active: bool = \
        Field(...,
              description="Whether there is a connection active")
    security: str =\
        Field(...,
              description="The raw NetworkManager output about the wifi "
                          "security")
    securityType: NetworkingSecurityType


class WifiNetworks(BaseModel):
    """The list of networks"""
    list: typing.List[WifiNetworkFull]

    class Config:
        schema_extra = {
            "example": {
                "list": [{
                    "ssid": "linksys",
                    "signal": 50,
                    "active": False,
                    "security": "WPA2 802.1X",
                    "securityType": "wpa-eap"}]
            }
        }


class WifiConfiguration(BaseModel):
    ssid: str = \
        Field(...,
              description="The SSID to connect to. If this isn't an SSID that "
                          "is being broadcast by a network, you "
                          "should also set hidden to true.", )
    hidden: typing.Optional[bool] = \
        Field(False,
              description="True if the network is hidden (not broadcasting an "
                          "ssid). False (default if key is not "
                          "present) otherwise")
    securityType: typing.Optional[NetworkingSecurityType]

    psk: SecretStr = \
        Field(None,
              description="If this is a PSK-secured network (securityType is "
                          "wpa-psk), the PSK")
    eapConfig: typing.Optional[typing.Dict[str, str]] = \
        Field(None,
              description="All options required to configure EAP access to the"
                          " wifi. All options should match one of the cases "
                          "described in /wifi/eap-options; for instance, "
                          "configuring for peap/mschapv2 should have "
                          "\"peap/mschapv2\" as the eapType; it should have "
                          "\"identity\" and \"password\" props, both of which "
                          "are identified as mandatory in /wifi/eap-options; "
                          "and it may also have \"anonymousIdentity\" and "
                          "\"caCert\" properties, both of which are identified"
                          " as present but not required.",
              required=["eapType"])

    @validator("eapConfig")
    def eap_config_validate(cls, v):
        """Custom validator for the eapConfig field"""
        if v and not v.get("eapType"):
            raise ValueError("eapType must be defined")
        return v

    @root_validator
    def security_type_validate(cls, values):
        security_type = values.get('securityType')
        if security_type == NetworkingSecurityType.wpa_psk and not\
                values.get("psk"):
            raise ValueError("If securityType is wpa-psk, psk "
                             "must be specified")
        elif security_type == NetworkingSecurityType.wpa_eap and not \
                values.get("eapConfig"):
            raise ValueError("If securityType is wpa-eap,"
                             " eapConfig must be specified")
        return values

    class Config:
        schema_extra = {"examples": {
            "unsecuredNetwork": {
                "summary": "Connect to an unsecured network",
                "value": {
                    "ssid": "linksys"
                }
            },
            "pskNetwork": {
                "summary": "Connect to a WPA2-PSK secured network",
                "description": "This is the \"standard\" way to set up a WiFi "
                               "router, and is where you provide a password",
                "value": {
                    "ssid": "linksys",
                    "securityType": "wpa-psk",
                    "psk": "psksrock"
                }
            },
            "hiddenNetwork": {
                "summary": "Connect to a network not broadcasting its SSID, "
                           "with a PSK",
                "value": {
                    "ssid": "cantseeme",
                    "securityType": "wpa-psk",
                    "psk": "letmein",
                    "hidden": True
                }
            },
            "eapNetwork": {
                "summary": "Connect to a network secured by WPA2-EAP using "
                           "PEAP/MSCHAPv2",
                "description": "WPA2 Enterprise network security is based "
                               "around the EAP protocol, which is a very "
                               " comple tunneled authentication protocol. It "
                               "can be configured in many different ways. The "
                               "OT-2 supports several but by no means all of "
                               "these variants. The variants supported on a "
                               "given OT-2 can be found by GET "
                               "/wifi/eap-options. This example describes how "
                               "to set up PEAP/MSCHAPv2, which is an older EAP"
                               " variant that was at one time the mechanism "
                               "securing Eduroam.",
                "value": {
                    "ssid": "Eduroam",
                    "securityType": "wpa-eap",
                    "eapConfig": {
                        "eapType": "peap/mschapv2",
                        "identity": "scientist@biology.org",
                        "password": "leeuwenhoek"
                    }
                }
            }
        }
        }


class WifiConfigurationResponse(BaseModel):
    """
    The OT-2 successfully connected to the specified network using the
    specified parameters
    """
    message: str = Field(..., description="A human-readable success message")
    ssid: str = Field(..., description="The SSID configured")


class WifiKeyFile(BaseModel):
    """Wifi Key File"""
    uri: str = \
        Field(...,
              description="A URI for the key (mostly for use with DELETE "
                          "/wifi/keys/{key_id})")
    id: str = \
        Field(...,
              description="A contents hash of the key used to specify the key "
                          "in POST /wifi/configure (and also to determine the"
                          " key URI)")
    name: str = \
        Field(...,
              description="The original filename of the key")


class WifiKeyFiles(BaseModel):
    """The list of key files"""
    keys: typing.List[WifiKeyFile] =\
        Field([],
              description="A list of keys in the system")

    class Config:
        schema_extra = {
            "example": {
                "keys": [
                    {"uri": "/wifi/keys/abda234a234",
                     "id": "abda234a234",
                     "name": "client.pem"}
                ]
            }
        }


class EapConfigOptionType(str, Enum):
    string: str
    password: str
    file: str


class EapConfigOption(BaseModel):
    """An object describing the name and format of an EAP config option"""
    name: str = \
        Field(...,
              description="The name of the config option")
    displayName: str = \
        Field(...,
              description="A human-readable and nicely formatted name for "
                          "the option")
    required: bool =\
        Field(...,
              description="Whether the option is required for this EAP variant"
                          " or optional")
    type: EapConfigOptionType =\
        Field(...,
              description="The type of the value. If string, a non-sensitive "
                          "string like a username. If password, a sensitive "
                          "string like a passphrase for a keyfile or a "
                          "password. If file, upload the file with POST "
                          "/wifi/keys and pass the hash.")


class EapVariant(BaseModel):
    """An object describing an EAP variant"""
    name: str = \
        Field(...,
              description="The identifier for the EAP variant")
    displayName: str = \
        Field(...,
              description="A human-readable formatted name for the EAP "
                          "variant")
    options: typing.List[EapConfigOption] =\
        Field(...,
              description="A list of objects describing configuration options "
                          "for the EAP variant")


class EapOptions(BaseModel):
    """An object describing all supported EAP variants and their parameters"""
    options: typing.List[EapVariant]

    class Config:
        schema_extra = {"example": {
            "options": [
                {"name": "peap/mschapv2",
                 "displayName": "PEAP/MS-CHAP v2",
                 "options": [
                     {"name": "identity",
                      "displayName": "Username",
                      "required": True,
                      "type": "string"
                      },
                     {"name": "anonymousIdentity",
                      "displayName": "Anonymous Identity",
                      "required": False,
                      "type": "string"},
                     {"name": "caCert",
                      "displayName": "CA Certificate File",
                      "required": False,
                      "type": "file"},
                     {"name": "password",
                      "displayName": "password",
                      "required": True,
                      "type": "password"}
                 ]}
            ]
        }
        }
