"""Tests for the usb_config module."""

import pytest
import mock
from pathlib import Path
import os

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


def write_file_mock(contents: str, filename: str) -> bool:
    return True


def test_serial_gadget_failure(
    subject: usb_config.SerialGadget,
    os_driver: mock.Mock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    os_driver.system.return_value = -1

    # Mock out the _write_file function
    monkeypatch.setattr(subject, "_write_file", write_file_mock)

    # If the UDC seems to exist, shouldn't get an error
    subject.configure_and_activate()

    # If UDC seems to not exist AND we can't make it, expect exception
    os_driver.exists.return_value = False
    with pytest.raises(Exception):
        subject.configure_and_activate()


def test_serial_gadget_symlink_failure(
    subject: usb_config.SerialGadget,
    os_driver: mock.Mock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Symlink errors should only bubble up if the symlink doesn't exist"""

    # Mock out the _write_file function
    monkeypatch.setattr(subject, "_write_file", write_file_mock)

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
    ["idVendor", DEFAULT_VID],
    ["idProduct", DEFAULT_PID],
    ["bcdDevice", DEFAULT_BCDEVICE],
    ["bcdUSB", "0x0200"],
    ["strings/0x409/serialnumber", DEFAULT_SERIAL],
    ["strings/0x409/manufacturer", DEFAULT_MANUFACTURER],
    ["strings/0x409/product", DEFAULT_PRODUCT],
    ["configs/c.1/strings/0x409/configuration", DEFAULT_CONFIGURATION],
    ["configs/c.1/MaxPower", str(DEFAULT_MAX_POWER)],
]

# List of directories that the gadget should generate
config_dirs = [
    "",
    "strings/0x409",
    "configs/c.1/",
    "configs/c.1/strings/0x409",
    "functions/acm.usb0",
]


def test_serial_gadget_success(
    subject: usb_config.SerialGadget, os_driver: mock.Mock, tmpdir: Path
) -> None:
    # Use the real `os.makedirs` method
    os_driver.makedirs = usb_config.OSDriver.makedirs
    # Not ideal to modify the subject, but we want to write the filetree
    # in the temp directory
    subject._basename = str(tmpdir)

    subject.configure_and_activate()

    # Check that all files are written
    for f in config_files:
        fullpath = os.path.join(tmpdir, f[0])
        with open(fullpath, mode="r") as written:
            assert written.read() == f[1]

    # Check that appropriate directories were built
    for folder in config_dirs:
        assert os.path.exists(os.path.join(tmpdir, folder))

    # Check that a symlink was set up
    os_driver.symlink.assert_called_with(
        source=os.path.join(tmpdir, "functions/acm.usb0"),
        dest=os.path.join(tmpdir, "configs/c.1/acm.usb0"),
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
