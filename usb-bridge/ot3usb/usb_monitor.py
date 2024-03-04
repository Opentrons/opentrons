"""Provides functionality to monitor for usb host connectivity.

When a usb serial gadget is configured, a tty handle is created by udev
immediately and it remains in the filesystem indefinitely. This makes it
impossible to distinguish the presence of a serial port directly; instead,
this module hooks into the udev message stream on the system to check for
messages pertaining to the connection status of the USB gadget.

Unfortunately, no UDEV messages directly contain the configuration status
of the USB gadget; however, when a new USB host connects to the PHY, there
is a series of UDEV messages. By filtering for these, it is possible for the
software to roughly monitor the connection status of the USB gadget by
polling a file `/sys/class/udc/<UDC name>/state`.

There are some caveats to this setup:
- The UDEV messages to not strictly correlate with the connection status.
Therefore, it's important to also periodically poll the connection if there
haven't been any new messages. This is possibly only an issue for messages
when a new host is connected.
- Serial ports will sometimes signal readiness with the POSIX Select after
they have been disconnected but before the UDEV messages start to appear.
In that case, it is important to check for an OSError on the port while
reading new data.

"""
import pyudev  # type: ignore[import-untyped]
import logging
import os

LOG = logging.getLogger(__name__)

# We only poll if select() indicated readiness, so timeout can be extremely
# short without danger.
POLL_TIMEOUT = 0.001

NAME_TAG = "OF_NAME"


class USBConnectionMonitor:
    """Class to monitor host connections over the USB Serial line."""

    def __init__(
        self, phy_udev_name: str, udc_folder: str, monitor: pyudev.Monitor
    ) -> None:
        """Initialize a USBConnectionMonitor.

        Args:
            phy_udev_name: The name of the USB PHY on the system, the name
            below 'platform' for monitoring udev

            udc_folder: The full path to the folder with the hardware info for
            the UDC

            monitor: A handle to a pyudev monitor to receive udev messages
        """
        self._phy_udev_name = phy_udev_name
        self._udc_folder = udc_folder
        self._monitor = monitor
        self._host_connected = False

    def fileno(self) -> int:
        """Returns a selectable fileno for the udev message stream."""
        fn = self._monitor.fileno()
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
            LOG.debug(f"Monitoring platform/{self._phy_udev_name}")
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

    def update_state(self) -> None:
        """Force a state update by polling."""
        self._host_connected = self._read_state()

    def _read_state(self) -> bool:
        fp = os.path.join(self._udc_folder, "state")
        try:
            with open(fp, mode="r") as statefile:
                state = statefile.read()
                LOG.debug(f"state={state}")
                return state.startswith("configured")
        except Exception:
            return False


class USBConnectionMonitorFactory:
    """Factory class to construct a USBConnectionMonitor."""

    @staticmethod
    def create(phy_udev_name: str, udc_folder: str) -> USBConnectionMonitor:
        """Factory function to create the USBConnectionMonitor."""
        context = pyudev.Context()
        monitor = pyudev.Monitor.from_netlink(context)
        monitor.filter_by(subsystem="platform")

        return USBConnectionMonitor(phy_udev_name, udc_folder, monitor)
