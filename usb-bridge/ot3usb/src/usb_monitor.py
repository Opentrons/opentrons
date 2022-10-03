"""Provides functionality to monitor for usb host connectivity.

When a usb serial gadget is configured, a tty handle is created by udev
immediately and it remains in the filesystem indefinitely. This makes it
impossible to distinguish the presence of a serial port directly; instead,
this module hooks into the udev message stream on the system to check for

"""
import pyudev  # type: ignore[import]
import logging
import os

LOG = logging.getLogger(__name__)

# We only poll if select() indicated readiness, so timeout can be extremely
# short without danger.
POLL_TIMEOUT = 0.001

NAME_TAG = "OF_NAME"


class USBConnectionMonitor:
    """Class to monitor host connections over the USB Serial line."""

    def __init__(self, phy_udev_name: str, udc_folder: str) -> None:
        """Initialize a USBConnectionMonitor.

        Args:
            phy_udev_name: The name of the USB PHY on the system, the name
            below 'platform' for monitoring udev

            udc_folder: The full path to the folder with the hardware info for
            the UDC
        """
        self._phy_udev_name = phy_udev_name
        self._udc_folder = udc_folder

        self._udev_ctx = pyudev.Context()

        self._monitor = pyudev.Monitor.from_netlink(self._udev_ctx)
        self._monitor.filter_by(subsystem="platform")

        self._host_connected = False

    def fileno(self) -> int:
        """Returns a selectable fileno for the udev message stream."""
        fn = self._monitor.fileno()
        LOG.debug(f"fileno={fn}")
        return int(fn)

    def begin(self) -> None:
        """Start monitoring the udev stream.

        If the monitoring hasn't been started yet, this function will also
        check the file `state` in the UDC system folder to determine if the
        device is initially connected to a host or not; this is necessary due
        to the fact that udev messages regarding connection are only sent when
        the state changes.
        """
        if not self._monitor.started:
            # Check the `state` file to get an initial state setting
            LOG.info(f"Monitoring platform/{self._phy_udev_name}")
            self._monitor.start()
            self._host_connected = self._read_state()

    def host_connected(self) -> bool:
        """Return whether the most recent status indicates a host connection."""
        return self._host_connected

    def read_message(self) -> None:
        """Reads the next available udev message."""
        res = self._monitor.poll(POLL_TIMEOUT)
        if res:
            if NAME_TAG not in res:
                return
            name = res.get(NAME_TAG)
            if name == self._phy_udev_name:
                self._host_connected = self._read_state()

    def _read_state(self) -> bool:
        fp = os.path.join(self._udc_folder, "state")
        try:
            state = open(fp, mode="r").read()
            LOG.debug(f"state={state}")
            return state.startswith("configured")
        except Exception:
            return False
