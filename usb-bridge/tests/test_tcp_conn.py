"""Tests for the TCP Connection class."""

import pytest
import mock
import socket
from typing import cast

from ot3usb import default_config
from ot3usb.tcp_conn import TCPConnection

IP = default_config.DEFAULT_IP
PORT = default_config.DEFAULT_PORT
TEST_FD = 123
RECV_RET = b"abcd"
SEND_DATA = b"abcdefghijklmnop"


@pytest.fixture
def socket_driver() -> mock.Mock:
    driver = mock.Mock(spec=socket.socket)
    driver.fileno.return_value = TEST_FD
    return driver


@pytest.fixture
def subject_disconnected() -> TCPConnection:
    """Create a TCPConnection that appears disconnected."""
    return TCPConnection()


@pytest.fixture
def subject_connected(socket_driver: mock.Mock) -> TCPConnection:
    """Create a TCPConnection that appears connected with a mock socket."""
    subject = TCPConnection()
    subject._sock = socket_driver
    return subject


def test_tcp_fileno_and_connected(
    subject_disconnected: TCPConnection, subject_connected: TCPConnection
) -> None:
    assert subject_connected.fileno() == TEST_FD
    assert subject_disconnected.fileno() == -1
    assert subject_connected.connected()
    assert not subject_disconnected.connected()


def test_connect(
    subject_disconnected: TCPConnection, monkeypatch: pytest.MonkeyPatch
) -> None:
    subject = subject_disconnected
    # Set up a patch on the entire socket class
    monkeypatch.setattr("socket.socket", mock.MagicMock(socket.socket))

    # When disconnected, should not be able to read
    assert subject.read() == b""

    # Reconnection should not work now
    subject._reconnect()
    assert not subject.connected()

    # Dry run connection
    assert subject.connect(IP, PORT)
    assert subject.connected()

    # Make sure disconnection clears out the port
    subject.disconnect()
    assert not subject.connected()

    # Reconnection should work now
    subject._reconnect()
    assert subject.connected()

    # Now test error case
    mock_sock = cast(mock.MagicMock, socket.socket)
    mock_sock.side_effect = Exception("Error!")
    monkeypatch.setattr("socket.socket", mock_sock)

    assert not subject.connect(IP, PORT)


def test_read(
    subject_connected: TCPConnection,
    socket_driver: mock.Mock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    subject = subject_connected
    socket_driver.recv.return_value = RECV_RET
    # Set up a patch on the reconnect function
    reconnect_mock = mock.MagicMock(TCPConnection._reconnect)
    monkeypatch.setattr(subject, "_reconnect", reconnect_mock)

    # Make sure that reading returns the data
    data = subject.read()
    socket_driver.recv.assert_called_once()
    assert data == RECV_RET

    # Check error case
    socket_driver.reset_mock()
    socket_driver.recv.return_value = b""
    data = subject.read()
    assert data == b""
    reconnect_mock.assert_called_once()


def test_send(subject_connected: TCPConnection, socket_driver: mock.Mock) -> None:
    subject = subject_connected
    socket_driver.send.return_value = len(SEND_DATA)

    assert subject.send(SEND_DATA)

    socket_driver.send.return_value = len(SEND_DATA) - 1
    assert not subject.send(SEND_DATA)


def test_send_fail(
    subject_disconnected: TCPConnection, socket_driver: mock.Mock
) -> None:
    assert not subject_disconnected.send(SEND_DATA)

    socket_driver.send.assert_not_called()
