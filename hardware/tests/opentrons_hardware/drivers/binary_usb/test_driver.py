"""USB Driver tests."""
import os
import subprocess
import serial  # type: ignore[import]
import time
from opentrons_hardware.drivers.binary_usb import SerialUsbDriver

from typing import AsyncGenerator
import pytest
import asyncio
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import Ack

# this script lets you emulate a serial device
# the client program should use the serial port file specifed by client_port

# if the port is a location that the user can't access (ex: /dev/ttyUSB0 often),
# sudo is required


class SerialEmulator(object):
    """Test fixture for emulating serial connections."""

    def __init__(
        self, device_port: str = "./ttydevice", client_port: str = "./ttyclient"
    ) -> None:
        """Open some serial ports to simulate the usb connection."""
        self.device_port = device_port
        self.client_port = client_port
        cmd = [
            "/usr/bin/socat",
            "-d",
            "-d",
            "PTY,link=%s,raw,echo=0" % self.device_port,
            "PTY,link=%s,raw,echo=0" % self.client_port,
        ]
        self.proc = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        time.sleep(1)
        self.serial = serial.Serial(self.device_port, 9600, rtscts=True, dsrdtr=True)
        self.err = ""
        self.out = ""

    def write(self, out: bytes) -> int:
        """Write some bytes to the serial port."""
        return int(self.serial.write(out))

    def read(self) -> bytes:
        """Read some bytes from the serial port."""
        line = bytes("", "utf-8")
        while self.serial.inWaiting() > 0:
            line += self.serial.read(1)
        return line

    def __del__(self) -> None:
        self.stop()

    def stop(self) -> None:
        """Disconnect and remove the serial ports."""
        self.proc.kill()
        self.proc.communicate()
        try:
            os.remove(self.device_port)
            os.remove(self.client_port)
        finally:
            pass


@pytest.fixture
def test_port_host() -> SerialEmulator:
    """Fixture for the serial emulator."""
    return SerialEmulator()


@pytest.fixture
def test_port_client(test_port_host: SerialEmulator) -> serial.Serial:
    """Fixture for the serial port that will get passed to the driver."""
    return serial.Serial(test_port_host.client_port, 9600, rtscts=True, dsrdtr=True)


@pytest.fixture
async def subject(
    test_port_client: serial.Serial, test_port_host: SerialEmulator
) -> AsyncGenerator[SerialUsbDriver, None]:
    """The binary driver under test."""
    driver = SerialUsbDriver(asyncio.get_running_loop())
    driver.connect("Emulation port", test_port_client)
    yield driver
    driver.__exit__()
    test_port_host.stop()


async def test_send(subject: SerialUsbDriver, test_port_host: SerialEmulator) -> None:
    """Test sending data with the usb driver."""
    m = Ack()
    length = await subject.write(m)
    assert length == 4

    recieved = test_port_host.read()

    assert recieved == b"\x00\x01\x00\x00"


async def test_recv(subject: SerialUsbDriver, test_port_host: SerialEmulator) -> None:
    """Test receiving and parsing data from the USB driver."""
    length = test_port_host.write(b"\x00\x01\x00\x00")
    assert length == 4
    message = await subject.read()
    print(message)
    assert type(message) == Ack

    assert message == Ack()
