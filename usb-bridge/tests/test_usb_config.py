"""Tests for the usb_config module."""

import pytest
import mock
from pathlib import Path

from ot3usb.src import usb_config

# Constants for the tests
DEFAULT_NAME = "gadget_test"
DEFAULT_VID = "0x1234"
DEFAULT_PID = "0xABCD"
DEFAULT_BCDEVICE = "0x0010"
DEFAULT_SERIAL = "01121997"
DEFAULT_MANUFACTURER = "Opentrons"
DEFAULT_PRODUCT = "OT3"
DEFAULT_CONFIGURATION = "ACM Device"
DEFAULT_MAX_POWER = 150


@pytest.fixture
def os_driver() -> mock.Mock:
    driver = mock.Mock(spec=usb_config.OSDriver)
    driver.system.return_value = 0
    driver.exists.return_value = True
    return driver


@pytest.fixture
def subject(os_driver: mock.Mock) -> usb_config.SerialGadget:
    return usb_config.SerialGadget(
        driver=os_driver,
        name=DEFAULT_NAME,
        vid=DEFAULT_VID,
        pid=DEFAULT_PID,
        bcdDevice=DEFAULT_BCDEVICE,
        serial=DEFAULT_SERIAL,
        manufacturer=DEFAULT_MANUFACTURER,
        product=DEFAULT_PRODUCT,
        configuration=DEFAULT_CONFIGURATION,
        max_power=DEFAULT_MAX_POWER,
    )


def test_serial_gadget_failure(
    subject: usb_config.SerialGadget, os_driver: mock.Mock
) -> None:
    os_driver.system.return_value = -1

    # If the UDC seems to exist, shouldn't get an error
    subject.configure_and_activate()

    # If UDC seems to not exist AND we can't make it, expect exception
    os_driver.exists.return_value = False
    with pytest.raises(Exception):
        subject.configure_and_activate()


def test_serial_gadget_symlink_failure(
    subject: usb_config.SerialGadget, os_driver: mock.Mock
) -> None:
    """Symlink errors should only bubble up if the symlink doesn't exist"""

    # Do NOT raise an error with the correct exception
    os_driver.symlink.side_effect = FileExistsError("file exists")
    subject.configure_and_activate()

    # Now, change the exception and expect it to bubble up
    os_driver.symlink.side_effect = OSError("other error")
    with pytest.raises(OSError):
        subject.configure_and_activate()


BASE_DIR = usb_config.GADGET_BASE_PATH + "/" + DEFAULT_NAME + "/"

# List of files that the usb gadget should write
config_files = [
    [BASE_DIR + "idVendor", DEFAULT_VID],
    [BASE_DIR + "idProduct", DEFAULT_PID],
    [BASE_DIR + "bcdDevice", DEFAULT_BCDEVICE],
    [BASE_DIR + "bcdUSB", "0x0200"],
    [BASE_DIR + "strings/0x409/serialnumber", DEFAULT_SERIAL],
    [BASE_DIR + "strings/0x409/manufacturer", DEFAULT_MANUFACTURER],
    [BASE_DIR + "strings/0x409/product", DEFAULT_PRODUCT],
    [BASE_DIR + "configs/c.1/strings/0x409/configuration", DEFAULT_CONFIGURATION],
    [BASE_DIR + "configs/c.1/MaxPower", DEFAULT_MAX_POWER],
]

# List of directories that the gadget should generate
config_dirs = [
    BASE_DIR,
    BASE_DIR + "strings/0x409",
    BASE_DIR + "configs/c.1/",
    BASE_DIR + "configs/c.1/strings/0x409",
    BASE_DIR + "functions/acm.usb0",
]


def test_serial_gadget_success(
    subject: usb_config.SerialGadget, os_driver: mock.Mock
) -> None:
    subject.configure_and_activate()

    # Check that all files are written
    for file in config_files:
        command = f"echo {file[1]} > {file[0]}"  # type: ignore[index]
        os_driver.system.assert_any_call(command)

    # Check that appropriate directories were built
    for folder in config_dirs:
        os_driver.makedirs.assert_any_call(folder, exist_ok=True)

    # Check that a symlink was set up
    os_driver.symlink.assert_called_with(
        source=BASE_DIR + "functions/acm.usb0", dest=BASE_DIR + "configs/c.1/acm.usb0"
    )


def test_serial_handle(
    subject: usb_config.SerialGadget,
    os_driver: mock.Mock,
    monkeypatch: pytest.MonkeyPatch,
    tmpdir: Path,
) -> None:
    dummy_handle = Path(tmpdir) / "test"
    # Use the real `os.path.exists` method
    os_driver.exists = usb_config.OSDriver.exists
    monkeypatch.setattr("ot3usb.src.usb_config.SerialGadget.HANDLE", str(dummy_handle))
    assert not subject.handle_exists()
    dummy_handle.write_text("existence")
    assert subject.handle_exists()
