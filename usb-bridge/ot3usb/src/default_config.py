"""Provides default configuration options for the OT3 Serial Gadget."""
from .usb_config import SerialGadgetConfig

DEFAULT_NAME = "ot3_usb"
DEFAULT_VID = "0x1b67"
DEFAULT_PID = "0x4037"
DEFAULT_BCDEVICE = "0x0010"
DEFAULT_SERIAL = "01121997"
DEFAULT_MANUFACTURER = "Opentrons"
DEFAULT_PRODUCT = "OT3"
DEFAULT_CONFIGURATION = "ACM Device"
DEFAULT_MAX_POWER = 150

default_gadget = SerialGadgetConfig(
    name=DEFAULT_NAME,
    vid=DEFAULT_VID,
    pid=DEFAULT_PID,
    bcdDevice=DEFAULT_BCDEVICE,
    serial_number=DEFAULT_SERIAL,
    manufacturer=DEFAULT_MANUFACTURER,
    product_desc=DEFAULT_PRODUCT,
    configuration_desc=DEFAULT_CONFIGURATION,
    max_power=DEFAULT_MAX_POWER,
)

# The name of the PHY in sysfs for the OT3
PHY_NAME = "usbphynop1"
