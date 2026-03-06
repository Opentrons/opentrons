import copy
import enum
from typing import Any, NamedTuple

from opentrons import config

NM_UUID_RE = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"


class EAPType(NamedTuple):
    name: str
    displayName: str
    args: list[dict[str, Any]]


class _EAP_OUTER_TYPES(enum.Enum):
    """The types of phase-1 EAP we support."""

    # The string values of these supported EAP types should match both what
    # is expected by nmcli/wpa_supplicant (in 802-1x.eap) and the keys in
    # the CONFIG_REQUIRES dict above
    # Note: if a file field has an optional password, the password field `name`
    # must start with the `name` of the file field
    TLS = EAPType(
        name="tls",
        displayName="EAP-TLS",
        args=[
            {
                "name": "identity",
                "displayName": "Username",
                "nmName": "identity",
                "required": True,
                "type": "string",
            },
            {
                "name": "caCert",
                "displayName": "CA Certificate File",
                "nmName": "ca-cert",
                "required": False,
                "type": "file",
            },
            {
                "name": "clientCert",
                "displayName": "Client Certificate File",
                "nmName": "client-cert",
                "required": True,
                "type": "file",
            },
            {
                "name": "privateKey",
                "displayName": "Private Key File",
                "nmName": "private-key",
                "required": True,
                "type": "file",
            },
            {
                "name": "privateKeyPassword",
                "displayName": "Private Key Password",
                "nmName": "private-key-password",
                "required": False,
                "type": "password",
            },
        ],
    )
    PEAP = EAPType(
        name="peap",
        displayName="EAP-PEAP",
        args=[
            {
                "name": "identity",
                "displayName": "Username",
                "nmName": "identity",
                "required": True,
                "type": "string",
            },
            {
                "name": "anonymousIdentity",
                "displayName": "Anonymous Identity",
                "nmName": "anonymous-identity",
                "required": False,
                "type": "string",
            },
            {
                "name": "caCert",
                "displayName": "CA Certificate File",
                "nmName": "ca-cert",
                "required": False,
                "type": "file",
            },
        ],
    )
    TTLS = EAPType(
        name="ttls",
        displayName="EAP-TTLS",
        args=[
            {
                "name": "identity",
                "displayName": "Username",
                "nmName": "identity",
                "required": True,
                "type": "string",
            },
            {
                "name": "anonymousIdentity",
                "displayName": "Anonymous Identity",
                "nmName": "anonymous-identity",
                "required": False,
                "type": "string",
            },
            {
                "name": "caCert",
                "displayName": "CA Certificate File",
                "nmName": "ca-cert",
                "required": False,
                "type": "file",
            },
            {
                "name": "clientCert",
                "displayName": "Client Certificate File",
                "nmName": "client-cert",
                "required": False,
                "type": "file",
            },
            {
                "name": "privateKey",
                "displayName": "Private Key File",
                "nmName": "private-key",
                "required": False,
                "type": "file",
            },
            {
                "name": "privateKeyPassword",
                "displayName": "Private Key Password",
                "nmName": "private-key-password",
                "required": False,
                "type": "password",
            },
        ],
    )

    def qualified_name(self) -> str:
        return self.value.name


class _EAP_PHASE2_TYPES(enum.Enum):
    """The types of EAP phase 2 auth (for tunneled EAP) we support"""

    # The string values of these supported EAP types should match both what
    # is expected by nmcli/wpa_supplicant (in 802-1x.phase2-autheap) and the
    # keys in the CONFIG_REQUIRES dict above
    MSCHAP_V2 = EAPType(
        name="mschapv2",
        displayName="MS-CHAP v2",
        args=[
            {
                "name": "password",
                "displayName": "Password",
                "nmName": "password",
                "required": True,
                "type": "password",
            }
        ],
    )
    MD5 = EAPType(
        name="md5",
        displayName="MD5",
        args=[
            {
                "name": "password",
                "displayName": "Password",
                "nmName": "password",
                "required": True,
                "type": "password",
            }
        ],
    )
    TLS = EAPType(
        name="tls",
        displayName="TLS",
        args=[
            {
                "name": "phase2CaCert",
                "displayName": "Inner CA Certificate File",
                "nmName": "phase2-ca-cert",
                "required": False,
                "type": "file",
            },
            {
                "name": "phase2ClientCert",
                "displayName": "Inner Client Certificate File",
                "nmName": "phase2-client-cert",
                "required": True,
                "type": "file",
            },
            {
                "name": "phase2PrivateKey",
                "displayName": "Inner Private Key File",
                "nmName": "phase2-private-key",
                "required": True,
                "type": "file",
            },
            {
                "name": "phase2PrivateKeyPassword",
                "displayName": "Inner Private Key Password",
                "nmName": "phase2-private-key-password",
                "required": False,
                "type": "password",
            },
        ],
    )

    def qualified_name(self) -> str:
        return "eap-" + self.value.name


class EAP_TYPES(enum.Enum):
    """The types of EAP we support, fusing inner and outer methods"""

    TTLS_EAPTLS = (_EAP_OUTER_TYPES.TTLS, _EAP_PHASE2_TYPES.TLS)
    TTLS_EAPMSCHAPV2 = (_EAP_OUTER_TYPES.TTLS, _EAP_PHASE2_TYPES.MSCHAP_V2)
    TTLS_MD5 = (_EAP_OUTER_TYPES.TTLS, _EAP_PHASE2_TYPES.MD5)
    PEAP_EAPMSCHAPV2 = (_EAP_OUTER_TYPES.PEAP, _EAP_PHASE2_TYPES.MSCHAP_V2)
    TLS = (_EAP_OUTER_TYPES.TLS, None)

    def __init__(self, outer: _EAP_OUTER_TYPES, inner: _EAP_PHASE2_TYPES) -> None:
        self.outer = outer
        self.inner = inner

    def qualified_name(self) -> str:
        name = self.outer.qualified_name()
        if self.inner:
            name += "/" + self.inner.qualified_name()
        return name

    @classmethod
    def by_qualified_name(cls, qname: str) -> "EAP_TYPES":
        for val in cls.__members__.values():
            if val.qualified_name() == qname:
                return val
        raise KeyError(qname)

    def args(self) -> list[dict[str, Any]]:
        # Have to copy these or reference semantics modify the version stored
        # in the enums
        to_ret = copy.deepcopy(self.outer.value.args)
        if self.inner:
            to_ret += copy.deepcopy(self.inner.value.args)
        return to_ret

    def display_name(self) -> str:
        name = self.outer.value.displayName
        if self.inner:
            name += " with " + self.inner.value.displayName
        return name


class SECURITY_TYPES(enum.Enum):
    """The types of security that this module supports."""

    # The string values of these supported security types are passed
    # directly to nmcli; they should match the security types allowed
    # in the network-manager settings for 802-11-wireless-security.key-mgmt
    NONE = "none"
    WPA_PSK = "wpa-psk"
    WPA_EAP = "wpa-eap"


class CONNECTION_TYPES(enum.Enum):
    """Types of connection (used to parse nmcli results)"""

    # These connection types are used to parse nmcli results and should be
    # valid results for the last element when splitting connection.type by ’-’
    WIRELESS = "wireless"
    ETHERNET = "ethernet"


class NETWORK_IFACES(enum.Enum):
    """Network interface names that we manage here."""

    WIFI = {
        config.SystemArchitecture.BUILDROOT: "wlan0",
        config.SystemArchitecture.YOCTO: "mlan0",
    }.get(config.ARCHITECTURE, "wlan0")
    ETH_LL = {
        config.SystemArchitecture.BUILDROOT: "eth0",
        config.SystemArchitecture.YOCTO: "end0",
    }.get(config.ARCHITECTURE, "eth0")
