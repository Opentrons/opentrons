"""Tests for the main file for ot3usb."""

import pytest
import mock

import select
import serial  # type: ignore[import-untyped]
from queue import Queue

from ot3usb import usb_config, tcp_conn, usb_monitor, listener
from ot3usb.serial_thread import QUEUE_TYPE

FAKE_HANDLE = "Handle Placeholder"


def config_mock() -> mock.MagicMock:
    return mock.MagicMock(usb_config.SerialGadget)


def tcp_mock() -> mock.MagicMock:
    return mock.MagicMock(tcp_conn.TCPConnection)


def monitor_mock() -> mock.MagicMock:
    return mock.MagicMock(usb_monitor.USBConnectionMonitor)


def serial_mock() -> mock.MagicMock:
    return mock.MagicMock(serial.Serial)


@pytest.fixture
def worker_queue() -> QUEUE_TYPE:
    return Queue(0)


def test_update_ser_handle() -> None:
    config = config_mock()
    tcp = tcp_mock()
    config.get_handle.return_value = FAKE_HANDLE
    # No serial and not connection
    assert not listener.update_ser_handle(config, None, False, tcp)
    tcp.disconnect.assert_not_called()
    tcp.connect.assert_not_called()

    # Serial but no connection
    tcp.reset_mock()
    assert not listener.update_ser_handle(config, FAKE_HANDLE, False, tcp)
    tcp.disconnect.assert_called_once()
    tcp.connect.assert_not_called()

    # No serial but yes connection
    tcp.reset_mock()
    assert listener.update_ser_handle(config, None, True, tcp) == FAKE_HANDLE
    tcp.disconnect.assert_not_called()
    tcp.connect.assert_called_once()

    # Serial and yes connection
    tcp.reset_mock()
    assert listener.update_ser_handle(config, FAKE_HANDLE, True, tcp) == FAKE_HANDLE
    tcp.disconnect.assert_not_called()
    tcp.connect.assert_not_called()


def test_check_monitor() -> None:
    monitor = monitor_mock()

    listener.check_monitor(monitor, True)
    monitor.read_message.assert_called_once()
    monitor.update_state.assert_not_called()

    monitor.reset_mock()

    listener.check_monitor(monitor, False)
    monitor.read_message.assert_not_called()
    monitor.update_state.assert_called_once()


TIMEOUT = listener.POLL_TIMEOUT

SER_DATA = b"abcd"
TCP_DATA = b"efgh"


def test_listen(monkeypatch: pytest.MonkeyPatch, worker_queue: QUEUE_TYPE) -> None:
    monitor = monitor_mock()
    config = config_mock()
    tcp = tcp_mock()
    ser = serial_mock()

    ser.read_all.return_value = SER_DATA
    ser.write.return_value = len(TCP_DATA)
    tcp.read.return_value = TCP_DATA

    tcp.connected.return_value = False

    select_mock = mock.MagicMock(select.select)
    monkeypatch.setattr("select.select", select_mock)

    # FIRST TESTS - NO SERIAL OPEN
    select_mock.return_value = ([], None, None)

    # No message ready, monitor disconnected
    monitor.host_connected.return_value = False
    assert listener.listen(monitor, config, None, tcp, worker_queue) is None
    monitor.update_state.assert_called_once()
    select_mock.assert_called_with([monitor], [], [], TIMEOUT)
    select_mock.reset_mock()
    monitor.reset_mock()

    # Monitor has a message and is connected
    monitor.host_connected.return_value = True
    select_mock.return_value = ([monitor], None, None)
    assert listener.listen(monitor, config, None, tcp, worker_queue) is not None
    # Monitor should be manually updated
    monitor.update_state.assert_not_called()
    select_mock.assert_called_with([monitor], [], [], TIMEOUT)
    select_mock.reset_mock()
    monitor.reset_mock()

    # NEXT TESTS - SERIAL IS OPEN

    # Nothing ready to read
    select_mock.return_value = ([], None, None)
    tcp.connected.return_value = True
    monitor.host_connected.return_value = True
    assert listener.listen(monitor, config, ser, tcp, worker_queue) == ser
    select_mock.assert_called_with([monitor, ser, tcp], [], [], TIMEOUT)
    select_mock.reset_mock()
    monitor.reset_mock()

    # Serial and TCP ready to read
    select_mock.return_value = ([ser, tcp], None, None)
    tcp.connected.return_value = True
    monitor.host_connected.return_value = True
    assert listener.listen(monitor, config, ser, tcp, worker_queue) == ser
    select_mock.assert_called_with([monitor, ser, tcp], [], [], TIMEOUT)
    ser.read_all.assert_called_once()
    tcp.send.assert_called_with(SER_DATA)
    tcp.read.assert_called_once()
    assert not worker_queue.empty()
    assert worker_queue.get() == (ser, TCP_DATA)

    ser.reset_mock()
    select_mock.reset_mock()
    monitor.reset_mock()

    # Check for handling when the serial line disconnecs
