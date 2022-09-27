"""Support for configuring USB through Linux ConfigFS.

Linux provides the ConfigFS interface to enable USB gadget configuration
using a configuration file tree. There are a few pieces of documentation
provided by kernel.org:

- https://www.kernel.org/doc/html/v5.9/usb/gadget_configfs.html
- https://www.kernel.org/doc/html/v5.9/usb/gadget_serial.html
- https://www.kernel.org/doc/Documentation/ABI/testing/configfs-usb-gadget

This code requires that the Kernel is configured to support UDC hardware,
and a few kernel modules must be running before this program:

- dwc3 (or another USB module)
- libcomposite (to provide the configuration filesystem)
- g_serial (to provide /dev/ttyGS0 after configuration)
"""

from dataclasses import dataclass
import logging
import os
import time
import serial  # type: ignore[import]
import typing

LOG = logging.getLogger(__name__)

# Base path where all USB config files go
GADGET_BASE_PATH = "/sys/kernel/config/usb_gadget"

# Hex code for english
ENGLISH_LANG_CODE = "0x409"

# Default subfolder for english language strings
STRINGS_SUBFOLDER = "strings/" + ENGLISH_LANG_CODE + "/"

# Default subfolder name for the gadget config files
CONFIG_SUBFOLDER = "configs/c.1/"

# Default subfolder for configuration english language strings
CONFIG_STRINGS_SUBFOLDER = CONFIG_SUBFOLDER + STRINGS_SUBFOLDER

# Default subfolder to make an ACM serial port
FUNCTION_SUBFOLDER = "functions/acm.usb0"

# Folder holding all of the UDC handles (as filenames)
UDC_HANDLE_FOLDER = "/sys/class/udc/"


class OSDriver:
    """Class to abstract OS functions."""

    @staticmethod
    def makedirs(name: str, exist_ok: bool) -> None:
        """Abstraction of os.makedirs function."""
        os.makedirs(name, exist_ok=exist_ok)

    @staticmethod
    def listdir(path: str) -> typing.List[str]:
        """Abstraction of os.listdir function."""
        return os.listdir(path)

    @staticmethod
    def symlink(source: str, dest: str) -> None:
        """Abstraction of os.symlink function."""
        os.symlink(src=source, dst=dest)

    @staticmethod
    def sleep(seconds: int) -> None:
        """Sleep is abstracted by the driver to speed up tests."""
        time.sleep(seconds)

    @staticmethod
    def exists(path: str) -> bool:
        """Check if a filepath exists."""
        return os.path.exists(path)


@dataclass
class SerialGadgetConfig:
    """Dataclass to hold configuration options for a SerialGadget."""

    name: str
    vid: str
    pid: str
    bcdDevice: str
    serial_number: str
    manufacturer: str
    product_desc: str
    configuration_desc: str
    max_power: int


class SerialGadget:
    """Class to encapsulate gadget configuration details."""

    # Default path of the TTY handle
    HANDLE = "/dev/ttyGS0"

    def __init__(self, driver: OSDriver, config: SerialGadgetConfig) -> None:
        """Initialize a SerialGadget.

        Args:
            driver: class to abstract OS operations for configuration

            config: SerialGadgetConfig containing configuration info
        """
        self._driver = driver
        self._config = config

        self._basename = os.path.join(GADGET_BASE_PATH, config.name)

    def _write_file(self, contents: str, filename: str) -> bool:
        """Write a file relative to the root of this gadget's config folder.

        Args:
            contents: A string to write to the file

            filename: The file to write to, relative to this gadget's
            config folder. For example, to write to the file
            `/sys/kernel/config/usb_gadget/<name>/abcd.txt`, pass
            in `abcd.txt`
        """
        with open(os.path.join(self._basename, filename), mode="w") as f:
            written = f.write(contents)
        return written == len(contents)

    def configure_and_activate(self) -> None:
        """Configure this gadget. Throws exceptions on errors."""
        # Create root of the tree
        self._driver.makedirs(self._basename, exist_ok=True)

        # Write out basic info
        self._write_file(self._config.vid, "idVendor")
        self._write_file(self._config.pid, "idProduct")
        self._write_file(self._config.bcdDevice, "bcdDevice")
        # USB version always 2.0.0
        self._write_file("0x0200", "bcdUSB")

        # Create english language folder

        self._driver.makedirs(
            os.path.join(self._basename, STRINGS_SUBFOLDER), exist_ok=True
        )
        self._write_file(
            self._config.serial_number, STRINGS_SUBFOLDER + "/serialnumber"
        )
        self._write_file(self._config.manufacturer, STRINGS_SUBFOLDER + "/manufacturer")
        self._write_file(self._config.product_desc, STRINGS_SUBFOLDER + "/product")
        # Write out the single config for this gadget
        self._driver.makedirs(
            os.path.join(self._basename, CONFIG_SUBFOLDER), exist_ok=True
        )
        self._write_file(str(self._config.max_power), CONFIG_SUBFOLDER + "MaxPower")

        # Write out english config string
        self._driver.makedirs(
            os.path.join(self._basename, CONFIG_STRINGS_SUBFOLDER), exist_ok=True
        )
        self._write_file(
            self._config.configuration_desc, CONFIG_STRINGS_SUBFOLDER + "/configuration"
        )
        # Make and link function (ACM for serial transport)
        functionFolder = os.path.join(self._basename, FUNCTION_SUBFOLDER)
        self._driver.makedirs(functionFolder, exist_ok=True)
        try:
            self._driver.symlink(
                source=functionFolder,
                dest=os.path.join(self._basename, "configs/c.1/acm.usb0"),
            )
        except FileExistsError:
            LOG.info("symlink already exists")
        # Last step is to set up the UDC. This assumes there's only ONE UDC
        udc_path = os.path.join(self._basename, "UDC")
        udc_handles = self._driver.listdir(UDC_HANDLE_FOLDER)
        if len(udc_handles) == 0:
            raise Exception("Failed to find UDC handle. Check kernel configuration.")
        self._write_file(udc_handles[0], udc_path)
        if not self._driver.exists(udc_path):
            raise Exception("Failed to enumerate UDC")

    def handle_exists(self) -> bool:
        """Check if the handle for this gadget exists."""
        return self._driver.exists(SerialGadget.HANDLE)

    def get_handle(self) -> serial.Serial:
        """Open a handle to the serial port."""
        return serial.Serial(port=SerialGadget.HANDLE)
