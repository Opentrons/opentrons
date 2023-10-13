from enum import Enum

VERBOSE = 10

class PackageName(Enum):
    """The types of packages to configure logging"""
    ROBOT_SERVER = "robot_server"
    SYSTEM_SERVER = "system_server"
    UPDATE_SERVER = "otupdate"
    HARDWARE_SERVER = "opentrons_hardware"
    OT3USBBridge = "ot3usb"

