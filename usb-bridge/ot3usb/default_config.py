"""Provides default configuration options for the OT3 Serial Gadget."""
from .usb_config import SerialGadgetConfig

DEFAULT_NAME = "ot3_usb"
DEFAULT_VID = "0x1b67"
DEFAULT_PID = "0x4037"
DEFAULT_BCDEVICE = "0x0010"
DEFAULT_SERIAL = "FLX00000000000000"
DEFAULT_MANUFACTURER = "Opentrons"
DEFAULT_PRODUCT = "Flex"
DEFAULT_CONFIGURATION = "ACM Device"
DEFAULT_MAX_POWER = 150

SERIAL_NUMBER_FILE = "/var/serial"


def _get_serial_number() -> str:
    """Try to read the serial number from the filesystem."""
    try:
        with open(SERIAL_NUMBER_FILE, "r") as serial_file:
            return serial_file.read()
    except OSError:
        return DEFAULT_SERIAL


def get_gadget_config() -> SerialGadgetConfig:
    """Get the default gadget configuration."""
    return SerialGadgetConfig(
        name=DEFAULT_NAME,
        vid=DEFAULT_VID,
        pid=DEFAULT_PID,
        bcdDevice=DEFAULT_BCDEVICE,
        serial_number=_get_serial_number(),
        manufacturer=DEFAULT_MANUFACTURER,
        product_desc=DEFAULT_PRODUCT,
        configuration_desc=DEFAULT_CONFIGURATION,
        max_power=DEFAULT_MAX_POWER,
    )


# The name of the PHY in sysfs for the OT3
PHY_NAME = "usbphynop1"

DEFAULT_IP = "localhost"
DEFAULT_PORT = 31950
