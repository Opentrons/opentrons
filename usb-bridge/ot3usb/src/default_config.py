from .usb_config import SerialGadgetConfig

DEFAULT_NAME = "g1"
DEFAULT_VID = "0x0483"
DEFAULT_PID = "0x0483"
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
