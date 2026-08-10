from opentrons_shared_data.util import StrEnum


class LogIdentifier(StrEnum):
    """Identifier of the log"""

    api = "api.log"
    serial = "serial.log"
    api_server = "combined_api_server.log"
    update_server = "update_server.log"
    can = "can_bus.log"
    server = "server.log"
    kernel = "kernel.log"
    auth = "auth_server.log"
    audit = "audit_server.log"
    remote_access = "remote_access.log"
    touchscreen = "touchscreen.log"


class LogFormat(StrEnum):
    """Format to use for log records"""

    text = "text"
    json = "json"
