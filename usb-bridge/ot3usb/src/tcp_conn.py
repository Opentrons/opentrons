"""Provides an interface to open & close the TCP interface on."""
import socket
import logging
from typing import Optional

LOG = logging.getLogger(__name__)

MAX_BUF = 4096


class TCPConnection:
    """Class to connect to the internal NGINX server TCP socket."""

    def __init__(self) -> None:
        """Create a new TCPConnection, not connected to any socket yet."""
        self._sock: Optional[socket.socket] = None

    def connect(self, ip: str, port: int) -> bool:
        """Open the connection.

        This will replace the old connection, if it exists.

        Args:
            ip: The IP address to connect to

            port: The port on the ip to connect to
        """
        self.disconnect()
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            self._sock.connect((ip, port))
        except Exception as err:
            LOG.error(f'Could not open TCP: {str(err)}')
            self._sock = None
            return False
        LOG.debug(f"Opened socket to {ip}:{port}")
        return True

    def disconnect(self) -> None:
        """If a connection exists, disconnect it."""
        if self._sock is not None:
            self._sock.shutdown(socket.SHUT_RDWR)
            self._sock.close()
            self._sock = None
            LOG.debug("Shut down socket")

    def connected(self) -> bool:
        """Check if the connection is active."""
        return self.fileno() != -1

    def fileno(self) -> int:
        """Get the selectable file number for the socket.

        Returns -1 if the connection is closed.
        """
        if not self._sock:
            return -1
        return self._sock.fileno()

    def read(self) -> bytes:
        """Read available data over the socket."""
        if not self._sock:
            return bytes()
        ret = self._sock.recv(MAX_BUF)
        if len(ret) == 0:
            # The socket connection died!
            self._sock = None
        LOG.debug(f"Received [{len(ret)}] bytes")
        return ret

    def send(self, data: bytes) -> bool:
        """Send some data over the socket.

        Args:
            data: raw data array to send over the socket.
        """
        if not self._sock:
            return False
        sent = self._sock.send(data)
        LOG.debug(f"Sent [{sent}] bytes")
        return sent == len(data)
