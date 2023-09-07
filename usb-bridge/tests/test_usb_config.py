"""Tests for the usb_config module."""

import pytest
import mock
from pathlib import Path
import os

from ot3usb import usb_config, default_config

# Fake UDC handle to use in tests
UDC_HANDLE_NAME = "usb123"


@pytest.fixture
def os_driver() -> mock.Mock:
    driver = mock.Mock(spec=usb_config.OSDriver)
    driver.listdir.return_value = [UDC_HANDLE_NAME]
    driver.exists.return_value = True
    return driver


@pytest.fixture
def subject(os_driver: mock.Mock) -> usb_config.SerialGadget:
    return usb_config.SerialGadget(
        driver=os_driver, config=default_config.get_gadget_config()
    )


def write_file_mock(contents: str, filename: str) -> bool:
    return True


def write_file_mock_err_on_udc(contents: str, filename: str) -> bool:
    if filename == "UDC":
        raise Exception("failed to write")
    return True


def test_serial_gadget_failure(
    subject: usb_config.SerialGadget,
    os_driver: mock.Mock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:

    # Mock out the _write_file function
    monkeypatch.setattr(subject, "_write_file", write_file_mock)

    # If the UDC seems to exist, shouldn't get an error
    subject.configure_and_activate()

    # If UDC seems to not exist AND we can't make it, expect exception
    os_driver.exists.return_value = False
    with pytest.raises(Exception):
        subject.configure_and_activate()

    # If os driver returns an empty symlink directory, should throw an error
    os_driver.exists.return_value = True
    os_driver.listdir.return_value = []
    with pytest.raises(Exception):
        subject.configure_and_activate()

    # If os driver fails to write to the UDC, should get an exception
    os_driver.listdir.return_value = [UDC_HANDLE_NAME]
    monkeypatch.setattr(subject, "_write_file", write_file_mock_err_on_udc)
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


BASE_DIR = usb_config.GADGET_BASE_PATH + "/" + default_config.DEFAULT_NAME + "/"

# List of files that the usb gadget should write
config_files = [
    ["idVendor", default_config.DEFAULT_VID],
    ["idProduct", default_config.DEFAULT_PID],
    ["bcdDevice", default_config.DEFAULT_BCDEVICE],
    ["bcdUSB", "0x0200"],
    ["strings/0x409/serialnumber", default_config.DEFAULT_SERIAL],
    ["strings/0x409/manufacturer", default_config.DEFAULT_MANUFACTURER],
    ["strings/0x409/product", default_config.DEFAULT_PRODUCT],
    ["configs/c.1/strings/0x409/configuration", default_config.DEFAULT_CONFIGURATION],
    ["configs/c.1/MaxPower", str(default_config.DEFAULT_MAX_POWER)],
    ["UDC", UDC_HANDLE_NAME],
]

# List of directories that the gadget should generate
config_dirs = [
    "",
    "strings/0x409/",
    "configs/c.1/",
    "configs/c.1/strings/0x409",
    "functions/acm.usb0/",
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


def test_get_serial_handle_path(
    subject: usb_config.SerialGadget,
    os_driver: mock.Mock,
    monkeypatch: pytest.MonkeyPatch,
    tmpdir: Path,
) -> None:
    # Set up mock filesystem
    port_num_dir = os.path.join(str(tmpdir), usb_config.FUNCTION_SUBFOLDER)
    os.makedirs(port_num_dir)
    port_num_path = Path(tmpdir) / usb_config.FUNCTION_SUBFOLDER / "port_num"
    subject._basename = str(tmpdir)

    # Test failure (no port_num)
    with pytest.raises(Exception):
        subject._get_handle_path()
    # Test success
    port_num_path.write_text("0")
    assert subject._get_handle_path() == "/dev/ttyGS0"
    # Test error with an empty file
    port_num_path.write_text("")
    with pytest.raises(Exception):
        subject._get_handle_path()


def test_serial_handle(
    subject: usb_config.SerialGadget,
    os_driver: mock.Mock,
    monkeypatch: pytest.MonkeyPatch,
    tmpdir: Path,
) -> None:
    # Need to set up a fake
    dummy_handle = Path(tmpdir) / "test"
    # Use the real `os.path.exists` method
    os_driver.exists = usb_config.OSDriver.exists

    def mocked_get_serial_handle_path() -> str:
        return str(dummy_handle)

    monkeypatch.setattr(subject, "_get_handle_path", mocked_get_serial_handle_path)

    assert not subject.handle_exists()
    dummy_handle.write_text("existence")
    assert subject.handle_exists()

    def mocked_exists(path: str) -> bool:
        raise OSError("Fake Exception")

    # Use mocked method to test exception handling
    os_driver.exists = mocked_exists
    assert not subject.handle_exists()


def test_get_udc_folder(subject: usb_config.SerialGadget) -> None:
    # Calling uninitialized
    subject._udc_name = None
    with pytest.raises(Exception):
        subject.udc_folder()
    subject._udc_name = "fake_name"
    expected = usb_config.UDC_HANDLE_FOLDER + "fake_name"
    assert subject.udc_folder() == expected


def test_get_gadget_serial_number(tmpdir: Path) -> None:
    """Test that the gadget serial number is read."""
    serial = Path(tmpdir) / "serial"
    TEST_SERIAL = "fake_serial_number_123"
    serial.write_text(TEST_SERIAL)
    default_config.SERIAL_NUMBER_FILE = str(serial.absolute())

    assert default_config.get_gadget_config().serial_number == TEST_SERIAL

    # Make sure the default serial number is used if there's no serial file
    default_config.SERIAL_NUMBER_FILE = "/fake/path/that/does/not/exist.txt"

    assert (
        default_config.get_gadget_config().serial_number
        == default_config.DEFAULT_SERIAL
    )
