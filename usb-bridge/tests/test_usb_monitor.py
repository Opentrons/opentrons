"""Tests for the usb_monitor module."""

import pytest
import mock
from pathlib import Path
import os
import pyudev  # type: ignore[import-untyped]
from ot3usb import usb_monitor

TEST_PHY_NAME = "usbphy123"


@pytest.fixture
def udev_monitor() -> mock.Mock:
    monitor = mock.Mock(spec=pyudev.Monitor)
    return monitor


@pytest.fixture
def udc_folder(tmpdir: Path) -> str:
    with open(os.path.join(tmpdir, "state"), "w") as state:
        state.write("not connected")
    return str(tmpdir)


@pytest.fixture
def subject(
    udc_folder: str, udev_monitor: mock.Mock
) -> usb_monitor.USBConnectionMonitor:
    return usb_monitor.USBConnectionMonitor(
        phy_udev_name=TEST_PHY_NAME, udc_folder=udc_folder, monitor=udev_monitor
    )


def test_monitor_fileno(
    subject: usb_monitor.USBConnectionMonitor, udev_monitor: mock.Mock
) -> None:
    udev_monitor.fileno.return_value = 123
    assert subject.fileno() == 123


def test_monitor_host_connected(subject: usb_monitor.USBConnectionMonitor) -> None:
    subject._host_connected = True
    assert subject.host_connected()
    subject._host_connected = False
    assert not subject.host_connected()


def test_read_state(subject: usb_monitor.USBConnectionMonitor, udc_folder: str) -> None:
    statefile = os.path.join(udc_folder, "state")
    # First test with the UDC not initialized
    with open(statefile, "w") as state:
        state.write("not connected")
    subject.update_state()
    assert not subject.host_connected()
    # Now test with the UDC initialized
    with open(statefile, "w") as state:
        state.write("configured")
    subject.update_state()
    assert subject.host_connected()
    # Now test with the UDC file deleted - should not raise an exception
    os.remove(statefile)
    subject.update_state()
    assert not subject.host_connected()


def test_monitor_begin(
    subject: usb_monitor.USBConnectionMonitor, udev_monitor: mock.Mock
) -> None:
    udev_monitor.started = False
    subject.begin()
    udev_monitor.start.assert_called_once()
    assert not subject._host_connected

    udev_monitor.reset_mock()


def test_read_message(
    subject: usb_monitor.USBConnectionMonitor, udev_monitor: mock.Mock, udc_folder: str
) -> None:
    # Set up test with statefile showing no connection
    statefile = os.path.join(udc_folder, "state")

    # First test with the UDC not initialized
    with open(statefile, "w") as state:
        state.write("not connected")
    # Test getting no message - should fail silently
    udev_monitor.poll.return_value = None
    subject.read_message()
    udev_monitor.poll.assert_called_once()

    # Test getting a good message without matching name
    udev_monitor.reset_mock()
    subject._host_connected = True
    udev_monitor.poll.return_value = {usb_monitor.NAME_TAG: "name123"}
    subject.read_message()
    udev_monitor.poll.assert_called_once()
    assert subject._host_connected

    # Now test getting a good message WITH matching name. Subject should poll.
    udev_monitor.reset_mock()
    subject._host_connected = True
    udev_monitor.poll.return_value = {usb_monitor.NAME_TAG: TEST_PHY_NAME}
    subject.read_message()
    udev_monitor.poll.assert_called_once()
    assert not subject._host_connected

    # Finally, test with getting an event without the name tag. Should filter
    # out the message.
    udev_monitor.reset_mock()
    subject._host_connected = True
    udev_monitor.poll.return_value = {usb_monitor.NAME_TAG + "abcdef": TEST_PHY_NAME}
    subject.read_message()
    udev_monitor.poll.assert_called_once()
    assert subject._host_connected
