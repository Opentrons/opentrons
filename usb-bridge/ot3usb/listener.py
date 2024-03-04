"""Module to poll for input from all sources."""

import logging
import select
from typing import Optional, List, Any
import serial  # type: ignore[import-untyped]

from . import usb_config, usb_monitor, tcp_conn

from .default_config import DEFAULT_IP, DEFAULT_PORT
from .serial_thread import QUEUE_TYPE, QUEUE_MAX_ITEMS

LOG = logging.getLogger(__name__)

# 1 second polling for select()
POLL_TIMEOUT = 1.0


def update_ser_handle(
    config: usb_config.SerialGadget,
    ser: Optional[serial.Serial],
    connected: bool,
    tcp: tcp_conn.TCPConnection,
) -> Optional[serial.Serial]:
    """Updates the serial handle for connections and disconnections.

    Args:
        config: Serial gadget configuration

        ser: Handle for the serial port

        connected: Whether the monitor reports the serial handle as
        connected or not

        tcp: The TCP Connection handle, which will be connected/disconnected
        based on the serial port presence.
    """
    if ser and not connected:
        LOG.debug("USB host disconnected")
        ser = None
        tcp.disconnect()
    elif connected and not ser:
        LOG.debug("New USB host connected")
        ser = config.get_handle()
        tcp.connect(DEFAULT_IP, DEFAULT_PORT)
    return ser


def check_monitor(monitor: usb_monitor.USBConnectionMonitor, msg_ready: bool) -> None:
    """Order the monitor to update its status.

    If a message is ready then the update is performed based on the message,
    otherwise it is polled by the state file (for cases where the messages do
    not signal before configuration completes).
    """
    if msg_ready:
        monitor.read_message()
    else:
        # Force a poll
        monitor.update_state()


def listen(
    monitor: usb_monitor.USBConnectionMonitor,
    config: usb_config.SerialGadget,
    ser: Optional[serial.Serial],
    tcp: tcp_conn.TCPConnection,
    worker_queue: QUEUE_TYPE,
) -> Optional[serial.Serial]:
    """Process any available incoming data.

    This function will check for input from any of the input sources to the
    USB bridge:
        - The serial port, if it is available
        - The UDEV message stream (usb_monitor)
        - The TCP connection to the NGINX server, if a connection is open

    Args:
        monitor: The USB connection monitor

        config: Serial gadget configuration

        ser: Handle for the serial port

        tcp: Handle for the socket connection to the internal server

        worker_queue: Handle for queue to the serial worker thread
    """
    rlist: List[Any] = [monitor]
    if ser is not None:
        rlist.append(ser)
        rlist.append(tcp)

    ready = select.select(rlist, [], [], POLL_TIMEOUT)[0]
    if len(ready) == 0 or monitor in ready:
        # Read a new udev messages
        check_monitor(monitor, monitor in ready)
        ser = update_ser_handle(config, ser, monitor.host_connected(), tcp)
        # ALWAYS exit early if we had a change in udev messages
        return ser
    if ser and ser in ready:
        # Ready serial data
        try:
            data = ser.read_all()
            LOG.debug(f"Received: {data}")
            tcp.send(data)
        except OSError:
            LOG.debug("Got an OSError when disconnecting")
            monitor.update_state()
            ser = update_ser_handle(config, ser, monitor.host_connected(), tcp)
    if ser and tcp in ready:
        # Ready TCP data to echo to serial
        data = tcp.read()
        worker_queue.put((ser, data))
        if worker_queue.qsize() >= QUEUE_MAX_ITEMS:
            LOG.warning("Worker queue appears full")
    return ser
