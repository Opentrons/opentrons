"""Support for configuring USB through Linux ConfigFS."""

import logging
import os
import time
import serial  # type: ignore[import]

LOG = logging.getLogger(__name__)

# Base path where all USB config files go
GADGET_BASE_PATH = "/sys/kernel/config/usb_gadget"

# Hex code for english
ENGLISH_LANG_CODE = "0x409"


class OSDriver:
    """Class to abstract OS functions."""

    @staticmethod
    def makedirs(name: str, exist_ok: bool) -> None:
        """Abstraction of os.makedirs function."""
        os.makedirs(name, exist_ok=exist_ok)

    @staticmethod
    def system(command: str) -> int:
        """Abstraction of os.system function."""
        return os.system(command)

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


class SerialGadget:
    """Class to encapsulate gadget configuration details."""

    # Default path of the TTY handle
    HANDLE = "/dev/ttyGS0"

    def __init__(
        self,
        driver: OSDriver,
        name: str,
        vid: str,
        pid: str,
        bcdDevice: str,
        serial: str,
        manufacturer: str,
        product: str,
        configuration: str,
        max_power: int,
    ) -> None:
        """Initialize a SerialGadget.

        Args:
            driver: class to abstract OS operations for configuration

            name: The name for this serial gadget

            vid: Vendor ID (string format hex number)

            pid: Product ID  (string format hex number)

            bcdDevice: binary coded decimal device version, e.g.
            0x0101 for v1.0.1

            serial: Serial number for this device

            manufacturer: Name of the manufacturer

            product: English name of the product

            configuration: Configuration string for the gadget

            max_power: Maximum power for the gadget in milliamperes
        """
        self._driver = driver
        self._name = name
        self._vid = vid
        self._pid = pid
        self._bcdDevice = bcdDevice
        self._serial = serial
        self._manufacturer = manufacturer
        self._product = product
        self._configuration = configuration
        self._max_power = max_power

        self._basename = f"{GADGET_BASE_PATH}/{self._name}/"

    def _write_file(self, contents: str, filename: str) -> bool:
        """Write a file relative to the root of this gadget's config folder.

        Args:
            contents: A string to write to the file

            filename: The file to write to, relative to this gadget's
            config folder. For example, to write to the file
            `/sys/kernel/config/usb_gadget/<name>/abcd.txt`, pass
            in `abcd.txt`
        """
        command = f"echo {contents} > {self._basename}{filename}"

        return self._driver.system(command) == os.EX_OK

    def configure_and_activate(self) -> None:
        """Configure this gadget. Throws exceptions on errors."""
        # Create root of the tree
        self._driver.makedirs(self._basename, exist_ok=True)

        # Write out basic info
        self._write_file(self._vid, "idVendor")
        self._write_file(self._pid, "idProduct")
        self._write_file(self._bcdDevice, "bcdDevice")
        # USB version always 2.0.0
        self._write_file("0x0200", "bcdUSB")

        strings_folder = "strings/" + ENGLISH_LANG_CODE

        # Create english language folder

        self._driver.makedirs(self._basename + strings_folder, exist_ok=True)
        self._write_file(self._serial, strings_folder + "/serialnumber")
        self._write_file(self._manufacturer, strings_folder + "/manufacturer")
        self._write_file(self._product, strings_folder + "/product")
        # Write out the single config for this gadget
        configFolder = "configs/c.1/"
        self._driver.makedirs(self._basename + configFolder, exist_ok=True)
        self._write_file(str(self._max_power), configFolder + "MaxPower")

        # Write out english config string
        configStringsFolder = configFolder + "strings/" + ENGLISH_LANG_CODE
        self._driver.makedirs(self._basename + configStringsFolder, exist_ok=True)
        self._write_file(self._configuration, configStringsFolder + "/configuration")
        # Make and link function (ACM for serial transport)
        functionFolder = self._basename + "functions/acm.usb0"
        self._driver.makedirs(functionFolder, exist_ok=True)
        # Give some time for the function to be configured
        self._driver.sleep(1)
        try:
            self._driver.symlink(
                source=functionFolder, dest=self._basename + "configs/c.1/acm.usb0"
            )
        except FileExistsError:
            LOG.info("symlink already exists")
        # Last step is to set up the UDC. This assumes there's only ONE UDC
        self._driver.sleep(1)
        if self._driver.system(f"ls /sys/class/udc > {self._basename}UDC") != os.EX_OK:
            if not self._driver.exists(self._basename + "/UDC"):
                raise Exception("Failed to enumerate UDC")

    def handle_exists(self) -> bool:
        """Check if the handle for this gadget exists."""
        return self._driver.exists(SerialGadget.HANDLE)

    def get_handle(self) -> serial.Serial:
        """Open a handle to the serial port."""
        return serial.Serial(port=SerialGadget.HANDLE)
