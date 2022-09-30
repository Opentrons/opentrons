"""Provides functionality to monitor for usb host connectivity.

When a usb serial gadget is configured, a tty handle is created by udev
immediately and it remains in the filesystem indefinitely. This makes it
impossible to distinguish the presence of a serial port directly; instead,
this module hooks into the udev message stream on the system to check for

"""
import pyudev  # type: ignore[import]
import logging

LOG = logging.getLogger(__name__)

# We only poll if select() indicated readiness, so timeout can be extremely
# short without danger.
POLL_TIMEOUT = 0.001

CHARGER_STATE_TAG = "USB_CHARGER_STATE"


class USBConnectionMonitor:
    """Class to monitor host connections over the USB Serial line."""

    def __init__(self, phy_udev_name: str, udc_name: str) -> None:
        """Initialize a USBConnectionMonitor.

        Args:
            phy_udev_name: The name of the USB PHY on the system,
            the name below 'platform' for monitoring udev

            udc_name: The name of the UDC hardware, for checking connection state manually
        """
        self._phy_udev_name = phy_udev_name
        self._udc_name = udc_name

        self._udev_ctx = pyudev.Context()

        self._monitor = pyudev.Monitor.from_netlink(self._udev_ctx)
        self._monitor.filter_by("platform")
        # For matching the name of the driver
        self._monitor.filter_by_tag("OF_NAME")
        # We only care about USB_CHARGER_STATE updates
        self._monitor.filter_by_tag(CHARGER_STATE_TAG)
        self._monitor.start()
        LOG.info(f"Monitoring platform/{phy_udev_name}")

        self._host_connected = False

    def fileno(self) -> int:
        """Returns a selectable fileno for the udev message stream."""
        return int(self._monitor.fileno())

    def begin(self) -> None:
        """Start monitoring the udev stream.

        If the monitoring hasn't been started yet, this function will also
        check the file `state` in the UDC system folder to determine if the
        device is initially connected to a host or not; this is necessary due
        to the fact that udev messages regarding connection are only sent when
        the state changes.
        """
        if not self._monitor.started():
            # Check the `state` file to get an initial state setting
            self._monitor.start()

    def host_connected(self) -> bool:
        """Return whether the most recent status indicates a host connection."""
        return self._host_connected

    def read_message(self) -> None:
        """Reads the next available udev message."""
        res = self._monitor.poll(POLL_TIMEOUT)
        if res:
            # Filter by the name tag
            if res.get("OF_NAME") == self._phy_udev_name:
                # Update internal status
                self._host_connected = (
                    res.get(CHARGER_STATE_TAG) != "USB_CHARGER_ABSENT"
                )

    def _read_state(self) -> bool:
        """TODO."""
        return False
