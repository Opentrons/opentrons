import os, subprocess, serial, time
from opentrons_hardware.drivers.binary_usb import SerialUsbDriver

from typing import AsyncGenerator, Type
import pytest
import asyncio
from opentrons_hardware.firmware_bindings import utils
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
	BinaryMessageDefinition,
	DeviceInfoRequest,
	Ack
)

from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId

# this script lets you emulate a serial device
# the client program should use the serial port file specifed by client_port

# if the port is a location that the user can't access (ex: /dev/ttyUSB0 often),
# sudo is required

class SerialEmulator(object):
	def __init__(self, device_port='./ttydevice', client_port='./ttyclient'):
		self.device_port = device_port
		self.client_port = client_port
		cmd=['/usr/bin/socat','-d','-d','PTY,link=%s,raw,echo=0' %
		self.device_port, 'PTY,link=%s,raw,echo=0' % self.client_port]
		self.proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		time.sleep(1)
		self.serial = serial.Serial(self.device_port, 9600, rtscts=True, dsrdtr=True)
		self.err = ''
		self.out = ''

	def write(self, out):
		return self.serial.write(out)

	def read(self):
		line = bytes('','utf-8')
		while self.serial.inWaiting() > 0:
			line += self.serial.read(1)
		return line

	def __del__(self):
		self.stop()

	def stop(self):
		self.proc.kill()
		self.out, self.err = self.proc.communicate()
		try:
			os.remove(self.device_port)
			os.remove(self.client_port)
		except:
			pass

@pytest.fixture
def test_port_host() -> SerialEmulator:
	return SerialEmulator()

@pytest.fixture
def test_port_client(test_port_host: SerialEmulator) -> serial.Serial:
	return  serial.Serial(test_port_host.client_port, 9600, rtscts=True, dsrdtr=True)

@pytest.fixture
async def subject(test_port_client: serial.Serial, test_port_host: SerialEmulator) -> AsyncGenerator[SerialUsbDriver, None]:
	"""The binary driver under test."""
	driver = SerialUsbDriver(asyncio.get_running_loop())
	driver.connect("Emulation port", test_port_client)
	yield driver
	driver.__exit__()
	test_port_host.stop()
	
async def test_send(subject: SerialUsbDriver, test_port_host: SerialEmulator) -> None:
	m = Ack()
	length = await subject.write(m)
	assert length == 4
	
	recieved = test_port_host.read()
	
	assert recieved == b'\x00\x01\x00\x00'
	
async def test_recv(subject: SerialUsbDriver, test_port_host: SerialEmulator) -> None:
	length = test_port_host.write(b'\x00\x01\x00\x00')
	assert length == 4
	message = await subject.read()
	print(message)
	assert type(message) == Ack
	
	assert message == Ack()
